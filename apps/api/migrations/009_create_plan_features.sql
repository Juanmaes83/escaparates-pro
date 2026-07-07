-- UP

CREATE TABLE IF NOT EXISTS plan_features (
  id             UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id        UUID  NOT NULL REFERENCES plans (id) ON DELETE CASCADE,
  feature_key    TEXT  NOT NULL,
  feature_value  TEXT,

  UNIQUE (plan_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON plan_features (plan_id);

-- DOWN

DROP TABLE IF EXISTS plan_features;
