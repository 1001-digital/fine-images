import type { FineImagesConfig } from './types.js'

/**
 * Thin identity helper so consumers get type-checked config in their
 * `config/fine_images.ts` without importing the type directly.
 */
export function defineConfig(config: FineImagesConfig): FineImagesConfig {
  return config
}
