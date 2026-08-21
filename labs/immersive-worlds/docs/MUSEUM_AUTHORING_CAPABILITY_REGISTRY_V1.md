# MUSEUM AUTHORING CAPABILITY REGISTRY V1

Status: Phase 1 closure registry  
Project: Escaparates Pro / Immersive Worlds / Museum  
Branch under human review: `chatgpt/museum-visitor-phase1`  
Authority: Juanma = Product Owner / Visual Authority / Merge Authority

## Purpose

This registry is the canonical map of every capability recovered or added to the Museum Full Studio during Phase 1. It exists so a future Claude/Codex/Kimi audit can understand **what exists, where it lives, why it lives there, what source of truth it uses, how to validate it, and what must not be duplicated**.

Permanent rule: every future improvement anywhere in the panel MUST add or update a registry entry before the phase can be considered closed.

## Studio capability map

```text
FULL MUSEUM STUDIO
│
├── CONSTRUIR
│   └── Pieza / obra concreta
│       ├── Medidas físicas                 P1-06
│       └── Accesibilidad de la obra        P1-07B
│
├── CONTENIDO
│   └── Existing canonical content/media authoring
│
├── EXPERIENCIA
│   └── Existing pacing / motion / projection / route authoring
│
├── VISITANTE
│   ├── Planificación                       P1-01
│   ├── Agenda                              P1-02
│   ├── Orientación                         P1-03
│   ├── Mi visita
│   │   ├── Artwork progress                P1-04
│   │   └── Seen / Not seen                 P1-05
│   └── Accesibilidad                       P1-07A
│
└── PUBLICAR
    └── Existing validation / export / publication surfaces
```

The identifiers are documentation and QA identifiers. They are deliberately **not displayed as backlog numbering in the user interface**.

---

## P1-01 — Visual Calendar / Planificación

**Domain:** Visitante  
**UI location:** `Visitante → Planificación → Personalizar más`  
**User-facing role:** define weekly opening times, open/closed days, calendar context and published visitor information.  
**Why here:** opening hours and public visit planning are institution-level visitor information, not properties of rooms or artworks.  
**Persistence:** Phase 1 sidecar `iw.museum.visitor.phase1.v1` for structured weekly schedule; existing `visitor.*` fields remain canonical for published fallback text/address/admission/ticket/booking.  
**Validation:** green only when at least one open day has valid start/end times.  
**Do not duplicate:** do not create a second visitor-hours system elsewhere in Builder or Runtime.

## P1-02 — Better Programme Editor / Agenda

**Domain:** Visitante  
**UI location:** `Visitante → Agenda → Personalizar más`  
**Source of truth:** existing `config.visitor.programme[]`.  
**User-facing role:** list, add, edit and remove activities; expose title, type, dates/times, location, booking URL, description and accessibility note.  
**Why here:** programme is visitor-facing institutional scheduling.  
**Validation:** programme item is ready only when minimum required fields are present and a parsed end date does not precede parsed start date.  
**Do not duplicate:** do not create another event collection or calendar-only event model.

## P1-03 — Interior Map v2 / Orientación

**Domain:** Visitante authoring bridge + Visitor Runtime execution  
**UI location:** `Visitante → Orientación → Previsualizar mapa`  
**Runtime location:** existing HUD map.  
**Source of truth:** existing WorldGraph / runtime store geometry, spaces and edges.  
**User-facing role:** announce that an interior map exists, summarize rooms/works, and bridge the author directly to the real visitor map.  
**Why here:** the author needs discoverability and preview access, but map rendering belongs to runtime.  
**Critical rule:** **there is one map only**. The Studio card is a bridge; it must never render or maintain a second map model.

## P1-04 — Artwork Progress

**Domain:** Visitor Runtime, surfaced in Studio under `Mi visita`.  
**UI location:** `Visitante → Mi visita → Probar como visitante`.  
**Runtime location:** map panel progress summary.  
**Source of truth:** `WorldState.visitedEntityIds` and runtime store entities.  
**User-facing role:** show `seen / total`, progress bar and per-room progress.  
**Why here:** progress is meaningful only during a real visitor session; Studio explains and links to it rather than simulating another state.  
**Do not duplicate:** no authoring-owned progress counter.

## P1-05 — Seen / Not Seen

**Domain:** Visitor Runtime, grouped with P1-04 as `Mi visita`.  
**Source of truth:** `WorldState.visitedEntityIds` and `visitedSpaceIds`.  
**User-facing role:** distinguish viewed and pending works and mark the active detail as viewed in the current visit.  
**Why grouped with progress:** they are two views of the same visitor-memory state.  
**Do not duplicate:** never create a separate seen-state in Studio/local UI when WorldState already owns the session truth.

## P1-06 — Artwork Dimensions in Full Studio

**Domain:** Construir  
**UI location:** `Construir → Sala → seleccionar obra → editor derecho → Medidas físicas`.  
**Source of truth:** canonical world entity `entity.size`; Phase 1 sidecar stores centimetre authoring values and writes them back into world/runtime truth.  
**Fields:** width, height, optional depth.  
**Why here:** dimensions describe the physical truth of a specific artwork. They do **not** belong to the global Visitor domain.  
**Current QA note:** presence, location and existing green state are automation-smoke-tested. Automated sequential editing of multiple dimension fields in headless Playwright remains a known harness/interaction limitation and therefore requires human validation before merge.  
**Do not move:** do not relocate this capability into Visitante.  
**Do not duplicate:** do not create a second dimensions schema.

## P1-07A — Structured Institution Accessibility

**Domain:** Visitante  
**UI location:** `Visitante → Accesibilidad → Personalizar más`.  
**Structured services:** step-free entrance, lift, accessible WC, hearing loop, audio description, sign language, quiet space, seating/rest.  
**Published compatibility:** existing free-text `visitor.accessibility` remains available.  
**Why here:** these services describe visitor access to the institution as a whole.  
**Runtime effect:** active structured services are appended to the existing visitor accessibility presentation.

## P1-07B — Artwork Accessibility

**Domain:** Construir / contextual artwork editor.  
**UI location:** `Construir → Sala → Obra → Accesibilidad de la obra`.  
**Source of truth:** entity accessibility semantics (`label`, `description`, `transcript`).  
**Why separate from P1-07A:** artwork accessibility is entity-specific content; institution accessibility is visitor-service information.  
**Do not collapse the two models.**

---

## Visitor capability index — Phase 1 closure decision

The Visitor panel is now a **capability index**, not a vertical dump of every control.

Each capability follows the same pattern:

```text
CAPABILITY NAME
short summary
status ●
primary action (when appropriate)
Personalizar más (when editable detail exists)
```

Current cards:

1. **Planificación** — editable, expandable.
2. **Agenda** — editable, expandable.
3. **Orientación** — runtime bridge to the existing map.
4. **Mi visita** — runtime bridge to progress + seen/not seen.
5. **Accesibilidad** — editable, expandable.

The UI does not expose internal IDs `P1-01`…`P1-07`; those IDs remain in source attributes, tests and documentation for traceability.

## Phase governance

For every future panel improvement, update this registry with at least:

- capability ID and name;
- domain and exact navigation path;
- why it belongs there;
- source of truth;
- authoring behaviour;
- runtime impact;
- validation / QA status;
- explicit `DO NOT DUPLICATE / DO NOT MOVE` constraints when relevant.

A capability is not considered phase-complete only because code exists. It must be **discoverable, documented, connected to its canonical truth and auditable by a human**.