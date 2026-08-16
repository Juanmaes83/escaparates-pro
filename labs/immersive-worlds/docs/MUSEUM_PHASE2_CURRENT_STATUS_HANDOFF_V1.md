# MUSEUM PHASE 2 — CURRENT STATUS HANDOFF V1

Date: 2026-08-16  
Purpose: synchronize any ChatGPT / Claude / Codex / Kimi window that still believes Museum is before the Full Museum Studio work.  
Repository: `Juanmaes83/escaparates-pro`  
Module: `labs/immersive-worlds/`  
Working branch: `chatgpt/museum-phase2-capability-expansion`  
PR: `#58 Museum Phase 2 — capability systems expansion`  
Base: `chatgpt/museum-visitor-phase1`  
Governance: PR remains DRAFT. No merge to main/master/stable without Juanma's explicit visual approval.

## IMPORTANT — DO NOT USE THE OLD STATUS LIST

The following old list is **obsolete** if it marks these capabilities as missing:

```text
❌ Panel
❌ Full Museum Studio
❌ Visitor
❌ personalización
❌ Visual Calendar
❌ Programme
❌ Maps
❌ Seen / Not Seen
❌ Artwork dimensions UI
❌ Accessibility expansion
❌ Artist profiles
❌ Shop
❌ QR
❌ documentos
```

Most of those capabilities now exist. The correct state is below.

## CURRENT FULL MUSEUM STUDIO

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
│   ├── Medios / cartelas existentes
│   ├── Artistas
│   ├── Documentos
│   └── Idiomas + matriz de completitud
│
├── EXPERIENCIA
│   ├── Recorridos / ritmo existentes
│   ├── Ruta accesible
│   └── Personalización / recomendaciones
│
├── VISITANTE
│   ├── Planificación
│   ├── Agenda
│   ├── Orientación
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

## STATUS OF THE OLD "MISSING" ITEMS

### ✅ Panel / Full Museum Studio
Exists. The project has a real authoring Studio with the five canonical domains: Construir, Contenido, Experiencia, Visitante and Publicar.

### ✅ Visitor
Exists as a first-class Studio domain. Phase 1 created the visitor capability architecture; Phase 2 expanded it with memory, resources/QR, languages, shop and support.

### 🟡 Personalización
Exists as **Personalised Recommendations Foundation** in Experiencia and runtime. It is deterministic and consumes viewed/favorite/creator/medium signals. It is **not claimed as a full AI recommender** yet.

### ✅ Visual Calendar
Exists in Visitante → Planificación. Weekly schedule/calendar authoring is present.

### ✅ Programme
Exists in Visitante → Agenda as the programme editor.

### ✅ Maps
Exists through the existing canonical runtime/HUD map and Visitante → Orientación preview. There is deliberately **no second duplicate map**.

### ✅ Seen / Not Seen
Exists and uses canonical visitor/runtime state rather than a parallel CMS.

### ✅ Artwork dimensions UI
Exists in `CONSTRUIR → Sala → Obra → Medidas físicas`. It was explicitly kept in Builder because it is artwork truth, not Visitor configuration.

### ✅ Accessibility expansion
Exists at multiple correct semantic levels:
- institution visitor accessibility;
- artwork accessibility;
- room accessibility semantics;
- accessible-route calculation using the existing WorldGraph.

### ✅ Artist profiles
Exists in Contenido → Artistas. Artwork can link to a reusable artist profile. Phase 2 hardening connects artist → artwork → visitor runtime, including biography, portrait URL, website and related works.

### 🟡 Shop
Exists as a visitor capability with enablement/label/external destination. It is **not** an internal SKU/inventory/cart/checkout engine.

### 🟡 QR
Exists in Visitante → Recursos / QR. Canonical destination URL is the truth and QR is only a representation. Current visual QR preview may use an external renderer; first-party/local QR encoding is still required before production release.

### ✅ Documents
Exists as reusable `config.documents[]`, with contextual artwork linking and visitor runtime exposure for linked document titles/URLs.

## OTHER CAPABILITIES ALREADY ADDED IN PHASE 2

### ✅ Reversible preview navigation
Authoring no longer destroys itself when entering preview. Both Orientation and Visitor previews use:

```text
ENTER → USE → EXIT → RESUME
```

with persistent `← Volver al Studio` and restoration of domain/context.

### ✅ Schema 3 canonical project persistence
Phase 2 moves authored project truth into Schema 3 and provides a round-trip contract:

```text
EDIT → SAVE → EXPORT/SERIALISE → RELOAD/IMPORT → SAME SEMANTICS
```

Visitor memory remains deliberately separate from authored project export.

### ✅ Physical presentation
Artwork authoring now includes frame, mount, material, finish, glass, passepartout, plinth/pedestal and mounting height.

### ✅ Visitor Memory foundation
One memory system covers:
- viewed works;
- favorites;
- save-my-visit foundation;
- email identity foundation;
- same-browser cross-session memory;
- return visit state.

### ✅ Advanced multilingual foundation
Canonical language model plus a completeness matrix measuring title, description, transcript and accessibility coverage by locale.

### ✅ Accessible Route foundation
Uses existing WorldGraph plus declared room accessibility semantics. No duplicate route graph.

### ✅ Membership + Donations foundation
Visitor support capability can expose membership and donation destinations.

### ✅ Publish readiness workspace
Publicar now contains readiness surfaces for content, accessibility, languages, visitor, commerce and export/publish rather than being only a placeholder.

## INTEGRATION & UX HARDENING ALREADY IMPLEMENTED

The current branch also contains the Phase 2 closure hardening pass:

1. Content Workspace v2 — expanded editorial width and no intentional horizontal clipping.
2. Experience Workspace v2 — same model.
3. Visitor compact capability mode — summary first, `Personalizar más` to expand new P2 systems.
4. Artist → Artwork → Runtime connection.
5. Document → Entity → Visitor connection.
6. Multilingual completeness matrix.
7. Room accessibility data feeding accessible routes.
8. Favorite interaction hardening.
9. ENTER → USE → EXIT → RESUME contract for previews.
10. Registry V2 + human audit gate.

## WHAT IS STILL NOT COMPLETE / MUST NOT BE OVERCLAIMED

### 1. Phase 2 human closure
**Still pending.** Juanma must perform the final navigable human audit before Phase 2 is frozen or merged.

### 2. Current automated Phase 2 QA
Phase 1 regression is green. The latest Phase 2 Playwright run reached Experiencia and timed out while checking `requireSeating`; the log shows the checkbox became `checked` and the click completed before the harness waited until the global timeout. Treat this as a likely **headless/harness interaction issue requiring quick manual confirmation**, not as proof that the product control is broken. Do not merge until the manual audit confirms it.

### 3. Cross-device Visitor identity
Not implemented. Current cross-session memory is same-browser/local storage. There is no backend identity/recovery system yet.

### 4. Real Save-my-visit email recovery
Foundation exists, but no production email delivery + cross-device recovery flow is claimed.

### 5. QR production encoding
First-party/local QR generation is still required. External QR rendering is prototype-level only.

### 6. Full commerce
Shop is an external-destination capability only. No internal inventory, cart or checkout.

### 7. Full membership / donation infrastructure
Destinations and enablement exist. No internal payment processing or membership CRM is claimed.

### 8. Full AI personalization
Current recommendation system is deterministic foundation only. No opaque AI recommender or cross-user profiling is claimed.

### 9. Production-grade multilingual authoring depth
Canonical model + completeness matrix exist. Do not claim a fully mature translation-management product beyond the authoring surfaces currently implemented and audited.

### 10. Production release / merge
Not done. PR #58 remains DRAFT and isolated. Juanma retains final visual and merge authority.

## CANONICAL DOCUMENTS TO READ FIRST

1. `labs/immersive-worlds/docs/MUSEUM_AUTHORING_CAPABILITY_REGISTRY_V2.md`
2. `labs/immersive-worlds/docs/MUSEUM_PHASE2_CURRENT_STATUS_HANDOFF_V1.md`
3. `labs/immersive-worlds/docs/MUSEUM_VISITOR_PHASE1_RECOVERY_PLAN_V1.md`
4. `labs/immersive-worlds/docs/MUSEUM_VISITOR_BASELINE_V1.md`
5. `labs/immersive-worlds/docs/CHATGPT_SCHEDULED_TASKS_AUTOMATION_MONITORING_OS_V1.md`

## MESSAGE FOR ANY OTHER MUSEUM WINDOW / AGENT

> Do not restart Museum from the old missing-capability list. We are currently in `Juanmaes83/escaparates-pro`, module `labs/immersive-worlds/`, branch `chatgpt/museum-phase2-capability-expansion`, PR #58 DRAFT. Full Museum Studio already exists with Construir, Contenido, Experiencia, Visitante and Publicar. Visual Calendar, Programme, Orientation/Map, Seen/Not Seen, Artwork Dimensions, accessibility expansion, Artist Profiles, Documents, QR/resources, Shop foundation, visitor memory and personalization foundation are already implemented. The current task is **Phase 2 closure and human audit**, not rebuilding those systems. Respect the Capability Registry V2, extend before duplicating, use one semantic truth for multiple representations, and never merge without Juanma's explicit visual approval.

## PRODUCT PRINCIPLE

```text
RECOVER BEFORE INVENT
EXTEND BEFORE DUPLICATE
ONE SEMANTIC TRUTH → MULTIPLE REPRESENTATIONS
AUTOMATE OBSERVATION, NOT JUANMA'S AUTHORITY
```
