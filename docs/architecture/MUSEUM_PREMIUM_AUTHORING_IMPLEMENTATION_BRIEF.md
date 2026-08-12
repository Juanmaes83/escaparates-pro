# MUSEUM PREMIUM AUTHORING — IMPLEMENTATION BRIEF

## Status

**Pre-implementation product + architecture contract.**  
**Scope:** Museum / Gallery vertical inside Escaparates Pro.  
**Purpose:** give Claude / Codex / future implementation agents the product context, target architecture, visual intent, constraints, validation model and handoff expectations **before implementation begins**.  
**This document does not, by itself, authorize implementation or merge.**

This brief must be read together with:

- `/.claude/skills/safe-autonomous-engineering/SKILL.md` — global HOW agents work;
- `/AGENTS.md`;
- `/CLAUDE.md`;
- `/docs/architecture/SAFE_AUTONOMOUS_ENGINEERING_GOVERNANCE.md`;
- `/docs/architecture/MUSEUM_PREMIUM_PERSONALIZATION_PLATFORM.md` — product vision;
- the current Museum / Immersive Worlds module contracts, protected baselines, roadmap and active mandate.

Inheritance model:

```text
GLOBAL SAFE AUTONOMOUS ENGINEERING
        ↓
MUSEUM / IMMERSIVE WORLDS CONTRACTS
        ↓
THIS AUTHORING PRODUCT BRIEF
        ↓
CURRENT IMPLEMENTATION MANDATE
```

If instructions conflict, stop at the smallest real conflict and report it. A current explicit Juanma mandate has final product authority. No merge or canonical promotion is implied by technical success.

---

# 1. NORTH STAR

Museum is **not** a one-off virtual exhibition and the authoring panel is **not** a generic CMS.

We are building a premium authoring layer over a reusable immersive-world platform so that museums, galleries, foundations, temporary exhibitions, installations, fairs, cultural institutions and premium presentation clients can create highly customized experiences **without rebuilding the engine**.

Canonical principles:

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

```text
ONE ENGINE.
MANY PREMIUM EXPERIENCES.
```

Critical platform test:

> **Can a second museum use this capability without changing the engine?**

If not, determine whether the missing abstraction belongs to the reusable engine, a Scene Kit, a reusable authoring component, or truly client-specific content. Do not solve client variability by accumulating bespoke engine branches.

---

# 2. PRODUCT ARCHITECTURE

Target mental model:

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

A more operational view:

```text
IMMERSIVE WORLDS ENGINE
        ↓
EXPERIENCE CONFIGURATION LAYER
        ↓
CUSTOM CLIENT / MUSEUM DATA
        ↓
PUBLISHED EXPERIENCE
```

The engine owns reusable runtime capabilities.  
The Scene Kit owns museum/gallery spatial grammar and approved presentation systems.  
The authoring layer exposes client-facing domain concepts and constrained controls.  
The Experience Package stores institution/exhibition-specific configuration and content.  
The published experience consumes those layers without becoming a bespoke fork.

---

# 3. VISUAL REFERENCES — WHAT THEY MEAN

Two approved support images accompany this document:

## Visual Reference A — System Blueprint

Purpose:

- explain architecture;
- explain product layers;
- explain the five authoring domains;
- explain hierarchy/content model;
- explain behaviors/interactions;
- explain AI Guide;
- explain validation;
- explain lifecycle/versioning;
- explain personalization and scalability.

## Visual Reference B — Real Authoring UI

Purpose:

- explain interaction model;
- explain workspace hierarchy;
- explain the live-preview philosophy;
- explain relationship between navigation, experience tree, editor, media and validation;
- show how the product should feel as a professional authoring tool.

These images are **visual guidance, not pixel-perfect implementation specifications**.

Preserve from them:

- hierarchy;
- product logic;
- workspaces;
- live-preview model;
- editor relationships;
- validation philosophy;
- architecture;
- premium clarity;
- domain language.

Do **not** blindly copy:

- exact layout;
- exact spacing;
- exact colors;
- exact component dimensions;
- decorative styling;
- fictitious example content;
- any visual decision that conflicts with the real first-party panel, current Museum architecture or usability evidence.

The final UI may differ substantially if a better solution preserves the intended product behavior and premium quality.

Suggested repository destinations once the image files are available:

```text
docs/visuals/museum-authoring/
  system-blueprint-v1.png
  authoring-ui-reference-v1.png
```

Until those binaries are actually present, do not claim they are stored in GitHub.

---

# 4. FIRST-PARTY REUSE IS MANDATORY BEFORE REBUILDING

Escaparates Pro already contains owned first-party authoring/panel work that may provide a strong base. There are also other owned art/immersive projects that may contain reusable capabilities.

Before designing or implementing a competing panel from zero:

```text
AUDIT EXISTING FIRST-PARTY PANEL(S)
→ IDENTIFY STRONG CAPABILITIES
→ INSPECT SAFELY
→ KEEP / EXTRACT / ADAPT
→ IMPLEMENT ONLY REAL GAPS
```

The agent must explicitly produce a reuse matrix:

```text
CAPABILITY
SOURCE
KEEP
ADAPT
EXTRACT
REPLACE
DO NOT USE
RATIONALE
INTEGRATION RISK
```

Direct reuse is preferred when authorized and technically sound. Source identity must not contaminate the target product.

```text
SOURCE PROJECT ≠ TARGET PRODUCT
```

Do not modify canonical donor repositories directly. Inspect read-only; clone/worktree/isolated branch when experimentation or modification is required.

---

# 5. CLIENT-FACING DOMAIN LANGUAGE

The panel should expose museum/product concepts, not low-level engine implementation.

Preferred client-facing vocabulary includes:

```text
INSTITUTION
EXHIBITION / EXPERIENCE
ROOM / SPACE
COLLECTION
ARTWORK
LABEL / CARTELA
INTERPRETATION
MEDIA
LIGHT
PROJECTION
INSTALLATION / SCULPTURE
TOUR
GUIDE
PROGRAMME
VISITOR INFO
BOOKING / CTA
PUBLISHING
```

The client should not need to understand raw scene graphs, camera math, shaders, low-level render state, engine internals or arbitrary transform systems.

Advanced controls may exist later, but the default product surface must remain curated and safe.

---

# 6. INFORMATION ARCHITECTURE — FIVE WORKSPACES

To avoid a flat menu with dozens of unrelated items, organize the panel around five high-level workspaces.

## BUILD

- Institution;
- Exhibition / Experience;
- Spaces / Rooms;
- Collection / Entities;
- Installations;
- spatial configuration;
- Scene Kits / Templates where appropriate.

## CONTENT

- Artwork Data;
- Media Library;
- Labels / Cartelas;
- Curatorial Interpretation;
- Documents;
- Rights / Sources / Metadata.

## EXPERIENCE

- Lighting;
- Projection;
- Behaviors / Interactions;
- Tours;
- Guided / Free Exploration;
- Audio.

## VISITOR

- Visitor Info;
- Programme;
- AI Guide;
- Languages;
- Accessibility;
- future visitor memory/personalization where approved.

## PUBLISH

- Validation;
- Rights / Sources;
- Preview;
- Booking / CTA;
- Commerce / Tickets where relevant;
- Analytics;
- Publishing;
- deployment/lifecycle state.

The exact navigation can evolve after audit/usability review. The domain separation is more important than copying a visual menu.

---

# 7. HIERARCHY / CONTENT MODEL

Do not collapse institution, exhibition, room and artwork into one flat data model.

Target conceptual hierarchy:

```text
ORGANIZATION / INSTITUTION
└── PROJECT / EXPERIENCE
    └── EXHIBITION
        ├── WORLDS / SPACES
        │   └── ROOMS
        │       └── SPATIAL INSTANCES
        ├── COLLECTION / SEMANTIC ENTITIES
        ├── TOURS
        ├── PROGRAMME
        └── PUBLISHING CONFIGURATION
```

Critical invariant:

```text
SEMANTIC ENTITY
≠
SPATIAL INSTANCE
```

One artwork record may be referenced by:

- one or more room placements;
- tours;
- collection views;
- interpretation panels;
- AI Guide knowledge;
- deep links;
- campaigns;
- later exhibitions.

Do not duplicate canonical content merely because it appears in multiple contexts.

```text
ONE SEMANTIC RECORD
→ MANY AUTHORIZED REFERENCES / PRESENTATIONS
```

---

# 8. LIVE PREVIEW IS CENTRAL

The authoring experience should be built around the principle:

> **The client configures the experience and sees the experience.**

The central preview should represent the real Museum runtime or a faithful authoring-safe preview path, not an unrelated static mock.

Desired authoring relationship:

```text
SELECT ENTITY / ROOM / EXPERIENCE STATE
        ↓
EDIT APPROVED PROPERTIES
        ↓
LIVE OR FAST PREVIEW UPDATE
        ↓
VALIDATE
        ↓
PREVIEW AS VISITOR
```

Preview scopes should eventually include, where supported:

- Explore;
- Guided;
- Desktop;
- Mobile;
- Kiosk;
- Reduced Motion;
- specialized room modes.

Do not create a second divergent rendering truth merely for the editor.

---

# 9. EXPERIENCE TREE / NAVIGATION MODEL

A strong candidate UI model is an Experience Tree that makes the real hierarchy visible.

Example:

```text
Institution
└── Exhibition
    ├── Room 01
    │   ├── Architecture
    │   ├── Artworks
    │   └── Installations
    ├── Room 02
    │   ├── Artworks
    │   └── Lighting
    ├── Projection Room
    │   ├── Projection
    │   └── Interpretation
    └── Sculpture / Installation Room
        ├── Sculpture
        ├── Cloth / Installation
        └── Lighting
```

The tree must not become a raw engine scene graph. It is a domain-oriented editorial/spatial model.

---

# 10. CORE PERSONALIZATION SCOPE

The platform should eventually support configuration of:

## Institution / exhibition identity

- museum / gallery / foundation / institution name;
- exhibition title/subtitle;
- logo and variants;
- claim;
- institutional description;
- colors;
- typography;
- visual identity tokens;
- sponsors / partners / patrons;
- credits;
- favicon/share identity.

## Visitor information

- opening hours;
- address/location;
- accessibility information;
- contact;
- tickets;
- reservations;
- guided visits;
- programme;
- workshops;
- talks;
- events;
- calendar/deep links where approved.

Identity and visitor information should appear through curated supports, not arbitrary clutter.

---

# 11. ARTWORK EDITOR

The Artwork Editor is a first-class module.

## Identity

- title;
- artist;
- year;
- technique/medium;
- dimensions;
- collection/provenance where appropriate;
- inventory/reference identifiers where required.

## Media

Supported/target media includes:

- image;
- video;
- audio where relevant;
- approved future types.

Media properties may include:

- asset reference;
- thumbnail/poster;
- crop/fit;
- focal point;
- credits;
- source;
- rights;
- usage;
- readiness/optimization state.

Video-specific controls may include, where the Scene Kit allows:

- autoplay policy;
- loop;
- muted/audio mode;
- poster;
- start/end;
- play on proximity/focus;
- pause/stop on exit.

Do not expose controls the runtime cannot honor safely.

## Interpretation

Separate concepts:

```text
ARTWORK DATA
CURATORIAL CONTENT
LABEL / CARTELA
INTERACTIVE / EXTENDED CONTENT
```

Potential fields:

- short label;
- long curatorial text;
- historical context;
- process material;
- related works;
- image/video/audio supplements;
- interview;
- sources/references.

## Presentation

- room;
- wall/support/anchor;
- approved presentation mode;
- support type;
- approved scale/framing/preset choices where appropriate.

## Accessibility

- alt text;
- long description;
- transcript;
- subtitles where relevant;
- simplified-language variant where provided.

## AI Guide linkage

- knowledge status;
- related topics;
- approved source references;
- visibility to guide;
- persona/depth behavior where appropriate.

---

# 12. MEDIA LIBRARY

Media Library should be treated as a reusable asset system, not a loose upload folder.

Target concepts:

- Image;
- Video;
- Audio;
- Documents;
- Logos;
- Metadata;
- Rights;
- Collections;
- Source;
- Usage.

Important future/professional concerns:

- search;
- tags;
- folders/collections;
- dimensions;
- duration;
- file size;
- format/codec;
- derivatives;
- thumbnail/poster;
- crop/focal point;
- optimization/transcoding readiness;
- alt text;
- copyright/licence;
- expiry/territory where needed;
- usage graph;
- replacing a master asset without manually breaking every reference.

Canonical model:

```text
ONE ASSET
→ MANY REFERENCES
```

Do not duplicate media binaries merely because the same asset appears in multiple authored contexts.

---

# 13. LIGHTING EDITOR

Lighting is a premium experiential capability, not a raw developer console.

Target authoring concepts:

```text
GLOBAL
ROOM
ARTWORK / FEATURE
PRESET
STATE
```

At minimum, where the runtime supports it:

- on/off;
- curated presets;
- intensity ranges;
- mood/room state;
- artwork emphasis;
- transition duration.

Potential later controls when validated:

- temperature;
- color;
- spot width;
- direction;
- shadow policy;
- day/night or programme states.

Safe authoring rule:

```text
CLIENT CAN PERSONALIZE LIGHT
WITHOUT BEING ABLE TO DESTROY
THE PREMIUM VISUAL BASELINE.
```

Use constrained ranges/presets and validation rather than arbitrary freedom.

---

# 14. PROJECTION EDITOR — FIRST-CLASS CAPABILITY

Projection is not merely another media upload. The projection room needs a specialized editor connected to the real Projection / Video Mapping capability.

Target concepts may include:

- projection surface;
- source media image/video;
- playback state;
- fit/presentation;
- perspective mapping;
- mask;
- opacity;
- blend;
- brightness/integration;
- approved visual effects;
- audio;
- trigger/schedule;
- fallback/poster;
- preview.

Preserve the architecture rule that Projection/Video Mapping remains its own capability and is not collapsed into unrelated engines.

Existing first-party projection/media authoring work should be audited and reused where appropriate before rebuilding.

---

# 15. SCULPTURE / INSTALLATION / CLOTH EDITOR

The sculpture/installation room should use a specialized model rather than pretending a 3D installation is a wall painting.

Potential authoring domains:

- object/sculpture;
- material or approved appearance preset;
- placement/support;
- inspection/orbit behavior;
- installation elements;
- cloth/fabric capability where the scene requires it;
- light relationship;
- media/interpretation;
- accessibility;
- guide knowledge.

Do not expose arbitrary low-level physics or material controls by default.

---

# 16. BEHAVIORS / INTERACTIONS

A high-value reusable layer is a constrained event → action system.

Potential triggers:

```text
ON ENTER
ON APPROACH
ON FOCUS
ON CLICK
ON TOUR BEAT
ON EXIT
```

Potential actions:

```text
PLAY MEDIA
SHOW PANEL
START / STOP PROJECTION
CHANGE LIGHT STATE
PLAY / STOP AUDIO
OPEN DETAIL
NAVIGATE / REQUEST TRANSITION
ASK / OPEN AI GUIDE
```

This is not permission to expose unrestricted scripting to normal users.

Behavior authoring must compose with the Experience Director, Scene Kit contracts and runtime authority model rather than create a second control system.

---

# 17. TOURS / GUIDED AUTHORING

Tours must respect the Museum semantic model:

```text
STOP ≠ BEAT ≠ TRANSITION ≠ PORTAL ≠ FOCUS ≠ BROWSE
```

A Tour Editor may eventually support:

- route/stop order;
- beats;
- narration/interpretation;
- artwork focus;
- duration;
- guide presence;
- approved transition family/policy;
- skip/optional content rules;
- preview.

Avoid requiring normal users to author raw camera coordinates. Framing and camera behavior should remain governed by approved semantic/spatial contracts.

---

# 18. AI GUIDE — PROFESSIONAL INSTITUTIONAL GUIDE

The AI Guide is a high-value product layer, not a generic chatbot dropped into the experience.

Knowledge stack:

```text
GENERAL ART KNOWLEDGE
+
INSTITUTIONAL KNOWLEDGE
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

Potential personas/modes:

- Curator;
- Art Historian;
- Friendly Guide;
- Children / Family;
- Educator;
- Expert / Research;
- Artist / Curatorial voice only when rights/source material allow it.

The guide may eventually receive authorized context such as:

- current room;
- current artwork;
- current tour beat;
- previously visited works;
- visitor language;
- selected tour mode;
- requested depth/interests.

Critical governance requirements:

- source/provenance visibility;
- institution-specific claim boundaries;
- unknown-answer behavior;
- curator/institution approval state;
- no invented museum-specific facts;
- separation of general knowledge from institution-authoritative knowledge.

Do not implement the AI Guide before its data/provenance contract is approved.

---

# 19. VERSIONING / LIFECYCLE

A professional authoring system must distinguish content lifecycle states.

Target conceptual lifecycle:

```text
DRAFT
→ REVIEW
→ PUBLISHED
→ ARCHIVED
```

Capabilities may include later:

- autosave;
- last published version;
- revision history;
- rollback;
- duplicate experience;
- preview/staging;
- publish history.

Published truth must not silently mutate because an editor changed a draft.

---

# 20. VALIDATION CENTER

`Validate` must be a product-quality gate, not a decorative button.

Potential validations include:

- missing required content;
- missing media;
- broken asset references;
- unsupported/poor media readiness;
- rights/provenance gaps;
- missing translations;
- accessibility gaps;
- invalid labels/interpretation requirements;
- broken CTA/deep link;
- projection without valid source/surface;
- installation configuration gaps;
- tour beat without target;
- unreachable/invalid authored state;
- AI Guide knowledge without required provenance;
- publish blockers;
- performance-budget warnings where measurable.

Useful severity model:

```text
ERROR
WARNING
SUGGESTION
```

Validation should derive from product truth/contracts where practical rather than duplicate hard-coded assumptions.

---

# 21. SAFE AUTHORING — NON-NEGOTIABLE

The authoring panel is powerful, but it must not expose the ability to destroy core runtime quality.

Client/editor may configure authorized:

- content;
- media;
- labels;
- visitor information;
- identity;
- tours within grammar;
- behaviors within grammar;
- lighting within tested bounds;
- projection within supported contracts;
- installation options exposed by the Scene Kit.

Client/editor must not silently break:

- camera authority;
- world state contracts;
- transition/portal authority;
- protected baselines;
- scene containment;
- accessibility minimums;
- performance budgets;
- rights/provenance requirements;
- published-version integrity.

Canonical model:

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

---

# 22. IMPLEMENTATION STRATEGY — CONTROLLED AUTONOMY

Implementation must follow Safe Autonomous Engineering.

## Phase 0 — Preflight + audit

Before writing code:

- verify repo / branch / HEAD / status;
- classify SOURCE vs WORKSPACE;
- read current Museum contracts and active state;
- audit first-party panel(s);
- audit first-party media/projection/art capabilities relevant to this mandate;
- map existing engine/Scene Kit interfaces;
- identify what must **not** be touched;
- define rollback point;
- produce KEEP / ADAPT / EXTRACT / DO NOT USE matrix;
- identify gaps;
- propose integration seam.

**Human gate:** no broad implementation until the audit/architecture proposal is reviewed and approved when the mandate defines that gate.

## Phase 1 — Foundation / vertical slice

Prove the integration with the smallest meaningful end-to-end slice.

A strong candidate slice is:

```text
EXISTING MUSEUM EXPERIENCE
→ AUTHORING PANEL
→ SELECT ONE ARTWORK
→ CHANGE APPROVED CONTENT / MEDIA REFERENCE
→ LIVE PREVIEW
→ VALIDATE
→ SAVE DRAFT
→ VERIFY RUNTIME RESULT
```

The exact slice must respect the approved mandate and current runtime contracts.

Do not generalize until the vertical slice proves:

- data ownership;
- preview correctness;
- runtime handoff;
- rollback;
- validation;
- visual quality;
- no protected-baseline regression.

## Phase 2 — Generalize by domains

After the vertical slice passes, expand incrementally into approved domains such as:

- artwork/media;
- cartelas/interpretation;
- identity;
- lighting;
- projection;
- tours;
- installation/sculpture;
- visitor info;
- publish/validation.

Do not activate future modules merely because they are described in this document. Current mandate scope controls implementation.

---

# 23. VALIDATION ECONOMY — DO NOT TURN RIGOR INTO REWORK

Follow the global skill:

```text
PRESERVE VERIFIED EVIDENCE.
RESUME FROM THE LAST TRUSTWORTHY CHECKPOINT.
A FAILURE INVALIDATES ONLY THE EVIDENCE IT CAN REASONABLY AFFECT.
VALIDATION SCOPE SHOULD MATCH CHANGE IMPACT SCOPE.
```

Use:

```text
CHEAP LOCAL CONFIRMATION
→ TARGETED CHECK
→ DEPENDENCY-AWARE REGRESSION
→ APPROPRIATE CLOSURE VALIDATION
```

Do not restart long QA from zero after a late local failure unless the change can genuinely affect prior evidence.

Classify fixes:

```text
LOCAL FIX
→ local + direct dependency checks

SHARED-MECHANISM FIX
→ affected dependents/families + representative hard cases

CORE / BASELINE / CANONICAL CONTRACT FIX
→ broader appropriate revalidation
```

```text
RIGOUR DOES NOT MEAN REPETITION.
RIGOUR MEANS VALIDATING THE RIGHT THINGS
AFTER THE RIGHT CHANGES.
```

---

# 24. VISUAL QA IS REQUIRED

For this product, code/test success is insufficient.

```text
CODE CLAIM ≠ VISUAL TRUTH
TEST GREEN ≠ PRODUCT APPROVAL
```

Each material UI/experience phase should provide deterministic visual evidence appropriate to the change, such as:

- screenshots;
- before/after comparison;
- annotated captures;
- contact sheets;
- preview routes;
- short recordings when motion/interactions are the subject;
- responsive/device views where relevant.

Visual review must answer:

- Is the hierarchy understandable?
- Does it feel premium rather than generic?
- Is the live preview actually useful?
- Can the user understand what they are editing?
- Can the authoring UI expose power without exposing engine complexity?
- Does the resulting Museum experience preserve visual/narrative quality?
- Are empty/error/loading/saved/validation states designed, not accidental?

Technical closure remains separate from Juanma + ChatGPT visual/product approval.

---

# 25. REQUIRED DOCUMENTATION DURING IMPLEMENTATION

Every material phase should record:

- mandate / phase ID;
- objective;
- branch / HEAD / baseline SHA;
- RUN_IDs for material QA;
- first-party sources inspected;
- reused/extracted/adapted capabilities;
- files changed;
- what was deliberately not touched;
- data/contracts introduced or changed;
- checkpoints;
- failures/root causes/fixes;
- targeted QA;
- appropriate closure QA;
- visual evidence;
- rollback;
- limitations;
- failure lessons worth promoting;
- branch health;
- remaining authorized scope;
- next safe step.

Do not create fake lessons. Promote only reusable root-cause knowledge.

---

# 26. HANDOFF CONTRACT

At the defined human gate, the implementation agent must stop and hand off.

Minimum handoff:

1. `MANDATE_ID`;
2. status: `MANDATE_COMPLETE`, `MANDATE_PARTIAL`, `MANDATE_BLOCKED` or `MANDATE_ABORTED`;
3. repository / SOURCE-WORKSPACE-TARGET role;
4. branch + HEAD + baseline SHA;
5. rollback point and method;
6. files changed + git status;
7. implemented capabilities;
8. deliberately not implemented/out-of-scope capabilities;
9. first-party reuse matrix and actual reuse performed;
10. checkpoints reached;
11. QA results + RUN_ID/provenance;
12. visual evidence + preview route;
13. validation-center evidence where relevant;
14. limitations / known gaps;
15. failure ledger / promoted lessons;
16. branch health rating + justification;
17. canonical docs updated yes/no;
18. remaining authorized work;
19. next action;
20. next human decision;
21. explicit `MERGE_PERFORMED: NO`;
22. STOP.

Do not continue through a human gate merely because technical QA is green.

---

# 27. CURRENT BOUNDARIES / DO NOT CONFUSE TRACKS

This authoring initiative is a parallel product track until an explicit implementation mandate integrates it with the active Museum runtime.

Do not use this document as permission to:

- rewrite current Museum camera/framing contracts;
- modify protected Gallery baselines without authorization;
- replace transition language;
- reimplement the portal/world-crossing engine;
- collapse Projection/Video Mapping into unrelated systems;
- create a competing Immersive Worlds engine;
- start AI Guide runtime implementation prematurely;
- merge into stable/canonical branches.

When portal/world crossing integration is authorized, reuse the approved first-party engine rather than rebuilding it from zero.

When projection authoring is implemented, integrate with the existing Projection/Video Mapping capability and first-party authoring work rather than inventing a second incompatible projection engine.

---

# 28. WHAT SUCCESS LOOKS LIKE

The finished authoring product should let a museum team perform high-value changes through domain concepts while the engine preserves technical and experiential quality.

A representative future flow:

```text
CREATE / DUPLICATE EXPERIENCE
        ↓
SET INSTITUTION + EXHIBITION IDENTITY
        ↓
CONFIGURE ROOMS / SCENE KIT
        ↓
ADD / REFERENCE COLLECTION + MEDIA
        ↓
EDIT ARTWORK DATA + CARTELAS + INTERPRETATION
        ↓
CONFIGURE LIGHT / PROJECTION / INSTALLATION
        ↓
AUTHOR TOURS + APPROVED BEHAVIORS
        ↓
LOAD VISITOR INFO / PROGRAMME / LANGUAGES
        ↓
CONFIGURE AI GUIDE KNOWLEDGE WHEN CONTRACT EXISTS
        ↓
PREVIEW EXPLORE + GUIDED
        ↓
VALIDATE
        ↓
REVIEW
        ↓
PUBLISH
```

The client should experience a powerful premium authoring product. The implementation should remain architecturally reusable, evidence-driven, safe, recoverable and maintainable.

---

# 29. IMPLEMENTATION AGENT — REQUIRED FIRST RESPONSE

When a future implementation mandate references this brief, the agent must **not begin coding immediately**.

First:

1. read the global Safe Autonomous Engineering skill and repo entry instructions;
2. read this brief and `MUSEUM_PREMIUM_PERSONALIZATION_PLATFORM.md` completely;
3. read the current Museum/Immersive Worlds contracts and current state;
4. inspect the approved visual references if they are available in the repo/mandate;
5. audit relevant first-party panel(s) and donor capabilities;
6. verify repo/branch/HEAD/status/rollback;
7. identify active protected work and boundaries;
8. produce a concise implementation-readiness report.

The report should state:

```text
CONTEXT UNDERSTOOD
CURRENT BRANCH / HEAD
PROTECTED BASELINE
FIRST-PARTY PANEL(S) FOUND
KEEP / ADAPT / EXTRACT SUMMARY
TARGET INTEGRATION SEAM
PROPOSED VERTICAL SLICE
QA / VISUAL EVIDENCE PLAN
ROLLBACK PLAN
RISKS / BLOCKERS
SCOPE I WILL NOT TOUCH
```

Then obey the human gate defined by the current mandate.

---

# 30. FINAL PRODUCT PRINCIPLE

```text
WE ARE NOT BUILDING A FORM PANEL AROUND A DEMO.

WE ARE BUILDING A PREMIUM AUTHORING SYSTEM
AROUND A REUSABLE IMMERSIVE EXPERIENCE ENGINE.

THE MUSEUM CAN CHANGE.
THE EXHIBITION CAN CHANGE.
THE CONTENT CAN CHANGE.
THE EXPERIENCE CAN BE DEEPLY PERSONALIZED.

THE QUALITY BAR MUST REMAIN.
THE ENGINE MUST REMAIN REUSABLE.
THE AUTHORING SYSTEM MUST MAKE THAT POWER SAFE AND USABLE.
```
