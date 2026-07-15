# Phase 2 Railway operations

Scope: `staging-phase2-cloud` only.

Services:
- API: `escaparates-pro-api-phase2`
- Database: `Postgres-Phase2`
- Branch: `feature/premium-storytelling-v2-phase-2-project-cloud-export`

Never run these steps in staging or production.

## 1. Public smoke test

```bash
node tools/phase2/railway-smoke.mjs https://<railway-domain>
```

Required results:
- `GET /health` -> HTTP 200
- `GET /ready` -> HTTP 200, `database: connected`
- `GET /v1` -> HTTP 200, `status: ok`, `version: 1.0.0`

A manual GitHub workflow is also available: **Phase 2 Railway Smoke**.

## 2. Database migration

The migration endpoint is enabled only when `NODE_ENV=staging` and `INTERNAL_DEBUG_TOKEN` exists.

Execute once against the isolated Phase 2 API:

```bash
curl --fail-with-body \
  -X POST \
  -H "x-internal-debug-token: $INTERNAL_DEBUG_TOKEN" \
  https://<railway-domain>/internal/db/migrate
```

Do not print or commit the token. Do not configure this as a pre-deploy command.

Verify the response contains:
- `_migrations`
- `users`
- `workspaces`
- `workspace_members`
- `projects`
- `project_versions`
- `project_cloud_metadata`
- `project_assets`
- `project_publications`

Verify `019_create_project_cloud_foundation.sql` is applied or skipped because it was already recorded.

## 3. R2 variables

Required Railway variables:

```text
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=<secret>
R2_ACCESS_KEY_ID=<secret>
R2_SECRET_ACCESS_KEY=<secret>
R2_BUCKET=<bucket-name>
R2_PUBLIC_URL=https://<public-r2-domain>
R2_UPLOAD_TTL_SECONDS=900
```

Optional limits already have safe defaults and plan entitlements still apply:

```text
ASSET_MAX_IMAGE_BYTES
ASSET_MAX_VIDEO_BYTES
ASSET_MAX_FONT_BYTES
```

Until R2 is configured, upload endpoints return `503 STORAGE_NOT_CONFIGURED` without affecting project CRUD, versions or publishing.

## 4. Connect the frontend preview

Open the preview once with:

```text
https://<vercel-preview>/projects.html?api=https://<railway-domain>
```

The client validates HTTPS and stores the API base URL in `localStorage['ep.apiBaseUrl']`.

## 5. Authenticated E2E acceptance

Run in this order:

1. Register or log in.
2. Create one project for each Custom PRO template.
3. Save locally and in cloud.
4. Reload and open the project from `/projects`.
5. Edit from a second browser and verify revision conflict handling.
6. Create and restore a version.
7. Upload one image and one video through R2.
8. Close and reopen in another browser; confirm persistent URLs.
9. Export HTML and confirm no `blob:`, `localhost` or bearer tokens.
10. Export ZIP and open it from static hosting.
11. Publish and open `/p/:slug` without authentication.
12. Unpublish and verify the public URL returns not found.
13. Verify a second workspace cannot access the first workspace's project.
14. Verify the three Source Faithful experiences have no edit or cloud actions.

## 6. Merge gate

Do not merge PR #21 until all of the following are recorded:
- three GitHub workflows green;
- Railway smoke green;
- migrations 001-019 verified on `Postgres-Phase2`;
- authenticated E2E green;
- R2 upload/delete green;
- export and publication green;
- regression of three Source Faithful and three Custom PRO green.
