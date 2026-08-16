# MUSEUM — FULL MUSEUM STUDIO ↔ BREEZE BOUNDED INTEGRATION CONTRACT V1

Status: **DOCUMENTED INTEGRATION CONTRACT — IMPLEMENTATION NOT YET AUTHORIZED BY THIS DOCUMENT**  
Date: 2026-08-16  
Repository: `Juanmaes83/escaparates-pro`  
Documentation branch: `docs/museum-studio-breeze-bounded-integration-v1`  
Human authority: Juanma = Product Owner / Visual Authority / Final Decision / Merge Authority

## 0. Purpose

Museum now contains two advanced isolated implementation streams that must be connected without rebuilding either one:

- Full Museum Studio / Phase 2: `chatgpt/museum-phase2-capability-expansion`, PR #58, current verified head at contract creation `e0b3e63201ffefae24425d9ef857252b16b3cf36`.
- Visitor Runtime + Breeze: `claude/immersive-worlds-module-c0d3f7`, current branch head at contract creation `6e6d6ca5ae896eb1f8363203004284b5e06208e2`; Human-reviewed implementation candidate remains `e88c2926d36de6432fa1a6c662e0c2eb725b6b7e`.

This contract defines the **smallest safe semantic bridge** between those streams.

It does not merge branches, change runtime code, modify Studio UI, reopen camera polish, change Breeze physics, alter master, or authorize release.

Permanent rule:

```text
INTEGRATE PROVEN CAPABILITY — DO NOT REBUILD IT.
ONE SEMANTIC TRUTH → MULTIPLE REPRESENTATIONS.
```

---

## 1. Current product truths that are protected

### 1.1 Museum / Visitor Runtime protected baseline

The following are protected unless a regression is proven or Juanma explicitly reopens them:

- current three-room guided journey;
- current transitions as continuation baseline;
- Forward;
- Same-room Back;
- Cross-room Back;
- Back → Forward;
- canonical Tour Stop settlement;
- current Tour Stop semantics;
- Crossing B as Human-preferred provisional regression baseline;
- Museum-owned camera semantics;
- Guide choreography / lifecycle;
- Museum → Breeze → Museum exit and re-entry behavior.

Current Human decision:

```text
BREEZE = KEEP FOR CONTINUATION / READY FOR BOUNDED INTEGRATION.
```

Camera / point-of-view / pacing / transition polish remains deferred and is not part of this integration mission.

### 1.2 Full Museum Studio / Phase 2 protected baseline

The integration must treat the following as existing capabilities, not missing features:

- Full Museum Studio domains: Construir, Contenido, Experiencia, Visitante, Publicar;
- Visual Calendar / schedule;
- Programme;
- Orientation / Map representation;
- Seen / Not Seen;
- artwork dimensions and physical presentation;
- accessibility semantics;
- artist profiles;
- documents;
- multilingual foundation;
- visitor memory foundation;
- resources / QR foundation;
- shop / membership / donation destinations;
- deterministic recommendations foundation;
- Publish readiness;
- reversible Preview → Back to Studio;
- Schema 3 canonical project persistence and semantic round-trip.

PR #58 remains DRAFT / NOT MERGED until Juanma gives explicit approval.

---

## 2. Source-of-truth ownership

Integration must not create a second project model.

### 2.1 Canonical authored project truth

```text
Schema 3
= canonical serialisable project truth
= authoring + preview + runtime + export/import semantics
```

Breeze authoring state must therefore be represented inside the canonical project configuration, not in a second Breeze-specific persistence layer.

### 2.2 Museum authorities that remain Museum-owned

Museum continues to own:

- World Graph;
- room / entity identity;
- route;
- Tour Stops;
- Experience Director;
- camera semantic authority;
- Guide choreography;
- Visitor HUD;
- Forward / Back semantics;
- room lifecycle orchestration;
- authoring / preview / save / publish contract;
- project media references and persistence semantics.

### 2.3 Breeze authorities that remain Breeze-owned inside active presentation

The proven Breeze capability continues to own:

- WebGPU cloth presentation;
- Verlet cloth simulation;
- wind behavior;
- cloth geometry;
- active sculpture geometry;
- BVH collision and rebuild behavior;
- local cloth/sculpture rendering;
- V4 product semantics for cloth/background media, grading, experiences and replaceable central object.

### 2.4 Explicit non-ownership

Breeze must not own or duplicate:

- Museum route;
- WorldGraph;
- Visitor state;
- Museum camera authority;
- project-wide persistence;
- Studio navigation;
- a second media CMS;
- a second room identity model.

Studio must not own or reimplement:

- Verlet solver;
- cloth wind physics;
- BVH mechanics;
- cloth/sculpture collision;
- object-replacement collider rebuild;
- standalone copies of proven Breeze capability logic.

---

## 3. Proposed semantic configuration boundary

The Studio should author **product semantics**, not engine internals.

The minimum authored representation should live under the canonical room/entity truth and expose a bounded Breeze installation configuration.

Conceptual shape:

```text
ROOM
└── BREEZE INSTALLATION
    ├── enabled
    ├── experience
    ├── sculpture
    ├── cloth
    ├── wind
    ├── background
    ├── media
    ├── transform
    └── advanced
```

The exact Schema 3 field name is an implementation detail to reconcile against the existing config model, but the ownership rule is fixed:

```text
CANONICAL CONFIG OWNS SEMANTICS.
BREEZE RUNTIME CONSUMES A NORMALISED PROJECTION OF THOSE SEMANTICS.
```

### 3.1 Experience

Product-facing semantic values only. Existing Breeze Studio PRO V4 experience presets should be mapped, not recreated.

### 3.2 Sculpture

Must preserve the proven replaceable-object model:

- built-in object or supported uploaded object;
- source/type;
- transform;
- visibility/load/error state where appropriate;
- collider rebuild must follow actual object replacement.

### 3.3 Cloth

Must preserve Breeze V4 capability, including image/video media where supported and the established visual controls.

### 3.4 Wind

Authoring should express understandable product semantics such as intensity/direction/variation or proven preset mapping.

Raw solver coefficients do not belong in ordinary authoring.

### 3.5 Background / media

Background media and cloth media remain distinct channels.

Museum media/project semantics remain source of truth for references. Session-only object URLs must not become durable project truth.

---

## 4. Adapter contract

The integration surface should be a thin Museum-owned adapter around the proven Breeze room host.

Target relationship:

```text
FULL MUSEUM STUDIO / SCHEMA 3
        ↓
normalised Breeze semantic config
        ↓
MUSEUM BREEZE ROOM ADAPTER
        ↓
OPTION E1 SPECIALIZED NESTED ROOM HOST
        ↓
PROVEN BREEZE CAPABILITY CORE
```

The adapter is responsible for:

1. resolving canonical room/entity identity;
2. reading normalised authored Breeze semantics;
3. resolving Museum-owned media references;
4. activating the existing E1 host at the correct lifecycle point;
5. passing only the bounded configuration required by Breeze;
6. preserving Museum camera / Guide / route authority;
7. cleanly disposing or suspending Breeze on exit;
8. restoring correct state on Back / re-entry;
9. preventing orphan loops / listeners / renderer ownership leaks;
10. exposing enough diagnostics for automated and Human QA.

The adapter must not become a second product model.

---

## 5. First bounded integration proof

The first implementation mission is intentionally narrow.

Required complete round trip:

```text
AUTHOR / CONFIGURE BREEZE IN FULL MUSEUM STUDIO
        ↓
SAVE CANONICAL PROJECT STATE
        ↓
PREVIEW
        ↓
ENTER REAL VISITOR EXPERIENCE
        ↓
REACH BREEZE THROUGH THE REAL ROUTE
        ↓
BREEZE USES THE AUTHORED SEMANTIC CONFIG
        ↓
EXIT
        ↓
BACK / RE-ENTER
        ↓
RETURN TO STUDIO
        ↓
STUDIO CONTEXT + CANONICAL CONFIG PRESERVED
```

This proof is more important than adding a large number of Breeze authoring controls in the first pass.

Minimum first-pass authored mutation should be enough to prove that authored state genuinely reaches the active Breeze runtime. Prefer one or two highly visible semantic changes rather than broad control coverage.

Examples of suitable proof dimensions, subject to compatibility with the current V4 authority:

- select a proven Breeze experience/preset;
- select a proven central sculpture/object;
- change a clearly visible cloth or wind semantic;
- change a background/cloth media reference through Museum media semantics.

Do not expand all controls before the end-to-end ownership path is proven.

---

## 6. Mandatory invariants

A valid implementation must preserve all of these:

### I-01 One project truth

No second Breeze configuration store becomes authoritative.

### I-02 One WorldGraph / route truth

Breeze does not create its own Museum route or room graph.

### I-03 Museum camera authority

No second concurrent camera writer or standalone Breeze camera ownership during Museum presentation.

### I-04 Proven Breeze physics preserved

Do not rebuild the cloth engine to make integration convenient.

### I-05 Actual active sculpture drives collision

Visual replacement and BVH collision replacement must remain coherent.

### I-06 Media semantics remain Museum-owned

Do not regress to standalone/session-only persistence assumptions.

### I-07 Reversibility

Forward pass alone is insufficient. Exit, Back and re-entry must preserve correct product state.

### I-08 Studio recoverability

Preview must not destroy authoring context. `ENTER → USE → EXIT → RESUME` remains protected.

### I-09 No baseline regression

Current visitor journey, transitions, Crossing B, camera semantics and Guide behavior must remain functionally equivalent unless the integration itself requires an explicitly approved bounded change.

### I-10 No merge-by-convenience

PR #39 and PR #58 are not merged merely to simplify implementation.

---

## 7. Global Outcome Stability gate

Before moving code across streams, the implementation agent must prove that the chosen integration method does not require a global renderer, camera, persistence or WorldState rewrite.

If integration reveals any of the following:

- global renderer replacement;
- second presentation authority;
- project Schema replacement;
- duplicate WorldGraph / route state;
- broad camera-controller rewrite;
- destructive migration of existing authored config;
- forced merge of the two large branches before a bounded proof;

then:

```text
PREPARATION ONLY
→ DOCUMENT EXACT CONFLICT
→ PROVIDE OPTIONS / EVIDENCE
→ HUMAN ARCHITECTURE GATE
```

A local integration obstacle is not permission to redesign the Museum engine.

---

## 8. Persistence boundary

P0.2 durable asset persistence remains a separate external-blocked concern unless a real cross-session byte lifecycle has been proven.

This integration may use the current Museum media/project adapter semantics already available, but must not claim durable project bytes merely because:

```text
UPLOAD → SAVE CONFIG → PREVIEW → CONTENT VISIBLE
```

works inside the current session.

The integration must also avoid introducing a second persistence truth while P0.2 remains unresolved.

---

## 9. QA contract

The integration is not complete when configuration saves successfully.

Required QA layers:

### Functional

- Schema 3 normalises / serialises / reloads the Breeze semantics;
- existing Phase 1 / Phase 2 regression remains green for touched contracts;
- E1 activation receives authored config;
- exit / Back / re-entry lifecycle works;
- no duplicate loops or critical console/runtime errors.

### Product runtime

Real visitor path must be exercised through the actual Museum route, not only by direct harness teleport.

### Temporal / visual

Where a change concerns wind, cloth, collision, transition or runtime motion, evidence must show the temporal behavior, not just a static final state.

### Human

Final product authority remains Juanma.

A valid handoff must use the Human Review Delivery Contract:

```text
CHANGE
OPEN
GO TO
DO
LOOK FOR
MUST NOT CHANGE
KNOWN LIMITATION
RETURN: KEEP / ADJUST / REJECT
```

A review URL without that review map is incomplete.

---

## 10. Automation / monitoring applicability

Automation & Monitoring is a separate methodology layer, but this integration is a suitable candidate for future condition watchers after implementation exists.

Potential watchers may monitor:

- exact integration-branch QA status;
- regression against protected Museum baselines;
- exact Vercel candidate readiness;
- PR mergeability;
- Human QA readiness.

Permanent rule:

```text
AUTOMATE THE CONTROL OF THE GATE,
NEVER THE AUTHORITY TO CROSS THE GATE.
```

No watcher may merge, approve visuals, publish, alter scope or substitute for Juanma.

---

## 11. Explicitly out of scope for the first integration mission

Do not use this mission to:

- polish Museum camera / POV / pacing;
- rebuild Breeze physics;
- expand all possible Breeze V4 controls at once;
- redesign Full Museum Studio;
- redesign Visitor personalization;
- solve P0.2 durable storage infrastructure;
- implement cross-device Visitor identity;
- build full commerce;
- replace the current recommendation model;
- perform broad branch merges;
- merge to master;
- begin unrelated P1/P2 expansion.

---

## 12. Implementation preparation checklist

Before implementation begins, Claude must verify actual remote heads because this document may outlive the current commits.

Read, at minimum:

1. `labs/immersive-worlds/docs/MUSEUM_CURRENT_STATE_INTEGRATION_HANDOFF_V2.md`
2. `labs/immersive-worlds/docs/MUSEUM_AUTHORING_CAPABILITY_REGISTRY_V2.md`
3. `labs/immersive-worlds/docs/MUSEUM_PHASE2_CURRENT_STATUS_HANDOFF_V1.md`
4. this contract;
5. Breeze branch `docs/architecture/immersive-worlds/MUSEUM_CURRENT_EXECUTION_STATUS_2026-08-16.md`;
6. `docs/architecture/immersive-worlds/MUSEUM_BREEZE_SCULPTURE_CLOTH_ROOM_IMPLEMENTATION_SPEC_V1.md`;
7. current Museum Playbook + Human QA / delivery protocols.

Then reconcile only the contracts directly touched by the first vertical.

Do not spend Claude cycles rewriting documentation or producing a new broad architecture report when the current documents already answer the question.

---

## 13. Success definition

The bounded integration succeeds when Juanma can author a Breeze semantic change in Full Museum Studio and then verify that the **same canonical project state** drives the proven Breeze runtime through the real Museum visitor journey, including exit, Back/re-entry and return to Studio, without breaking approved Museum behavior or duplicating state.

Canonical success path:

```text
ONE AUTHORING TRUTH
→ ONE SAVED PROJECT STATE
→ ONE PREVIEW / VISITOR REPRESENTATION
→ PROVEN BREEZE CAPABILITY
→ REVERSIBLE RETURN
```

That is the gate. Everything broader comes later.
