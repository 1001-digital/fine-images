/**
 * Root barrel. Keep this tiny — runtime entry points all live at subpaths
 * (`@1001-digital/fine-images/services/main`, `/models/image_cache`, etc.)
 * so consumers don't pay for the whole module graph just to get a type.
 */
export { defineConfig } from './src/define_config.js'
export type {
  FineImagesConfig,
  ImageSize,
  ResizedImage,
  DefaultImageType,
  FineImageRow,
} from './src/types.js'
export { ALL_SIZES, IMAGE_WIDTHS, DEFAULT_TYPE_PREFIXES } from './src/types.js'
export type { FineImagesServiceDeps } from './src/fine_images_service.js'
