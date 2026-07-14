# Escaparates Pro Legal & Trust Center

Status: v0.1 provisional. This document is an implementation guide, not final legal advice.

## Principle

Escaparates Pro needs a Legal & Trust Center, not a single legal page. Legal, privacy, billing, content rights, AI, cookies, and subprocessors must be visible before public payments.

## Minimum Pages

- `/legal/` - index and trust summary.
- `/legal/terms.html` - SaaS terms.
- `/legal/privacy.html` - privacy policy.
- `/legal/cookies.html` - cookies policy.
- `/legal/refunds.html` - contracting, cancellation, refunds, credits.
- `/legal/dpa.html` - data processing agreement for business clients.
- `/legal/subprocessors.html` - providers and subprocessors.
- `/legal/acceptable-use.html` - prohibited content and abuse.
- `/legal/ai-policy.html` - prompts, assets, generated outputs, providers.
- `/legal/ip-takedown.html` - IP complaints and takedown flow.

## Product Requirements

- Registration must require accepting Terms and Privacy.
- Checkout must require the latest legal documents before payment.
- Acceptances must be stored server-side with user, workspace, document key, version, timestamp, IP, user agent, and source.
- Legal documents must be versioned.
- A paid production launch requires lawyer review.

## Data Model

Implemented foundation:

- `legal_documents`
- `legal_acceptances`

Future additions:

- `consents`
- `subprocessor_versions`
- `data_deletion_requests`
- `content_takedown_requests`

## Cookies And Consent

Before adding analytics, marketing, support widgets, heatmaps, or non-essential third-party tools:

- load no non-essential cookies before consent;
- provide accept, reject, and configure options;
- allow withdrawal of consent;
- store consent version and timestamp.

## Commercial Risk Gates

Escaparates Pro must not activate public paid acquisition until:

- Stripe lifecycle is complete;
- legal pages are visible;
- terms/privacy acceptance is logged;
- tax/invoicing approach is decided;
- content licensing provenance is tracked;
- user assets have storage and deletion rules.

## Fields Still Pending

- Legal entity name.
- NIF/CIF.
- Registered address.
- Legal contact email.
- Fiscal/tax owner.
- Final subprocessors.
- Storage provider.
- Email provider.
- Analytics provider.
- AI providers.
