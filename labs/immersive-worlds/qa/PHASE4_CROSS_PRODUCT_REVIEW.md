# PHASE 4 — Cross-Product Capability Review

Date: 2026-08-21
Branch: claude/immersive-worlds-module-c0d3f7

## Shared Capability Code (engine/capabilities/)

These six capabilities are product-agnostic modules. Both products import
and consume them identically:

| Capability | File | Export | Consumed by EP | Consumed by Museum |
|---|---|---|---|---|
| Direction field (WPF-1) | `engine/capabilities/painterly/direction-field.js` | `buildDirectionField` | Yes (inline) | Yes (import) |
| Poisson seeds (WPF-2) | `engine/capabilities/painterly/poisson-seeds.js` | `generatePoissonSeeds` | Yes (inline) | Yes (import) |
| Bezier strokes (WPF-3) | `engine/capabilities/painterly/bezier-strokes.js` | `buildStrokesFromField`, shaders | Yes (inline) | Yes (import) |
| Impasto material (WPF-4) | `engine/capabilities/painterly/impasto-material.glsl.js` | Vertex/fragment shaders, uniforms | Yes (inline) | Yes (import) |
| GPGPU boids (VGC-1/2) | `engine/capabilities/gpgpu-boids/boids-simulation.js` | `BoidsSimulation` class | Yes (inline) | Yes (import) |
| Gradient-map (VGC-4) | `engine/capabilities/painterly/gradient-map.glsl.js` | GLSL declarations/function | Imported | Imported |

## Destination-Specific Adapters

### Escaparates Pro — `labs/website-modules-source/living-art-pro/index.html`

- Standalone HTML module loaded via EP iframe system
- Inlines all capability code (vendored Three.js r0.128.0 via CDN)
- Own UI: 9 semantic controls, 3 view modes, dark editor panel
- Own media: drag-drop image upload, procedural fallback
- Own preview: full-viewport canvas, pointer interaction for boids
- Registration bridge: `js/website-modules-living-art-pro.js`

### Museum — `labs/immersive-worlds/app/nested/living-art/living-art-guest.js`

- Nested runtime guest class (Pattern B, matches BreezeGuest)
- Imports capabilities via ESM from engine/capabilities/
- Uses vendored Three.js r0.185.1 (Museum's own vendor)
- No own UI — Museum HUD remains authoritative
- No own camera — receives pose from Museum via setCameraPose
- No own media (yet) — procedural artwork, user image via Phase 5+
- Registration: `nested-room-controller.js` registers factory

## Key Differences Between Adapters

| Aspect | EP Module | Museum Guest |
|---|---|---|
| Three.js version | r0.128.0 (CDN) | r0.185.1 (vendored ESM) |
| UI controls | 9 sliders/toggles | None (Museum HUD) |
| Camera authority | Self (orbit, modes) | Museum (setCameraPose) |
| Media input | Drag-drop image | Procedural (for now) |
| Rendering | Direct to canvas | Scene graph, 3D quad in room |
| Impasto composite | Full-screen post-process | RT pass, then MeshBasicMaterial on plane |
| Boid display | Points overlay on canvas | Points in 3D scene |
| Lifecycle | Init/destroy on module load | prepare/activate/update/dispose guest contract |

## Assessment

The capability code is cleanly shared. Both adapters call the same
functions with the same signatures. No premature framework needed.

The main architectural difference is rendering strategy:
- EP renders everything flat (2D canvas, ortho camera for strokes, full-screen composite)
- Museum renders into a 3D scene (strokes to RT, composite to RT, display on 3D plane, boids as 3D points)

This separation is correct and intentional — each product needs its own
rendering context. The capabilities themselves (field computation, seed
generation, stroke tracing, boid simulation) are pure data transforms
that work identically in both contexts.

No changes recommended at this stage.
