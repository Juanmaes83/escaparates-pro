# Museum / Institutional — Product Roadmap by Blocks

> **Status:** PRODUCT DIRECTION — CANONICAL WORKING ROADMAP
>
> **Scope:** Escaparates Pro → Immersive Worlds → Museum / Institutional
>
> **Purpose:** define the product path, the objective of each major block, the order of expansion, the visual supervision method, and the stop gates that govern Claude/Fable implementation work.
>
> **Important:** this document defines the **strategic product path**. `NEXT_PASSES_MUSEUM_ROADMAP.md` continues to govern the exact immediate pass sequence. If the two ever appear to conflict, Juanma's latest explicit Product Owner decision is authoritative.

---

## 1. Product objective

Museum / Institutional is the first canonical proof that Immersive Worlds can become a reusable platform for authored spatial experiences rather than a one-off 3D website.

The target is not merely to render rooms and objects. The target is to prove a coherent system capable of:

```text
WORLD ENGINE
+
EXPLORE SYSTEM
+
GUIDED EXPERIENCE
+
FOCUS / COLLECTION BROWSE
+
EXPERIENCE GRAMMARS
+
SPATIAL TRANSITIONS
+
MULTIPLE MEDIA TYPES
+
AUTHORING / PERSONALISATION
+
EXPERIENCE LANGUAGES
+
SOUND / ORIENTATION / PROGRESS
+
PUBLISH / RECORD / OUTPUT
```

The governing experience principle remains:

> **The visitor should not feel that they are using a 3D application. They should feel that they have entered an exhibition.**

The system exists to disappear behind the exhibition.

---

## 2. Current foundation — what already exists

The Museum foundation already proves a significant part of the system:

- navigable world;
- Free Explore;
- Focus;
- Guided Tour;
- Guide choreography;
- visitor figure for contemplation beats;
- Artwork Experience Grammar;
- Collection Browse;
- return to exact Guided origin;
- Projection as a specialised media experience;
- Artwork→Artwork locomotion / transition language;
- deterministic QA;
- visual contact-sheet review method;
- current-vs-historical evidence separation;
- Main Gallery physical content inventory and coverage map.

The Artwork grammar is now understood as:

```text
A — CONTEXT / ARRIVAL
B — SHARED ATTENTION
C — HUMAN CONTEMPLATION
D — PURE ARTWORK POV
    ├─ optional Collection Browse ← →
    └─ exact return to Guided origin

→ TRANSITION TO NEXT ARTWORK
```

What repeats is the **function**, not the literal screenshot.

The product rule is:

> **SAME GRAMMAR + CORRECT UNIQUE SPATIAL INSTANCE.**

Or more simply:

> **EQUIVALENTS, NOT CLONES.**

---

# 3. Mandatory visual operating method

This is now a permanent part of Museum / Institutional development.

For every perceptually significant block or pass, work through:

```text
PRODUCT CONTRACT
+
VISUAL BOARD
+
REFERENCE BOARD / REFERENCE EVIDENCE WHEN RELEVANT
+
IMPLEMENTATION
+
DETERMINISTIC CURRENT-STATE CAPTURES
+
CONTACT SHEET / STORYBOARD / BEFORE-AFTER
+
HUMAN VISUAL REVIEW
+
KEEP / ADJUST / REJECT
```

## 3.1 Visual Board

Juanma + ChatGPT may provide a visual board showing:

- intended sequence;
- desired spatial relationship;
- approved examples;
- missing states;
- comparison between current and target experience;
- hierarchy and rhythm;
- interaction moments;
- transitions;
- content/media relationships.

A Visual Board is not decorative inspiration. It is **product-intent evidence**.

It must be interpreted together with:

1. Juanma's latest explicit decision;
2. approved architecture/invariants;
3. verified current code;
4. current canonical documentation.

It must not be mechanically cloned pixel-for-pixel when the product contract asks for reusable behaviour.

## 3.2 Contact sheets as a visual QA gate

When a family of beats or states must be coherent, compare them visually as a system.

Example for Artwork Grammar:

```text
                 ARTWORK 1      ARTWORK 2      ARTWORK 3

A CONTEXT          [ ]             [ ]             [ ]
B SHARED           [ ]             [ ]             [ ]
C HUMAN            [ ]             [ ]             [ ]
D ARTWORK          [ ]             [ ]             [ ]
```

Two tests are mandatory:

### Vertical coherence

Does each experience read correctly from beginning to end?

```text
A → B → C → D
```

### Horizontal coherence

Does the same function remain recognisable across different spatial instances?

```text
A1 ≈ A2 ≈ A3
B1 ≈ B2 ≈ B3
C1 ≈ C2 ≈ C3
D1 ≈ D2 ≈ D3
```

`≈` means **same function**, not identical pixels.

Similarity is not a defect.

```text
SIMILARITY ≠ DEFECT
AMBIGUITY = DEFECT
WRONG SUBJECT = DEFECT
WRONG SPATIAL INSTANCE = DEFECT
STALE STATE = DEFECT
WRONG NARRATIVE FUNCTION = DEFECT
```

## 3.3 Visual truth rule

```text
CODE CLAIM ≠ VISUAL TRUTH
STATE ASSERTION ≠ VISUAL TRUTH
CAMERA MATH ≠ VISUAL TRUTH
```

State/QA evidence is necessary, but perceptual validation is required.

A successful test suite cannot overrule Juanma's visual decision.

## 3.4 Current vs historical evidence

Never mix current canonical captures with BEFORE / historical defect evidence in the same review surface without explicit labelling.

The main review board must use **CURRENT CANONICAL STATE**.

Historical evidence remains useful for BEFORE/AFTER comparison but must be visually and semantically separated.

---

# 4. BLOCK 1 — Complete Main Gallery as the first canonical room

## Objective

Finish Galería A as the first room that proves the Museum system across multiple artwork scales/orientations and one sculpture.

Current known Galería A content:

### Artwork

- `Horizonte interrumpido` — Guided;
- `División tercera` — Guided;
- `Campo de ceniza` — physically present, Focus + metadata + Collection Browse, not yet Guided;
- `Estudio de figura, IV` — physically present, Focus + metadata + Collection Browse, not yet Guided.

### Sculpture

- `Vasija de arenas` — physically present, pedestal + lighting + metadata + Focus + Collection Browse, not yet Guided.

## Block 1A — Complete Artwork coverage

Integrate:

1. `Campo de ceniza`;
2. `Estudio de figura, IV`.

Use the already-proven Artwork grammar:

```text
A Context / Arrival
B Shared Attention
C Human Contemplation
D Pure Artwork POV
```

The point is not to build new one-off scenes.

The point is to prove that the same grammar scales to:

- a different wall/orientation;
- a different artwork format;
- a smaller artwork;
- different approach geometry;
- different staging constraints.

### Success condition

```text
ARTWORK COVERAGE — MAIN GALLERY
4 / 4 GUIDED
```

without bespoke duplicate systems.

## Block 1B — Sculpture Grammar

Treat `Vasija de arenas` as a different media/experience type.

Do **not** force flat Artwork Focus onto a three-dimensional object as the final experience language.

Canonical conceptual grammar:

```text
A — CONTEXT
B — SHARED ATTENTION
C — HUMAN / SCALE RELATION
D — SPATIAL DETAIL / INSPECTION / ORBIT-LIKE FOCUS
```

`D` does not prescribe a literal continuous orbit. Claude/Fable must choose the strongest solution compatible with the existing architecture, but the visitor must perceive **volume**, not only a frontal object view.

### Collection Browse decision

`Vasija de arenas` may remain in Collection Browse.

Collection Browse represents the **museum collection**, not paintings only.

Long-term rule:

```text
COLLECTION BROWSE
↓
ENTITY TYPE
↓
TYPE-APPROPRIATE FOCUS LANGUAGE
```

not:

```text
ALL ENTITY TYPES
↓
ONE FLAT ARTWORK FOCUS
```

## Block 1 final gate

Galería A becomes the first canonical room when it proves:

- 4/4 artwork coverage;
- sculpture-specific experience;
- Free Explore;
- Guided;
- Focus;
- Collection Browse;
- internal Artwork→Artwork transitions;
- visual grammar coherence;
- deterministic and human-reviewed evidence.

Only then call Galería A **canonical room complete**.

---

# 5. BLOCK 2 — Transition Language + World Transition

## Governing contract

From this block onward:

> **Transitions may change how the camera travels, but never where an approved beat ends.**

The final `position + target + FOV` of an approved destination beat is locked.

If a settled capture changes relative to the approved baseline, transition work has invaded the framing system.

This block is deliberately split into two stages.

---

## BLOCK 2A — Intra-room Transition Language

### Objective

Replace generic camera tweening with a coherent spatial movement language inside the canonical room while preserving every approved endpoint.

Canonical transition families:

```text
T1 — MICRO REFRAMING
T2 — LOCAL WALK
T3 — GALLERY TRAVERSE
T4 — OBJECT ORBIT
T5 — THRESHOLD APPROACH
```

Room-to-room crossing is **not** part of Block 2A.

### Implementation priority

1. `MICRO REFRAMING` — dominant family; twelve of sixteen current internal transitions.
2. `LOCAL WALK` — neighbouring works / nearby zones.
3. `GALLERY TRAVERSE` — long spatial movement across the room.
4. `OBJECT ORBIT` — free-standing sculpture / volume reading.
5. `THRESHOLD APPROACH` — orientation and arrival at the room exit.
6. reduced-motion equivalent that preserves spatial continuity rather than defaulting to teleport.

### Three iron rules

#### Endpoint lock

The destination beat's final:

```text
position
+ target
+ FOV
```

must be exactly the approved endpoint.

#### Path containment

The **entire trajectory** must remain in valid navigable / view space.

Endpoint containment alone is insufficient.

#### No target flip / no corner cutting

Orientation should anticipate the destination coherently instead of sweeping arbitrarily across the room.

When a straight segment intersects architecture, plinths, balaustrades or other protected geometry, use a safe path / authored waypoint strategy rather than clipping through it.

### Recommended acceptance slice

Before scaling across the complete room, prove the language on three representative cases:

```text
1. one simple MICRO REFRAMING
2. Campo de ceniza → Horizonte — difficult GALLERY TRAVERSE
3. Estudio de figura → Vasija de arenas — difficult GALLERY TRAVERSE
```

The two difficult traverses are deliberate acceptance cases because the current straight-line system cuts protected geometry there.

Success means the path improves while endpoint delta remains `0.0000` against the approved beat baseline.

### Behaviours that must survive

- one authoritative camera controller per frame;
- LEAD travel remains synchronised with the guide's walk;
- Director requests intent and does not become the camera writer;
- explicit cut / snap remains a separate verb when intentionally used;
- Collection Browse remains independent and returns to the exact Guided origin;
- reduced motion remains first-class but should preserve orientation and continuity where possible.

### QA gate

Block 2A must prove:

- all approved settled end poses unchanged;
- sampled path containment across the full motion, not only endpoints;
- no target discontinuity / flip above accepted threshold;
- no roll;
- guide/camera arrival synchronisation preserved on accompanied travel;
- Collection Browse and return-to-origin unaffected;
- deterministic evidence;
- transition sequence / storyboard review, not only isolated endpoint screenshots;
- navigable preview and browser/console QA;
- Juanma + ChatGPT human review.

---

## BLOCK 2B — Room-to-room / World Transition

### Objective

Create the major `Space → Space` transition family:

```text
CURRENT SPACE
→ THRESHOLD
→ DESTINATION PREVIEW / DESTINATION PRESENCE
→ TRANSITION CHOREOGRAPHY
→ CROSSING / HANDOFF
→ DESTINATION ACTIVE
```

This may be spectacular.

Quality target:

```text
SPECTACULAR
+
COHERENT
+
CONTROLLED
```

not spectacle that breaks camera authority, World State, continuity or orientation.

### First-party owned implementation already exists

Do **not** approach Block 2B as an unsolved problem.

Museum has a canonical first-party capability source:

```text
MUSEUM_CAPABILITY_SOURCE_INFINITE_WORLDS.md
```

Source project:

```text
Infinite Worlds V1.2.3 — Visual Closure
branch: feat/infinite-worlds-v1-2-2-visual-closure
commit: 453ed40008f838d6187a7e85d93872f7866ad5cb
path: labs/infinite-worlds-brand-expression-v1-2/
```

Infinite Worlds and Museum are different products. The source project is not a reference-only implementation and is not `PATTERNS ONLY`: it is first-party owned code that Museum may directly inspect, copy, extract, port, adapt, compose or refactor where useful.

Before implementing Block 2B, Claude/Fable must inspect the complete canonical source snapshot.

Relevant proven capabilities include:

- live destination rendering via `WebGLRenderTarget`;
- `CameraUtils.frameCorners(...)` perspective matching;
- current/destination camera synchronisation;
- GSAP crossing choreography;
- world / room handoff;
- bidirectional traversal;
- portal shader / appearance layer;
- first-cross warmup / render-target priming;
- spatial/environmental audio behaviours.

### Museum target adaptation

First canonical target:

```text
GALERÍA A ROUTE END
→ TRANSITION ANCHOR A
→ adapt / align with proven crossing entry
→ LIVE DESTINATION ROOM
→ CROSSING
→ proven destination crossing state
→ TRANSITION ANCHOR B
→ GALERÍA B ENTRY
→ normal Museum authority resumes
```

Prefer a stable anchor / spatial-adapter solution for the first integration rather than rewriting the proven crossing mechanism around arbitrary coordinates before one canonical Museum crossing is proven.

### Camera invariant

During normal experience there is one authoritative visitor camera/controller.

During the crossing, `TRANSITION` owns the choreography.

Temporary destination render cameras are allowed as optical instruments for live destination rendering; they do not become competing visitor-navigation authorities.

### Visual method

Block 2B must be reviewed as a moving sequence, not merely as start/end screenshots.

First-cross quality must be compared against later crossings, and destination readiness must be demonstrated before human approval.

---

# 6. BLOCK 3 — New rooms + new experience technologies

## Objective

Expand the Museum beyond one room while proving that Immersive Worlds supports genuinely different experience types.

New rooms should not merely contain more copies of the same wall-artwork pattern.

Each space should demonstrate a meaningful capability.

Candidate families include:

- Projection / time-based media;
- Sculpture;
- Archive / heritage content;
- text-led content;
- audio-led content;
- video;
- spatial media;
- installations;
- flexible surfaces;
- future specialist formats.

The room is not the unit of novelty by itself.

The **experience capability** is.

## Rule

Do not create a new subsystem for every room.

Prefer:

```text
SHARED WORLD / EXPERIENCE CONTRACTS
+
SPECIALISED EXPERIENCE GRAMMARS
+
SCENE-KIT REPRESENTATION
```

---

# 7. BLOCK 4 — Flexible Media / BANDEROLAS

## Objective

Introduce a first-class flexible spatial media family using the strongest reusable capability from the authorised user-owned `BANDEROLAS-DINAMICAS` source where appropriate.

Potential capability shape:

```text
MEDIA ENTITY
→ FLEXIBLE SURFACE
→ IMAGE / VIDEO TEXTURE
→ DEFORMATION
→ SPATIAL PLACEMENT
→ INTERACTION / FOCUS
→ GUIDED EXPERIENCE WHEN AUTHORED
```

This is not merely decorative cloth.

It must become a reusable media capability compatible with:

- World State;
- Focus;
- Guide;
- Route;
- Anchors;
- authoring intent;
- visual QA.

Direct source reuse/adaptation is permitted for user-owned authorised sources, with provenance preserved.

---

# 8. BLOCK 5 — Experience Points / spatial navigation semantics

## Objective

Formalise the spatial semantics already emerging in the system without creating a competing architecture.

Canonical conceptual roles include:

```text
ANCHOR       = WHERE
HOTSPOT      = TRIGGER
ACTION       = WHAT
PORTAL       = SPATIAL CONNECTION
GUIDED STEP  = ORCHESTRATION
```

Experience Points may include:

- guide position;
- visitor position;
- artwork/view focus;
- listening point;
- narration point;
- suggested pause;
- threshold;
- transition entry;
- destination viewpoint;
- exit;
- state-change point.

## Rule

Do not create another anchor system.

Formalise the current one only when actual authoring/experience needs justify it.

---

# 9. BLOCK 6 — Authoring / personalisation layer

## Objective

Turn the proven Museum experience semantics into a thin no-code/low-code authoring layer.

Do not design the panel from imagination.

Extract it from what the completed Museum actually proves is configurable.

Before building Museum media-authoring from scratch, inspect the first-party authoring/media pipelines documented in `MUSEUM_CAPABILITY_SOURCE_INFINITE_WORLDS.md`. Infinite Worlds already proves real IMAGE / VIDEO / LOGO / TEXT loading and application behaviour, video readiness, adaptive support/aspect handling, and an EMPTY → LOADED → SAVED → APPLIED / ERROR state flow. Museum is a different product, so reuse the proven capability rather than the City/Nature product identity.

The future flow may conceptually become:

```text
CREATE WORLD
→ CHOOSE / BUILD SPACE
→ IMPORT / DEFINE COLLECTION
→ PLACE CONTENT
→ ASSIGN EXPERIENCE TYPE
→ DEFINE EXPERIENCE GRAMMAR / POINTS
→ DEFINE ROUTE
→ DEFINE FOCUS / BROWSE
→ DEFINE TRANSITIONS
→ DEFINE SOUND / NARRATION
→ PREVIEW
→ PUBLISH
```

Potential configurable categories include:

- spaces;
- text;
- images;
- video;
- audio;
- collection entities;
- Guide;
- experience points;
- Focus;
- Portal connections;
- Route;
- Experience Language;
- preview/publish settings.

## Core insight already emerging

A Museum entity may already have:

```text
ENTITY
+
GEOMETRY / REPRESENTATION
+
METADATA
+
FOCUS
+
HOTSPOT
+
COLLECTION BROWSE
```

while becoming a Guided experience by adding/configuring:

```text
EXPERIENCE GRAMMAR
+
ANCHORS / VIEWPOINTS
+
ROUTE POSITION
+
STAGING
+
TIMING / CAPTIONS / SOUND INTENT
```

That distinction should inform Authoring.

Do not build a giant generic state editor.

---

# 10. BLOCK 7 — Experience Languages

## Objective

Prove that the same semantic content and experience contracts can support genuinely different authored visual/spatial languages.

Conceptual Museum languages include:

```text
WHITE CUBE
HERITAGE
EDITORIAL
DARK EXHIBITION
CUSTOM BRAND DNA
```

Experience Language is a product/design concept first.

Do not prematurely turn it into a rigid runtime schema before enough completed experiences prove which variables are truly reusable.

The same collection/entity semantics should survive a change in visual language.

---

# 11. BLOCK 8 — Sound + orientation + map + progress

> **This block deliberately merges the former Sound/Narrative/Presence and Map/Progress/Orientation blocks.**

## Objective

Create a coherent layer of spatial awareness, narrative presence and visitor orientation without turning the exhibition into a game HUD.

The experience should answer quietly:

```text
WHERE AM I?
WHAT HAVE I SEEN?
WHAT IS NEXT?
WHAT SHOULD I HEAR HERE?
WHEN SHOULD I PAUSE?
HOW DO I RETURN / CONTINUE?
```

## Sound / presence capabilities

Potential elements include:

- room soundscape;
- zone audio;
- artwork audio;
- Guide voice;
- narration;
- intentional silence;
- transition sound;
- proximity or authored listening points.

## Orientation / map / progress capabilities

Potential elements include:

- current room;
- visited spaces;
- unseen spaces;
- current route position;
- suggested next destination;
- collection progress;
- return / continue cues.

## Invariant

Map and Guided experience share the same World State / route truth.

Do not create a second parallel navigation reality for the map.

## Experience rule

The layer must remain low-noise.

The visitor should feel oriented, not managed by an application dashboard.

---

# 12. BLOCK 9 — Publish / share / record / output

## Objective

Turn Immersive Worlds from an internal authored experience into a deliverable product capability.

Potential outputs include:

```text
PREVIEW
PUBLISH
SHARE
CAPTURE
RECORD EXPERIENCE
EXPORT / PACKAGE WHEN SUPPORTED
```

This block comes after the core experience and authoring semantics are proven.

Do not optimise output workflows before the authored experience itself is stable.

---

# 13. Execution order

The strategic order is:

```text
CURRENT FOUNDATION
↓
BLOCK 1 — COMPLETE MAIN GALLERY
  ├─ 1A remaining Artwork coverage
  └─ 1B Sculpture Grammar
↓
BLOCK 2A — INTRA-ROOM TRANSITION LANGUAGE
  ├─ T1 Micro Reframing
  ├─ T2 Local Walk
  ├─ T3 Gallery Traverse
  ├─ T4 Object Orbit
  └─ T5 Threshold Approach
↓
BLOCK 2B — ROOM-TO-ROOM / WORLD TRANSITION
  └─ adapt owned Infinite Worlds V1.2.3 capabilities
↓
BLOCK 3 — NEW ROOMS + NEW TECHNOLOGIES
↓
BLOCK 4 — FLEXIBLE MEDIA / BANDEROLAS
↓
BLOCK 5 — EXPERIENCE POINTS / SPATIAL SEMANTICS
↓
BLOCK 6 — AUTHORING / PERSONALISATION
↓
BLOCK 7 — EXPERIENCE LANGUAGES
↓
BLOCK 8 — SOUND + ORIENTATION + MAP + PROGRESS
↓
BLOCK 9 — PUBLISH / SHARE / RECORD / OUTPUT
```

This is a **strategic order**, not automatic permission to execute every block.

Every block may contain multiple Product Owner-gated passes.

---

# 14. Mandatory gate between blocks and major passes

No implementation agent may continue automatically because a previous pass is technically green.

Every material pass ends with:

```text
QA
→ CURRENT DETERMINISTIC EVIDENCE
→ BEFORE / AFTER WHEN MATERIAL
→ VISUAL BOARD / CONTACT SHEET WHEN RELEVANT
→ NAVIGABLE PREVIEW
→ JUANMA + CHATGPT REVIEW
→ KEEP / ADJUST / REJECT
→ EXPLICIT NEXT-PASS AUTHORIZATION
```

A preview is not approval.

A commit is not approval.

67/67, 100/100 or any other technical score is not approval.

Only Juanma's explicit decision advances the roadmap.

---

# 15. Reuse doctrine across all blocks

Before inventing a meaningful capability:

```text
UNDERSTAND THE PRODUCT GAP
→ VERIFY WHAT ALREADY EXISTS
→ SEARCH CURRENT SYSTEM + OWNED CAPABILITY SOURCES + REFERENCE LIBRARY
→ IDENTIFY STRONGEST LEGAL FIT
→ REUSE / PORT / ADAPT / COMPOSE WHEN STRONGER
→ INTEGRATE INTO IW CONTRACTS
→ TEST
→ LOOK
→ RECORD PROVENANCE
```

Guiding rule:

> **PRESERVE BEFORE YOU BUILD. REUSE BEFORE YOU CREATE.**

First-party owned product sources are not `PATTERNS ONLY`. When Juanma has established ownership and direct reuse authority, implementation agents may use the actual code directly.

Do not confuse reuse with cloning a screenshot or transplanting another product's identity.

Reuse the strongest mechanism that serves the Museum product contract.

---

# 16. What “Museum V1 complete enough to generalise” should mean

Museum should not be considered a strong platform proof merely because one route works.

The proof becomes materially stronger when it demonstrates, at minimum:

- a complete canonical main room;
- multiple artwork sizes/orientations using one Artwork grammar;
- sculpture-specific experience;
- time-based Projection experience;
- coherent Artwork→Artwork transitions;
- compelling Space→Space transition language;
- more than one room;
- more than one media technology;
- Free Explore + Guided on one World State;
- Focus + Collection Browse with truthful return semantics;
- visual quality supervision through boards/contact sheets;
- emerging authoring semantics grounded in proven capabilities;
- orientation/sound/progress that does not overwhelm the exhibition;
- a path to publish/share/output.

At that point Museum / Institutional is no longer only a demo.

It is a credible first vertical proving the larger Immersive Worlds platform.

---

# 17. Final product principle

```text
THE EXPERIENCE IS THE INTERFACE.
```

Build the platform by completing real experiences, not by constructing abstract systems in advance.

For every block:

```text
UNDERSTAND
→ MAP WHAT EXISTS
→ IDENTIFY THE REAL GAP
→ USE VISUAL EVIDENCE
→ REUSE THE STRONGEST CAPABILITY
→ IMPLEMENT THE SMALLEST STRONG SOLUTION
→ LOOK
→ COMPARE
→ HUMAN REVIEW
→ STOP
```

The goal is not more features.

The goal is a coherent, reusable, authorable spatial-experience system whose technology disappears behind the exhibition.