import { timingSafeEqual } from 'node:crypto'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { env } from '../config/env.js'
import { getPool } from '../db/index.js'
import { runPendingMigrations } from '../db/migrations-runner.js'
import { buildErrorResponse } from '../lib/errors.js'

type TableRow = {
  table_name: string
}

type MigrationRow = {
  id: number
  filename: string
  applied_at: Date
}

export function isInternalDbMigrateEnabled(
  nodeEnv: string,
  debugToken?: string,
): boolean {
  return nodeEnv === 'staging' && Boolean(debugToken)
}

function tokenMatches(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)

  if (providedBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(providedBuffer, expectedBuffer)
}

function readDebugToken(request: FastifyRequest): string | null {
  const raw = request.headers['x-internal-debug-token']

  if (Array.isArray(raw)) {
    return raw[0] ?? null
  }

  return raw ?? null
}

async function readSchemaState() {
  const pool = getPool()
  const client = await pool.connect()

  try {
    const tables = await client.query<TableRow>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    const migrationsTable = await client.query<{ exists: boolean }>(
      "SELECT to_regclass('public._migrations') IS NOT NULL AS exists",
    )

    let migrations: MigrationRow[] = []

    if (migrationsTable.rows[0]?.exists) {
      const result = await client.query<MigrationRow>(`
        SELECT id, filename, applied_at
        FROM _migrations
        ORDER BY filename
      `)
      migrations = result.rows
    }

    return {
      tables: tables.rows.map((row) => row.table_name),
      migrations: migrations.map((row) => ({
        id: row.id,
        filename: row.filename,
        appliedAt: row.applied_at.toISOString(),
      })),
    }
  } finally {
    client.release()
  }
}

export async function internalDbMigrateRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post('/internal/db/migrate', async (request, reply) => {
    const requestId = request.requestId

    if (!isInternalDbMigrateEnabled(env.NODE_ENV, env.INTERNAL_DEBUG_TOKEN)) {
      return reply.status(404).send(
        buildErrorResponse(
          'NOT_FOUND',
          `Route ${request.method} ${request.url} not found`,
          requestId,
        ),
      )
    }

    const expectedToken = env.INTERNAL_DEBUG_TOKEN
    const providedToken = readDebugToken(request)

    if (!providedToken || !expectedToken || !tokenMatches(providedToken, expectedToken)) {
      return reply.status(401).send(
        buildErrorResponse(
          'UNAUTHORIZED',
          'Invalid internal debug token',
          requestId,
        ),
      )
    }

    if (!env.DATABASE_URL) {
      return reply.status(503).send(
        buildErrorResponse(
          'DATABASE_UNAVAILABLE',
          'Database migrations could not be executed',
          requestId,
        ),
      )
    }

    try {
      const result = await runPendingMigrations(env.DATABASE_URL)
      const schema = await readSchemaState()

      return reply.status(200).send({
        database: 'connected',
        migrationRun: {
          applied: result.applied,
          skipped: result.skipped,
          appliedCount: result.applied.length,
          skippedCount: result.skipped.length,
        },
        tables: schema.tables,
        migrations: schema.migrations,
        timestamp: new Date().toISOString(),
        requestId,
      })
    } catch (error) {
      request.log.error({ err: error, requestId }, 'Internal DB migration failed')
      return reply.status(503).send(
        buildErrorResponse(
          'DATABASE_MIGRATION_FAILED',
          'Database migrations could not be executed',
          requestId,
        ),
      )
    }
  })
}
