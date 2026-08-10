# Immersive Worlds — Museum / Institutional
## MUSEUM EXPERIENCE GRAFTS

> **Status:** ACTIVE PRODUCT-DIRECTION DOCUMENT
> **Purpose:** make the source-technology graft programme persistent, explicit and readable by future implementation agents.

## 1. Why grafts exist

The current Museum is already a working spatial product.

Do not restart it from another museum template.

The strategy is:

```text
OUR WORKING MUSEUM
→ IDENTIFY A WEAK / PROTOTYPE REPRESENTATION
→ SCULPT IT AWAY
→ FIND A REAL CAPABILITY GAP
→ INSPECT THE STRONGEST AUTHORIZED SOURCE
→ REUSE / PORT / ADAPT / COMPOSE
→ GRAFT INTO EXISTING IW CONTRACTS
→ RUN / LOOK / COMPARE
→ STOP FOR JUANMA + CHATGPT REVIEW
```

Principle:

> **REMOVE WHAT WEAKENS THE EXPERIENCE + PRESERVE WHAT WORKS + GRAFT BETTER CAPABILITIES WHERE THEY EXIST.**

## 2. GRAFT 01 — Projection Experience

Source:

`Juanmaes83/projection-video-mapping-experience`

Current target:

`space.gallery-b`

Product transformation:

```text
VIDEO ON A SCREEN
→ MEDIA AS PROJECTED LIGHT
→ WALL / ROOM / TIME BECOME PART OF THE WORK
```

Why Gallery B:

- already dark-exhibition;
- no daylight;
- low environment response;
- existing guided route reaches it;
- already contained a weak bezelled video representation;
- the new representation can improve an existing capability rather than add clutter.

Current implementation direction:

- `PROJECTION` as first-class Entity kind;
- no frame, bezel or physical panel;
- configurable media and projection parameters;
- architectural light/spill/reflection treatment;
- time-based Guided dwell;
- Guide yields so the work can dominate.

Source-audit conclusion:

The repository's hardcoded CSS `matrix3d` is not a reusable universal mapping engine. Its strongest reusable value is the compositing / authoring vocabulary:

```text
MEDIA INGESTION
PLAYBACK
BLEND
LIGHT SPILL
REFLECTION
PROJECTED TEXT
VISUAL-INTEGRATION CONTROLS
```

Do not infer from this that future spatial mapping is unnecessary. A later authoring system may still need native surface selection, fit, crop, offsets, masks or multi-surface logic.

## 3. GRAFT 02 — Live Two-World Portal Transition

This graft is documented separately because it is a transition-system capability rather than a room-media family.

Read:

`LIVE_TWO_WORLD_PORTAL_TRANSITION_REFERENCE.md`

Primary Museum objective:

```text
Gallery A
→ LIVE VIEW OF Gallery B
→ spectacular crossing
→ Gallery B Projection Experience
```

Do not implement until GRAFT 01 is visually reviewed and Juanma explicitly authorizes it.

## 4. GRAFT 03 — Flexible Media / Kinetic Textile

Source:

`Juanmaes83/BANDEROLAS-DINAMICAS`

Juanma has explicitly stated that this repository is his own work and direct reuse/adaptation is authorized.

Core capability:

```text
AUTHOR INPUT
→ CANVAS / MEDIA TEXTURE
→ DEFORMABLE SURFACE
→ VERLET PHYSICS
→ WIND / GRAVITY / CONSTRAINTS
→ INTERACTION
→ KINETIC MEDIA EXPERIENCE
```

### Source capabilities already established

The working source includes:

- raw WebGL rendering;
- 30×40 particle grid (~1,200 particles);
- Verlet-like integration;
- structural constraints;
- shear / diagonal constraints;
- bend / second-neighbour constraints;
- gravity;
- sinusoidal wind;
- pinned top edge;
- pointer/touch grabbing;
- per-frame normal updates;
- authored text/image/video composited through Canvas2D into a texture;
- dynamic video texture updates;
- export-oriented behaviour.

### Strongest reusable core

The physics solver is plain JavaScript maths and does not fundamentally depend on its source GL renderer.

High-value reuse candidates:

```text
DIRECT REUSE / PORT
- Verlet solver maths
- constraint model
- canvas → texture authoring path

ADAPT
- pointer interaction
- normals / geometry update strategy
- media lifecycle

SCULPT AWAY / REJECT AS MUSEUM OWNERSHIP
- independent WebGL context
- independent camera
- independent matrix library
- source shaders if they duplicate Scene Kit ownership
- banner / evidence-specific metadata fields
- source settings-panel chrome
```

### Architectural rule

Do not create:

```text
MUSEUM WEBGL CONTEXT
+
BANDEROLAS WEBGL CONTEXT
```

The intended graft is:

```text
SOURCE PHYSICS + MEDIA LOGIC
→ EXISTING MUSEUM / THREE.JS RENDERING ENVIRONMENT
```

World State, visitor camera, Experience Director and navigation remain IW-owned.

### Performance risk

The source's full-quality configuration is computationally meaningful: around 1,200 particles, thousands of constraints and 35 relaxation iterations per frame.

This is a **performance question to measure**, not a reason to mutilate the source before testing.

Preferred method:

```text
PORT CORRECT BEHAVIOUR
→ MEASURE
→ IDENTIFY REAL BOTTLENECK
→ OPTIMIZE ONLY WITH EVIDENCE
```

Potential later levers include lower iteration counts, coarser grids, fixed timestep/substep budgets, sleep/offscreen suspension and device-tier policies.

### Room hypothesis

Current strongest low-risk candidate:

`space.archive`

Reasons:

- currently lightest/thinnest content role;
- off the main continuous route via teleport;
- lower regression risk to the validated Gallery A/B journey;
- can evolve toward textile / conservation / material installation language.

Caveat:

Archive ceiling height is only about 3.6 m. The source cloth proportions may require scaling.

Alternative visual candidate:

Gallery A west bay, because the pitched roof reaches substantially higher and offers better vertical air.

**Decision status:** Archive is a strong candidate, NOT LOCKED. The final room decision must be made from visual/spatial evidence when the Flexible Media pass begins.

## 5. Shared authoring discovery

The grafts are also product research for the future Authoring Engine.

Do not build the global panel first.

Current overlap across real experiences suggests a future common content layer around:

```text
MEDIA SOURCE
MEDIA KIND
PLACEMENT / ANCHOR
SCALE
OPACITY
PLAYBACK
TITLE / METADATA
```

Experience-specific controls should remain specific until proven common.

Projection-specific examples:

```text
LIGHT INTENSITY
SPILL
REFLECTION
FEATHER / VIGNETTE
PROJECTED TEXT
```

Flexible-specific examples:

```text
GRID / QUALITY
STIFFNESS
GRAVITY
WIND
PINNING
INTERACTION
```

## 6. Experience grammar

Different experience families must not be forced into an identical artwork cycle.

### Artwork

```text
LEAD
→ ARRIVAL
→ SHARED ATTENTION
→ GUIDE YIELDS
→ FOCUS / ARTWORK DOMINANCE
→ RETURN
```

### Projection

```text
LEAD
→ ARRIVAL / ORIENTATION
→ SHARED ATTENTION
→ GUIDE YIELDS
→ ROOM SETTLES
→ PROJECTION DOMINATES
→ TIME-BASED DWELL
→ CONTINUE
```

### Flexible Media

Possible future grammar:

```text
LEAD / ENTRY
→ SHARED ATTENTION
→ GUIDE YIELDS EARLY
→ MATERIAL MOTION / INTERACTION
→ VISITOR-DRIVEN DWELL
→ CONTINUE
```

These are experience intentions, not permission to create parallel director/state systems.

## 7. Graft order

Current product-owner direction:

```text
GRAFT 01 — PROJECTION
→ REVIEW

GRAFT 02 — LIVE TWO-WORLD PORTAL TRANSITION
→ REVIEW

GRAFT 03 — FLEXIBLE MEDIA
→ REVIEW

AUTHORING EXTRACTION
→ REVIEW
```

The order deliberately composes the Projection room with a stronger arrival transition before adding the heavier physics graft.

## 8. Stop gate

Each graft is a separate material pass.

No automatic continuation.

```text
IMPLEMENT ONE GRAFT
→ VISUAL QA
→ TECH QA
→ EVIDENCE
→ NAVIGABLE PREVIEW
→ JUANMA + CHATGPT
→ KEEP / ADJUST / REJECT
```
