import {
  bigint,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { projects, users, workspaces } from './schema.js'

export const projectCloudMetadata = pgTable('project_cloud_metadata', {
  projectId: uuid('project_id')
    .primaryKey()
    .references(() => projects.id, { onDelete: 'cascade' }),
  templateId: text('template_id').notNull(),
  templateVersion: text('template_version').default('1.0.0').notNull(),
  status: text('status').default('draft').notNull(),
  revision: integer('revision').default(1).notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  lastEditedDevice: text('last_edited_device'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const projectAssets = pgTable('project_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  uploadedBy: uuid('uploaded_by')
    .references(() => users.id, { onDelete: 'restrict' })
    .notNull(),
  slot: text('slot').notNull(),
  kind: text('kind').notNull(),
  mimeType: text('mime_type').notNull(),
  originalName: text('original_name').notNull(),
  storageKey: text('storage_key').unique().notNull(),
  publicUrl: text('public_url'),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  width: integer('width'),
  height: integer('height'),
  durationMs: integer('duration_ms'),
  checksum: text('checksum'),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const projectPublications = pgTable('project_publications', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  slug: text('slug').unique().notNull(),
  snapshot: jsonb('snapshot').notNull(),
  versionNumber: integer('version_number').notNull(),
  status: text('status').default('published').notNull(),
  publishedBy: uuid('published_by')
    .references(() => users.id, { onDelete: 'restrict' })
    .notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  unpublishedAt: timestamp('unpublished_at', { withTimezone: true }),
})
