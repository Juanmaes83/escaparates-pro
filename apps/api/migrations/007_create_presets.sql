-- UP

CREATE TABLE IF NOT EXISTS presets (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        REFERENCES workspaces (id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  effect_id     TEXT        NOT NULL,
  config        JSONB       NOT NULL DEFAULT '{}',
  is_public     BOOLEAN     NOT NULL DEFAULT false,
  deleted_at    TIMESTAMPTZ,
  created_by    UUID        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presets_workspace_id ON presets (workspace_id);
CREATE INDEX IF NOT EXISTS idx_presets_is_public    ON presets (is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_presets_deleted_at   ON presets (deleted_at) WHERE deleted_at IS NULL;

-- DOWN

DROP TABLE IF EXISTS presets;
