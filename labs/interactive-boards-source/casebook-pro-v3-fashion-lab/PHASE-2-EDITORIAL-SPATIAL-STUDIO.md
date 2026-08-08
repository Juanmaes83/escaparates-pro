# Casebook PRO V3 — Phase 2 · Editorial Spatial Studio

Status: **candidate / pending integrated visual approval**.

## Goal

V3 must not read as “V2 plus more buttons”. The Phase 2 shell turns the same underlying engine into a spatial editor organized around three permanent ideas:

1. **WORLD NAVIGATOR** — structure, spaces/chapters and route.
2. **IMMERSIVE CANVAS** — content-first working area.
3. **CONTEXTUAL INSPECTOR** — only the controls relevant to the current selection.

The hierarchy is explicit:

`WORLD → CHAPTER / SPACE → MODE`

Output flow remains:

`World → Chapters → Hotspots → World Map / Navigator → Guided Tour → Story → Presentation → Recording`

## Safety boundary

Phase 2 is a UI/UX adapter. It does **not** rewrite the V2 engine or the P0 Spatial Worlds runtime.

The shell delegates to the existing APIs and controls for:

- chapter switching;
- hotspot creation/editing;
- zones;
- cards/content;
- Story Path;
- Focus Network;
- Graph / Timeline;
- Preflight / Presentation;
- Record Exact / Record Live;
- JSON / HTML / ZIP / Preview / PNG outputs.

Rollback remains possible by removing the Phase 2 CSS/JS includes from the V3 HTML.

## Layout

### Top bar

Project identity and breadcrumb:

`WORLD / CHAPTER / MODE`

Primary global actions:

- Guide
- Export
- Preview
- Inspector toggle

### Left — World Navigator

Structure only, not configuration.

Shows:

- world title;
- number of spaces;
- hotspot count;
- authored story duration when known;
- Chapters / Spaces;
- current Chapter;
- Tour Route;
- Add Space;
- World Map;
- Tour.

### Center — Immersive Canvas

The existing Casebook/Three.js canvas remains the visual protagonist. The old configuration panel is hidden by the Phase 2 shell rather than deleted.

Contextual floating actions expose only high-frequency actions such as:

- Add Content;
- Add Hotspot;
- Add Zone;
- Add selected content to Story;
- Focus;
- Graph.

### Right — Inspector

The inspector changes with context.

**WORLD**
- project metrics;
- world name;
- World Map;
- Guided Tour;
- visual language explanation.

**CHAPTER / SPACE**
- space name and map coordinates;
- hotspot count;
- Add Hotspot;
- Edit Space;
- Duplicate;
- hotspot list.

**CONTENT**
- title;
- copy;
- Save;
- Add to Story;
- Focus;
- optional advanced console.

## Bottom modes

The Phase 2 mode rail exposes the authored experience rather than every technical function:

- World Map
- Story
- Tour
- Present
- Record

Advanced functions remain contextual/progressive rather than competing at the top level.

## Design references and how they are used

### `Juanmaes83/design-system`

Purpose: **visual infrastructure**.

Used for the concept of a token-driven shell rather than hard-coded branding. Phase 2 defines semantic tokens for surfaces, ink, accents, typography, spacing and motion. This prepares the architecture for future **Brand DNA** without implementing Brand DNA as a Core V3 feature yet.

Future mapping can replace tokens from a brand guide, website or imported design system without rewriting the engine.

### `Juanmaes83/open-design`

Purpose: **creative direction / visual language**.

Phase 2 provides visual-language presets at the shell level:

- Editorial
- Fashion Brutalist
- Gallery
- Architectural
- Institutional

Fashion Brutalist is treated as an editorial fashion language: large scale shifts, condensed/oversized typography, stronger asymmetry and harder hierarchy while editor controls remain usable.

### `Juanmaes83/power-design`

Purpose: **UX discipline and guardrails**.

Applied principles:

- strong information hierarchy;
- one dominant canvas;
- progressive disclosure;
- contextual controls;
- fewer competing primary actions;
- focus states and keyboard accessibility where shell controls are introduced;
- responsive navigator/inspector behavior;
- consistent interaction surfaces.

## Visual languages

The engine is one product. Themes do not duplicate application logic.

### Editorial
Warm paper, black ink, serif display typography, restrained editorial hierarchy.

### Fashion Brutalist
Black/white base, condensed display language, sharper scale contrast, asymmetric rhythm and magazine/campaign character.

### Gallery
Neutral museum-white surfaces, minimal chrome and artwork-first hierarchy.

### Architectural
Warm technical neutral palette, controlled typography and plan-room precision.

### Institutional
Ivory/navy authority, restrained editorial typography and documentation-friendly hierarchy.

## Brand DNA readiness

Phase 2 deliberately uses semantic CSS variables so a future layer can map:

- brand surface;
- brand ink;
- brand accent;
- display typography;
- body/UI typography;
- rule/border character;
- spacing/density;
- image treatment;
- motion character.

Brand DNA is **prepared for, not implemented** in this phase.

## UX principle

A new user should be able to understand the product as:

> I am building a world. These are my spaces. I am inside this space. I can add content or portals. I can build a route and story. I can present or record the experience.

That mental model takes precedence over exposing every technical capability simultaneously.

## Phase 2 files

- `v3-editorial-spatial-shell.css` — token system, three-zone layout, responsive behavior, visual languages.
- `v3-editorial-spatial-shell.js` — UX adapter, Navigator, contextual Inspector, mode orchestration, Guide, Export and Record surfaces.
- `index.html` — loads the Phase 2 shell after the hardened P0 runtime.

## Approval rule

Do not merge to `master` until:

1. visual review is approved;
2. Chapter navigation is validated;
3. hotspot placement/editing remains functional;
4. World Map and Guided Tour remain functional;
5. Story / Present / Record remain functional;
6. export paths remain functional;
7. V1 and V2 regressions remain zero.
