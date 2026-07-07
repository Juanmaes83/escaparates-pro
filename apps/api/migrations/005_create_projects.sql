-- UP

CREATE TABLE IF NOT EXISTS projects (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  thumbnail_url TEXT,
  config        JSONB       NOT NULL DEFAULT '{}',
  deleted_at    TIMESTAMPTZ,
  created_by    UUID        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects (workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by   ON projects (created_by);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at   ON projects (deleted_at) WHERE deleted_at IS NULL;

-- DOWN

DROP TABLE IF EXISTS projects;
