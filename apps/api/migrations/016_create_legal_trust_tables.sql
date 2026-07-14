-- Legal and Trust readiness foundation.
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_key TEXT NOT NULL,
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  url TEXT NOT NULL,
  effective_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_key, version)
);

CREATE TABLE IF NOT EXISTS legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  document_key TEXT NOT NULL,
  document_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  source TEXT NOT NULL DEFAULT 'registration',
  UNIQUE (user_id, document_key, document_version)
);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_id
  ON legal_acceptances (user_id);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_workspace_id
  ON legal_acceptances (workspace_id);

INSERT INTO legal_documents (document_key, title, version, status, url, effective_at)
VALUES
  ('terms', 'Terminos y condiciones', '2026-07-14-v0.1', 'provisional', '/legal/terms.html', now()),
  ('privacy', 'Politica de privacidad', '2026-07-14-v0.1', 'provisional', '/legal/privacy.html', now()),
  ('cookies', 'Politica de cookies', '2026-07-14-v0.1', 'provisional', '/legal/cookies.html', now())
ON CONFLICT (document_key, version) DO NOTHING;
