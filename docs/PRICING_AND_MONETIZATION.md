# Escaparates Pro Pricing And Monetization

Status: v0.2 approved pricing foundation. Prices are approved for staging and product UI. Tax review, legal validation, Stripe live configuration, and signed webhook validation remain required before real public billing.

## Product Position

Escaparates Pro is not sold as "effects". It is sold as a commercial production platform for agencies, creators, ecommerce teams, retail brands, events, and installations that need premium visual experiences quickly.

The pricing model is hybrid:

- subscription for platform access;
- plan limits for assets, exports, publishes, seats, and premium modules;
- extra credits for high-cost or burst usage such as AI, heavy exports, premium rendering, storage, or campaign spikes.

## Approved Launch Catalog

Do not launch five paid plans at once. The first paid beta should keep the catalog simple enough to operate and support.

| Plan | Monthly | Annual Discount | Audience | Purpose |
| --- | ---: | ---: | --- | --- |
| Free | 0 EUR | 0 EUR | Trial users, curious creators | Try the product, use basic effects, limited simple downloads. |
| Pro | 49 EUR/month | 490 EUR/year | Freelancers, small businesses, creators | Real exports, premium effects, own assets, logo, first publishes. |
| Studio | 99 EUR/month | 990 EUR/year | Agencies, studios, ecommerce, recurring clients | More assets, exports, publishes, brand kits, review links, higher volume. |
| Enterprise | Custom | Custom | Brands, retail, events, installations | Custom limits, DPA, SLA, support, procurement, integrations, private deployment options. |

Extra credits start with a one-off pack from 29 EUR. Credits are intended for additional exports, AI usage, renders, and campaign spikes.

Creator can be added later only if analytics prove a pricing gap between Free and Pro. Do not add it before the first paid beta because it complicates support, Stripe setup, copy, and entitlement rules.

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

## Stripe Configuration

The approved pricing can be displayed immediately, but real checkout requires Stripe Price IDs configured in Railway.

Required variables for staging and later production:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY`
- `STRIPE_PRICE_STUDIO_MONTHLY`
- `STRIPE_PRICE_STUDIO_YEARLY`
- `STRIPE_PRICE_CREDITS_29`
- `APP_PUBLIC_URL`
- `CORS_ORIGINS`

Stripe Checkout supports:

- subscription checkout for Pro monthly/yearly;
- subscription checkout for Studio monthly/yearly;
- one-off payment checkout for the 29 EUR credits pack;
- Customer Portal for cancellation, invoice access, and subscription management after a Stripe customer exists.

Never activate or upgrade a plan from `success_url`. Activation must come from signed Stripe webhooks and internal subscription state.

## Credit Model

Subscription includes monthly allowances. Extra credits can be sold as one-off packs.

Good credit candidates:

- AI generation.
- High-resolution video exports.
- Premium render queue.
- Additional publishes.
- Storage overflow.

Credits require an internal ledger before being sold at scale. The first ledger table is `credit_ledger_entries`, introduced by migration `018_create_credit_ledger_entries.sql`.

Initial credit pack:

| Pack | Price | Credits | Use |
| --- | ---: | ---: | --- |
| credits_29 | 29 EUR | 100 | Extra exports, AI, renders, campaigns. |

## Paid Launch Blockers

- Stripe webhooks signed and idempotent.
- Customer Portal or equivalent cancellation flow.
- Server-side entitlements.
- Legal acceptance logs.
- Tax/invoicing decision.
- Project persistence and storage.
- Licensing provenance for commercial modules.
