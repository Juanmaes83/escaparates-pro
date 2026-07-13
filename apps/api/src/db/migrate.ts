/**
 * Migration runner - executes all pending SQL migrations in order.
 *
 * Usage:
 *   npm run migrate:run
 *
 * Migrations are intentionally manual. Run this before the first deploy and
 * after any deploy that introduces a new migration file. The server does NOT
 * run migrations on startup.
 */

import { runPendingMigrations } from './migrations-runner.js'

async function run(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL']
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  const result = await runPendingMigrations(databaseUrl)

  if (result.applied.length === 0) {
    console.log('No pending migrations - database is up to date')
    return
  }

  console.log(`Applied ${result.applied.length} migration(s)`)
  for (const filename of result.applied) {
    console.log(`  - ${filename}`)
  }
  console.log('All migrations applied successfully')
}

run().catch((error: unknown) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
