# Deploying the API on Railway

This guide explains how to add `apps/api` as a new Railway service alongside the existing static frontend.

---

## Prerequisites

- Railway project already exists (the static frontend is deployed)
- Railway CLI installed: `npm install -g @railway/cli`
- You are logged in: `railway login`

---

## Step 1 — Create a new service

In the Railway dashboard:

1. Open your project.
2. Click **+ New Service** → **GitHub Repo**.
3. Select the `escaparates-pro` repository.
4. Railway will detect the Dockerfile automatically.

Alternatively, via CLI:

```bash
railway service create --name api
```

---

## Step 2 — Set the root directory

Because the API lives in a subdirectory of the monorepo, you must tell Railway where to find it:

1. Open the service settings.
2. Under **Source** → **Root Directory**, set: `apps/api`
3. Railway will now build from `apps/api/Dockerfile`.

---

## Step 3 — Configure environment variables

In the Railway service settings → **Variables**, add:

| Variable | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Required |
| `LOG_LEVEL` | `info` | Adjust to `debug` for troubleshooting |
| `PORT` | *(leave unset)* | Railway injects `PORT` automatically |

> **Do not set `PORT` manually.** Railway assigns a port and injects it as `PORT`. The API reads this via `process.env.PORT`.

---

## Step 4 — Deploy

Railway will trigger a deploy automatically when you push to `master`. You can also trigger manually:

```bash
railway up --service api
```

---

## Step 5 — Verify the deployment

Once deployed, Railway shows the public URL (e.g. `https://api-production-xxxx.up.railway.app`).

Run the smoke tests:

```bash
# Liveness
curl https://your-api-url.up.railway.app/health
# → { "status": "ok" }

# Readiness
curl https://your-api-url.up.railway.app/ready
# → { "status": "ready" }

# API root
curl https://your-api-url.up.railway.app/v1
# → { "version": "1.0.0", "status": "ok" }

# Status with requestId
curl https://your-api-url.up.railway.app/v1/status
# → { "status": "ok", "timestamp": "...", "requestId": "req_..." }

# 404
curl https://your-api-url.up.railway.app/does-not-exist
# → { "error": { "code": "NOT_FOUND", ... } }
```

---

## Healthcheck

The Dockerfile includes a built-in Docker healthcheck:

```
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', ...)"
```

Railway also uses the `/health` endpoint for its own health monitoring. No additional configuration is needed.

---

## Logs

View structured JSON logs in the Railway dashboard → **Logs** tab, or via CLI:

```bash
railway logs --service api
```

All logs include `requestId`, `level`, `timestamp`, `service`, and `version` fields.

---

## Rollback

To roll back to a previous deploy:

1. Railway dashboard → **Deployments** tab.
2. Find the last good deploy.
3. Click **Redeploy**.

---

## Environment isolation

The frontend (static Caddy service) and the API service are completely independent Railway services. They share the same Railway project but have separate:

- Build pipelines
- Environment variables
- Domains
- Deploy triggers

Changes to the API never affect the frontend, and vice versa.
