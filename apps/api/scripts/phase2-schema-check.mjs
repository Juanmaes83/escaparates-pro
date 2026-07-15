#!/usr/bin/env node
import pg from 'pg';
const databaseUrl=process.env.DATABASE_URL;
if(!databaseUrl){console.error('DATABASE_URL is not configured');process.exit(1)}
const required=['_migrations','users','sessions','workspaces','workspace_members','projects','project_versions','project_cloud_metadata','project_assets','project_publications'];
const migration='019_create_project_cloud_foundation.sql';
const pool=new pg.Pool({connectionString:databaseUrl});
try{
  const tables=(await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")).rows.map(r=>r.table_name);
  const migrations=(await pool.query('SELECT filename FROM _migrations ORDER BY filename')).rows.map(r=>r.filename);
  const missing=required.filter(t=>!tables.includes(t));
  const migrationOk=migrations.includes(migration);
  console.log(JSON.stringify({database:'connected',tables,migrations,requiredTablesPresent:missing.length===0,missingTables:missing,migration019Present:migrationOk},null,2));
  if(missing.length||!migrationOk)process.exit(1);
}finally{await pool.end()}
