# Data Model Roadmap

This document describes the PostgreSQL schema planned for Fase 2. Nothing here is implemented yet — it serves as a design reference.

---

## Fase 2 — Core Tables

### `users`

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `workspaces`

```sql
CREATE TABLE workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL DEFAULT 'free',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `workspace_members`

```sql
CREATE TABLE workspace_members (
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'editor', -- owner | editor | viewer
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
```

### `projects`

```sql
CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  thumbnail_url TEXT,
  config        JSONB NOT NULL DEFAULT '{}',
  archived_at   TIMESTAMPTZ,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `assets`

```sql
CREATE TABLE assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  mime_type     TEXT NOT NULL,
  size_bytes    BIGINT NOT NULL,
  storage_key   TEXT NOT NULL,
  cdn_url       TEXT,
  uploaded_by   UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `presets`

```sql
CREATE TABLE presets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- NULL = public
  name          TEXT NOT NULL,
  effect_id     TEXT NOT NULL,
  config        JSONB NOT NULL DEFAULT '{}',
  is_public     BOOLEAN NOT NULL DEFAULT false,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `publishes`

```sql
CREATE TABLE publishes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  snapshot      JSONB NOT NULL,
  published_by  UUID NOT NULL REFERENCES users(id),
  published_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ
);
```

### `export_jobs`

```sql
CREATE TABLE export_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  format        TEXT NOT NULL, -- webm | mp4 | gif | html
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | processing | done | failed
  storage_key   TEXT,
  error_message TEXT,
  requested_by  UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);
```

---

## Fase 3+ — Billing Tables

### `subscriptions`

```sql
CREATE TABLE subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_customer_id   TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  plan                 TEXT NOT NULL,
  status               TEXT NOT NULL, -- active | past_due | canceled | trialing
  current_period_end   TIMESTAMPTZ NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Migration Strategy

- Migrations managed with **node-pg-migrate** or **Drizzle ORM** (decision pending)
- All migrations live in `apps/api/migrations/`
- Migrations run automatically on deploy via `npm run migrate`
- Each migration is a timestamped SQL file: `20240115_001_create_users.sql`
- Down migrations are required for every up migration
