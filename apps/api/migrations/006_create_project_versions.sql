-- UP

CREATE TABLE IF NOT EXISTS project_versions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  version_number INT         NOT NULL,
  snapshot       JSONB       NOT NULL,
  created_by     UUID        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON project_versions (project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_versions_unique
  ON project_versions (project_id, version_number);

-- DOWN

DROP TABLE IF EXISTS project_versions;
