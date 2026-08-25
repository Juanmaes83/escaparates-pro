# Museum Full Studio → Three-Room Integration — Pre-flight Artifacts

> **Branch:** `integration/museum-full-studio-three-room-v1`
> **Base:** `claude/immersive-worlds-module-c0d3f7` @ `6e6d6ca5`
> **Donor:** `chatgpt/museum-phase2-capability-expansion` @ `6b0de039`
> **Date:** 2026-08-16

---

## Audit Landmarks Verified

| # | SHA | Branch | Description | Status |
|---|-----|--------|-------------|--------|
| 1 | `6e6d6ca5` | `claude/immersive-worlds-module-c0d3f7` | Current three-room Museum HEAD | OK |
| 2 | `e88c2926` | same | Breeze Human-Gate reference | OK |
| 3 | `4839c36c` | same | Material Room-3 / Option-E1 | OK |
| 4 | `6b0de039` | `chatgpt/museum-phase2-capability-expansion` | Advanced Full Museum Studio | OK |

---

## A. RECEIVING PRODUCT INVENTORY (Current Three-Room Museum)

**Branch:** `claude/immersive-worlds-module-c0d3f7` @ `6e6d6ca5`
**Human approval state:** KEEP FOR CONTINUATION (all baselines approved)

### Architecture

```
engine/          Semantic motor (no Three.js, no DOM)
  core/          Runtime, clock, event bus, deterministic RNG, device tiers
  schema/        Types + validator (invariants enforced)
  world/         World store, world graph, world state, space lifecycle
  camera/        Camera authority + explore/focus/directed/author modes
  interaction/   Proximity, action dispatch
  experience/    Experience director
  scenekit/      Engine ↔ representation contract

render/          Three.js host: renderer, camera, media loading
scene-kits/     museum/ — the only place semantics become geometry
worlds/          museum-v1.world.json + institutional-demo.world.json
assets/          Collection (images + video) with rights registry
app/             DOM shells, UI, input, audio
  nested/        Option E1 nested-room architecture (Breeze)
  ui/            HUD, styles
qa/              Deterministic states + evidence runner
vendor/          three.js r0.185.1 (MIT)
```

### Authoring layer

```
authoring/
  experience-config.js     595 lines, Schema 2. Normaliser, migration, apply-to-world.
  config-store.js           ConfigStore. localStorage persistence. Save/load/export/import.
  authoring-panel.js        Legacy panel (pre-Studio).
  media-vault.js            Media file → object URL management.
  authoring.css             Panel styles.
  museum-b.config.json      Second-museum demonstration config.
  project-cloud/
    asset-client.js         R2/Project Cloud asset upload (P0.2 — external blocker).
  studio/
    studio-shell.js         StudioShell class. Five domains: institution, content, experience, visitor, export.
    experience-tree.js      Guided tour tree visualisation.
    readiness.js            Readiness checker (publication gate).
    media-catalogue.js      Media catalogue browser.
    studio.css              Studio styles.
```

### Entry points

| File | Purpose |
|------|---------|
| `index.html` | Visitor experience (boot → experience-app.js) |
| `author.html` | Authoring surface (StudioShell + author camera) |

### Rooms

| Room | Space ID | Contents |
|------|----------|----------|
| Gallery A | `gallery-a` | Entry, welcome panel, artworks |
| Gallery B | `gallery-b` | Artworks, projection, audio installation |
| Breeze | `breeze` | Installation: Venus + dynamic cloth + WebGPU physics |

### Key runtime features

- Guided tour (12 stops across 3 rooms + crossings)
- Explore mode (WASD / mouse)
- Focus / detail view per entity
- HUD (SALAS, SONIDO, VISITA, CONTENIDO EN TEXTO, transport bar)
- Museum-owned camera authority (FOV 50, write-token based)
- Option E1 nested-room host (Breeze guest with separate WebGPU canvas)
- Cross-room navigation (forward, back, re-entry)
- Crossing B (approved transition between Gallery A and Gallery B)
- Config-based authoring: save, load, export, import, preview, apply
- Second-museum proof (institutional-demo.world.json)

---

## B. INCOMING CAPABILITY INVENTORY (Advanced Full Museum Studio)

**Branch:** `chatgpt/museum-phase2-capability-expansion` @ `6b0de039`
**PR:** #58 (OPEN / DRAFT / NOT MERGED)

### Diff summary vs. receiving

- **2 files modified** (experience-config.js, index.html)
- **7 code files added** (under authoring/studio/)
- **8 documentation files added** (under docs/)
- **0 files deleted**
- Total: +3,576 lines, -503 lines (net +3,073)

### Modified files

| File | Current | Donor | Change |
|------|---------|-------|--------|
| `authoring/experience-config.js` | 595 lines (Schema 2) | 334 lines (Schema 3) | Rewrite: comments stripped, new data domains added |
| `index.html` | 47 lines | 51 lines | Adds CSS links + JS imports for Studio modules |

### New code files

| File | Lines | Purpose |
|------|-------|---------|
| `authoring/studio/museum-phase2.js` | 247 | Main Phase 2 Studio module. Adds 5 capability domains: artists, documents, languages, visitor memory/commerce/support, room accessibility. Syncs Phase 1 sidecar data to canonical Schema 3. |
| `authoring/studio/visitor-phase1.js` | 67 | Visitor Phase 1 installer. Augments StudioShell with visitor capabilities (schedule, programme, accessibility, dimensions, map, progress tracking). Monkey-patches StudioShell and ExperienceHUD prototypes. |
| `authoring/studio/museum-phase2-hardening.js` | 221 | Hardening layer. Enhances visitor UI compactness, artist authoring (portrait URLs), entity translation, room accessibility authoring, cross-entity document linking, accessible route toggles. |
| `authoring/studio/museum-phase2-layout-fix.js` | 28 | Layout fix. Wraps second column in unified workspace div for content/experience domains. Captures preview intent at document level. |
| `authoring/studio/museum-phase2-hardening.css` | 75 | Styles for hardening layer. |
| `authoring/studio/museum-phase2.css` | 6 | Minimal Phase 2 styles. |
| `authoring/studio/visitor-phase1.css` | 11 | Visitor Phase 1 styles. |

### New documentation files

| File | Lines | Purpose |
|------|-------|---------|
| `docs/CHATGPT_SCHEDULED_TASKS_AUTOMATION_MONITORING_OS_V1.md` | 286 | Automation/monitoring methodology |
| `docs/MUSEUM_AUTHORING_CAPABILITY_REGISTRY_V1.md` | 162 | Capability registry v1 |
| `docs/MUSEUM_AUTHORING_CAPABILITY_REGISTRY_V2.md` | 178 | Capability registry v2 |
| `docs/MUSEUM_CURRENT_STATE_INTEGRATION_HANDOFF_V2.md` | 437 | Integration handoff document |
| `docs/MUSEUM_PHASE2_CAPABILITY_EXPANSION_V1.md` | 238 | Phase 2 capability expansion spec |
| `docs/MUSEUM_PHASE2_CURRENT_STATUS_HANDOFF_V1.md` | 240 | Phase 2 status handoff |
| `docs/MUSEUM_STUDIO_BREEZE_BOUNDED_INTEGRATION_CONTRACT_V1.md` | 476 | Studio-Breeze integration contract |
| `docs/MUSEUM_VISITOR_PHASE1_RECOVERY_PLAN_V1.md` | 658 | Visitor Phase 1 recovery plan |

### Schema 3 new data domains (functional additions over Schema 2)

| Domain | Data shape | Purpose |
|--------|-----------|---------|
| Artists | id, name, biography, nationality, birth/death, portraitUrl, website | Artist registry linked to entities via artistId |
| Documents | id, title, type, url, description, entityIds | Document catalogue linked to entities |
| Languages | defaultLocale, locales, translations | i18n support structure |
| Visitor schedule | weekly open/close, exceptions | Structured opening hours |
| Visitor a11y features | 8 structured booleans (stepFree, lift, etc.) | Accessibility service declarations |
| Visitor resources | documents, maps, guides, audio, external links | Downloadable/linkable resources |
| Visitor memory | favorites, visit tracking, email identity, return visit | Repeat visitor features |
| Visitor commerce | shop enabled/url/label | Shop integration |
| Visitor support | membership, donations | Membership/donation links |
| Experience accessible route | avoid stairs, require seating, prefer quiet | Accessible navigation |
| Experience personalization | use favorites, use visited, max recommendations | Personalized experience |
| Entity sizing | sizeCm (width, height, depth) | Physical dimensions |
| Entity accessibility | label, description, transcript | Per-entity a11y |
| Entity presentation | frame, mount, material, finish, glass, etc. | Physical presentation metadata |
| Room accessibility | stepFree, liftRequired, quiet, seating | Per-room a11y |

---

## C. SHARED-FILE / CONFLICT MAP

### Files that exist on BOTH branches

Comparing `6e6d6ca5` (receiving) vs `6b0de039` (donor):

| File | Status | Conflict risk |
|------|--------|---------------|
| `authoring/experience-config.js` | **MODIFIED on donor** | HIGH — Schema 2→3 rewrite. Same public API surface (normaliseConfig, applyConfigToWorld, baseConfigFromWorld, exportConfigJSON, importConfigJSON) but expanded data model. |
| `index.html` | **MODIFIED on donor** | MEDIUM — Donor adds 3 CSS links, 4 JS imports, installs 4 modules after boot. Receiving has no changes from the shared ancestor. |
| All other authoring/ files | IDENTICAL | NONE — config-store.js, studio-shell.js, experience-tree.js, readiness.js, media-catalogue.js, media-vault.js, authoring-panel.js are the same on both branches. |
| All engine/ files | NOT IN DIFF | NONE |
| All render/ files | NOT IN DIFF | NONE |
| All scene-kits/ files | NOT IN DIFF | NONE |
| All worlds/ files | NOT IN DIFF | NONE |
| All app/ files | NOT IN DIFF | NONE |
| All qa/ files | NOT IN DIFF | NONE |

### Conflict analysis

Only **2 files** have any three-way merge conflict potential:

1. **`experience-config.js`** — The donor rewrites this file substantially. However, the receiving branch has NOT modified it since the common ancestor that both branches share. This means a merge or cherry-pick would apply cleanly — the donor's changes are purely additive from the perspective of the merge base.

2. **`index.html`** — Same situation. The receiving branch has modified this file (at some point during IW-2 development), but the donor's changes are localized to the `<head>` (CSS links) and `<script>` block (JS imports + installs). The actual HTML structure is the same.

### Critical finding: NO SHARED-FILE CONFLICTS

The donor branch diverged from a state that already contained the current authoring infrastructure (StudioShell, ConfigStore, etc.). Its modifications are:
- A rewrite of one file it owns (experience-config.js)
- A modification of the entry point (index.html)
- Addition of new files that don't exist on receiving

The 7 new Studio files import from `./studio-shell.js` and `../../app/ui/hud.js` and `../experience-config.js` — all of which exist identically on both branches.

---

## D. PORT / ADAPT / KEEP / DO-NOT-IMPORT MATRIX

| File | Verdict | Rationale |
|------|---------|-----------|
| **authoring/experience-config.js** | **PORT** | Schema 3 is purely additive over Schema 2. It adds new data domains without removing existing ones. The migrate() function handles v1→v2→v3 forward migration. All existing consumers (StudioShell, ConfigStore) use normaliseConfig() which remains API-compatible. |
| **index.html** | **ADAPT** | Cannot cherry-pick directly — must preserve the receiving branch's current HTML (including noscript block formatting and error handler). Port only the 3 CSS links and 4 JS imports + install calls. |
| **authoring/studio/museum-phase2.js** | **PORT** | Main Phase 2 Studio module. No conflicts with existing code. |
| **authoring/studio/visitor-phase1.js** | **PORT** | Visitor Phase 1 installer. Monkey-patches existing prototypes — needs verification that the patched methods still exist and have compatible signatures. |
| **authoring/studio/museum-phase2-hardening.js** | **PORT** | Hardening layer. Same monkey-patching concern. |
| **authoring/studio/museum-phase2-layout-fix.js** | **PORT** | Layout fix. Simple wrapper, low risk. |
| **authoring/studio/museum-phase2.css** | **PORT** | 6 lines of styles. |
| **authoring/studio/museum-phase2-hardening.css** | **PORT** | 75 lines of styles. |
| **authoring/studio/visitor-phase1.css** | **PORT** | 11 lines of styles. |
| **docs/MUSEUM_STUDIO_BREEZE_BOUNDED_INTEGRATION_CONTRACT_V1.md** | **PORT** | Directly relevant to this integration. |
| **docs/MUSEUM_CURRENT_STATE_INTEGRATION_HANDOFF_V2.md** | **PORT** | Integration handoff context. |
| **docs/MUSEUM_PHASE2_CAPABILITY_EXPANSION_V1.md** | **PORT** | Phase 2 spec — reference value. |
| **docs/MUSEUM_PHASE2_CURRENT_STATUS_HANDOFF_V1.md** | **PORT** | Status handoff — reference value. |
| **docs/MUSEUM_AUTHORING_CAPABILITY_REGISTRY_V1.md** | **PORT** | Capability registry. |
| **docs/MUSEUM_AUTHORING_CAPABILITY_REGISTRY_V2.md** | **PORT** | Updated capability registry. |
| **docs/CHATGPT_SCHEDULED_TASKS_AUTOMATION_MONITORING_OS_V1.md** | **PORT** | Methodology document — reference value. |
| **docs/MUSEUM_VISITOR_PHASE1_RECOVERY_PLAN_V1.md** | **PORT** | Visitor recovery plan — reference value. |

### Summary: PORT 16, ADAPT 1, KEEP 0, DO-NOT-IMPORT 0

The entire donor diff is clean additive work. No file needs to be excluded.

---

## E. PROPOSED MINIMUM CHANGE SET

### Phase 1: Schema upgrade (1 file)

1. Replace `authoring/experience-config.js` with donor's Schema 3 version.
   - This is the foundational change — all Studio modules depend on Schema 3 data shapes.
   - Risk: LOW. The migrate() function handles v1→v2 forward compat. normaliseConfig() API is compatible. All existing consumers use the same exports.

### Phase 2: Studio modules (7 files)

2. Add the 7 new files under `authoring/studio/`:
   - `museum-phase2.js` (247 lines)
   - `visitor-phase1.js` (67 lines)
   - `museum-phase2-hardening.js` (221 lines)
   - `museum-phase2-layout-fix.js` (28 lines)
   - `museum-phase2.css` (6 lines)
   - `museum-phase2-hardening.css` (75 lines)
   - `visitor-phase1.css` (11 lines)

   These files are purely additive — they import from existing modules and install themselves via monkey-patching.

### Phase 3: Entry point wiring (1 file, adapted)

3. Modify `index.html` to add CSS links and JS imports:
   - Add 3 CSS `<link>` elements in `<head>`
   - Add 4 JS `import` statements
   - Add `.then()` handler after `boot()` to install modules
   - Preserve existing error handler and HTML structure

### Phase 4: Documentation (8 files)

4. Add the 8 documentation files under `labs/immersive-worlds/docs/`.
   - No code impact. Reference and context value only.

### Phase 5: Verification

5. Verify the integration:
   - Author.html Studio loads with Phase 2 capabilities
   - Existing Museum visitor experience unregressed
   - Schema 3 migration from existing saved configs works
   - Breeze room lifecycle unregressed
   - Guided tour 12-stop journey unregressed
   - Save → preview → visitor → return cycle works

### Total change surface

- **1 file replaced** (experience-config.js: 595 → 334 lines, net -261)
- **1 file adapted** (index.html: +7 lines)
- **15 files added** (7 code + 8 docs)
- **0 files deleted**
- **0 engine/ files touched**
- **0 scene-kit/ files touched**
- **0 render/ files touched**
- **0 world/ files touched**
- **0 app/ files touched** (except index.html entry point)

---

## F. ROLLBACK / AUDIT MAP

### Rollback strategy

This integration starts from `6e6d6ca5` (the current approved Museum HEAD). At any point:

```bash
git reset --hard 6e6d6ca5
```

restores the exact approved state. The receiving branch (`claude/immersive-worlds-module-c0d3f7`) is not modified by this integration — all work happens on the new branch `integration/museum-full-studio-three-room-v1`.

### Audit checkpoints

| Checkpoint | Trigger | Verification |
|------------|---------|-------------|
| **POST-SCHEMA** | After experience-config.js replacement | ConfigStore.load() with existing saved configs still works. normaliseConfig() output includes new fields with defaults. |
| **POST-MODULES** | After adding 7 Studio files | No import errors. Files resolve their dependencies (studio-shell.js, hud.js, experience-config.js). |
| **POST-WIRING** | After index.html modification | Boot succeeds. installVisitorPhase1(), installMuseumPhase2(), etc. execute without errors. |
| **POST-DOCS** | After adding documentation | No code impact. Verify files are well-formed markdown. |
| **VISITOR-PARITY** | After full integration | Guided tour 12 stops. Forward/back/re-entry. Breeze lifecycle. HUD controls. |

### What must NOT break

These are the human-approved baselines from MUSEUM_CURRENT_EXECUTION_STATUS_2026-08-16.md:

1. Full Museum Studio current base
2. Visitor current base
3. Forward navigation
4. Same-room Back
5. Cross-room Back
6. Back → Forward
7. Crossing B
8. Breeze room lifecycle
9. Current save/config/preview/visible-piece flow
10. HUD controls (SALAS, SONIDO, VISITA, CONTENIDO EN TEXTO, transport bar)
11. Guided tour (12 stops)

### Donor branch protection

- `chatgpt/museum-phase2-capability-expansion` is NOT modified by this integration.
- All donor content is read via `git show` or `git checkout` of specific files.
- The donor branch's HEAD (`6b0de039`) remains pinned.

---

## G. PRE-FLIGHT VERDICT

### SAFE TO IMPLEMENT

**Rationale:**

1. **Minimal conflict surface.** Only 2 files modified on the donor, and the receiving branch has not diverged from the common ancestor in those files. No three-way merge conflicts expected.

2. **Purely additive architecture.** The donor adds new data domains (artists, documents, languages, visitor schedule/a11y/memory/commerce/support, entity sizing/accessibility/presentation, room accessibility) without removing or restructuring existing ones.

3. **Compatible APIs.** Schema 3's normaliseConfig() is a superset of Schema 2's output. The migrate() function handles forward compatibility. All existing consumers (StudioShell, ConfigStore, scene-kit) use the same exports with the same signatures.

4. **No engine/render/scene-kit changes.** The integration touches only the authoring layer and the entry point. The entire runtime — engine, camera authority, world state, scene kit, nested rooms, Breeze — is untouched.

5. **Clear rollback.** Single branch, single base commit. `git reset --hard 6e6d6ca5` restores everything.

6. **No prohibited patterns.** No second WorldGraph, no second CameraAuthority, no duplicate persistence, no iframe, no Breeze rebuild, no main/master mutation, no donor mutation.

### Bounded conditions

- After Schema 3 replacement, test that existing localStorage-saved configs (Schema 2) are correctly migrated by the updated migrate() function.
- After visitor-phase1.js install, verify that the monkey-patched StudioShell methods (`_visitor`, `_entityEditor`, `_bind`, `_save`, `_apply`) still have the expected signatures on the receiving branch's StudioShell.
- After museum-phase2-hardening.js install, verify the same for its patches.
- The Phase 2 modules use `window.__IW_STUDIO` and `window.__IW` globals — confirm these are set by the existing boot sequence before the install functions run.
