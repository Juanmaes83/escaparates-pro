-- Add native email/password authentication support.
-- Nullable by design: existing users and future OAuth users may not have a local password.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Sessions already exist from 002_create_sessions.sql and store hashed refresh tokens.
