# Module: billing

**Status:** planned — future phase

## Overview

Subscription and payment management via Stripe. Controls plan limits, feature gating, and invoice history.

## Planned scope

- Stripe Checkout session creation
- Webhook handler for subscription lifecycle events
- Plan enforcement (feature flags per tier)
- Invoice / receipt history
- Upgrade / downgrade / cancel flow

## Dependencies

- PostgreSQL (Fase 2)
- Stripe SDK
- `workspaces` module

## Notes

This module is intentionally empty in Phase 1. No payment logic should be added here.
