-- UP

CREATE TABLE IF NOT EXISTS usage_counters (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  metric_key    TEXT        NOT NULL,
  metric_value  INT         NOT NULL DEFAULT 0,
  reset_at      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_counters_workspace_id ON usage_counters (workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_counters_unique
  ON usage_counters (workspace_id, metric_key);

-- DOWN

DROP TABLE IF EXISTS usage_counters;
