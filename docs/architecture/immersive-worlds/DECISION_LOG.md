# IW-0 — Decision Log

> **Document status:** ACTIVE WORKING LOG.  
> **Important:** a decision explicitly made by Juanma may be recorded as a product decision even while the overall IW-0 Constitution remains **PROPOSED**.  
> **Rule:** proposed ADRs do not become approved architecture until Juanma explicitly reviews them.

---

## Status vocabulary

- `PRODUCT DECISION — EXPLICIT`: directly instructed/confirmed by Juanma.
- `PROPOSED`: architecture proposal awaiting Juanma review.
- `APPROVED`: explicitly approved by Juanma after review.
- `SUPERSEDED`: replaced by a newer decision.
- `REJECTED`: intentionally not adopted.
- `R&D`: deliberately outside current implementation scope.

---

# Product-owner decisions already explicit

## IW-DEC-001 — Immersive Worlds is separate from Boards / Casebook

**Status:** PRODUCT DECISION — EXPLICIT  
**Date:** 2026-08-09

**Decision**

Immersive Worlds is a new first-level product family. It is not Casebook V5 and must not be constructed on top of Boards as a required architecture.

**Consequence**

Casebook V4 is a protected baseline and learning source, not the new engine base.

---

## IW-DEC-002 — Protected baseline policy

**Status:** PRODUCT DECISION — EXPLICIT  
**Date:** 2026-08-09

**Decision**

Existing approved versions/modules are **protected baselines**, not metaphysically immutable artifacts.

They must not be modified, removed or refactored without explicit, informed authorization. A conscious bug fix or approved change remains possible.

---

## IW-DEC-003 — Local-first / isolated-branch workflow

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

Implementation must follow:

```text
clone / verified checkout
→ local test
→ isolated branch
→ local/browser QA
→ navigable preview
→ Juanma visual review
→ explicit merge authorization
```

No direct development on `master`.

**Exception note**

The documentation-only continuity checkpoint in PR #38 was created through the GitHub connector after local DNS resolution failed. This exception does not authorize runtime implementation without a local verified checkout.

---

## IW-DEC-004 — No shared/global changes without stop-and-review

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

Immersive Worlds must be additive and isolated. If implementation appears to require shared/global Escaparates Pro changes, stop and present impact before modifying them.

---

## IW-DEC-005 — First vertical is Museum / Institutional

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

The first native Scene Kit / proof vertical is Museum / Institutional, not Fashion.

**Reason**

It exercises spatial architecture, content, focus, portals, navigation, routes, metadata, accessibility, performance and storytelling while avoiding another Fashion-specific engine compromise.

---

## IW-DEC-006 — Museum V1 uses controlled content

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

```text
CONTENT = controlled / fictitious / owned / licensed
QUALITY BAR = real
```

The prototype must not depend on real museum rights, inconsistent collections or institutional integrations.

---

## IW-DEC-007 — Final destination is no-code/low-code; V1 uses thin authoring

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

Long-term product goal: visual no-code / low-code authoring.

V1 implementation must remain a **thin authoring layer** sufficient to edit/prove:

- World;
- Space;
- Content;
- Hotspot;
- Portal;
- Route.

Do not build a Unity-like universal editor, full asset browser, infinite inspector or professional timeline in V1.

---

## IW-DEC-008 — First-level category, delayed shared navigation integration

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

Immersive Worlds is conceptually a first-level category in Escaparates Pro. However, its shared navigation/registry entry is not added before the isolated module is stable and visually approved.

---

## IW-DEC-009 — Reference taxonomy is multidimensional

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

Do not use one simplistic `CORE / SUPPORT / R&D` list.

Use:

- CORE ENGINE;
- CORE MUSEUM / INSTITUTIONAL;
- CORE EXPERIENCE / MOTION;
- CORE QUALITY;
- SPECIALIST REFERENCES;
- R&D / FUTURE.

A source may be core for one vertical/subsystem without defining the universal engine.

---

## IW-DEC-010 — Specialist references are not demoted to R&D by default

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

`img2threejs`, `threejs-procedural-dungeon` and `-threejs-evidence-graph` are specialist references with near-term architectural value, even though they are not universal engine dependencies.

---

## IW-DEC-011 — IW-0 contracts before physical code topology

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

IW-0 may propose logical responsibility boundaries but must **not** prematurely decide monorepo/packages/directories/framework topology.

Physical code organization follows repository inspection and approved contracts.

---

## IW-DEC-012 — Reference Ledger is mandatory

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

Each subsystem needs explicit source authority:

```text
PRIMARY
SECONDARY
EXTRACT
ADAPT
DO NOT COPY
RISK / LICENSE
```

This exists to prevent incompatible reference mixing.

---

## IW-DEC-013 — GitHub is shared project memory

**Status:** PRODUCT DECISION — EXPLICIT, with governance refinement

**Decision**

GitHub approved architecture/ADRs and verified code form the shared persistent memory between Juanma, ChatGPT and implementation agents.

Authority order proposed in Constitution:

```text
1. Juanma explicit current decision
2. Approved GitHub architecture / ADRs
3. Verified current branch + code
4. Proposed/working documents
5. Chat/agent hypotheses
```

If a new Juanma instruction changes approved architecture, update the decision record before affected implementation resumes.

---

## IW-DEC-014 — Coupled subsystems require clear ownership

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

Do not fan out multiple coding agents across tightly coupled WebGL systems simply for speed.

Parallelism is encouraged for independent research/critique/QA, but camera/navigation, lighting/materials, world/persistence, lifecycle/assets, timeline/audio and similar pairs require clear ownership and controlled integration.

---

## IW-DEC-015 — IW-0 is proposed, not approved

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

Producing IW-0 does not make IW-0 approved. Juanma must explicitly review it.

---

## IW-DEC-016 — Reference code/assets require license + necessity review

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

No source code or asset from reference repos may be copied merely because it is useful.

Before direct reuse:

- verify license;
- verify asset-specific rights;
- justify why reuse is needed;
- register exact reuse in Reference Ledger;
- preserve attribution/obligations.

IW-0 authorizes no direct code/asset reuse.

---

## IW-DEC-017 — Every proposal uses MUST V1 / SHOULD LATER / R&D

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

All proposed capabilities/work packages must be scope-labelled so Museum V1 cannot become an infinite project.

---

## IW-DEC-018 — One semantic object has one canonical record

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

The semantic model must enforce this invariant:

```text
ONE SEMANTIC OBJECT
ONE CANONICAL RECORD
MULTIPLE REFERENCES
```

World, Space, Route, Scene Kit and other systems may reference the same semantic object by stable ID, but must not own divergent duplicate records for it.

**Not decided here**

Maps, arrays, stores, ECS, normalized state and other physical storage techniques remain open.

---

## IW-DEC-019 — Hotspot triggers; Portal connects

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

Hotspot and Portal must not duplicate transition responsibility.

- Hotspot = interaction / trigger semantics.
- Portal = spatial connection / transition semantics.

A valid relationship is:

```text
Hotspot
→ ACTIVATE_PORTAL
→ Portal
```

A Portal does not need a Hotspot to exist, and a Hotspot does not become a Portal merely because its Action leads to another Space.

---

## IW-DEC-020 — Scene Kit owns visual realization

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

Semantic Entity/World records may carry presentation intent, representation hints or references when useful, but they must not own:

- mesh implementation;
- material implementation;
- shader implementation;
- Scene Kit implementation;
- Three.js object identity.

Scene Kit retains ownership of visual realization.

---

## IW-DEC-021 — Portal behaviour is separate from Portal representation

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

Portal spatial-transition behaviour and visual representation are separate concepts.

Conceptually:

```text
TRANSITION BEHAVIOUR
continuous / cut / teleport / cinematic / equivalent

REPRESENTATION HINT
door / screen / artwork / window / none / equivalent
```

Exact enums and implementation remain open. A visual door is not the semantic definition of a Portal.

---

## IW-DEC-022 — Action is a semantic contract concept

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

IW must include `Action` as a semantic concept so Scene Kits do not invent arbitrary incompatible callbacks for equivalent interactions.

Conceptual actions may include:

- `FOCUS_ENTITY`;
- `PLAY_MEDIA`;
- `OPEN_INFO`;
- `ACTIVATE_PORTAL`;
- `START_ROUTE`;
- `TRIGGER_STORY`;
- `SET_STATE`.

The exact taxonomy and execution mechanism remain open. V1 must not become a giant general-purpose Action Engine.

---

## IW-DEC-023 — Anchor is a generic spatial reference concept

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

IW must include a generic `Anchor` concept for reusable semantic spatial references used by placement, Hotspots, Portals, Focus Camera, labels, lights, spawn points and related spatial relationships.

The exact technical representation remains open. The purpose is to avoid hard-coded absolute coordinates distributed across subsystems.

---

## IW-DEC-024 — Reference conflict hierarchy is explicit

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

Reference conflicts resolve conceptually as:

```text
APPROVED IW CONTRACT
→ PRIMARY REFERENCE
→ SECONDARY REFERENCES
```

A reference may inform or challenge a contract through review, but may never silently overwrite an approved IW decision. Important Reference Ledger entries should state their conflict policy where competing sources could disagree.

---

## IW-DEC-025 — MUST V1 is grouped for execution, not re-architected

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

MUST V1 should be grouped into execution-friendly buckets such as:

```text
FOUNDATION
EXPERIENCE
QUALITY
```

or an equivalent minimal grouping.

This grouping exists only to make implementation milestones legible. It does not create a new architecture or expand scope.

---

## IW-DEC-026 — Exactly one authoritative camera controller per frame

**Status:** PRODUCT DECISION — EXPLICIT

**Decision**

At any frame there is exactly one authoritative camera controller.

Conceptual authority states may include:

```text
AUTHOR
EXPLORE
FOCUS
DIRECTED
TRANSITION
```

Two subsystems may never write authoritative camera state simultaneously. Camera ownership handoff must be explicit and testable.

---

## IW-DEC-027 — PROJECTION is an entity kind, not an effect on one artwork

**Status:** PRODUCT DECISION — EXPLICIT

**Trigger**

GRAFT 01. `entity.video.cuaderno-de-luz` was represented as a bezelled wall panel:
a flat-screen television in a dark exhibition room. The graft's stated goal was to
turn "video on a wall" into "light in architecture".

**Decision**

Projected light is a first-class `ENTITY_KIND.PROJECTION`, sitting beside ARTWORK,
SCULPTURE, VIDEO, AUDIO, TEXT and OBJECT_3D — not a special case bolted onto the
existing VIDEO representation, and not a hardcoded effect belonging to one work.

Consequences, all enforced by QA:

1. Field size comes from `entity.size`; light behaviour from `content.projection`
   (`intensity`, `spill`, `reflection`, `keystone`, `feather`, `vignette`, `tint`,
   optional `text`); the image from `content.media.src` through the normal
   MediaLoader path — so a projection of a different work, at a different size, in a
   different colour is authoring, not code. `PROJECTION-FROM-DATA` asserts this by
   building a second projection from different data and requiring a different result.
2. A PROJECTION mounts **no object on the wall**: no frame, no bezel, no panel,
   nothing with thickness. `PROJECTION-NO-PANEL` asserts zero box volumes in the group.
   VIDEO keeps its bezelled panel — the two kinds mean different things and a world
   may legitimately contain both.
3. The keystone is baked into the field's vertices rather than applied as a view-
   dependent transform, so the projection is correct from every viewpoint. See the
   reuse register for why the source's `matrix3d` corner-pin was rejected.

**Not decided here**

Flexible Media, projection authoring UI, homography editing, and multi-surface
mapping remain out of scope.

---

## IW-DEC-028 — The tour has one order, and everything tour-facing derives from it

**Status:** PRODUCT DECISION — EXPLICIT

**Trigger**

The Tour Control Pass. The review panel's ①…⑪ had drifted from the route it claimed
to represent: the eleven badges landed on paradas 3, 4, 5, 6, 7, 9, 11, 12, 13, 15,
16, and paradas 1, 2, 8, 10, 14 and 17 were unreachable from the panel at all. Two
QA states reached a step by counting `next()` calls, and one of them —
`museum:guided-completed` — had rotted into stopping at parada 10 of 17 while still
calling itself the end of the tour. Full evidence in `TOUR_ORDER_AUDIT_BEFORE.md`.

**Decision**

1. **One authoritative order: `route.chapterRefs → chapter.stepRefs`.** It already
   existed and the Experience Director already consumed it. Nothing else may hold a
   sequence — not the panel, not a manifest file, not a test.

2. **A Tour Step is a narrative moment; a beat is a StoryStep.** A beat opens a Tour
   Step by carrying `tourStep: { title }`. The marker carries **no number**: the
   number is its position in the filtered list, which makes contiguity structural
   rather than maintained. Seven Tour Steps over seventeen beats.

3. **Numbering every internal transition is forbidden.** A lead, an accompanied shot
   and a yield are one moment. Making them three numbers would be a slide deck.

4. **Direct jump is reconstruction, not seek, and is named that way in the UI and
   the docs.** A seekable authored timeline stays SHOULD LATER (Constitution §16).
   Backwards navigation restarts and replays; that cost is stated rather than hidden.

5. **Reaching a step by counting `next()` calls is banned.** `runtime.goToTourStep(id)`
   is the one door, for the panel, the keyboard and every test.

6. **Tour navigation and QA/debug states are different information architecture.**
   They may share a panel; they may not share a visual language or a list.

**Consequences**

`engine/experience/tour-manifest.js` groups the order and validates the closed-tour
invariants. The Director gains `currentTourStep`, `nextTourStep`, `previousTourStep`
and `seekToTourStep` — the first `previous` the tour has ever had. Twelve QA checks
fail on any ordering regression, three of them by driving the real prototype end to
end. The contract is written up in `MUSEUM_GUIDED_TOUR_CONTRACT.md`, including how to
add Tour Step N+1 without touching anything derived.

**Not decided here**

Seekable timelines, tour branching, multiple routes per world, and any change to the
shipped visitor HUD beyond what already existed.

---

## IW-DEC-029 — Beat C is a visitor figure, and Beat D is empty of people

**Status:** PRODUCT DECISION — EXPLICIT

**Trigger**

The Experience Grammar reconciliation audit. A, B and D already existed under other
names; C did not exist at all, and Beat D was impure at the Projection, where the
guide's head stayed in frame during the dwell.

**Decision**

1. **Beat C is absent only in the conventional Artwork Stops** that use the Artwork
   A/B/C/D grammar — Stops 02, 03 and 05. Bienvenida, the threshold Stop 04 and
   Cierre do not take it. The Projection has its own specialised C: *guide yields*.
   The audit's earlier phrasing "absent across the board" was too broad.

2. **The human in Beat C is a visitor, not the guide.** The guide is the mediator;
   the point of C is that mediation has withdrawn and a person is simply looking.
   Reusing her would have read as "the guide looking at the work".

3. **The visitor figure is the guide's geometry with the bun removed** and a quieter
   palette. Explicitly provisional. It is not an avatar system, an NPC, or a
   character rig — it is one reusable figure that makes the semantic function
   legible. Avatar quality is deferred.

4. **Beat D contains no human figure at all.** For the Projection this meant
   splitting the 26 s dwell into a 7 s Beat C where the guide yields and a 22 s
   Beat D with no guide staged. Dismissing her is robust; widening her step aside
   would have depended on the aspect ratio.

5. **One new camera composition was required and only one was built.** No artwork
   image, no geometry, no room, no second rig. `_contemplationFraming` derives the
   camera from the work's own size and normal and the figure's position, so a
   fourth Artwork Stop needs an anchor and a beat, not code.

**Consequences**

`SHOT_INTENT.CONTEMPLATION`; `buildVisitorFigure`; a `visitor` field on StoryStep
authored exactly like `guide`, dismissed on any beat that does not ask for one —
which is what keeps Beat D empty without a special case. The route grows from 17 to
21 beats over the same 7 Stops. Four QA checks assert who is in frame at each beat.

**Not decided here**

Avatar quality, multiple visitor figures, visitor movement, and any Beat C for
Stops that do not use the Artwork grammar.

---

# Architecture decisions awaiting review

## IW-ADR-001 — Semantic data and representation are separate

**Status:** PROPOSED

**Context**

Museum content, Fashion content and Real Estate content need different visual treatments without rebuilding World semantics.

**Proposal**

Generic World/Space/Entity/Hotspot/Portal/Route schemas exist independently from Scene Kit representations.

Each semantic object has one canonical record; other structures reference it by stable identity rather than owning divergent duplicates. Semantic records may express presentation intent but Scene Kit owns meshes/materials/shaders/Three.js realization.

**Alternatives**

1. vertical-specific data models;
2. scene objects as data source of truth;
3. generic semantic model + Scene Kits.

**Recommendation**

Option 3.

**Consequence**

Higher initial schema discipline; much stronger reuse across verticals.

---

## IW-ADR-002 — World State is independent from camera authority

**Status:** PROPOSED

**Proposal**

Camera has explicit authority states such as AUTHOR / EXPLORE / FOCUS / DIRECTED / TRANSITION. Camera never owns World State.

At any frame exactly one camera controller is authoritative; handoff is explicit and testable.

**Reason**

Avoid the Casebook V4 class of conflicts where multiple camera metaphors and world/board state became entangled.

---

## IW-ADR-003 — Explore and Guided Experience share one World State

**Status:** PROPOSED

**Proposal**

Explore Controller and Experience Director orchestrate the same World/Space/Entity state rather than duplicate worlds.

**Consequence**

Requires clean ownership transitions but prevents divergent content/state.

---

## IW-ADR-004 — Hotspot triggers, Portal connects; visual markers are optional

**Status:** PROPOSED

**Proposal**

Hotspot describes interaction/trigger semantics. Portal describes spatial connection/transition semantics. A Hotspot may request an `ACTIVATE_PORTAL` Action targeting a Portal, but the two contracts do not duplicate responsibility.

Portal transition behaviour is separate from Scene Kit visual representation. Neither Hotspot nor Portal requires a visible floating marker.

---

## IW-ADR-005 — Authoring and published experience are separate responsibilities

**Status:** PROPOSED

**Proposal**

Author Mode and Experience Mode have separate responsibilities and UI contracts.

**Not decided here**

Whether they become separate bundles/packages/directories. That is deliberately deferred.

---

## IW-ADR-006 — Space has explicit lifecycle

**Status:** PROPOSED

**Proposal**

```text
UNLOADED
→ PRELOADING
→ WARMING
→ READY
→ ACTIVE
→ COOLING
→ DISPOSED
```

**Open implementation question**

Exact active/next/previous cache policy and transition timing require prototype measurements.

---

## IW-ADR-007 — Experience Director orchestrates; it does not own subsystem internals

**Status:** PROPOSED

**Proposal**

The director issues semantic camera/space/audio/story/Action commands through contracts. It does not directly mutate private render/navigation/audio implementation state.

---

## IW-ADR-008 — Scene Kit maps semantics to representation

**Status:** PROPOSED

**Proposal**

Scene Kit owns visual/spatial language and representation adapters, not global World State, canonical semantic identity, route semantics or Experience orchestration.

---

## IW-ADR-009 — V1 performance budgets are evidence-derived

**Status:** PROPOSED

**Proposal**

IW-0 defines metrics/categories and quality gates but does not invent FPS/draw-call/triangle/texture limits before representative blockout measurement.

**Requirement**

Numeric pass/fail budgets become mandatory before visual scale-up.

---

## IW-ADR-010 — Deterministic named states are a product-level QA requirement

**Status:** PROPOSED

**Proposal**

Museum V1 exposes repeatable named test states for screenshots, browser paths and performance comparison.

**Reason**

Visual quality and regressions cannot be managed reliably through ad-hoc manual navigation alone.

---

## IW-ADR-011 — Museum V1 quality system includes Unslop + Gauntlet + human gate

**Status:** PROPOSED

**Proposal**

Technical correctness, anti-slop review, adversarial reference comparison and Juanma visual approval are separate gates.

No automated metric can replace the human visual gate.

---

# Open decisions — intentionally unresolved

These items must not be silently decided by implementation.

## IW-OPEN-001 — Physical repository/code topology

Options may include isolated app/module, packages, adapters, standalone runtime, etc. Decide only after local repo inspection and approved contracts.

## IW-OPEN-002 — Exact Three.js integration stack

Raw Three.js vs R3F or hybrid decisions remain open. Reference repos use different approaches; IW-0 does not choose by popularity.

## IW-OPEN-003 — Collision/navigation implementation

Exact collision library/navmesh/physics approach remains open until Museum blockout needs are measured.

## IW-OPEN-004 — Persistence format beyond schema versioning

Storage, save/export transport and collaboration are not decided.

## IW-OPEN-005 — Exact preview/deployment mechanism for isolated prototype

Must provide navigable evidence, but implementation route remains open pending repo/environment inspection.

## IW-OPEN-006 — Final numeric performance budgets

Requires representative blockout and target-device evidence.

## IW-OPEN-007 — Direct source reuse

None planned in IW-0. Any future candidate requires Reference Ledger reuse entry and license review.

## IW-OPEN-008 — Physical canonical-state storage mechanism

The single-canonical-record invariant is fixed, but Maps vs arrays vs normalized stores vs ECS vs another mechanism remains implementation-open.

## IW-OPEN-009 — Exact Action taxonomy/execution mechanism

Action exists as a semantic concept, but the exact enum set, extensibility model and runtime execution mechanism remain open pending V1 needs.

## IW-OPEN-010 — Exact Anchor representation

Anchor exists as a semantic spatial concept, but coordinate basis, transform representation, surface/volume encoding and storage mechanism remain open.

---

# Change discipline

When a decision changes:

1. never erase the historical decision silently;
2. mark old ADR `SUPERSEDED`;
3. create/link successor;
4. explain trigger/evidence;
5. state implementation consequences;
6. reconcile proposed/current branch work before continuing.
