# Advanced Module Integration — Type B v1

Status: FOUNDATION / isolated branch

## Principle

`PRESERVE ENGINE → ADAPTER → ESCAPARATES AUTHORING SYSTEM → MODULE PRO`

Type B exists for products whose own engine is valuable enough to preserve but whose controls, project state and outputs should feel native to Escaparates Pro.

## Non-negotiable rules

- Do not rebuild visual algorithms that already work.
- Keep the canonical source pinned to an immutable commit.
- Do not migrate an engine to `EP.Core` merely to make it fit the platform.
- Never make `master` the implementation workspace.
- A Type B module must have an explicit renderer/lifecycle adapter and project-state adapter.
- Type A iframe tools remain supported and unchanged.

## Registry contract

`EP.AdvancedTools.register()` declares identity, family, pinned source, control schema, branding schema, media policy, output capabilities and project schema version.

## Renderer contract

Required:
- `getCanvas()`
- `render()`
- `pause()`
- `resume()`
- `resize()`
- `dispose()`

Optional:
- `getRenderer()`
- `getScene()`
- `getCamera()`
- `seek()`

## Project contract

Type B state is serialized below `config.advancedTool` while the current legacy `EP.ProjectStoreLocal` remains untouched:

```json
{
  "moduleId": "...",
  "moduleVersion": "...",
  "schemaVersion": 1,
  "config": {},
  "branding": {},
  "presentation": {},
  "media": [],
  "output": {},
  "metadata": {}
}
```

This compatibility wrapper is intentional. A future generic project schema can remove the `templateKind` compatibility field only through a separate migration.

## Infinite Display Studio PRO foundation

Canonical source:
- repo: `Juanmaes83/ESCAPARATES-INMERSIVOS-DE-IMAGEN-VIDEO`
- branch: `main`
- commit: `89ee1beb56a0c86c06366bbbb155f421e2d23981`
- blob: `f74424403b3dd276919035e86b3b0abb1c48224c`

The host fetches the immutable source through jsDelivr, derives an in-memory runtime copy and injects a narrow bridge inside the original closure. The repository source is never modified. The bridge exposes state/media/branding/renderer lifecycle while the original 12 display builders remain the implementation of the visuals.

### Current output foundation

- PNG
- WEBM from the engine canvas
- Project JSON
- output aspect/preset selection
- local project save/restore
- local version snapshots

HTML/embed/publish remain outside this foundation until persistent user-video assets and full standalone state serialization pass their own gate.
