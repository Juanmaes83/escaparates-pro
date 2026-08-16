# MUSEUM — FULL STUDIO ↔ BREEZE BOUNDED INTEGRATION CONTRACT V1

Date: 2026-08-16  
Repository: `Juanmaes83/escaparates-pro`  
Module: `labs/immersive-worlds/`  
Status: **ARCHITECTURE CONTRACT — READY FOR IMPLEMENTATION MISSION / NO MERGE APPROVAL**  
Human authority: Juanma = Product Owner / Visual Authority / Final Decision / Merge Authority

## 0. Purpose

Define the smallest safe contract that connects the advanced Full Museum Studio / Phase 2 stream to the Human-approved-for-continuation Museum visitor runtime + Breeze Sculpture / Dynamic Cloth room.

This document does **not** authorize a broad branch merge and does **not** reopen Breeze camera / viewpoint / transition polish.

Canonical rule:

```text
INTEGRATE PROVEN CAPABILITY — DO NOT REBUILD IT.
ONE SEMANTIC TRUTH → MULTIPLE REPRESENTATIONS.
```

The first integration must prove one complete round trip:

```text
AUTHOR / CONFIGURE
→ SAVE CANONICAL PROJECT STATE
→ PREVIEW
→ REAL VISITOR
→ REACH BREEZE THROUGH REAL ROUTE
→ BREEZE CONSUMES AUTHORED SEMANTIC CONFIG
→ EXIT
→ BACK / RE-ENTER
→ RETURN TO STUDIO WITH CONTEXT PRESERVED
```

---

# 1. Protected baselines

The implementation mission MUST preserve:

- current Human-accepted three-room visitor journey;
- current transitions as continuation baseline;
- Crossing B as Human-preferred regression boundary;
- Same-room Back;
- Cross-room Back;
- Back → Forward;
- canonical Tour Stop settlement;
- current Guide choreography;
- Museum camera semantic authority;
- Breeze Option E1 specialized nested-room runtime;
- Breeze WebGPU / cloth / wind / Verlet / Venus / BVH capability;
- Museum → Breeze → Museum lifecycle;
- Phase 2 Full Museum Studio domains and current capability architecture;
- Preview → `Volver al Studio` context restoration;
- Schema 3 as the single serialisable authored project truth;
- Visitor Memory remaining separate from authored project Schema 3.

No accepted baseline is reopened unless integration produces a regression.

---

# 2. Authority model

## Museum / Immersive Worlds owns

- WorldGraph;
- room identity;
- route;
- Tour Stops;
- Director / ExperienceDirector orchestration;
- camera semantic authority;
- Guide choreography;
- HUD / visitor product surface;
- authored project state;
- save / export / import / preview semantics;
- lifecycle handoff into and out of specialized rooms.

## Breeze specialized runtime owns while active

- WebGPU presentation;
- cloth simulation;
- wind simulation;
- Verlet internals;
- Venus / sculpture local presentation;
- BVH / local collision internals;
- local installation rendering;
- bounded simulation lifecycle.

## Full Museum Studio owns

- authoring representation of the semantic installation configuration;
- user-facing labels, controls and validation;
- writing the semantic configuration into canonical Schema 3;
- preview launch / return context.

Permanent boundary:

```text
STUDIO AUTHORS SEMANTICS.
MUSEUM OWNS EXPERIENCE AUTHORITY.
BREEZE OWNS SPECIALIZED SIMULATION INTERNALS.
```

---

# 3. Canonical persistence contract

Current Phase 2 architecture already declares Schema 3 as:

`ONE SERIALISABLE PROJECT TRUTH FOR AUTHORING, RUNTIME AND EXPORT.`

The integration MUST extend that truth. It MUST NOT create a Breeze-only persistence store, duplicate room database, second WorldGraph or second project configuration.

## V1 extension direction

Breeze must be represented as a **room installation capability**, not as a second application configuration.

Preferred canonical family:

```text
config.rooms[roomId]
  └── installations[]
      └── {
            id,
            type,
            enabled,
            semanticConfig
          }
```

V1 type:

```text
BREEZE_SCULPTURE_CLOTH
```

This is intentionally generic enough that future specialized room capabilities can coexist without adding a new top-level persistence system.

### Required identity fields

Every installation record must have:

- stable installation `id`;
- owning `roomId` by containment / canonical room key;
- `type`;
- `enabled`;
- optional referenced Museum entity IDs where the authored experience points to canonical sculpture/content identity.

No local runtime-generated identifier may become canonical project identity.

---

# 4. Semantic Breeze configuration — V1 boundary

Ordinary Museum authors must configure product semantics, not engine internals.

The Studio authoring family remains:

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

## Allowed semantic control families

### Experience

Examples of valid semantic controls:

- enabled / disabled;
- presentation/profile selection approved by product authority;
- authored title / label / visitor-facing context;
- replay / relaunch policy expressed as a product choice where exposed;
- Guide participation mode if the existing Museum choreography contract supports it.

### Sculpture

- canonical Museum entity reference where appropriate;
- approved sculpture/presentation profile;
- semantic scale / placement inputs only when they map safely through the room adapter.

### Cloth

- approved cloth preset/profile;
- semantic appearance choices;
- enabled / disabled;
- product-level density/size/presentation choices only if the Breeze adapter already supports them safely.

### Wind

Prefer semantic profiles over raw solver values, e.g.:

```text
CALM
NATURAL
EXPRESSIVE
```

If an intensity control exists, it must map through an adapter-owned safe range.

### Background / Media / Transform

Only author controls that have a defined runtime consumer and round-trip contract.

## Explicitly prohibited from ordinary authoring

Do NOT expose directly:

- WebGPU pipeline internals;
- Verlet spring constants;
- solver iteration counts;
- BVH internals;
- raw simulation buffers;
- render graph internals;
- low-level collision structures;
- implementation-specific shader/compiler settings.

Advanced authoring does not mean leaking engine implementation.

---

# 5. Adapter contract

The integration boundary is a Museum-owned adapter around the already-proven Option E1 host.

Conceptual flow:

```text
Schema 3 room.installations[]
        ↓
Museum Breeze semantic adapter
        ↓
validate + normalise + map approved semantics
        ↓
Option E1 specialized room host
        ↓
Breeze runtime
```

The adapter MUST:

1. accept canonical Museum room / installation identity;
2. accept only the semantic configuration supported by the contract;
3. map semantic values to Breeze runtime parameters/profiles;
4. preserve Museum camera authority;
5. preserve Museum Director / route / Guide ownership;
6. activate Breeze only for the owning room lifecycle;
7. tear down / suspend cleanly on exit;
8. allow re-entry from canonical Museum state;
9. never write a second authored truth back from Breeze internals;
10. expose bounded diagnostics sufficient for QA without making diagnostics canonical state.

---

# 6. Runtime lifecycle contract

Required lifecycle:

```text
MUSEUM DIRECTOR ENTERS BREEZE ROOM
        ↓
resolve roomId + installationId
        ↓
read canonical semantic config
        ↓
Museum adapter validates/maps config
        ↓
activate Option E1 / Breeze runtime
        ↓
Museum retains global semantic/camera/route authority
        ↓
visitor experiences Breeze
        ↓
EXIT / BACK / FORWARD
        ↓
Breeze runtime suspends/disposes bounded resources
        ↓
Museum state/camera/Guide restored
```

Re-entry MUST read the canonical authored configuration again or consume the canonical resolved configuration. It must not depend on stale hidden Breeze-only state.

---

# 7. Studio ↔ Preview ↔ Visitor round-trip

The first integration proof is incomplete unless the same authored values survive:

```text
EDIT
→ SAVE
→ PREVIEW
→ VISITOR RUNTIME
→ RETURN TO STUDIO
→ EXPORT / SERIALISE
→ RELOAD / IMPORT
→ SAME SEMANTICS
```

The implementation must extend the existing Schema 3 normalisation/migration path rather than bypass it.

If a field cannot survive Schema 3 round-trip, it is not an integrated authored capability.

---

# 8. Media / asset ownership

Current project distinction remains authoritative:

```text
MediaVault / authored:<id>
= session-scoped media/object URL path

ProjectCloudAssets / asset:<id>
= intended durable asset path
```

Breeze integration MUST reuse existing media-reference semantics.

Do NOT introduce Breeze-specific byte persistence.

P0.2 durable cross-session asset persistence remains an external-blocked concern unless real Session A → close → Session B retrieval is demonstrated.

This does not block the first bounded integration unless the chosen Breeze authoring control requires durable new bytes that cannot be represented honestly with the current adapter state.

---

# 9. Branch / implementation strategy

Do NOT merge PR #39 and PR #58 together as the first implementation move.

Preferred implementation strategy:

1. start a new isolated integration branch from an explicitly chosen audited base;
2. port the minimum required proven capability/contracts from the other stream;
3. preserve source provenance;
4. do not alter either source branch merely to simplify the integration;
5. do not touch `master`;
6. no final merge without Juanma explicit approval.

Before code moves, the implementation agent must verify the actual current heads of both streams and record them in the Implementation Record.

---

# 10. First implementation slice

Mission scope should remain deliberately narrow.

## Minimum authoring proof

In Full Museum Studio:

- one existing room can enable/configure one `BREEZE_SCULPTURE_CLOTH` installation;
- at least one meaningful semantic Breeze value can be changed visibly/behaviorally;
- save writes it into canonical project state;
- reload preserves it.

## Minimum visitor proof

- Preview / Visitor uses the saved configuration;
- real route reaches Breeze;
- Breeze visibly/behaviorally consumes the authored configuration;
- exit works;
- Back / re-entry works;
- return to Studio restores authoring context.

The first proof should not attempt to expose every future Breeze control.

---

# 11. Regression boundaries

Mandatory regression checks:

- Gallery A baseline;
- Gallery B / current three-room route;
- current transitions;
- Crossing B;
- Forward;
- Same-room Back;
- Cross-room Back;
- Back → Forward;
- Guide lifecycle;
- CameraAuthority ownership;
- Tour Stop semantics;
- Preview → return to Studio;
- Schema 3 round-trip;
- no duplicate WorldGraph / Visitor / persistence truth;
- no orphan Breeze loops after exit/re-entry.

Functional integration PASS does not override Human visual judgement.

---

# 12. Evidence / Human Review contract

The implementation must follow the active Museum Playbook and Human Review Delivery Contract.

Final handoff must include a real Review Map:

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

The target Human path for this integration is:

```text
OPEN FULL MUSEUM STUDIO
→ GO TO THE BREEZE ROOM AUTHORING SURFACE
→ CHANGE ONE OR MORE SEMANTIC CONTROLS
→ SAVE
→ PREVIEW / VISITOR
→ REACH BREEZE THROUGH THE REAL ROUTE
→ OBSERVE AUTHORED CONFIG IN THE REAL ROOM
→ EXIT
→ BACK / RE-ENTER
→ RETURN TO STUDIO
→ CONFIRM CONTEXT + CONFIG PRESERVED
```

A review link without this map is incomplete.

---

# 13. Stop / escalation conditions

A real architecture gate exists only if implementation proves that one of these is unavoidable:

- a second canonical persistence truth;
- a second WorldGraph / route authority;
- replacement of Museum CameraAuthority;
- broad renderer architecture rewrite outside the bounded specialized-room host;
- required merge of the two large branches before a vertical can be proven;
- destructive change to a Human-approved visitor baseline;
- inability to represent the authored Breeze configuration in Schema 3 without breaking existing round-trip.

If one localized implementation path blocks while other authorized independent work remains, apply the Continuous Execution rule:

```text
BLOCK THE DEPENDENCY, NOT THE PROJECT.
```

---

# 14. Success definition

V1 integration succeeds when we can truthfully demonstrate:

```text
THE STUDIO AUTHORS ONE CANONICAL SEMANTIC BREEZE CONFIG.
THE SAME CONFIG SURVIVES SAVE / PREVIEW / EXPORT / RELOAD.
THE REAL MUSEUM ROUTE CONSUMES IT.
BREEZE REMAINS A BOUNDED SPECIALIZED RUNTIME.
MUSEUM RETAINS CAMERA / ROUTE / GUIDE / WORLD AUTHORITY.
EXIT / BACK / RE-ENTRY REMAIN COHERENT.
RETURN TO STUDIO PRESERVES CONTEXT.
NO SECOND PERSISTENCE OR EXPERIENCE TRUTH WAS CREATED.
```

After this contract is implemented and audited, broader Breeze authoring or later visual/cinematic polish can be considered separately.
