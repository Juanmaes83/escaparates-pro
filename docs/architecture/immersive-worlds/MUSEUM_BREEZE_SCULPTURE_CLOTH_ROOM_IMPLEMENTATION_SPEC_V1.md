# MUSEUM BREEZE SCULPTURE + CLOTH ROOM — IMPLEMENTATION SPEC V1

> **Status:** APPROVED BY JUANMA — REPOSITORY AUTHORITY  
> **Target repository:** `Juanmaes83/escaparates-pro`  
> **Target workstream:** Immersive Worlds / Museum  
> **Intended implementation branch:** `claude/immersive-worlds-module-c0d3f7`  
> **Product Owner / Visual Authority / Final Decision / Merge Authority:** Juanma  
> **Implementation Agent:** Claude Code  
> **Review Partners:** Juanma + ChatGPT  
> **Governing Method:** `AUTONOMOUS_VISUAL_ENGINEERING_PLAYBOOK_MUSEUM_V1` + operative Human QA Runtime Protocol  
> **Primary Product Authority for this room:** **Breeze Studio PRO V4**  
> **Original engine donor:** `Juanmaes83/breeze` pinned source `0ab82342f9169f20e32b0e90babcc4707e694906`  
> **Breeze Studio PRO V4 authority commit:** `3a58e9bcbe9c2bcfdd2f63e4b514085e0223b581`  
> **Core objective:** integrate the proven Breeze Studio PRO V4 sculpture + dynamic cloth experience as a native Museum room without rebuilding its proven physics, media, object-replacement or collision capabilities.

---

# 0. EXECUTIVE DECISION

This room is **not** a new cloth experiment.

It is the Museum-native evolution of a first-party product capability that already exists:

```text
POSE / BREEZE
        ↓
Juanmaes83/breeze
        ↓
BREEZE STUDIO PRO V4
        ↓
MUSEUM ADAPTER / ROOM
        ↓
MUSEUM SCENE KIT
        ↓
GUIDE + CAMERA + ROUTE + FORWARD/BACK + AUTHORING + QA
```

The implementation mission is therefore:

> **RECONNECT AND ADAPT BREEZE STUDIO PRO V4 TO THE MUSEUM ENGINE. DO NOT REBUILD BREEZE.**

The room must preserve the artistic identity and product capabilities of Breeze Studio PRO V4 while accepting Museum authority over:

- world/room lifecycle;
- visitor camera;
- Guide choreography;
- route progression;
- Guided Experience;
- forward/back semantics;
- visitor HUD;
- Museum Authoring;
- QA;
- publication surface.

Core rules:

> **BREEZE STUDIO PRO V4 IS THE PRODUCT AUTHORITY.**

> **BREEZE ORIGINAL IS THE ENGINE DONOR, NOT THE PRODUCT AUTHORITY.**

> **REUSE BEFORE INVENTION.**

> **PORT THE CAPABILITY, NOT THE DONOR APP SHELL.**

> **MUSEUM OWNS THE EXPERIENCE ORCHESTRATION. BREEZE OWNS ITS PROVEN CLOTH CAPABILITY.**

> **FUNCTIONAL PASS ≠ PRODUCT PASS. PIXELS WIN.**

---

# 1. AUTHORITY ORDER

For this mission, source conflicts are resolved in this order:

```text
1. Latest explicit Juanma decision
2. Frozen / Human-preferred Museum contracts
3. This document once explicitly approved
4. Breeze Studio PRO V4
5. Museum Autonomous Visual Engineering Playbook
6. Current Museum Scene Kit / Director / Runtime contracts
7. Original Breeze engine source
8. Canonical visual/video evidence
9. Existing implementation records / reference ledger
10. Agent inference
```

Important:

```text
Breeze Studio PRO V4
>
Breeze original demo behaviour
```

The original Breeze project remains a valuable implementation donor for physics, geometry, collision and WebGPU mechanics, but it must not override the proven product decisions already made in Breeze Studio PRO V4.

---

# 2. VERIFIED PRODUCT AUTHORITY — BREEZE STUDIO PRO V4

## 2.1 Exact authority

The approved product-level source for this room is:

```text
Repository:
Juanmaes83/escaparates-pro

Module:
labs/website-modules-source/breeze-studio-pro/

Version authority:
Breeze Studio PRO V4

Authority commit:
3a58e9bcbe9c2bcfdd2f63e4b514085e0223b581
```

The V4 commit defines the module as:

```text
Escultura y tela WebGPU
+ Experiences
+ fondos
+ media en tela
+ grading visual
+ biblioteca 3D reemplazable
```

It pins the original Breeze source to:

```text
Juanmaes83/breeze
0ab82342f9169f20e32b0e90babcc4707e694906
```

## 2.2 V4 authoring capability

V4 already proves:

```text
ASSET STATE
SUBIR
→ CARGADO
→ START
→ APPLIED

BACKGROUND
- image
- video
- Scale
- Position X
- Position Y

CLOTH MEDIA
- image
- video
- Scale
- Position X
- Position Y
- opacity
- brightness
- contrast
- saturation

EXPERIENCES
- Prairie Cloth
- Autumn Leaves
- Sakura Petals
- Museum Cloth
- Gallery Wind
- Fashion Drapery
- Product Reveal

SCULPTURE / OBJECT
- Venus de Milo
- Torus Knot
- Abstract Orbit
- Museum Plinth
- Corset mannequin
- Lantern
- BoomBox
- uploaded GLB
- uploaded GLTF
- uploaded OBJ

COLLISION
- replacement object geometry rebuilds the real BVH cloth collider

OUTPUT
- PNG
- WebM
- clean preview
```

These are **existing proven capabilities**.

Museum integration is not authorization to recreate them.

---

# 3. NON-AUTHORITATIVE LATER VARIANTS

A later V4.1 implementation exists in the repository.

For this mission:

```text
V4.1
= NOT PRIMARY PRODUCT AUTHORITY
unless Juanma explicitly promotes it.
```

Claude may inspect V4.1 only as:

```text
REFERENCE / LATER HARDENING
```

when a specific implementation detail is demonstrably useful and does not alter V4 product semantics.

In particular, later runtime hardening may be reused only after compatibility is proved.

It must not silently redefine V4.

---

# 4. ORIGINAL BREEZE ENGINE — DONOR ROLE

Original source:

```text
Juanmaes83/breeze
pinned source:
0ab82342f9169f20e32b0e90babcc4707e694906
```

The original project is a real-time Verlet-based cloth simulation using Three.js WebGPU.

Its proven engine capabilities include:

- cloth geometry;
- Verlet vertices and springs;
- external forces;
- procedural wind/noise;
- BVH collision;
- sculpture collider;
- cloth vs sculpture interaction;
- object reset;
- scene presets;
- HDRI/environment;
- WebGPU compute;
- smoothing;
- friction;
- collision correction.

Key original source areas include:

```text
src/app.js
src/statue.js
src/clothGeometry.js
src/bvh.js
src/physics/verletPhysics.js
src/physics/verletGeometry.js
src/conf.js
```

These are engine donors.

They do not automatically own Museum camera, route, room lifecycle or authoring architecture.

---

# 5. THE EXPERIENCE WE ARE INTEGRATING

The target room is a **central sculpture + wind-driven cloth installation**.

The visitor should perceive:

```text
A SCULPTURE
standing as the central physical anchor

+
A CLOTH / SCARF / FABRIC ELEMENT
moving through the room under wind

+
REAL COLLISION
the cloth reaches, touches, wraps, glances or reacts against the sculpture

+
VISUAL MEDIA
the cloth may itself carry image/video

+
ENVIRONMENT MEDIA
the room/background may use image/video

+
CUSTOM OBJECT
the sculpture can be replaced

+
MUSEUM ORCHESTRATION
Guide, camera, route, forward/back, authoring and QA
```

The primary interaction is **observational / experiential**, not rope grabbing.

The cloth is animated by the physical simulation and environmental force.

Do not transform this room into the unrelated rope-drag experience.

---

# 6. CORE PRODUCT IDENTITY

The room must feel like:

```text
DIGITAL INSTALLATION ART
+
PHYSICAL CLOTH BEHAVIOUR
+
SCULPTURAL PRESENCE
+
CURATED MUSEUM EXPERIENCE
```

It must not feel like:

```text
THREE.JS DEMO
WEBGPU BENCHMARK
CONFIGURATOR EMBED
PRODUCT CUSTOMIZER INSIDE A MUSEUM
GENERIC 3D VIEWER
```

The visitor sees the resulting art experience.

The author sees the configurable system.

These are different surfaces.

---

# 7. CAPABILITY OWNERSHIP MAP

## KEEP / REUSE FROM BREEZE STUDIO PRO V4

```text
cloth simulation capability
wind behaviour
cloth geometry
BVH collision model
replaceable central object
BVH rebuild after object replacement
image/video background
image/video cloth mapping
cloth grading
existing V4 Experience presets
object library
GLB / GLTF / OBJ support
PNG / WebM / clean-preview concepts where useful
```

## ADAPT TO MUSEUM

```text
renderer integration
room/world lifecycle
camera ownership
Guide choreography
Tour Stops
beats
route
entry/exit
forward/back
visitor HUD
Museum Authoring
Museum media/project persistence
room reset / restore
Museum QA
Human QA access
```

## DO NOT PORT BLINDLY

```text
standalone Breeze camera
OrbitControls
standalone scene ownership
standalone render loop
standalone GUI shell
standalone authoring panel layout
global event listeners
standalone output UX
standalone asset persistence assumptions
```

## DO NOT REBUILD

```text
Verlet solver
wind force system
cloth collision
BVH mechanics
object-replacement collision rebuild
cloth media mapping
background media capability
V4 grading capability
V4 object-library semantics
```

unless Claude proves a hard incompatibility and reaches a genuine Human Decision Gate.

---

# 8. ARCHITECTURAL TARGET

Target architecture:

```text
MUSEUM ENGINE
│
├── Renderer authority
├── World Graph
├── Room lifecycle
├── Camera ownership
├── Director
├── Guide
├── Visitor input
└── Authoring/config
        │
        ▼
MUSEUM BREEZE ROOM ADAPTER
        │
        ├── V4 config adapter
        ├── lifecycle adapter
        ├── media adapter
        ├── camera/route hooks
        └── reset/restore contract
                │
                ▼
BREEZE STUDIO PRO V4 CAPABILITY CORE
                │
                ├── cloth
                ├── wind
                ├── object
                ├── BVH
                ├── collision
                └── media/material state
```

The adapter should be as thin as practical.

Museum must not fork a second physics product.

---

# 9. RENDERER / WEBGPU INTEGRATION — HIGH RISK

Original Breeze uses:

```text
three/webgpu
WebGPU compute
its own camera
its own scene
its own renderer assumptions
```

Museum currently owns its runtime/rendering architecture.

Before implementation Claude must determine:

```text
A. Can Breeze physics run under the Museum renderer?
B. Does Museum already use a renderer compatible with Breeze's compute path?
C. Can the Breeze scene content be mounted as a room/world group?
D. Does integrating WebGPU require renderer-wide changes?
E. Can physics and visual rendering be separated?
F. Is a bounded secondary offscreen subsystem required?
G. Would any solution create two camera writers or two presentation authorities?
```

This is a **mandatory reconciliation point**.

Do not change the global Museum renderer merely because Breeze originally expects its own renderer.

If a renderer-level change would affect existing Museum worlds:

```text
GLOBAL CONTRACT CHANGE
→ PREPARATION ONLY
→ EVIDENCE
→ HUMAN DECISION
```

unless the approved implementation plan already proves Global Outcome Stability.

---

# 10. SCULPTURE / CENTRAL OBJECT CONTRACT

The central object must retain the V4 replacement model.

Default/canonical first experience may use Venus de Milo, but the architecture must remain object-agnostic.

Museum Authoring should ultimately be able to select:

```text
BUILT-IN OBJECT
or
UPLOADED GLB / GLTF / OBJ
```

Minimum object state:

```text
source
type
scale
position
rotation
visibility
collider status
load status
error state
```

After object replacement:

```text
VISUAL GEOMETRY CHANGES
+
REAL BVH COLLIDER REBUILDS
+
CLOTH COLLIDES WITH NEW OBJECT
```

A visual replacement without collision replacement is a failure.

---

# 11. CLOTH CONTRACT

The cloth is the hero dynamic element.

It must preserve:

- physical weight;
- flexible surface;
- wind response;
- local deformation;
- collision response;
- recovery;
- continuity;
- readable material;
- front/back visual coherence.

The cloth must support V4 media semantics:

```text
DEFAULT MATERIAL
IMAGE
VIDEO
```

and V4 visual controls:

```text
opacity
brightness
contrast
saturation
scale
position X
position Y
```

Museum adaptation must not reduce the capability to a static texture.

---

# 12. WIND CONTRACT

Wind is an authored physical force, not arbitrary noise.

The original Breeze force system is the donor.

For Museum, define product-facing wind semantics, for example:

```text
CALM
BREEZE
GALLERY WIND
DRAMATIC
CUSTOM
```

only if the current V4 configuration supports or can map safely to them.

Do not expose raw physics internals to a normal Museum author unless needed.

Authoring should describe the experience:

```text
Wind intensity
Wind direction
Variation / turbulence
```

rather than:

```text
TSL coefficient 0.00005
noise multiplier
solver internal
```

Technical overrides belong under Advanced if they exist at all.

---

# 13. COLLISION CONTRACT

Collision is a defining capability.

Required invariant:

```text
CLOTH VISIBLY REACTS TO THE ACTUAL ACTIVE SCULPTURE.
```

Not:

```text
cloth reacts to invisible old Venus collider
```

Required tests:

```text
DEFAULT VENUS
→ collision

REPLACEMENT TEMPLATE
→ BVH rebuild
→ collision against replacement

UPLOADED OBJECT
→ BVH rebuild
→ collision against upload
```

Collision QA must test temporal behaviour, not only existence of a BVH object.

---

# 14. BACKGROUND / ENVIRONMENT CONTRACT

V4 already supports image/video background plus transforms.

Museum must decide how that maps into a real room.

Possible representations:

```text
A. backdrop plane / cyclorama
B. environmental media surface
C. room wall media
D. bounded installation background
E. full-room visual environment
```

Do not assume the standalone V4 screen background equals a Museum world background.

Preserve the authoring capability while adapting representation to Museum spatial semantics.

Required V4 controls:

```text
image/video
scale
position X
position Y
```

If Museum has a richer native media representation, reconnect the semantic state rather than duplicating media systems.

---

# 15. IMAGE / VIDEO MEDIA CONTRACT

V4 supports both background media and cloth media.

Museum integration must preserve two independent channels:

```text
BACKGROUND MEDIA
and
CLOTH MEDIA
```

Each must have its own state and lifecycle.

Never conflate:

```text
background video
cloth video
```

The system must support:

```text
background image + cloth image
background video + cloth image
background image + cloth video
background video + cloth video
```

subject to proven runtime limits.

Media state must use Museum project asset semantics where available.

Do not reintroduce session-only object URLs as durable project truth.

---

# 16. AUTHORING INTEGRATION

Breeze Studio PRO V4's product capability must become available through Museum Studio without exposing the standalone V4 product shell wholesale.

Target Museum Authoring area:

```text
ROOM
└── BREEZE INSTALLATION
    ├── Experience
    ├── Sculpture
    ├── Cloth
    ├── Wind
    ├── Background
    ├── Media
    ├── Transform
    └── Advanced
```

Suggested product-level fields:

## Experience

```text
Preset
Simulation enabled
Preview/reset
```

## Sculpture

```text
Object/template
Upload object
Scale
Position
Rotation
```

## Cloth

```text
Default / Image / Video
Media asset
Scale
Position X/Y
Opacity
Brightness
Contrast
Saturation
```

## Wind

```text
Intensity
Direction
Variation
```

## Background

```text
Default / Image / Video
Media asset
Scale
Position X/Y
```

Do not expose internal physics buffers, springs, GPU kernels or BVH implementation to the standard authoring surface.

---

# 17. V4 AUTHORING STATE VS MUSEUM ASSET STATE

V4 uses:

```text
SUBIR
→ CARGADO
→ START
→ APPLIED
```

Museum now has broader project/media concepts.

Do not blindly copy labels.

Map semantics.

Example:

```text
V4 CARGADO
≈ bytes/media available to local module

Museum READY
≈ server/project asset available

Museum SAVED
≈ project config references persistent asset

APPLIED / IN USE
≈ assigned to active room field
```

Claude must reconcile actual current Project Cloud state before implementing.

The V4 authoring state is authoritative for **capability behaviour**, not necessarily for Museum persistence vocabulary.

---

# 18. ROOM SPATIAL DESIGN

This experience must become a physical room, not a full-screen module.

Define:

```text
ENTRY
CENTRAL SCULPTURE
CLOTH FLOW CORRIDOR
WIND ORIGIN / MOVEMENT DIRECTION
GUIDE STAGING
VIEWING POSITION
EXIT
RETURN POSITION
```

The room must establish a strong hero composition:

```text
SCULPTURE
=
CENTRAL ANCHOR

CLOTH
=
DYNAMIC COUNTERFORCE

GUIDE
=
SECONDARY HUMAN/SYSTEM PRESENCE

VISITOR CAMERA
=
CURATED OBSERVER
```

Exact dimensions and positions must be derived during blockout and Human-reviewed.

---

# 19. VISITOR EXPERIENCE ARC

Preferred narrative grammar:

```text
ENTER
→ sculpture first read
→ cloth appears / approaches
→ shared attention
→ wind becomes legible
→ cloth contacts sculpture
→ collision/deformation becomes hero moment
→ cloth continues / releases
→ settled contemplation
→ visitor continues
```

This is not necessarily a single deterministic collision at a fixed frame.

The experience must preserve the organic quality of the simulation while still creating reliable museum dramaturgy.

Claude must determine whether:

```text
A. physics remains fully continuous/random
B. entry uses seeded/repeatable initial state
C. Museum uses a controlled launch/reset state
```

for reliable Guided Experience.

Do not fake physics with a prerecorded animation unless explicitly authorized.

---

# 20. GUIDE CHOREOGRAPHY

Target Guide grammar:

```text
GUIDE LEADS INTO ROOM
→ GUIDE ORIENTS VISITOR
→ SHARED ATTENTION ON SCULPTURE
→ GUIDE STEPS ASIDE
→ CAMERA / CLOTH BECOME PRIMARY
→ GUIDE DOES NOT OBSTRUCT COLLISION
→ POST-HERO CONTEMPLATION
→ GUIDE CONTINUES ROUTE
```

Guide must not:

- intersect the cloth;
- stand inside the sculpture;
- block the hero collision;
- cause camera ownership conflict;
- repeatedly reset physics;
- remain visually dominant during the key cloth moment.

Guide state must restore coherently on Back/return.

---

# 21. CAMERA CONTRACT

Museum owns camera.

Original Breeze camera and OrbitControls are not product authority for Museum.

Do not port:

```text
Breeze PerspectiveCamera
Breeze OrbitControls
Breeze autoRotate
```

as visitor authority.

Instead, derive Museum beats from the visual experience:

```text
ENTRY
HERO ACQUIRE
SHARED ATTENTION
CLOTH APPROACH
COLLISION VIEW
SETTLED VIEW
EXIT
```

The camera should make the cloth/sculpture relationship readable.

Important:

```text
CAMERA MUST NOT CHASE RANDOM CLOTH MOTION SO AGGRESSIVELY
THAT THE INSTALLATION LOSES SPATIAL STABILITY.
```

Use the room as composition anchor.

---

# 22. GUIDED TOUR / ROUTE CONTRACT

The room must become part of the canonical Guided Experience.

Required route units:

```text
ROOM ENTRY
TOUR STOP
INTERNAL BEATS
HERO MOMENT
SETTLED STOP
ROOM EXIT
```

Do not collapse:

```text
STOP
BEAT
PHYSICS EVENT
PORTAL
ROOM
```

into one concept.

The visitor-facing navigation unit remains a meaningful Tour Stop.

---

# 23. FORWARD + BACK FROM DAY ONE

The room must be designed for both traversal directions.

Required analysis:

```text
PREVIOUS ROOM
→ BREEZE ROOM
→ NEXT ROOM
```

and:

```text
NEXT ROOM
→ BACK
→ BREEZE ROOM
```

At execution time, reconcile the actual Guided Back capability on the current branch.

Room-level state must answer:

```text
WHAT HAPPENS TO CLOTH ON LEAVE?
WHAT HAPPENS ON RETURN?
DOES SIMULATION CONTINUE WHILE ROOM IS INACTIVE?
DOES IT RESET?
DOES IT RESTORE A SNAPSHOT?
DOES THE HERO MOMENT REPLAY?
```

Default preference for first implementation:

```text
LEAVING THE ROOM
→ suspend or deterministically reset according to Museum lifecycle

RETURNING
→ coherent, intentional state
```

Do not let hidden background simulation produce arbitrary return composition unless explicitly desired.

---

# 24. ROOM LIFECYCLE

Claude must map to existing lifecycle rather than invent names.

Required semantics:

```text
PREPARE
ACTIVATE
RUN
SUSPEND
RESTORE / RESET
DEACTIVATE
DISPOSE
```

Breeze resources requiring lifecycle handling may include:

- GPU buffers;
- compute kernels;
- textures;
- video textures;
- canvas textures;
- BVH;
- loaded geometry;
- background media;
- cloth media;
- event subscriptions.

Leaving/re-entering repeatedly must not leak resources.

---

# 25. EXPLORE MODE

The room cannot exist only for Guided mode.

In Explore:

- room renders correctly;
- cloth simulation runs correctly;
- sculpture collision remains active;
- visitor camera remains under Explore authority;
- no Guide assumption crashes runtime;
- authoring media remains visible;
- leaving/re-entering is safe.

The same semantic room record should serve both Guided and Explore representations.

---

# 26. PERFORMANCE CONTRACT

This room is one of the most technically demanding Museum rooms because it combines:

```text
WebGPU compute
cloth geometry
BVH collision
video textures
custom 3D objects
Guide
Museum world rendering
```

Measure before optimizing.

Required metrics where observable:

```text
frame time
FPS
GPU/compute stability
video continuity
cloth simulation continuity
memory growth
re-entry cost
object replacement cost
BVH rebuild cost
```

QA should include:

```text
default Venus + no media
Venus + image cloth
Venus + video cloth
video background + video cloth
replacement object + cloth collision
repeated room enter/leave
```

If V4.1 contains a compatible runtime hardening that solves a measured V4 problem, Claude may propose bounded reuse — but V4 remains product authority.

---

# 27. RESPONSIVE / DEVICE FALLBACK

WebGPU availability must be treated explicitly.

Claude must determine current Museum support policy for:

```text
WebGPU available
WebGPU unavailable
low-performance device
reduced motion
mobile/tablet
```

Do not silently show a broken room.

Possible states:

```text
FULL
REDUCED
STATIC FALLBACK
UNSUPPORTED WITH CLEAR MESSAGE
```

must follow existing Museum product policy.

A fallback is not permission to replace the main experience with a video unless authorized.

---

# 28. ACCESSIBILITY / REDUCED MOTION

Reduced motion must preserve comprehension.

Possible reduced-motion adaptations:

- lower wind intensity;
- slower cloth variation;
- reduced Guide/camera movement;
- no aggressive auto-rotation;
- maintain visible collision cause/effect.

Do not remove all motion if motion is the artwork's core semantic behaviour.

---

# 29. OUTPUT / CAPTURE

V4 includes PNG, WebM and clean-preview concepts.

Museum integration should preserve output capability only where it fits existing architecture.

Do not prioritize standalone export over room integration.

Potential later outputs:

```text
review video
screenshot
clean preview
publish capture
```

are secondary to the live Museum experience.

---

# 30. GITHUB ACTIONS / REPRODUCIBILITY

Escaparates Pro already contains:

```text
.github/workflows/build-breeze-studio-pro.yml
```

That workflow:

- checks out Escaparates Pro;
- checks out the preserved Breeze source at the pinned commit;
- applies the derivative build scripts;
- builds Breeze;
- performs browser/runtime QA;
- installs the built module;
- registers Breeze Studio PRO.

Therefore:

> **DO NOT CREATE A SECOND BREEZE BUILD PIPELINE MERELY TO GIVE CLAUDE ACCESS.**

Claude can read both repositories directly.

GitHub Actions is useful for:

```text
REPRODUCIBLE BUILD
RUNTIME QA
REGRESSION QA
ARTIFACT GENERATION
```

not for basic source visibility.

For the Museum integration, first reuse/inspect the existing workflow and decide whether to:

```text
A. extend it with a Museum-specific non-destructive QA job
B. create an isolated Museum integration QA workflow
C. leave it unchanged
```

No workflow may auto-merge to master.

No new Actions work is required before Claude understands this spec.

---

# 31. IMPLEMENTATION STRATEGY

## PHASE 0 — RECONCILE

Before writing broad product code:

1. read this document in full;
2. read Museum Playbook;
3. inspect current branch;
4. inspect current Museum Scene Kit;
5. inspect current Guided Back state;
6. inspect Breeze Studio PRO V4 at authority commit;
7. inspect pinned Breeze engine source;
8. inspect existing build workflow;
9. map renderer compatibility;
10. map media/persistence compatibility;
11. map room lifecycle;
12. build source/capability map;
13. identify shared global contracts.

Required report:

```text
CURRENT MUSEUM
V4 AUTHORITY
BREEZE DONOR
RENDERER COMPATIBILITY
MEDIA COMPATIBILITY
ROOM LIFECYCLE
ROUTE INSERTION
BACK IMPLICATIONS
RISK MAP
MINIMUM VERTICAL PLAN
GLOBAL OUTCOME STABILITY
```

If the next phase is authorized and safe, continue.

**REPORTING GATE ≠ STOP GATE.**

## PHASE 1 — CAPABILITY EXTRACTION / ADAPTER

Goal:

```text
BREEZE V4 CAPABILITY
runs inside an isolated Museum-compatible adapter
```

Do not integrate route yet.

Prove:

- sculpture;
- cloth;
- wind;
- collision;
- object replacement;
- background;
- cloth image/video.

## PHASE 2 — ROOM BLOCKOUT

Create room spatial container with:

- entry;
- exit;
- sculpture anchor;
- cloth motion envelope;
- camera corridor;
- Guide staging.

No visual polish.

## PHASE 3 — DEFAULT VENUS EXPERIENCE

Integrate the canonical Venus version first.

Prove the hero cloth collision under Museum renderer/lifecycle.

## PHASE 4 — V4 PERSONALIZATION

Reconnect:

- object replacement;
- background image/video;
- cloth image/video;
- grading;
- presets.

Do not rebuild V4 panel wholesale.

Use Museum authoring.

## PHASE 5 — GUIDE + CAMERA

Add semantic choreography.

## PHASE 6 — ROUTE / GUIDED

Insert room additively into route.

No global route rewrite.

## PHASE 7 — BACK / RETURN

Prove coherent return according to current global Back semantics.

## PHASE 8 — EXPLORE

Prove free visitor behaviour.

## PHASE 9 — PERFORMANCE

Stress WebGPU + media + custom object.

## PHASE 10 — VISUAL QA

Matched storyboard / video.

## PHASE 11 — FRESH CRITIC

Read-only.

## PHASE 12 — HUMAN QA

One navigable runtime.

---

# 32. VISUAL / TEMPORAL STORYBOARD

Minimum functional evidence moments:

```text
B01 — ROOM ENTRY
B02 — SCULPTURE FIRST READ
B03 — CLOTH ENTERS VISUAL FIELD
B04 — GUIDE SHARED ATTENTION
B05 — GUIDE STEPS ASIDE
B06 — CLOTH APPROACHES SCULPTURE
B07 — FIRST CONTACT
B08 — MAXIMUM DEFORMATION / HERO COLLISION
B09 — CLOTH RELEASES / SLIDES / PASSES
B10 — RECOVERY
B11 — SETTLED VIEW
B12 — EXIT
B13 — RETURN / RESTORED STATE
```

Each frame/state must have a purpose.

Temporal evidence must show the whole causal chain.

A still screenshot cannot prove cloth collision.

---

# 33. REQUIRED QA MATRIX

## Core physics

- [ ] cloth initializes
- [ ] wind applies
- [ ] cloth remains stable
- [ ] cloth collides with active object
- [ ] no NaN/Infinity
- [ ] no catastrophic stretching
- [ ] reset/re-entry stable

## Sculpture

- [ ] Venus default
- [ ] template replacement
- [ ] uploaded object
- [ ] visual geometry correct
- [ ] BVH rebuilt
- [ ] collision matches new object

## Cloth media

- [ ] default
- [ ] image
- [ ] video
- [ ] opacity
- [ ] brightness
- [ ] contrast
- [ ] saturation
- [ ] scale/position

## Background

- [ ] default
- [ ] image
- [ ] video
- [ ] scale
- [ ] position

## Dual media

- [ ] video background + image cloth
- [ ] image background + video cloth
- [ ] video background + video cloth where supported

## Guided

- [ ] entry
- [ ] Guide
- [ ] camera
- [ ] hero moment
- [ ] settled stop
- [ ] next
- [ ] back/return

## Explore

- [ ] enter
- [ ] observe
- [ ] leave
- [ ] re-enter

## Lifecycle

- [ ] suspend
- [ ] restore/reset
- [ ] no duplicate simulation
- [ ] no media leak
- [ ] no GPU resource leak evident

---

# 34. VISUAL ACCEPTANCE

The room is not approved because physics runs.

Judge:

- sculpture scale;
- sculpture material;
- cloth scale;
- cloth material;
- cloth-media readability;
- wind believability;
- contact quality;
- collision silhouette;
- cloth wrapping/glancing response;
- temporal continuity;
- background hierarchy;
- Guide placement;
- camera composition;
- room architecture;
- final contemplation image.

Examples:

```text
BVH works but cloth visibly floats above sculpture
= FAIL

video plays but cloth becomes an unreadable rectangle
= FAIL

physics is correct but Museum camera misses collision
= FAIL

custom sculpture renders but cloth still collides with Venus
= FAIL

room works forward but return produces incoherent simulation state
= FAIL
```

---

# 35. FRESH CRITIC CONTRACT

Fresh critic receives:

- V4 authority description;
- canonical/default Breeze visual reference;
- real Museum capture;
- acceptance matrix;
- no builder history unless essential.

Questions:

```text
1. Does this read as a museum installation?
2. Is the sculpture clearly the central anchor?
3. Does the cloth feel like fabric?
4. Is the wind believable?
5. Is contact with the sculpture convincing?
6. Does collision feel physical rather than clipped?
7. Is media on cloth readable without destroying fabric perception?
8. Does background support rather than flatten the room?
9. Does Guide help rather than compete?
10. Does camera reveal the hero event?
11. Does the room feel native to Museum?
12. Is any standalone Breeze Studio shell visible?
13. Does return/re-entry feel coherent?
14. Did any existing Museum surface regress?
```

Verdict:

```text
KEEP
ADJUST
REJECT
```

Agent KEEP ≠ Human Approval.

---

# 36. HUMAN QA PACKAGE

Claude must provide:

```text
branch
commit
tree status
exact runtime URL
known limitations
exact Human test path
```

Human test:

```text
TEST 1 — ENTER
Judge room / sculpture first read.

TEST 2 — CLOTH
Watch full wind → approach → collision → recovery.

TEST 3 — CAMERA
Judge whether hero collision is clearly visible.

TEST 4 — GUIDE
Judge whether Guide supports or obstructs.

TEST 5 — BACKGROUND
Switch/test one image or video background if authoring is ready.

TEST 6 — CLOTH MEDIA
Test image or video on cloth.

TEST 7 — SCULPTURE
Replace Venus with one V4 object and confirm real collision.

TEST 8 — ROUTE
Continue forward.

TEST 9 — BACK
Return as supported and inspect room state.

TEST 10 — RE-ENTER
Confirm no broken/reset/leak state.
```

---

# 37. REGRESSION FREEZE

This mission does not authorize changes to unrelated Museum systems.

Do not modify unless proven necessary:

```text
Gallery A layout
existing artwork placements
existing approved stops
current Human-preferred Crossing B appearance
unrelated portal shaders
P0.1 Visitor Authoring
P0.3 VISITA path
Project Cloud architecture
Publish
unrelated Studio UI
master
```

Any shared contract change requires:

```text
why required
scope
alternatives
global impact
evidence
rollback
```

---

# 38. CONTINUATION RULE

Mandatory:

> **REPORTING GATE ≠ STOP GATE.**

Claude continues when the next step is:

- defined;
- authorized;
- bounded;
- globally stable.

Stop only for:

```text
REAL HUMAN DECISION
REAL EXTERNAL BLOCKER
GLOBAL OUTCOME INSTABILITY
GENUINE HUMAN QA
```

If one workstream blocks:

```text
A BLOCKED WORKSTREAM
≠
GLOBAL STOP
```

Evaluate other authorized work.

But:

```text
LOCAL INDEPENDENCE IS NOT ENOUGH.
CONTINUATION REQUIRES GLOBAL OUTCOME STABILITY.
```

---

# 39. PROHIBITED SHORTCUTS

Do not:

- use `rope-gallery`;
- implement rope dragging;
- rebuild the cloth solver;
- replace Verlet with a generic library without proof;
- replace BVH collision with fake bounding-box collision;
- visually replace sculpture without rebuilding collider;
- collapse cloth video into flat screen media;
- port Breeze OrbitControls as Museum camera;
- create a second uncontrolled render loop;
- duplicate Museum asset persistence;
- expose raw solver internals in normal authoring;
- rewrite route globally;
- change Crossing B appearance;
- claim collision from static screenshots;
- claim Museum integration from standalone Breeze preview;
- merge master;
- auto-merge through Actions;
- stop merely to deliver an intermediate report.

---

# 40. REQUIRED SOURCE MAP

Before broad implementation Claude must return:

| Capability | Product Authority | Engine Donor | Museum Owner | Action |
|---|---|---|---|---|
| Cloth product behaviour | Breeze Studio PRO V4 | Breeze | Breeze Room Adapter | REUSE/ADAPT |
| Verlet physics | V4 | Breeze | Breeze Core | REUSE |
| Wind | V4 | Breeze | Breeze Core | REUSE/CONFIGURE |
| Collision | V4 | Breeze BVH | Breeze Core | REUSE |
| Sculpture replacement | V4 | Breeze loaders/BVH | Museum Authoring + adapter | RECONNECT |
| Background image/video | V4 | V4 implementation | Museum Authoring/media | RECONNECT |
| Cloth image/video | V4 | V4 implementation | Museum Authoring/media | RECONNECT |
| Grading | V4 | V4 implementation | Museum Authoring | REUSE |
| Camera | Museum | none | Director | MUSEUM AUTHORITY |
| Guide | Museum | none | Guide | MUSEUM AUTHORITY |
| Route | Museum | none | Director/Route | EXTEND |
| Back | Museum current G1B | none | Director | EXTEND/RECONCILE |
| Assets/persistence | Museum Project Cloud | none | Museum | RECONNECT |
| QA | Museum Playbook | V4 QA reference | Museum QA | EXTEND |

---

# 41. SUCCESS DEFINITION

Success is:

```text
The visitor enters a native Museum room.

A central sculpture anchors the space.

A cloth moves through wind with convincing physical behaviour.

The cloth reaches and visibly collides with the actual sculpture.

The moment is readable through Museum camera and Guide choreography.

The installation remains configurable:
object, background, cloth media and V4 visual controls.

The room works in the Museum route,
can be left and revisited coherently,
and does not reveal the boundaries of the standalone Breeze product.

The visitor experiences an artwork.
The author controls a platform.
The engine remains reusable.
```

---

# 42. PRE-IMPLEMENTATION CHECKLIST

Before broad code changes:

- [ ] this spec approved by Juanma
- [ ] current Museum branch reconciled
- [ ] Playbook read
- [ ] V4 authority commit inspected
- [ ] pinned Breeze source inspected
- [ ] existing Breeze build workflow inspected
- [ ] renderer compatibility determined
- [ ] WebGPU implications determined
- [ ] room lifecycle mapped
- [ ] camera ownership mapped
- [ ] Guide integration mapped
- [ ] route insertion mapped
- [ ] current Back semantics mapped
- [ ] V4 media semantics mapped to Museum assets
- [ ] V4 object replacement mapped to Museum authoring
- [ ] regression freeze listed
- [ ] evidence plan defined
- [ ] Global Outcome Stability assessed

If green:

```text
CONTINUE AUTONOMOUSLY
UNTIL THE NEXT GENUINE HUMAN GATE.
```

---

# 43. FINAL DELIVERY FORMAT

At the next genuine Human Gate:

```text
MUSEUM BREEZE ROOM:
<KEEP / ADJUST / REJECT>

BREEZE STUDIO PRO V4 AUTHORITY:
PRESERVED / VIOLATED

VERLET PHYSICS:
<PASS / ADJUST / FAIL>

WIND:
<PASS / ADJUST / FAIL>

SCULPTURE:
<PASS / ADJUST / FAIL>

BVH COLLISION:
<PASS / ADJUST / FAIL>

OBJECT REPLACEMENT + COLLIDER:
<PASS / ADJUST / FAIL>

BACKGROUND IMAGE/VIDEO:
<PASS / ADJUST / FAIL>

CLOTH IMAGE/VIDEO:
<PASS / ADJUST / FAIL>

V4 GRADING:
<PASS / ADJUST / FAIL>

GUIDE:
<PASS / ADJUST / FAIL>

CAMERA:
<PASS / ADJUST / FAIL>

FORWARD ROUTE:
<PASS / ADJUST / FAIL>

BACK / RETURN:
<PASS / PARTIAL / BLOCKED / FAIL>

EXPLORE:
<PASS / ADJUST / FAIL>

AUTHORING:
<PASS / PARTIAL / BLOCKED>

PERFORMANCE:
<PASS / ADJUST / FAIL>

FRESH CRITIC:
<KEEP / ADJUST / REJECT>

HUMAN QA:
PENDING

PRODUCT APPROVAL:
PENDING

MASTER:
UNTOUCHED
```

---

# 44. DRAFT STATUS

```text
JUANMA REVIEW:
APPROVED

REPOSITORY UPLOAD:
AUTHORIZED / ACTIVE

CLAUDE EXECUTION FROM THIS DOCUMENT:
AUTHORIZED SUBJECT TO PLAYBOOK / GLOBAL OUTCOME STABILITY

PREVIOUS ROPE DOCUMENT:
DISCARDED

PRIMARY AUTHORITY:
BREEZE STUDIO PRO V4

MASTER:
UNTOUCHED
```
