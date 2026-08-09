# IW-0 — Reference Ledger

> **Status:** PROPOSED — REQUIRES JUANMA REVIEW.  
> **Purpose:** define which references inform each subsystem, what may be extracted conceptually, what must not be copied, and where licensing verification is required.  
> **Important:** this ledger grants **no permission to copy code or assets**.

---

## 0. Ledger rules

For every subsystem:

1. name a **PRIMARY** source when one clearly exists;
2. use SECONDARY sources only for complementary patterns;
3. state exactly what is being extracted;
4. state what must not be copied/adopted;
5. resolve conflicts using the authority hierarchy below before implementation;
6. verify license before any direct code reuse;
7. verify asset-specific rights separately;
8. register actual intended reuse before implementation;
9. if license is absent/unclear, direct reuse is blocked;
10. visual/UX references may be quality bars without being code sources;
11. important entries may declare an explicit **Conflict policy** when two sources could plausibly recommend incompatible patterns.

Reference conflict hierarchy:

```text
APPROVED IW CONTRACT
→ PRIMARY REFERENCE
→ SECONDARY REFERENCES
```

A reference never silently overwrites an approved IW contract. A PRIMARY source has authority only for the narrow subsystem problem assigned to it. A SECONDARY source complements the PRIMARY source; it does not replace it without an explicit reviewed decision.

Reference category means **authority for a problem**, not dependency status.

Scope labels:

- `MUST V1`
- `SHOULD LATER`
- `R&D`

Reuse status values:

- `PATTERNS ONLY`
- `DIRECT REUSE NOT PLANNED`
- `LICENSE CHECK REQUIRED BEFORE REUSE`
- `BLOCKED UNTIL RIGHTS VERIFIED`

At IW-0, all source repositories default to **PATTERNS ONLY / DIRECT REUSE NOT PLANNED** unless explicitly changed later through review.

---

# 1. Engine subsystem contracts

## IW-REF-001 — Runtime / subsystem ownership

**Scope:** MUST V1  
**Primary:** `Juanmaes83/Claude-of-Duty` — `ARCHITECTURE.md` and runtime architecture  
**Secondary:** `Juanmaes83/threejs-game-skills`

**Extract:**

- subsystem ownership;
- declared dependencies;
- lifecycle hooks;
- central context/registry concepts;
- event vocabulary discipline;
- deterministic RNG/testing principles;
- explicit disposal;
- quality budgets;
- prewarm discipline;
- reproducible capture mentality.

**Adapt to IW:**

- replace shooter-specific subsystem vocabulary with World/Space/Entity/Camera/Experience semantics;
- preserve isolation and ownership principles;
- keep cross-subsystem access contractual rather than importing internals opportunistically.

**Do not copy/adopt:**

- weapons, combat, enemy AI, FPS-specific render/viewmodel architecture;
- shooter quality assumptions as Museum requirements;
- procedural-only asset constraint.

**Conflict policy:** approved IW ownership/canonical-state contracts win. `Claude-of-Duty` is primary for subsystem discipline; `threejs-game-skills` may refine QA/orchestration but must not introduce conflicting ownership.  
**Reuse status:** PATTERNS ONLY.  
**License:** must be verified before any direct source reuse.

---

# 2. Space lifecycle / performance architecture

## IW-REF-002 — Space lifecycle and warmup

**Scope:** MUST V1  
**Primary:** `Juanmaes83/portfolio-itom-and-advanced-WebGL`  
**Secondary:** `Juanmaes83/Claude-of-Duty`

**Extract:**

- RoomWarmup concept;
- asynchronous shader compilation/warmup patterns;
- room lifecycle;
- room manager;
- adaptive device tiers;
- dynamic DPR;
- asset loading discipline;
- semantic fallback;
- mobile-conscious rendering.

**Adapt to IW:**

```text
Room → Space
Room Manager → Space Lifecycle Manager
Portfolio room → generic Scene Kit Space
```

**Do not copy/adopt:**

- infinite corridor as product metaphor;
- portfolio-specific room semantics;
- exact cache counts without measurement;
- exact visual styling.

**Conflict policy:** approved IW Space/Asset lifecycle contracts win. ITom is primary for room/Space warmup and adaptive loading; Claude-of-Duty is secondary for lifecycle/disposal discipline. Numeric cache/window decisions require IW evidence rather than either reference's constants.  
**Reuse status:** PATTERNS ONLY.  
**License:** check required before direct reuse.

---

# 3. Museum Focus Camera

## IW-REF-003 — Focus Camera

**Scope:** MUST V1  
**Primary:** `Juanmaes83/artwork-3D-museum`  
**Secondary quality reference:** TheVertMenthe

**Extract:**

- content world position as camera input;
- content front direction;
- focus target calculation;
- responsive framing;
- mobile-specific distance/framing awareness;
- focus/return mental model.

**Adapt to IW:**

```text
Artwork-specific camera
→ FocusableEntity camera contract
```

Focus must operate on semantic bounds/Anchors instead of Museum-only constants where practical.

**Do not copy/adopt:**

- exact gallery styling;
- hard-coded artwork assumptions;
- fixed distances as universal constants;
- third-party museum assets.

**Conflict policy:** the IW camera invariant — exactly one authoritative camera controller per frame — always wins. `artwork-3D-museum` is primary for Focus framing mechanics; TheVertMenthe is secondary as interaction/quality evidence and cannot redefine camera ownership.  
**Reuse status:** PATTERNS ONLY.  
**License:** repo/file license must be checked before any direct code adaptation. TheVertMenthe is treated as UX/interaction reference unless rights explicitly support more.

---

# 4. Museum spatial construction

## IW-REF-004 — Gallery construction order

**Scope:** MUST V1  
**Primary:** `Juanmaes83/3D-art-gallery-threejs`  
**Secondary:** `Juanmaes83/artwork-3D-museum`

**Extract:**

- build order from room shell to content;
- walls/floor/ceiling relationships;
- art placement;
- statues/models;
- lighting fundamentals;
- navigation dependencies;
- commit-history learning about progressive construction.

**Adapt to IW:**

Use as evidence for safe Museum Scene Kit construction sequence, not as the universal runtime architecture.

**Do not copy/adopt:**

- final scene wholesale;
- exact geometry/layout;
- bundled art/assets without rights verification;
- legacy implementation constraints if they conflict with IW contracts.

**Conflict policy:** IW semantic/runtime contracts win. `3D-art-gallery-threejs` is primary only for Museum construction sequencing; `artwork-3D-museum` may improve component/focus patterns but does not replace the selected construction evidence silently.  
**Reuse status:** PATTERNS ONLY.  
**License:** required before direct code reuse; asset rights checked separately.

---

# 5. Data-driven Museum authoring

## IW-REF-005 — Content placement from data

**Scope:** MUST V1  
**Primary:** `Juanmaes83/3DArtMuseum`  
**Secondary:** IW semantic schema

**Extract:**

- parameterized placement;
- content data separated from scene logic;
- wall/side placement as authoring concept;
- media/audio/description metadata attached to content.

**Adapt to IW:**

Legacy calls such as directional add helpers become typed semantic placement data, Anchor references and Scene Kit placement helpers.

**Do not copy/adopt:**

- old API shape as final public schema;
- hardcoded room geometry;
- legacy browser assumptions.

**Conflict policy:** approved IW schema/canonical-record invariants override the legacy API shape. The repo informs data-driven authoring but cannot create duplicate World/Space Entity ownership.  
**Reuse status:** PATTERNS ONLY.

---

# 6. World Graph / connectivity

## IW-REF-006 — Space graph and deterministic connectivity

**Scope:** MUST V1 for graph concepts; procedural generation is R&D  
**Primary:** `Juanmaes83/threejs-procedural-dungeon`  
**Secondary:** `Juanmaes83/-threejs-evidence-graph`

**Extract:**

- room/node graph;
- connectivity;
- deterministic structure;
- relationship representation;
- graph performance awareness.

**Adapt to IW:**

```text
Dungeon Room → Space
Dungeon Connection → Portal / WorldGraph edge
Evidence Node → semantic Space/Entity node where appropriate
```

**Do not copy/adopt:**

- dungeon aesthetics;
- random procedural generation as V1 requirement;
- detective visual language;
- evidence-board metaphors.

**Conflict policy:** approved IW distinction `World Graph ≠ World Map ≠ Route` and `Hotspot ≠ Portal` wins. Dungeon is primary for connectivity semantics; evidence-graph is secondary for relationship/visual graph considerations.  
**Reuse status:** PATTERNS ONLY.  
**Future:** procedural layout remains R&D unless promoted by explicit decision.

---

# 7. World Map

## IW-REF-007 — World Map relationships

**Scope:** MUST V1  
**Primary:** `Juanmaes83/-threejs-evidence-graph` for relationship architecture  
**Secondary:** `threejs-procedural-dungeon` for connected-space graph semantics; Casebook V3/V4 only as lessons learned, not base implementation.

**Extract:**

- nodes/edges;
- connection rendering discipline;
- graph scaling/performance considerations;
- distinction between semantic graph and visual representation.

**Do not copy/adopt:**

- detective styling;
- Casebook board state;
- Casebook map implementation as mandatory architecture;
- thread/pin metaphors.

**Conflict policy:** approved IW World Graph semantics are authoritative. Evidence-graph is primary for map/relationship representation; dungeon connectivity is secondary; Casebook is lessons-only and cannot reintroduce Board state into World state.  
**Reuse status:** PATTERNS ONLY.

---

# 8. Scene Kit construction workflow

## IW-REF-008 — Scene build passes

**Scope:** MUST V1 methodology  
**Primary:** `Juanmaes83/img2threejs`

**Extract:**

```text
SPEC
→ BLOCKOUT
→ STRUCTURE
→ FORM
→ MATERIAL
→ LIGHTING
→ INTERACTION
→ OPTIMIZATION
```

**Adapt to IW:**

Use this as a Scene Kit production/QA workflow. Each pass must have an exit criterion before visual polish proceeds.

**Do not copy/adopt:**

- any reference-specific scene decomposition as universal content schema;
- automatic assumptions that visual reconstruction equals semantic authoring.

**Conflict policy:** Scene Kit workflow never overrides IW engine semantics, canonical ownership or V1 scope. If a visual reconstruction technique conflicts with semantic authoring, the IW contract wins.  
**Reuse status:** METHODOLOGY / PATTERNS ONLY.

---

# 9. Continuous world / chapters

## IW-REF-009 — Continuous-world storytelling

**Scope:** MUST V1 for principles; richer motion SHOULD LATER  
**Primary:** Kage / `Juanmaes83/kage`  
**Secondary:** `MengTo/skills`

**Extract:**

- one connected world mental model;
- chapter handoff;
- camera travel;
- layered depth;
- reversible/controlled navigation ideas;
- hybrid 2D/3D composition;
- atmosphere.

**Adapt to IW:**

Use story/chapter principles above generic World State. Do not encode Kage's visual identity into engine contracts.

**Do not copy/adopt:**

- Japanese aesthetic;
- exact scenes/assets;
- code without verified license;
- scroll as mandatory control mode for Museum Explore.

**Conflict policy:** approved IW World State and camera-authority contracts win. Kage is primary for continuous-world/chapter experience; MengTo skills are secondary technique references and cannot introduce a second camera authority or alternate World State.  
**Reuse status:** PATTERNS / QUALITY REFERENCE.  
**License:** verify repo/file rights before any code reuse.

---

# 10. Experience transport / audio

## IW-REF-010 — Experience Director transport

**Scope:** MUST V1 thin transport; full timeline SHOULD LATER  
**Primary:** `Juanmaes83/a-long-expected-party`

**Extract:**

- play;
- pause;
- restart/reset concepts;
- chapter transport;
- synchronized cues;
- ambience;
- narration timing.

**Adapt to IW:**

V1 uses the minimum transport needed to demonstrate Guided Experience. It must not trigger development of a full professional timeline editor.

**Do not copy/adopt:**

- project-specific story content;
- exact UI;
- exact timeline structure unless it survives IW schema review.

**Conflict policy:** approved IW Experience Director/Action/Portal/camera contracts win; this reference informs transport and synchronization only.  
**Reuse status:** PATTERNS ONLY.

---

# 11. Cinematic motion / handoffs

## IW-REF-011 — Camera + DOM / editorial motion

**Scope:** SHOULD LATER for richer transitions; selected V1 use where necessary  
**Primary:** `Juanmaes83/gsap-threejs-codrops`  
**Secondary:** relevant `MengTo/skills`

**Extract:**

- GSAP timeline orchestration;
- camera/DOM synchronization;
- editorial transitions;
- handoff composition.

**Do not copy/adopt:**

- decorative motion by default;
- scroll hijacking as universal interaction;
- motion that violates reduced-motion requirements.

**Conflict policy:** IW camera authority, reduced-motion and Portal transition semantics win over motion technique preferences.  
**Reuse status:** PATTERNS ONLY / LICENSE CHECK REQUIRED BEFORE REUSE.

---

# 12. Portal visual transitions

## IW-REF-012 — Shader/image transition techniques

**Scope:** SHOULD LATER; V1 only if justified by a portal quality requirement  
**Primary:** `Juanmaes83/webGLImageTransitions`

**Extract:**

- displacement concepts;
- mask transitions;
- texture handoffs;
- transition lifecycle ideas.

**Do not copy/adopt:**

- shader effects as decorative default;
- visual transition owning Portal semantics;
- exact shaders without license verification.

**Conflict policy:** Portal semantic transition behaviour is authoritative. This reference may realize representation/handoff only; it cannot define whether Spaces are connected or what activates a Portal.  
**Reuse status:** PATTERNS ONLY.

---

# 13. Museum content experience

## IW-REF-013 — Catalog / metadata / multilingual patterns

**Scope:** SHOULD LATER, with metadata concepts influencing V1  
**Primary:** `Juanmaes83/vortex-gallery`

**Extract:**

- content catalog organization;
- metadata UX;
- multilingual patterns;
- gallery navigation/content experience.

**Do not copy/adopt:**

- conversion UI unrelated to Museum prototype;
- existing branding/layout as universal Experience UI.

**Reuse status:** PATTERNS ONLY.

---

# 14. Product / Showroom future Scene Kit

## IW-REF-014 — Product focus/orbit

**Scope:** SHOULD LATER  
**Primary:** `Juanmaes83/camera-3D-showroom`

**Extract:**

- hero product presentation;
- orbit/detail behavior;
- object/context composition.

**Do not copy/adopt:**

- product brand assets;
- showroom assumptions into Museum V1;
- orbit as mandatory universal navigation.

**Reuse status:** PATTERNS ONLY.

---

# 15. Three.js fundamentals

## IW-REF-015 — Technical foundation reference

**Scope:** MUST V1 support reference  
**Primary:** `Juanmaes83/threejs-journey`

**Extract:**

- camera;
- materials;
- loaders;
- lights;
- raycasting;
- shadows;
- PBR;
- environment;
- performance fundamentals.

**Authority rule:** use for fundamentals, not to override IW domain architecture.

**Reuse status:** PATTERNS / LEARNING REFERENCE.

---

# 16. Technical art

## IW-REF-016 — Rendering/technical-art quality

**Scope:** MUST V1 support reference  
**Primary:** `Juanmaes83/Threejs-Awesome-Graphics-Agent-Skills`

**Extract:**

- authored camera direction;
- lighting/material discipline;
- shader patterns;
- visual validation;
- anti-cheap-graphics practices.

**Do not copy/adopt:**

- generic effects disconnected from Museum art direction;
- quality claims without browser evidence.

**Reuse status:** PATTERNS / PROCESS REFERENCE.

---

# 17. QA orchestration

## IW-REF-017 — Deterministic QA and browser verification

**Scope:** MUST V1  
**Primary:** `Juanmaes83/threejs-game-skills` QA/debug skills  
**Secondary:** `Claude-of-Duty`

**Extract:**

- deterministic states;
- Playwright/browser QA;
- performance profiling;
- visual capture;
- mobile QA;
- reproducibility;
- scorecards used as evidence, not self-congratulation.

**Do not copy/adopt:**

- game-specific pass criteria without Museum relevance.

**Conflict policy:** IW Museum quality gates and deterministic named-state contracts win. `threejs-game-skills` is primary for browser/QA orchestration; Claude-of-Duty is secondary for reproducibility/engine discipline.  
**Reuse status:** PROCESS / PATTERNS ONLY.

---

# 18. Gauntlet quality loop

## IW-REF-018 — Adversarial comparison

**Scope:** MUST V1  
**Primary:** `Juanmaes83/gauntlet-loop`  
**Secondary:** `Juanmaes83/gauntlet-loop-aim-prompt-skill`, `Claude-of-Duty`

**Extract:**

```text
NAMED BAR
→ BUILD
→ FRESH CRITIC
→ COMPARISON
→ ITERATE IF OURS LOSES
→ HUMAN REVIEW
```

**Do not adopt:**

- arbitrary numeric self-ratings as exit gate;
- fixed number of iterations;
- builder self-certification.

**Reuse status:** METHODOLOGY.

---

# 19. Unslop

## IW-REF-019 — Visual anti-slop

**Scope:** MUST V1  
**Primary:** `Juanmaes83/unslop` / upstream `mshumer/unslop`

**Extract:**

- browser-based visual inspection;
- detection of generic repeated AI patterns;
- before/after evidence;
- domain-specific anti-pattern profile.

**Adapt to IW:**

Create a Museum/Institutional anti-slop checklist that states what to reject without imposing a single replacement style.

**Do not copy/adopt:**

- upstream code/skill content without license verification;
- anti-slop as automatic design authority over Juanma's art direction.

**Reuse status:** PROCESS/PATTERNS; LICENSE CHECK REQUIRED BEFORE DIRECT REUSE.

---

# 20. Quality bars — external experience references

These are primarily **visual/interaction comparison bars**, not presumed code sources.

## IW-QB-001 — Free exploration

**Reference:** TheVertMenthe  
**Use:** spatial presence, artwork approach, proximity, focus, detail, scale.  
**Scope:** MUST V1 quality bar.  
**Do not copy:** brand, art assets, exact UI, proprietary code.

## IW-QB-002 — Scenography / restraint

**Reference:** Cartier Watches & Wonders experience  
**Use:** composition, hero hierarchy, camera, lighting/material restraint, chapter variation, low-noise UI.  
**Scope:** MUST V1 visual direction comparison where comparable.  
**Do not copy:** brand, products, assets, proprietary implementation.

## IW-QB-003 — Continuous world / chapter camera

**Reference:** Kage  
**Use:** connected-world continuity, chapter handoffs, camera travel.  
**Scope:** MUST V1 experience bar / SHOULD LATER for advanced motion.  
**Do not copy:** aesthetic identity/assets.

## IW-QB-004 — Timeline / synchronized experience

**Reference:** A Long Expected Party  
**Use:** transport, chapters, audio/narration synchronization.  
**Scope:** MUST V1 functional bar for thin Guided Experience.

## IW-QB-005 — Engine / performance discipline

**Reference:** Claude-of-Duty + ITom architecture patterns  
**Use:** explicit ownership, warmup, budgets, reproducibility, disposal.  
**Scope:** MUST V1 engineering bar.

---

# 21. R&D references

The following may inform future architecture but are not allowed to expand V1 scope without explicit promotion.

## IW-RD-001 — AI Guide

**Reference:** `Juanmaes83/3D-ai-school-threejs`  
**Potential:** curator, archivist, concierge, teacher, creative director.  
**Scope:** R&D.  
**V1 rule:** architecture must not intentionally block it, but no AI Guide implementation.

## IW-RD-002 — Avatar / embodied visitor

**Reference:** `Juanmaes83/3d-web` and other validated avatar references.  
**Scope:** R&D / possible SHOULD LATER.  
**V1 rule:** do not require avatar for Museum proof.

## IW-RD-003 — Generative worlds

**References:** future validated world/rendering repos including AlayaWorld / AlayaRenderer / WildWorld if inspected and relevant.  
**Scope:** R&D.  
**V1 rule:** no generative world requirement.

---

# 22. Reuse register

No direct code or asset reuse is authorized in IW-0.

| Reuse ID | Source | Target subsystem | Planned direct reuse? | License verified? | Asset rights verified? | Status |
|---|---|---|---|---|---|---|
| — | — | — | **No** | N/A | N/A | IW-0 uses patterns only |

Before implementation adds a direct reuse candidate, create a row containing:

- exact repository;
- exact file(s)/asset(s);
- source commit SHA/tag;
- license;
- attribution requirement;
- target file/subsystem;
- why reuse is necessary vs independent implementation;
- modification scope;
- legal/technical risk;
- Juanma review status if material.

---

# 23. Conflict policy

When references disagree:

```text
APPROVED IW CONTRACT
→ PRIMARY REFERENCE
→ SECONDARY REFERENCES
```

Rules:

1. approved IW contracts and explicit current Product Owner decisions are authoritative;
2. a PRIMARY source wins only inside the narrow subsystem problem it was assigned and only when no approved IW contract decides otherwise;
3. a SECONDARY reference may complement but not silently override a PRIMARY source;
4. a reference never silently overwrites an approved IW engine decision;
5. important Ledger entries may declare a stricter local conflict policy where competing references could plausibly diverge;
6. any material unresolved conflict becomes an ADR in `DECISION_LOG.md` before implementation.

This prevents “reference soup”: no agent may combine attractive patterns from unrelated repos without explaining compatibility, authority and ownership.