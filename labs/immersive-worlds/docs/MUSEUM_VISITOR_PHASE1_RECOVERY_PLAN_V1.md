# MUSEUM VISITOR PHASE 1 — CAPABILITY RECOVERY PLAN V1

**Project:** Escaparates Pro — Immersive Worlds / Museum  
**Scope:** Full Museum Studio → Visitor layer  
**Repository:** `Juanmaes83/escaparates-pro`  
**Working branch:** `chatgpt/museum-visitor-phase1`  
**Base branch:** `claude/immersive-worlds-module-c0d3f7`  
**Baseline:** `labs/immersive-worlds/docs/MUSEUM_VISITOR_BASELINE_V1.md`  
**Status:** APPROVED DIRECTION — IMPLEMENTATION CONTRACT  
**Date:** 2026-08-16

---

## 0. Mission

Phase 1 does **not** invent a new Visitor platform. It recovers and exposes capabilities that the Museum already owns semantically but does not yet present completely in the Full Museum Studio or visitor UX.

The governing rule is:

```text
RECOVER BEFORE INVENT
EXTEND BEFORE DUPLICATE
ONE SEMANTIC TRUTH → MULTIPLE REPRESENTATIONS
```

Every Phase 1 item must be classified against the frozen baseline as:

- `EXISTING` — already implemented; improve/expose it.
- `PARTIAL` — semantic/data/runtime capability exists; complete the missing authoring or visitor representation.
- `NEW UI ONLY` — new presentation over existing truth; no new parallel data model.

Phase 1 must preserve:

```text
AUTHORING DATA
      ↓
EXPERIENCE CONFIG / CANONICAL WORLD
      ↓
WORLD STATE / WORLD GRAPH
      ↓
VISITOR EXPERIENCE
```

No feature may introduce a second source of truth for rooms, artworks, dimensions, progress or accessibility.

---

# 1. PHASE 1 SCOPE

```text
01 Visual Calendar
02 Better Programme Editor
03 Interior Map v2
04 Artwork Progress
05 Seen / Not Seen
06 Artwork Dimensions in Full Studio
07 Better Structured Accessibility
```

---

# 2. EXECUTIVE STATUS MATRIX

| ID | Capability | Baseline status | Existing truth to recover | Phase 1 result |
|---|---|---|---|---|
| 01 | Visual Calendar | PARTIAL | `visitor.programme[].start/end` + `visitor.hours` | Visual date layer derived from programme records |
| 02 | Better Programme Editor | EXISTING/PARTIAL | `visitor.programme[]` schema + add/remove/editor | Structured, skimmable programme authoring without changing record ownership |
| 03 | Interior Map v2 | EXISTING | `WorldGraph`, `space.bounds`, `visitedSpaceIds`, `activeSpaceId` | More useful map with room state + artwork progress context |
| 04 | Artwork Progress | PARTIAL | `visitedEntityIds` + canonical focusable entities | `seen / total` progress derived from World State |
| 05 | Seen / Not Seen | PARTIAL | `visitedEntityIds` | Per-artwork visual state + pending list, no duplicate tracking array |
| 06 | Artwork Dimensions in Full Studio | PARTIAL | canonical `entity.size` already rendered and editable in thin author mode | Full Studio authoring for physical dimensions using canonical dimensions |
| 07 | Better Structured Accessibility | PARTIAL | entity accessibility records + visitor accessibility text + accessible outline | Structured institutional + artwork accessibility presentation |

---

# 3. 01 — VISUAL CALENDAR

## Current capability

The Museum already stores programme records with:

```text
visitor.programme[].start
visitor.programme[].end
```

and displays them to the visitor.

The missing capability is **visual temporal representation**, not event data.

## Phase 1 decision

Build the calendar as a **derived view of `visitor.programme[]`**.

Do not create:

```text
visitor.calendar.events[]
```

That would duplicate programme.

## Authoring UX

Inside `Visitante → Programación`:

```text
PROGRAMACIÓN
[ Lista ] [ Calendario ]

      SEPTIEMBRE 2026
L   M   X   J   V   S   D
            1   2   3   4
5   6   7   8   9  10  11
...
```

Dates carrying programme records receive a quiet marker.

Selecting a date filters/highlights the records for that date.

Programme entries whose `start` cannot be parsed as a calendar date remain visible in the list and are labelled `Fecha libre`, never silently discarded.

## Important compatibility rule

Existing values such as:

```text
Sábados 12:00
1958
```

are legitimate authored strings under the current schema. Phase 1 must not corrupt or reinterpret them.

Therefore:

- ISO/ISO-like dates → calendar representation.
- free-text dates → list representation only.

## QA acceptance

- Existing Museum configurations load unchanged.
- No programme record disappears because its date is free text.
- Calendar date selection does not mutate programme data.
- Adding/removing a programme record updates calendar and list from one record set.

---

# 4. 02 — BETTER PROGRAMME EDITOR

## Current capability

Already implemented:

```text
PROGRAMME
- title
- type
- start
- end
- location
- bookingUrl
- description
- accessibilityNote in schema
```

The current Full Studio exposes most of these, but `accessibilityNote` is not surfaced in the programme editor.

## Phase 1 improvement

Each programme item becomes a compact editorial card:

```text
19 SEP · 18:00
VISITA GUIADA
Ver la niebla
Vestíbulo

[Editar] [Quitar]
```

Expanded state exposes the existing record fields.

Add the already-existing:

```text
accessibilityNote
```

to the Full Studio.

## Explicit non-scope

Do not add in Phase 1:

- recurrence engine
- capacity inventory
- waiting list
- seat map
- internal ticketing

Those are genuinely new systems and contradict the current programme contract if pretended by simple fields.

## QA acceptance

- Add/remove preserves stable `programme.id`.
- All existing fields round-trip through save/export.
- `accessibilityNote` reaches visitor presentation where applicable.
- Compact/expanded states never alter data.

---

# 5. 03 — INTERIOR MAP V2

## Current capability

The current visitor map is already derived from:

```text
WorldGraph
+
space.bounds.origin
+
activeSpaceId
+
visitedSpaceIds
```

This architecture is correct and remains canonical.

## Phase 1 improvement

Map V2 adds three semantic layers without creating a hand-authored floor map:

### Room state

```text
YOU ARE HERE
VISITED
NOT VISITED
```

### Artwork progress by room

Derived from entities belonging to each Space:

```text
GALERÍA A
4 / 6 obras vistas
```

### Legend

A compact legend explains active / visited / pending state.

## Optional click behaviour

If a map node can use an existing semantic runtime action to enter/reveal a reachable room safely, it may become interactive.

If not, Phase 1 keeps it informational. The map must not invent teleportation.

## QA acceptance

- Map geometry continues to come from `space.bounds` / World Graph.
- No manually maintained room-coordinate map exists.
- Current room is unmistakable.
- Room progress equals World State + canonical entities.
- Portal semantics remain unchanged.

---

# 6. 04 — ARTWORK PROGRESS

## Current capability

`WorldState` already owns:

```text
visitedEntityIds: Set<string>
```

and adds an entity when it is focused.

This is the canonical Phase 1 seen-state.

## Phase 1 result

Visitor UI derives:

```text
12 / 15 vistas
```

from:

```text
visitedEntityIds
÷
canonical visitable/focusable collection entities
```

No second `seen[]` collection is introduced.

## Scope of counted entities

Progress should count visitor-relevant collection pieces, not every semantic entity.

Institutional wall panels, technical text entities and non-focusable records must not inflate the denominator.

The denominator must derive from the same runtime/canonical rule used for visitor focus/browse capability where possible.

## QA acceptance

- Focusing a new artwork increments progress once.
- Refocusing it does not increment progress twice.
- Entering a room alone does not mark every work in that room as seen.
- Progress survives mode changes during the same runtime because `WorldState` is shared.

---

# 7. 05 — SEEN / NOT SEEN

## Current capability

Seen state exists semantically in `visitedEntityIds`; the visitor currently cannot inspect it as a collection state.

## Phase 1 result

Expose:

```text
✓ VISTAS
○ PENDIENTES
```

per piece and as a simple collection summary.

Examples:

```text
Sala del norte
✓ Marea de septiembre
○ Cuaderno de niebla
```

## Relationship to Artwork Progress

These are **two representations of one truth**:

```text
visitedEntityIds
      ├── numerical progress
      └── per-piece seen/pending state
```

They must never maintain separate data.

## Explicit non-scope

Phase 1 does not add:

```text
favorites
save visit
email identity
cross-session persistence
```

Those belong to Visitor Memory / Phase 3.

## QA acceptance

- Seen/pending updates immediately after focus.
- Progress and item state can never disagree.
- No `seen` boolean is authored onto artwork records.

---

# 8. 06 — ARTWORK DIMENSIONS IN FULL STUDIO

## Current capability

Canonical Museum entities already own physical dimensions through:

```text
entity.size[0]
entity.size[1]
```

The thin authoring layer already proves these are editable as:

```text
Ancho (m)
Alto (m)
```

The visitor HUD already renders the dimensions in centimetres.

The Full Studio currently only **reads** them inside the facts block.

## Phase 1 decision

Promote the existing canonical physical size into the Full Studio editor.

Author-facing representation:

```text
MEDIDAS REALES
Ancho     90 cm
Alto     240 cm
```

Use a clear unit presentation for museum professionals while preserving canonical numeric truth.

## Critical architecture requirement

Dimensions are **physical semantic truth**, not visual styling.

```text
PHYSICAL SIZE
≠
MEDIA PIXEL DIMENSIONS
≠
FRAME / MATERIAL / MOUNT
```

Frame, mount, material, passepartout and glass remain outside Phase 1 and belong to later content expansion.

## Persistence requirement

A Full Studio dimension edit must round-trip through the canonical project representation and survive preview rebuild/save/export.

No temporary DOM-only or local duplicate dimension store is acceptable.

## QA acceptance

- Editing width/height changes the rendered physical work after Apply.
- Visitor label reports the new dimensions.
- Save/export/reload preserves them.
- Media pixel width/height remain untouched.

---

# 9. 07 — BETTER STRUCTURED ACCESSIBILITY

## Current capability

The Museum already has two accessibility layers:

### Institution / visit

```text
visitor.accessibility
```

### Canonical entities

```text
entity.accessibility.label
entity.accessibility.description
entity.accessibility.transcript
```

The HUD already generates a full textual exhibition outline from canonical Spaces and Entities.

Programme records also already contain:

```text
accessibilityNote
```

## Phase 1 decision

Recover and organise these truths before adding new accessibility concepts.

### Full Studio — Visitor

Keep the institutional accessibility statement, but structure the editor around:

```text
ACCESIBILIDAD DE LA VISITA
- Información general
- Cómo llegar / acceso
- Programa: nota accesible por actividad
```

Only fields backed by current data should become persisted in Phase 1.

### Full Studio — artwork

Expose existing canonical accessibility description where the Full Studio can safely round-trip it.

### Visitor HUD

Improve presentation hierarchy so accessibility is discoverable both:

1. in Visit information; and
2. in `Contenido en texto`.

Do not create a second accessibility CMS.

## Explicit non-scope

New structured capabilities such as:

- hearing loop boolean
- step-free route graph
- sensory map
- sign-language availability
- quiet zones
- accessible toilet records

are valuable, but they are genuinely new semantic fields and therefore outside recovery-only Phase 1 unless separately approved.

## QA acceptance

- Existing accessibility descriptions remain available in readable DOM.
- Programme accessibility note is no longer stranded in schema-only data.
- No accessibility information is lost when a section is empty.
- Screen-readable outline continues to derive from canonical records.

---

# 10. IMPLEMENTATION ORDER

Implement in dependency order, not list order:

```text
A. Programme foundation
   02 Better Programme Editor
   01 Visual Calendar

B. Visitor State recovery
   04 Artwork Progress
   05 Seen / Not Seen
   03 Interior Map v2

C. Canonical authoring recovery
   06 Artwork Dimensions in Full Studio
   07 Better Structured Accessibility
```

Reason:

- Calendar depends on programme records.
- Map V2 should consume progress state after progress semantics are stable.
- Dimensions/accessibility require the strongest persistence/round-trip QA and should not be mixed into the first UI iteration.

---

# 11. PRIMARY FILE MAP

Expected implementation surfaces:

```text
labs/immersive-worlds/authoring/studio/studio-shell.js
  → Visitor editor
  → Programme editor
  → Visual calendar
  → Full Studio dimensions/accessibility controls

labs/immersive-worlds/authoring/studio/studio.css
  → authoring presentation only

labs/immersive-worlds/authoring/experience-config.js
  → only if canonical authoring overlay must gain persistent fields
  → schema migration required if schema changes

labs/immersive-worlds/app/ui/hud.js
  → map V2
  → artwork progress
  → seen/pending presentation
  → programme accessibility presentation
  → accessibility hierarchy

labs/immersive-worlds/app/ui/styles.css
  → visitor presentation only

labs/immersive-worlds/engine/world/world-state.js
  → READ/REUSE first
  → do not add duplicate progress state
```

Any implementation that introduces a separate `visitor-progress.js` truth, hand-maintained room map coordinates, or duplicate artwork dimension records must be rejected unless a technical constraint is documented first.

---

# 12. PHASE 1 GLOBAL ACCEPTANCE GATE

Phase 1 is complete only when all of these are true:

```text
[ ] Existing configurations still load.
[ ] Museum de la Bruma still proves second-institution personalisation.
[ ] Visitor workspace remains usable at desktop and mobile widths.
[ ] Visual Calendar derives from programme; it does not own events.
[ ] Programme accessibilityNote is exposed.
[ ] Map still derives from World Graph / real space geometry.
[ ] Artwork progress derives from visitedEntityIds.
[ ] Seen / Not Seen and progress cannot disagree.
[ ] Dimensions are canonical physical dimensions and survive round-trip.
[ ] Accessibility continues to derive from canonical/visitor records.
[ ] No new feature breaks Explore or Guided mode.
[ ] No new feature changes camera authority contracts.
[ ] No new feature invents ticket availability, teleportation or event inventory.
[ ] Baseline behaviour not explicitly superseded remains intact.
```

---

# 13. DEFERRED — NOT PHASE 1

Explicitly defer:

```text
Favorites
Save my visit
Email identity
Cross-session visitor memory
Return visit
Artist profiles
Frame / mount / material
Documents
QR
Shop
Membership
Donations
Advanced multilingual model
Accessible route calculation
Personalised recommendations
```

These remain valid roadmap items, but they are not capability recovery. Mixing them into Phase 1 would prevent clean QA of the capabilities the Museum already owns.

---

# 14. PRODUCT PRINCIPLE FROZEN FOR PHASE 1

```text
WORLD GRAPH
+
CANONICAL CONTENT
+
WORLD STATE
+
EXPERIENCE CONFIG
        ↓
MAP
PROGRESS
SEEN / PENDING
PROGRAMME
ACCESSIBILITY
PHYSICAL DIMENSIONS
```

One truth should produce many visitor and authoring representations.

**Phase 1 succeeds when the Museum looks more capable because we expose what it already knows — not because we bolt seven disconnected products onto it.**
