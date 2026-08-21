# Human Review Map — Living Painting Capability Proof

**PRODUCT APPROVAL: PENDING**

---

## Delivery Details

| Field | Value |
|-------|-------|
| Branch | `claude/museum-living-art-v1` |
| Commit | `dd92c3d` |
| Evidence folder | `labs/immersive-worlds/qa/evidence-living-art-v1/` |
| Experiment entry | `labs/immersive-worlds/experiments/living-painting/index.html` |
| Test (14/14 PASS) | `labs/immersive-worlds/experiments/living-painting/living-painting.test.mjs` |

---

## CHANGE — What Was Built

Four generic capabilities were extracted from two donor repositories
(wet-paint-flow, van-gogh-crows) using the Sculpt+Graft method:

1. **GPGPU Boids Flocking** — GPU ping-pong simulation via GPUComputationRenderer.
   680 agents with separation/alignment/cohesion, predator avoidance (pointer),
   multi-obstacle support. Content-agnostic (no creature geometry).

2. **Structure Tensor Direction Field** — CPU analysis producing per-pixel
   brush angle and confidence. Pure computation, zero Three.js dependency.

3. **Poisson-Disk Seeding** — Blue-noise spatial distribution with 3-layer
   density hierarchy. Pure CPU, zero Three.js dependency.

4. **Gradient-Map Recoloring** — GLSL 3-stop NPR color ramp. Transforms
   luminance into painterly shadow/midtone/highlight palette.

These four capabilities were combined in a standalone experiment ("Living
Painting") that renders 680 interactive particle-strokes with warm oil-paint
palette, flocking behavior, and visitor-responsive avoidance.

---

## OPEN — To Run the Experiment Yourself

```bash
# From the repository root on branch claude/museum-living-art-v1:

# 1. Start a local static server (any will do):
npx serve . -p 4200

# 2. Open in browser:
#    http://localhost:4200/labs/immersive-worlds/experiments/living-painting/index.html

# 3. Move your mouse — particles flee the cursor.
#    Move away — they relax back.

# Or run the automated test:
node labs/immersive-worlds/experiments/living-painting/living-painting.test.mjs
```

---

## GO TO — What to Look At

1. **`S3_pointer-center.png`** — The hero shot. Move your pointer to center
   and watch the flock form a ring. This is the strongest evidence of the
   "living" interaction.

2. **`S2_temporal-00.png` through `S2_temporal-04.png`** — Flip between these
   to see the breathing motion. The flock shifts and reshapes organically.

3. **`S1_first-impression.png`** — First impression. Does this read as paint
   or as particles? That is the core visual judgment.

---

## DO — What Juanma Must Judge

1. **Does the warm palette feel like oil paint or like a screensaver?**
   The gradient-map recoloring uses shadow #3d200a / midtone #c98b3e /
   highlight #fff0c8. Does this palette suit the Museum's visual identity?

2. **Is the pointer interaction compelling enough for a visitor?**
   When the cursor enters, particles flee. When it leaves, they return.
   Does this feel like a painting responding to presence, or like a tech demo
   responding to input?

3. **Is this capability set worth carrying forward to Stone 5 (Museum
   SceneKit integration)?** The four capabilities are extracted, tested (29
   unit tests + 14 integration tests), and proven combinable. But integration
   into the Museum vertical means connecting them to real artwork textures,
   the SceneKit contract, and the runtime update loop.

---

## LOOK FOR — Specific Things to Notice

- **Size variation**: particles range from small peripheral scouts to large
  slow-moving dabs in the dense core
- **Phase-driven breathing**: individual particles pulse in opacity
- **Asymmetric scatter**: when pointer is off-center, the flock streams away
  asymmetrically (emergent from flocking rules, not scripted)
- **Warm-to-cool gradient**: faster particles are brighter (cream), slower
  ones are deeper (amber)

---

## MUST NOT CHANGE

- **Do not modify donor repositories** (wet-paint-flow, van-gogh-crows)
- **Do not modify main/master**
- **Do not modify `integration/museum-full-studio-three-room-v1`**
- **Do not modify `claude/immersive-worlds-module-c0d3f7`** (protected baseline)

---

## KNOWN LIMITATIONS

1. **No underlying painting.** The particles float on a dark void. "Living
   Painting" as a product needs a painting surface — an artwork image, a
   procedural canvas, or a Museum exhibit background. This is Stone 5 work.

2. **Particles are dabs, not brushstrokes.** The direction-field capability
   is computed but not yet visually expressed as stroke elongation/rotation.
   The particles are soft circles, not oriented marks.

3. **Composition is centered.** ~40% of the viewport is used. Full-frame
   painterly coverage requires either more particles or a different spatial
   distribution strategy.

4. **No depth/layering.** All particles render on a single plane with no
   z-order variation. Real paint has impasto/glaze depth.

5. **Synthetic direction field.** The 64x64 field is computed from a
   procedural radial gradient, not from a real artwork image.

6. **VGC art assets are BLOCKED.** The Van Gogh Crows sprite atlas and sky
   texture cannot be ported without rights clearance (Human decision required).

---

## RETURN

**Choose one:**

- **KEEP** — The capability proof demonstrates that the four extracted modules
  work together, respond to visitor input, and produce a warm painterly
  aesthetic. Proceed to Stone 5 (Museum SceneKit integration) on the existing
  `claude/museum-living-art-v1` branch.

- **ADJUST** — The visual quality or interaction needs specific changes before
  proceeding. Provide specific visual direction (e.g., "particles need to be
  elongated brushstrokes", "palette should be cooler", "need full-frame
  coverage").

- **REJECT** — The capability extraction approach is wrong. Do not proceed
  with this integration path.

---

_This review map was produced as part of the Museum Living Art Sculpture
Capability Mission V1. All work remains on an isolated capability-development
branch. No production branches were modified._
