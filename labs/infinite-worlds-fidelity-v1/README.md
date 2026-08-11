# Infinite Worlds — Fidelity V1

Internal fidelity proof for Escaparates Pro / Immersive Worlds.

## Goal

Reproduce the demonstrated mechanics of Karim Maaloul's **Infinite Portals** before refactoring or inventing a different portal experience. V1 deliberately preserves the reference architecture and motion model while replacing the original desert/forest art direction with two strongly antagonistic worlds:

- **The Grey City** — dense blue-grey city canyon, traffic, concrete, cold windows, street lights, smog and industrial excess.
- **The Living Valley** — green terrain, river, rocks, trees, flowers, birds, fireflies, waterfall and warm natural light.

## Mechanics intentionally preserved

- `App → World → Portal` architecture.
- Two complete Three.js scenes and two cameras.
- `WebGLRenderTarget(2048 × 2048, HalfFloatType)`.
- Portal shader with radial noise, waves, UV displacement, highlights, border greyscale and reddish fringe.
- `Portal.updateCorners()` and `CameraUtils.frameCorners(...)` for off-axis portal perspective.
- Render order: target world → portal render target → current world.
- Camera position/quaternion synchronization between worlds.
- Raycaster hover → `effectMultiplier` boost.
- Click → original three-phase transition model.
- `Power4.easeIn` approach / virtual-world transform.
- `switchWorlds()`.
- `Power4.easeOut` restoration to origin.
- Infinite bidirectional traversal.

## What changed in V1

Only the art/world construction and light UI layer. Worlds are generated procedurally in `app.js` so the proof is self-contained and does not require new proprietary GLB assets.

The city portal is presented as a monumental **window** in a polluted urban wall. The reverse portal is a stone opening inside the natural valley.

## Controls

- Drag: orbit.
- Scroll: zoom.
- Hover portal: increase portal disturbance.
- Click portal: cross to the other world.

## Reference and attribution

Mechanics are intentionally derived from the provided Infinite Portals reference by Karim Maaloul / Yakudoo:

- CodePen: `https://codepen.io/Yakudoo/pen/PogJvGv`
- User-provided gist snapshot: `https://gist.github.com/Juanmaes83/9c9ae4d788b12be6de8613eaf6a1beff`
- CodePen license link supplied with the gist: `https://codepen.io/license/pen/PogJvGv`

This directory is an isolated internal evaluation slice. Do not merge to `master` until visual/runtime approval.
