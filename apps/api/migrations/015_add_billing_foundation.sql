-- Billing foundation for Stripe checkout and workspace subscription state.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_customer_id
  ON workspaces (stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_subscription_id
  ON workspaces (stripe_subscription_id);
