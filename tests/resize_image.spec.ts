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

test.group('resizeImage', () => {
  test('emits every size strictly smaller than the source', async ({ assert }) => {
    const source = await pngOfWidth(1000)
    const results = await resizeImage(source)

    const sizes = results.map((r) => r.size).sort()
    assert.deepEqual(sizes, ['md', 'sm', 'xs'])

    for (const r of results) {
      const w = await widthOf(r.buffer)
      assert.equal(w, IMAGE_WIDTHS[r.size])
    }
  })

  test('skips sizes >= source width', async ({ assert }) => {
    // Source is 500px: xs (150) and sm (400) qualify, md (800) does not.
    const source = await pngOfWidth(500)
    const results = await resizeImage(source)

    const sizes = results.map((r) => r.size).sort()
    assert.deepEqual(sizes, ['sm', 'xs'])
  })

  test('falls back to xs when source is smaller than every target', async ({ assert }) => {
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

  test('rasterises svg and emits sizes below the rasterised width', async ({ assert }) => {
    // Tiny intrinsic SVG — resizer raises density so the rasterised width hits
    // the largest target (md=800). Strict > means md itself is skipped; sm + xs
    // still emit.
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
         <rect width="50" height="50" fill="red"/>
       </svg>`
    )

    const results = await resizeImage(svg)
    const sizes = results.map((r) => r.size).sort()
    assert.includeMembers(sizes, ['sm', 'xs'])
    const sm = results.find((r) => r.size === 'sm')!
    assert.equal(await widthOf(sm.buffer), IMAGE_WIDTHS.sm as number)
  })

  test('preserves the ImageSize type contract', async ({ assert }) => {
    const source = await pngOfWidth(1000)
    const results = await resizeImage(source)
    const allowed: ImageSize[] = ['xs', 'sm', 'md']
    for (const r of results) {
      assert.include(allowed, r.size)
    }
  })
})
