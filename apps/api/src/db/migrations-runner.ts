import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(__dirname, '..', '..', 'migrations')

export type MigrationRunResult = {
  applied: string[]
  skipped: string[]
  migrationsDir: string
}

export async function runPendingMigrations(
  databaseUrl: string,
): Promise<MigrationRunResult> {
  const pool = new Pool({ connectionString: databaseUrl })

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          SERIAL PRIMARY KEY,
        filename    TEXT NOT NULL UNIQUE,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    const { rows: applied } = await pool.query<{ filename: string }>(
      'SELECT filename FROM _migrations ORDER BY filename',
    )
    const appliedSet = new Set(applied.map((row) => row.filename))

    const entries = await readdir(MIGRATIONS_DIR)
    const files = entries
      .filter((file) => file.endsWith('.sql') && !file.includes('.down.'))
      .sort()

    const pending = files.filter((file) => !appliedSet.has(file))
    const appliedNow: string[] = []

    for (const filename of pending) {
      const filePath = join(MIGRATIONS_DIR, filename)
      const sql = await readFile(filePath, 'utf8')
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
        appliedNow.push(filename)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    }

    return {
      applied: appliedNow,
      skipped: files.filter((file) => appliedSet.has(file)),
      migrationsDir: MIGRATIONS_DIR,
    }
  } finally {
    await pool.end()
  }
}
