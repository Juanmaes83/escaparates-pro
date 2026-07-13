# Module: webhooks

**Status:** planned — future phase

## Overview

Outbound webhook delivery system. Notifies external services when key events occur inside Escaparates Pro (export completed, project published, etc.).

## Planned scope

- Register webhook endpoints per workspace
- Event subscription (choose which events to receive)
- Signed payloads (HMAC-SHA256)
- Delivery log with retry on failure
- Manual replay of failed deliveries

## Dependencies

- PostgreSQL (Fase 2)
- Background job queue
- `workspaces` module

## Notes

This module is intentionally empty in Phase 1.
