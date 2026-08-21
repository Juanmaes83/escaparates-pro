# Museum — Capability Source: Living Art Donors

> **Status:** PROVEN CAPABILITIES — EXTRACTED, TESTED, AND INTEGRATION-PROVEN (Stone 4)
>
> **Target:** Escaparates Pro → Immersive Worlds → Museum / Institutional
>
> **Source projects:**
> - Wet Paint Flow (Juanmaes83/wet-paint-flow) — MIT license
> - Van Gogh Crows (Juanmaes83/van-gogh-crows) — MIT license (code)
>
> **Mission:** Museum Living Art / Responsive Art Capability Sculpt + Graft
>
> **Purpose:** Register proven capabilities extracted from donor repositories,
> with provenance, classification, and Museum integration status.

---

## 1. Source relationship

These are **external donor repositories**, not first-party owned implementations.
They are MIT-licensed open-source projects whose capabilities have been
archaeologically audited, sculpted, and grafted into Museum per the
Sculpt + Graft methodology (A4).

```text
DONOR REPOSITORIES (read-only, never mutated)
→ archaeology audit (A-J, 10 sections per donor)
→ sculpt away donor-specific content
→ graft generic capabilities into Museum
→ MUSEUM / INSTITUTIONAL
```

The donors are NOT Museum product. Their app shells, UI, presets, and
content-specific code are excluded. Only generic, content-agnostic
capabilities have been extracted.

---

## 2. Pinned source baselines

| Donor | Repository | Pinned SHA | License |
|-------|-----------|------------|---------|
| Wet Paint Flow | `Juanmaes83/wet-paint-flow` | `0b9ba9a5be665f3a2a8b2450945ec5006e61e2de` | MIT |
| Van Gogh Crows | `Juanmaes83/van-gogh-crows` | `1240c1feb2983c945c81671aa594498ea0fbdfce` | MIT (code) |

**Art asset provenance gap:** Van Gogh Crows WebP art assets (crow atlas,
sky texture, sun texture) have NO documented license. Code MIT only.
These assets are BLOCKED from Museum use.

---

## 3. Extracted capability registry

### 3.1 GPGPU Boids Simulation

| Field | Value |
|-------|-------|
| Source | Van Gogh Crows (VGC-1, VGC-2) |
| Upstream | Three.js `webgl_gpgpu_birds` (MIT, mrdoob/three.js `f85394be`) |
| Module | `engine/capabilities/gpgpu-boids/boids-simulation.js` |
| Classification | GRAFT |
| Dependencies | Three.js (WebGL2, GPUComputationRenderer) |
| Tests | 15/15 (structural + API contract) |
| Capability | GPU ping-pong FBO flocking: separation/alignment/cohesion + predator avoidance + multi-obstacle spherical repulsors |
| Museum value | Generic ambient-life system for gallery spaces; visitor-responsive creatures/particles |
| Donor content removed | Crow atlas, UV coordinates, lil-gui panel, presets, donor branding |
| Generalization | Single sun obstacle → multi-obstacle array (up to configurable max) |

### 3.2 Direction Field Analyzer

| Field | Value |
|-------|-------|
| Source | Wet Paint Flow (WPF-1) |
| Module | `engine/capabilities/painterly/direction-field.js` |
| Classification | GRAFT |
| Dependencies | None (pure CPU math) |
| Tests | 6/6 (structural + functional with synthetic images) |
| Capability | Structure tensor analysis: RGBA pixels → per-pixel brush angle + confidence via Sobel gradients, tensor accumulation, integral-image box filtering |
| Museum value | Per-artwork brush direction computation — makes any painting "painterly" |
| Donor content removed | Scene-specific semantic zones (SKY, MOUNTAIN, etc.), UI status strings |
| Generalization | Optional normal+depth geometry blending for 3D scenes |

### 3.3 Poisson-Disk Seeding

| Field | Value |
|-------|-------|
| Source | Wet Paint Flow (WPF-2) |
| Module | `engine/capabilities/painterly/poisson-seeds.js` |
| Classification | GRAFT |
| Dependencies | None (pure CPU math) |
| Tests | 8/8 (functional: layer distribution, mask, generation variation, minimum distance) |
| Capability | Blue-noise stroke placement: Halton quasi-random sequences + grid collision, 3-layer density hierarchy (coarse/medium/fine), frame-coherent generation counter |
| Museum value | Principled, non-random placement for painterly strokes in any artwork |
| Donor content removed | Semantic density modulation (vegetation/building), Three.js Vector3 unprojection, UI string updates |
| Generalization | Added optional mask function for arbitrary spatial constraints |

### 3.4 Gradient-Map Recoloring (shader utility)

| Field | Value |
|-------|-------|
| Source | Van Gogh Crows (VGC-4) |
| Upstream | Three.js `webgl_gpgpu_birds` (MIT, mrdoob/three.js `f85394be`) |
| Module | `engine/capabilities/painterly/gradient-map.glsl.js` |
| Classification | GRAFT |
| Dependencies | Three.js (for uniform types) |
| Tests | Covered by painterly test suite |
| Capability | 3-stop GLSL color ramp: shadow/midtone/highlight remapping with position + strength controls, reversible |
| Museum value | Semantic RECOLOR / PALETTE authoring primitive for NPR effects |
| Donor content removed | Bird-specific uniform names, crow atlas references |
| Generalization | Renamed uniforms to generic `gradientMap*` prefix |

### 3.5 Bézier Ribbon Stroke Geometry

| Field | Value |
|-------|-------|
| Source | Wet Paint Flow (WPF-3) |
| Module | `engine/capabilities/painterly/bezier-strokes.js` |
| Classification | GRAFT |
| Dependencies | Three.js (InstancedBufferGeometry), direction-field, poisson-seeds |
| Tests | 12/12 (structural + functional: vertex/fragment shaders, stroke tracing, instanced geometry) |
| Capability | Direction-field-traced cubic Bézier ribbons: 8-segment strips with variable-width pressure profile, bristle wobble, fiber simulation, pigment break. Instanced rendering (18 vertices, 48 indices per instance). |
| Museum value | Procedural brushstroke generation for any artwork — the core "painterly rendering" primitive |
| Donor content removed | WPF-specific scene setup, UI controls, preset-dependent parameters |
| Generalization | `buildStrokesFromField(field, seeds, options)` — takes any direction field + seed array, returns instanced stroke geometry |
| Integration proof | Painterly Chain experiment (Stone 4): 3000 strokes from procedural artwork |

### 3.6 Impasto Material (Three-Pass Composite)

| Field | Value |
|-------|-------|
| Source | Wet Paint Flow (WPF-4) |
| Module | `engine/capabilities/painterly/impasto-material.glsl.js` |
| Classification | GRAFT |
| Dependencies | Three.js (ShaderMaterial, render targets) |
| Tests | 9/9 (structural: vertex/fragment shaders, uniform presence, GGX specular, Sobel normals) |
| Capability | Three-pass impasto pipeline: (1) stroke pigment → RGBA render target, (2) stroke height → height/wet/furrow render target with additive blending, (3) full-screen composite with GGX microfacet specular, Sobel-derived normals, clearcoat, canvas weave, variable roughness |
| Museum value | Physical paint surface simulation — makes digital strokes look like real impasto oil paint |
| Donor content removed | WPF-specific render loop, camera setup, UI-driven parameter binding |
| Generalization | `IMPASTO_COMPOSITE_VERTEX` + `IMPASTO_COMPOSITE_FRAGMENT` + `IMPASTO_UNIFORMS` — composable shader components for any stroke render target pair |
| Integration proof | Painterly Chain experiment (Stone 4): 1024×1024 pigment + height render targets |

---

## 4. Capabilities NOT extracted (classified DEFER or REJECT)

| Capability | Donor | Classification | Reason |
|-----------|-------|----------------|--------|
| GLB/image import + PNG/video export | WPF-6 | DEFER | Museum has own asset pipeline |
| Painterly radial sky generator | VGC-5 | SCULPT (deferred) | Technique transferable but asset-coupled; VGC art rights unclear |
| Responsive mobile UI collapse | VGC-7 | DEFER | Museum has own responsive strategy |
| Preset/undo/persistence system | VGC-6 | KEEP WITH ADAPTER (deferred) | Valuable but needs Museum state management integration |
| G-buffer capture pipeline | WPF-5 | GRAFT (next) | Depends on Three.js render pipeline |

---

## 5. Rights summary

All extracted capabilities are MIT-licensed code with no art-asset dependencies.
Museum may freely reuse, modify, and distribute per MIT terms.

**Blocked assets:** Van Gogh Crows WebP art assets lack documented provenance.
Do NOT use `crow-4-atlas.webp`, `sky-oil-class-impasto.webp`, or
`sun-impasto.webp` in Museum until rights are confirmed by Human.

Wet Paint Flow bundled Van Gogh paintings (PD-Art / museum commons) are
documented but not needed — direction field works with any image source.
