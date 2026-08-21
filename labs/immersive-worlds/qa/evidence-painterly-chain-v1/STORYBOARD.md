# Painterly Chain — Visual Evidence Storyboard

**Experiment:** `labs/immersive-worlds/experiments/painterly-chain/`
**Stone:** 4 — Integration Proof (Isolated Lab)
**Branch:** `claude/museum-living-art-v1`
**Evidence captured:** 2026-08-21

## What This Proves

Full causal chain from procedural artwork through to living painterly surface:

```
PROCEDURAL ARTWORK (256x256, legally clean)
  → STRUCTURE TENSOR DIRECTION FIELD (per-pixel angle + confidence)
    → POISSON-DISK SEEDS (3000, density-stratified by confidence)
      → BÉZIER RIBBON STROKES (instanced 8-segment strips, direction-traced)
        → THREE-PASS IMPASTO COMPOSITE (pigment RT + height RT + GGX material)
          + DIRECTION-FIELD-COUPLED BOID MARKS (160 GPGPU boids, field-oriented)
```

Six extracted capabilities from two donor repositories wired together:
- WPF-1: Direction Field (structure tensor)
- WPF-2: Poisson Seeds (Halton quasi-random)
- WPF-3: Bézier Ribbon Strokes (instanced geometry)
- WPF-4: Impasto Material (three-pass composite)
- VGC-1/2: GPGPU Boids (GPU ping-pong simulation)
- VGC-4: Gradient-Map Recoloring (3-stop NPR ramp)

Cross-capability coupling: direction field texture sampled in boid mark vertex
shader to orient each mark along the local brush direction.

---

## Scene 1 — First Impression

**File:** `S1_first-impression.png`

Viewer sees a warm impasto painting: swirling ochre/sienna/umber Bézier
strokes following the direction field of a procedurally generated artwork.
The three-pass impasto composite gives visible height, specular highlights
from GGX microfacet material, and canvas texture. In the center area, a
subtle cooler-toned haze reveals the living boid marks — slightly
blue-shifted "wet paint" marks drifting across the surface.

**What to look for:** The warm painterly surface with visible swirl
structure. The faint cool-toned area in the center where living marks
cluster. The impasto specular highlights along stroke edges.

---

## Scene 2 — Temporal Evidence (Living Marks in Motion)

**Files:** `S2_temporal-00.png` through `S2_temporal-03.png`
**Interval:** ~1.5 seconds between frames

Four frames captured across ~6 seconds of animation. The static Bézier
strokes remain fixed (they are rendered once to off-screen targets). The
living boid marks — visible as a subtly cooler-toned collective — drift and
reorganize between frames as the GPGPU flock simulation evolves.

**What to look for:** Compare temporal-00 to temporal-03. The shape and
position of the cool-toned mark cluster shifts. The underlying painted
strokes do not change — only the living layer moves. This proves the
animation is real flock movement, not visual noise.

---

## Scene 3 — Pointer Interaction (Center)

**File:** `S3_pointer-center.png`

Pointer placed at canvas center (640, 400). The boid simulation's predator
avoidance drives marks outward from the pointer position. The center area
clears as marks scatter, with the flock redistributing to the surrounding
painted surface.

**What to look for:** Compared to S2 frames, the center area is clearer —
the cool-toned living marks have fled the pointer. The predator-avoidance
force creates a visible gap where the pointer sits.

---

## Scene 4 — Pointer Interaction (Corner)

**File:** `S4_pointer-corner.png`

Pointer moved to upper-left corner (200, 150). The flock scatters from the
new predator position. Marks cluster away from the corner, gathering in
the center and right side.

**What to look for:** Compare to S3 — the clear zone has shifted from
center to upper-left. The flock spatial redistribution proves pointer
interaction is spatially accurate, not just a global effect.

---

## Scene 5 — Relaxed (Pointer Away)

**File:** `S5_relaxed.png`

Pointer moved off-screen (1300, 900). Without predator pressure, the flock
relaxes to its natural distribution — cohesion, alignment, and separation
forces balance. The living marks return to the painting surface.

**What to look for:** The mark distribution returns to a natural clustering
pattern similar to S1, confirming the boid simulation recovers from
predator displacement.

---

## Scene 6 — Status Readout

**File:** `S6_status-readout.png`

Status bar at bottom-left confirms: "Chain active — 3000 strokes, 160
living marks". The proof state object (`window.__painterlyChainProof`) is
verified by the capture script and recorded in `manifest.json`.

---

## Technical Notes

- **Artwork:** 256x256 procedural generation with 4 swirl centers. No donor
  assets used — legally clean.
- **Strokes:** 3000 Bézier ribbon instances, 8 segments each, traced through
  direction field via RK2-like integration.
- **Impasto:** Three render passes — stroke pigment (1024x1024 HalfFloat),
  stroke height (1024x1024 HalfFloat, additive blend), full-screen composite
  with GGX specular + Sobel normals + clearcoat + canvas weave.
- **Boids:** 14x14 GPU texture grid, 160 active agents, ping-pong FBO
  simulation via GPUComputationRenderer.
- **Living marks:** Instanced quads (2.2:1 aspect ratio, scale 36), vertex
  shader samples direction-field texture for rotation. Subtle cool temperature
  shift (wet-paint effect: r×0.92, g×1.0, b×1.3+0.08) distinguishes them from
  static warm strokes. Dark contour ring aids individual mark readability.
  Wet-center specular highlight. Alpha: 0.20 + confidence × 0.32.
- **Boid tuning:** separation=28, alignment=22, cohesion=14 — separation
  dominates to spread marks across the painting surface.
- **Cross-coupling:** `dirFieldTex` uniform in boid mark vertex shader — same
  texture that drove stroke placement now drives mark orientation.

## Automated Test Coverage

- 35 painterly capability tests (direction-field, poisson, bezier-strokes,
  impasto-material)
- 21 experiment integration tests (causal chain steps, cross-coupling,
  file references)
- All 56 tests PASS

## Known Limitations (Stone 4 scope)

1. Individual boid marks are more visible as a collective living haze than
   as separately discernible brushmarks in static screenshots. In live
   animation, the movement makes individual marks more apparent.
2. Boid cohesion causes marks to cluster in the center. Adjustable via
   separation/cohesion force balance — a Stone 5 tuning concern.
3. The cool temperature shift is subtle by design (museum-appropriate).
   More aggressive contrast is possible but would break the painterly
   integration aesthetic.
4. Procedural test artwork is intentionally abstract. Real Museum artwork
   integration is Stone 5+ scope.
