# Future SaaS Roadmap

High-level phased plan for evolving Escaparates Pro from a static frontend tool into a full SaaS platform.

---

## Phase 1 — Backend Foundation (current)

**Goal:** Establish a production-ready API skeleton with no external dependencies.

- [x] Fastify + TypeScript + Pino
- [x] Structured JSON logging
- [x] Request ID tracking (X-Request-ID)
- [x] Normalised error responses
- [x] Rate limiting per IP
- [x] Security headers (Helmet)
- [x] CORS
- [x] Health and readiness probes
- [x] Railway-ready Dockerfile
- [x] Environment variable validation (Zod)

---

## Phase 2 — Database + Auth

**Goal:** Persistent storage and user identity.

- [ ] PostgreSQL on Railway
- [ ] Database migrations (node-pg-migrate or Drizzle)
- [ ] User registration and login (email/password)
- [ ] JWT access tokens + refresh token rotation
- [ ] OAuth (Google, GitHub)
- [ ] Workspace creation and member invites
- [ ] Project CRUD
- [ ] Asset upload (Cloudflare R2 or AWS S3)

**Estimated effort:** 3–4 weeks

---

## Phase 3 — Publishing + Embeds

**Goal:** Let users share finished pieces publicly.

- [ ] Publish project to stable URL
- [ ] Password-protected publish
- [ ] Custom slug
- [ ] iframe embed code generation
- [ ] JS snippet embed
- [ ] Allowed-domain allowlist per embed
- [ ] Basic view analytics (impressions, unique visitors)

**Estimated effort:** 2–3 weeks

---

## Phase 4 — Export Jobs

**Goal:** Async rendering pipeline for downloadable files.

- [ ] Export to WebM, MP4, GIF, HTML widget
- [ ] Background job queue (BullMQ + Redis)
- [ ] Job status polling
- [ ] Signed download URLs
- [ ] Export history per project

**Estimated effort:** 3–4 weeks

---

## Phase 5 — Billing

**Goal:** Monetise the platform with tiered subscriptions.

- [ ] Stripe Checkout integration
- [ ] Subscription lifecycle webhooks
- [ ] Plan enforcement (feature flags per tier)
- [ ] Free / Pro / Team tiers
- [ ] Invoice and receipt history
- [ ] Upgrade / downgrade / cancel flow

**Estimated effort:** 2–3 weeks

---

## Phase 6 — Presets + Collaboration

**Goal:** Community and team features.

- [ ] Save and share effect presets
- [ ] Public preset gallery
- [ ] Real-time collaborative editing (WebSockets or CRDTs)
- [ ] Comments and annotations on projects
- [ ] Activity feed per workspace

**Estimated effort:** 4–6 weeks

---

## Phase 7 — Outbound Webhooks + API Keys

**Goal:** Platform extensibility for power users and integrations.

- [ ] Workspace-level API keys
- [ ] Outbound webhook registration
- [ ] Signed payloads (HMAC-SHA256)
- [ ] Delivery log with automatic retry
- [ ] Manual replay of failed deliveries
- [ ] Public API documentation (OpenAPI / Scalar)

**Estimated effort:** 2–3 weeks

---

## Non-Goals (permanent)

- The editor UI will remain a static frontend — no server-side rendering
- The viewer output (published pieces) will be served from CDN, not the API
- The API will never serve HTML — JSON only
