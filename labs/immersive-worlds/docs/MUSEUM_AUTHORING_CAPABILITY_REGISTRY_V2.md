# MUSEUM AUTHORING CAPABILITY REGISTRY V2

Status: Phase 2 closure candidate — human visual approval pending  
Project: Escaparates Pro / Immersive Worlds / Museum  
Branch: `chatgpt/museum-phase2-capability-expansion`  
Base: Phase 1 SHA `22bc5d33ef7a721e2168df63bb774c0934184eac`  
Authority: Juanma = Product Owner / Visual Authority / Merge Authority

## Purpose

This V2 supersedes V1 as the canonical capability map for Museum authoring after Phase 2. V1 remains the historical Phase 1 registry. Every capability must state where it lives, why it lives there, its source of truth, runtime effect, validation route and non-duplication rule.

Permanent closure rule: **code + documentation + automated QA + human navigable audit**. No capability is phase-complete merely because it renders.

## Full Museum Studio — Phase 2

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
│   ├── Recorridos y ritmo existentes
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

## Global contract — preview navigation

**State model:** AUTHORING ↔ PREVIEW_MAP / PREVIEW_VISITOR.  
**Entry:** authoring action.  
**Exit:** persistent `← Volver al Studio`.  
**Restored context:** domain, selected entity, expanded capability state and authoring scroll.  
**QA contract:** `ENTER → USE → EXIT → RESUME`; browser Back is secondary, never the primary product navigation.  
**Do not regress:** preview must never destroy the Studio or require browser navigation to recover it.

## Global contract — workspace layout

`Contenido` and `Experiencia` are authoring workspaces, not narrow secondary lists. On desktop they receive an expanded editorial column while preserving a meaningful live preview. All controls must satisfy `scrollWidth <= clientWidth`, with no horizontal clipping or hidden fields. Visitor P2 capabilities use summary-first progressive disclosure.

## P2-01 — Artist Profiles

**Domain:** Contenido.  
**Authoring:** reusable artist record with name, nationality, biography, portrait URL and website.  
**Artwork connection:** `Construir → Obra → Autor y documentación → Perfil de artista`.  
**Runtime:** linked artwork detail renders artist profile, portrait when supplied, biography, website and related works.  
**Source of truth:** `config.artists[]` + `config.entities[entityId].artistId`.  
**Do not duplicate:** creator strings may remain inherited catalogue text, but reusable profile truth lives in `artists[]`.

## P2-02 — Physical Presentation

**Domain:** Construir → Obra.  
**Fields:** frame, mount, material, finish, glass, passepartout, plinth/pedestal, mounting height.  
**Source of truth:** `config.entities[entityId].presentation`.  
**Why here:** physical presentation is artwork-specific installation truth.  
**Do not move:** not Visitor and not Media; dimensions remain a separate physical truth.

## P2-03 — Documents

**Domain:** Contenido → Documentos; contextual linking in Construir → Obra.  
**Source of truth:** `config.documents[]` + entity document references.  
**Runtime:** linked document titles/URLs are exposed from the artwork visitor detail.  
**Do not duplicate:** Resources may expose a document destination but must not clone document content.

## P2-04 — Advanced Multilingual Model

**Domain:** Contenido → Idiomas; summary in Visitante → Idiomas.  
**Source of truth:** `config.languages.defaultLocale`, `locales[]`, `translations`.  
**UX hardening:** completeness matrix measures title, description, transcript and accessibility coverage per locale. Adding a locale alone does not make it complete.  
**Do not duplicate:** translations remain one canonical multilingual model across artwork, accessibility and visitor surfaces.

## P2-05 — Visitor Memory

**Domain:** Visitor Runtime + Visitante → Mi visita · memoria.  
**Capabilities:** Favorites, Save my visit, Email identity foundation, cross-session memory, return visit.  
**Source of truth:** visitor-local `iw.museum.visitor.memory.v1`, deliberately separate from authored project Schema 3.  
**Current authority:** same-browser cross-session memory only. Cross-device recovery/backend identity is not claimed.  
**Do not duplicate:** viewed/favorite/save/return signals are one memory system.

## P2-06 — Resources + QR

**Domain:** Visitante → Recursos / QR.  
**Source of truth:** canonical resource URL/destination. QR is a representation, never the content owner.  
**Current prototype:** external QR renderer may be used for visual preview; release requires first-party/local encoding.  
**Do not duplicate:** no second CMS behind QR.

## P2-07 — Room Accessibility Data + Accessible Routes

**Authoring:** Construir → Sala → Accesibilidad de la sala.  
**Room semantics:** step-free, lift, accessible WC, seating, quiet space.  
**Experience:** Experiencia → Ruta accesible.  
**Route source of truth:** existing WorldGraph + `config.rooms[roomId].accessibility`.  
**Do not duplicate:** one graph only. Route calculation consumes declared room semantics; it may not invent accessibility properties.

## P2-08 — Shop

**Domain:** Visitante → Tienda.  
**Phase 2 authority:** enable/label/external destination only.  
**Not claimed:** inventory, SKU, cart or checkout.  
**Do not invent:** commerce readiness means a real destination exists, not that Museum owns commerce infrastructure.

## P2-09 — Membership + Donations

**Domain:** Visitante → Apoya al museo.  
**Phase 2 authority:** membership and donation enablement + destinations.  
**Not claimed:** internal payment processing or membership CRM.

## P2-10 — Personalised Recommendations Foundation

**Domain:** Experiencia → Personalización; runtime consumption.  
**Signals:** viewed works, favorites, creator and medium.  
**Current authority:** deterministic recommendation foundation.  
**Not claimed:** AI recommender, cross-user profiling or opaque ranking.  
**Do not duplicate:** recommendations consume Visitor Memory + canonical artwork metadata.

## P2-11 — Publish Readiness + Schema 3

**Domain:** Publicar.  
**Readiness surfaces:** content, accessibility, language, visitor, commerce, export/publish.  
**Canonical project truth:** Schema 3.  
**Round-trip contract:** `EDIT → SAVE → EXPORT/SERIALISE → RELOAD/IMPORT → SAME SEMANTICS`.  
**Visitor memory exclusion:** visitor-local memory does not belong in project export.

## Phase 2 closure gates

1. Phase 1 regression remains green.
2. Content workspace: no horizontal clipping at desktop audit viewport.
3. Experience workspace: no horizontal clipping at desktop audit viewport.
4. Visitor P2 cards: collapsed summary-first default + explicit expansion.
5. Artist → artwork → runtime profile connection works.
6. Document → entity → visitor connection works.
7. Multilingual completeness matrix renders from canonical language data.
8. Room accessibility data influences accessible-route calculation.
9. Favorite is a genuine clickable runtime control and persists cross-session locally.
10. Orientation and Visitor previews both satisfy `ENTER → USE → EXIT → RESUME`.
11. Schema 3 round-trip remains green.
12. Human visual audit by Juanma is required before Phase 2 can be frozen or merged.

## Governance

PR #58 remains DRAFT until Juanma gives explicit visual approval. No merge to `main/master/stable` is permitted without that approval. A Vercel preview tied to the exact audited branch/SHA is the canonical human-review surface; proxy renderers such as RawGitHack are not part of the release workflow.