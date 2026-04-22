import type { ApplicationService } from '@adonisjs/core/types'
import type { DriveService } from '@adonisjs/drive/types'
import type { FineImagesService } from '../src/fine_images_service.js'
import type { FineImagesConfig } from '../src/types.js'

// Pull in @adonisjs/drive's container-binding augmentation so
// `container.make('drive.manager')` is typed inside this package.
import type {} from '@adonisjs/drive/drive_provider'

/**
 * Adds `fineImages` to the container. Resolves the consumer's Drive disk
 * lazily on first access so boot order is forgiving.
 *
 * Consumers typically don't import this directly — `node ace configure` adds
 * it to adonisrc.ts and it's loaded at boot.
 */
declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    fineImages: FineImagesService
  }
}

export default class FineImagesProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('fineImages', async () => {
      const [{ FineImagesService: Svc }, driveManagerRaw] = await Promise.all([
        import('../src/fine_images_service.js'),
        this.app.container.make('drive.manager'),
      ])
      const driveManager = driveManagerRaw as DriveService

      const config = this.app.config.get<FineImagesConfig>(
        'fine_images',
        this.app.config.get<FineImagesConfig>('fineImages', {}),
      )
      const disk = config.disk
        ? driveManager.use(config.disk)
        : driveManager.use()

      return new Svc({ disk, config })
    })
  }
}
