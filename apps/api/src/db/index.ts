import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { env } from '../config/env.js'
import * as schema from './schema.js'

const { Pool } = pg

// Singleton pool — reused across the process lifetime
let _pool: pg.Pool | null = null

export function getPool(): pg.Pool {
  if (!_pool) {
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured')
    }
    _pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    })
  }
  return _pool
}

// Drizzle instance — lazily created alongside the pool
let _db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!_db) {
    _db = drizzle(getPool(), { schema })
  }
  return _db
}

/**
 * Verify the database is reachable by running a trivial query.
 * Returns true on success, false on any error.
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    const pool = getPool()
    const client = await pool.connect()
    try {
      await client.query('SELECT 1')
      return true
    } finally {
      client.release()
    }
  } catch {
    return false
  }
}

/**
 * Gracefully close the connection pool.
 * Call this during process shutdown.
 */
export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end()
    _pool = null
    _db = null
  }
}
