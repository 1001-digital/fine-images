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
 * Built-in image scopes. Consumers can pass any string — these are the
 * conventions we ship preset key prefixes for.
 */
export const DEFAULT_SCOPE_PREFIXES = {
  avatar: 'avatars',
} as const

export type DefaultImageScope = keyof typeof DEFAULT_SCOPE_PREFIXES

export interface FineImagesConfig {
  /**
   * Name of the Drive disk to use for storage. Defaults to the app's default
   * disk when omitted.
   */
  disk?: keyof DriveDisks

  /**
   * Map from logical image scope to the key prefix used inside the disk. Merged
   * on top of {@link DEFAULT_SCOPE_PREFIXES}, so consumers only need to list
   * additional scopes they care about.
   *
   * Example: `{ collection: 'collections' }` to add a new scope.
   */
  scopePrefixes?: Record<string, string>

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
 * Row shape stored in `image_caches`. Keyed on `(key, scope)`; `versions`
 * is a jsonb map `{ xs: true, sm: true, md: false, lg: false }`.
 */
export interface FineImageRow {
  key: string
  scope: string
  versions: Record<string, boolean>
}
