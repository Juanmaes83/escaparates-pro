-- UP

CREATE TABLE IF NOT EXISTS audit_logs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID        NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  user_id        UUID        REFERENCES users (id) ON DELETE SET NULL,
  action         TEXT        NOT NULL,
  resource_type  TEXT        NOT NULL,
  resource_id    UUID,
  changes        JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_id  ON audit_logs (workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id       ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id   ON audit_logs (resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at    ON audit_logs (created_at DESC);

-- DOWN

DROP TABLE IF EXISTS audit_logs;
