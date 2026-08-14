# IW-0 — Immersive Worlds Engine Constitution

> **Status:** PROPOSED — REQUIRES EXPLICIT JUANMA REVIEW.  
> **Authority:** Architecture proposal only. This document does **not** authorize runtime implementation, navigation integration, refactors, merges, deletion, or modification of protected baselines.  
> **Repository:** `Juanmaes83/escaparates-pro`  
> **Working branch:** `docs/immersive-worlds-module-context-2026-08-09`  
> **Baseline:** `master` at `bdf4cd77c9a1861447f4edd563a733925203506e` when IW-0 was started.  
> **Date:** 2026-08-09

---

## 0. Purpose

IW-0 defines the proposed contracts, boundaries, vocabulary, quality gates and first vertical scope for **Immersive Worlds**, a new first-level product family inside Escaparates Pro.

IW-0 exists to prevent implementation enthusiasm from deciding architecture by accident.

The implementation rule is:

```text
CONTRACTS
→ REVIEW
→ EXPLICIT APPROVAL
→ VERIFIED LOCAL CHECKOUT
→ ISOLATED IMPLEMENTATION
→ QA
→ NAVIGABLE PREVIEW
→ VISUAL APPROVAL
→ ONLY THEN SHARED INTEGRATION / MERGE
```

No physical package topology, framework migration, monorepo conversion, global dependency decision, or shared Escaparates Pro refactor is approved by IW-0.

---

# 1. Product definition

Immersive Worlds is a system for:

- building semantic spatial worlds;
- placing and connecting content;
- exploring freely;
- directing guided experiences;
- focusing and inspecting entities;
- connecting spaces through portals;
- building routes and chapters;
- synchronizing camera, narration and audio;
- presenting and publishing interactive worlds.

It is **not**:

- Casebook V5;
- a Board skin;
- a collection of unrelated Three.js demos;
- a Unity replacement;
- a generic game engine;
- a universal 3D editor in V1;
- a reason to rewrite working Escaparates Pro modules.

Product model:

```text
IMMERSIVE WORLDS
=
WORLD ENGINE
+
THIN AUTHORING LAYER (V1)
+
EXPLORE SYSTEM
+
EXPERIENCE DIRECTOR
+
SCENE KITS
+
QUALITY SYSTEM
```

Long-term authoring destination: visual no-code / low-code.  
V1 authoring goal: the minimum authoring surface required to prove the semantic model and runtime.

---

# 2. Protected baseline rule

Casebook V1/V2/V3/V4 and existing Escaparates Pro modules are **protected baselines**.

Protected baseline means:

- no silent modification;
- no opportunistic refactor;
- no deletion;
- no migration merely to simplify Immersive Worlds;
- no reuse as mandatory architecture;
- modification is possible only after explicit, informed authorization from Juanma.

Immersive Worlds must be additive and isolated until a shared integration point is explicitly approved.

---

# 3. Product placement

Conceptually, Immersive Worlds is a first-level sibling:

```text
ESCAPARATES PRO
├── Effects
├── Scroll Sections
├── Website Modules
├── Blueprints
├── Source Labs
├── Boards
└── Immersive Worlds
```

**MUST V1:** develop the first Immersive Worlds prototype as an isolated local module.  
**MUST V1:** do not add the category to shared navigation before the isolated prototype is stable and visually approved.  
**SHOULD LATER:** integrate registry/navigation after successful local prototype + QA + Juanma approval.  
**R&D:** cross-family composition between Boards, Website Modules and Immersive Worlds.

---

# 4. Scope taxonomy

Every IW proposal and work package must use one of these labels.

## MUST V1

Required to prove the first Museum / Institutional world and the reusable engine thesis.

## SHOULD LATER

Important product capability deliberately deferred until the V1 proof is stable.

## R&D

Exploratory or future capability. Must not expand the V1 critical path.

If a feature has no scope label, it is **not implementation-authorized**.

---

# 5. Core architectural invariants

## 5.1 Semantic data is not visual representation

The engine models meaning first.

Examples:

```text
ARTWORK
PRODUCT
DOCUMENT
SCULPTURE
VIDEO
AUDIO
PORTAL
HOTSPOT
ACTION
ANCHOR
ROUTE
SHOT
```

A Scene Kit chooses visual representation.

```text
ARTWORK
├── WORLD VIEW  → framed object / installation
├── FOCUS VIEW  → large detail + metadata
└── STORY VIEW  → cinematic subject
```

**MUST V1:** semantic entities and visual representation remain separable.  
**MUST V1:** Museum-specific styling must not redefine the generic entity model.

Semantic records may carry a presentation intent, representation hint or reference when useful, but this never transfers ownership of meshes, materials, shaders, Scene Kit implementation or Three.js objects into World/Entity semantic state.

## 5.2 One semantic object has one canonical record

The semantic model must obey:

```text
ONE SEMANTIC OBJECT
ONE CANONICAL RECORD
MULTIPLE REFERENCES
```

World, Space, Route, Scene Kit and other systems may reference the same semantic object through stable identity, but must not maintain competing authoritative copies of that object's semantic state.

IW-0 deliberately does **not** decide whether the implementation uses Maps, arrays, normalized stores, ECS or another storage mechanism.

## 5.3 World exists independently from camera

```text
WORLD STATE ≠ CAMERA STATE
```

Camera observes the world. Author Mode may command camera. Experience Director may command camera. Camera never owns World State.

## 5.4 Explore and Guided use the same World State

No duplicate “Explore World” and “Guided World”.

```text
WORLD STATE
├── Explore Controller
└── Experience Director
```

## 5.5 Hotspot triggers; Portal connects

Hotspot and Portal are distinct semantic responsibilities.

```text
HOTSPOT
= interaction / trigger

PORTAL
= spatial connection / transition
```

A Hotspot may request an Action such as:

```text
Hotspot
→ ACTIVATE_PORTAL
→ Portal
```

but there must not be two independent systems owning the same transition semantics.

A Hotspot does not imply a visible icon. A Portal does not imply a visible door.

## 5.6 Portal transition behaviour is not Portal representation

Portal semantics must separate:

```text
SEMANTIC TRANSITION BEHAVIOUR
≠
VISUAL REPRESENTATION
```

Conceptual behaviour may include continuous transfer, cut, teleport or cinematic handoff. A Scene Kit representation hint may describe a door, screen, artwork, window or no visible object.

Exact enums and technical realization remain open.

## 5.7 Action is semantic, not an arbitrary callback

Action represents what an interaction or experience step requests from the system.

Conceptual examples:

```text
FOCUS_ENTITY
PLAY_MEDIA
OPEN_INFO
ACTIVATE_PORTAL
START_ROUTE
TRIGGER_STORY
SET_STATE
```

V1 must define only the minimal Action vocabulary required by the Museum proof. IW-0 does not authorize a universal Action Engine.

Scene Kits must not invent incompatible arbitrary callback semantics for equivalent product actions.

## 5.8 Anchor is a generic spatial reference

Anchor is a reusable semantic spatial reference for positions, orientations, surfaces, regions or destinations used by systems such as:

- content placement;
- Hotspots;
- Portals;
- Focus Camera;
- labels;
- lights;
- spawn points;
- other spatial relationships.

The exact technical representation is deliberately open. The invariant exists to avoid hard-coded absolute coordinates scattered across subsystems.

## 5.9 Exactly one authoritative camera controller exists per frame

Conceptual authority states may include:

```text
AUTHOR
EXPLORE
FOCUS
DIRECTED
TRANSITION
```

At any frame **exactly one** controller may write authoritative camera state. Ownership handoffs are explicit and testable. Two subsystems must never simultaneously write the authoritative camera.

## 5.10 Editor and Experience are separate responsibilities

Author controls editing and configuration. Visitor sees the world with minimal experience UI.

IW-0 defines this as a responsibility boundary, **not yet a physical package/bundle decision**.

---

# 6. Proposed domain vocabulary

The vocabulary below is proposed and must be used consistently during IW-0 review.

## World

Top-level semantic container containing Spaces, semantic object registries/references, routes, global experience settings and graph relationships.

## Space

A loadable spatial context: gallery, lobby, archive, room, exterior, film room, showroom zone, etc. A Space references canonical semantic records located/active in that context; it does not own duplicate Entity records.

## Entity

Any identifiable semantic object that exists in the World. One Entity identity corresponds to one canonical semantic record.

## Content Entity

Entity carrying presentable content: Artwork, Sculpture, Image, Video, Audio, Document, Text, 3D Object.

## Representation

Scene Kit-owned visual realization of a semantic object. Semantic data may expose presentation intent but not Scene Kit implementation ownership.

## Action

Semantic effect requested by an interaction or experience step. Exact V1 taxonomy/execution mechanism remains open.

## Anchor

Generic semantic spatial reference used by placement, interactions, portals, camera focus, labels, lights, spawn points and related relationships. Exact storage/transform mechanism remains open.

## Hotspot

Semantic interaction/trigger attached to an Entity, Anchor, region or spatial position. It may request an Action; it does not own spatial connectivity.

## Portal

Semantic spatial connection/transition from one Space/state to another. It owns connectivity/transition semantics, not the interaction trigger and not a mandatory visual form.

## Route

Ordered or partially ordered sequence through Spaces/entities.

## Chapter

Narrative grouping used by Guided Experience. A Chapter can reference one or more Spaces but is not identical to a Space.

## Story Step

Directed experience unit combining subject, camera intent, timing, narration/audio and transition.

## Shot

Camera instruction with semantic target and framing intent.

## Cue

Time/event-triggered instruction for audio, narration, UI, transition or Action.

---

# 7. Proposed subsystem responsibility map

This map describes **responsibilities**, not final directories/packages.

## Core Runtime — MUST V1

Responsibilities:

- lifecycle orchestration;
- clock/time;
- event transport;
- system registry;
- deterministic test seed support;
- quality/device configuration;
- disposal coordination.

## World System — MUST V1

Responsibilities:

- World State;
- canonical semantic registries/identity;
- World Graph;
- Space registry;
- Entity references;
- Portal references;
- Route references;
- state transitions.

## Render System — MUST V1

Responsibilities:

- renderer ownership;
- scene integration;
- materials/lighting/environment contracts;
- device/quality tier application;
- post-processing only where justified;
- render resource disposal.

## Asset System — MUST V1

Responsibilities:

- load;
- cache;
- warm/preload;
- retain/release;
- dispose;
- asset readiness signals.

## Space Lifecycle — MUST V1

Proposed states:

```text
UNLOADED
→ PRELOADING
→ WARMING
→ READY
→ ACTIVE
→ COOLING
→ DISPOSED
```

The exact cache/window policy remains implementation-test dependent.

## Navigation — MUST V1

First Museum profile:

- first-person or equivalent visitor navigation;
- collision sufficient for gallery traversal;
- proximity detection;
- stable enter/exit Space behavior.

**SHOULD LATER:** orbit profile.  
**SHOULD LATER:** teleport profile as authored accessibility/convenience option.  
**R&D:** minimal/custom avatars, advanced physics, navmesh authoring.

## Camera System — MUST V1

Responsibilities:

- one authoritative camera controller per frame;
- Explore camera authority;
- Focus camera authority;
- Directed/cinematic camera authority;
- explicit ownership handoffs including transition state;
- subject framing based on semantic bounds/Anchors/intent where possible.

## Interaction — MUST V1

Responsibilities:

- ray/pointer interaction where relevant;
- proximity volumes;
- Hotspot state;
- semantic Action requests;
- Portal activation through contract;
- focus enter/return.

## Content — MUST V1

Types required for Museum V1:

- Artwork/Image;
- Sculpture / 3D Object;
- Video;
- Audio;
- Text/metadata.

**SHOULD LATER:** Document-specific viewer semantics.  
**R&D:** Character/AI Guide as first-class content entity.

## Experience Director — MUST V1 (thin)

Responsibilities:

- guided route playback;
- chapters/story steps;
- shot execution;
- transition handoff;
- basic transport;
- semantic Action/cue orchestration;
- synchronized narration/audio cues sufficient for prototype.

**SHOULD LATER:** professional timeline authoring UI, branching narrative, advanced scrubbing/editor tooling.

## Authoring — MUST V1 (thin)

Must prove editable configuration for:

- World;
- Space;
- Content;
- Hotspot;
- Portal;
- Route;
- minimal Anchor/Action references required by those concepts.

This may use schemas + minimal UI. It must not become a universal scene editor in V1.

## QA / Quality — MUST V1

Responsibilities:

- deterministic named states;
- browser smoke paths;
- baseline capture;
- visual comparison;
- performance evidence;
- mobile evidence;
- camera-authority conflict detection/testing where practical;
- Unslop checks;
- Gauntlet comparison;
- human visual gate.

---

# 8. Event vocabulary contract — proposed

Events are plain semantic messages. Exact implementation mechanism is deferred.

Naming proposal:

```text
world:ready
world:state-changed
space:preload-requested
space:ready
space:entered
space:left
space:disposed
entity:focused
entity:focus-left
hotspot:near
hotspot:activated
action:requested
action:completed
portal:requested
portal:entered
route:started
route:step
route:completed
experience:started
experience:paused
experience:resumed
experience:completed
shot:started
shot:completed
camera:authority-changed
audio:cue
narration:cue
quality:tier-changed
asset:ready
asset:error
```

Rules:

- emitter does not silently mutate another subsystem's private state;
- payload shape must be documented before cross-subsystem use;
- events describe facts/requests, not UI implementation;
- high-frequency per-frame state should not be routed through a general event bus without profiling;
- an event must not become a second source of truth for the semantic object it references.

**MUST V1:** define the minimal canonical set actually required by the Museum prototype before implementation.  
**SHOULD LATER:** versioned event compatibility if external Scene Kits become independently distributed.

---

# 9. World schema — proposed minimum

Conceptual schema only:

```text
World {
  id
  version
  title
  sceneKit
  spaceRefs[]
  entityRefs[]
  hotspotRefs[]
  portalRefs[]
  routeRefs[]
  chapterRefs[]
  experience
  qualityPolicy
  accessibility
  metadata
}
```

Rules:

- stable IDs;
- one canonical record per semantic object;
- collection fields above represent references/registry membership, not duplicate inline ownership;
- exact physical registry/store structure is open;
- schema version present from V1;
- no Museum-only property at World root unless generic semantics justify it.

---

# 10. Space schema — proposed minimum

```text
Space {
  id
  title
  type
  transform / worldPlacement
  sceneProfile
  entityRefs[]
  hotspotRefs[]
  portalRefs[]
  anchorRefs[]
  bounds
  spawnAnchorRefs[]
  ambience
  lightingProfile
  assetRefs[]
  lifecycleHints
  metadata
}
```

`entityRefs[]` references canonical Entity records; it does not duplicate Entity objects already represented in World semantic state.

`sceneProfile` and `lightingProfile` are Scene Kit concerns referencing semantic presets rather than hardcoding visual implementation into World data.

---

# 11. Entity / content schema — proposed minimum

```text
Entity {
  id
  kind
  subtype
  spaceRef
  anchorRef?
  transformIntent?
  bounds
  content
  presentationIntent?
  interactionRefs[]?
  accessibility
  metadata
}
```

Museum example:

```text
content {
  title
  creator
  year
  medium
  description
  mediaRef
  audioRef?
}
```

`presentationIntent` is optional semantic guidance only. It must not own or embed Scene Kit meshes, materials, shaders, Three.js objects or rendering implementation.

The engine must not require these Museum metadata fields for every Entity kind.

---

# 12. Action contract — proposed minimum

Conceptual schema only:

```text
Action {
  id?
  type
  targetRef?
  params?
}
```

Conceptual V1 candidates include:

```text
FOCUS_ENTITY
PLAY_MEDIA
OPEN_INFO
ACTIVATE_PORTAL
START_ROUTE
TRIGGER_STORY
SET_STATE
```

The final taxonomy, whether Actions are inline or canonical records, extensibility mechanism and execution model remain open until Museum V1 needs are validated.

The invariant is semantic consistency: equivalent interactions must not rely on unrelated arbitrary Scene Kit callbacks.

---

# 13. Anchor contract — proposed minimum

Anchor is conceptual and intentionally implementation-neutral.

It must be able to represent or reference reusable spatial intent sufficient for cases such as:

- object/content placement;
- interaction origin/region;
- Portal source/destination;
- focus target/framing assistance;
- label/light attachment;
- spawn/return location.

IW-0 does not choose absolute coordinates vs transforms vs object-relative anchors vs surface/volume encodings. Hard-coded coordinates dispersed across independent subsystems are the anti-pattern being prevented.

---

# 14. Hotspot schema — proposed minimum

```text
Hotspot {
  id
  spaceRef
  entityRef?
  anchorRef?
  interactionVolume
  triggerDistance?
  focusDistance?
  visualPolicy
  action
  accessibilityLabel
  enabled
}
```

`action` requests semantic behaviour. A Portal transition should normally be expressed as an Action targeting a Portal rather than by making Hotspot own Portal connectivity.

Proposed semantic states:

```text
HIDDEN
AVAILABLE
NEAR
HOVER
ACTIVE
VISITED
NEXT_ROUTE
```

Visual marker is optional.

---

# 15. Portal schema — proposed minimum

```text
Portal {
  id
  fromSpaceRef
  toSpaceRef
  sourceAnchorRef
  destinationAnchorRef
  transitionBehaviour
  representationHint?
  prefetchPolicy
  returnPolicy
  accessibilityLabel
}
```

`transitionBehaviour` is semantic spatial behaviour. Conceptually it may express continuous transfer, cut, teleport, cinematic handoff or an equivalent future vocabulary.

`representationHint` is optional presentation intent for the Scene Kit, conceptually such as door, screen, artwork, window or none. It never defines Portal connectivity or visual implementation ownership.

Exact enums remain open.

---

# 16. Camera contract — proposed

Camera ownership states:

```text
AUTHOR
EXPLORE
FOCUS
DIRECTED
TRANSITION
```

Primary invariant:

> **AT ANY FRAME THERE IS EXACTLY ONE AUTHORITATIVE CAMERA CONTROLLER.**

Rules:

1. exactly one authority writes authoritative camera state per frame;
2. ownership transitions are explicit and testable;
3. no two subsystems may simultaneously write authoritative camera state;
4. Focus must provide deterministic return behavior;
5. Directed camera may not permanently corrupt Explore pose unless the experience explicitly chooses a new return/spawn pose;
6. focus framing should derive from subject semantics/bounds/Anchors where practical, not one global hard-coded distance;
7. mobile framing must be validated separately.

Museum V1 shot intents:

```text
ENTRY
OVERVIEW
FOCUS
DETAIL
PORTAL
EXIT
```

---

# 17. Explore navigation contract — proposed

**MUST V1**

- visitor controls movement/orientation;
- collision prevents obvious traversal failure;
- Space transitions preserve valid spawn/orientation through semantic destination references/Anchors;
- proximity is spatial, not UI-driven;
- Focus explicitly hands camera authority to/from Focus state and returns safely;
- Escape/back action always has a defined result;
- keyboard + pointer path on desktop;
- mobile/touch path appropriate to device tier;
- reduced-motion handling for camera transitions.

**SHOULD LATER**

- configurable navigation profiles;
- teleport destinations;
- accessibility navigation shortcuts;
- controller/gamepad.

**R&D**

- embodied avatar locomotion;
- advanced physical simulation.

---

# 18. Experience Director contract — proposed

The Experience Director orchestrates existing World/Entity/Camera/Audio capabilities; it does not own their internal implementation.

Minimum Story Step:

```text
StoryStep {
  id
  chapterRef
  subjectRef
  shotIntent
  duration / completionRule
  narrationCue?
  audioCue?
  actionRefs[]?
  transitionIntent?
  next?
}
```

**MUST V1**

- start guided route;
- execute ordered story steps;
- acquire/release camera authority safely;
- trigger basic semantic Actions/cues;
- move through Spaces using Portal/Space contracts;
- pause/resume/exit;
- restore valid Explore state when leaving guided mode.

**SHOULD LATER**

- seekable authored timeline UI;
- branching;
- reversible story traversal;
- chapter selection UI;
- sophisticated transition tracks.

**R&D**

- generative directing;
- AI-curated routes.

---

# 19. Timeline / audio contract — proposed

V1 should avoid building a full DAW/timeline editor.

**MUST V1**

- global experience time source or deterministic cue schedule;
- play/pause/resume;
- narration cue;
- ambience per Space;
- mute/volume controls;
- captions/transcript metadata for narration;
- cleanup when Space/experience exits.

**SHOULD LATER**

- seek/scrub;
- multi-track timeline authoring;
- fades/ducking profiles;
- localization tracks.

**R&D**

- adaptive/generated narration and music.

---

# 20. Scene Kit contract — proposed

A Scene Kit maps semantic World data to a specific visual/spatial language.

A Scene Kit may define:

- Space representations;
- Entity representations;
- materials;
- lighting profiles;
- environmental treatment;
- placement helpers;
- Anchor realization helpers;
- focus presentation;
- Portal transition realizations;
- quality-tier variants.

A Scene Kit must not:

- replace World State;
- duplicate canonical semantic records;
- redefine Portal connectivity semantics;
- redefine Hotspot/Action semantics arbitrarily;
- own generic route logic;
- duplicate Experience Director;
- mutate another Scene Kit;
- require editing Casebook/Boards.

**MUST V1:** one Museum / Institutional Scene Kit with a small set of visual profiles on shared contracts.  
**SHOULD LATER:** Showroom, Real Estate, Fashion Scene Kits.  
**R&D:** generated/procedural Scene Kit creation.

---

# 21. Asset lifecycle contract — proposed

Every heavyweight resource must have an owner and release path.

**MUST V1**

- explicit load state;
- prefetch only likely next requirements;
- prewarm where measured useful;
- cache ownership known;
- retain/release semantics for shared assets;
- disposal of geometry/material/texture/render targets/audio resources;
- loading failure surfaced without corrupting World State.

Proposed Space working set:

```text
ACTIVE SPACE
+
NEXT LIKELY SPACE
+
OPTIONAL PREVIOUS SPACE
```

This is a hypothesis to test, not a fixed numerical cache policy.

---

# 22. Performance / quality budgets — proposed gates

Exact numeric budgets require prototype measurement on representative devices. IW-0 therefore defines **budget categories and evidence gates**, not invented numbers.

Required measured categories:

- time to first interactive world;
- Space transition latency;
- steady-state FPS/frame time;
- GPU memory / texture pressure where observable;
- draw calls;
- triangles/instances;
- shader compilation stalls;
- texture dimensions/compression policy;
- active lights/shadows;
- DPR;
- mobile thermal/performance degradation;
- asset cache size;
- audio/video concurrency.

**MUST V1:** define actual pass/fail numbers after the first representative Museum blockout and before visual scale-up.  
**MUST V1:** performance tier must affect expensive features, not merely label the device.

---

# 23. Device tiers — proposed

Do not equate mobile with “desktop but smaller”.

Proposed tiers:

```text
LOW
MEDIUM
HIGH
```

Tier may control:

- DPR cap;
- shadow quality/count;
- post-processing;
- reflection/environment fidelity;
- asset LOD;
- video resolution policy;
- transition complexity;
- simultaneous Space warmup.

**MUST V1:** desktop + representative mobile validation.  
**SHOULD LATER:** persistent device calibration and user quality override.  
**R&D:** dynamic auto-tuner driven by sustained runtime telemetry.

---

# 24. Accessibility contract — proposed

Accessibility is part of the architecture because canvas-only information is insufficient for Museum/Institutional use.

**MUST V1**

- semantic metadata available outside pure WebGL representation;
- keyboard-operable essential experience actions on desktop;
- visible focus states for non-canvas UI;
- reduced-motion response;
- mute/volume;
- captions/transcript support for narration/video where content provides it;
- readable Focus Mode;
- non-color-only state communication;
- clear escape/return semantics;
- fallback message if required graphics capability is unavailable.

**SHOULD LATER**

- alternative navigation route/teleport map;
- richer screen-reader experience map;
- localization framework.

**R&D**

- adaptive accessibility profiles and AI-assisted descriptions.

---

# 25. Deterministic QA contract — proposed

The visual/runtime system must expose named repeatable states.

Examples:

```text
museum:lobby-entry
museum:gallery-a-overview
museum:artwork-03-focus
museum:portal-a-b-before
museum:portal-a-b-after
museum:guided-step-04
museum:mobile-gallery-a
```

**MUST V1**

- fixed test World fixture;
- deterministic test seed where randomness exists;
- stable camera poses for captures;
- repeatable browser path;
- baseline screenshots;
- basic image diff or structured visual comparison;
- browser console/error capture;
- performance capture at named states;
- evidence that camera authority is singular at tested ownership handoffs.

No claim of quality based only on successful build.

---

# 26. Unslop protocol — proposed

Unslop is a rejection layer, not an art direction preset.

For every important visual milestone:

1. capture actual browser output;
2. inspect for generic AI/WebGL clichés;
3. identify concrete violations;
4. fix causes, not merely restyle symptoms;
5. preserve chosen Museum art direction rather than replacing it with a generic “anti-AI style”.

Reject by default:

- random floating rounded cards;
- gratuitous glassmorphism;
- cyan/purple AI gradients;
- decorative neon;
- meaningless particles;
- primitive cubes/diamonds/orbs as final authored assets;
- fake HUD language;
- repetitive pedestal grids;
- giant empty rooms without composition;
- uniform lighting;
- flat material treatment;
- generic centered landing-page composition inside the 3D world.

**MUST V1:** Museum-specific anti-slop checklist before visual approval.

---

# 27. Gauntlet Loop protocol — proposed

Each subsystem has a named quality bar from the Reference Ledger.

Loop:

```text
GOAL
→ NAMED REFERENCE
→ BUILD
→ TECHNICAL QA
→ INDEPENDENT CRITIC
→ BLIND / DIRECT COMPARISON WHEN POSSIBLE
→ OURS LOSES?
→ ITERATE
→ HUMAN REVIEW
```

Rules:

- builder does not self-certify visual excellence;
- critic receives fresh evidence;
- output is compared, not praised numerically;
- no arbitrary fixed number of rounds;
- “premium”, “AAA”, “Cartier-level” are forbidden claims without evidence;
- human visual approval remains final merge gate.

---

# 28. Parallel work policy — proposed

Parallel agents are useful only when ownership is independent.

## Safe to parallelize

- reference research;
- license research;
- schema criticism;
- accessibility review;
- performance analysis;
- independent visual QA;
- documentation audit.

## Sequential / single-owner preferred

- camera + navigation integration;
- render + post-processing;
- materials + lighting;
- Space lifecycle + Asset lifecycle;
- World State + persistence;
- Timeline + audio transport;
- proximity + interaction state.

Rule:

```text
ONE OWNER PER COUPLED SUBSYSTEM
CLEAR CONTRACT BETWEEN SUBSYSTEMS
```

No fan-out across tightly coupled runtime code merely to increase agent count.

---

# 29. Reference and licensing policy — proposed

Reference repositories exist to provide evidence and patterns, not automatic code supply.

Rules:

1. prefer concepts, contracts, construction order and architecture patterns;
2. before copying/adapting source code, verify repository/file license and necessity;
3. before copying assets, verify asset-specific rights independently from repository license;
4. record intended reuse in `REFERENCE_LEDGER.md` before implementation;
5. if license is absent/unclear, treat direct code/asset reuse as **not permitted** until resolved;
6. attribution obligations must be carried into final implementation/export where required;
7. IW-0 authorizes **no direct code or asset copy** from reference repositories.

Reference conflict hierarchy:

```text
APPROVED IW CONTRACT
→ PRIMARY REFERENCE
→ SECONDARY REFERENCES
```

A reference may challenge an IW contract through explicit review, but may never silently overwrite an approved engine decision. Important Reference Ledger entries should declare conflict handling when sources can disagree.

---

# 30. Reference authority categories — proposed

## CORE ENGINE

- `Claude-of-Duty`
- `threejs-game-skills`
- `portfolio-itom-and-advanced-WebGL`

## CORE MUSEUM / INSTITUTIONAL

- `artwork-3D-museum`
- `3D-art-gallery-threejs`
- `3DArtMuseum`
- TheVertMenthe — interaction/UX quality reference, not assumed code source

## CORE EXPERIENCE / MOTION

- `MengTo/skills`
- Kage
- `a-long-expected-party`
- `gsap-threejs-codrops`

## CORE QUALITY

- Gauntlet Loop
- Unslop
- `threejs-game-skills` QA practices

## SPECIALIST REFERENCES

- `img2threejs`
- `threejs-procedural-dungeon`
- `-threejs-evidence-graph`
- `threejs-journey`
- `Threejs-Awesome-Graphics-Agent-Skills`
- `webGLImageTransitions`
- `vortex-gallery`
- `camera-3D-showroom`

## R&D / FUTURE

- AI Guide / `3D-ai-school-threejs`
- advanced avatars
- generative worlds
- AlayaWorld / AlayaRenderer / WildWorld if later validated and relevant

Category means authority for a problem, not permission to copy code.

---

# 31. Museum / Institutional V1 specification

## 31.1 Purpose

Prove the engine with a small complete world using controlled/licensed/fictitious content while comparing UX/visual quality against real references.

```text
CONTENT = CONTROLLED
QUALITY BAR = REAL
```

## 31.2 World

```text
Lobby
→ Gallery A
→ Gallery B
→ Archive / Closing
```

At least one real Portal transition between Spaces.

## 31.3 Content

Target fixture:

- 6 artworks/images;
- 1 sculpture/3D object;
- 1 video;
- 1 audio object;
- labels/metadata;
- optional narration samples using controlled content.

## 31.4 MUST V1 capabilities — grouped for execution

The grouping below is for execution clarity only. It does not create a new architecture or add scope.

### FOUNDATION

- semantic World/Space/Entity data with one canonical record per semantic object;
- stable references/IDs across World/Space/subsystems;
- thin authoring for World, Space, Content, Hotspot, Portal, Route and the minimal Anchor/Action references they require;
- Space preload/warm/active/dispose lifecycle;
- Portal between Spaces with transition semantics separate from representation;
- device quality tiers;
- responsive desktop/mobile foundation.

### EXPERIENCE

- free Explore navigation;
- proximity;
- Hotspot interaction/trigger semantics;
- minimal semantic Actions;
- Focus Mode;
- Focus Camera with safe return and singular authority;
- World Map representation of World Graph;
- one Guided Route;
- basic Chapters/Story Steps;
- camera-directed guided sequence;
- ambient audio + basic narration cue support;
- accessibility metadata/focus/readable detail mode.

### QUALITY

- deterministic QA states;
- performance evidence;
- desktop/mobile evidence;
- camera authority handoff evidence;
- Unslop review;
- Gauntlet comparison;
- navigable local/preview evidence before any integration;
- Juanma visual approval as integration/merge gate.

## 31.5 SHOULD LATER

- rich timeline editor;
- orbit navigation profile;
- teleport authoring;
- localization/multilingual authoring;
- multiple route variants;
- more advanced transitions;
- richer archive/document mode;
- reusable visual preset editor;
- exported standalone viewer pipeline if not required for first proof.

## 31.6 R&D

- avatars;
- AI curator;
- multiplayer/social presence;
- generative rooms;
- procedural exhibition generation;
- branching AI narrative;
- advanced physics;
- XR/WebXR.

---

# 32. V1 visual profiles

Museum V1 may demonstrate shared semantics through a limited set of profiles:

- White Cube;
- Dark Exhibition;
- Heritage;
- Sculpture Dramatic / Gallery.

These are Scene Kit visual profiles, not separate engines.

**MUST V1:** prove at least enough variation to demonstrate that data and representation are separated.  
**MUST V1:** avoid building four full museums; variations must not multiply content authoring scope.

---

# 33. Proposed phased roadmap

No phase after IW-0 is authorized merely because it appears here.

## IW-0 — Constitution / Governance

Deliverables:

- Constitution;
- Reference Ledger;
- Decision Log;
- Glossary;
- explicit scope taxonomy;
- no runtime code.

Exit gate: Juanma explicit review/approval or requested changes.

## IW-1 — Isolated Technical Skeleton — MUST V1

After approval only:

- fresh verified local clone/checkout;
- new isolated implementation branch;
- base SHA recorded;
- no shared navigation integration;
- minimal World/Space lifecycle proof;
- browser runs locally.

Exit gate: technical evidence, no regression to protected modules.

## IW-2 — Museum Blockout — MUST V1

- Lobby + Gallery A + Gallery B + Archive topology;
- controlled geometry/content;
- navigation/collision;
- first Portal;
- Space lifecycle;
- deterministic states.

Exit gate: navigable local proof + performance baseline.

## IW-3 — Content / Focus / Authoring — MUST V1

- content schemas;
- artwork/sculpture/video/audio;
- thin authoring;
- proximity/Hotspots;
- minimal Action/Anchor use required by interactions/placement;
- Focus Camera;
- metadata/accessibility.

Exit gate: content can be changed without rewriting scene logic or duplicating canonical records.

## IW-4 — Guided Experience — MUST V1

- route;
- chapters/story steps;
- directed camera;
- basic audio/narration cues;
- enter/exit Guided mode safely.

Exit gate: Explore and Guided share one World State and camera authority remains singular through handoffs.

## IW-5 — Quality / Device / Visual Pass — MUST V1

- Museum Scene Kit visual quality;
- device tiers;
- performance budgets finalized from evidence;
- Unslop;
- Gauntlet;
- mobile;
- accessibility review;
- visual comparison.

Exit gate: Juanma visual approval.

## IW-6 — Escaparates Pro Integration — SHOULD LATER / gated

Only after approval:

- registry integration;
- first-level navigation entry;
- shared shell integration only if necessary and explicitly reviewed;
- regression QA.

Exit gate: Juanma explicit merge authorization.

## IW-7+ — SHOULD LATER / R&D

- richer editor;
- additional Scene Kits;
- advanced timeline;
- avatars;
- AI Guide;
- generative systems.

---

# 34. Governance and source of truth

Authority order:

```text
1. JUANMA — explicit current decision
2. APPROVED GITHUB ARCHITECTURE / ADRs
3. VERIFIED CURRENT BRANCH + CODE
4. PROPOSED / WORKING DOCUMENTS
5. CHAT / AGENT HYPOTHESES
```

If Juanma changes an approved architectural decision:

1. stop code work affected by the change;
2. update/record the architectural decision;
3. realign branch/code;
4. resume only with shared source of truth restored.

Roles:

```text
JUANMA
Product Owner
Visual approval
Final architecture decisions
Merge authorization

CHATGPT
Product Architect
Cross-repo analysis
Decision support
Reference Ledger / ADR support
Critic

IMPLEMENTATION AGENT / CLAUDE CODE
Local repo inspection
Build
Tests
Browser QA
Technical execution
Evidence generation
```

---

# 35. IW-0 approval checklist

IW-0 remains **PROPOSED** until Juanma explicitly reviews it.

Review questions:

- [ ] Product boundary is correct.
- [ ] Casebook/Boards protection is sufficient.
- [ ] MUST V1 is small enough.
- [ ] SHOULD LATER is correctly deferred.
- [ ] R&D cannot leak into critical path.
- [ ] Domain vocabulary is understandable.
- [ ] One semantic object / one canonical record invariant is correct.
- [ ] Hotspot / Action / Portal responsibilities are non-duplicative.
- [ ] Anchor abstraction is sufficient without prematurely fixing implementation.
- [ ] Engine / Scene Kit / Authoring / Experience boundaries are correct.
- [ ] Exactly one authoritative camera controller per frame is the correct invariant.
- [ ] Explore and Guided contracts are correct.
- [ ] Museum V1 is the right proof.
- [ ] Accessibility/performance are architecture-level gates.
- [ ] Reference authority hierarchy is correct.
- [ ] Licensing/reuse policy is strict enough.
- [ ] Governance between Juanma / ChatGPT / implementation agent is correct.

Approval must be explicit. A merged document without explicit product review must not be interpreted as architectural approval.

---

## Guiding statement

> **Immersive Worlds is not a 3D website. It is a reusable system for building, exploring, connecting, directing, narrating and publishing interactive worlds — proven first through a small, complete Museum / Institutional world.**
---

# 36. Escaparates Pro — who authors, who reviews, who visits

Added because the Authoring work kept meeting decisions this document could not
settle. It records what Escaparates Pro is *for*, so that a later contributor
does not have to infer it from the code and infer it differently.

Escaparates Pro serves **two creator/business use cases** and **one final
consumption context**. They are not three views of one screen; they are three
different products' worth of intent, and conflating them is the failure mode
this section exists to prevent.

## 36.1 Studio / Authoring — internal professional production

The Studio is a real professional production environment, not a demonstration
UI. The house must be able to run its own client work through it:

```text
CREATE → PERSONALIZE → PREVIEW → VALIDATE → SAVE → EXPORT/CAPTURE → DELIVER
```

Every one of those verbs is a product surface, and the chain does not end at
SAVE. A tool that can author but not deliver is half a tool.

## 36.2 Studio / Authoring — paid self-service platform

The same architecture must later support other people paying to use it:
accounts, tiers, and capability gating by plan or role.

Capabilities are named per capability, never per screen — the unit of gating is
what someone may *do*, so that a plan can grant `artwork_image` while withholding
`artwork_video` without either one needing its own copy of a panel:

```text
institution_branding   artwork_image      artwork_video
projection_image       projection_video   custom_text
advanced_layout        export_json        export_html
export_png             export_video       publish_hosted
custom_domain          ai_guide           analytics
```

**Billing, accounts and plan logic are out of scope for now.** What is in scope
is not foreclosing them: the five Authoring Workspaces and their sub-areas are
the surface those capabilities attach to, which is one reason the workspace
spine is part of the shell rather than a filter hidden in a column.

## 36.3 Visitor experience — final consumption

**The visitor never authors.** A visitor may navigate, explore, use Guided mode,
Focus and Browse, interact, and in future use accessibility, language and AI
guide features.

A visitor must never see upload controls, authoring fields, project save,
configuration, personalization, export tools, or publishing controls. Not
disabled, not hidden behind a role check in the same panel — absent.

## 36.4 The canonical separation

```text
STUDIO / AUTHORING  ≠  PREVIEW / REVIEW  ≠  VISITOR EXPERIENCE
```

All three run the **real Museum runtime**. That is not negotiable, and it is the
reason `NO SECOND RENDERING TRUTH` (§9) is load-bearing here: the way to keep a
preview honest is to make it the same engine, not a mock of it.

### Open product debt — Author Preview vs Visitor Preview

Framing the selected work in the Studio preview uses the runtime's own focus
path, so the author sees the visitor's presentation of that work — caption,
paging, "volver a la sala". That is currently *desirable*: it is live proof that
edited metadata reaches the wall.

It is also not yet the finished idea. The long-term UX should distinguish an
**Author Preview** from a **Visitor Experience Preview**, both on the real
runtime, differing in chrome rather than in rendering. Recorded here as debt so
it is not rediscovered as a bug.

## 36.5 Output / Publish — future layer

`EXPORTAR PROYECTO` is the first step of an Output layer, not the whole of it.
Decisions taken now must stay compatible with:

| Layer | Deliverable |
|---|---|
| Project / config | JSON |
| Experience | HTML / standalone package |
| Visual | PNG, screenshots, contact sheets |
| Motion | Video walkthrough / presentation output |
| Publish | Hosted, client review, production experience |

**Export is not visitor mode.** Leaving the Studio to look at the experience is
not the same act as producing an artefact for a client, and the two must not
share a button.
