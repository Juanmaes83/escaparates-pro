# Immersive Worlds — Module Context & Working Constitution

> **Status:** context / architecture document only. No runtime implementation is authorized by this document.
>
> **Repository:** `Juanmaes83/escaparates-pro`
>
> **Date:** 2026-08-09
>
> **Current product baseline:** `master` at `bdf4cd77c9a1861447f4edd563a733925203506e`, where Casebook PRO V4 — Fashion Pearl Spatial World is already merged inside **Boards**.

---

## 0. Why this document exists

This file is the canonical continuity document for the next phase of Escaparates Pro: a new, isolated module provisionally named **Immersive Worlds**.

It exists so a new developer, agent, or conversation can recover the global context without guessing, mixing systems, or rebuilding decisions already made.

**If anything is unclear, stop and ask Juanma. Do not go blind.** Before implementing, inspect this repository, read the relevant README and architecture documents, and verify the current branch / SHA / existing modules.

---

# 1. Non-negotiable working rules

These rules override convenience.

1. **Clone first, test locally, then publish.** Development must begin from a fresh clone / verified checkout of the intended base.
2. **Never develop directly on `master`.** Use an isolated branch.
3. **Never merge to `master` without Juanma's explicit approval after visual review.**
4. **Never touch something that already works unless Juanma explicitly authorizes it.**
5. **Never delete an existing module, file, behavior, or validated capability unless Juanma explicitly requests it.**
6. **Prefer additive architecture.** New modules, adapters, registries, routes, styles, and runtimes should be isolated from validated systems.
7. **Do not silently refactor shared/global code to make the new module easier.** If a shared change becomes genuinely necessary, stop, explain why, show the impact, and ask first.
8. **Protect Casebook V1/V2/V3/V4 and all existing Escaparates Pro modules.** Immersive Worlds is a sibling product module, not a rewrite of Boards.
9. **No blind implementation.** If repository state, architecture, naming, ownership, or intended behavior is uncertain: inspect first; if still uncertain, ask.
10. **Visual claims require real browser evidence.** A build passing is not enough for a visual/immersive feature. Use local browser QA, screenshots/video, Playwright where useful, and human review.
11. **A preview link is part of every important visual milestone.** Human approval is the merge gate.

---

# 2. Product separation: Boards vs Immersive Worlds

## Boards

Boards remains the home for connected visual workspaces and Casebook.

Existing Casebook evolution includes:

- Casebook V1 — connected board
- Casebook V2 — spatial storytelling / Board → Story → Presentation → Recording
- Casebook V3 — experimental spatial-world concepts
- Casebook PRO V4 — Fashion Pearl Spatial World

**Casebook V4 is complete enough to preserve and has already been merged. Development on the Fashion vertical is paused.**

Do not use the internal compromises of Casebook V4 as mandatory architecture for the new module.

## Immersive Worlds

Immersive Worlds is a **new sibling module** inside Escaparates Pro.

It is not a board and must not be implemented as another layer inside Casebook.

Its product goal is:

> **A system for building, exploring, connecting, directing, narrating and publishing interactive spatial worlds on the web.**

Conceptually:

```text
ESCAPARATES PRO
│
├── Effects
├── Scroll Sections
├── Web Modules
├── Blueprints
├── Source Labs
├── Boards
│   └── Casebook V1 / V2 / V3 / V4
│
└── Immersive Worlds
    └── independent world engine + authoring + experience system
```

---

# 3. What we are building

Immersive Worlds should ultimately support reusable verticals such as:

- Museum / Institutional
- Fashion
- Real Estate / Architecture
- Product Showroom
- Education
- Brand Experience
- Story Worlds
- Heritage / Archive

The product must not become "a collection of bespoke Three.js demos".

The intended formula is:

```text
IMMERSIVE WORLDS
=
WORLD ENGINE
+
AUTHORING ENGINE
+
EXPLORE SYSTEM
+
EXPERIENCE DIRECTOR
+
SCENE KITS
+
QUALITY SYSTEM
```

The user should not need to program Three.js to build a world.

Target authoring flow:

```text
1. CREATE WORLD
2. ADD SPACES
3. ADD CONTENT / HOTSPOTS
4. CONNECT / BUILD ROUTE
5. EXPERIENCE / PRESENT
```

Example:

```text
Create World → Museum
Add Space → Gallery A
Add Content → Artwork / Sculpture / Video / Audio
Place → Wall / Floor / Plinth / Free
Add Hotspot → Info / Media / Portal / Story / Action
Add Space → Gallery B
Connect → Portal
Build Route
Explore / Guided Tour / Present / Record
```

---

# 4. Core architecture principle: semantic data ≠ visual representation

The engine must model meaning independently from rendering.

Canonical semantic concepts should include at least:

- World
- Space
- Entity
- Content
- Artwork
- Product
- Document
- Annotation
- Hotspot
- Portal
- Route
- Story Step
- Camera Shot
- Audio Cue

The same entity may have different representations:

```text
ARTWORK
├── World representation → framed work on wall
├── Focus representation → artwork + metadata
└── Story representation → cinematic composition
```

Scene Kits decide how semantic content is presented; they must not redefine the underlying data model.

---

# 5. Mandatory experience modes

## Explore Mode

The visitor controls movement and discovery.

```text
VISITOR
→ SPACE
→ APPROACH OBJECT
→ PROXIMITY
→ FOCUS
→ INSPECT
→ RETURN
```

Potential navigation profiles:

- first-person
- orbit
- minimal avatar
- custom avatar
- no avatar / camera-only

## Guided Experience

The author/director controls the experience.

```text
CHAPTER
→ CAMERA SHOT
→ CONTENT
→ NARRATION / AUDIO
→ TRANSITION
→ NEXT SPACE
```

Explore Mode and Guided Experience must operate over the **same World State**.

**Author Mode and Experience Mode must remain separate.**

- Author Mode: camera belongs to the user/editor.
- Experience Mode: camera may belong to the Experience Director.

This separation is a direct lesson from Casebook V4 and must not be blurred again.

---

# 6. First native template: Museum / Institutional

The first native Immersive Worlds template will be **Museum / Institutional**.

This is intentional because it forces the engine to solve the fundamental problems before specializing into Fashion or Real Estate.

The template must be reusable for:

- museums
- temporary exhibitions
- foundations
- institutional archives
- cultural organizations
- universities
- heritage centers
- corporate heritage
- private collections

Initial prototype should be **small but complete**, not large and shallow.

Suggested world:

```text
Lobby
↓
Gallery A
↓
Portal
↓
Gallery B
↓
Archive / Closing
```

Suggested content:

- 6 artworks
- 1 sculpture
- 1 video
- 1 audio object
- curatorial labels / metadata

Required capabilities:

- spatial placement
- proximity
- focus mode
- camera focus
- portal
- free exploration
- guided route
- ambience
- world map
- responsive behavior
- asset lifecycle
- performance tiers
- accessible metadata

Suggested visual profiles on the same architecture:

- White Cube
- Dark Exhibition
- Heritage
- Sculpture Gallery

---

# 7. Repository knowledge base — CORE

The following repositories are not a random inspiration list. Each has an explicit role.

## `Juanmaes83/Claude-of-Duty`

**Role:** engine architecture, deterministic runtime discipline, subsystem boundaries, performance and reproducible QA.

Extract:

- subsystem contracts
- ownership boundaries
- dependency lifecycle
- event vocabulary
- world/player/camera state separation
- deterministic RNG
- resource disposal
- quality budgets
- shader prewarm
- performance profiling
- reproducible capture / image diff / playtest methodology

Do **not** copy shooter-specific systems as product requirements.

## `Juanmaes83/threejs-game-skills`

**Role:** orchestration, Three.js gameplay/navigation patterns, graphics quality, debugging and QA.

Extract:

- camera/input/navigation practices
- performance and render budgets
- visual QA
- Playwright / canvas checks
- deterministic test states
- graphics scorecards
- mobile verification
- asset/audio generation workflows where appropriate

Future adaptation target: an `immersive-world-director` workflow, not a game director UI.

## `Juanmaes83/threejs-journey`

**Role:** Three.js foundation reference.

Extract:

- cameras
- materials
- lights
- loaders
- raycasting
- shadows
- PBR
- environments
- performance fundamentals

## `Juanmaes83/Threejs-Awesome-Graphics-Agent-Skills`

**Role:** technical-art quality.

Extract:

- materials
- lighting
- camera
- shader patterns
- rendering quality

## `Juanmaes83/portfolio-itom-and-advanced-WebGL`

**Role:** production-grade room architecture and performance.

This is a critical reference for the first Museum/Institutional template.

Extract:

- RoomWarmup
- asynchronous shader compilation
- room lifecycle
- room manager / corridor pattern
- adaptive device tiering
- dynamic DPR
- baked-lighting strategies
- asset loading discipline
- WebGL/React performance separation
- semantic DOM fallback

Influences directly:

- `QualityManager`
- `AssetManager`
- `RoomLifecycle`
- `PrewarmManager`
- `DeviceTierManager`

---

# 8. Repository knowledge base — first Museum / Institutional template

## `Juanmaes83/artwork-3D-museum`

**Priority: critical for Template V1.**

Extract:

- `Room` abstraction
- `Frame` / artwork component
- `CameraManager`
- floor / ceiling / lighting structure
- spotlight grouping
- responsive framing
- modern R3F organization

Especially important: its camera logic derives a focus pose from the artwork's world position and front direction. This is a strong conceptual basis for:

```text
CONTENT ENTITY → FOCUS MODE → CAMERA FOCUS
```

## `Juanmaes83/3D-art-gallery-threejs`

**Priority: critical learning/reference repository.**

Extract:

- gallery architecture
- walls / floor / ceiling
- materials / textures
- artwork placement
- statues / models
- navigation
- lighting fundamentals

Important: study its **commit history**, not only the final snapshot, because the step-by-step evolution is useful for understanding dependencies and safe construction order.

## `Juanmaes83/3DArtMuseum`

**Role:** data-driven museum authoring concept.

Its simple `addToLeft / addToRight / addToFront / addToBack` API is old, but the underlying idea is valuable: content should be parameterized data, not hardcoded scene logic.

Target evolution:

```text
Artwork {
  id,
  title,
  artist,
  year,
  media,
  dimensions,
  placement,
  scale,
  audio,
  description,
  hotspot,
  focusMode,
  spotlightProfile
}
```

## `Juanmaes83/vortex-gallery`

**Role:** gallery/content experience layer.

Extract:

- catalog organization
- metadata
- multilingual structure
- gallery UX
- navigation
- conversion/content patterns

---

# 9. Repository knowledge base — storytelling / experience

## `Juanmaes83/kage` + `MengTo/skills`

Kage is a reference for architecture/experience, **not for Japanese visual styling**.

Extract from Kage:

- one continuous world
- chapters
- camera travel
- layered depth
- procedural environment ideas
- hybrid 3D + 2D image composition
- atmosphere
- chapter handoffs

Review licensing before copying any code/assets.

From `MengTo/skills`, prioritize relevant skills such as:

- `threejs`
- `scroll-world-storytelling`
- `cinematic-scroll-storytelling`
- `gsap-scrolltrigger-storytelling`
- `cinematic-gsap-lenis-motion-system`
- `webgl-landing-steering`
- `optimize-web-animations`
- `animation-systems`
- `scroll-scrubbed-visual-sequence`
- `editorial-portfolio-chapters`

Core lesson:

```text
ONE CONNECTED WORLD
+
CAMERA
+
STORY BEATS
+
REVERSIBLE NAVIGATION
+
QA
```

## `Juanmaes83/a-long-expected-party`

**Role:** Experience Director / timeline / audio transport.

Extract:

- play / pause / restart / seek
- chapter transport
- timed cues
- ambient audio
- narration synchronization
- timeline-driven experience

## `Juanmaes83/gsap-threejs-codrops`

**Role:** motion and handoff language.

Extract:

- GSAP timelines
- camera + DOM synchronization
- editorial/cinematic transitions

## `Juanmaes83/webGLImageTransitions`

**Role:** portal/scene transition research.

Extract:

- texture transitions
- displacement
- masks
- scene handoffs

---

# 10. Repository knowledge base — navigation / graph / future verticals

## `Juanmaes83/threejs-procedural-dungeon`

Do not use dungeon aesthetics.

Extract:

- room graph
- connectivity
- procedural layout
- deterministic world structure
- navigation
- instancing

## `Juanmaes83/-threejs-evidence-graph`

Do not use detective visual language.

Extract:

- node/relationship architecture
- spatial graph
- connection rendering
- graph performance

## `Juanmaes83/img2threejs`

**Role:** spatial decomposition methodology.

Useful build sequence:

```text
SPEC
→ BLOCKOUT
→ STRUCTURE
→ FORM
→ MATERIAL
→ LIGHTING
→ INTERACTION
→ OPTIMIZATION
```

## `Juanmaes83/camera-3D-showroom`

**Role:** future Product/Showroom Scene Kit.

Extract:

- hero product presentation
- orbit/detail behavior
- model/context composition
- product-led interaction

Do not reuse third-party product branding/assets without appropriate rights.

## `Juanmaes83/3d-web`

**Role:** avatar / R3F / Rapier / HDR / model animation patterns.

Useful for future Player Representation:

- none
- first-person
- orbit
- minimal avatar
- custom avatar
- guide character

## `Juanmaes83/3D-ai-school-threejs`

**Role:** future optional AI Guide subsystem.

Extract:

- 3D character/avatar
- AI conversation
- voice input/output
- context/history
- embodied guide concept

Potential future roles:

- museum curator
- institutional archivist
- real-estate concierge
- teacher
- fashion creative guide

This is **not mandatory for V1**, but the architecture should not block it.

---

# 11. Quality methodology — Gauntlet Loop

Relevant repositories:

- `Juanmaes83/gauntlet-loop`
- `Juanmaes83/gauntlet-loop-aim-prompt-skill`
- `Juanmaes83/Claude-of-Duty` as a real-world application of the method

The general Gauntlet Loop is the main quality-iteration model.

```text
GOAL
↓
NAMED, FETCHABLE, COMPARABLE QUALITY BAR
↓
BUILDER
↓
SEPARATE HARSH CRITIC
↓
BLIND A/B
↓
OURS LOSES?
↓
ITERATE
↓
OURS WINS
↓
HUMAN REVIEW
```

Rules:

- builder does not judge itself
- critic gets fresh context
- critic compares real outputs
- prefer binary comparison over flattering 8.x/10 scores
- no arbitrary fixed number of rounds
- reference must be named, fetchable and comparable

Suggested bars by subsystem:

- scenography / luxury → Cartier-type world experience
- free exploration → TheVertMenthe
- continuous world / chapter camera → Kage
- timeline / audio → A Long Expected Party
- museum focus/navigation → artwork-3D-museum + TheVertMenthe
- performance / runtime → Claude-of-Duty + ITom patterns
- product showroom → high-end product WebGL references + camera-3D-showroom patterns

Do not claim to be "Cartier-level", "AAA", or "premium" without visual evidence and comparison.

---

# 12. Quality methodology — Unslop

Relevant repositories:

- `Juanmaes83/unslop`
- upstream `mshumer/unslop`
- upstream `skills/unslop/SKILL.md`

Unslop is important because a technically correct immersive world can still look like generic AI output.

We intend to create domain-specific visual anti-slop profiles, for example:

- `immersive-worlds`
- `museum-institutional`

The profile should primarily identify **what to avoid**, not impose one replacement stock style.

Patterns to detect/reject may include:

- generic floating rounded cards
- gratuitous glassmorphism
- cyan/purple "AI" gradients
- pointless neon
- meaningless particles
- random cubes/diamonds/orbs
- fake futuristic HUDs
- everything centered
- hero sphere + generic headline
- identical spotlight grids
- empty oversized rooms without composition
- repetitive pedestals
- generic typography layouts
- flat/unconvincing materials
- uniform lighting

For visual runs, use real screenshots / before-after comparisons and Playwright where appropriate.

---

# 13. Proposed system map — not yet implementation-approved

This is the current working architecture and must be reviewed during IW-0 before coding.

```text
IMMERSIVE WORLDS ENGINE

core/
  Runtime
  Clock
  EventBus
  Registry
  Lifecycle
  DeterministicRNG
  QualityManager

world/
  WorldGraph
  SpaceManager
  EntityRegistry
  WorldState
  Persistence

render/
  Renderer
  Materials
  Lighting
  Environment
  PostProcessing
  QualityTiers

assets/
  AssetManager
  Loader
  Cache
  Prewarm
  Dispose

navigation/
  FirstPerson
  Orbit
  Avatar
  Collision
  NavMesh
  Proximity

camera/
  FreeCamera
  CinematicCamera
  FocusCamera
  ShotSystem
  CameraTrack

interaction/
  Raycasting
  Hotspots
  Portals
  Focus
  Actions
  ProximityVolumes

content/
  Artwork
  Sculpture
  Image
  Video
  Audio
  Document
  Text
  3DObject
  Character

experience/
  Chapters
  Timeline
  Transport
  Story
  GuidedTour
  AudioTrack
  Narration

authoring/
  WorldEditor
  SpaceEditor
  ContentPlacement
  Inspector
  WorldMap
  RouteEditor

ui/
  AuthorUI
  ExperienceUI

qa/
  DeterministicStates
  Playwright
  BaselineCapture
  ImageDiff
  PerformanceProfile
  Unslop
  Gauntlet

optional/
  AIGuide
  Voice
  GenerativeWorlds
```

---

# 14. Space lifecycle

Inspired especially by production-oriented WebGL room management:

```text
UNLOADED
→ PRELOADING
→ WARMING
→ READY
→ ACTIVE
→ COOLING
→ DISPOSED
```

Do not keep every heavy room active indefinitely.

Working target:

```text
current space
+
next likely space
+
optional previous space
```

The exact lifecycle and cache policy belongs to IW-0 and must be performance-tested before becoming a contract.

---

# 15. Proximity and hotspots

A hotspot is a semantic interaction, not necessarily a floating icon.

Possible data:

```text
interactionVolume
triggerDistance
focusDistance
visualPolicy
action
target
```

Example states:

```text
far → invisible
near → subtle affordance
focus → information available
active → detail/focus mode
```

Potential hotspot types:

- INFO
- MEDIA
- PORTAL
- ACTION
- STORY

---

# 16. World Map

World Map represents the World Graph, not just a decorative minimap.

Example:

```text
Gallery A ─── Gallery B
    │             │
 Archive       Film Room
    │
Sculpture Court
```

A visitor may:

- navigate physically
- use the map
- teleport where allowed
- follow a Guided Tour

Authoring should distinguish the complete World Map from a particular Guided Route.

---

# 17. Performance and accessibility are architecture, not polish

Immersive Worlds must account from the beginning for:

- desktop and mobile tiers
- adaptive DPR / quality
- asset preloading
- shader/material warmup where needed
- lazy room activation
- resource disposal
- reduced motion
- keyboard/navigation alternatives where feasible
- content metadata outside the canvas
- semantic fallback for institutional/museum content
- readable focus/detail modes
- audio controls / mute
- captions/transcripts for narration where used

Do not postpone all of this until visual completion.

---

# 18. Immediate next phase: IW-0 — Engine Constitution

**Do not begin production implementation before IW-0 is reviewed with Juanma.**

IW-0 must define at minimum:

1. Product definition and boundaries
2. Engine vs Scene Kit vs Authoring vs Experience responsibilities
3. Subsystem architecture
4. Lifecycle contract
5. Event vocabulary
6. World schema
7. Space schema
8. Entity/content schema
9. Hotspot schema
10. Portal schema
11. Camera contract
12. Explore navigation contract
13. Experience Director contract
14. Timeline/audio contract
15. Scene Kit contract
16. Asset lifecycle
17. Performance/quality budgets
18. Device tiers
19. Accessibility contract
20. Deterministic QA strategy
21. Unslop protocol
22. Gauntlet Loop protocol
23. Named quality bar for each subsystem
24. Museum/Institutional Template V1 specification
25. Phased implementation roadmap
26. Explicit repository → subsystem mapping with rationale and licensing/risk notes

IW-0 should resolve contradictions and tradeoffs before code exists.

---

# 19. Rules for any new agent / conversation

Before acting:

1. Read this document completely.
2. Inspect `README.md` in Escaparates Pro.
3. Inspect relevant files under `docs/architecture/`.
4. Verify the latest `master` SHA and open branches/PRs.
5. Verify Casebook V4 remains intact.
6. Review the actual source repos relevant to the subsystem being discussed; do not rely only on their names.
7. Check licensing before copying code/assets.
8. If there is ambiguity, **ask Juanma**.
9. Do not start implementing because a concept sounds obvious.
10. Never merge without Juanma's explicit visual approval.

**Never go blind.**

---

# 20. Definition of success

The first success is **not** "a museum Three.js demo".

Success is a reusable system where the first Museum/Institutional World proves that the same engine can later support:

```text
Museum
Institution
Fashion
Real Estate
Showroom
Education
Brand Experience
Story Worlds
```

without rebuilding the engine for each vertical.

The first template proves the architecture; it does not define the limits of the product.

---

## Guiding sentence

> **Immersive Worlds is not a 3D website. It is a system for building, exploring, connecting, directing, narrating and publishing interactive worlds.**
