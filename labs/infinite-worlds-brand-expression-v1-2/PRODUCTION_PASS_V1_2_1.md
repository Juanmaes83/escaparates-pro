# Brand Expression by World — V1.2.1 Production Pass

## Scope

Correct the V1.2 implementation without changing the approved Infinite Portals core or adding new product features.

## Resolved defects

1. **Ghost / translucent campaign media**
   - Removed opacity-driven editorial reveal.
   - Hero Video and Campaign Image remain fully opaque and depth-tested.
   - Physical frames remain fully opaque.
   - Editorial attention now changes only local light intensity plus a 0.992→1.0 micro-scale.

2. **Nature missing with Same Brand Assets**
   - Same Brand mode now acts as a master brand source.
   - `SAVE MASTER BRAND` stores independent City and Nature snapshots.
   - Apply processes both saved expressions independently.
   - City/Nature status objects no longer share mutable state objects.

3. **Portal-world readability**
   - Attention treatment is applied only to the current world.
   - The other world, when rendered through the portal, receives full authored media light/readability.

4. **Nature occlusion**
   - Nature brand safe zones are cleared before installing brand-expression structures.
   - Potential procedural tree/rock/foliage occluders inside the four reserved campaign zones are hidden.

5. **Non-deterministic composition**
   - A fixed seeded `Math.random` is installed before `app.js` creates either world.
   - Reloads therefore preserve the same procedural city/nature composition for art-direction QA.

6. **Video false-positive readiness**
   - Requires `loadedmetadata` and `loadeddata`.
   - Requires successful muted playback.
   - Where `requestVideoFrameCallback` exists, callback success is mandatory; timeout is an error.
   - Fallback browsers require active playback readiness rather than a fixed delay.
   - Only after validation is `THREE.VideoTexture` installed and the asset marked APPLIED.

7. **Brand hierarchy / authored placement**
   - City Hero Media enlarged and integrated on left flagship façade.
   - City Campaign Image remains vertical editorial OOH on right.
   - City Brand Crown enlarged to a ~8.2×2.1 m logo field above the portal.
   - City Spatial Typography enlarged and remains alpha typography, not a card.
   - Nature Landscape Cinema / Scenic Gallery moved into reserved pavilion clearings.
   - Nature Brand Monolith moved into a deliberate foreground signature position.
   - Nature Landscape Typography moved into the foreground-left narrative zone.

## Production placement defaults

### City
- Hero Media: `(-11.0, +1.4, +2.35)`, `11.2 × 6.3`.
- Campaign Image: `(+10.5, +0.7, +2.30)`, `4.7 × 6.0`.
- Brand Crown: `(0, +9.3, +2.05)`, logo field `8.2 × 2.1`.
- Narrative: `(+7.1, +5.8, +2.25)`, typography field `8.4 × 4.5`.

### Nature
- Landscape Cinema: `(-9.6, -0.55, +7.8)`, `9.3 × 5.25`.
- Scenic Gallery: `(+9.4, +0.05, +7.9)`, `4.55 × 5.75`.
- Brand Monolith: `(+6.5, -5.75, +10.2)`, logo field `3.25 × 1.55`.
- Landscape Narrative: `(-6.5, -5.3, +10.3)`, typography field `7.2 × 3.8`.

## Protected / unchanged

- `App → World → Portal` transition architecture.
- `CameraUtils.frameCorners`.
- portal render target and shader pipeline.
- camera synchronization.
- GSAP crossing sequence and world swap.
- environmental/spatial audio system.
- color grading and portal appearance controls.

## Explicitly not added

- Focus Placement.
- Show Placements.
- draggable 3D editing.
- multiple portals.
- Projection Mapping.
- Banderolas / Flexible Media.

## Browser acceptance gate

Do not merge to a stable branch until browser review confirms:

1. City video/image fully visible and opaque.
2. City logo/text readable and premium.
3. Nature video/image fully visible and opaque.
4. Nature monolith/text visible.
5. Same Brand save applies both worlds.
6. Both videos pass first-frame validation and keep playing.
7. Portal view keeps the destination campaign readable.
8. City → Nature → City traversal does not lose media.
9. Refresh reproduces the same scene composition.
10. No ghost/translucent physical brand structures.
