import type { DriveService } from '@adonisjs/drive/types'
import ImageCache from './models/image_cache.js'
import {
  resizeImage,
  ALL_SIZES,
  type ImageSize,
} from '../services/image_resizer.js'
import {
  DEFAULT_TYPE_PREFIXES,
  type FineImagesConfig,
  type FineImageRow,
} from './types.js'

type Disk = ReturnType<DriveService['use']>

function versionKey(baseKey: string, size: ImageSize) {
  return `${baseKey}_${size}.webp`
}

function bestAvailableSize(
  preferred: ImageSize,
  versions: Record<string, boolean> | undefined,
): ImageSize {
  if (versions?.[preferred]) return preferred
  return (ALL_SIZES.find((s) => versions?.[s]) ?? 'xs') as ImageSize
}

export interface FineImagesServiceDeps {
  disk: Disk
  config: FineImagesConfig
}

/**
 * Store + retrieve resized image variants on any Drive disk. Written to be
 * injectable: takes a Disk + config at construction, no module-level imports
 * of `drive/services/main` or `env/services/main` — the provider wires those
 * in. That keeps the class trivially unit-testable.
 */
export class FineImagesService {
  readonly #disk: Disk
  readonly #config: FineImagesConfig
  readonly #prefixes: Record<string, string>

  constructor(deps: FineImagesServiceDeps) {
    this.#disk = deps.disk
    this.#config = deps.config
    this.#prefixes = {
      ...DEFAULT_TYPE_PREFIXES,
      ...(deps.config.typePrefixes ?? {}),
    }
  }

  /**
   * Resize `content` into all variants smaller than the source, write each to
   * the disk at `<typePrefix>/<cid>_<size>.webp`, upsert the tracking row,
   * and fire-and-forget a CDN purge. Returns the base key so callers can
   * construct URLs offline if they like.
   */
  async put(
    type: string,
    cid: string,
    content: Buffer | Uint8Array,
  ): Promise<string> {
    const baseKey = this.#baseKey(type, cid)
    const resized = await resizeImage(content)

    await Promise.all(
      resized.map((img) =>
        this.#disk.put(versionKey(baseKey, img.size), img.buffer, {
          contentType: 'image/webp',
        }),
      ),
    )

    const versions: Record<string, boolean> = {}
    for (const img of resized) versions[img.size] = true

    await ImageCache.updateOrCreate({ cid, type }, { cid, type, versions })

    this.#purgeCache(baseKey)
    return baseKey
  }

  async getUrl(
    type: string,
    cid: string,
    size: ImageSize = 'sm',
  ): Promise<string | undefined> {
    const row = await ImageCache.query().where({ cid, type }).first()
    if (!row) return undefined
    const baseKey = this.#baseKey(type, cid)
    return this.#disk.getUrl(
      versionKey(baseKey, bestAvailableSize(size, row.versions)),
    )
  }

  /**
   * For a given `cid`, fetch URLs for its `avatar` + `header` rows (if any)
   * in one query. Convenience for profile pages where you want both in one
   * shot. Consumers with more types can query directly.
   */
  async getImageUrls(
    cid: string,
  ): Promise<{ avatar?: string; header?: string }> {
    const rows = await ImageCache.query().where('cid', cid)
    const out: { avatar?: string; header?: string } = {}

    const entries = rows
      .filter(
        (row): row is ImageCache & { type: 'avatar' | 'header' } =>
          row.type === 'avatar' || row.type === 'header',
      )
      .map((row) => {
        const baseKey = this.#baseKey(row.type, cid)
        const preferred: ImageSize = row.type === 'avatar' ? 'sm' : 'md'
        return {
          type: row.type,
          url: this.#disk.getUrl(
            versionKey(baseKey, bestAvailableSize(preferred, row.versions)),
          ),
        }
      })

    const resolved = await Promise.all(entries.map((e) => e.url))
    entries.forEach((e, i) => {
      out[e.type] = resolved[i]
    })
    return out
  }

  async batchGetAvatarUrls(cids: string[]): Promise<Record<string, string>> {
    if (!cids.length) return {}

    const rows = await ImageCache.query()
      .whereIn('cid', cids)
      .where('type', 'avatar')
    const entries = rows.map((row) => {
      const baseKey = this.#baseKey('avatar', row.cid)
      return {
        cid: row.cid,
        url: this.#disk.getUrl(
          versionKey(baseKey, bestAvailableSize('sm', row.versions)),
        ),
      }
    })
    const urls = await Promise.all(entries.map((e) => e.url))

    const out: Record<string, string> = {}
    entries.forEach((e, i) => {
      out[e.cid] = urls[i]
    })
    return out
  }

  /**
   * Remove every variant on disk + the tracking row + purge CDN. Does not
   * error if the row doesn't exist — idempotent.
   */
  async delete(type: string, cid: string): Promise<void> {
    const baseKey = this.#baseKey(type, cid)
    await Promise.all(
      ALL_SIZES.map((s) =>
        this.#disk.delete(versionKey(baseKey, s)).catch(() => {}),
      ),
    )
    await ImageCache.query().where({ cid, type }).delete()
    this.#purgeCache(baseKey)
  }

  /**
   * Read-only: lookup raw versions map without touching the disk. Useful for
   * batch rendering where the caller already knows the base URL pattern.
   */
  async getRow(type: string, cid: string): Promise<FineImageRow | null> {
    const row = await ImageCache.query().where({ cid, type }).first()
    return row ? { cid: row.cid, type: row.type, versions: row.versions } : null
  }

  #baseKey(type: string, cid: string): string {
    const prefix = this.#prefixes[type] ?? type
    return `${prefix}/${cid}`
  }

  #purgeCache(baseKey: string): void {
    const cdnUrl = this.#config.cdnUrl
    const zoneId = this.#config.cloudflare?.zoneId
    const apiToken = this.#config.cloudflare?.apiToken
    if (!cdnUrl || !zoneId || !apiToken) return

    const files = ALL_SIZES.map((s) => `${cdnUrl}/${versionKey(baseKey, s)}`)

    fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files }),
    }).catch(() => {})
  }
}
