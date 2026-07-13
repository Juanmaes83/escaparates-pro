-- UP

CREATE TABLE IF NOT EXISTS plans (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        UNIQUE NOT NULL,
  stripe_product_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the three base plans
INSERT INTO plans (name) VALUES ('free'), ('pro'), ('team')
  ON CONFLICT (name) DO NOTHING;

-- DOWN

DELETE FROM plans WHERE name IN ('free', 'pro', 'team');
DROP TABLE IF EXISTS plans;
