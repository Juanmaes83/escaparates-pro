# Escaparates Pro Pricing And Monetization

Status: v0.1 foundation, pending final prices, tax review, legal validation, and Stripe live configuration.

## Product Position

Escaparates Pro is not sold as "effects". It is sold as a commercial production platform for agencies, creators, ecommerce teams, retail brands, events, and installations that need premium visual experiences quickly.

The pricing model is hybrid:

- subscription for platform access;
- plan limits for assets, exports, publishes, seats, and premium modules;
- extra credits for high-cost or burst usage such as AI, heavy exports, premium rendering, storage, or campaign spikes.

## Launch Catalog

Do not launch five paid plans at once. The first paid beta should keep the catalog simple enough to operate and support.

| Plan | Audience | Purpose |
| --- | --- | --- |
| Free | Trial users, curious creators | Try the product, use demo assets, limited simple downloads. |
| Pro | Freelancers, small businesses | Real exports, premium effects, own assets, logo, first publishes. |
| Studio | Agencies, ecommerce, recurring clients | More assets, exports, publishes, brand kits, review links, team seats. |
| Enterprise | Brands, retail, events, installations | Custom limits, DPA, SLA, support, procurement, private deployment options. |

Creator can be added later if analytics prove a pricing gap between Free and Pro.

## Monetizable Dimensions

- Premium effects and modules.
- Downloads and export quality.
- Publish/embeds and active campaigns.
- Asset uploads, storage, and media size.
- Brand kits and white label.
- Seats and workspaces.
- Review links and client approvals.
- AI credits and generated assets.
- Priority export queue.
- Support and SLA.

## Server Authority

The frontend may display limits, but the backend is the source of truth.

Required API contract:

- `GET /v1/entitlements` returns the active plan, billing status, features, and limits.
- Upload, export, publish, and AI endpoints must enforce the same entitlements server-side.
- Stripe success pages must never activate plans directly.
- Stripe webhook events and reconciliation must update subscription state.

## Suggested Price Discovery

Initial candidates to validate:

- Pro: 39-49 EUR/month.
- Studio: 99-149 EUR/month.
- Enterprise: custom.
- Annual discount: 15-20%.

Do not hardcode final public prices until customer interviews, first paid beta usage, tax treatment, and Stripe products are approved.

## Credit Model

Subscription includes monthly allowances. Extra credits can be sold as one-off packs.

Good credit candidates:

- AI generation.
- High-resolution video exports.
- Premium render queue.
- Additional publishes.
- Storage overflow.

Credits require an internal ledger before being sold at scale.

## Paid Launch Blockers

- Stripe webhooks signed and idempotent.
- Customer Portal or equivalent cancellation flow.
- Server-side entitlements.
- Legal acceptance logs.
- Tax/invoicing decision.
- Project persistence and storage.
- Licensing provenance for commercial modules.
