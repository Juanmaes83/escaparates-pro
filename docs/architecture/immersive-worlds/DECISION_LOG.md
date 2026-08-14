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

## IW-DEC-030 — The Museum crossing reuses the choreography, not the render target

**Status:** ENGINEERING DECISION — AWAITING PRODUCT REVIEW

**Trigger**

Block 2B, and the standing rule that a proven first-party capability must be
inspected before it is reimplemented. The complete Infinite Worlds V1.2.3 snapshot
at `453ed40008f838d6187a7e85d93872f7866ad5cb` was read before any code was written.
`MUSEUM_CURRENT_STATE.md` §6 authorises direct reuse of its `WebGLRenderTarget`
live destination rendering, `CameraUtils.frameCorners`, camera synchronisation and
portal shaders **where useful**. The inspection concluded they are not useful here,
and that conclusion needs recording because it declines an explicit authorisation.

**Decision**

1. **The render-target portal is not reused, because Museum does not have the
   problem it solves.** Grey City and Living Valley are two scenes at the same
   coordinates: the only way to see one from the other is to render it to a
   texture. Museum has one scene. Galería A is `x ∈ [-8, 8]`, Galería B is
   `x ∈ [8, 20]`, they share the wall at `x = 8`, and the portal is a real hole in
   it. The destination was already visible through that hole before any Block 2B
   code existed — verified visually, not assumed.

2. **What is reused is the choreography shape and the warmup discipline:** ease
   into the aperture and out of it as one continuous move; bring the destination to
   READY and make it visible *before* the move commits; hand the room over at the
   portal plane. These are the parts that were load-bearing in the source.

3. **No second camera.** The source syncs a destination camera to render through
   the portal. With nothing to render through, that camera would be a second writer
   against IW-ADR-002 for no gain. The invariant is satisfied by absence rather
   than by discipline.

4. **The crossing is its own camera authority.** `CAMERA_AUTHORITY.TRANSITION` was
   declared from the start with no controller; `CrossingController` is it. Not a
   mode of the Directed controller, because a crossing outlives the beat that
   starts it and belongs to neither room.

5. **The room's atmosphere crosses with the camera.** Fog, background and exposure
   resolve across the doorway rather than switching on the activation frame, and
   are exact at `t = 1`. Without this the camera move was continuous and the light
   was still a cut.

6. **T6 is decided by beat intent, never by distance** — consistent with the
   Product Owner's Block 2A correction that families express experience intent and
   geometry only executes. `TELEPORT` portals stay cuts: there is no line of sight
   to fly through, and a crossing would misdescribe the building.

**Consequences**

`crossing-controller.js`; `TRANSITION_SHAPE[T6]`; `thresholdFor()` and
`blendAtmosphere()` in the Scene Kit; `activateReady()` in the lifecycle, because
an `await` with nothing to await still deferred the handoff by a frame. No world
data changed. Because the family follows beat intent rather than portal identity,
the lobby → Galería A entry became a crossing too — correct grammar, outside the
authorised slice, not yet visually reviewed.

**Not decided here**

Whether the source's `PortalAppearance` distortion/edge-glow belongs on an
institutional doorway — recommended against, but it is a product call. Whether the
guide should move off the crossing axis, which would change a frozen Room 1
endpoint. Whether Explore-initiated portals should also be choreographed.

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

---

# Error / learning log

Institutional memory, not anecdote. Every entry is a mistake that actually
happened and cost real time, recorded so the next agent does not pay for it
twice. The most useful column is the last one: **what rule prevents recurrence**.

A pattern runs through almost all of it, and it is worth naming before the
table: **most of these were instruments, not products.** A test that cannot
fail is worse than no test, because it produces confidence instead of silence.
When a human browser and a harness disagree, the harness is the suspect.

## L-1 · A harness that types without typing

**What happened.** The authoring harness set `input.value` and dispatched an
`input` event. Real keystrokes never reached the page.
**Root cause.** Convenience: setting a value is faster than pressing keys.
**Exposed by.** Juanma, in his own browser. `Museo Atlántico de Vigo` arrived as
`Fundación AMueotlánticoeVigorenas`.
**Product or instrument.** Both. The product ate W/A/S/D and space at the window
level; the instrument made it invisible for weeks.
**Changed.** `isTyping()` guard in `app/ui/input.js`; the repro now uses
`page.keyboard.type()`.
**Rule.** *Input tests press keys.* If a test never generates a real key event,
it does not test keyboard handling.

## L-2 · A video test that drove the only slot that existed

**What happened.** Video QA passed 15/15 while video authoring was, to an author,
entirely broken.
**Root cause.** The fixture drove the single PROJECTION slot. Nine artworks had
no video slot at all, and a test that only uses what exists cannot discover what
is missing.
**Exposed by.** Juanma opening an artwork and finding nowhere to put a video.
**Product or instrument.** Product model (the config asserted the Scene Kit could
not draw video on a canvas — it always could), amplified by a narrow instrument.
**Changed.** Explicit slots per medium; the proof now covers artwork *and*
projection.
**Rule.** *Cover the surface an author actually opens, not the one the fixture
knows.* Coverage counts panels, not assertions.

## L-3 · Reading a WebGL canvas that was already cleared

**What happened.** A pixel check reported exactly `0.00%` change on every video
case — playing and frozen alike.
**Root cause.** `drawImage` on a WebGL canvas returns a cleared buffer unless
`preserveDrawingBuffer` is set. Two blanks were being compared.
**Exposed by.** Its own consistency: `0.00%` in eight of eight cases, beside
screenshots that plainly differed.
**Product or instrument.** Instrument.
**Changed.** Compare two `page.screenshot()` PNGs of the canvas element instead.
**Rule.** *An identical result in every cell is a broken measurement, not a
finding.* Include a case that must differ.

## L-4 · A looping video is not a stopped one

**What happened.** `t=[2.998, 0]` scored as "not playing".
**Root cause.** A 4-second looping fixture sampled a second apart wraps roughly a
quarter of the time; the assertion demanded monotonic `currentTime`.
**Product or instrument.** Instrument.
**Rule.** *Assert the property, not a proxy.* "Playing" is `!paused` plus a
changing picture; a wrap is evidence of playing to the end.

## L-5 · «Lista» is not «Listo»

**What happened.** An image-upload wait timed out forever.
**Root cause.** The regex matched only the masculine form of READY. Images are
`Lista`; videos are `Listo`.
**Rule.** *Match state by code, or match every surface form.* Localised UI text
is a bad primary key.

## L-6 · Measuring a camera in flight

**What happened.** The transition endpoint proof "failed" the frozen contract.
The drift was smooth, one-directional and proportional to the pace.
**Root cause.** Sampling 120 ms after each beat began measured *how far along the
travel was* and reported it as *where the beat ends*.
**Product or instrument.** Instrument. The contract was never violated.
**Rule.** *Wait for the thing to stop before measuring where it stopped.* A
fixed delay is not pace-independent.

## L-7 · Racing the transport you are trying to observe

**What happened.** Fixing L-6 by waiting for stillness produced 9 beats in one
run and 10 in another, with poses off by one.
**Root cause.** The route advances itself on a timer; the test also advanced it.
**Rule.** *Pause the subject, then step it deterministically by id.* Never walk a
sequence by index into a live array.

## L-8 · Three runs in one page

**What happened.** Each pace inherited the camera the previous run abandoned, and
the first run's first beat was sampled before any travel.
**Rule.** *One run, one fresh page.* Without isolation a test cannot tell a
violation from its own leftovers.

## L-9 · A diagnostic that disagreed with its own verdict

**What happened.** The failure line printed `10 destinos idénticos` next to
**FAIL**.
**Root cause.** The assertion compared two pairs on two fields; the message
compared one pair on one field.
**Rule.** *The diagnostic must cover exactly what the assertion covers.* A
message that contradicts its verdict is worse than no message.

## L-10 · Demanding bit-equality from an asymptote

**What happened.** After L-6 to L-9 were fixed, poses still differed by 1–3 cm
between paces.
**Root cause.** Not a bug. The camera eases toward its destination
asymptotically and stops just short; how short depends on how many frames the
move lasted, which pace legitimately changes.
**Changed.** The proof now asserts two separate facts: the **authored
destination** exactly, and the **resting camera** within 5 cm.
**Rule.** *Assert the contract, not the arithmetic underneath it.* Ask what the
frozen promise actually says before choosing a tolerance.

## L-11 · Reading a room you are not standing in

**What happened.** The projection texture read as `null` after Apply, looking
exactly like "the video never arrived".
**Root cause.** The Scene Kit builds the active space; an entity in another room
has no object.
**Rule.** *Navigate to the subject before measuring it.* Preconditions are not
part of what is measured, and a null must never be reported as an absence.

## L-12 · Evidence that outlived the product it photographed

**What happened.** The stored w2 storyboard showed an artwork panel with one
image slot and no video, long after both slots existed. The capture tool still
drove `PROJECTION_MEDIA`, a slot that had been removed.
**Rule.** *Re-capture after any change to what the frame shows, and let capture
tools fail loudly on removed selectors.* Stale captures are the most convincing
wrong evidence there is.

## L-13 · A review board that contradicted its own subject

**What happened.** The published board listed thumbnails and the Media Library as
missing, in the same document that documented building them.
**Root cause.** A silent `str.replace` that matched nothing, because I did not
assert on it.
**Rule.** *Assert on every scripted edit.* A replacement that matches nothing must
raise, never pass quietly.

## L-14 · A wrong flag reran the wrong wave

**What happened.** `studio-capture.mjs w2` silently ran w1 — the flag is `--wave`
— and I nearly read w1 frames as w2 evidence.
**Rule.** *A tool given an argument it does not understand should say so.*
Silent fallback to a default is how the wrong evidence gets published.

## L-15 · Measuring a layout that was overlapping

**What happened.** Reported the preview had *gained* width (712px) after adding
the rail. It had not: the stage was sliding 178px underneath the rail because
its `left` inset did not name the new column. The honest figure was 530px.
**Rule.** *A measurement taken while elements overlap is not a measurement.*
Check the layout is valid before quoting numbers from it.

## L-16 · Ending a turn mid-mandate

**What happened.** Reported progress after two of four verticals and stopped,
during a mandate that authorised working through to the final gate.
**Rule.** *A progress report is not a stopping point.* Under an autonomous
mandate, stop only at the named gate or at a genuine blocker.
