# MUSEUM — CURRENT STATE & INTEGRATION HANDOFF V2

Date: 2026-08-16  
Repository: `Juanmaes83/escaparates-pro`  
Module: `labs/immersive-worlds/`  
Status: **CURRENT CROSS-BRANCH HANDOFF — INTEGRATION GATE OPEN / NO MERGE APPROVAL**  
Human authority: Juanma = Product Owner / Visual Authority / Final Decision / Merge Authority

## 0. WHY THIS DOCUMENT EXISTS

Museum now has two advanced implementation streams that must be integrated rather than rebuilt:

1. the advanced Full Museum Studio / Phase 2 capability expansion;
2. the Breeze Sculpture + Dynamic Cloth visitor-room implementation and existing visitor runtime.

Both streams are advanced. They are **not yet integrated with each other**.

New Human decision from 2026-08-16:

> Juanma has reviewed the real guided Museum experience including the three current rooms, transitions and Breeze. The current visitor journey and Breeze room are KEEP FOR CONTINUATION. Camera/viewpoint and other polish items are explicitly deferred. The project should now advance to connecting the new advanced Panel / Full Museum Studio with the proven visitor runtime / Breeze capability.

Therefore the previous `WAIT FOR BREEZE HUMAN QA` condition is satisfied enough to open a **bounded integration mission**.

Permanent rules:

```text
RECOVER BEFORE INVENT
EXTEND BEFORE DUPLICATE
INTEGRATE PROVEN CAPABILITY — DO NOT REBUILD IT
ONE SEMANTIC TRUTH → MULTIPLE REPRESENTATIONS
AUTOMATE OBSERVATION — NOT JUANMA'S AUTHORITY
```

---

# 1. ACTIVE STREAM A — FULL MUSEUM STUDIO / PHASE 2

Working branch:

`chatgpt/museum-phase2-capability-expansion`

PR:

`#58 Museum Phase 2 — capability systems expansion`

Base:

`chatgpt/museum-visitor-phase1`

Latest verified PR state:

- OPEN
- DRAFT
- NOT MERGED
- mergeable
- current verified head: `c5ee5f65b7a9c91ecbb9894982e7cafd14d256e5`

## Current Full Museum Studio architecture

```text
FULL MUSEUM STUDIO
│
├── CONSTRUIR
│   ├── Institución
│   ├── Exposición
│   ├── Salas
│   │   └── Accesibilidad de la sala
│   └── Obras
│       ├── Identidad
│       ├── Medios
│       ├── Medidas físicas
│       ├── Presentación física
│       ├── Autor y documentación
│       └── Accesibilidad de la obra
│
├── CONTENIDO
│   ├── Medios / cartelas
│   ├── Artistas
│   ├── Documentos
│   └── Idiomas + matriz de completitud
│
├── EXPERIENCIA
│   ├── Recorridos / ritmo
│   ├── Ruta accesible
│   └── Personalización / recomendaciones
│
├── VISITANTE
│   ├── Planificación / Visual Calendar
│   ├── Agenda / Programme
│   ├── Orientación / Map
│   ├── Mi visita
│   ├── Accesibilidad
│   ├── Mi visita · memoria
│   ├── Recursos / QR
│   ├── Idiomas
│   ├── Tienda
│   └── Apoya al museo
│
└── PUBLICAR
    ├── Content readiness
    ├── Accessibility readiness
    ├── Language readiness
    ├── Visitor readiness
    ├── Commerce readiness
    └── Export / Publish + round-trip
```

## Phase 2 capabilities already present

Do **not** use an obsolete checklist that still calls these missing:

- Full Museum Studio panel;
- Visitor domain;
- Visual Calendar;
- Programme editor;
- Orientation / Map representation;
- Seen / Not Seen;
- artwork physical dimensions;
- artwork physical presentation;
- institution / room / artwork accessibility semantics;
- artist profiles;
- reusable documents;
- multilingual foundation + completeness matrix;
- visitor memory foundation;
- accessible-route foundation using the existing WorldGraph;
- QR/resources foundation;
- shop external-destination capability;
- membership/donations destinations;
- deterministic personalised recommendations foundation;
- Publish readiness workspace;
- reversible Preview → Back to Studio context preservation;
- Schema 3 canonical persistence and semantic round-trip.

## Phase 2 hardening already present

- Content Workspace v2;
- Experience Workspace v2;
- compact Visitor capability mode;
- Artist → Artwork → Runtime connection;
- Document → Entity → Visitor connection;
- room accessibility feeding accessible routes;
- favorite interaction hardening;
- `ENTER → USE → EXIT → RESUME` preview contract;
- Capability Registry V2;
- Phase 2 Playwright QA workflow.

## Phase 2 items that must NOT be overclaimed

Still not equivalent to a finished production platform:

- final full Phase 2 human closure remains separate from this integration gate;
- cross-device visitor identity is not implemented;
- real email recovery for Save My Visit is not implemented;
- QR production encoding still needs first-party/local implementation;
- shop is not internal inventory/cart/checkout;
- membership/donations do not include internal payment/CRM infrastructure;
- recommendations are deterministic foundation, not full AI personalization;
- multilingual system is a strong foundation, not a mature translation-management suite;
- merge/release is not approved.

---

# 2. ACTIVE STREAM B — VISITOR RUNTIME + BREEZE SCULPTURE / DYNAMIC CLOTH

Working branch:

`claude/immersive-worlds-module-c0d3f7`

PR:

`#39 Claude/immersive worlds module c0d3f7`

Base:

`master`

Latest Human-reviewed implementation candidate:

`e88c2926d36de6432fa1a6c662e0c2eb725b6b7e`

Documentation on that branch has now been updated after Human QA.

Current PR state at latest verification:

- OPEN
- NOT MERGED
- mergeable

## Human visual verdict — NEW CURRENT TRUTH

Juanma reviewed a real browser recording covering the guided Museum journey, with focus on the later rooms and Breeze.

Human judgement:

- three-room journey: KEEP for continuation;
- current transitions: KEEP as working baseline;
- Gallery B / dark-room cinematic language: acceptable for continuation;
- Breeze sculpture + cloth room: **KEEP FOR CONTINUATION**;
- Venus / cloth sequence is visibly present and satisfying enough for this stage;
- camera / viewpoint is not considered a blocker now;
- known visual/cinematic improvements are deliberately deferred.

This means:

`BREEZE HUMAN QA GATE = SATISFIED FOR INTEGRATION.`

It does **not** mean the room is visually final.

## Breeze implementation state

The Breeze runtime already includes:

- central Venus/sculpture installation;
- spatial room grounding;
- dynamic cloth simulation;
- wind-driven motion;
- sculpture collision path;
- Museum camera authority rather than Breeze standalone camera authority;
- Guide integration;
- room entry / exit / re-entry lifecycle;
- deterministic relaunch behavior for reviewability;
- automated product-path harness 28/28;
- Fresh Amnesiac Critic;
- exact Vercel candidate deployment previously available for Human review.

Product authority remains:

```text
BREEZE STUDIO PRO V4 = PRODUCT AUTHORITY
Juanmaes83/breeze = ENGINE DONOR
Museum = EXPERIENCE / CAMERA / GUIDE / ROUTE / LIFECYCLE AUTHORITY
```

---

# 3. CENTRAL CURRENT FACT — INTEGRATION GATE IS NOW OPEN

```text
STREAM A
ADVANCED FULL MUSEUM STUDIO / PHASE 2
        │
        │  authoring + content + visitor + publish + schema
        │
        └──────────────┐
                       │
                       ▼
             BOUNDED INTEGRATION MISSION
                       ▲
                       │
        ┌──────────────┘
        │
STREAM B
PROVEN VISITOR RUNTIME + BREEZE ROOM
route + physics + Guide + camera + lifecycle
```

The objective is **not** to merge both large branches blindly.

The objective is to define the smallest safe contract and integrate the proven capability while preserving both streams' accepted behavior.

---

# 4. INTEGRATION OBJECTIVE

Target architecture:

```text
FULL MUSEUM STUDIO / PHASE 2
      ↓
ROOM / EXPERIENCE AUTHORING
      ↓
BREEZE INSTALLATION SEMANTIC CONFIG
      ↓
MUSEUM ROOM ADAPTER / OPTION E1 HOST
      ↓
PROVEN BREEZE CLOTH CAPABILITY
      ↓
MUSEUM VISITOR RUNTIME
```

The Studio should author semantic product controls; it must not expose raw WebGPU / Verlet / BVH internals to ordinary museum users.

Expected authoring family remains:

```text
ROOM
└── BREEZE INSTALLATION
    ├── Experience
    ├── Sculpture
    ├── Cloth
    ├── Wind
    ├── Background
    ├── Media
    ├── Transform
    └── Advanced
```

Integration must preserve one semantic truth and multiple representations rather than create duplicate state.

---

# 5. FIRST BOUNDED INTEGRATION PROOF

Do not attempt a broad merge first.

The first complete proof should be:

```text
AUTHOR / CONFIGURE IN FULL STUDIO
        ↓
SAVE CANONICAL PROJECT STATE
        ↓
PREVIEW
        ↓
ENTER REAL VISITOR EXPERIENCE
        ↓
REACH BREEZE THROUGH REAL ROUTE
        ↓
BREEZE USES AUTHORED SEMANTIC CONFIG
        ↓
EXIT
        ↓
BACK / RE-ENTER
        ↓
RETURN TO STUDIO / CONTEXT PRESERVED
```

Minimum contracts to reconcile before implementation:

1. room/entity identity and ownership;
2. semantic Breeze configuration shape;
3. media references / persistence ownership;
4. runtime handoff from Museum Director to E1 host;
5. save/preview/runtime round-trip;
6. Back / re-entry restoration;
7. no duplicate WorldGraph / Visitor / route truth;
8. no regression to current transitions or approved visitor behavior.

---

# 6. WHAT WE SHOULD NOT DO NEXT

Do not:

- merge PR #39 or PR #58 just to make integration easier;
- merge to `master` without Juanma approval;
- rebuild Breeze inside Phase 2;
- duplicate WorldGraph, Map, Visitor state or project persistence;
- expose raw physics internals in the normal authoring panel;
- reopen accepted camera/transition polish before integration;
- make the old missing-capability checklist authoritative again;
- start unrelated expansion that delays the integration objective.

---

# 7. AUTOMATION & MONITORING — SEPARATE METHODOLOGY LAYER

This remains a **different concern from product integration** and is already documented canonically in:

`labs/immersive-worlds/docs/CHATGPT_SCHEDULED_TASKS_AUTOMATION_MONITORING_OS_V1.md`

It defines a reusable supervision layer:

```text
AGENT EXECUTION
      ↓
AUTOMATED QA / EXTERNAL SIGNAL
      ↓
AUTOMATION & MONITORING LAYER
      ↓
MATERIAL CHANGE?
   ├── NO → SILENCE
   ├── REAL ERROR → AGENT FIXES
   ├── QA/HARNESS BLOCK → HUMAN QUICK CHECK
   └── READY → JUANMA HUMAN GATE
```

Three operating modes:

- ONE-SHOT;
- RECURRING;
- CONDITION WATCH.

Condition Watch is preferred for engineering gates because silence is a valid result.

Permanent rule:

> **Automate the control of the gate, never the authority to cross the gate.**

Automation may watch QA, Vercel, PR mergeability, regression, capability/documentation drift or external signals. It may classify and escalate. It may not inherit Juanma's authority to visually approve, merge, publish, spend money or redefine scope.

This methodology belongs in the generic autonomous project operating system and should be reused across Museum, Sarah Katerina, Escaparates Pro, Rubik Sota and future projects.

---

# 8. RECOMMENDED IMMEDIATE ORDER — UPDATED

```text
1. HUMAN QA BREEZE
   ✅ COMPLETE / KEEP FOR CONTINUATION
        ↓
2. ADVANCED FULL MUSEUM STUDIO / PHASE 2
   ✅ IMPLEMENTATION STREAM EXISTS
        ↓
3. DEFINE BOUNDED CROSS-STREAM INTEGRATION CONTRACT
   ← NEXT
        ↓
4. IMPLEMENT FIRST COMPLETE AUTHOR → SAVE → PREVIEW → VISITOR → BREEZE → RETURN ROUND TRIP
        ↓
5. REGRESSION QA AGAINST CURRENT VISITOR / TRANSITIONS / BACK / STUDIO
        ↓
6. FRESH CRITIC ON INTEGRATED PRODUCT
        ↓
7. JUANMA HUMAN VISUAL / PRODUCT GATE
```

Unrelated polish can wait.

---

# 9. CANONICAL DOCUMENTS TO READ FIRST NOW

1. `labs/immersive-worlds/docs/MUSEUM_CURRENT_STATE_INTEGRATION_HANDOFF_V2.md`
2. `labs/immersive-worlds/docs/MUSEUM_AUTHORING_CAPABILITY_REGISTRY_V2.md`
3. `labs/immersive-worlds/docs/MUSEUM_PHASE2_CURRENT_STATUS_HANDOFF_V1.md`
4. `labs/immersive-worlds/docs/CHATGPT_SCHEDULED_TASKS_AUTOMATION_MONITORING_OS_V1.md`
5. Breeze implementation stream: `docs/architecture/immersive-worlds/MUSEUM_CURRENT_EXECUTION_STATUS_2026-08-16.md`
6. Breeze implementation spec
7. Museum Playbook + Human QA Runtime Protocol

If documents disagree, latest explicit Juanma decision + actual branch/PR state wins.

---

# 10. CURRENT PROJECT STATEMENT

> Museum has moved beyond both the basic-panel stage and the isolated-Breeze stage. The advanced Full Museum Studio / Phase 2 branch already contains the broad authoring, Visitor and Publish capability architecture, while the separate visitor-runtime/Breeze branch now has a Human-reviewed three-room guided experience and a Breeze sculpture + dynamic cloth room that Juanma accepts for continuation. The next high-value task is a bounded cross-stream integration: connect the advanced Studio to the proven runtime/Breeze capability through one semantic configuration contract, without rebuilding physics, duplicating state, reopening deferred camera/transition polish or merging to master prematurely. Separately, the Automation & Monitoring OS is already canonical methodology for trigger/condition-based project supervision and should be generalized across projects while preserving Juanma's human authority.
