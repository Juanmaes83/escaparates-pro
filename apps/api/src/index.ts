import { buildApp } from './app.js'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'

async function main() {
  const app = await buildApp()

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    logger.info(
      { port: env.PORT, env: env.NODE_ENV },
      'Escaparates Pro API is running',
    )
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server')
    process.exit(1)
  }
}

main().catch((err: unknown) => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})
