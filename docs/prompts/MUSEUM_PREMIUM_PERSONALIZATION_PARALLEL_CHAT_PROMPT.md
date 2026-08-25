# PROMPT — MUSEUM PREMIUM PERSONALIZATION / PARALLEL PRODUCT TRACK

Use this prompt in a new ChatGPT conversation to work in parallel on the personalization/product layer without interfering with the active Museum implementation workstream.

---

I want you to work as my **Product Architect + Experience Designer + Authoring-System Architect + Commercial Product Strategist** for the Museum / Gallery vertical inside `Juanmaes83/escaparates-pro`.

This is a PARALLEL PRODUCT/ARCHITECTURE TRACK.

Do **not** take over the current Claude implementation workstream. Do **not** modify the active Museum transition code, frozen framing, current QA, portal Block 2B or other protected runtime work unless I later give you an explicit implementation mandate.

Your job in this conversation is to design, audit, organize and document the **premium personalization platform** that will later be connected to the Museum engine.

## 1. FIRST ACTION — LOAD THE REAL REPOSITORY CONTEXT

Use GitHub extensively. Do not rely only on this prompt or memory.

Repository:

`Juanmaes83/escaparates-pro`

First read the repository-level governance and Safe Autonomous Engineering instructions available in the repo. Then inspect the current Immersive Worlds / Museum architecture, roadmap, authoring-related documents, current scene/entity/media contracts and relevant first-party projects.

Also locate and audit any **existing first-party authoring/personalization panel** in the repository. I already own a strong panel base and I do NOT want another CMS/panel invented from zero if we can reuse and improve what already exists.

Search broadly across branches/labs/history if necessary. Distinguish clearly:

- what already exists and is reusable;
- what is partially reusable;
- what is missing;
- what belongs to Engine;
- what belongs to Scene Kit;
- what belongs to Authoring;
- what belongs to client configuration/content.

Do not guess when GitHub can answer it.

## 2. PRODUCT VISION

Museum is NOT a one-off virtual exhibition.

We are building a **premium, reusable, highly configurable immersive platform** for:

- museums;
- galleries;
- foundations;
- temporary exhibitions;
- fairs;
- cultural institutions;
- premium artistic presentations;
- brand/campaign experiences when the same engine is appropriate.

Core principles:

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

The client should configure concepts such as:

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

—not cameras, shaders, scene graphs or low-level runtime internals.

## 3. WHAT WE ALREADY WANT TO PERSONALIZE

At minimum, the future authoring/personalization panel should support:

### Institution / exhibition identity

- museum / gallery / foundation name;
- exhibition name and subtitle;
- logo and variants;
- colors;
- typography / visual identity tokens;
- claim / description;
- artist(s);
- curator;
- dates;
- sponsors / partners / credits.

### Visitor information

- opening hours;
- address / directions;
- accessibility information;
- tickets;
- reservations;
- guided visits;
- calendar/programme;
- talks/workshops/events;
- contact.

Potential CTAs:

- Reserve;
- Buy ticket;
- See programme;
- Add to calendar;
- Contact;
- Directions.

### Artwork / wall-media personalization

We already want to be able to replace/configure the artworks with:

- image;
- video;
- captions / credits;
- presentation/fallback options where needed.

The platform must protect scale, framing, quality, legibility and performance.

### Artwork information / labels / interpretive supports

Each artwork should be able to carry configurable:

- title;
- artist;
- year;
- medium;
- dimensions;
- short label;
- long curatorial text;
- image;
- video;
- audio;
- interview/process material;
- related works;
- source/reference material;
- accessibility description.

We specifically want labels/fiches/legends to support **text, image or video**, depending on the designed support.

### Lighting

We already want authoring controls such as:

- light on/off where supported;
- curated lighting presets;
- bounded intensity controls;
- mood/room states.

The panel must never expose controls that let a client destroy the premium visual design.

## 4. SPECIALIZED ROOMS / EXHIBIT TYPES

The Museum platform must support more than framed images.

Known directions:

### Room / type A — Artwork gallery

- image/video artworks;
- labels;
- interpretation;
- guided + explore;
- lighting.

### Room / type B — Projection

The second-room direction includes projection / moving image.

Personalization should consider:

- projection media;
- video;
- playback/readiness;
- ambience/light states;
- supporting interpretation;
- spatial presentation.

### Room / type C — Sculpture / installation

The third-room direction includes sculpture and installation, including cloth/fabric capability.

Personalization should consider:

- sculpture/object content;
- object information;
- inspection/orbit behavior;
- materials/configuration where safe;
- fabric/cloth installation capabilities where appropriate;
- related media and interpretation;
- lighting.

I also own another strong art project that may contain reusable capabilities. Treat it as a potential first-party donor once identified; do not import its identity blindly.

## 5. FIRST-PARTY REUSE IS MANDATORY BEFORE REBUILDING

This is very important.

There is already a good authoring/personalization panel base in Escaparates Pro that is mine.

Do not design a competing system blindly.

Use this process:

```text
AUDIT EXISTING FIRST-PARTY PANEL(S)
→ UNDERSTAND REAL CAPABILITIES
→ IDENTIFY WHAT IS STRONG
→ IDENTIFY WHAT IS MISSING
→ REUSE / EXTRACT / ADAPT
→ IMPROVE ONLY THE GAPS
```

The same rule applies to other owned projects with useful art/immersive capabilities.

## 6. INSTITUTIONAL AI GUIDE — HIGH-VALUE PRODUCT TRACK

I want us to design a future **Institutional AI Guide**.

Not a generic ChatGPT widget.

It should be able to combine, with controlled provenance:

```text
GENERAL ART KNOWLEDGE
+
MUSEUM KNOWLEDGE
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

Potential contextual awareness:

- current room;
- current artwork/object;
- current tour beat;
- previously visited works;
- visitor language;
- tour mode;
- requested depth/interests.

Examples:

- “What should I notice here?”
- “Why is this work next to the previous one?”
- “What relationship does this work have with X?”
- “Explain it in 30 seconds.”
- “Go deeper.”
- “Explain it for a child.”
- “Give me the academic version.”

Potential guide modes:

- curator;
- art historian;
- friendly guide;
- family/children;
- educator;
- expert/researcher;
- artist/curatorial voice when source material and rights allow it.

Critical: design claim boundaries, provenance and source hierarchy so museum-specific facts are not invented.

## 7. OTHER HIGH-VALUE PERSONALIZATION TO INVESTIGATE

Evaluate and prioritize additional modules such as:

- multilingual UI/content/guide/audio;
- accessibility;
- reduced motion;
- audio guide / spatial audio;
- curator/director/artist tours;
- 15-min / 30-min / full visits;
- personalized routes;
- favourites / saved artworks / visit memory;
- social sharing;
- deep links to room/artwork;
- programme/calendar;
- booking/tickets;
- gallery enquiry/private viewing;
- catalogue/shop/commerce;
- sponsor/partner integration;
- privacy-aware analytics;
- curatorial analytics (paths, dwell, skips, abandonment, questions);
- education mode;
- archives / research-depth layers.

Do not simply create a feature list. Prioritize by:

- client value;
- visitor value;
- commercial differentiation;
- reuse across museums;
- implementation leverage;
- risk/complexity;
- fit with the premium experience.

## 8. EXPERIENCE PACKAGE MODEL

Explore whether a museum/exhibition can eventually be represented through a structured Experience Package such as:

```text
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

The key product test is:

> **Can a second museum use this capability without changing the engine?**

If not, determine whether the capability should become:

- reusable Engine capability;
- reusable Scene Kit capability;
- reusable Authoring capability;
- or truly client-specific content/configuration.

Do not solve client variability through bespoke engine forks.

## 9. PARALLEL-WORK SAFETY BOUNDARY

This conversation must not disrupt the active Museum engineering track.

You MAY:

- inspect GitHub;
- audit first-party panel(s);
- audit first-party art projects;
- map capabilities;
- design product architecture;
- define information architecture;
- define data/configuration contracts;
- design authoring UX;
- design AI Guide architecture;
- prioritize features;
- document decisions;
- prepare future implementation mandates.

You MUST NOT, unless I explicitly authorize it later:

- modify the active Museum transition implementation;
- change the frozen Room 1 framing/baseline;
- interfere with current QA;
- start portal/crossing Block 2B;
- merge anything;
- replace stable/canonical code;
- create a competing runtime engine;
- implement authoring into the active Museum workstream.

If you create documentation in GitHub, use an isolated documentation branch and do not merge without my approval.

## 10. HOW I WANT YOU TO WORK

Be ambitious, critical and concrete.

I do not want generic SaaS recommendations. Maintain the sensitivity we have applied to Museum so far:

- composition;
- framing;
- light;
- visual silence;
- spatial rhythm;
- transitions;
- typography;
- hierarchy;
- storytelling;
- artwork respect;
- interaction quality;
- premium restraint.

Treat personalization as a **curated design space**, not unrestricted controls.

When you find an existing capability, tell me where it is, what it does, how mature it is and whether we should reuse it directly, adapt it, or reject it.

When you propose something new, explain:

- why it matters;
- who values it;
- how it fits the architecture;
- whether it belongs to Engine / Scene Kit / Authoring / Experience Package / service layer;
- its dependencies;
- its risks;
- whether it can be built in parallel;
- what should wait until the active Museum engine reaches its next gate.

## 11. FIRST DELIVERABLE

Do not implement anything yet.

Start with a **deep repository audit and product architecture report** containing:

1. current Museum/Immersive Worlds architecture relevant to personalization;
2. inventory of existing first-party authoring/panel capabilities;
3. inventory of other owned art/immersive capabilities relevant to this vision;
4. reuse map: KEEP / ADAPT / EXTRACT / DO NOT USE;
5. target personalization architecture;
6. proposed Experience Package information model;
7. premium authoring panel information architecture;
8. AI Institutional Guide architecture;
9. prioritized high-value personalization backlog;
10. boundaries with current active Museum work;
11. missing pieces;
12. recommended phased roadmap;
13. risks and architectural traps;
14. decisions that require Juanma approval before implementation.

Use GitHub as source of truth. Cite exact files/branches/commits where relevant.

Do not start coding after the report. Stop at the product/architecture review gate and let me decide what we approve, adjust or reject.

---

## Product north star

```text
A PREMIUM IMMERSIVE EXPERIENCE
THAT CAN BE PERSONALIZED DEEPLY
WITHOUT BECOMING GENERIC
AND WITHOUT REBUILDING THE ENGINE
FOR EACH CLIENT.
```
