/**
 * Migration runner — executes all pending SQL migrations in order.
 *
 * Usage:
 *   npm run migrate:run
 *
 * Migrations are intentionally manual. Run this before the first deploy and
 * after any deploy that introduces a new migration file. The server does NOT
 * run migrations on startup.
 */

import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg

const __dirname = dirname(fileURLToPath(import.meta.url))

// Resolve the migrations directory relative to this file's location.
// At runtime (compiled): dist/db/migrate.js → ../../migrations
// During tsx execution:  src/db/migrate.ts  → ../../migrations
const MIGRATIONS_DIR = join(__dirname, '..', '..', 'migrations')

async function run(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL']
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: databaseUrl })

  try {
    // Ensure the migrations tracking table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          SERIAL PRIMARY KEY,
        filename    TEXT NOT NULL UNIQUE,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    // Collect already-applied migrations
    const { rows: applied } = await pool.query<{ filename: string }>(
      'SELECT filename FROM _migrations ORDER BY filename',
    )
    const appliedSet = new Set(applied.map((r) => r.filename))

    // Read and sort migration files
    let files: string[]
    try {
      const entries = await readdir(MIGRATIONS_DIR)
      files = entries
        .filter((f) => f.endsWith('.sql') && !f.includes('.down.'))
        .sort()
    } catch {
      console.error(`❌ Could not read migrations directory: ${MIGRATIONS_DIR}`)
      process.exit(1)
    }

    const pending = files.filter((f) => !appliedSet.has(f))

    if (pending.length === 0) {
      console.log('✅ No pending migrations — database is up to date')
      return
    }

    console.log(`🔄 Applying ${pending.length} migration(s)…`)

    for (const filename of pending) {
      const filePath = join(MIGRATIONS_DIR, filename)
      const sql = await readFile(filePath, 'utf8')

      // Extract only the UP section (everything before -- DOWN)
      const upSection = sql.split(/^--\s*DOWN\s*$/im)[0] ?? sql

      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        await client.query(upSection)
        await client.query(
          'INSERT INTO _migrations (filename) VALUES ($1)',
          [filename],
        )
        await client.query('COMMIT')
        console.log(`  ✓ ${filename}`)
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`  ✗ ${filename} — rolling back`)
        throw err
      } finally {
        client.release()
      }
    }

    console.log('✅ All migrations applied successfully')
  } finally {
    await pool.end()
  }
}

run().catch((err: unknown) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
