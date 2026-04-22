/**
 * Root barrel. Keep this tiny — runtime entry points all live at subpaths
 * (`@1001-digital/fine-images/services/main`, `/models/image_cache`, etc.)
 * so consumers don't pay for the whole module graph just to get a type.
 *
 * The `configure` + `stubsRoot` re-exports are picked up by `node ace
 * configure @1001-digital/fine-images` — Adonis looks them up as named
 * exports on the package's main entry.
 */
export { configure } from './configure.js'
export { stubsRoot } from './stubs/main.js'
export { defineConfig } from './src/define_config.js'
export type {
  FineImagesConfig,
  ImageSize,
  ResizedImage,
  DefaultImageScope,
  FineImageRow,
} from './src/types.js'
export { ALL_SIZES, IMAGE_WIDTHS, DEFAULT_SCOPE_PREFIXES } from './src/types.js'
export type { FineImagesServiceDeps } from './src/fine_images_service.js'
