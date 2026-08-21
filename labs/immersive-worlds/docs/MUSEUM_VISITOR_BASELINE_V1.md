# MUSEUM VISITOR BASELINE V1

**Project:** Escaparates Pro — Immersive Worlds / Museum  
**Scope:** Full Museum Studio → Visitor layer  
**Repository:** `Juanmaes83/escaparates-pro`  
**Branch:** `claude/immersive-worlds-module-c0d3f7`  
**Status:** HUMAN APPROVED BASELINE — FROZEN FOR COMPARISON  
**Baseline date:** 2026-08-16  

---

## 0. Purpose

This document freezes the current implemented state of the Museum Visitor layer before any new Visitor expansion work begins.

It is not a wishlist and it is not a future specification. It records what the current system already has, where that capability lives, what data is authoritative, what reaches the visitor, and which apparently "new" ideas are in fact partially present already.

Future Visitor work must compare itself against this baseline so that existing capabilities are extended rather than duplicated, replaced, or accidentally broken.

### Frozen baseline domains

1. `CURRENT VISITOR`
2. `EXISTING DATA`
3. `EXISTING UI`
4. `EXISTING WORLD STATE`
5. `EXISTING MAP`
6. `EXISTING PROGRAMME`
7. `EXISTING DIMENSIONS`

### Architectural rule

```text
AUTHORING DATA
      ↓
EXPERIENCE CONFIG
      ↓
RUNTIME / WORLD STATE
      ↓
VISITOR EXPERIENCE
```

The Visitor layer must remain semantic. New capabilities should reuse the existing World Graph, content records, Experience Config and World State whenever they already contain the required truth.

---

# 1. CURRENT VISITOR

## 1.1 Current Studio domain

The Full Museum Studio is organised around five product domains:

```text
CONSTRUIR
CONTENIDO
EXPERIENCIA
VISITANTE
PUBLICAR
```

`VISITANTE` is already an active workspace, not a placeholder.

Current domain metadata:

```text
label: Visitante
hint: Horarios, cómo llegar, programación
areas:
- Información al visitante
- Accesibilidad
- Idiomas
- Guía
```

The main Visitor authoring surface is implemented in:

```text
labs/immersive-worlds/authoring/studio/studio-shell.js
```

The corresponding visitor-facing surface is implemented in:

```text
labs/immersive-worlds/app/ui/hud.js
```

The product model is implemented in:

```text
labs/immersive-worlds/authoring/experience-config.js
```

The semantic visitor runtime state is implemented in:

```text
labs/immersive-worlds/engine/world/world-state.js
```

## 1.2 Current author-facing Visitor sections

The Studio currently exposes:

```text
VISITA
├── Horarios
├── Dirección
├── Entrada
└── Accesibilidad

ACCIONES
├── Comprar entrada
└── Reservar visita

PROGRAMACIÓN
├── Título
├── Tipo
├── Empieza
├── Termina
├── Lugar
├── Reserva
└── Descripción

PERSONALIZAR MÁS · VISITANTE
├── Cómo llegar
├── Mapa o indicaciones
├── Aparcamiento
├── Contacto
└── Notas para el visitante
```

The current design deliberately keeps the first view compact and moves secondary information behind `Personalizar más · Visitante`.

## 1.3 Current visitor-facing information

When Visitor information exists, the Museum HUD can display:

```text
HORARIOS
DIRECCIÓN
ENTRADA
PROGRAMACIÓN
ACCESIBILIDAD
CÓMO LLEGAR
APARCAMIENTO
CONTACTO
MÁS INFORMACIÓN
```

Available visitor actions are:

```text
COMPRAR ENTRADA
RESERVAR VISITA
CÓMO LLEGAR
```

Empty information is not rendered. If no Visitor information has been authored, the Visitor button is hidden.

---

# 2. EXISTING DATA

## 2.1 Current Visitor configuration schema

`experience-config.js` normalises every Visitor configuration into the following current record:

```text
visitor.hours
visitor.address
visitor.accessibility
visitor.admission
visitor.ticketUrl
visitor.bookingUrl
visitor.contact
visitor.transport
visitor.parking
visitor.directionsUrl
visitor.notes
visitor.programme[]
```

This means the panel is not the source of truth. The serialisable Experience Config is the product model.

## 2.2 Programme record

Every current programme item can contain:

```text
id
title
type
description
start
end
location
bookingUrl
accessibilityNote
```

Current programme type vocabulary:

```text
EXHIBITION   → Exposición
GUIDED       → Visita guiada
TALK         → Charla
WORKSHOP     → Taller
PERFORMANCE  → Performance
EVENT        → Actividad
```

## 2.3 Demonstrated second-institution configuration

`museum-b.config.json` proves that the Visitor layer can already vary per institution.

The Museum de la Bruma sample contains its own:

- opening hours;
- address;
- admission conditions;
- accessibility information;
- ticket URL;
- booking URL;
- directions URL;
- transport information;
- parking information;
- contact details;
- visitor notes;
- three programme records.

This is important: Visitor authoring is already part of the client-specific configuration model and must not be rebuilt as museum-specific hard-coded UI.

## 2.4 Existing data that is relevant to future Visitor expansion

The Museum already has semantic content beyond `visitor.*` that future Visitor capabilities can reuse:

```text
INSTITUTION
EXHIBITION
ROOMS / SPACES
ENTITIES / WORKS
ROUTES
WORLD GRAPH
ACCESSIBILITY RECORDS
MEDIA RECORDS
PHYSICAL ENTITY SIZE
WORLD STATE
```

A future Visitor feature should first ask whether its truth already exists in one of those records before adding a new field or subsystem.

---

# 3. EXISTING UI

## 3.1 Authoring UI

The current Full Museum Studio Visitor editor is rendered by:

```text
StudioShell._visitor()
StudioShell._programme()
```

The author writes institutional information. The visitor never sees input fields; the Museum receives the authored semantic record and renders it as visitor information.

This separation is already correct and should remain:

```text
AUTHOR
fills semantic information
        ↓
VISITOR
reads designed information
```

## 3.2 Visitor HUD

The visitor-facing HUD already contains distinct surfaces for:

```text
TOP BAR
DETAIL / ARTWORK LABEL
GUIDED ROUTE TRANSPORT
ROOM MAP
VISIT INFORMATION
ACCESSIBILITY TEXT OUTLINE
```

The Visit panel is a real visitor-facing component, not merely an authoring preview.

Its current grouping is:

```text
KEY VISIT FACTS
├── Horarios
├── Dirección
└── Entrada

PROGRAMACIÓN

PLANIFICAR LA VISITA
├── Accesibilidad
├── Cómo llegar
├── Aparcamiento
├── Contacto
└── Más información

PERSISTENT ACTION BAR
├── Comprar entrada
├── Reservar visita
└── Cómo llegar
```

The CTA bar is pinned to the bottom of the Visit panel so the main action remains available even when the content scrolls.

## 3.3 Existing artwork detail UI

The HUD already shows an artwork/exhibit detail surface containing:

```text
TITLE
CREATOR
YEAR
MEDIUM
DIMENSIONS
DESCRIPTION
IMAGE CREDIT
POSITION WITHIN CURRENT BROWSABLE COLLECTION
PREVIOUS / NEXT
ZOOM
```

Therefore future Artist / Artwork expansion should extend this existing semantic detail grammar rather than create an unrelated second artwork card system.

## 3.4 Existing accessibility UI

The Museum already generates a text accessibility outline from the same canonical Space and Entity records used by the scene.

It includes, per space:

```text
SPACE TITLE
ENTITIES
ENTITY TITLE
CREATOR / YEAR / MEDIUM
DESCRIPTION
TRANSCRIPT WHEN PRESENT
ACCESSIBLE EXIT DESCRIPTIONS
```

This is an important baseline capability. Future accessibility work should deepen this structured system rather than replace it with one free-text Visitor field.

---

# 4. EXISTING WORLD STATE

## 4.1 Authoritative visitor semantic state

`WorldState` already tracks where the visitor is and what they have encountered without storing camera state.

Current state includes:

```text
activeSpaceId
arrivalAnchorId
focusedEntityId
mode
activeRouteId
activeStepId
hotspotStates
visitedEntityIds
visitedSpaceIds
traversedPortalIds
```

## 4.2 Existing visited artwork state

This is a key baseline fact:

```text
visitedEntityIds
```

already exists.

When an Entity is focused, `WorldState.setFocus(entityId)` adds that entity to `visitedEntityIds`.

Therefore the current runtime already knows which entities the visitor has inspected at least once during the current semantic visitor state.

What does **not** yet exist is the complete product layer around that information:

```text
NO dedicated progress UI
NO visible Seen / Not Seen collection state
NO Favorites
NO persistent visitor identity
NO saved visit
NO cross-session return visit
NO email-linked visitor state
```

The distinction is critical:

```text
SEMANTIC OBSERVATION STATE      = EXISTS
PRODUCT EXPERIENCE AROUND IT   = NOT YET IMPLEMENTED
```

## 4.3 Existing visited space state

`visitedSpaceIds` already records the spaces entered by the visitor.

The Map already consumes this state visually.

## 4.4 Existing route state

World State and the Experience runtime already track:

```text
activeRouteId
activeStepId
route progress
current tour stop / order
```

This provides an existing semantic foundation for future route-aware Visitor features.

---

# 5. EXISTING MAP

## 5.1 Current map capability

The Museum already includes an interior `Salas` map.

It is not a manually authored static diagram.

The HUD derives the map from:

```text
WORLD GRAPH
+
SPACE BOUNDS / REAL FLOOR PLAN DATA
+
WORLD STATE
```

## 5.2 Current map information

The map currently represents:

```text
SPACES / ROOMS
CONNECTIONS BETWEEN SPACES
TELEPORT CONNECTIONS
ACTIVE SPACE
VISITED SPACES
```

Space positions are projected from each Space's actual world bounds/origin.

## 5.3 Existing semantic relationship

Current architecture already supports this principle:

```text
WORLD GRAPH
      ↓
INTERIOR VISITOR MAP
```

Therefore a future Map V2 should evolve this existing representation instead of introducing a manually maintained second map truth.

## 5.4 Current limitations

The current map does not yet provide a full museum visitor-navigation product.

Not currently present as dedicated capabilities:

```text
ARTWORK POSITIONS ON VISITOR MAP
SEEN / UNSEEN ARTWORK MARKERS
FAVORITE ARTWORK MARKERS
SERVICE POIs (WC, lift, café, shop, cloakroom, etc.)
ACCESSIBLE ROUTE MODE
ROUTE PLANNING
OUTDOOR / GOOGLE MAP EMBED
NEARBY POINTS OF INTEREST
PERSISTED VISIT PROGRESS
```

Those are future expansions, not current baseline capabilities.

---

# 6. EXISTING PROGRAMME

## 6.1 Current programme architecture

Programme is already modelled as a list of records, not numbered form fields.

This is the correct foundation for future calendar work.

Current author workflow:

```text
PROGRAMACIÓN
      ↓
AÑADIR ACTIVIDAD
      ↓
PROGRAMME RECORD
```

An author can add and remove activities.

## 6.2 Current editable programme information

```text
Título
Tipo
Empieza
Termina
Lugar
Reserva
Descripción
```

The data model also supports:

```text
accessibilityNote
```

although it is not currently exposed as a first-class field in the Full Studio Visitor programme editor.

## 6.3 Current visitor programme UI

Programme entries appear inside the Visit panel with:

```text
TITLE
TYPE
START / END
LOCATION
DESCRIPTION
RESERVATION LINK WHEN PRESENT
```

## 6.4 Current limitations

The current programme is semantic but not yet a real visual calendar system.

Not currently present:

```text
VISUAL CALENDAR
DATE PICKER / TIME PICKER AUTHORING
OPEN / CLOSED DAY RULES
SPECIAL OPENINGS
HOLIDAYS
RECURRENCE RULES
CAPACITY
PRICE PER EVENT
EVENT IMAGE
EVENT ARTIST RELATION
CALENDAR FILTERS
DAY / WEEK / MONTH VISITOR VIEW
ADD TO CALENDAR
```

The existing programme records should be evolved into those capabilities; they should not be abandoned in favour of a separate calendar database unless a future architectural decision explicitly requires it.

---

# 7. EXISTING DIMENSIONS

## 7.1 Existing physical dimensions

The canonical World Entity model already carries physical size.

The thin V1 Authoring layer exposes:

```text
size.0 → Ancho (m)
size.1 → Alto (m)
```

The visitor-facing artwork detail already renders Entity size as centimetres.

Therefore physical dimensions are an existing Museum capability.

## 7.2 Current Full Studio gap

The important gap is not the absence of dimensions from the Museum engine.

The gap is that physical dimensions are not yet surfaced as a complete authoring capability in the Full Museum Studio workflow.

Future work should expose the existing semantic truth cleanly in the modern Studio.

## 7.3 Recommended semantic boundary for future expansion

The current baseline strongly supports keeping two concepts separate:

```text
PHYSICAL DIMENSIONS
= semantic / real-world truth

VISUAL REPRESENTATION
= how that truth is presented by the Scene Kit
```

Future physical metadata can evolve toward:

```text
width
height
depth
unit
```

Future representation may separately support:

```text
frame
mount
material
passepartout
glass
support / texture
```

These future fields are **not part of this baseline**. They are recorded here only to protect the boundary: presentation choices must not overwrite the artwork's physical truth.

---

# 8. BASELINE CAPABILITY MATRIX

| Capability | Baseline status | Current authority / surface |
|---|---|---|
| Opening hours | EXISTS | `visitor.hours` |
| Address | EXISTS | `visitor.address` |
| Admission | EXISTS | `visitor.admission` |
| Accessibility visitor note | EXISTS | `visitor.accessibility` |
| Ticket link | EXISTS | `visitor.ticketUrl` |
| Booking link | EXISTS | `visitor.bookingUrl` |
| Contact | EXISTS | `visitor.contact` |
| Transport | EXISTS | `visitor.transport` |
| Parking | EXISTS | `visitor.parking` |
| Directions link | EXISTS | `visitor.directionsUrl` |
| Visitor notes | EXISTS | `visitor.notes` |
| Programme records | EXISTS | `visitor.programme[]` |
| Visitor Visit panel | EXISTS | `app/ui/hud.js` |
| Persistent Visit CTAs | EXISTS | `app/ui/hud.js` |
| Interior room map | EXISTS | World Graph → HUD |
| Active room marker | EXISTS | World State → Map |
| Visited room state | EXISTS | `visitedSpaceIds` |
| Visited entity state | EXISTS internally | `visitedEntityIds` |
| Artwork dimensions | EXISTS in canonical World | `entity.size` |
| Artwork dimensions in visitor detail | EXISTS | HUD detail |
| Artwork dimensions in Full Studio | PARTIAL / GAP | existing semantic data not fully surfaced |
| Structured accessibility outline | EXISTS | canonical records → HUD |
| Visual calendar | NOT IMPLEMENTED | future |
| Google Maps visual embed | NOT IMPLEMENTED | only directions URL exists |
| Artwork-level map progress | NOT IMPLEMENTED | foundations exist |
| Seen / Not Seen visitor UI | NOT IMPLEMENTED | `visitedEntityIds` foundation exists |
| Favorites | NOT IMPLEMENTED | future |
| Save visit | NOT IMPLEMENTED | future |
| Return visit | NOT IMPLEMENTED | future |
| Visitor identity / email persistence | NOT IMPLEMENTED | future |
| Artist profiles | NOT IMPLEMENTED as dedicated model | future |
| Frame / mount / material authoring | NOT IMPLEMENTED in Full Studio | future |
| Visitor documents | NOT IMPLEMENTED | future |
| QR generation | NOT IMPLEMENTED | future |
| Mini shop | NOT IMPLEMENTED | future |
| Membership | NOT IMPLEMENTED | future |
| Donations | NOT IMPLEMENTED | future |
| Structured multilingual Visitor content | NOT IMPLEMENTED | future |

---

# 9. FROZEN ARCHITECTURAL DECISIONS FROM THIS BASELINE

These are not future feature approvals. They are preservation rules derived from the current implementation.

### 9.1 Do not duplicate semantic truth

If World State already knows that an Entity has been visited, a future `Seen` feature should consume that state rather than create another independent visited-artwork tracker.

### 9.2 Do not create an unrelated interior map system

The existing map derives from World Graph and Space geometry. Future map work should extend this chain unless there is a documented reason to replace it.

### 9.3 Do not collapse physical truth and visual presentation

Real dimensions and display representation are separate concerns.

### 9.4 Do not bypass Experience Config with UI-only Visitor fields

Authoring must remain serialisable and client-specific. A control that cannot survive export/import is not a complete Museum authoring capability.

### 9.5 Authoring data must reach the visitor experience

A Visitor field is not complete merely because it exists in Studio. Its consumer must be defined in the visitor-facing experience.

### 9.6 Preserve the current quiet Visitor UI grammar

The current Museum intentionally avoids turning the experience into a dashboard. Future capabilities should be discoverable and useful without covering the artwork or overwhelming first-time visitors.

---

# 10. CURRENT BASELINE VERDICT

```text
FULL MUSEUM STUDIO
HUMAN VERDICT: KEEP
CURRENT QUALITY: APPROVED BASE

VISITOR
STATUS: BASELINE FROZEN
CURRENT SYSTEM: FUNCTIONAL
PRODUCT EXPANSION: APPROVED TO PLAN
IMPLEMENTATION OF NEW CAPABILITIES: NOT INCLUDED IN THIS DOCUMENT
```

This baseline freezes the Museum Visitor state as of 2026-08-16.

The next document may define the Visitor expansion plan, but it must explicitly classify every proposed capability as one of:

```text
A. EXISTING — expose / improve
B. PARTIAL — connect / complete
C. NEW — design / implement
```

That classification is mandatory before implementation so that the Museum evolves as one coherent platform rather than as a collection of parallel features.
