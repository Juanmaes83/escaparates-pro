# Phase 1 — Backend Foundation

## Overview

Phase 1 establishes the API skeleton for Escaparates Pro. The goal is a production-ready Fastify service with consistent request/response contracts, structured logging, request tracking, and rate limiting — but **no database, no auth, and no payments**.

The API lives at `apps/api` inside the monorepo and is deployed as a separate Railway service, completely isolated from the existing static frontend.

---

## Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js 20 (LTS) |
| Framework | Fastify 4 |
| Language | TypeScript 5 (strict mode, ESM) |
| Logging | Pino (JSON, no pino-pretty) |
| Validation | Zod |
| CORS | @fastify/cors |
| Security headers | @fastify/helmet |
| Rate limiting | @fastify/rate-limit |
| Container | Docker (node:20-alpine) |

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness probe — returns `{ "status": "ok" }` |
| GET | `/ready` | Readiness probe — returns `{ "status": "ready" }` |
| GET | `/v1` | API root — returns version and status |
| GET | `/v1/status` | Extended status with requestId and timestamp |
| `*` | `/*` | 404 normalised error response |

---

## Project Structure

```
apps/api/
  src/
    index.ts              — Entry point, starts Fastify server
    app.ts                — Fastify instance, plugins, hooks, routes
    config/env.ts         — Zod-validated environment variables
    lib/logger.ts         — Pino JSON logger instance
    lib/request-id.ts     — X-Request-ID generation and resolution
    lib/errors.ts         — Normalised ErrorResponse builder
    lib/response.ts       — Normalised SuccessResponse builder
    middleware/
      error-handler.ts    — Global Fastify error handler
      not-found.ts        — 404 handler
    routes/
      health.ts           — GET /health
      ready.ts            — GET /ready
      v1.ts               — GET /v1
      status.ts           — GET /v1/status
    types/fastify.d.ts    — Module augmentation (request.requestId)
  modules/
    auth/                 — Planned (Fase 2+)
    workspaces/           — Planned (Fase 2+)
    projects/             — Planned (Fase 2+)
    presets/              — Planned (Fase 2+)
    assets/               — Planned (Fase 2+)
    publishing/           — Planned (Fase 2+)
    embeds/               — Planned (Fase 2+)
    exports/              — Planned (Fase 2+)
    billing/              — Planned (Fase 2+)
    webhooks/             — Planned (Fase 2+)
```

---

## Request ID

Every request gets a unique `requestId`:

1. If the client sends `X-Request-ID`, that value is used as-is.
2. Otherwise, the server generates `req_XXXXXXXX` (8 random hex chars).
3. The resolved ID is attached to `request.requestId` (typed via module augmentation).
4. The ID is echoed back in the `X-Request-ID` response header.
5. The ID is included in every response body (success and error).

---

## Rate Limiting

`@fastify/rate-limit` is configured at 100 requests per minute per IP. When the limit is exceeded, the API returns:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests — limit is 100 per 1 minute",
    "requestId": "req_a1b2c3d4",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | TCP port the server listens on |
| `NODE_ENV` | `development` | Runtime environment |
| `LOG_LEVEL` | `info` | Pino log level |

All variables are validated at startup via Zod. The process exits with code 1 if validation fails.

---

## What is NOT in Phase 1

- Database (PostgreSQL — Fase 2)
- Authentication (JWT, OAuth — Fase 2)
- File storage (S3/R2 — Fase 2+)
- Background jobs / workers
- Payments (Stripe — Fase 3+)
- Outbound webhooks
