import type { DriveDisks } from '@adonisjs/drive/types'

export type ImageSize = 'xs' | 'sm' | 'md' | 'lg'

export const IMAGE_WIDTHS: Record<ImageSize, number> = {
  xs: 150,
  sm: 400,
  md: 800,
  lg: 1200,
}

export const ALL_SIZES: ImageSize[] = ['xs', 'sm', 'md', 'lg']

/**
 * Built-in image types. Consumers can pass any string — these are the
 * conventions we ship preset key prefixes for.
 */
export const DEFAULT_TYPE_PREFIXES = {
  avatar: 'avatars',
} as const

export type DefaultImageType = keyof typeof DEFAULT_TYPE_PREFIXES

export interface FineImagesConfig {
  /**
   * Name of the Drive disk to use for storage. Defaults to the app's default
   * disk when omitted.
   */
  disk?: keyof DriveDisks

  /**
   * Map from logical image type to the key prefix used inside the disk. Merged
   * on top of {@link DEFAULT_TYPE_PREFIXES}, so consumers only need to list
   * additional types they care about.
   *
   * Example: `{ collection: 'collections' }` to add a new type.
   */
  typePrefixes?: Record<string, string>

  /**
   * CDN origin used to build file URLs passed to Cloudflare's purge API.
   * When unset, CDN purge is disabled.
   */
  cdnUrl?: string

  /**
   * Cloudflare zone + API token for CDN purge. Both must be set for purge to
   * run; otherwise purge is a no-op.
   */
  cloudflare?: {
    zoneId?: string
    apiToken?: string
  }
}

export interface ResizedImage {
  size: ImageSize
  buffer: Buffer
}

/**
 * Row shape stored in `image_caches`. Keyed on `(scope, type)`; `versions`
 * is a jsonb map `{ xs: true, sm: true, md: false, lg: false }`.
 */
export interface FineImageRow {
  scope: string
  type: string
  versions: Record<string, boolean>
}
