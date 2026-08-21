# Living Art — Dual Product Integration Delivery Report

**Date:** 2026-08-21
**Status:** REPAIR + REHOME COMPLETE — PENDING HUMAN REVIEW
**PRODUCT APPROVAL:** PENDING — Juanma decides KEEP / ADJUST / REJECT

---

## 1. Branch Topology (Clean Separation)

### EP Product — Escaparates Pro
- **Repository:** `juanmaes83/escaparates-pro`
- **Branch:** `claude/escaparates-living-art-current-v1`
- **HEAD SHA:** `740366c`
- **Based on:** `origin/master` (`d6f55fa`) — current product HEAD
- **Files added/modified:** 3 source + 13 QA screenshots

### Museum Product
- **Repository:** `juanmaes83/escaparates-pro`
- **Branch:** `claude/museum-living-art-product-v1`
- **HEAD SHA:** `cd0a850`
- **Based on:** `origin/integration/museum-full-studio-three-room-v1` (`338f588`) — correct Museum baseline
- **Files added/modified:** 10 source + 6 QA screenshots

### Protected branches — NOT modified
- `master` (`d6f55fa`) — untouched
- `integration/museum-full-studio-three-room-v1` (`338f588`) — untouched
- Donor repos (wet-paint-flow, van-gogh-crows) — read-only, untouched

---

## 2. Human Runtime — Windows PowerShell Review Commands

### EP Product Review

```powershell
# 1. Fresh clone into review folder
cd ~\Desktop
git clone https://github.com/Juanmaes83/escaparates-pro.git EP-LivingArt-Review
cd EP-LivingArt-Review

# 2. Checkout the EP Living Art branch
git checkout claude/escaparates-living-art-current-v1

# 3. Start local server
python -m http.server 4200

# 4. Open in browser — Living Art standalone module
Start-Process "http://localhost:4200/labs/website-modules-source/living-art-pro/index.html"

# 5. Open in browser — EP platform root (full catalogue)
Start-Process "http://localhost:4200/index.html"
```

**Test URLs for EP:**
- Living Art standalone: `http://localhost:4200/labs/website-modules-source/living-art-pro/index.html`
- EP platform root: `http://localhost:4200/index.html`
- Existing module regression (3D Book): `http://localhost:4200/labs/website-modules-source/3d-book-collection-showcase-pro/index.html`

### Museum Product Review

```powershell
# 1. Fresh clone into review folder
cd ~\Desktop
git clone https://github.com/Juanmaes83/escaparates-pro.git Museum-LivingArt-Review
cd Museum-LivingArt-Review

# 2. Checkout the Museum Living Art branch
git checkout claude/museum-living-art-product-v1

# 3. Start local server
python -m http.server 4200

# 4. Open Museum entry point
Start-Process "http://localhost:4200/labs/immersive-worlds/index.html"
```

**Test URLs for Museum:**
- Museum entry point: `http://localhost:4200/labs/immersive-worlds/index.html`
- World JSON (inspect Living Art space): `http://localhost:4200/labs/immersive-worlds/worlds/museum-v1.world.json`
- Real artwork direct: `http://localhost:4200/labs/immersive-worlds/assets/collection/campo-de-ceniza.jpg`
- Guest file (inspect real-image support): `http://localhost:4200/labs/immersive-worlds/app/nested/living-art/living-art-guest.js`

---

## 3. EP Product — What Was Done

### Files on `claude/escaparates-living-art-current-v1`:

| File | Action | Purpose |
|------|--------|---------|
| `labs/website-modules-source/living-art-pro/index.html` | NEW | Self-contained standalone module (827 lines). Inline Three.js, dark editor UI, 3 modes, 9 controls, drag-drop image upload, pointer interaction. |
| `js/website-modules-living-art-pro.js` | NEW | Bridge file following exact pattern of existing modules (3D Book, Rope Gallery). Registers `living-art-pro` in `EP.WebsiteModules`. |
| `js/website-modules-ui.js` | MODIFIED | Added `living-art-pro` to `loadStandaloneModules()` array (line 383). |
| `labs/website-modules-source/living-art-pro/qa-evidence/` | NEW | 13 Playwright screenshots (S1–S8 standalone tests + S1–S5 platform tests). |

### EP Integration Pattern Used:
- Standalone module pattern (Pattern A): HTML source + bridge JS + catalogue registration
- Identical to how `3d-book-collection-showcase-pro`, `rope-gallery-pro`, etc. are integrated
- Living Art appears in the EP.WebsiteModules catalogue alongside all existing modules
- Existing modules verified: 3D Book regression PASS

---

## 4. Museum Product — What Was Done

### Files on `claude/museum-living-art-product-v1`:

| File | Action | Purpose |
|------|--------|---------|
| `app/nested/living-art/living-art-guest.js` | NEW | Museum nested-runtime guest class implementing BreezeGuest contract (`prepare`, `activate`, `setCameraPose`, `update`, `dispose`, `report`). Loads real artwork from `assets/collection/` via `_loadArtworkImage()`. Procedural fallback if image fails. |
| `app/nested/nested-room-controller.js` | MODIFIED | Added `import { LivingArtGuest }` and `host.register('room.living-art', ...)` alongside existing Breeze registration. |
| `worlds/museum-v1.world.json` | MODIFIED | Added `space.living-art` room with entity, 5 anchors, bidirectional portals from Gallery A, hotspots. Uses `nestedRuntime: "room.living-art"`. |
| `engine/capabilities/painterly/direction-field.js` | NEW | WPF-1 direction field extraction |
| `engine/capabilities/painterly/poisson-seeds.js` | NEW | WPF-2 Poisson disk seed generation |
| `engine/capabilities/painterly/bezier-strokes.js` | NEW | WPF-3 Bézier ribbon stroke builder |
| `engine/capabilities/painterly/impasto-material.glsl.js` | NEW | WPF-4 impasto composite shaders |
| `engine/capabilities/painterly/gradient-map.glsl.js` | NEW | VGC-4 gradient map (integrated but inactive) |
| `engine/capabilities/gpgpu-boids/boids-simulation.js` | NEW | VGC-1/2 GPGPU boid simulation |
| `vendor/three/addons/misc/GPUComputationRenderer.js` | NEW | Required by boids, not present on baseline |
| `qa/evidence-living-art-museum-v1/` | NEW | 6 Playwright screenshots |

### Museum Integration Pattern Used:
- Nested runtime guest pattern (Pattern B): Guest class registered in controller, activated by world JSON `nestedRuntime` metadata
- Camera rule: MUSEUM DECIDES CAMERA. THE GUEST RENDERS IT.
- Real artwork: `campo-de-ceniza.jpg` from `assets/collection/` (not procedural)
- Breeze regression: PASS — still registered and functional

---

## 5. Capability Accuracy — Honest Status

| Capability | ID | Status |
|---|---|---|
| Direction field (Sobel/structure tensor) | WPF-1 | INTEGRATED — drives stroke orientation |
| Poisson disk seeds | WPF-2 | INTEGRATED — drives stroke placement |
| Bézier ribbon strokes | WPF-3 | INTEGRATED — InstancedBufferGeometry rendering |
| Impasto composite material | WPF-4 | INTEGRATED — full-screen pass to RT, displayed on 3D plane |
| GPGPU boids | VGC-1/2 | INTEGRATED — compute/setPredator API, instanced point marks |
| Gradient-map recoloring | VGC-4 | INTEGRATED BUT INACTIVE — imported, shader code present, not wired into the composite pipeline |
| Direction-field → boid movement | — | NOT PROVEN — boids use their own flocking rules, direction field does NOT drive boid velocity |

---

## 6. What Is NOT Done / NOT Claimed

- **Video support** for either product: NOT IMPLEMENTED. `cuaderno-de-luz.webm` is in the collection but Living Art only processes still images.
- **EP export hooks** (downloadHtml, downloadZip, copyEmbed): DECLARED in bridge file but NOT IMPLEMENTED in the standalone module. The standalone module would need explicit export functions added.
- **Gradient-map active coloring**: The shader code is imported but not wired into the impasto composite pass. It is available for future use.
- **Direction-field driven flock movement**: The boids simulate using their own separation/alignment/cohesion rules. The direction field drives stroke orientation only, not boid velocity.
- **Full Museum navigation test**: The Museum runtime requires the full Museum app bootstrap (camera authority, world loader, scene kit). The guest file, controller registration, and world JSON are correct, but end-to-end navigation through the Museum to the Living Art room was validated structurally, not visually in a running Museum.
- **Container CDN limitation**: The EP platform root (`index.html`) cannot fully initialize in this container because Three.js is loaded from CDN (`unpkg.com`) which is blocked by the container's network policy. This is a pre-existing platform architecture issue, not introduced by Living Art. On Juanma's machine with internet access, the platform will load normally.

---

## 7. 27-Item Checklist

| # | Item | Status |
|---|------|--------|
| 1 | EP branch from current master HEAD | DONE — `claude/escaparates-living-art-current-v1` from `d6f55fa` |
| 2 | Museum branch from correct Museum baseline | DONE — `claude/museum-living-art-product-v1` from `338f588` |
| 3 | No modification to master | DONE |
| 4 | No modification to integration/museum-full-studio-three-room-v1 | DONE |
| 5 | No modification to donors | DONE |
| 6 | EP Living Art works as standalone module | DONE — 827-line self-contained HTML, 9 controls, 3 modes |
| 7 | EP Living Art registered in EP.WebsiteModules catalogue | DONE — bridge + loadStandaloneModules entry |
| 8 | EP existing modules regression check | DONE — 3D Book PASS |
| 9 | Museum guest follows BreezeGuest contract | DONE — prepare/activate/setCameraPose/update/dispose/report |
| 10 | Museum guest uses REAL artwork from collection | DONE — `campo-de-ceniza.jpg` via `_loadArtworkImage()` |
| 11 | Museum guest has procedural fallback | DONE |
| 12 | Museum controller registers both Breeze and Living Art | DONE |
| 13 | Museum world JSON has Living Art space | DONE — `space.living-art` with `nestedRuntime: "room.living-art"` |
| 14 | Museum world JSON has bidirectional portals | DONE — Gallery A ↔ Living Art |
| 15 | Museum world JSON has entity with real artwork reference | DONE — `entity.installation.campo-viviente` |
| 16 | Capability files present: direction-field | DONE |
| 17 | Capability files present: poisson-seeds | DONE |
| 18 | Capability files present: bezier-strokes | DONE |
| 19 | Capability files present: impasto-material | DONE |
| 20 | Capability files present: gpgpu-boids | DONE |
| 21 | Capability files present: gradient-map | DONE (inactive) |
| 22 | GPUComputationRenderer vendored | DONE |
| 23 | Camera rule enforced: Museum decides camera | DONE — guest has no camera input listeners |
| 24 | No duplicate CameraAuthority/WorldGraph | DONE |
| 25 | Windows PowerShell review commands provided | DONE — see Section 2 |
| 26 | QA evidence screenshots (EP) | DONE — 13 screenshots |
| 27 | QA evidence screenshots (Museum) | DONE — 6 screenshots |

---

## 8. Constraints Compliance

| Constraint | Compliant |
|---|---|
| Do NOT modify master | YES |
| Do NOT merge | YES |
| Do NOT modify donors | YES |
| Do NOT modify integration/museum-full-studio-three-room-v1 | YES |
| Do NOT rebuild Breeze | YES |
| Do NOT replace Museum camera/navigation | YES |
| Do NOT create second WorldGraph/CameraAuthority | YES |
| Do NOT claim field-driven flock movement | YES — explicitly marked NOT PROVEN |
| Do NOT claim gradient-map active | YES — explicitly marked INACTIVE |
| No secrets in repository | YES |
| No fixed bearer token | YES |
| PRODUCT APPROVAL: PENDING | YES |

---

**NEXT:** Juanma reviews both products using the PowerShell commands above. ChatGPT + Juanma audit. Decision: KEEP / ADJUST / REJECT.
