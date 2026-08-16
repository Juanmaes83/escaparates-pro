# MUSEUM — CURRENT STATE & INTEGRATION HANDOFF V2

Date: 2026-08-16  
Repository: `Juanmaes83/escaparates-pro`  
Module: `labs/immersive-worlds/`  
Status: CURRENT CROSS-BRANCH HANDOFF — DO NOT TREAT AS MERGE APPROVAL  
Human authority: Juanma = Product Owner / Visual Authority / Final Decision / Merge Authority

## 0. WHY THIS DOCUMENT EXISTS

Museum is now advanced enough that a single-branch status is no longer sufficient.

There are currently **two different active implementation streams** that must not be confused:

1. the advanced Full Museum Studio / Phase 2 capability expansion;
2. the Breeze Sculpture + Dynamic Cloth visitor-room implementation.

Both are valuable. Both are advanced. **They are not integrated with each other yet.**

The next architectural task is not to rebuild either stream, but to decide the safe integration point after the necessary Human QA gates are satisfied.

Permanent rule:

```text
RECOVER BEFORE INVENT
EXTEND BEFORE DUPLICATE
INTEGRATE PROVEN CAPABILITY — DO NOT REBUILD IT
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

Current PR state:

- OPEN
- DRAFT
- NOT MERGED
- human visual closure still required

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

- final human visual closure is pending;
- cross-device visitor identity is not implemented;
- real email recovery for Save My Visit is not implemented;
- QR production encoding still needs first-party/local implementation;
- shop is not internal inventory/cart/checkout;
- membership/donations do not include internal payment/CRM infrastructure;
- recommendations are deterministic foundation, not full AI personalization;
- multilingual system is a strong foundation, not a mature translation-management suite;
- merge/release is not approved.

---

# 2. ACTIVE STREAM B — BREEZE SCULPTURE + DYNAMIC CLOTH ROOM

Working branch:

`claude/immersive-worlds-module-c0d3f7`

PR:

`#39 Claude/immersive worlds module c0d3f7`

Base:

`master`

Current audited candidate HEAD at this handoff:

`e88c2926d36de6432fa1a6c662e0c2eb725b6b7e`

Current PR state:

- OPEN
- NOT MERGED
- mergeable at time of this handoff
- PRODUCT APPROVAL still requires Juanma

## Breeze implementation state

The Breeze room is no longer a paper-only proposal. The current branch contains a substantially implemented visitor-room candidate derived from the approved Breeze authority.

The implementation has already reached:

- central Venus/sculpture installation;
- spatial room grounding;
- dynamic cloth simulation;
- wind-driven motion;
- sculpture collision path;
- Museum camera authority rather than Breeze standalone camera authority;
- Guide integration;
- room entry / exit / re-entry lifecycle work;
- deterministic relaunch behavior for reviewability;
- automated evidence/harness coverage reported as 28/28 by the implementation stream;
- Fresh Critic / Human QA review-map stage;
- exact Vercel deployment available for the candidate SHA.

Important authority rule:

```text
28/28 MACHINE QA ≠ PRODUCT APPROVAL
FRESH CRITIC KEEP ≠ JUANMA APPROVAL
PIXELS / HUMAN EXPERIENCE WIN
```

The Breeze candidate must be judged as a Museum visitor experience: sculpture first-read, cloth arrival, wind legibility, contact/deformation, recovery, Guide choreography, camera composition, exit and return coherence.

## Breeze product authority

The authority remains:

```text
BREEZE STUDIO PRO V4 = PRODUCT AUTHORITY
Juanmaes83/breeze = ENGINE DONOR
Museum = EXPERIENCE / CAMERA / GUIDE / ROUTE / LIFECYCLE AUTHORITY
```

Do not replace this with rope-gallery logic and do not rebuild the cloth engine from scratch.

---

# 3. THE IMPORTANT CURRENT FACT — THE TWO STREAMS ARE NOT YET INTEGRATED

This is the central state of the project now.

```text
STREAM A
ADVANCED FULL MUSEUM STUDIO / PHASE 2
        │
        │  authoring + content + visitor + publish + persistence
        │
        └──────────────┐
                       │
                       ▼
                INTEGRATION GATE
                       ▲
                       │
        ┌──────────────┘
        │
STREAM B
BREEZE SCULPTURE + DYNAMIC CLOTH ROOM
visitor runtime + physics + Guide + camera + lifecycle
```

The project must **not** pretend the Breeze room is already fully exposed as a first-class configurable object in the advanced Phase 2 Museum Studio unless that connection is actually implemented and audited.

Likewise, the Phase 2 Studio must not invent a second Breeze implementation. It must consume the proven Breeze room capability through a bounded Museum adapter/configuration contract.

---

# 4. INTEGRATION OBJECTIVE

When the integration gate is opened, the objective is:

```text
FULL MUSEUM STUDIO
      ↓
EXPERIENCE / ROOM AUTHORING
      ↓
BREEZE INSTALLATION CONFIG
      ↓
MUSEUM ROOM ADAPTER
      ↓
BREEZE CLOTH CAPABILITY
      ↓
MUSEUM VISITOR RUNTIME
```

The Studio should author semantic product controls; it must not expose raw WebGPU / Verlet / BVH internals to ordinary museum users.

Expected authoring family:

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

Integration must preserve one semantic truth and multiple representations rather than creating duplicate state.

---

# 5. WHEN TO INTEGRATE

Do **not** integrate merely because both branches exist.

Proceed when all of the following are true enough to preserve Global Outcome Stability:

1. Phase 2 Studio architecture is sufficiently stable for the integration surface being touched.
2. Breeze candidate has completed the Human QA needed to know what is KEEP / ADJUST / REJECT.
3. The integration can be performed without silently changing already preferred Museum route/camera/portal behavior.
4. There is a single configuration ownership model for Breeze authored state.
5. No parallel persistence/state model is introduced.
6. Existing Studio capability contracts remain reusable rather than being duplicated.
7. The integration branch/strategy is explicit before code is moved across streams.

The integration does **not** require every future Museum feature to be finished first. It requires the contracts directly touched by Breeze to be stable enough.

Recommended decision rule:

```text
IF BREEZE HUMAN QA REVEALS PRODUCT CHANGES
→ correct Breeze first

IF BREEZE IS HUMAN-ACCEPTED AND STUDIO SURFACE IS STABLE
→ OPEN BOUNDED INTEGRATION MISSION

IF INTEGRATION REQUIRES GLOBAL CAMERA / RENDERER / PERSISTENCE REWRITE
→ STOP AT HUMAN ARCHITECTURE GATE
```

---

# 6. WHAT WE SHOULD NOT DO NEXT

Do not:

- merge PR #39 or PR #58 just to make integration easier;
- merge to `master` without Juanma approval;
- rebuild Breeze inside Phase 2;
- duplicate WorldGraph, Map, Visitor state or project persistence;
- expose raw physics internals in the normal authoring panel;
- treat a headless pass as visual approval;
- make the old missing-capability checklist authoritative again;
- start unrelated P1/P2 work if it would delay the integration objective without protecting a direct contract.

---

# 7. AUTOMATION & MONITORING — SEPARATE METHODOLOGY LAYER

This is a **different concern from the product integration above**.

The repository already contains the canonical companion:

`labs/immersive-worlds/docs/CHATGPT_SCHEDULED_TASKS_AUTOMATION_MONITORING_OS_V1.md`

It defines a reusable supervision layer based on:

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

Its key methodological contribution is that scheduled/condition tasks are not reminders; they are **persistent watchers around project gates**.

Three modes are defined:

- ONE-SHOT;
- RECURRING;
- CONDITION WATCH.

Condition Watch is preferred for engineering gates because silence is a valid result.

Permanent rule:

> **Automate the control of the gate, never the authority to cross the gate.**

The watcher may observe QA, Vercel, PR mergeability, regressions, registry drift or external signals. It may classify and escalate. It may **not** inherit Juanma's authority to visually approve, merge, publish, spend money or redefine scope.

This Automation & Monitoring layer should eventually become part of the generic autonomous engineering/project OS, not remain an isolated Museum trick.

---

# 8. RECOMMENDED IMMEDIATE ORDER

Current recommended sequence:

```text
1. HUMAN QA — BREEZE EXACT CANDIDATE
        ↓
2. CLASSIFY BREEZE = KEEP / ADJUST / REJECT
        ↓
3. CLOSE ONLY DIRECT PHASE-2 / STUDIO BLOCKERS TO INTEGRATION
        ↓
4. DEFINE BOUNDED CROSS-STREAM INTEGRATION CONTRACT
        ↓
5. INTEGRATE BREEZE AS A FIRST-CLASS MUSEUM ROOM CAPABILITY
        ↓
6. QA AUTHORING → PERSISTENCE → PREVIEW → VISITOR RUNTIME → RETURN
        ↓
7. FRESH CRITIC
        ↓
8. JUANMA HUMAN VISUAL / PRODUCT GATE
```

This sequence may be advanced without waiting for unrelated future Museum features.

---

# 9. CANONICAL DOCUMENTS TO READ FIRST NOW

For any new ChatGPT / Claude / Codex / Kimi window:

1. `labs/immersive-worlds/docs/MUSEUM_CURRENT_STATE_INTEGRATION_HANDOFF_V2.md`
2. `labs/immersive-worlds/docs/MUSEUM_AUTHORING_CAPABILITY_REGISTRY_V2.md`
3. `labs/immersive-worlds/docs/MUSEUM_PHASE2_CURRENT_STATUS_HANDOFF_V1.md`
4. `labs/immersive-worlds/docs/CHATGPT_SCHEDULED_TASKS_AUTOMATION_MONITORING_OS_V1.md`
5. `docs/architecture/immersive-worlds/MUSEUM_BREEZE_SCULPTURE_CLOTH_ROOM_IMPLEMENTATION_SPEC_V1.md` on the Breeze implementation stream
6. Museum Playbook + Human QA Runtime Protocol

If documents disagree, use the latest explicit Juanma decision and verify the actual branch/PR state before acting.

---

# 10. CURRENT PROJECT STATEMENT

> Museum is no longer at the stage of building a basic panel. The Full Museum Studio is already a broad authoring product with five canonical domains and a large Phase 2 capability set. In parallel, the Breeze Sculpture + Dynamic Cloth room is already a substantially implemented visitor-runtime candidate on PR #39. The next high-value product objective is to Human-QA Breeze, stabilize only the contracts that directly affect integration, and then connect the proven Breeze capability into the advanced Museum Studio without rebuilding physics, duplicating state or weakening existing Museum behavior. Separately, the Automation & Monitoring OS is an already documented methodology layer for persistent condition-based supervision; it should be generalized across projects while preserving Juanma's human authority.
