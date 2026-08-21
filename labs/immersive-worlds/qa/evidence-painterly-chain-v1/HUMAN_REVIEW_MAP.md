# Human Review Map — Painterly Chain: Full Causal Pipeline Proof

**PRODUCT APPROVAL: PENDING**

---

## Delivery Details

| Field | Value |
|-------|-------|
| Branch | `claude/museum-living-art-v1` |
| Commit | `2638a07` |
| Evidence folder | `labs/immersive-worlds/qa/evidence-painterly-chain-v1/` |
| Experiment entry | `labs/immersive-worlds/experiments/painterly-chain/index.html` |
| Tests (56/56 PASS) | painterly-chain.test.mjs (21) + painterly.test.mjs (35) |
| Storyboard | `labs/immersive-worlds/qa/evidence-painterly-chain-v1/STORYBOARD.md` |

---

## CHANGE — What Was Built (Stone 4)

Six capabilities extracted from two donor repositories, wired into a single
experiment proving the complete causal chain:

```
PROCEDURAL ARTWORK (256x256, legally clean)
  → DIRECTION FIELD (WPF-1: structure tensor analysis)
    → POISSON SEEDS (WPF-2: 3000 density-stratified seeds)
      → BEZIER RIBBON STROKES (WPF-3: instanced 8-segment strips)
        → IMPASTO COMPOSITE (WPF-4: three-pass GGX material)
          + LIVING BOID MARKS (VGC-1/2: 160 GPGPU agents)
            + GRADIENT-MAP RECOLORING (VGC-4: NPR color ramp)
```

**New since prior Living Painting proof (4 capabilities):**
- WPF-3 Bezier strokes: direction-field-traced cubic Bezier ribbons with
  variable-width pressure, bristle wobble, fiber simulation, pigment break
- WPF-4 Impasto material: three-pass pipeline — stroke pigment RT, stroke
  height RT (additive), full-screen composite with GGX specular, Sobel
  normals, clearcoat, canvas weave

**Cross-capability coupling proven:** Direction field texture sampled in
boid mark vertex shader — living marks orient along local brush directions.

---

## OPEN — To Run the Experiment

```bash
# From repository root on branch claude/museum-living-art-v1:

# 1. Start local static server:
npx serve . -p 4200

# 2. Open in browser (trailing slash required):
#    http://localhost:4200/labs/immersive-worlds/experiments/painterly-chain/

# 3. Watch the painting — living marks drift across the impasto surface.
#    Move your mouse — marks scatter from the cursor.
#    Move away — they return to the painting.

# 4. Run automated tests:
node labs/immersive-worlds/experiments/painterly-chain/painterly-chain.test.mjs
node labs/immersive-worlds/engine/capabilities/painterly/painterly.test.mjs
```

---

## GO TO — What to Look At

1. **`S1_first-impression.png`** — The hero shot. A warm impasto painting with
   3000 direction-traced Bezier strokes. The living marks appear as a subtle
   cooler-toned layer — "wet paint" drifting across "dry strokes."

2. **`S2_temporal-00.png` vs `S2_temporal-03.png`** — Flip between these to see
   the living marks move. The static strokes stay fixed; only the living layer
   shifts. This is the strongest temporal evidence.

3. **`S3_pointer-center.png`** — Pointer at center causes marks to scatter.
   Compare to S1 — the center area clears as marks flee the predator.

4. **`S4_pointer-corner.png`** — Pointer at upper-left corner. Marks scatter
   asymmetrically from the new position. Spatially accurate avoidance.

---

## DO — What Juanma Must Judge

1. **Does the impasto painterly surface feel like oil paint?**
   3000 Bezier ribbon strokes with height/specular from the three-pass
   composite. The warm ochre/sienna/umber palette with visible brush texture —
   does this read as "painting" or as "digital rendering"?

2. **Are the living marks perceptible as a living quality?**
   The boid marks have a subtle cool temperature shift (wet-paint effect).
   In animation, they drift along the direction field. In stills, they appear
   as a faint cooler-toned haze. Is this level of subtlety appropriate for a
   museum installation, or do the marks need to be bolder?

3. **Is the six-capability causal chain worth carrying to Stone 5?**
   All six capabilities are proven combinable. Integration into Museum
   SceneKit means connecting to real artwork textures, the SceneKit contract,
   and the runtime update loop. Is the visual quality sufficient to justify
   that investment?

---

## LOOK FOR — Specific Things to Notice

- **Stroke direction alignment**: strokes follow the swirl structure of the
  procedural artwork (direction-field → stroke trace coupling)
- **Impasto surface quality**: specular highlights along stroke edges, visible
  canvas texture in lighter areas, height variation in dark/thick regions
- **Living mark temperature shift**: marks are subtly cooler than the warm
  strokes — a "wet paint on dry" effect
- **Temporal movement**: the mark cluster shifts position between S2 frames
- **Pointer interaction**: marks scatter spatially from the cursor position

---

## KNOWN LIMITATIONS (Stone 4 scope — expected)

1. **Individual boid marks are subtle in stills.** The living quality is more
   apparent in animation than in screenshots. Individual mark shapes (elongated
   2.2:1, direction-aligned) blend into a collective haze at full canvas scale.
   This is a Stone 5 visual polish item.

2. **Procedural test artwork.** The 256x256 swirl pattern is legally clean but
   abstract. Real Museum artwork integration is Stone 5+ scope.

3. **Boid spatial distribution.** Even with increased separation (28 > cohesion
   14), marks tend to cluster centrally. Full-surface coverage tuning is Stone 5.

4. **No SceneKit integration.** This runs as a standalone experiment, not as a
   Museum scene. SceneKit wiring is Stone 5.

5. **VGC art assets remain BLOCKED.** Van Gogh Crows sprite atlas and sky
   texture cannot be used without rights clearance.

---

## MUST NOT CHANGE

- Do not modify donor repositories (wet-paint-flow, van-gogh-crows)
- Do not modify main/master
- Do not modify `integration/museum-full-studio-three-room-v1`
- Do not modify `claude/immersive-worlds-module-c0d3f7` (protected baseline)

---

## RETURN

**Choose one:**

- **KEEP** — The six-capability causal chain demonstrates that the extracted
  painterly + living-art modules work together end-to-end. Proceed to Stone 5
  (Museum SceneKit integration) with real artwork textures.

- **ADJUST** — The visual quality needs specific changes. Provide direction
  (e.g., "marks need to be individually visible", "palette needs warmth
  adjustment", "need stronger living movement").

- **REJECT** — The integration approach is wrong. Do not proceed.

---

_Stone 4 — Integration Proof. Museum Living Art Sculpture Capability Mission V1.
All work on isolated `claude/museum-living-art-v1` branch. No production
branches modified. PRODUCT APPROVAL: PENDING._
