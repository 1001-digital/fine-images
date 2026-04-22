# @1001-digital/fine-images

Image caching + resizing for AdonisJS v7.

Takes a source image buffer, resizes it to a set of webp variants (`xs`, `sm`, `md`, `lg`), stores them on any configured [Drive](https://docs.adonisjs.com/guides/drive) disk (R2, S3, local, …), tracks what variants exist in the `image_caches` table, and — optionally — purges the files from Cloudflare's edge cache when they change.

Extracted from internal use by [evm.now](https://evm.now) and [networked.art](https://networked.art) so both consume the same implementation.

## Install

```sh
npm install @1001-digital/fine-images sharp
node ace configure @1001-digital/fine-images
node ace migration:run
```

The `configure` step:

- registers the provider in `adonisrc.ts`
- creates `config/fine_images.ts`
- publishes a migration for the `image_caches` table into `database/migrations/`
- adds optional CDN-purge env vars to `.env.example` + `start/env.ts`

## Usage

```ts
import fineImages from '@1001-digital/fine-images/services/main'

// Store variants keyed on (scope, key). `scope` is a free-form bucket name;
// a few prefixes are built-in and can be extended via config.scopePrefixes.
await fineImages.put('avatar', profileAddress, buffer)

const url = await fineImages.getUrl('avatar', profileAddress, 'sm')

// Batch fetch URLs for a scope and list of keys — handy for lists.
const urls = await fineImages.batchGetUrlsByScope('avatar', profileAddresses)

await fineImages.delete('avatar', profileAddress)
```

The service takes a `Disk` in construction, so it works with whichever Drive disk is configured as default (or named via `config.disk`). Nothing in here is S3-specific.

## Configuration

`config/fine_images.ts`:

```ts
import env from '#start/env'
import { defineConfig } from '@1001-digital/fine-images'

export default defineConfig({
  disk: 'r2',
  scopePrefixes: {
    collection: 'collections',
  },
  cdnUrl: env.get('R2_CDN_URL'),
  cloudflare: {
    zoneId: env.get('CF_ZONE_ID'),
    apiToken: env.get('CF_API_TOKEN'),
  },
})
```

Leave `cdnUrl`/`cloudflare` unset in dev — purge becomes a no-op.

## Extending the model

The published Lucid model is a regular model. If you want to add a relation, extend it in your app:

```ts
import BaseImageCache from '@1001-digital/fine-images/models/image_cache'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Asset from '#models/asset'

export default class ImageCache extends BaseImageCache {
  @belongsTo(() => Asset, { foreignKey: 'key' })
  declare asset: BelongsTo<typeof Asset>
}
```

For schema changes (extra columns, different index), write a follow-up migration in your app — the package never reclaims the table.

## Pure resizer

If you want the sharp toolchain without the caching service (e.g. one-off CLI work), import it directly:

```ts
import { resizeImage } from '@1001-digital/fine-images/services/image_resizer'

const variants = await resizeImage(buffer)
// → [{ size: 'xs', buffer }, { size: 'sm', buffer }, { size: 'md', buffer }, { size: 'lg', buffer }]
```

## Peer dependencies

- `@adonisjs/core` ^7
- `@adonisjs/lucid` ^22
- `@adonisjs/drive` ^4
- `sharp` ^0.33 || ^0.34

`sharp` is a peer so the consumer controls the native-binary/platform target.

## License

MIT
