# Module: auth

**Status:** planned — future phase

## Overview

Authentication and session management for Escaparates Pro users.

## Planned scope

- Email/password sign-up and sign-in
- JWT access tokens + refresh token rotation
- OAuth providers (Google, GitHub)
- Session invalidation
- Password reset flow

## Dependencies

- PostgreSQL (Fase 2)
- `@fastify/jwt`
- `argon2` for password hashing

## Notes

This module is intentionally empty in Phase 1. No auth logic should be added here until the database layer (Fase 2) is in place.
