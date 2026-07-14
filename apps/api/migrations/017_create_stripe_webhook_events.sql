-- Stripe webhook idempotency and audit trail.
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_status TEXT NOT NULL DEFAULT 'processed',
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  payload JSONB,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type
  ON stripe_webhook_events (event_type);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_workspace_id
  ON stripe_webhook_events (workspace_id);
