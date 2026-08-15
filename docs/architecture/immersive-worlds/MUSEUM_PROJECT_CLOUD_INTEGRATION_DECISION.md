# Museum ↔ Project Cloud — asset persistence integration decision

**Status:** architecture ACCEPTED · adapter PREPARED · byte-level persistence **NOT PROVEN**
**Contains no secrets and must never contain any.**

## Current → target

```
CURRENT   MediaVault → URL.createObjectURL → revoked with the tab
          config stores  authored:<session-id>
          config persists (localStorage). The bytes do not.

TARGET    Museum project → Project Cloud → project_assets → R2
          config stores  asset:<uuid> + publicUrl

ADAPTER   authoring/project-cloud/asset-client.js — a client and nothing else
AUTH      authenticated product session, per request. Never a shipped token.
```

## Why an adapter rather than a backend

`project_assets` already carries slot, kind, mimeType, originalName, storageKey,
publicUrl, sizeBytes, width, height, durationMs, checksum, status and soft
delete. `r2-storage.ts` presigns PUT and DELETE. Three routes drive the whole
lifecycle, with access control, plan entitlements and quotas already enforced.
**Nothing in Project Cloud needs to change for the Museum to use it.** What the
Museum lacked was a client. No Project Cloud code was copied.

## The authentication boundary

```
MUSEUM STUDIO (browser)
  → authenticated product session      the host app owns this
  → ProjectCloudAssets                 asks for credentials per request
  → Project Cloud API → R2
```

A deployed static client must never ship a long-lived bearer token. The adapter
therefore **cannot hold one**: it takes a `session.authorize()` provider, has no
default and no fallback constant, and throws `UNAUTHENTICATED` rather than
sending an anonymous request — because a silent 401 during upload is
indistinguishable, to an author, from a file that simply did not save.

Any dev credential used for isolated testing is a **test harness**, supplied
outside the repository, and is not the product's authentication design.

## Reference model — one reading, never two

| namespace | meaning | survives reload |
|---|---|---|
| `authored:<session-id>` | existing vault handle to an object URL | **no** |
| `asset:<uuid>` | Project Cloud asset | **yes** |

The namespaces never collide, so any resolver can tell from the reference alone
whether a piece of media will survive — which is what prevents the dual truth
this migration could otherwise create. `mediaFromAsset()` emits exactly the shape
`normaliseMedia()` already stores, plus `publicUrl`, so nothing downstream learns
a new object.

## State model — READY is not SAVED

| state | means | who knows it |
|---|---|---|
| SELECTED | a file was chosen | client |
| UPLOADING | row exists at `uploading`; bytes moving | server + client |
| PROCESSING | bytes delivered; metadata being read | client |
| READY | bytes in R2, `project_assets.status='ready'` | **server** |
| SAVED | READY **and** the project config referencing it is persisted | Museum |
| IN USE | SAVED **and** assigned to ≥1 slot | Museum |
| ERROR | any step failed | either |

`SAVED` and `IN USE` are never server facts. A session reference is **never**
SAVED however complete its upload was. This is enforced in `mediaState()` and
covered by contract tests, so the distinction lives in the data rather than in
UI wording.

## Replace / delete / reuse

- **Replace** — upload the new asset, repoint the slot, then `DELETE` the old id.
  Never delete first: a failed upload would otherwise destroy the only copy.
- **Delete** — `DELETE /assets/:id`; the row soft-deletes and the R2 object is
  removed. Refuse, or warn with the `usedBy` list, when the asset is still
  assigned.
- **Reuse** — assignment writes a reference; it never re-uploads. One asset may
  fill several compatible slots. `media-catalogue.js` already computes `usedBy`
  and is the surface for this — it is connected, not replaced.

## Environment checklist for the real integration test

No values here. Names only.

| # | Requirement |
|---|---|
| 1 | `API_BASE` reachable from the Studio's origin |
| 2 | `CORS_ORIGINS` includes that origin |
| 3 | Postgres reachable via `DATABASE_URL`, migrations applied |
| 4 | Dev **workspace** with a plan whose `features.uploadAssets` is true |
| 5 | Dev **user** with `workspace_members.role` ∈ owner/admin/editor |
| 6 | Authenticated **session** (unexpired row in `sessions`), obtained at runtime |
| 7 | Dev **project** row in that workspace → `projectId` |
| 8 | `STORAGE_PROVIDER=r2` + the five `R2_*` settings, test bucket |
| 9 | Quota headroom: `limits.userAssets`, `limits.assetMb` |
| 10 | Isolation: no production billing, no customer projects touched |

## Session A → Session B execution spec

Run when the environment above exists. Not runnable today.

**Session A** — open VS02 with a live session · upload a real image (Contenido →
Medios) · upload a real video · observe SELECTED → UPLOADING → PROCESSING →
READY · record the two `asset:<uuid>` references and their `publicUrl` · save the
project · confirm the Studio now reports SAVED, not before.

**Session B** — clear the browser profile entirely, so no object URL and no
localStorage can flatter the result · reopen the project · assert both assets
still exist, both thumbnails/posters resolve from `publicUrl`, both assignments
survive, both render in Preview and in the published Visitor experience, and an
asset can be assigned to a second compatible slot **without re-upload**.

**Replacement** — replace one asset; assert the slot follows the new id and the
old object is removed. **Failure** — an unsupported MIME is refused before
upload; an interrupted upload never reports READY; a storage failure surfaces
ERROR with the request id.

## Validation status

Contract tests: **10/10** (`qa/tools/project-cloud-contract-test.mjs`) — these
prove the adapter speaks the API's shapes. They touch no Postgres, no R2 and no
network, and are **not** a persistence proof. A green run here is visually
identical to a green real integration, which is exactly why the distinction is
written down: the whole P0.2 trust problem is being told something was saved
when it was not.
