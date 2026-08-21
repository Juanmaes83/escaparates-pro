# Museum Living Art — Donor Archaeology Checkpoint V1

**Mission**: Museum Living Art / Responsive Art Capability Sculpt + Graft  
**Branch**: `claude/museum-living-art-v1`  
**Date**: 2026-08-21  
**Status**: CHECKPOINT — PRODUCT APPROVAL: PENDING  
**Stage**: Stone 2 (Capability Map Proven)

---

## 1. Verified Donor SHAs

| Donor | Repository | Pinned SHA | Verified |
|-------|-----------|------------|----------|
| Wet Paint Flow | `Juanmaes83/wet-paint-flow` | `0b9ba9a5be665f3a2a8b2450945ec5006e61e2de` | Yes |
| Van Gogh Crows | `Juanmaes83/van-gogh-crows` | `1240c1feb2983c945c81671aa594498ea0fbdfce` | Yes |

## 2. Verified Museum Baseline

| Item | Value |
|------|-------|
| Baseline branch | `claude/immersive-worlds-module-c0d3f7` |
| Working branch base | HEAD `124561b0` (1 additive doc commit beyond pinned `6e6d6ca5`) |
| Protected surfaces | Galería A (Block 1), Block 2A transitions T1-T5, Room 1/2 behavior, Studio VS02 |

## 3. Donor Runtime Status

| Donor | Type | Build | Runtime Deps | WebGL | Notes |
|-------|------|-------|-------------|-------|-------|
| Wet Paint Flow | Vite/Three.js SPA | `npm run dev` | Three.js ^0.185.1 (MIT) | WebGL2 required | Monolithic `main.js` (3603 lines) |
| Van Gogh Crows | No-build static HTML | Direct serve | Vendored Three.js core (MIT) + lil-gui | WebGL2 required | Single `index.html` (3506 lines) + 2 ES modules |

**Stone 1 (Donor Runs Unchanged)**: Not yet executed in this environment. Next action.

## 4. Wet Paint Flow — Capability Inventory

### 4.1 Product Truth
Single-page browser app that converts 2D images or GLB 3D models into animated "wet oil painting" reconstructions using direction-field-guided Bézier strokes with PBR wet-paint shading. NOT a painting tool — a deterministic image→painterly-render pipeline.

### 4.2 Capability Map

| ID | Capability | Description | Generic? |
|----|-----------|-------------|----------|
| WPF-1 | Structure tensor flow fields | Image→direction-field extraction via Sobel+structure-tensor, GPU-accelerated | Yes |
| WPF-2 | Poisson-disk persistent seeding | Blue-noise stroke placement with frame-coherent seed persistence | Yes |
| WPF-3 | Bézier ribbon stroke geometry | Flow-guided cubic Bézier curves → InstancedBufferGeometry ribbon meshes | Yes |
| WPF-4 | GGX wet-paint PBR shading | Custom GLSL microfacet shaders: specular, normal perturbation, paint-thickness | Yes |
| WPF-5 | G-buffer capture pipeline | Multi-pass render-to-texture (depth, normal, albedo) for compositing | Yes |
| WPF-6 | GLB/image import + PNG/video export | File→scene pipeline + canvas capture for stills and video sequences | Yes |

### 4.3 Performance
14k strokes ≈ 61 FPS, 24k strokes ≈ 62 FPS (RTX 4090 reference). Idle = zero GPU work. Demand-driven rAF.

### 4.4 Dependencies
- Three.js ^0.185.1 (MIT) — sole runtime dependency
- Vite (dev only)
- Zero other npm production dependencies

### 4.5 QA
34/34 Vitest static tests passing. No Playwright/E2E/WebGL browser tests — flagged as gap.

### 4.6 Rights / Provenance
- **Code**: MIT license. Clean.
- **Assets**: 11 built-in Van Gogh paintings sourced from museum/Wikimedia Commons PD-Art. NC-only sources explicitly excluded. 3 demo videos embedded.
- **Third-party**: Three.js (MIT). Fluid Paint / dli-paint (MIT, conceptual inspiration only, no code copied).

## 5. Van Gogh Crows — Capability Inventory

### 5.1 Product Truth
Single-page no-build browser app. A GPU-simulated crow flock (up to 1024 birds, default 42/420) flies through a painterly Van-Gogh-styled radial sky and avoids a draggable glowing "sun" obstacle. Controlled via lil-gui panel with presets, undo, responsive mobile UI. Client-side only, deployed via GitHub Pages.

### 5.2 Capability Map

| ID | Capability | Description | Generic? |
|----|-----------|-------------|----------|
| VGC-1 | GPGPU boids flocking | GPU ping-pong FBO simulation: separation/alignment/cohesion + predator + central attraction | Yes |
| VGC-2 | Point-obstacle avoidance field | World-space sphere repulsor fed to velocity shader; draggable | Yes |
| VGC-3 | Multi-card billboard-atlas renderer | Single draw call, instanced body+2-wing quads, UV-mapped to sprite atlas, screen-facing blend | Yes |
| VGC-4 | Gradient-map NPR recoloring | Shadow/midtone/highlight color-stop remapping in fragment shaders | Yes |
| VGC-5 | Painterly radial sky generator | Oil-texture WebP → canvas → dome mesh, radial/planar UV modes, vignette, animated expansion | Partial (asset-coupled) |
| VGC-6 | Preset/undo/persistence system | Generic snapshot state manager, localStorage versioned, 40-entry undo stack, user CRUD | Yes |
| VGC-7 | Responsive mobile UI collapse | CSS+JS folder marking for advanced controls, viewport-adaptive | Yes |

### 5.3 Performance
O(N²) GPU cost in 32×32 texture regardless of active count (full grid iteration). Single draw call for entire flock. Pauses simulation/rendering on tab-hidden. Sky texture rebuild guarded by version token.

### 5.4 Dependencies
- Vendored Three.js core + GPUComputationRenderer (MIT, pinned upstream revision `f85394be`)
- Vendored lil-gui (MIT)
- WebGL2 required (float textures)
- Zero npm dependencies (no build step)

### 5.5 QA
- Static tests: `test/gpgpu-crows.test.mjs` — structure/string assertions + SHA-256 asset checksums
- **Playwright browser tests**: `test/browser/gpgpu-crows.spec.mjs` — real WebGL boot, GPU/atlas/background readiness gates, preset switching, mobile layout validation, runtime error checking
- Server smoke test: serves root + app, rejects path traversal
- Gaps: no visual/pixel regression, no perf assertions, no cross-browser testing

### 5.6 Rights / Provenance
- **Code**: Based on Three.js `webgl_gpgpu_birds` example (MIT). License copy at `THREE-LICENSE.txt`.
- **Assets**: 3 WebP art assets (crow atlas, sky texture, sun texture) — **NOT covered by MIT license**. No separate license declared. `SOURCE.md` explicitly notes local source paths intentionally not recorded. **Rights gap** — provenance undocumented for painterly textures/crow art beyond repo authorship.
- No external API calls, no user uploads — self-contained runtime boundary.

## 6. Hidden / New Capabilities Discovered

| Discovery | Source | Museum Value |
|-----------|--------|-------------|
| Gradient-map recoloring as semantic authoring primitive | VGC-4 | Could become `RECOLOR` / `PALETTE` semantic action |
| Snapshot/undo as generic state management | VGC-6 | Directly applicable to Museum authoring undo |
| Structure tensor as per-artwork analysis | WPF-1 | Could drive per-painting brush direction in Museum |
| G-buffer pipeline | WPF-5 | Multi-pass compositing for transition effects |
| GPGPU particle system architecture | VGC-1 | Generic enough for any Museum ambient life (not just crows) |

## 7. Combined Dependency Map

| Dependency | Used By | License | Version | Museum Compatible? |
|-----------|---------|---------|---------|-------------------|
| Three.js | Both | MIT | ^0.185.1 (WPF) / vendored core (VGC) | Yes — Museum already uses Three.js |
| Vite | WPF only | MIT | Dev only | Yes — Museum build tooling |
| lil-gui | VGC only | MIT | Vendored | Museum uses own authoring UI — REPLACE |
| WebGL2 | Both | Browser API | — | Yes — Museum baseline requires WebGL2 |
| GPUComputationRenderer | VGC | MIT (Three.js addon) | Vendored | Yes — standard Three.js addon |

No dependency conflicts with Museum baseline.

## 8. Rights / Provenance Risks

| Risk | Severity | Donor | Mitigation |
|------|----------|-------|------------|
| VGC art assets (crow atlas, sky/sun textures) have no documented license | **HIGH** | Van Gogh Crows | Do NOT directly reuse. Use as pattern reference only. Museum must source own atlas art or confirm rights with repo author. |
| WPF bundled Van Gogh paintings | LOW | Wet Paint Flow | PD-Art / museum commons — documented provenance. Not needed for capability graft. |
| WPF demo videos | LOW | Wet Paint Flow | Demo content only. Not needed for Museum. |

**Action**: Van Gogh Crows art assets are BLOCKED from direct reuse until rights are explicitly cleared by Human.

## 9. Performance Risks

| Risk | Donor | Impact | Mitigation |
|------|-------|--------|------------|
| WPF monolithic 3603-line main.js | WPF | Sculpting difficulty | Extract capabilities as modules during graft |
| VGC O(N²) GPU cost regardless of visible count | VGC | Scales poorly beyond 1024 | Acceptable at Museum scale (ambient flocks are small). Document ceiling. |
| VGC 3506-line monolithic index.html | VGC | Same as WPF | Extract during graft |
| Both require WebGL2 float textures | Both | Some mobile GPUs lack support | Museum baseline already requires WebGL2 — consistent |

## 10. Existing Donor QA Summary

| Donor | Static Tests | Browser Tests | Visual Regression | Gap |
|-------|-------------|---------------|-------------------|-----|
| Wet Paint Flow | 34/34 Vitest | None | None | No browser QA at all |
| Van Gogh Crows | Structure assertions | Playwright (WebGL boot, presets, mobile) | None | No pixel regression |

## 11. Proposed Sculpt + Graft Plan

### Phase 1: Capability Extraction (Stone 3)
Extract proven generic capabilities from donor monoliths into isolated, testable ES modules:

1. **GPGPU Boids Engine** (from VGC-1 + VGC-2) → `libs/gpgpu-boids/`
2. **Painterly Stroke System** (from WPF-1 + WPF-2 + WPF-3 + WPF-4) → `libs/painterly-strokes/`
3. **Gradient-Map Recoloring** (from VGC-4) → shader utility function
4. **Snapshot/Undo System** (from VGC-6) → `libs/state-snapshot/`

### Phase 2: Museum Adapter Layer (Stone 4)
Wrap extracted capabilities in Museum-compatible interfaces:
- Semantic authoring verbs (GROW, DISSOLVE, FLOCK, RECOLOR) instead of raw engine params
- Integrate with existing Museum WorldGraph (no competing world truth)
- Integrate with existing CameraAuthority (no competing camera)
- Connect to experience-config.js schema

### Phase 3: First Museum Vertical (Stone 5-6)
See §14 below.

### Sculpt Classification

| Capability | Classification | Rationale |
|-----------|---------------|-----------|
| WPF-1 Structure tensor | GRAFT | Generic image analysis, direct Museum value |
| WPF-2 Poisson seeding | GRAFT | Generic placement, direct Museum value |
| WPF-3 Bézier stroke geometry | GRAFT | Core painterly rendering capability |
| WPF-4 GGX wet-paint shading | GRAFT WITH ADAPTER | Needs semantic authoring wrapper |
| WPF-5 G-buffer pipeline | GRAFT | Multi-pass compositing for transitions |
| WPF-6 Import/export | DEFER | Museum has own asset pipeline |
| VGC-1 GPGPU boids | GRAFT | Generic ambient life system |
| VGC-2 Obstacle avoidance | GRAFT | Visitor-responsive capability |
| VGC-3 Billboard atlas renderer | GRAFT WITH ADAPTER | Needs Museum creature/particle abstraction |
| VGC-4 Gradient-map recoloring | GRAFT | Semantic recoloring primitive |
| VGC-5 Painterly sky | SCULPT | Technique transferable, asset not (rights gap) |
| VGC-6 Preset/undo | KEEP WITH ADAPTER | Adapt to Museum state management |
| VGC-7 Mobile UI collapse | DEFER | Museum has own responsive strategy |

## 12. Proposed Branch Structure

```
claude/museum-living-art-v1          ← ALL work (this branch)
  └── Isolated capability modules    ← No other branches needed for Stone 2-4
```

No additional branches. No merges to any protected branch.

## 13. First High-Value Museum Vertical (Proposed)

**"Living Painting" — A Museum artwork that breathes**

A single Gallery artwork rendered with painterly strokes (WPF) whose brush direction follows the painting's own composition (structure tensor), with ambient creatures (VGC boids) that respond to visitor proximity — creating a painting that is alive rather than static.

**Why this vertical?**
- Combines the strongest capability from each donor (painterly rendering + responsive flocking)
- Directly answers the Museum product value test: "The painting feels alive — visitors experience presence, not a render"
- Bounded scope: one artwork, one room behavior, one interaction model
- Tests the full sculpt+graft pipeline end-to-end
- Does NOT require VGC art assets (new Museum-appropriate creatures/particles)

**Museum quality test**: The visitor should not feel they are looking at a GPU demo. They should feel the painting is breathing.

## 14. Combination Experiments (Proposed)

| Experiment | Capabilities Combined | Museum Hypothesis |
|-----------|----------------------|-------------------|
| E1: Painterly stroke on Museum artwork | WPF-1 + WPF-3 + WPF-4 | Can Museum paintings be rendered as living brushstrokes? |
| E2: Ambient flock in gallery space | VGC-1 + VGC-2 | Can creatures inhabit gallery space and respond to visitor? |
| E3: Living Painting (E1 + E2) | WPF-1/3/4 + VGC-1/2/4 | Can a painting feel alive with both stroke movement and ambient life? |
| E4: Transition painterly dissolve | WPF-5 + Museum transitions | Can G-buffer compositing create painterly room transitions? |

## 15. Protected Surfaces

These MUST NOT be modified by this mission:

| Surface | Branch | Why |
|---------|--------|-----|
| main / master | — | Standing constraint |
| `claude/immersive-worlds-module-c0d3f7` | Protected baseline | Mission §22 |
| `integration/museum-full-studio-three-room-v1` | Active integration | Mission §22 |
| Galería A (Block 1) behavior | Any | Museum baseline protection |
| Block 2A transitions T1-T5 | Any | Museum baseline protection |
| Room 1/2 behavior | Any | Museum baseline protection |
| Studio VS02 authoring | Any | Museum baseline protection |
| Donor repositories | Their own repos | Mission §22 — no mutation |

## 16. Rollback / Audit Plan

- **Branch isolation**: All work on `claude/museum-living-art-v1` only
- **Rollback**: `git reset --hard 124561b0` returns to clean Museum baseline
- **Audit trail**: This checkpoint document + git log on working branch
- **No competing authorities**: No new WorldGraph, CameraAuthority, persistence, or global systems
- **Donor SHAs pinned**: Any drift detected = stop and re-verify
- **Rights gate**: VGC art assets blocked until Human clears provenance

---

## Checkpoint Decision

Per Mission §23 (Continuous Execution Protocol): This is a CHECKPOINT, not a stop.

**No genuine Human decision is required to proceed to Stone 3** (capability extraction from donor monoliths into isolated modules). The archaeology is complete, classifications are evidence-based, and the next work is safe, isolated, and reversible.

**Human decisions required before Stone 5+**:
1. VGC art asset rights clearance (§18)
2. First vertical selection approval
3. Visual quality judgment (§16 — "Do not declare Human approval")

**Next authorized safe work**: Stone 1 verification (run both donors unchanged in this environment) → Stone 3 (extract first capability module from donor monolith).
