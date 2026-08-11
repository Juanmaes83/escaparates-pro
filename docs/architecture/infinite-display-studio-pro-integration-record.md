# Infinite Display Studio PRO — Integration Record

Status: **PLACEMENT APPROVED / TYPE B APPROVED / PARITY CLOSURE PENDING / NO MERGE**

## Decision

Infinite Display Studio PRO is registered as:

`RUBIK SOTA → Infinite Display Studio PRO → Advanced Integrated Tool (Type B)`

This placement is additive. It does not replace Studio RUBIK SOTA Experiences, Particles Engine V5, Catálogo Inmersivo or Pin Mapping Studio PRO.

## Why Type B

The product is a sufficiently capable visual engine to justify native authoring integration instead of a standalone iframe-only experience.

Official composition:

`VISUAL ENGINE + ADAPTER + ESCAPARATES AUTHORING SYSTEM = PRO MODULE`

## Canonical source lock

- source repo: `Juanmaes83/ESCAPARATES-INMERSIVOS-DE-IMAGEN-VIDEO`
- source branch: `main`
- source commit: `89ee1beb56a0c86c06366bbbb155f421e2d23981`
- canonical `index.html` blob: `f74424403b3dd276919035e86b3b0abb1c48224c`

The source engine remains the fallback and is not rewritten.

## Current branch

- Escaparates Pro branch: `feature/type-b-infinite-display-studio-pro`
- Draft PR: `#42`
- base at branch creation: `master@bdf4cd77c9a1861447f4edd563a733925203506e`
- merge authorization: **NONE**

## Existing technical registration

The branch already contains the actual technical registration; do not create a duplicate:

- `js/advanced-tools/registry.js` — `EP.AdvancedTools` and the `infinite-display-studio-pro` definition.
- `js/rubik-tools-ui.js` — RUBIK SOTA catalog entry that routes Type B tools to the Advanced Tool host.
- `advanced-tool.html` — native Type B authoring surface.
- `js/advanced-tools/host.js` — runtime bridge, media/project/output wiring and host lifecycle.
- `js/advanced-tools/render-adapter.js` — renderer/canvas abstraction.
- `js/advanced-tools/project-adapter.js` — project-state compatibility layer.
- `docs/architecture/advanced-module-type-b-v1.md` — generic Type B contract.

## Additive-only rule

For this integration and subsequent recovery modules:

- ADD the new product/family registration;
- PRESERVE all working existing products;
- NEVER replace an existing module merely because a new version exists;
- NEVER merge an old divergent branch wholesale when the product can be transported safely;
- PRESERVE meaningful parallel versions when they represent distinct product value;
- keep rollback explicit;
- preview and visually approve before merge.

Operational sequence:

`AUDIT → CANONICAL SOURCE → PREVIEW → JUANMA APPROVAL → ISOLATED BRANCH → PRESERVE/WRAP/REGISTER/CONNECT → QA → PREVIEW → KEEP/ADJUST/REJECT → MERGE ONLY WITH EXPLICIT APPROVAL`

## Original-parity gate before merge

Pending closure:

1. Ambient music controls.
2. Full media manager parity: upload, preview, remove/manage.
3. Share / screenshot-share flow.
4. Portable HTML export with complete serialized project state.
5. Explicit QA of original interaction grammar: wheel, keyboard, mouse/touch, inertia and Shift+drag free-look.
6. 12/12 visual mode review with source defaults and uploaded media.
7. Save/Restore fidelity.
8. Version Restore fidelity.
9. Confirm outputs do not lose branding, presentation or media state.

Until these are closed, the product is **approved in concept, placement and Type B architecture**, but the PR remains Draft and unmerged.

## Reuse after closure

Once Infinite Display Studio PRO closes parity, the Type B contract becomes the preferred starting point for other capable engines such as BANDEROLAS, Projection / Video Mapping and Portal Studio. Each still requires its own canonical-source audit and Juanma approval before integration.
