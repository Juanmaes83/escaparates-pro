# MUSEUM — CHARACTER / AVATAR 2027 SURGERY ROADMAP

**Status:** APPROVED / ACTIVE  
**Purpose:** recover the best existing Character 2027 / Avatar capabilities from proven donor repositories, preserve them intact, then graft them into the current Museum without regressing the frozen four-room line.

---

## 0. NON-NEGOTIABLE BASELINE

### Museum host / source of truth

Repository: `Juanmaes83/escaparates-pro`  
Integration line: `claude/museum-itinerant-living-art-graft-v1`  
Character surgery branch: `chatgpt/museum-character-2027-integration-v1`

The Character branch is created from the frozen Museum integration line containing:

- Gallery A — PASS
- Gallery B — PASS
- Wet Paint — HUMAN PASS
- Breeze Studio PRO — HUMAN PASS
- Breeze SAVE / EXIT / RE-ENTRY / ROUTE — PASS
- Breeze panel hide/show — integrated

**Rule:** Character/Avatar work must never require rebuilding or weakening those four rooms.

---

# 1. SURGERY PRINCIPLE

We do **not** recreate Character 2027.

We do **not** copy fragments and immediately edit them.

We first bring the donor stones **whole and frozen**, preserving their original provenance. Then Museum-specific adapters/wrappers perform the surgery around them.

```text
DONOR ORIGINALS
CharacterStudio + VECINIA-WORLDS
        │
        │ exact frozen stones
        ▼
CHARACTER DONOR FREEZE
        │
        │ adapters / wrappers / seams
        ▼
MUSEUM SURGERY
        │
        ▼
CHARACTER 2027 / AVATAR
alive inside Museum
```

The donor freeze is an archaeological reference and rollback source. Adaptations belong outside the frozen stones whenever possible.

---

# 2. APPROVED DONOR MAP

## DONOR A — CharacterStudio

Repository: `Juanmaes83/CharacterStudio`  
Primary branch: `agent/character-2027-terrain-semantic-01`  
Frozen reference SHA: `f5a93a48ed0e3904fce58f08f7fbe08b5411b289`

### PIEDRA 1 — Character Runtime

Bring the complete dependency closure required for:

- `CharacterActionAPI`
- `MotionController`
- `MotionFoundationV2`
- `MotionFoundationV2Extra`
- `SocialMotionFoundationV3`
- `BoneMap`
- `Retargeter`
- `LookAt`
- `IK`

Also preserve the relevant source knowledge from:

- `Create.jsx`
- `Appearance.jsx`
- `MotionLab.jsx`

These UI pages are **knowledge donors**, not visitor runtime.

### CharacterStudio authority

CharacterStudio remains PRIMARY for:

- body / rig
- animation ownership
- motion semantics
- retargeting
- LookAt / IK
- CharacterActionAPI
- Avatar creation / appearance knowledge

---

## DONOR B — VECINIA-WORLDS

Repository: `Juanmaes83/VECINIA-WORLDS`  
Primary branch: `feat/sculpture-navigation-character-v1`

### PIEDRA 2 + supporting stones — bring WHOLE

Preserve this complete family exactly before adaptation:

```text
visual/src/character2027/runtime/

ExteriorCharacterPilot.js
MuseumCharacterRuntimeAdapter.js
PropertyRoomCharacterCapabilityBatches.js
PropertyRoomCharacterCinematicCamera.js
PropertyRoomCharacterFreeMobility.js
PropertyRoomCharacterTourBridge.js
PropertyRoomSemanticAuthoring.js
PropertyRoomSemanticAuthoringBridge.js
exterior-pilot-skeleton.js
full-world-c2-skeleton.js
```

### Critical stone

`MuseumCharacterRuntimeAdapter.js`

This is the most important seam because it was already created to connect Character 2027 to the inherited Museum runtime.

### PIEDRA 3 — Free Mobility

`PropertyRoomCharacterFreeMobility.js`

Its governing principle must survive the graft:

```text
Room owns collision.
Character owns body/actions.
CameraAuthority remains unique.
```

Museum must remain authority for:

- `WorldStore`
- `SceneKit`
- `ExploreController`
- `navigationVolume`
- `CameraAuthority`

**Do not introduce a second collision engine, second WorldStore, second navigation authority or second camera authority.**

---

## DONOR C — WORLD-COSTA-BLANCA

Repository: `Juanmaes83/WORLD-COSTA-BLANCA`

Status: **SECONDARY DONOR / genealogy only unless new code evidence changes this assessment.**

Deep audit found no proven Character 2027 runtime integration in `feat/surgery-phase5-avatar-rubik-navigation-v1` comparable to the VECINIA implementation.

Retain it as useful knowledge for:

- world → property → room transitions
- host/guest lifecycle
- Studio / Property Room integration
- context return
- authoring / save/apply patterns

It is not currently PRIMARY for the Character runtime.

---

# 3. PIEDRA 4 — AVATAR PROFILE CONTRACT

Create a canonical Museum-facing profile only after the Character runtime exists inside Museum.

Initial approved shape:

```js
avatarProfile = {
  asset,
  scale,
  grounding,
  rigStatus,
  motionSet,
  lookAt,
  ik,
  semanticActions,
  validationStatus
}
```

Keep the first contract intentionally small. Add provenance/version fields only when real runtime needs prove they are necessary.

---

# 4. PIEDRA 5 — AVATAR INSIDE MUSEUM STUDIO

Approved information architecture:

```text
AVATAR
├── SUBIR / SELECCIONAR
├── PREVIEW
├── RIG
├── ESCALA
├── GROUNDING
├── MOTION
├── IK / LOOKAT
├── ACCIONES
├── LAB
└── VALIDAR
```

Use capability knowledge from:

```text
CharacterStudio/Create.jsx
CharacterStudio/Appearance.jsx
CharacterStudio/MotionLab.jsx
```

but rebuild the user-facing controls in the visual and interaction language of Museum Studio.

Do not mount the CharacterStudio application wholesale inside Museum.

---

# 5. EXECUTION ORDER

## PHASE 0 — FREEZE & PROVENANCE

Goal: protect the working Museum before any Character runtime change.

Tasks:

- confirm current Museum integration line
- create Character surgery branch
- record donor repository / branch / SHA provenance
- create donor-freeze directories
- create manifest/checksum inventory

Gate 0:

- four existing rooms remain untouched
- donor references are reproducible
- rollback point is explicit

Status: **IN PROGRESS**

---

## PHASE 1 — BRING THE STONES WHOLE

Goal: copy the complete approved donor stones into Museum without activating them.

Tasks:

### CharacterStudio donor freeze

Bring the real dependency closure for:

- CharacterActionAPI
- MotionController
- MotionFoundationV2
- MotionFoundationV2Extra
- SocialMotionFoundationV3
- BoneMap
- Retargeter
- LookAt
- IK

### VECINIA donor freeze

Bring all ten files from `visual/src/character2027/runtime/` listed above.

Rules:

- no functional rewrites during import
- preserve filenames where possible
- record original path and source SHA
- adaptations go in new Museum-side seams

Gate 1:

- every approved stone exists locally
- donor manifest complete
- no runtime activation yet
- Museum baseline still builds/runs

---

## PHASE 2 — ANATOMY / COMPATIBILITY MAP

Goal: understand every dependency before wiring runtime.

For each stone document:

```text
STONE
↓
requires
↓
exposes
↓
assumed authority
↓
Museum equivalent
↓
conflicts
↓
adapter needed
```

Pay special attention to:

- renderer ownership
- Scene / SceneKit
- WorldStore
- camera
- controls
- navigation
- collision
- animation lifecycle
- room enter/leave
- asset loading
- teardown/dispose

Gate 2:

- no unidentified authority conflict
- exact minimal seam designed

---

## PHASE 3 — FIRST SURGERY: PRESENCE ONLY

Goal: make Character 2027 live inside one Museum room before enabling locomotion.

Initial target: **Gallery A** unless runtime evidence shows a safer isolated receiver is preferable.

Activation order:

1. Character runtime dependency closure
2. `MuseumCharacterRuntimeAdapter`
3. approved Character asset
4. rig
5. scale
6. grounding
7. IDLE

Required outcome:

```text
Gallery A
↓
Character appears
↓
correct asset
↓
correct scale
↓
correct grounding
↓
rig valid
↓
IDLE stable
```

Explicitly NOT active yet:

- WASD
- tours
- cinematic camera
- semantic authoring
- Avatar Studio
- ExteriorCharacterPilot
- full-world C2

Gate 3:

- Character visible and stable
- one renderer authority
- one WorldStore
- one CameraAuthority
- no regression A/B/Wet Paint/Breeze

---

## PHASE 4 — SECOND SURGERY: FREE MOBILITY

Activate:

`PropertyRoomCharacterFreeMobility.js`

Adapt it to current Museum authorities rather than replacing them.

Required interactions:

- WALK
- BACKWARD
- TURN LEFT/RIGHT
- STOP
- JUMP
- grounding
- room bounds
- collision with walls
- collision with relevant furniture/blockers

Required ownership:

```text
Museum ExploreController = collision/navigation authority
Museum navigationVolume = spatial limits
Character 2027 = body + actions
Museum CameraAuthority = single camera authority
```

Gate 4:

- free movement works in real Museum room
- no wall escape
- no duplicated camera
- no duplicated controls authority
- no four-room regression

---

## PHASE 5 — AVATAR PROFILE + MUSEUM STUDIO

Goal: make the Character configurable as Museum content.

Implement canonical `avatarProfile`.

Then add Museum Studio section:

```text
AVATAR
├── SUBIR / SELECCIONAR
├── PREVIEW
├── RIG
├── ESCALA
├── GROUNDING
├── MOTION
├── IK / LOOKAT
├── ACCIONES
├── LAB
└── VALIDAR
```

Important:

- CharacterStudio provides capability knowledge
- Museum Studio owns final UX
- visitor runtime never becomes MotionLab

Gate 5:

- profile can be authored
- configuration survives room lifecycle according to the current Museum persistence contract
- validation differentiates valid/invalid rig and configuration

---

## PHASE 6 — ADVANCED CAPABILITIES

Only after presence + locomotion + Avatar Profile are stable.

Activation order:

1. `PropertyRoomCharacterCapabilityBatches.js`
2. `PropertyRoomSemanticAuthoring.js`
3. `PropertyRoomSemanticAuthoringBridge.js`
4. `PropertyRoomCharacterTourBridge.js`
5. `PropertyRoomCharacterCinematicCamera.js`
6. `ExteriorCharacterPilot.js`
7. `exterior-pilot-skeleton.js`
8. `full-world-c2-skeleton.js`

Candidate semantic actions include, when physically valid:

- WAVE
- GOODBYE
- POINT
- NOD
- LOOK_AT
- WELCOME
- AFTER_YOU
- CROUCH
- STEP_UP / STEP_DOWN
- STAIRS_UP / STAIRS_DOWN
- PRESS_DOORBELL
- KNOCK_DOOR
- OPEN_DOOR
- PICK_UP_* actions
- SIT_SOFA
- LEAN_WALL

Do not fake context-dependent actions where the corresponding semantic object/surface does not exist.

Gate 6:

- advanced capability only becomes READY when browser/runtime evidence proves it
- contextual actions may remain CONTEXT_REQUIRED

---

# 6. ACTIVATION ORDER — SHORT VERSION

```text
1. MuseumCharacterRuntimeAdapter
2. Character Runtime
3. Asset + Rig + Grounding + IDLE
4. PropertyRoomCharacterFreeMobility
5. WALK / BACK / TURN / STOP / JUMP
6. Collision / navigationVolume
7. Avatar Profile
8. Avatar Studio
9. Capability Batches
10. Semantic Authoring
11. Tour Bridge
12. Cinematic Camera
13. Exterior Pilot
14. Full World C2
```

All stones may be imported early, but they are **not activated early**.

---

# 7. SUCCESS MODEL

The project is not complete when an avatar GLB appears.

The target is:

```text
MUSEUM FOUR-ROOM FREEZE
        ↓
CHARACTER 2027 PRESENT
        ↓
CORRECT RIG / SCALE / GROUNDING
        ↓
FREE MOVEMENT
        ↓
REAL MUSEUM COLLISION
        ↓
ONE CAMERA AUTHORITY
        ↓
AVATAR PROFILE
        ↓
AVATAR STUDIO
        ↓
SEMANTIC ACTIONS
        ↓
TOURS / CINEMATIC BEHAVIOUR
        ↓
FULL WORLD CAPABILITY
```

---

# 8. HARD RULES / DO NOT REGRESS

- Do not edit the proven donor stones during initial transport.
- Do not introduce a second renderer unless an isolated lab explicitly requires it.
- Do not introduce a second WorldStore.
- Do not introduce a second CameraAuthority.
- Do not invent a second collision system.
- Do not turn MotionLab into visitor runtime.
- Do not activate exterior/full-world systems before interior Character passes.
- Do not claim actions READY without runtime evidence.
- Do not merge to `master` as part of Character archaeology/surgery without explicit approval.
- Preserve Gallery A + Gallery B + Wet Paint + Breeze as the frozen regression baseline.

---

# 9. WHEN WE GET LOST

Open this document and the companion tracker:

`MUSEUM_CHARACTER_AVATAR_2027_PROGRESS_TRACKER.md`

Then answer only these questions:

1. What is the current phase?
2. Which stones are already frozen locally?
3. What is the last PASS gate?
4. What is the next unpassed gate?
5. Has any Museum authority been duplicated?
6. Did any of the four frozen rooms regress?

Resume from the first unpassed gate. Do not restart the architecture from memory.
