# Module: assets

**Status:** planned — future phase

## Overview

Media asset management: upload, store, transform, and serve images and videos used inside projects.

## Planned scope

- Upload image / video (multipart)
- List assets per workspace
- Delete / replace asset
- Generate optimised variants (thumbnails, WebP)
- CDN URL generation

## Dependencies

- PostgreSQL (Fase 2)
- Object storage (S3-compatible, e.g. Cloudflare R2)

## Notes

This module is intentionally empty in Phase 1. No file storage should be wired until Fase 2.
