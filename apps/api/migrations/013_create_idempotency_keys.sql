-- UP

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key  TEXT        UNIQUE NOT NULL,
  workspace_id     UUID        REFERENCES workspaces (id) ON DELETE CASCADE,
  response_body    JSONB,
  response_status  INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at       TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_workspace_id ON idempotency_keys (workspace_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at   ON idempotency_keys (expires_at);

-- DOWN

DROP TABLE IF EXISTS idempotency_keys;
