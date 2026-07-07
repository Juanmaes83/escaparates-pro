# Module: exports

**Status:** planned — future phase

## Overview

Handles async export jobs that render a project to a downloadable file (video, GIF, HTML widget).

## Planned scope

- Trigger export job (WebM, MP4, GIF, HTML)
- Poll job status
- Download signed URL for completed export
- Export history per project
- Retry failed jobs

## Dependencies

- PostgreSQL (Fase 2)
- Object storage (S3-compatible)
- Background job queue (e.g. BullMQ + Redis)

## Notes

This module is intentionally empty in Phase 1. No worker or queue infrastructure should be added until Fase 2+.
