# Infinite Worlds — Brand Expression by World V1.2

## Purpose

Turn the existing Infinite Worlds personalization proof into an art-directed branded experience. V1.2 does **not** treat VIDEO / IMAGE / LOGO / TEXT as four equivalent floating screens. Each asset has a narrative role and is translated into a different spatial language in each world.

## Protected core

V1.2 reuses the approved V1.1.2 core files for:

- `App → World → Portal`
- `WebGLRenderTarget(2048 × 2048, HalfFloatType)`
- `CameraUtils.frameCorners(...)`
- camera synchronization
- original GSAP portal transition and world swap
- OrbitControls / raycast interaction
- environmental + spatial audio
- grading / light-spill layer
- portal appearance presets

The Brand Expression layer is additive and listens to the existing `iw:brand-ready` hook. It does not replace the portal engine.

## Brand Expression model

| Asset | The Grey City | The Living Valley |
|---|---|---|
| Video | **Urban Media Wall** — large 16:9 hero media on the left architectural façade | **Landscape Cinema** — 16:9 pavilion-style media installation on the left riverbank |
| Image | **Luxury Campaign Billboard** — vertical 4:5 editorial OOH on the right façade | **Scenic Gallery Frame** — vertical gallery intervention in landscape |
| Logo | **Architectural Brand Crown** — transparent flagship-style identity above the portal | **Brand Monolith** — transparent identity inlaid into a stone environmental object |
| Text | **Spatial Typography** — large architectural sans-serif narrative | **Landscape Typography** — editorial serif land-art narrative |

### Initial world-space placement

Coordinates are expressed relative to each world's existing portal at approximately `(0, 0, 0)`.

#### City

- Hero Video: `(-10.8, +1.55, +1.75)`, approximately `10.4 × 5.85 m`, 16:9-ish media wall.
- Campaign Image: `(+10.45, +0.65, +1.72)`, approximately `4.55 × 5.70 m`, vertical editorial frame.
- Brand Crown: `(0, +8.75, +1.70)`, maximum logo field approximately `5.4 × 1.8 m`.
- Spatial Narrative: `(+7.3, +6.0, +1.85)`, approximately `7.2 × 3.9 m`, transparent typography plane.

#### Nature

- Landscape Cinema: `(-9.65, -0.85, +2.55)`, approximately `8.7 × 4.9 m`, stone-backed pavilion media.
- Scenic Gallery Frame: `(+9.45, +0.15, +2.62)`, approximately `4.35 × 5.45 m`.
- Brand Monolith: `(+6.25, -6.45, +7.60)`, physical stone object with logo field approximately `2.85 × 1.35 m`.
- Landscape Narrative: `(-6.4, -5.35, +7.15)`, approximately `6.8 × 3.4 m`, transparent editorial typography.

These are authored defaults, not user-editable 3D coordinates in this phase.

## Editorial reveal

Hero Video and Campaign Image are intentionally not given full visual weight from the initial portal-facing camera. Their material opacity increases as camera orientation moves toward their authored composition. This creates discovery through navigation rather than an animated UI reveal.

Logo and narrative typography remain more legible as the persistent brand signature.

## Video readiness contract

V1.2 does not mark video as APPLIED immediately after file selection.

The video path requires:

1. object URL created;
2. `loadedmetadata`;
3. `loadeddata` / decoded frame readiness;
4. muted `video.play()` succeeds from the user's Apply action;
5. a first video frame is observed where `requestVideoFrameCallback` is supported;
6. only then is `THREE.VideoTexture` attached and the asset considered READY / APPLIED.

If playback cannot start, the authoring layer reports an error rather than pretending that the video was applied.

## Authoring UX

- City / Nature tabs instead of two long simultaneous forms.
- Optional **USE THE SAME BRAND ASSETS IN BOTH WORLDS** mode.
- Per-role thumbnail / video / logo / copy preview.
- Placement, recommended format and creative role are stated before applying.
- States: EMPTY → LOADED → SAVED → APPLIED or ERROR.
- SAVE world → APPLY EXPERIENCE → START EXPERIENCE.
- START EXPERIENCE minimizes authoring.
- EDIT EXPERIENCE restores it.

## Explicitly excluded from V1.2

- no Focus Placement;
- no Show Placements labels;
- no draggable 3D coordinates;
- no new portal transition;
- no multiple portals / world graph;
- no Projection Mapping integration yet;
- no Flexible Media / Banderolas integration yet.

## Evaluation rule

V1.2 is not approved because files merely load. It should visually read as a branded interactive campaign / installation rather than a Three.js upload demo. Browser/runtime visual approval remains required before any merge to a stable branch.
