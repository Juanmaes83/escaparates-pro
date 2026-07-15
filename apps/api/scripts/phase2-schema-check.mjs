#!/usr/bin/env node
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not configured');
  process.exit(1);
}

const requiredTables = [
  '_migrations',
  'users',
  'sessions',
  'workspaces',
  'workspace_members',
  'projects',
  'project_versions',
  'project_cloud_metadata',
  'project_assets',
  'project_publications',
];
const requiredMigration