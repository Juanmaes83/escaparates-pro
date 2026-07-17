CREATE TABLE IF NOT EXISTS project_cloud_metadata (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  template_version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'published', 'archived')),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  archived_at TIMESTAMPTZ,
  last_edited_device TEXT,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_cloud_metadata_status_idx
  ON project_cloud_metadata(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS project_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  slot TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video', 'font', 'document')),
  mime_type TEXT NOT NULL,
  original_name TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  public_url TEXT,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  width INTEGER CHECK (width IS NULL OR width > 0),
  height INTEGER CHECK (height IS NULL OR height > 0),
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  checksum TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'uploading', 'processing', 'ready', 'failed', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS project_assets_project_idx
  ON project_assets(project_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS project_assets_workspace_idx
  ON project_assets(workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS project_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  snapshot JSONB NOT NULL,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'unpublished')),
  published_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unpublished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS project_publications_workspace_idx
  ON project_publications(workspace_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS project_publications_status_idx
  ON project_publications(status, updated_at DESC);

-- DOWN
DROP TABLE IF EXISTS project_publications;
DROP TABLE IF EXISTS project_assets;
DROP TABLE IF EXISTS project_cloud_metadata;
