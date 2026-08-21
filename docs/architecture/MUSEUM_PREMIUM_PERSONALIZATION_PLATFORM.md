# MUSEUM / GALLERY PREMIUM PERSONALIZATION PLATFORM

## Status

Product vision and future integration contract for the Museum / Gallery vertical inside Escaparates Pro.

This document is intentionally **architecture/product documentation only**. It must not interfere with the active Museum transition workstream until a later explicit implementation mandate is approved.

## Core product decision

Museum is not a one-off virtual exhibition.

It is a **premium, reusable, highly configurable immersive-experience platform** for museums, galleries, foundations, exhibitions, fairs, cultural institutions, campaigns and premium presentations.

The platform must preserve the same level of cinematic, spatial, visual and narrative care even when client content changes.

```text
PERSONALIZABLE
≠
GENERIC
```

```text
EVERY EXPERIENCE MAY BE PERSONALIZED.
THE QUALITY BAR IS NOT CONFIGURABLE.
```

```text
AUTHORING SHOULD EXPAND EXPRESSION,
NOT EXPOSE ENGINE COMPLEXITY.
```

## Product architecture

```text
ESCAPARATES PRO
        ↓
IMMERSIVE WORLDS ENGINE
        ↓
MUSEUM / GALLERY SCENE KIT
        ↓
AUTHORING + PERSONALIZATION LAYER
        ↓
CLIENT EXPERIENCE PACKAGE
        ↓
PUBLISHED PREMIUM EXPERIENCE
```

The engine should remain reusable. A second museum should be created primarily by configuration and content, not by rebuilding the engine.

## First-party reuse rule

Escaparates Pro already contains owned first-party work that may provide a strong base for the authoring panel and other art/immersive capabilities.

Before designing or implementing a new panel:

```text
AUDIT EXISTING FIRST-PARTY PANEL(S)
→ IDENTIFY STRONG CAPABILITIES
→ CLONE / INSPECT SAFELY
→ REUSE / EXTRACT / ADAPT
→ IMPLEMENT ONLY THE MISSING GAPS
```

Do not create a competing CMS/authoring system from zero when a strong owned base already exists.

The same rule applies to other owned art projects that may contain valuable capabilities.

## Premium personalization scope

### 1. Institution identity

Configurable:

- museum / gallery / foundation / institution name;
- logo and logo variants;
- exhibition name and subtitle;
- claim / institutional description;
- colors;
- typography;
- visual identity tokens;
- sponsors / partners / patrons;
- credits;
- favicon / share identity.

Identity may appear through curated supports such as entrance, menus, signage, information panels, pause/overview UI and closing moments. It must not become arbitrary visual clutter.

### 2. Exhibition and programme information

Configurable:

- exhibition title;
- artists;
- curator;
- dates;
- venue;
- opening hours;
- ticket / reservation information;
- programme;
- guided visits;
- talks;
- workshops;
- temporary events;
- contact;
- location / directions;
- accessibility information.

Potential visitor actions:

- reserve;
- buy ticket;
- see programme;
- add to calendar;
- contact institution;
- navigate to physical venue.

### 3. Room / scene configuration

The authoring layer should operate in domain language, not engine language.

Client-facing concepts should include:

```text
EXHIBITION
ROOM
ARTWORK
LABEL
PROJECTION
SCULPTURE
LIGHT
TOUR
GUIDE
PROGRAMME
```

The client should not need to understand cameras, shaders, scene graphs or low-level runtime state.

### 4. Artwork media personalization

Artwork supports should allow curated replacement/configuration of:

- image;
- video;
- potentially other approved media types later;
- crop / fit / presentation mode where appropriate;
- poster frame / fallback;
- captions and credits.

The platform should preserve scale, framing, legibility and spatial quality automatically or through constrained presets.

### 5. Artwork information / labels / interpretation

Each artwork may support configurable content such as:

- title;
- artist;
- year;
- medium;
- dimensions;
- collection / provenance when appropriate;
- short label;
- long curatorial text;
- image;
- video;
- audio;
- interview;
- process material;
- related works;
- sources / references;
- accessibility description.

Labels and interpretation may use text, image or video depending on the support.

### 6. Lighting

The authoring system should support premium lighting controls without exposing raw engine complexity.

At minimum:

- light on/off where the scene supports it;
- curated lighting presets;
- intensity ranges;
- exhibition mood / room state;
- potentially artwork emphasis states.

Lighting controls must remain inside tested visual/safety bounds so a client cannot destroy the intended visual quality.

### 7. Specialized room / exhibit types

The product must support more than flat wall artworks.

Known target examples include:

#### Gallery / artwork room

- image/video artworks;
- labels;
- guided/explore interaction;
- lighting.

#### Projection room

- projection content;
- video / moving image;
- projection state and playback;
- environmental light/ambience controls;
- authored interpretation.

#### Sculpture / installation room

- 3D object / sculpture;
- inspection/orbit experience;
- materials where authorized;
- installation elements;
- cloth/fabric capability where the scene requires it;
- related media / interpretation.

Future scene kits should follow the same platform model rather than become one-off apps.

## AI institutional guide

A future high-value layer is an **Institutional AI Guide**, not merely a generic chatbot.

Potential knowledge layers:

```text
GENERAL ART KNOWLEDGE
+
INSTITUTION KNOWLEDGE
+
EXHIBITION KNOWLEDGE
+
ARTIST KNOWLEDGE
+
CURATORIAL KNOWLEDGE
+
INSTITUTIONAL ARCHIVE
+
CURRENT VISITOR CONTEXT
```

The guide should be able to know, when authorized:

- current room;
- current artwork / object;
- current tour beat;
- previously visited works;
- visitor language;
- selected tour mode;
- visitor interests / requested depth.

Example questions:

- What should I notice here?
- Why is this work next to the previous one?
- What is the relationship between these two works?
- Explain this in 30 seconds.
- Go deeper.
- Explain it for a child.
- Give me the academic version.

Possible guide modes:

- curator;
- art historian;
- friendly guide;
- educator;
- children/family guide;
- expert/research mode;
- artist/curatorial voice when rights and source material allow it.

Critical requirement: the guide needs provenance, claim boundaries and institutional knowledge controls. It must not invent museum-specific facts.

## Multilingual / accessibility layer

Potential configuration:

- interface language;
- artwork text language;
- subtitles;
- transcripts;
- guide language;
- audio-guide language;
- high contrast;
- text size;
- reduced motion;
- keyboard navigation;
- audio description;
- simplified-language content where provided.

## Tours and visitor modes

Potential configurable experiences:

- highlights;
- 15-minute visit;
- 30-minute visit;
- full tour;
- curator's tour;
- artist's tour;
- families;
- students;
- expert/research;
- accessible tour;
- thematic routes.

Future AI-generated routes may be considered after deterministic authored tours are robust.

## Visitor value and commercial layers

Potential high-value modules:

### Booking / conversion

- reserve visit;
- buy tickets;
- private viewing request;
- contact gallery;
- request dossier;
- request price / availability where appropriate.

### Commerce

- catalogue;
- books;
- poster / print;
- museum shop;
- gallery enquiry.

### Social / deep links

- share artwork;
- share exhibition;
- deep link to room/artwork;
- social share card;
- campaign landing directly into a specific experience state.

### Visitor memory

- save artwork;
- favourites;
- personal visit summary;
- continue later;
- share saved selection.

### Analytics

Potential client metrics:

- visits;
- session duration;
- room visits;
- artwork dwell time;
- most viewed works;
- tour completion;
- route paths;
- guide questions;
- languages;
- CTA clicks;
- reservations;
- shares;
- abandonment points.

Analytics must respect privacy and the future platform's legal/data model.

## Experience Package concept

A museum/exhibition should eventually be describable as an Experience Package rather than bespoke code.

```text
EXPERIENCE PACKAGE

01 IDENTITY
02 INSTITUTION
03 EXHIBITION
04 ROOMS
05 COLLECTION
06 ARTWORK MEDIA
07 LABELS / INTERPRETATION
08 LIGHTING
09 PROJECTION
10 SCULPTURE / INSTALLATION
11 TOURS
12 AI GUIDE KNOWLEDGE
13 PROGRAMME
14 VISITOR INFO
15 BOOKING / CTA
16 COMMERCE
17 ACCESSIBILITY
18 LANGUAGES
19 ANALYTICS
20 SOCIAL / SHARE
```

## Quality-control principle

Personalization must be constrained by a premium design and experience system.

Examples:

- client selects from curated transition/behavior policies rather than arbitrary camera math;
- client uses tested label/support layouts rather than unrestricted placement;
- uploaded media is validated for resolution/aspect/format/readiness;
- lighting uses safe ranges/presets;
- scene-kit rules protect spatial composition;
- accessibility and reduced-motion behavior remain first-class;
- authoring cannot silently break the published experience.

```text
CLIENT CONTROLS
        ↓
CURATED CONFIGURATION
        ↓
DESIGN SYSTEM + EXPERIENCE RULES
        ↓
IMMERSIVE ENGINE
        ↓
PREMIUM RESULT
```

## Product quality test

A critical platform question for every future feature:

> **Can a second museum use this capability without changing the engine?**

If the answer is no, determine whether the capability belongs to:

- the engine;
- a reusable Scene Kit;
- a reusable authoring component;
- or truly client-specific content.

Do not solve client variability by accumulating bespoke engine branches.

## Parallel-work boundary

This product/authoring track may be researched and designed in parallel while the active Museum engine work continues.

Parallel work may:

- audit existing first-party panels/projects;
- map reusable capabilities;
- design information architecture;
- define schemas/contracts;
- define client-facing controls;
- design AI Guide architecture;
- propose premium UX and commercial modules;
- prepare future mandates.

Parallel work must **not**:

- modify the active Museum transition implementation;
- change frozen framing/baselines;
- begin portal Block 2B;
- create a competing runtime engine;
- implement unapproved authoring into the active branch.

Integration happens later through an explicit approved mandate.

## Current product principle

The Museum vertical exists inside Escaparates Pro because the goal is not a single exhibition.

The goal is a reusable premium platform capable of producing many distinct, institution-specific immersive experiences while preserving a consistently high quality bar.
