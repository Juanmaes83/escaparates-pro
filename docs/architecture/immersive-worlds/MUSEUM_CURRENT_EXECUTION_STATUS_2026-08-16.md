# Museum — Current execution status · 2026-08-16

> **Purpose:** short operational source of truth for agents resuming the Museum mission without rereading stale milestone reports.
> **Branch:** `claude/immersive-worlds-module-c0d3f7`
> **Master:** UNTOUCHED
> **Current visitor-runtime candidate HEAD:** `e88c2926d36de6432fa1a6c662e0c2eb725b6b7e`
> **Human QA update:** 2026-08-16 — Juanma reviewed a real browser recording covering the three Museum rooms, current transitions, Gallery B and the Breeze sculpture + dynamic cloth room.

---

# 1. Human-approved current Museum baseline

Juanma has reviewed and approved the current product base for continuation:

- Full Museum Studio current base: KEEP / approx. 8/10; refinement deferred.
- Visitor current base: KEEP for continuation; expansion is being developed separately.
- Forward navigation: approved.
- Same-room Back: approved.
- Cross-room Back: approved.
- Back → Forward: approved.
- Current three-room guided visitor experience: KEEP for continuation.
- Current transitions between the reviewed rooms: KEEP as current baseline; polish items are known and explicitly deferred so the project can advance.
- Crossing B: remains Human-preferred baseline and regression boundary.
- Current content loading / save-config / preview / visible-piece flow: Human-proven.
- Breeze Sculpture + Dynamic Cloth room: **HUMAN KEEP FOR CONTINUATION / INTEGRATION**. Juanma is very satisfied with the room at the present stage. Camera / point-of-view and other cinematic refinements remain future polish, not blockers.

Do not reopen these items unless a regression is found or Juanma explicitly reopens the polish pass.

---

# 2. Parallel Full Museum Studio / Panel workstream

The advanced Panel / Visitor / Full Museum Studio capability work exists on a separate active implementation stream:

- branch: `chatgpt/museum-phase2-capability-expansion`
- PR: `#58 Museum Phase 2 — capability systems expansion`
- PR state at latest verification: OPEN / DRAFT / NOT MERGED

That stream already contains the advanced five-domain Full Museum Studio and Phase 2 capability set. It must not be rebuilt inside the Breeze branch.

The project has now reached the point where the next high-value task is **bounded cross-stream integration**, not further isolated expansion of either side.

---

# 3. P0 current truth

Authoritative details live in `MUSEUM_P0_REGISTRY.md`.

Current outcome:

- P0.1 CLOSED
- P0.2 EXTERNAL BLOCKER — durable Project Cloud/R2 bytes not cross-session proven
- P0.3 CLOSED
- P0.4 CLOSED
- P0.5 CLOSED
- P0.6 CLOSED
- P0.7 CLOSED
- P0.8 CLOSED
- P0.9 label-card semantic state CLOSED

No currently actionable in-repository P0 work should displace the integration objective.

P0.2 must remain honest but must not block bounded Museum/Breeze/Studio integration unless the integration would introduce a second persistence truth.

---

# 4. Breeze current technical + Human checkpoint

The current candidate contains:

- Option E1 specialized nested-room architecture.
- real WebGPU presentation in agent QA configuration.
- real donor Breeze physics.
- 6,561 vertices / 51,040 springs.
- real Venus.
- real cloth.
- real donor wind.
- real BVH/collision path.
- Museum-owned camera semantics.
- corrected floor-anchor / CONTEMPLATION framing.
- deterministic cloth relaunch for reviewability.
- minimum spatial grounding: floor, walls, contact shadow.
- Guide integration around the hero moment.
- Museum → Breeze → Museum exit/re-entry lifecycle.
- Crossing B preserved.
- automated Breeze product-path harness: **28/28 PASS, exit code 0**.
- Fresh Amnesiac Critic completed.
- Human real-browser video review completed.

Human visual verdict now supersedes the earlier `PENDING HUMAN VISUAL QA` state:

`BREEZE = KEEP FOR CONTINUATION / READY TO INTEGRATE AS THE CURRENT PRODUCT BASELINE.`

This is not a claim that Breeze is visually final. Juanma has explicitly chosen to defer viewpoint/camera and other polish items so the product can advance.

---

# 5. Human video review — current visual truth

The Human recording reviewed the real guided experience through the existing Museum rooms and into Breeze.

Observed product-level outcome:

- the current three-room journey is coherent enough to continue;
- current transitions are acceptable as working product baselines;
- Gallery B / dark-room language reads coherently inside the cinematic journey;
- Breeze reads as a distinct installation room;
- Venus has clear presence as the anchor;
- the cloth is visibly present, wind-driven and dynamically crosses/interacts around the sculpture during the reviewed sequence;
- the dark spatial grounding is adequate for the current stage;
- the camera language is not perfect, but it is not a blocker to integration;
- known visual/cinematic improvements are intentionally deferred to a later polish pass.

Playbook consequence:

`HUMAN KEEP FOR CONTINUATION > AGENT CAPTURE LIMITATION.`

Do not spend more implementation time proving the same Breeze visual fact with headless capture unless a regression appears.

---

# 6. Current primary objective — OPEN INTEGRATION GATE

The previous gate was:

`HUMAN QA BREEZE → KEEP / ADJUST / REJECT → decide whether to integrate.`

That gate has now produced:

`KEEP FOR CONTINUATION.`

Therefore the next high-value objective is:

`ADVANCED FULL MUSEUM STUDIO / PHASE 2 + PROVEN VISITOR RUNTIME / BREEZE → BOUNDED INTEGRATION.`

Integration must preserve:

- one Museum semantic truth;
- existing WorldGraph / route / camera / Guide contracts;
- current approved visitor runtime;
- current advanced Studio capability architecture;
- no duplicate persistence system;
- no second Breeze implementation;
- no raw WebGPU / Verlet / BVH internals exposed to ordinary authoring users.

The integration contract should connect the already-proven runtime capability into the already-advanced Studio rather than rebuild either side.

---

# 7. Integration target

Expected direction:

```text
FULL MUSEUM STUDIO / PHASE 2
      ↓
ROOM / EXPERIENCE AUTHORING
      ↓
BREEZE INSTALLATION SEMANTIC CONFIG
      ↓
MUSEUM ROOM ADAPTER / EXISTING E1 HOST
      ↓
PROVEN BREEZE RUNTIME
      ↓
REAL VISITOR EXPERIENCE
```

First integration proof should cover the smallest complete round trip:

`AUTHOR / CONFIGURE → SAVE → PREVIEW → ENTER REAL VISITOR ROUTE → BREEZE RUNS → EXIT / BACK / RE-ENTER → RETURN TO STUDIO WITHOUT REGRESSION.`

Do not broaden integration into unrelated future polish.

---

# 8. Automation & Monitoring methodology — separate but canonical

A separate methodology layer already exists in the repository:

`labs/immersive-worlds/docs/CHATGPT_SCHEDULED_TASKS_AUTOMATION_MONITORING_OS_V1.md`

It defines scheduled / condition-based supervision as a persistent gate-monitoring layer, not as simple reminders.

Canonical modes:

- ONE-SHOT
- RECURRING
- CONDITION WATCH

Core rule:

`AUTOMATE THE CONTROL OF THE GATE, NEVER THE AUTHORITY TO CROSS THE GATE.`

This layer may monitor QA, deployments, PR mergeability, regressions, documentation/capability drift and external signals. It may classify and notify. It may not inherit Juanma's authority to visually approve, merge, publish, spend money or redefine scope.

This methodology is intended for the generic autonomous project operating system and is not Museum-only.

---

# 9. Agent resumption instruction

An agent resuming Museum work should:

1. verify the actual branch/PR heads before changing code;
2. treat current Breeze Human QA as KEEP FOR CONTINUATION;
3. treat advanced Full Museum Studio / Phase 2 as an existing parallel implementation, not a missing feature list;
4. open a bounded integration mission rather than rebuilding either stream;
5. preserve all current Human-approved visitor/runtime baselines;
6. leave visual/cinematic polish for the later refinement pass unless integration causes a regression;
7. never merge to `master` without Juanma's explicit approval.
