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

# Architecture decisions awaiting review

## IW-ADR-001 — Semantic data and representation are separate

**Status:** PROPOSED

**Context**

Museum content, Fashion content and Real Estate content need different visual treatments without rebuilding World semantics.

**Proposal**

Generic World/Space/Entity/Hotspot/Portal/Route schemas exist independently from Scene Kit representations.

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

## IW-ADR-004 — Portal and Hotspot are semantic, visual marker optional

**Status:** PROPOSED

**Proposal**

Portal and Hotspot describe interaction/connection semantics. Scene Kit decides whether an icon, door, artwork, screen, transition or no visible marker represents them.

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

The director issues semantic camera/space/audio/story commands through contracts. It does not directly mutate private render/navigation/audio implementation state.

---

## IW-ADR-008 — Scene Kit maps semantics to representation

**Status:** PROPOSED

**Proposal**

Scene Kit owns visual/spatial language and representation adapters, not global World State, route semantics or Experience orchestration.

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

---

# Change discipline

When a decision changes:

1. never erase the historical decision silently;
2. mark old ADR `SUPERSEDED`;
3. create/link successor;
4. explain trigger/evidence;
5. state implementation consequences;
6. reconcile proposed/current branch work before continuing.
