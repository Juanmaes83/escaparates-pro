#!/usr/bin/env node
/**
 * Physical schema verification for Phase 2.
 *
 * Unlike a table-existence check, this verifies the exact columns (and key
 * constraints) that the Drizzle models require on the auth/registration path,
 * and cross-checks them against the `_migrations` ledger so a discrepancy
 * (migration recorded as applied but the physical ALTER never ran) is surfaced.
 *
 * Usage: DATABASE_URL=... node apps/api/scripts/phase2-schema-check.mjs
 * Exits non-zero if any required table/column is missing.
 */
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not configured');
  process.exit(1);
}

// Columns each Drizzle model requires. Source of truth: apps/api/src/db/schema.ts
const REQUIRED_COLUMNS = {
  users: ['id', 'email', 'password_hash', 'stripe_customer_id', 'name', 'avatar_url', 'created_at', 'updated_at'],
  sessions: ['id', 'user_id', 'refresh_token_hash', 'expires_at', 'created_at'],
  workspaces: ['id', 'name', 'slug', 'owner_user_id', 'plan', 'stripe_customer_id', 'stripe_subscription_id', 'billing_status', 'current_period_end', 'created_at', 'updated_at'],
  workspace_members: ['workspace_id', 'user_id', 'role', 'joined_at'],
  legal_acceptances: ['id', 'user_id', 'workspace_id', 'document_key', 'document_version', 'accepted_at', 'ip_address', 'user_agent', 'source'],
};

// Tables that must simply exist (project cloud foundation, migration 019).
const REQUIRED_TABLES = ['_migrations', 'projects', 'project_versions', 'project_cloud_metadata', 'project_assets', 'project_publications'];

// Migration -> a column it must have physically produced. Used to detect a
// ledger/physical discrepancy (recorded as applied but column absent).
const MIGRATION_COLUMN_GUARDS = [
  { migration: '014_add_email_password_auth.sql', table: 'users', column: 'password_hash' },
  { migration: '015_add_billing_foundation.sql', table: 'users', column: 'stripe_customer_id' },
  { migration: '015_add_billing_foundation.sql', table: 'workspaces', column: 'billing_status' },
  { migration: '016_create_legal_trust_tables.sql', table: 'legal_acceptances', column: 'document_version' },
];

const pool = new pg.Pool({ connectionString: databaseUrl });

try {
  const tables = (await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name",
  )).rows.map((r) => r.table_name);
  const tableSet = new Set(tables);

  const columnsRows = (await pool.query(
    `SELECT table_name, column_name, is_nullable, data_type
     FROM information_schema.columns
     WHERE table_schema='public'`,
  )).rows;
  const columnsByTable = new Map();
  for (const row of columnsRows) {
    if (!columnsByTable.has(row.table_name)) columnsByTable.set(row.table_name, new Map());
    columnsByTable.get(row.table_name).set(row.column_name, { nullable: row.is_nullable, dataType: row.data_type });
  }

  const constraints = (await pool.query(
    `SELECT tc.table_name, tc.constraint_type, tc.constraint_name
     FROM information_schema.table_constraints tc
     WHERE tc.table_schema='public'
       AND tc.table_name = ANY($1::text[])
     ORDER BY tc.table_name, tc.constraint_type`,
    [Object.keys(REQUIRED_COLUMNS)],
  )).rows;

  let migrations = [];
  if (tableSet.has('_migrations')) {
    migrations = (await pool.query('SELECT filename FROM _migrations ORDER BY filename')).rows.map((r) => r.filename);
  }
  const migrationSet = new Set(migrations);

  const missingTables = [];
  for (const t of REQUIRED_TABLES) if (!tableSet.has(t)) missingTables.push(t);
  for (const t of Object.keys(REQUIRED_COLUMNS)) if (!tableSet.has(t)) missingTables.push(t);

  const missingColumns = [];
  for (const [table, cols] of Object.entries(REQUIRED_COLUMNS)) {
    const present = columnsByTable.get(table) || new Map();
    for (const col of cols) {
      if (!present.has(col)) missingColumns.push(`${table}.${col}`);
    }
  }

  // Ledger vs physical discrepancy: migration recorded but its column is absent.
  const discrepancies = [];
  for (const guard of MIGRATION_COLUMN_GUARDS) {
    const recorded = migrationSet.has(guard.migration);
    const physical = (columnsByTable.get(guard.table) || new Map()).has(guard.column);
    if (recorded && !physical) {
      discrepancies.push({ migration: guard.migration, expected: `${guard.table}.${guard.column}`, recorded, physical });
    }
  }

  const report = {
    database: 'connected',
    migrations,
    missingTables,
    missingColumns,
    ledgerPhysicalDiscrepancies: discrepancies,
    criticalMigrationsRecorded: {
      '014_add_email_password_auth.sql': migrationSet.has('014_add_email_password_auth.sql'),
      '015_add_billing_foundation.sql': migrationSet.has('015_add_billing_foundation.sql'),
      '016_create_legal_trust_tables.sql': migrationSet.has('016_create_legal_trust_tables.sql'),
      '019_create_project_cloud_foundation.sql': migrationSet.has('019_create_project_cloud_foundation.sql'),
    },
    usersStripeCustomerIdPresent: (columnsByTable.get('users') || new Map()).has('stripe_customer_id'),
    constraints: constraints.map((c) => `${c.table_name}:${c.constraint_type}:${c.constraint_name}`),
    requiredTablesPresent: missingTables.length === 0,
    requiredColumnsPresent: missingColumns.length === 0,
  };

  console.log(JSON.stringify(report, null, 2));

  if (missingTables.length || missingColumns.length || discrepancies.length) {
    process.exit(1);
  }
} finally {
  await pool.end();
}
