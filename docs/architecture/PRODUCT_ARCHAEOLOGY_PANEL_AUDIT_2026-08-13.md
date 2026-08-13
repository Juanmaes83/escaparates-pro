# Escaparates Pro — Product Archaeology + Panel Integration Audit

Date: 2026-08-13
Status: AUDIT / NO MERGE AUTHORIZED
Branch: `docs/product-archaeology-panel-audit-2026-08-13`
Base master: `8f122ffcf2f5e8af9a029a79800ae31dcf58a631`

## Operating rule

For every recovered project:

`PRESERVE → UNDERSTAND → COMPARE → CLASSIFY → PERSONALIZATION AUDIT → REUSE PANEL ENGINE IF NEEDED → ADAPTER → QA → VISUAL APPROVAL → INTEGRATE`

No source engine is rebuilt when a working first-party engine already exists.
No module is merged to master without explicit visual/product approval.

## Existing panel engines in Escaparates Pro

### A. Source Labs field engine — already in master

`js/source-labs-ui.js` renders `source.fields[]`, sends configuration + current media assets by postMessage, and hosts the source experience in an isolated iframe.

Best fit:
- lightweight source experiences;
- text/color/range/select controls;
- projects that already expose a simple postMessage bridge;
- modules that do not require project/version/output lifecycle beyond their own runtime.

### B. Advanced Tool / Type B host — already built on pending branch

Branch: `feature/type-b-infinite-display-studio-pro`
PR: #42 (open / draft / unmerged)

Reusable pieces already implemented:
- `advanced-tool.html`
- `css/advanced-tool-host.css`
- `js/advanced-tools/registry.js`
- `js/advanced-tools/host.js`
- `js/advanced-tools/render-adapter.js`
- `js/advanced-tools/project-adapter.js`
- `js/advanced-tools/hardening.js`

Capabilities already present:
- schema-driven grouped controls;
- Media upload: image/video;
- Logo upload;
- Branding controls;
- Save / restore / autosave;
- local project versioning;
- PNG export;
- WEBM recording;
- Project JSON export;
- presentation mode;
- output presets;
- iframe/runtime bridge;
- lifecycle hooks: pause/resume/seek/resize/dispose;
- source pinning.

Conclusion: THIS is the reusable advanced authoring panel motor. Future advanced modules should normally add a registry definition + engine-specific bridge/adapter, not build another panel UI from scratch.

---

# Candidate audit

## 1. Infinite Display Studio PRO

### Source
- Repo: `Juanmaes83/ESCAPARATES-INMERSIVOS-DE-IMAGEN-VIDEO`
- Canonical commit already pinned by Type B work: `89ee1beb56a0c86c06366bbbb155f421e2d23981`
- Source blob recorded: `f74424403b3dd276919035e86b3b0abb1c48224c`
- Existing integration branch: `feature/type-b-infinite-display-studio-pro`
- Existing PR: #42

### What the source already has
The original standalone already includes:
- media upload;
- media manager;
- image/video support;
- download action;
- WebM recording action;
- share action;
- presentation mode;
- music action;
- branding overlay;
- headline;
- CTA;
- logo;
- native hidden lil-gui configuration;
- multiple visual display modes.

### Personalization classification
`GOOD / ADVANCED`, but the native editing experience is not an ideal Escaparates authoring surface: the lil-gui is visually hidden and several product controls are distributed across floating buttons/panels.

### Existing Type B panel coverage
The pending Type B registry already exposes:
- Experience: 12 display modes;
- Look: background, speed;
- Camera: zoom, tilt X, tilt Z;
- Geometry: planes, bands/sectors;
- Post FX: bloom + vignette;
- Branding: enable, headline, CTA, logo position/opacity/scale, text opacity, font size/color;
- Media collection;
- Save/restore/version;
- PNG / WEBM / JSON;
- presentation.

The bridge applies configuration to the original `settings`, branding to `overlaySettings`, replaces media without rebuilding the visual engine, exposes renderer/scene/camera, and keeps the canonical source pinned.

### Decision
**RECOVER / REBASE / QA / VISUAL APPROVAL / INTEGRATE.**
Do NOT rebuild the panel.
Do NOT merge old PR #42 directly because its branch has diverged substantially from current master.
Instead recover the Type B host + Infinite Display adapter onto a fresh branch from current master, preserving the approved architecture.

### Destination
`RUBIK SOTA → Infinite Display Studio PRO`

### Integration type
`TYPE B — Advanced Integrated Tool`

### Panel strategy
`REUSE ADVANCED TOOL HOST` + existing Infinite Display bridge.

---

## 2. Immersive Layers Pro 2

### Source
- Repo: `Juanmaes83/Immersive-Layers-Pro2-`
- Default branch: `main`
- Current visible source: a standalone `index.html`.

### What it is
Standalone Three.js visual engine using:
- Three.js;
- EffectComposer;
- RenderPass;
- AfterimagePass;
- lil-gui;
- image/video source;
- local media input;
- procedural/moving layered meshes;
- particle system;
- export-oriented UI.

### Personalization classification
`PARTIAL / NATIVE GUI EXISTS`.
The source already has local image/video input and lil-gui. A deeper control inventory is still required before deciding whether its native GUI is product-complete.

### Preliminary destination
Best current fit: `Source Labs → 3D / Immersive Worlds` if native GUI/output is sufficient.
Alternative: `RUBIK SOTA` only if deeper audit shows it is an advanced authoring tool rather than a self-contained immersive visual experience.

### Preliminary integration type
Start as `TYPE A / standalone-preserved` unless the control audit proves a major authoring gap.

### Panel strategy
1. First test the original GUI and export actions.
2. If sufficient: preserve native panel and register standalone.
3. If insufficient: use Advanced Tool host; do not invent a bespoke panel.

### Decision
**NEXT HIGH-PRIORITY AUDIT.**

---

## 3. Infinite Worlds V1.3 / V1.3.1

### Existing public baseline
`Infinite Worlds — Brand Expression V1.2.3` is already integrated in:
`Source Labs → 3D / Immersive Worlds`.

### V1.3 branch
`preview-infinite-worlds-v1-3-world-native-brand-expression`

Compared with the V1.2.3 preview line, V1.3 adds `world-native-brand-expression-v1-3.js` and modifies the same source experience.
The layer explicitly states that it is additive over V1.2.2 and preserves portal mechanics/cameras/world swap/first-cross warmup while changing brand art direction and support fit.

Notable value:
- city/nature-specific art direction;
- world-native media placement;
- logo handling with transparent-image crop detection;
- aspect-aware media fitting;
- architectural support geometry;
- portal readability tuning;
- improved authoring copy.

### V1.3.1 branch
`preview-infinite-worlds-v1-3-1-media-pipeline-fix`

It is 3 commits ahead of V1.3 and adds:
- `brand-expression-media-v1-3-1.js`;
- `first-cross-lite-v1-3-1.js`;
- index integration changes.

Critical media architecture:
`1 unique video file = 1 HTMLVideoElement + 1 VideoTexture`.
It validates metadata, decoded frame readiness and video playback before applying media; different City/Nature files remain independent resources.

### Personalization classification
`ADVANCED / PROJECT-SPECIFIC AUTHORING ALREADY EXISTS`.
This line should not automatically receive the generic Advanced Tool panel; first preserve its own world-specific authoring UX.

### Decision
**COMPARE VISUALLY BEFORE ANY INTEGRATION.**
Do not replace V1.2.3.
Treat V1.3.1 as the stronger technical candidate in the V1.3 line, but only promote after visual/functional comparison against approved V1.2.3.

### Destination if approved
Same family as parallel/new version:
`Source Labs → 3D / Immersive Worlds`

### Panel strategy
Preserve native authoring first. Only use Source Labs fields/adapter for missing platform-level configuration, not to duplicate its world editor.

---

## 4. immersive-brand-landing-engine-rubik-sota

### Source
- Repo: `Juanmaes83/immersive-brand-landing-engine-rubik-sota`
- Visibility: private
- Branch: `main`
- Stack visible: React + TypeScript + Vite.
- `src/App.tsx` uses Motion, scroll-linked animation and Spline.

### What it appears to be
A scroll-driven immersive brand/landing experience, not a generic image effect.
Visible product behaviors include:
- scroll-driven Spline object transform;
- responsive navigation;
- multilingual ES/EN switch;
- brand theme/copy configuration modules;
- animated sections and cards;
- full landing-page composition.

### Personalization classification
`CONFIG-DRIVEN, NOT YET PRODUCT-AUTHORING AUDITED`.
There are theme/copy configuration layers, but this is not yet evidence of a user-facing personalization panel.

### Preliminary destination
Most likely:
`Blueprints → Immersive Brand Landing`

Alternative:
`Web Modules → Immersive Brand Landing`
only if its final build behaves as a self-contained widget/module rather than a complete landing blueprint.

### Panel strategy
Likely candidate for existing Escaparates schema-driven panel:
- Brand name/logo;
- headline/subheadline;
- ES/EN copy;
- accent/background/text colors;
- typography;
- CTA label/URL;
- section visibility/content;
- Spline scene URL or approved scene preset;
- motion intensity;
- responsive settings.

Use existing panel engine. Do not create a custom panel UI from scratch.

### Decision
**AUDIT BUILD + CONFIG CONTRACT BEFORE INTEGRATION.**

---

## 5. tea-leaf-scroll-world

### Source
- Repo: `Juanmaes83/tea-leaf-scroll-world`
- Branch: `main`
- Large application with `app/`, `build/`, `public/`, tests, DB/Drizzle and vinext/Next-oriented setup.

### Current uncertainty
The root README is still mostly starter/platform documentation and does not establish the canonical visual experience or approved entrypoint.
Therefore the product cannot yet be classified safely from README/repo name alone.

### Personalization classification
`NOT VERIFIED`.

### Decision
**ARCHAEOLOGY REQUIRED BEFORE PRODUCT INTEGRATION.**
Find:
- actual experience route;
- build output;
- visual preview;
- authoring controls;
- media model;
- whether backend/data code is required for the visual experience.

### Preliminary destination
No final family assignment yet.
Potentially `Scroll Sections` or `3D / Immersive Worlds` depending on actual runtime behavior.

---

## 6. Fashion Commerce PRO

### Existing work
- Branch: `feature/fashion-commerce-pro`
- PR #26: open / draft / unmerged.

### Current status recorded in PR
- source audit: done;
- asset gate: done;
- first block: present but not template-complete;
- visual fidelity: in progress;
- commerce core: partial;
- advanced gallery/editorial: pending;
- visual approval: pending.

### Personalization classification
`ADVANCED STUDIO CONTRACT EXISTS / PRODUCT NOT CLOSED`.
It already belongs to the Product Studio / sector blueprint architecture rather than needing the Advanced Tool panel.

### Decision
**DO NOT PUBLISH YET. RECOVER / COMPLETE / QA / VISUAL APPROVAL.**

### Destination
Existing intended product line:
`RUBIK SOTA / Product Studio → Fashion Commerce PRO`

### Panel strategy
Reuse Product Studio template/schema engine already built for Custom PRO templates. Do not migrate this project into the Advanced Tool host.

---

# Priority queue

1. Infinite Display Studio PRO — recover existing Type B work on fresh master.
2. Immersive Layers Pro 2 — full control/output audit; likely quick integration.
3. Infinite Worlds V1.3.1 — visual comparison against approved V1.2.3.
4. immersive-brand-landing-engine-rubik-sota — build + config + panel contract audit.
5. tea-leaf-scroll-world — locate canonical runtime/build first.
6. Fashion Commerce PRO — separate recovery/completion workstream.

# Panel decision tree

```text
PROJECT
  ↓
DOES ORIGINAL HAVE GOOD AUTHORING?
  ├─ YES → preserve original editor
  │         ↓
  │       standalone / thin adapter
  │
  └─ NO / PARTIAL
          ↓
  WHAT KIND OF PRODUCT?
     ├─ lightweight source experience
     │      → Source Labs fields + postMessage adapter
     │
     ├─ advanced renderer/tool
     │      → Advanced Tool Type B host
     │         + registry schema
     │         + engine-specific bridge
     │
     └─ sector/website template
            → Product Studio / Blueprint schema engine
```

This document is an archaeology record only. It does not authorize merge, deletion, replacement, or publication.