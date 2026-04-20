import type Configure from '@adonisjs/core/commands/configure'
import { stubsRoot } from './stubs/main.js'

/**
 * Runs on `node ace configure @1001-digital/fine-images`. Wires the provider,
 * publishes a config stub + migration, and declares the optional env vars
 * used for CDN purge.
 */
export async function configure(command: Configure) {
  const codemods = await command.createCodemods()

  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@1001-digital/fine-images/fine_images_provider')
  })

  await codemods.defineEnvVariables({
    R2_CDN_URL: '',
    CF_ZONE_ID: '',
    CF_API_TOKEN: '',
  })

  await codemods.defineEnvValidations({
    leadingComment:
      'Variables for @1001-digital/fine-images (Cloudflare CDN purge; all optional)',
    variables: {
      R2_CDN_URL: `Env.schema.string.optional()`,
      CF_ZONE_ID: `Env.schema.string.optional()`,
      CF_API_TOKEN: `Env.schema.string.optional()`,
    },
  })

  await codemods.makeUsingStub(stubsRoot, 'config.stub', {})

  await codemods.makeUsingStub(stubsRoot, 'migration.stub', {
    migration: {
      folder: 'database/migrations',
      fileName: `${Date.now()}_create_image_caches_table.ts`,
    },
  })
}
