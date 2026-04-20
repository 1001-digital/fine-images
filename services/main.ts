import app from '@adonisjs/core/services/app'
import type { FineImagesService } from '../src/fine_images_service.js'

let fineImages: FineImagesService

await app.booted(async () => {
  fineImages = await app.container.make('fineImages')
})

export { fineImages as default }
