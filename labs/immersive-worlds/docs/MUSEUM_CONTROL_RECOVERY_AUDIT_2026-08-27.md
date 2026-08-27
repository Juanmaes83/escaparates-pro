# MUSEUM CONTROL RECOVERY AUDIT — 2026-08-27

## Mission
Recover one canonical Museum in which the visitor can navigate the vestibule plus the four principal rooms in both first person and third person, while preserving Studio room authoring and Avatar Studio authoring. Do not merge this recovery branch until the full human gate passes.

## Protected source / rollback
- Canonical before recovery: `3581ec4de483933c2787480607a863f7617713ac`
- Phase 5 rollback checkpoint: `6c007f4f314a4d21ed0ffcac9b6b387db454490a`
- Phase 6 candidate checkpoint: `3d1b18450c1aaed03062bf47d04254b129518c82`
- Recovery branch: `repair/museum-control-recovery-v1`

## Finding 1 — boot failure is not WebGL and not a Character merge failure
The visible error is INV-6 from `engine/schema/validate.js`: semantic records may not contain render implementation keys such as `material`.

The base `worlds/museum-v1.world.json` did not change between the known-good checkpoint `4fbca599...` and canonical `3581ec4...`. Therefore the recent Character consolidation did not inject the failing `material` fields into the repository World file.

### Actual failing seam
`app/experience-app.js` loads the base world, then loads persisted Studio data from `ConfigStore`, normalises it, applies it through `applyConfigToWorld()`, and only then constructs `Runtime`.

`authoring/experience-config.js` Schema 3 contains entity presentation fields including `presentation.material`. `applyConfigToWorld()` copies the whole authored presentation object into `entity.content.presentation`. Because INV-6 scans recursively, any authored entity carrying that object fails validation even when `material` is an empty string.

`authoring/config-store.js` persists this data under `iw.museum.authoring.v1`, so the defect can remain latent in a fresh browser and then appear after Studio has authored/saved entity data.

### Provenance
The presentation domain was introduced by commit `338f588ee5e8b0fa6755120735d0ad7ea6dd3176` (`integration: port Full Museum Studio Phase 2 capabilities from donor branch`). Its own change log explicitly added entity presentation metadata (`frame, mount, material, finish, glass, etc.`).

### Correct repair
Do not weaken INV-6 and do not delete the user's persisted Studio project. Keep presentation data in the authoring configuration, but stop injecting forbidden render-implementation keys into the semantic World. Only sanctioned semantic representation hints that Scene Kit actually consumes may be projected into `entity.representation.hints`.

## Finding 2 — first-person World topology is still present
The canonical World still declares:
- `space.lobby`
- `space.gallery-a`
- `space.gallery-b`
- `space.breeze`
- `space.itinerant-wet-paint`
- extra archive/listening space

Gallery B still declares portals to Gallery A, Breeze and Itinerant. The Breeze and Itinerant return portals remain present.

Historical commit `0382cef074402b8c646f52dbc5294e70f4de18dd` explicitly fixed the Gallery B topology so the three exits occupy different walls (west Gallery A, east Breeze, south Itinerant) and recorded QA for four-room navigation and return paths.

Conclusion: the first-person topology has not been deleted. It is currently blocked upstream by the authored-world validation failure.

## Finding 3 — third-person continuity is incomplete by design
`character/museum-character-phase4b.js` only lists two supported Character continuity portals:
- `portal.gallery-a-gallery-b`
- `portal.gallery-b-gallery-a`

All other portal traversals delegate to the original Museum runtime without rebinding the Character root/navigation/camera session to the destination space.

Therefore the current implementation does NOT satisfy full third-person continuity across vestibule + Gallery A + Gallery B + Breeze + Itinerant.

This is a real scope gap, not a new regression caused by consolidation.

## Finding 4 — Breeze is a protected nested runtime
`museum-character-tour-bridge.js` marks `space.breeze` as a protected nested space and uses PARK/SUSPEND behavior, including hiding the Character root while the specialized nested runtime owns presentation.

That policy is compatible with a protected nested-room architecture but does NOT satisfy the new product requirement that Breeze itself be navigable in third person with Character visible.

A deliberate Breeze 3P integration seam is therefore required; it must not create simultaneous competing render/camera authorities.

## Finding 5 — room authoring exists, but visual authoring is not equivalent to full visual control
Studio Phase 2 creates canonical per-room config and exposes room accessibility controls; the base Studio room editor also remains the owning editor surface. All spaces are present in the Studio world tree.

However the Schema 3 `presentation` data is currently the source of the boot defect, and much of it is not consumed by `MuseumSceneKit`. `MuseumSceneKit` reads sanctioned `entity.representation.hints` (for example `mount`) rather than `content.presentation.material`.

Therefore we must distinguish:
- room/content metadata editing: implemented;
- accessibility editing: implemented;
- media/content replacement: implemented;
- full visual material/finish/frame realization: not fully wired to Scene Kit and must not be claimed complete merely because the fields exist in Studio.

## Finding 6 — Avatar Studio survives but advanced action visibility needs a separate UI check
Phase 5 Avatar Studio remains mounted from `index.html`. Its Motion Foundation V2 panel exposes the six base preview actions (IDLE, WALK, STOP, TURN L/R, JUMP). Phase 6 Gate A adds runtime social/semantic actions (WAVE, GOODBYE, NOD, WELCOME, IR, MIRAR, APUNTAR, AFTER YOU).

If only the six base buttons are visible when Gate A is requested, that is a mounting/rendering defect to debug after boot recovery. Advanced donor capabilities that require physical context are not product buttons merely by existing in the capability registry.

## Recovery order — no parallel speculative edits
1. Restore boot contract without deleting persisted Studio data and without weakening INV-6.
2. Prove first-person navigation: Lobby → Gallery A → Gallery B → Breeze → Gallery B → Itinerant → Gallery B, plus return to Lobby.
3. Extend one Character continuity seam across the same topology for third person.
4. Design Breeze 3P handoff/hosting so Character remains visible while preserving one active presentation/camera authority.
5. Verify Studio can select and edit every principal room and its content without producing an invalid authored World.
6. Verify Avatar Studio and Gate A controls mount against the same runtime Character.
7. Human final gate in both 1P and 3P.

## Merge gate
DO NOT MERGE recovery branch until all are human-confirmed:
- boot without INV-6;
- vestibule + four principal rooms reachable in 1P;
- same topology reachable in 3P;
- Breeze entry/exit in 3P without duplicate renderer/camera/Character authority;
- Itinerant/Wet Paint entry/exit in 3P;
- Studio editing works for each room without corrupting semantic data;
- Avatar Studio loads, edits and preserves one Character;
- no transition to VECINIA / Full World;
- no frozen donor edits.
