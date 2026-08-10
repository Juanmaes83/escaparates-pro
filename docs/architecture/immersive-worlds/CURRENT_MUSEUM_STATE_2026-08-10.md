# Immersive Worlds — Museum / Institutional
## CURRENT STATE — 2026-08-10

> **Status:** CANONICAL WORKING STATE FOR NEXT IMPLEMENTATION AGENT
> **Authority:** Juanma explicit product decisions + verified branch state
> **Purpose:** prevent chat-only knowledge and documentation drift.

## 1. Product location

```text
ESCAPARATES PRO
└── IMMERSIVE WORLDS
    └── MUSEUM / INSTITUTIONAL
```

Immersive Worlds is a first-level sibling module, not Boards / Casebook V5.
Museum / Institutional is the first proof vertical.

Core product principle:

> **THE EXPERIENCE IS THE INTERFACE.**

The visitor should feel that they entered an exhibition, not that they are operating a 3D application.

## 2. Current validated Museum baseline

The current Museum is a working product baseline, not a disposable prototype.

Validated capabilities include:

- World State shared by Explore and Guided;
- one authoritative visitor camera controller per frame;
- authored Guided journey;
- Guide locomotion, arrival, shared attention and yield;
- Focus / return grammar;
- cross-room continuity;
- Portal semantics separated from Hotspot semantics;
- deterministic review states;
- browser/visual evidence workflow;
- canonical QA previously closed at **46/46 PASS, EXIT 0** before GRAFT 01.

The validated artwork grammar is:

```text
LEAD
→ ARRIVAL
→ SHARED ATTENTION
→ GUIDE YIELDS
→ ARTWORK DOMINATES
→ RETURN
→ NEXT
```

Three artworks were visually validated as three complete cycles.

## 3. Current implementation work

### GRAFT 01 — Projection Experience

**Status:** IMPLEMENTATION IN PROGRESS / AWAITING JUANMA + CHATGPT VISUAL REVIEW.

Primary target:

```text
space.gallery-b
```

Transformation goal:

```text
BEFORE
VIDEO ON A WALL / BEZELLED SCREEN

AFTER
MEDIA → LIGHT → ARCHITECTURAL SURFACE → TIME-BASED ROOM EXPERIENCE
```

Projection is now treated as a first-class `ENTITY_KIND.PROJECTION`, not as an effect bolted onto VIDEO.

Important intent:

- no physical screen, bezel or panel;
- configurable media;
- compositing that reads as projected light;
- Gallery B remains a dark-exhibition room;
- Guide introduces and then yields;
- time-based dwell is allowed to breathe;
- no second WebGL context;
- no competing visitor camera system.

Source technology:

`Juanmaes83/projection-video-mapping-experience`

The source repository was audited. Its strongest reusable value is the compositing / authoring vocabulary, not its hardcoded CSS `matrix3d` perspective trick.

## 4. Next planned material grafts

### GRAFT 02 — Live Two-World Portal Transition

**Product decision:** this is not a separate museum attraction. It is a spectacular spatial-transition capability for moving from one Museum Space/World to another.

Target experience:

```text
SPACE / WORLD A
→ GUIDE + VISITOR ARRIVE AT AUTHORED TRANSITION POINT
→ DESTINATION WORLD B BECOMES VISIBLE THROUGH PORTAL
→ TEMPORARY TRANSITION CAMERA / OFFSCREEN VIEW
→ PERSPECTIVE-CORRECT LIVE PORTAL
→ CROSSING CHOREOGRAPHY
→ WORLD / SPACE B BECOMES ACTIVE
→ NORMAL CAMERA AUTHORITY RESUMES
```

Preferred first proof after Projection review:

```text
Gallery A
→ Live Two-World Portal Transition
→ Gallery B / Projection Experience
```

The reason is experiential composition: the visitor can glimpse the active dark Projection room before crossing into it.

Reference source and technical breakdown are preserved in:

`LIVE_TWO_WORLD_PORTAL_TRANSITION_REFERENCE.md`

### GRAFT 03 — Flexible Media / Kinetic Textile

Source technology:

`Juanmaes83/BANDEROLAS-DINAMICAS`

Target capability:

```text
AUTHOR INPUT
→ IMAGE / VIDEO TEXTURE
→ DEFORMABLE SURFACE
→ PHYSICS / WIND / GRAVITY / INTERACTION
→ KINETIC MEDIA EXPERIENCE
```

Source audit findings already established:

- real reusable Verlet solver;
- structural / shear / bend constraints;
- canvas → texture authoring path;
- pointer interaction;
- source renderer/camera/WebGL context must NOT become a competing Museum renderer.

Current room hypothesis:

`space.archive` is the strongest low-risk candidate, but this remains a **candidate**, not a locked product decision. Gallery A west bay remains a visual fallback because it offers more vertical air.

## 5. Authoring direction

Do not build the global Authoring Engine before real experiences prove their needs.

Current evidence already suggests shared content controls across Artwork / Projection / Flexible Media:

- media source;
- media kind;
- placement / Anchor;
- scale;
- opacity;
- playback;
- title / metadata.

Projection adds experience-specific controls such as light integration / spill / reflection / projected text.
Flexible Media adds physics / motion / interaction controls.

Principle:

```text
REAL EXPERIENCE FIRST
→ OBSERVE REAL AUTHORING NEEDS
→ EXTRACT COMMON CONTROLS
→ BUILD GLOBAL AUTHORING LATER
```

## 6. Experience / Transition Points

Do not create a second spatial-reference system.

Reuse the existing generic `Anchor = WHERE` concept and allow authored intent to emerge from it.

Useful authored intentions include:

- Guide position;
- visitor position;
- Focus viewpoint;
- guided stop;
- listening point;
- transition entry point;
- portal viewpoint;
- destination arrival point;
- Guide destination point.

A visible floor circle is only one possible representation. Semantic point ≠ visible marker.

## 7. Portal direction

Existing invariant remains:

```text
HOTSPOT = trigger / interaction
PORTAL = spatial connection / transition
```

Portal behaviour and visual representation remain separate.

The new Live Two-World mechanism should improve the representation/choreography of selected Portal transitions without creating `PortalSystem2` or a second canonical World State.

## 8. Camera clarification

The product invariant remains:

> **Exactly one authoritative visitor-camera controller per frame.**

A temporary secondary camera used only as an offscreen optical instrument for Portal rendering is compatible with this invariant provided it does not independently control visitor navigation.

Conceptually:

```text
VISITOR CAMERA
= authoritative experience camera

PORTAL / TRANSITION CAMERA
= temporary render instrument during TRANSITION
```

## 9. Quality direction

For the next experimental grafts, Juanma explicitly prefers:

```text
SPECTACULAR
+ COHERENT
+ CONTROLLED
```

over forcing every result toward minimalism.

The system should still avoid incoherent effect spam. Spectacle must reinforce spatial experience, transition, narrative or content.

## 10. Current execution order

```text
CURRENT
GRAFT 01 — Projection Experience
→ JUANMA + CHATGPT VISUAL REVIEW

THEN
GRAFT 02 — Live Two-World Portal Transition
→ REVIEW

THEN
GRAFT 03 — Flexible Media / Kinetic Textile
→ REVIEW

THEN
AUTHORING EXTRACTION
→ shared controls from proven experiences

LATER
World Map / route progress
Sound / narration
Institutional credibility
Global Authoring Panel
Experience Languages
Guided recording / output
Cross-vertical proof
```

Later ordering remains product-owner gated and may be adjusted from visual evidence.

## 11. Non-negotiable workflow

```text
ONE MATERIAL PASS
→ IMPLEMENT
→ RUN
→ SEE IT
→ QA
→ SAVE BEFORE / AFTER
→ NAVIGABLE PREVIEW
→ JUANMA + CHATGPT REVIEW
→ KEEP / ADJUST / REJECT
→ ONLY THEN NEXT PASS
```

No successful test, commit, PR, preview or agent recommendation is merge or next-pass approval.

## 12. Project isolation

This work belongs only to Escaparates Pro / Immersive Worlds / Museum and explicitly authorized source repositories.

Unrelated projects — including Sarah Katerina — must not be read, imported, modified, used as design context or included in commits.
