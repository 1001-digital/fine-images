import { test } from '@japa/runner'
import sharp from 'sharp'
import { resizeImage } from '../services/image_resizer.js'
import { IMAGE_WIDTHS, type ImageSize } from '../src/types.js'

async function pngOfWidth(width: number, height = 100): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 128, g: 64, b: 200 },
    },
  })
    .png()
    .toBuffer()
}

async function widthOf(buf: Buffer): Promise<number> {
  const meta = await sharp(buf).metadata()
  return meta.width ?? 0
}

async function jpegWithOrientation(
  storedWidth: number,
  storedHeight: number,
  orientation: number,
): Promise<Buffer> {
  return sharp({
    create: {
      width: storedWidth,
      height: storedHeight,
      channels: 3,
      background: { r: 128, g: 64, b: 200 },
    },
  })
    .withMetadata({ orientation })
    .jpeg()
    .toBuffer()
}

test.group('resizeImage', () => {
  test('emits every size strictly smaller than the source', async ({
    assert,
  }) => {
    const source = await pngOfWidth(1400)
    const results = await resizeImage(source)

    const sizes = results.map((r) => r.size).sort()
    assert.deepEqual(sizes, ['lg', 'md', 'sm', 'xs'])

    for (const r of results) {
      const w = await widthOf(r.buffer)
      assert.equal(w, IMAGE_WIDTHS[r.size])
    }
  })

  test('skips sizes >= source width', async ({ assert }) => {
    // Source is 500px: xs (150) and sm (400) qualify, md (800) and lg (1200) do not.
    const source = await pngOfWidth(500)
    const results = await resizeImage(source)

    const sizes = results.map((r) => r.size).sort()
    assert.deepEqual(sizes, ['sm', 'xs'])
  })

  test('falls back to xs when source is smaller than every target', async ({
    assert,
  }) => {
    const source = await pngOfWidth(100)
    const results = await resizeImage(source)

    assert.lengthOf(results, 1)
    assert.equal(results[0].size, 'xs')
    // Fallback keeps the source width (no upscale) but re-encodes to webp.
    const w = await widthOf(results[0].buffer)
    assert.equal(w, 100)
  })

  test('output is webp regardless of input format', async ({ assert }) => {
    const source = await pngOfWidth(1000)
    const results = await resizeImage(source)

    for (const r of results) {
      const meta = await sharp(r.buffer).metadata()
      assert.equal(meta.format, 'webp')
    }
  })

  test('encodes lossless webp when requested', async ({ assert }) => {
    const source = await pngOfWidth(100)
    const [result] = await resizeImage(source, { lossless: true })

    assert.equal(result.buffer.toString('ascii', 12, 16), 'VP8L')
  })

  test('accepts a bounded input pixel limit', async ({ assert }) => {
    const source = await pngOfWidth(100, 100)

    await assert.rejects(
      () => resizeImage(source, { limitInputPixels: 9_999 }),
      /Input image exceeds pixel limit/,
    )

    const [result] = await resizeImage(source, {
      limitInputPixels: 10_000,
    })
    assert.equal(await widthOf(result.buffer), 100)
  })

  test('does not allow callers to remove the input pixel limit', async ({
    assert,
  }) => {
    const source = await pngOfWidth(100, 100)

    await assert.rejects(
      () => resizeImage(source, { limitInputPixels: 0 }),
      /limitInputPixels must be a positive safe integer/,
    )
  })

  test('rasterises svg and emits sizes below the rasterised width', async ({
    assert,
  }) => {
    // Tiny intrinsic SVG — resizer raises density so the rasterised width hits
    // the largest target (lg=1200). Strict > means lg itself is skipped; md,
    // sm, and xs
    // still emit.
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
         <rect width="50" height="50" fill="red"/>
       </svg>`,
    )

    const results = await resizeImage(svg)
    const sizes = results.map((r) => r.size).sort()
    assert.includeMembers(sizes, ['md', 'sm', 'xs'])
    const sm = results.find((r) => r.size === 'sm')!
    assert.equal(await widthOf(sm.buffer), IMAGE_WIDTHS.sm as number)
  })

  test('auto-orients rasters carrying an EXIF orientation tag', async ({
    assert,
  }) => {
    // Stored landscape 1400x700 tagged orientation=6 (rotate 90° CW to display),
    // i.e. displayed portrait 700x1400 — the camera-JPEG case that came out sideways.
    const source = await jpegWithOrientation(1400, 700, 6)
    const results = await resizeImage(source)

    // Size gating uses the *displayed* width (700): only xs (150) and sm (400) qualify.
    const sizes = results.map((r) => r.size).sort()
    assert.deepEqual(sizes, ['sm', 'xs'])

    for (const r of results) {
      const meta = await sharp(r.buffer).metadata()
      // Upright portrait, not the sideways stored pixels...
      assert.isAbove(meta.height ?? 0, meta.width ?? 0)
      // ...and no residual orientation tag to double-rotate downstream.
      assert.isUndefined(meta.orientation)
    }

    const sm = results.find((r) => r.size === 'sm')!
    assert.equal(await widthOf(sm.buffer), IMAGE_WIDTHS.sm as number)
  })

  test('preserves the ImageSize type contract', async ({ assert }) => {
    const source = await pngOfWidth(1400)
    const results = await resizeImage(source)
    const allowed: ImageSize[] = ['xs', 'sm', 'md', 'lg']
    for (const r of results) {
      assert.include(allowed, r.size)
    }
  })
})
