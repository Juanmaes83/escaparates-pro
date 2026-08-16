# MUSEUM STUDIO + CURRENT MUSEUM + BREEZE — INTEGRATION CAPABILITY MATRIX V1

> **Status:** DESIGN / INTEGRATION CONTRACT — NO IMPLEMENTATION AUTHORIZATION  
> **Repository:** `Juanmaes83/escaparates-pro`  
> **Workstream:** Immersive Worlds / Museum  
> **Product Owner / Visual / Final / Merge Authority:** Juanma  
> **Purpose:** unify the Advanced Full Museum Studio with the current Museum runtime, retire the previous authoring panel safely, and finish Room 3 as a Museum-native Breeze installation without rebuilding or destabilising proven systems.

---

# 0. EXECUTIVE DECISION

We are no longer trying to build another panel or another Breeze application.

The target is one Museum product:

```text
FULL MUSEUM STUDIO
        ↓
ONE CANONICAL AUTHORING CONTRACT
        ↓
 ┌──────────────┬──────────────┬────────────────┐
 ▼              ▼              ▼
ROOM 1          ROOM 2         ROOM 3
Museum          Museum         Museum room
                                ↓
                         BREEZE INSTALLATION
                                ↓
                         EXISTING BREEZE
                         CAPABILITY / RUNTIME
        ↓
CURRENT MUSEUM VISITOR RUNTIME
```

The integration rule is:

> **PORT THE CAPABILITY, NOT THE OLD PANEL OR THE DONOR APP SHELL.**

> **PANEL INTEGRATION MAY CHANGE AUTHORED VALUES.**

> **PANEL INTEGRATION MUST NOT CHANGE EXISTING EXPERIENCE LOGIC.**

Room 3 / Breeze must appear to the museum author as part of the same Museum Studio, while Breeze retains authority over its proven cloth/physics/collision capability and Museum retains authority over visitor orchestration, camera, route, Guide, Forward/Back, room lifecycle and publication surface.

---

# 1. SOURCE AUTHORITIES PINNED FOR THIS MATRIX

## A — Current Museum authoring / runtime

Current Museum architecture and product memory are documented under `docs/architecture/immersive-worlds/`.

Known protected historical baselines include:

- Gallery A approved baseline: `a0ada1212477c9b134aac577d2dbac40a916be7e`;
- transition/crossing contracts and one-camera authority;
- authoring implemented as a data layer under `labs/immersive-worlds/authoring/`;
- current Museum World/Scene Kit/Director remain the runtime authority.

**Important pre-implementation gate:** the exact immutable SHA of the current human-approved **three-room runtime** must be pinned immediately before implementation begins. This matrix does not invent that SHA from older documentation.

## B — Advanced Full Museum Studio

PR #58:

```text
Museum Phase 2 — capability systems expansion
branch: chatgpt/museum-phase2-capability-expansion
head reviewed for this matrix:
6b0de03930c20d3b1323a73fa1eb21246e6424a8
```

Key architecture:

- `StudioShell`;
- `experience-tree.js` derives Institution → Exhibition → Rooms → Entities from the real world record;
- canonical config / Schema 3 evolution;
- reversible Preview → Return to Studio;
- Content / Experience / Visitor / Publish capability expansion;
- Phase 1 → canonical synchronization where needed.

PR #58 is **not modified by this document**.

## C — Breeze Studio PRO V4

Primary product authority:

```text
Breeze Studio PRO V4
commit:
3a58e9bcbe9c2bcfdd2f63e4b514085e0223b581
```

Original engine donor:

```text
Juanmaes83/breeze
0ab82342f9169f20e32b0e90babcc4707e694906
```

Existing Breeze product capabilities are to be reused, not recreated.

---

# 2. CLASSIFICATION LEGEND

| Classification | Meaning |
|---|---|
| **DIRECT** | Full Museum Studio can author the canonical value directly and the existing Museum consumer can use it without a new subsystem. |
| **ADAPTER** | Full Museum Studio authors a semantic Museum value which must be translated/reconnected to an already-proven subsystem without changing that subsystem's behaviour. |
| **ALREADY CONNECTED** | A canonical end-to-end authoring → runtime path already exists and should be preserved. |
| **DEFER** | Capability exists but is not required to prove the first safe Studio/Museum/Room-3 unification. |
| **HIDDEN ENGINE INTERNAL** | Engine/physics/rendering implementation detail that must not become a normal Museum authoring control. |
| **PROTECTED BASELINE** | Existing product/runtime behaviour that integration is forbidden to alter opportunistically. |

`KEEP` from earlier working notes is represented here by either **ALREADY CONNECTED** or **PROTECTED BASELINE**, depending on whether the row describes a data path or a runtime invariant.

---

# 3. INTEGRATION CAPABILITY MATRIX

| Capability | Current authority / location | Full Museum Studio destination | Runtime consumer | Action | Integration note / risk |
|---|---|---|---|---|---|
| Institution identity | Museum config | CONSTRUIR · Institución | Museum Scene Kit / signage | DIRECT | Preserve existing semantic fields and stable IDs. |
| Exhibition identity | Museum config | CONSTRUIR · Exposición | Museum | DIRECT | No new exhibition engine required. |
| Room title / metadata | `config.rooms` + world spaces | CONSTRUIR · Salas | Museum Scene Kit | DIRECT | Studio tree already derives rooms from `world.spaces`. |
| Stable room identity | World / WorldState | Not user-editable identity | WorldGraph / Director | PROTECTED BASELINE | Labels may change; IDs and route semantics must not drift during this integration. |
| Artwork metadata | `config.entities` | CONSTRUIR / CONTENIDO | Museum entities / HUD | ALREADY CONNECTED | Preserve Schema 3 round-trip. |
| Artwork image/video | semantic media slots | CONTENIDO · Medios | Museum media loader / Scene Kit | ALREADY CONNECTED | Do not create a second media truth. |
| Artwork dimensions | Schema 3 / entity authoring | CONSTRUIR · Pieza | Museum presentation | ALREADY CONNECTED | Preserve width/height/depth semantics and round-trip. |
| Physical presentation | entity authoring | CONSTRUIR / CONTENIDO | Museum Scene Kit | ALREADY CONNECTED | Frame/mount/material remain semantic authoring. |
| Artwork accessibility | entity accessibility | CONTENIDO / VISITANTE | Visitor/runtime | ALREADY CONNECTED | Preserve label/description/transcript contract. |
| Room accessibility | `config.rooms[room].accessibility` | VISITANTE / EXPERIENCIA | Accessible Route over existing WorldGraph | ALREADY CONNECTED | Do not create a second graph. |
| Artists | Schema 3 `artists` | CONTENIDO · Artistas | Visitor profile/artwork runtime | ALREADY CONNECTED | Capability basic path already exists. |
| Documents | Schema 3 `documents` | CONTENIDO · Documentos | Visitor/entity runtime | ALREADY CONNECTED | Internal PDF viewer is later scope. |
| Languages / translations | Schema 3 `languages` | CONTENIDO · Idiomas | Visitor content | ALREADY CONNECTED | Translation workspace v2 may be DEFER. |
| Calendar / schedule | visitor canonical config | VISITANTE | Visitor information | ALREADY CONNECTED | Phase 1 migration path already exists. |
| Programme | visitor/programme records | VISITANTE | Visitor information | ALREADY CONNECTED | Preserve existing visual calendar/programme work. |
| Visitor memory / Favorites | visitor config + memory state | VISITANTE · Mi visita | Visitor runtime | ALREADY CONNECTED | Human end-to-end validation remains a Phase 2 gate. |
| Accessible Route | `experience.accessibleRoute` + existing portals | EXPERIENCIA | Existing WorldGraph / route logic | ALREADY CONNECTED | Never fork WorldGraph. |
| Personalised Recommendations foundation | `experience.personalization` | VISITANTE / EXPERIENCIA | Visitor runtime | ALREADY CONNECTED | More advanced ranking is DEFER. |
| Save / export / Schema 3 round-trip | canonical ConfigStore/config | PUBLICAR | Authoring/runtime loader | ALREADY CONNECTED | Must remain reversible and semantically identical after reload. |
| Preview / Return to Studio | Phase 2 preview snapshot | top-level Studio | Museum runtime + Studio | ALREADY CONNECTED | Preserve selected domain/node/open sections/scroll where supported. |
| QR/resources | visitor resources | VISITANTE | Visitor | ALREADY CONNECTED | First-party QR renderer can be DEFER. |
| Shop | visitor commerce destination | VISITANTE | external destination | ALREADY CONNECTED | Do not invent internal commerce. |
| Membership / Donations | visitor support destinations | VISITANTE | external destinations | ALREADY CONNECTED | CRM/payment systems are DEFER. |
| Museum camera / POV | Museum CameraAuthority / Director | **NOWHERE** | Museum runtime | PROTECTED BASELINE | Authoring must not become a second camera authority. |
| Focus / proximity / action dispatch | Museum runtime | semantic config only where already supported | Museum runtime | PROTECTED BASELINE | No rewrite during panel integration. |
| Guided route / Guide | Museum Director / route | existing Experience controls only | Museum runtime | PROTECTED BASELINE | Preserve current choreography and canonical poses. |
| Forward / Back | Museum Director | **NOWHERE as engine control** | Museum runtime | PROTECTED BASELINE | Must survive Room 3 integration unchanged. |
| Room crossing / re-entry / handoff | Museum transition/world lifecycle | **NOWHERE as engine control** | Museum runtime | PROTECTED BASELINE | Existing crossing and re-entry semantics are regression gates. |
| Breeze room identity | Museum world/room model | CONSTRUIR · Sala 3 | Museum WorldState / Scene Kit | DIRECT | Room 3 is a Museum room, not a second application. |
| Breeze installation identity | proposed Museum semantic installation record | CONSTRUIR / EXPERIENCIA · Sala 3 | Breeze adapter | ADAPTER | Author as Room → Installation. No iframe/second panel. |
| Breeze enabled / mode | Breeze V4 product config | EXPERIENCIA · Breeze | Breeze adapter/runtime | ADAPTER | Good first-vertical control. |
| Breeze Experience preset | Breeze V4 | EXPERIENCIA · Breeze · Experiencia | Breeze runtime | ADAPTER | Reuse V4 presets; do not recreate preset logic. |
| Cloth image/video | Breeze V4 | CONTENIDO / EXPERIENCIA · Breeze · Tela | Breeze runtime | ADAPTER | Reconnect semantic media reference to proven cloth pipeline. |
| Cloth Scale / Position X/Y | Breeze V4 | EXPERIENCIA · Breeze · Tela · Ajuste | Breeze runtime | DEFER | Existing capability; not necessary for first connection proof. |
| Cloth opacity/brightness/contrast/saturation | Breeze V4 | EXPERIENCIA · Breeze · Apariencia | Breeze runtime | DEFER | Proven V4 capability; surface after basic adapter works. |
| Background image/video | Breeze V4 | CONTENIDO / EXPERIENCIA · Breeze · Fondo | Breeze runtime | ADAPTER | Good first-vertical control if persistence contract is valid. |
| Background Scale / Position X/Y | Breeze V4 | EXPERIENCIA · Breeze · Fondo · Ajuste | Breeze runtime | DEFER | Secondary authoring depth. |
| Wind profile / safe preset | Breeze core + V4 experiences | EXPERIENCIA · Breeze · Comportamiento | Breeze runtime | ADAPTER | Expose semantic profiles, not raw solver parameters. |
| Raw wind/noise/solver tuning | Breeze engine | **NOWHERE** | Breeze compute | HIDDEN ENGINE INTERNAL | Avoid physics-panel leakage into Museum UX. |
| Sculpture template | Breeze V4 | CONSTRUIR / EXPERIENCIA · Breeze · Escultura | Breeze runtime | ADAPTER | Reuse Venus + proven V4 object library. |
| Uploaded GLB/GLTF/OBJ | Breeze V4 | CONTENIDO · Breeze · Escultura | Breeze loaders/runtime | DEFER | Valuable, but persistence/asset lifecycle must be proven before first unification gate. |
| BVH collider rebuild | Breeze V4 / Breeze engine | **NOWHERE** | Breeze core | HIDDEN ENGINE INTERNAL | Changing sculpture may trigger it; author never configures it directly. |
| Verlet physics / compute | Breeze engine | **NOWHERE** | Breeze core | HIDDEN ENGINE INTERNAL | Preserve proven capability. |
| WebGPU backend | Breeze engine | **NOWHERE** | Breeze renderer/core | PROTECTED BASELINE | Renderer integration has historical risk; no opportunistic Museum renderer rewrite. |
| Breeze camera | donor/V4 app shell | **DO NOT PORT AS VISITOR AUTHORITY** | none in Museum orchestration | PROTECTED BASELINE | Museum owns visitor presentation/camera. Port capability, not app shell. |
| PNG/WebM capture | Breeze V4 | optional Publish/Preview later | Breeze output | DEFER | Not required to prove Room 3 authoring integration. |

---

# 4. ROOM 3 — AUTHORING MODEL

Room 3 must be represented as a normal Museum room containing a special installation capability.

Conceptual model:

```text
MUSEUM
└── EXHIBITION
    └── ROOM 3
        └── INSTALLATION
            └── BREEZE
```

Not:

```text
MUSEUM
└── iframe / second app / second authoring panel
```

The exact Schema 3 shape is **not frozen by this matrix**, but the semantic direction is:

```js
// PROPOSED — NOT CANONICAL UNTIL IMPLEMENTATION DESIGN IS APPROVED
rooms[roomId].installations[] = [{
  id,
  type: 'BREEZE',
  enabled,
  preset,
  sculpture: {
    sourceType,
    templateId,
    assetRef
  },
  cloth: {
    mediaRef,
    scale,
    position,
    grading
  },
  background: {
    mediaRef,
    scale,
    position
  },
  windProfile
}]
```

No WebGPU, BVH, Verlet, shader, compute-pipeline or raw collision parameter belongs in the normal Museum authoring schema.

---

# 5. BOUNDED BREEZE ADAPTER CONTRACT

Target responsibility split:

```text
FULL MUSEUM STUDIO
        ↓ semantic Museum data
BREEZE INSTALLATION RECORD
        ↓
BREEZE ADAPTER
        ↓ translates only supported authored values
EXISTING BREEZE CAPABILITY
```

The adapter MAY:

- select an existing Breeze Experience/preset;
- select/reconnect an existing sculpture source;
- provide a validated cloth media reference;
- provide a validated background media reference;
- select a safe semantic wind profile;
- initiate the already-proven Breeze internal reactions needed by those changes.

The adapter MUST NOT:

- recreate cloth physics;
- fork Breeze state into a competing authoring truth;
- create another Museum WorldGraph;
- own the visitor camera;
- replace Forward/Back/Guide semantics;
- change crossing/re-entry behaviour;
- force a global renderer migration as a side effect of panel integration;
- edit the minified V4 bundle as the architectural integration mechanism.

Historical Phase 0 analysis found the Museum/Breeze renderer boundary to be a material contract risk. Therefore the Room 3 implementation must use the currently proven three-room integration path as its runtime baseline and adapt authoring to it; it must not reopen renderer architecture unless a verified current-runtime defect proves that necessary.

---

# 6. SAFE RETIREMENT OF THE PREVIOUS PANEL

The intended product outcome is **one panel**, the Advanced Full Museum Studio.

But the previous panel must not be deleted first.

Safe sequence:

```text
0. PIN current human-approved Museum 3-room runtime + old-panel rollback SHA
        ↓
1. CONNECT Full Museum Studio to existing canonical Museum values
        ↓
2. ADD bounded Room-3/Breeze authoring adapter
        ↓
3. PROVE parity + three-room vertical end to end
        ↓
4. MAKE Full Museum Studio the sole normal authoring entry point
        ↓
5. KEEP old panel dormant / rollback-only for one acceptance cycle
        ↓
6. JUANMA HUMAN APPROVAL
        ↓
7. REMOVE old authoring entry point/code only in a separately auditable change
```

This is what **“eliminar el panel anterior”** means safely: replacement after demonstrated parity, not destructive deletion before proof.

Rollback must remain trivial until Step 6.

---

# 7. FIRST INTEGRATION VERTICAL — REQUIRED PROOF

The first implementation slice should prove the whole backbone with the minimum number of changes:

```text
FULL MUSEUM STUDIO
        ↓
SELECT ROOM 1
        ↓
CHANGE ONE ALREADY-PROVEN VALUE
        ↓
SELECT ROOM 2
        ↓
CHANGE ONE ALREADY-PROVEN VALUE
        ↓
SELECT ROOM 3 / BREEZE
        ↓
CHANGE ONE BREEZE-SPECIFIC VALUE THROUGH THE ADAPTER
        ↓
SAVE
        ↓
PREVIEW
        ↓
START REAL VISITOR EXPERIENCE
        ↓
ROOM 1 REFLECTS AUTHORED VALUE
        ↓
ROOM 2 REFLECTS AUTHORED VALUE
        ↓
ROOM 3 REFLECTS BREEZE VALUE
        ↓
GUIDE / ROUTE / FORWARD / BACK / CROSSING / RE-ENTRY STILL WORK
        ↓
RETURN TO STUDIO
        ↓
AUTHORED VALUES STILL PRESENT
        ↓
RELOAD / ROUND-TRIP PRESERVES SEMANTICS
```

Pass statement:

> **FULL MUSEUM STUDIO GOVERNS THE REAL THREE-ROOM MUSEUM WITHOUT CHANGING THE PROVEN EXPERIENCE LOGIC.**

Anything less is partial integration, not closure.

---

# 8. PROTECTED BASELINE / NO-BREAK LIST

During integration, treat the following as protected unless Juanma explicitly opens them:

```text
ROOM 1
ROOM 2
ROOM 3 / CURRENT BREEZE EXPERIENCE
VENUS / CURRENT SCULPTURE BASELINE
CLOTH BEHAVIOUR
WIND BEHAVIOUR
BVH / COLLISION
WEBGPU / BREEZE COMPUTE
MUSEUM WORLDGRAPH
GUIDE
ROUTE
FORWARD
BACK
RE-ENTRY
CURRENT ROOM TRANSITIONS
CURRENT CAMERA / POV AUTHORITY
CURRENT CROSSING BEHAVIOUR
FOCUS / PROXIMITY / ACTION SEMANTICS
```

A panel-integration regression is fixed in the integration layer first. It is not authorization to “improve” a protected subsystem opportunistically.

---

# 9. STOP / ROLLBACK CONDITIONS

Stop the affected integration chain and revert its change if any of these become true:

- Room 1 or Room 2 differs without an authored-value reason;
- WorldGraph or route semantics fork;
- camera authority changes or duplicates;
- Forward/Back cannot reconstruct the same visitor semantics;
- room crossing or re-entry regresses;
- Breeze physics/cloth/collision must be rewritten merely to accept panel input;
- Breeze becomes a second visible authoring application;
- authored values require two competing stores;
- Save → Preview → Visitor → Return → Reload loses semantics;
- removing the old panel is required before parity can be demonstrated.

Correct response:

```text
REVERT / ISOLATE INTEGRATION CHANGE
≠
REWRITE THE WORKING RUNTIME
```

---

# 10. WHAT IS EXPLICITLY DEFERRED

Not required before Studio/Museum unification:

- Visitor Identity backend;
- cross-device memory;
- real email Save My Visit;
- Digital Guide v2;
- advanced translation workspace;
- personalised routes v2;
- recommendation engine v2;
- first-party QR renderer;
- commerce backend;
- membership CRM;
- donation/payments backend;
- multi-exhibition institutional platform;
- Museum Intelligence;
- full exposure of every Breeze V4 authoring parameter.

These must not delay the safe integration of the panel with the current Museum.

---

# 11. PRE-IMPLEMENTATION GATES

Before Claude/Codex receives an implementation mission:

1. Juanma reviews/approves this matrix or edits its classifications.
2. Pin exact immutable SHA of the human-approved current three-room Museum runtime.
3. Pin the previous-panel rollback point.
4. Confirm the exact current Room 3/Breeze runtime boundary already working in the human-approved preview.
5. Define the smallest first Breeze authoring field to prove the adapter — preferably preset or another already-proven low-risk semantic value.
6. Only then produce the implementation prompt/brief.

---

# 12. AUTHORIZATION BOUNDARY

This document changes **documentation only**.

It does **not** authorize:

- code changes;
- changes to PR #58;
- changes to Breeze Studio PRO V4;
- changes to the Museum runtime;
- deletion of the previous panel;
- merge to `main` / `master`;
- renderer migration;
- Room 3 implementation changes.

> **THIS DOCUMENT AUTHORIZES DESIGN ONLY. IMPLEMENTATION REQUIRES A SEPARATE JUANMA GATE.**
