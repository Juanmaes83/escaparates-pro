-- UP

CREATE TABLE IF NOT EXISTS workspaces (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  slug           TEXT        UNIQUE NOT NULL,
  owner_user_id  UUID        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  plan           TEXT        NOT NULL DEFAULT 'free',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_slug          ON workspaces (slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_user_id ON workspaces (owner_user_id);

-- DOWN

DROP TABLE IF EXISTS workspaces;
