import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Base Lucid model for the `image_caches` table. Consumers can import and
 * extend this model to add relations or override behaviour:
 *
 *   import BaseImageCache from '@1001-digital/fine-images/models/image_cache'
 *   export default class ImageCache extends BaseImageCache {
 *     @belongsTo(() => Asset, { foreignKey: 'key' })
 *     declare asset: BelongsTo<typeof Asset>
 *   }
 */
export default class ImageCache extends BaseModel {
  static table = 'image_caches'

  @column()
  declare key: string

  @column()
  declare scope: string

  @column({
    consume: (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v),
    prepare: (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v)),
  })
  declare versions: Record<string, boolean>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
