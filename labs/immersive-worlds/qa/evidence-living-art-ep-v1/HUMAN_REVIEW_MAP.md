# Living Art PRO — Escaparates Pro Module — Human Review Map

**Phase:** 2 — Escaparates Pro Minimum Vertical
**Branch:** `claude/immersive-worlds-module-c0d3f7`
**Date:** 2026-08-21
**Status:** AWAITING HUMAN REVIEW

## What was built

A complete **Website Module (Standalone)** inside Escaparates Pro that converts
any source image into interactive living art using all six sculpted capabilities
from the Museum Living Art donors.

### Files created / modified

| File | Action | Purpose |
|---|---|---|
| `labs/website-modules-source/living-art-pro/index.html` | CREATED | Standalone editor — full Three.js pipeline, dark editor UI, 9 semantic controls, 3 view modes, image upload, animation loop |
| `js/website-modules-living-art-pro.js` | CREATED | Bridge registration — follows 3D Book Collection pattern exactly |
| `js/website-modules-ui.js` | MODIFIED | Added `living-art-pro` entry to `loadStandaloneModules()` array |

### Architecture decision

**Website Module (Standalone)** pattern chosen over Effects family because Living Art
needs its own Three.js renderer (v0.185.1 vendored ESM), multi-pass render targets
(3-pass impasto), and GPGPU compute (boids). Matches 3D Book Collection Showcase PRO,
Vinyl Player, Kinetic Letter Curtain patterns exactly.

## Capabilities integrated

All six from the donor provenance map:

| # | Capability | Source | Status |
|---|---|---|---|
| WPF-1 | Direction field | wet-paint-flow | ACTIVE |
| WPF-2 | Poisson seeds | wet-paint-flow | ACTIVE |
| WPF-3 | Bezier ribbon strokes | wet-paint-flow | ACTIVE |
| WPF-4 | Impasto material (3-pass) | wet-paint-flow | ACTIVE |
| VGC-1/2 | GPGPU boids | van-gogh-crows | ACTIVE |
| VGC-4 | Gradient-map recoloring | van-gogh-crows | ACTIVE |

## Semantic controls (9 total)

| Control | Range | Default | Section |
|---|---|---|---|
| Paint Intensity | 0–2 | 1.0 | PAINT |
| Stroke Scale | 0.2–3 | 1.0 | PAINT |
| Stroke Count | 500–8000 | 3000 | PAINT |
| Wetness | 0–1 | 0.38 | IMPASTO |
| Impasto Height | 0–0.2 | 0.06 | IMPASTO |
| Living Amount | 0–400 | 160 | LIVING |
| Mark Scale | 4–120 | 36 | LIVING |
| Motion Character | 0–1 | 0.5 | LIVING |
| Pointer Response | 0–1 | 0.5 | LIVING |

## View modes

| Mode | Description | Evidence |
|---|---|---|
| Combined | Painterly strokes + living boid marks | S1, S4, S5 |
| Painterly Only | Static Bezier strokes, impasto surface | S2 |
| Living Only | Boid flock marks, dark background | S3 |

## Evidence screenshots

| File | Content |
|---|---|
| `S1_editor_first_impression.png` | Combined mode — full editor with all controls visible, swirling impasto strokes, status bar active |
| `S2_painterly_mode.png` | Painterly Only — static strokes without boid marks |
| `S3_living_mode.png` | Living Only — boid flock marks on dark background |
| `S4_pointer_center.png` | Combined mode — pointer at canvas center, boid marks clustering |
| `S5_relaxed.png` | Combined mode — pointer moved away, boids dispersing |
| `S6_adjusted_mark_scale.png` | Combined mode — mark scale slider adjusted to 60 |

## QA results

```
Strokes: 3000
Boids: 160
Capabilities: direction-field, poisson-seeds, bezier-strokes, impasto-material, gpgpu-boids, gradient-map
Mode switching: PASS (all 3 modes)
Pointer interaction: PASS
All 9 controls present: PASS
FPS: 20-22 (SwiftShader headless — real GPU will be faster)
Pipeline load: PASS (loading overlay hides, status bar shows Active)
```

## Platform integration checklist

- [x] Module registered via `EP.WebsiteModules.register()` with correct schema
- [x] Bridge file follows 3D Book Collection pattern (38 lines)
- [x] Added to `loadStandaloneModules()` array in `website-modules-ui.js`
- [x] `standalonePath` points to isolated HTML source
- [x] `standaloneActions` declares html/zip/embed export
- [x] `build()` returns fallback iframe document
- [x] Own Three.js renderer (v0.185.1 ESM, isolated from EP's v0.128.0)
- [x] No EP core modification beyond loader array entry
- [x] No new global pollution (all inside module scope)
- [x] Procedural fallback artwork when no image loaded

## Constraints respected

- EP core: untouched (only loader array modified)
- EP.Media: not duplicated (module has own image input)
- EP.EffectBase: not used (standalone pattern)
- Other modules: untouched
- Donor repos: read-only (ESM imports from vendored copies)
- Museum baseline: untouched
- No secrets, no fixed tokens
- Branch isolation maintained

## Human decision required

**KEEP / ADJUST / REJECT** this Escaparates Pro module before proceeding to
Phase 3 (Museum Minimum Vertical).

Questions for review:
1. Is the editor UI layout (left panel + canvas) appropriate for EP?
2. Are the 9 semantic controls the right set?
3. Should the procedural fallback be a different default image?
4. Is "Painterly / Living" the right family classification?
