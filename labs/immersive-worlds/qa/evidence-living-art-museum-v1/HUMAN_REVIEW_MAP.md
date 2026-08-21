# PHASE 3 — Museum Living Art: Human Review Map

Status: READY FOR HUMAN REVIEW
Date: 2026-08-21
Branch: claude/immersive-worlds-module-c0d3f7

## What Was Built

Living Art guest class for the Museum nested runtime system. The guest
follows the BreezeGuest contract exactly: prepare, activate, setCameraPose,
update, dispose, report. It uses all six sculpted capabilities to render a
procedural artwork as a living impasto painting inside a Museum room.

**Pattern used:** Nested Runtime (Pattern B) — same as Breeze.
**Camera rule:** MUSEUM DECIDES CAMERA. THE GUEST RENDERS IT.
**No input listeners on guest.** Pointer tracked only for boid predator.

## Files Created / Modified

### Created
- `labs/immersive-worlds/app/nested/living-art/living-art-guest.js`
  LivingArtGuest class (~410 lines). Full pipeline: direction-field,
  Poisson seeds, Bezier strokes (InstancedBufferGeometry), impasto
  composite (full-screen pass to RT, displayed on 3D plane), GPGPU boids,
  boid mark particles.

### Modified
- `labs/immersive-worlds/app/nested/nested-room-controller.js`
  Added import and `host.register('room.living-art', ...)`.
- `labs/immersive-worlds/worlds/museum-v1.world.json`
  Added space.living-art, 5 anchors, 1 entity, 2 bidirectional portals.
  Gallery B door anchor and portal added. JSON validated.

## QA Results

Pipeline test: PASS
- prepare: OK
- activate: OK (shaders compile, pipeline builds)
- setCameraPose: OK (Museum camera pose applied)
- 140 frames rendered: OK
- report: OK

Stats: 3000 strokes, 160 boids, 6 capabilities, 4 camera poses received.

## Screenshot Index

| File | What It Shows |
|------|---------------|
| S1_combined_default.png | Combined mode — impasto painting + boid particles, default camera |
| S2_closeup_painting.png | Close-up of painting — brushstroke detail, canvas texture visible |
| S3_painterly_only.png | Painterly mode — impasto only, no boid marks |
| S4_living_only.png | Living mode — boids only (faint additive particles on dark bg) |
| S5_installation_wide.png | Wide installation view — painting as 3D quad in dark room, boid glow visible |
| S6_final_state.png | Final state after 140 frames — painting + active boid particles |

## Capabilities Verified

1. Direction field (WPF-1) — swirling stroke alignment follows procedural gradient
2. Poisson seeds (WPF-2) — 3000 seeds distributed across the surface
3. Bezier ribbon strokes (WPF-3) — InstancedBufferGeometry, 3 brush layers
4. Impasto material (WPF-4) — Sobel normals, GGX specular, canvas weave, wet/dry
5. GPGPU boids (VGC-1/2) — 160 active agents, flocking simulation on GPU
6. Gradient-map recoloring (VGC-4) — imported, available for runtime use

## Constraints Checklist

- [x] No modifications to main/master
- [x] No modifications to donor repos
- [x] No modifications to museum-full-studio-three-room-v1
- [x] Museum baseline not destabilized (guest is additive, registered in controller)
- [x] Breeze not rebuilt
- [x] No second WorldGraph, CameraAuthority, or global authority
- [x] Guest has no input listeners for camera
- [x] Guest receives camera pose from Museum (setCameraPose)
- [x] No secrets in repository
- [x] No fixed bearer tokens
- [x] Donors read-only
- [x] PRODUCT APPROVAL: PENDING

## Known Limitations

- Boid marks are faint in living-only mode against dark background (additive blending)
- Procedural artwork only (no user image upload yet — Phase 4 scope)
- Impasto composite is rendered once at activate time (static lighting)
- SwiftShader (headless CI) renders slightly differently from real GPU
