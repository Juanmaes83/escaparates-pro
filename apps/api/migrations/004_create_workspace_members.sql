-- UP

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id  UUID        NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users (id)      ON DELETE CASCADE,
  role          TEXT        NOT NULL DEFAULT 'editor',
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (workspace_id, user_id),
  UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members (user_id);

-- DOWN

DROP TABLE IF EXISTS workspace_members;
