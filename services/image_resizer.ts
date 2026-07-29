import sharp from 'sharp'
import {
  ALL_SIZES,
  IMAGE_WIDTHS,
  type ImageSize,
  type ResizedImage,
} from '../src/types.js'

export { ALL_SIZES, IMAGE_WIDTHS }
export type { ImageSize, ResizedImage }

export interface ResizeImageOptions {
  /**
   * Encode WebP variants losslessly. Useful for rendered SVGs and other
   * graphics where lossy chroma subsampling visibly softens hard edges.
   */
  lossless?: boolean
}

const MAX_OUTPUT_WIDTH = Math.max(...Object.values(IMAGE_WIDTHS))
const DEFAULT_SVG_DPI = 72
const DEFAULT_SVG_INTRINSIC_WIDTH = 200
const MAX_RASTER_PIXELS = 4096 * 4096

/**
 * Resize an image buffer into multiple webp versions. Only generates versions
 * where the source is larger than the target width. Always generates at least
 * `xs` so callers have something to display even for tiny sources.
 *
 * SVGs are rasterised at a density that produces our largest configured
 * width, capped at {@link MAX_RASTER_PIXELS} so a pathological viewBox
 * doesn't blow up memory.
 *
 * `.rotate()` (no args) auto-orients rasters from their EXIF orientation tag
 * and drops the tag from the output. Without it, Sharp writes the stored
 * pixels verbatim and strips the tag, so a camera JPEG carrying an
 * `Orientation` of 6/8 comes out sideways. It is a no-op for inputs with no
 * orientation metadata (SVGs, generated images).
 */
export async function resizeImage(
  input: Buffer | Uint8Array,
  options: ResizeImageOptions = {},
): Promise<ResizedImage[]> {
  let image = sharp(input).rotate()
  let metadata = await image.metadata()

  if (
    metadata.format === 'svg' &&
    (!metadata.width || metadata.width < MAX_OUTPUT_WIDTH)
  ) {
    const w = metadata.width || DEFAULT_SVG_INTRINSIC_WIDTH
    const h = metadata.height || w
    const baseDpi = metadata.density || DEFAULT_SVG_DPI

    let density = Math.ceil((MAX_OUTPUT_WIDTH / w) * baseDpi)

    // Cap density so total rasterised pixels stay within budget
    const scale = density / baseDpi
    if (w * scale * h * scale > MAX_RASTER_PIXELS) {
      density = Math.floor(Math.sqrt(MAX_RASTER_PIXELS / (w * h)) * baseDpi)
    }

    image = sharp(input, { density }).rotate()
    metadata = await image.metadata()
  }

  // `metadata()` reports the stored (pre-rotation) dimensions, so for images
  // the EXIF orientation turns on its side (orientation >= 5) the displayed
  // width is the stored height. Gate size generation on the displayed width.
  const rotated = (metadata.orientation ?? 1) >= 5
  const sourceWidth = (rotated ? metadata.height : metadata.width) || 0
  const webpOptions = options.lossless ? { lossless: true } : {}
  const results: ResizedImage[] = []

  for (const [size, width] of Object.entries(IMAGE_WIDTHS) as [
    ImageSize,
    number,
  ][]) {
    if (sourceWidth > width) {
      results.push({
        size,
        buffer: await image
          .clone()
          .resize({ width })
          .webp(webpOptions)
          .toBuffer(),
      })
    }
  }

  if (results.length === 0) {
    results.push({
      size: 'xs',
      buffer: await image.clone().webp(webpOptions).toBuffer(),
    })
  }

  return results
}
