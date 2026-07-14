CREATE TABLE IF NOT EXISTS credit_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER,
  stripe_event_id TEXT,
  checkout_session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_ledger_entries_workspace_idx
  ON credit_ledger_entries(workspace_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_entries_stripe_event_idx
  ON credit_ledger_entries(stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;
