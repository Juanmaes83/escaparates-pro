# Living Painting — Visual Evidence Storyboard

**Branch:** `claude/museum-living-art-v1`
**Experiment:** `labs/immersive-worlds/experiments/living-painting/`
**Viewport:** 1280 x 720 (16:9 institutional display)
**Evidence captured:** 2026-08-21
**Runtime errors:** 0

---

## Scene 1: First Impression

**File:** `S1_first-impression.png`

What the visitor sees on arrival. After 2 seconds of simulation settling, 680
warm-toned paint dabs cluster in an organic cloud against a dark umber
background. The particles show visible size variation (jitter + velocity-driven
scaling) and soft feathered edges. A subtle central void hints at the
obstacle — an invisible artwork presence that the particles orbit around.

**Claim tested:** Does the first impression read as painterly rather than
technical?

**Assessment:** The warm amber/cream palette and soft falloff read as paint on
dark canvas. Individual particles are distinguishable but overlap creates
denser, richer zones. The size variation prevents uniformity. It no longer
reads as a screensaver.

---

## Scene 2: Temporal Sequence (Motion Proof)

**Files:** `S2_temporal-00.png` through `S2_temporal-04.png` (5 frames, 400ms apart)

These five frames prove the painting is alive. Comparing frame 00 to frame 04:
- The flock mass has shifted position
- Individual particle clusters have reorganized
- The overall silhouette has changed shape (the breathing)
- Some particles have moved from the dense core to the periphery

**Claim tested:** Is the motion organic or mechanical?

**Assessment:** The movement is driven by GPGPU flocking rules
(separation/alignment/cohesion), which produces organic-feeling redistribution
rather than linear translation. The flock "breathes" — it expands and
contracts rhythmically as boid forces balance. This is the core Living Painting
behavior.

---

## Scene 3: Visitor Response (Pointer Interaction)

**Files:** `S3_pointer-center.png`, `S3_pointer-corner.png`, `S3_pointer-away.png`

Three states of visitor proximity response:

1. **Pointer at center** — The flock forms a dramatic ring/torus as particles
   flee the cursor position. The void is clean and immediate. The ring formation
   is visually striking — it looks like paint clearing a space around the
   visitor's attention.

2. **Pointer at top-left corner** — The flock has streamed away from the corner,
   creating an asymmetric elongated cloud. The shape is dynamic and organic —
   the flock's internal cohesion prevents it from simply scattering.

3. **Pointer away (relaxation)** — The flock has returned toward center and
   re-formed into a denser cluster. Recovery is visible but not instantaneous.

**Claim tested:** Does visitor proximity feel like interacting with a living
surface rather than clicking a UI?

**Assessment:** The interaction is the strongest visual evidence. The ring
formation in pointer-center is genuinely beautiful — it reads as a painting
responding to the viewer's gaze. The asymmetric scatter in pointer-corner
shows the flocking rules creating emergent behavior, not scripted animation.
The relaxation proves the system has memory — it returns to equilibrium.

---

## Scene 4: Particle Density

**File:** `S4_particle-density.png`

Close-up of particle distribution at rest. Shows the three sizes of particles
(small peripheral scouts, medium mid-density, large slow-moving core) created
by the sizeJitter attribute and velocity-driven scaling.

**Assessment:** Density is improved after adjustment (680 particles vs original
420). The core is dense enough to create visual mass. Peripheral particles
provide softness and atmosphere. The gradient-map recoloring (shadow: #3d200a,
midtone: #c98b3e, highlight: #fff0c8) at 95% strength produces a consistent
warm oil-paint palette.

---

## Scene 5: Status Readout

**File:** `S5_status-readout.png`

Technical confirmation: "Living Painting active — 680 particles, 500 stroke seeds"

All four capabilities confirmed active: gpgpu-boids, direction-field,
poisson-seeds, gradient-map.

---

## Storyboard Summary

| Scene | Claim | Evidence quality |
|-------|-------|-----------------|
| S1 | Painterly first impression | IMPROVED — reads as paint, not pixels |
| S2 | Living motion | CONFIRMED — organic flock breathing visible across frames |
| S3 | Visitor response | STRONG — ring formation is visually compelling |
| S4 | Density and palette | IMPROVED — warm palette, size variation, soft edges |
| S5 | Technical state | CONFIRMED — all capabilities active, zero errors |
