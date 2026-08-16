# MUSEUM PHASE 2 — CAPABILITY EXPANSION V1

**Project:** Escaparates Pro / Immersive Worlds / Museum  
**Branch:** `chatgpt/museum-phase2-capability-expansion`  
**Base:** Phase 1 approved implementation SHA `22bc5d33ef7a721e2168df63bb774c0934184eac`  
**Authority:** Juanma = Product Owner / Visual Authority / Merge Authority  
**Status:** IMPLEMENTED FOR HUMAN QA — DO NOT MERGE

## 0. Governing rule

Phase 2 does not add fifteen independent widgets. It adds six capability systems over shared canonical data.

```text
CAPABILITY
→ exact domain
→ one source of truth
→ authoring representation
→ runtime representation
→ readiness
→ Playwright enter/use/exit/resume
→ human visual audit
```

No phase may close only because code exists.

## 1. Preview Navigation Contract — P2-00

**Problem discovered by human video QA:** `onStart` destroyed Studio, removed `authoring` from the URL and left no product route back.

**New contract:** AUTHORING ↔ PREVIEW is reversible.

```text
STUDIO
  ↕
PREVIEW · ORIENTACIÓN
  ↕
PREVIEW · VISITANTE
```

Preview must expose `← Volver al Studio`, preserve domain, selected entity, open capability sections and scroll context, and keep browser back as a secondary route rather than the primary product navigation.

**DO NOT:** destroy Studio merely to preview visitor mode.

## 2. Canonical Persistence — Schema 3

`experience-config.js` is promoted to schema 3.

Canonical project truth now includes:

- structured weekly schedule;
- institutional accessibility features;
- entity physical dimensions and accessibility;
- physical presentation metadata;
- artists;
- documents;
- languages;
- visitor resources;
- memory capability configuration;
- commerce and support links;
- accessible route preferences;
- recommendation configuration.

The Phase 1 local sidecar remains only as an editor-compatibility bridge and is synchronised into canonical config on save/apply. It is no longer the portable project truth.

Visitor memory is intentionally separate browser state because favorites/visited/return state belong to the visitor, not to the museum project configuration.

## 3. System A — Artwork & Collection Intelligence

### P2-01 Artist Profiles

**Domain:** `Contenido → Artistas`  
**Entity connection:** `Construir → Obra → Autor y documentación`  
**Truth:** `config.artists[]` + `entity.artistId`.

One artist profile may serve many works. Do not duplicate biography/name records per artwork.

### P2-02 Frame / Mount / Material

**Domain:** `Construir → Obra → Presentación física`  
**Truth:** `entity.presentation`.

Fields: frame, mount, material, finish, glass, passepartout, plinth/pedestal, mounting height.

**DO NOT:** merge presentation styling with physical dimensions or media pixels.

### P2-03 Documents

**Domain:** `Contenido → Documentos`  
**Context:** works link to document ids.  
**Truth:** `config.documents[]`.

Documents may represent catalogue, essay, technical sheet, conservation, bibliography, press or archive resources.

## 4. System B — Visitor Memory

Capabilities grouped under one memory model:

- Favorites;
- Save my visit;
- Email identity;
- Cross-session visitor memory;
- Return visit.

**Authoring domain:** `Visitante → Mi visita · memoria`.  
**Runtime truth:** visitor-local memory store `iw.museum.visitor.memory.v1`.

The email is an optional identity key in the prototype. No backend delivery or CRM is invented.

## 5. System C — Resources & QR

**Domain:** `Visitante → Recursos / QR`.

Resource truth is `config.visitor.resources[]` with a durable URL/destination. QR is a representation of that target; it does not own content.

Phase 2 provides QR preview for configured URLs. The preview image uses an external QR rendering endpoint only as a visual prototype dependency; the URL remains the canonical project truth. Production QR encoding must later be first-party/offline before release.

## 6. System D — International & Accessible Museum

### P2-09 Advanced multilingual model

**Primary domain:** `Contenido → Idiomas avanzados`.  
**Visitor summary:** `Visitante → Idiomas`.

Truth: default locale + locale registry + translations keyed by locale and record. Do not clone whole entities per language.

### P2-10 Accessible route calculation

**Domain:** `Experiencia → Ruta accesible`; published status is visible to Visitor.

The calculation reads the existing world portals/rooms plus room accessibility metadata. It does not introduce a second navigation graph.

## 7. System E — Commerce & Relationship

### P2-11 Shop

**Domain:** `Visitante → Tienda`.

Phase 2 authors enablement + external shop URL. It does not invent inventory, stock or internal checkout.

### P2-12 Membership + P2-13 Donations

**Domain:** `Visitante → Apoya al museo`.

Both are institutional relationship actions and therefore grouped. Phase 2 authors enablement + destination URLs.

## 8. System F — Intelligent Experience

### P2-14 Personalised Recommendations Foundation

**Domain:** `Experiencia → Personalización`; runtime output appears in visitor memory context.

Signals: visitor favorites + visited works. Candidate metadata comes from canonical runtime entities. Recommendation state is derived; no duplicate recommendation catalogue is maintained.

This is a deterministic foundation, not an AI black box.

## 9. Full Studio capability map after Phase 2

```text
FULL MUSEUM STUDIO
│
├── CONSTRUIR
│   ├── Institución
│   ├── Exposición
│   ├── Salas
│   └── Obras
│       ├── Identidad
│       ├── Medios
│       ├── Medidas
│       ├── Presentación física          P2-02
│       ├── Autor / documentos           P2-01 / P2-03
│       └── Accesibilidad
│
├── CONTENIDO
│   ├── Obras / cartelas
│   ├── Medios
│   ├── Artistas                         P2-01
│   ├── Documentos                       P2-03
│   └── Idiomas                          P2-09
│
├── EXPERIENCIA
│   ├── Luz / ambiente
│   ├── Proyección
│   ├── Recorridos
│   ├── Ruta accesible                   P2-10
│   └── Personalización                  P2-14
│
├── VISITANTE
│   ├── Planificación                    P1-01
│   ├── Agenda                           P1-02
│   ├── Orientación                      P1-03
│   ├── Mi visita                        P1-04/05
│   ├── Mi visita · memoria              P2-04/05/06
│   ├── Accesibilidad                    P1-07
│   ├── Recursos / QR                    P2-07/08
│   ├── Idiomas                          P2-09
│   ├── Tienda                           P2-11
│   └── Apoya al museo                   P2-12/13
│
└── PUBLICAR
    ├── Content readiness
    ├── Accessibility readiness
    ├── Language readiness
    ├── Visitor readiness
    ├── Commerce readiness
    └── Export / Publish
```

## 10. QA gate

Phase 2 must not be frozen until all are true:

```text
[ ] Phase 1 regression remains green.
[ ] Visitor capability systems render desktop/mobile.
[ ] Preview visitor has a visible return action.
[ ] Return restores the authoring domain/context.
[ ] Builder still owns physical dimensions.
[ ] Presentation physical is contextual to a work.
[ ] Artist/document records are reusable canonical records.
[ ] Accessible route derives from existing portal graph.
[ ] Schema 3 export/import round-trip succeeds.
[ ] Publish readiness is usable and not decorative.
[ ] Visitor favorites/save state survives a browser session boundary.
[ ] No merge occurs before Juanma visual approval.
```

## 11. Permanent QA rule learned from human testing

Every navigable capability must be tested as:

```text
ENTER
→ USE
→ EXIT
→ RESUME
```

A test that proves only `ENTER` is insufficient. Phase 1 proved why: an action can open successfully and still trap the user afterwards.
