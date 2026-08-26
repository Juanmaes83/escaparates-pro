# MUSEUM — CHARACTER / AVATAR 2027 CONNECT HANDOFF

**Date:** 2026-08-25  
**Status:** HANDOFF / STOP POINT BEFORE RUNTIME SURGERY  
**Working branch:** `chatgpt/museum-character-2027-integration-v1`  
**Protected four-room Museum baseline:** `4fbca5997beaf058543ee65d682f0adae89252e2`  
**Do not merge to `master` without explicit approval.**

---

# 1. MISSION — WHAT WE WANT TO ACHIEVE

The goal is **not** merely to display a GLB avatar inside one Museum room.

The goal is to recover **Character / Avatar 2027 as a real living visitor representation inside Museum** so that a user can:

1. enter Museum with the Character visible and correctly grounded;
2. move the Character freely with stable locomotion;
3. collide with Museum walls / room bounds / relevant furniture instead of crossing geometry;
4. keep exactly one Museum navigation/collision authority;
5. keep exactly one Museum camera authority;
6. leave one room and enter another **with the Character continuing to be the visitor representation**;
7. navigate through the complete Museum room graph, including the already-proven rooms:
   - Gallery A;
   - Gallery B;
   - Wet Paint;
   - Breeze;
8. preserve all four rooms and their current behavior while Character is grafted in;
9. later expose an `AVATAR` area inside Museum Studio where the avatar can be selected/uploaded, previewed, validated and configured;
10. eventually reuse Character 2027 actions, semantic interaction, tours and cinematic capabilities only after free navigation is stable.

In short:

```text
MUSEUM FOUR-ROOM FREEZE
        +
CHARACTER 2027 BODY / MOTION / IK
        +
VECINIA MUSEUM CHARACTER ADAPTER / FREE MOBILITY
        ↓
ONE VISITOR AVATAR
        ↓
FREE NAVIGATION INSIDE ROOMS
        ↓
ROOM-TO-ROOM TRAVERSAL
        ↓
FULL MUSEUM WITH CHARACTER
```

The Character must become part of Museum. **Museum must not be rebuilt around CharacterStudio or VECINIA.**

---

# 2. CURRENT TRUTH — WHAT IS ALREADY DONE

## 2.1 Museum baseline is protected

The Character surgery branch was created from the frozen Museum line after the four-room work:

- Gallery A — protected baseline;
- Gallery B — protected baseline;
- Wet Paint — HUMAN PASS;
- Breeze Studio PRO — HUMAN PASS;
- Breeze save / exit / re-entry / route — previously proven before Character surgery.

Protected baseline commit:

`4fbca5997beaf058543ee65d682f0adae89252e2`

The Character work must not regress this line.

## 2.2 Phase 0 — provenance / roadmap = PASS / CLOSED

Already done:

- Character surgery branch created;
- roadmap saved;
- progress tracker saved;
- VECINIA donor identified;
- CharacterStudio donor identified;
- WORLD-COSTA-BLANCA re-audited as secondary genealogy donor;
- exact donor commits pinned.

## 2.3 Phase 1 — BRING THE STONES WHOLE = PASS / CLOSED

This is fully complete.

Frozen donor root:

`labs/immersive-worlds/donors-frozen/character-2027/`

Manifest:

`labs/immersive-worlds/donors-frozen/character-2027/MANIFEST`

Integrity result:

**28/28 donor files are physically present in `escaparates-pro` and each destination Git blob SHA matches its source Git blob SHA.**

The frozen set is:

### VECINIA-WORLDS — 10/10

Source:

- repo: `Juanmaes83/VECINIA-WORLDS`
- branch: `feat/sculpture-navigation-character-v1`
- commit: `45e454febe2deb3b88bf5e5b527c4a5f86fe8eb1`

Frozen runtime family:

```text
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

The two primary VECINIA stones for the first real graft are:

- `MuseumCharacterRuntimeAdapter.js`
- `PropertyRoomCharacterFreeMobility.js`

### CharacterStudio — 18/18

Source:

- repo: `Juanmaes83/CharacterStudio`
- frozen commit: `f5a93a48ed0e3904fce58f08f7fbe08b5411b289`

Frozen Character runtime / dependency closure includes:

```text
CharacterActionAPI.js
MotionController.js
MotionFoundationV2.js
MotionFoundationV2Extra.js
SocialMotionFoundationV3.js
Retargeter.js
BoneMap.js
LookAtController.js
TerrainSemanticBenchmarks.js
ContactIKController.js
DonorTwoBoneIK.js
HumanoidIKController.js
LadderIKExtension.js
TerrainSemanticIK.js
VRMRigMapMixamo.js
```

Avatar / Studio knowledge donors:

```text
Create.jsx
Appearance.jsx
MotionLab.jsx
```

Important: the final CharacterStudio "IK" stone is a **five-file family**, not one file. It is already preserved completely.

---

# 3. CURRENT TRUTH — WHAT IS NOT DONE YET

This distinction must be preserved in every continuation.

## THE AVATAR IS NOT YET CONNECTED TO THE CURRENT MUSEUM RUNTIME

At this handoff point:

- Character 2027 is **not instantiated** in Museum;
- no avatar is visible in Gallery A;
- no avatar is visible in Gallery B;
- no avatar is active inside Wet Paint;
- no avatar is active inside Breeze;
- no frozen donor file is imported by the active Museum runtime;
- free mobility is not yet connected to the current Museum;
- room-to-room Character persistence/lifecycle has not yet been implemented;
- cross-room Character traversal has not yet been proven.

This is intentional: the donor quarry is frozen before surgery.

---

# 4. PHASE 2 — THE NEXT REQUIRED STEP

**Phase 2 is NOT yet closed at this handoff.**

Before connecting Character, perform an anatomy / compatibility audit against the **current** Museum branch.

The audit must answer exactly:

## 4.1 Authorities that Museum must keep

- `WorldStore` — unique Museum truth;
- `SceneKit` — Museum scene/spatial authority;
- `ExploreController` — Museum navigation/collision authority;
- `navigationVolume` — Museum room bounds/blockers truth;
- `CameraAuthority` — exactly one camera authority;
- existing renderer — no second active renderer;
- existing room lifecycle / WorldGraph / portals — must remain authoritative.

## 4.2 Character ownership

Character may own:

- body root;
- rig;
- animation mixer/controller;
- action vocabulary;
- LookAt;
- IK;
- Character-local state.

Character must NOT create a competing:

- WorldStore;
- SceneKit;
- camera authority;
- room graph;
- product renderer;
- independent collision truth.

## 4.3 Critical compatibility questions

Audit at least:

1. import paths expected by `MuseumCharacterRuntimeAdapter.js` versus current `escaparates-pro` paths;
2. Three.js ABI/version assumptions (`three185` in VECINIA versus current Museum);
3. `runtime.sceneKit`, `runtime.store`, `runtime.camera`, `runtime.directed` seams;
4. current `ExploreController._resolveCollision()` or replacement equivalent;
5. current `navigationVolume(spaceId)` format;
6. active `WorldState` / room lifecycle events;
7. input ownership when entering Wet Paint and Breeze specialized guests;
8. Character disposal/recreation policy when crossing rooms;
9. whether one Character root can be carried across room changes or must be safely reparented/reinstantiated;
10. exact portal transition seam for Character state preservation.

## Phase 2 exit gate

Phase 2 closes only when we have:

- dependency closure mapped to current Museum;
- no unidentified authority duplication;
- minimal Museum-side surgical seam designed;
- room lifecycle strategy designed;
- rollback path documented;
- no frozen donor stone edited in place.

---

# 5. PHASE 3 — FIRST REAL CONNECTION: PRESENCE / IDLE

Only after Phase 2 closes.

The first runtime surgery must be deliberately small.

Target only one normal Museum room first, preferably Gallery A.

Desired gate:

```text
Museum loads
↓
Gallery A remains unchanged
↓
Character 2027 asset loads
↓
Character root is attached to Museum scene
↓
rig valid
↓
scale = correct Museum human scale
↓
grounding correct
↓
IDLE stable
↓
no duplicate renderer
↓
no duplicate WorldStore
↓
no duplicate CameraAuthority
↓
Gallery B / Wet Paint / Breeze still regress PASS
```

Do NOT activate free movement in the same commit that first proves presence if that makes diagnosis harder.

---

# 6. PHASE 4 — FREE MOBILITY INSIDE A ROOM

After Character presence/IDLE passes, graft the proven VECINIA free-mobility knowledge.

Primary donor:

`PropertyRoomCharacterFreeMobility.js`

Required behavior:

- WALK;
- BACKWARD;
- TURN LEFT;
- TURN RIGHT;
- STOP;
- JUMP;
- correct grounding;
- wall collision;
- room bounds;
- relevant furniture collision;
- one camera authority;
- one collision/navigation authority.

Hard rule:

**Reuse Museum collision/navigation truth. Do not create another independent collision engine.**

---

# 7. PHASE 4B — THE REAL PRODUCT GOAL: ROOM-TO-ROOM CHARACTER TRAVERSAL

This is now an explicit project objective and must not be forgotten.

Once free mobility works in one room, extend it through the actual Museum graph.

The Character should be able to:

```text
Gallery A
   ↓ portal / room transition
Gallery B
   ↓
Wet Paint
   ↓
return / continue
   ↓
Breeze
   ↓
return / continue
```

The exact topology must follow the current Museum WorldGraph/portal truth, not this simplified diagram.

For every room transition preserve, as applicable:

- avatar identity/profile;
- avatar asset;
- scale;
- rig/motion set;
- semantic state;
- transition intent;
- safe spawn / arrival anchor;
- camera ownership;
- input ownership.

Specialized rooms require special lifecycle care:

### Wet Paint

Wet Paint already has its own specialized guest/lifecycle seam. Character integration must not break the proven Wet Paint room or its media/personalization behavior.

### Breeze

Breeze Studio PRO owns input while active and has its own persistence adapter. Character integration must not steal Breeze controls or destabilize WebGPU. A safe policy may require Character to be hidden/parked while editing, or represented outside the specialized guest surface. Decide from runtime evidence, not assumption.

The user-facing goal remains: **the same avatar is the visitor across the Museum, even when specialized rooms require lifecycle suspension/parking rather than literally rendering the body inside an iframe/guest engine.**

Room-to-room gate is not PASS until a browser/human run proves the intended continuity.

---

# 8. PHASE 5 — AVATAR PROFILE + MUSEUM STUDIO

Only after navigation is stable.

Canonical target profile:

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

Target Museum Studio surface:

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

Reuse capability/knowledge from:

- `Create.jsx`;
- `Appearance.jsx`;
- `MotionLab.jsx`.

Do NOT mount MotionLab as the visitor runtime and do NOT transplant CharacterStudio UI wholesale.

---

# 9. PHASE 6 — ADVANCED CHARACTER CAPABILITIES

Only after free Museum navigation and Avatar Profile are stable:

1. `PropertyRoomCharacterCapabilityBatches.js`;
2. semantic authoring;
3. semantic authoring bridge;
4. tour bridge;
5. cinematic camera;
6. exterior pilot;
7. full-world C2 knowledge.

Each action must be individually classified `PASS`, `PENDING` or `CONTEXT_REQUIRED`.

Do not fake physical affordances that the current Museum does not actually contain.

---

# 10. GLOBAL ORDER — DO NOT SKIP

```text
PHASE 0 — provenance / roadmap                 PASS
PHASE 1 — bring stones whole                   PASS
PHASE 2 — anatomy / compatibility              NEXT
PHASE 3 — Character presence + IDLE            PENDING
PHASE 4 — free mobility in normal Museum room  PENDING
PHASE 4B — room-to-room Character continuity   PENDING
PHASE 5 — Avatar Profile + Studio              PENDING
PHASE 6 — semantic/tour/cinematic/full-world   PENDING
```

Activation order:

```text
MuseumCharacterRuntimeAdapter
↓
Character runtime closure
↓
asset / rig / scale / grounding / IDLE
↓
PropertyRoomCharacterFreeMobility
↓
WALK / BACK / TURN / STOP / JUMP / collision
↓
room lifecycle + portal traversal
↓
full Museum navigation with same avatar identity
↓
Avatar Profile
↓
Museum AVATAR Studio
↓
advanced capabilities
```

---

# 11. SOURCE-OF-TRUTH FILES TO READ IN A NEW SESSION

A new AI/session must start by reading, in this order:

1. **THIS FILE**  
   `labs/immersive-worlds/docs/MUSEUM_CHARACTER_AVATAR_2027_CONNECT_HANDOFF_2026-08-25.md`

2. Progress tracker  
   `labs/immersive-worlds/docs/MUSEUM_CHARACTER_AVATAR_2027_PROGRESS_TRACKER.md`

3. Surgery roadmap  
   `labs/immersive-worlds/docs/MUSEUM_CHARACTER_AVATAR_2027_SURGERY_ROADMAP.md`

4. Frozen donor manifest  
   `labs/immersive-worlds/donors-frozen/character-2027/MANIFEST`

Then inspect the current Museum runtime code required for Phase 2. Do not read hundreds of unrelated repositories.

When donor implementation details are required, read frozen files locally first. Refer back to source repositories only to confirm provenance/history or retrieve contextual QA/docs.

---

# 12. HARD RULES FOR THE NEXT SESSION

- Do not edit files under `donors-frozen/character-2027/`.
- Do not rebuild Museum from VECINIA.
- Do not rebuild Character from scratch.
- Do not introduce a second WorldStore.
- Do not introduce a second CameraAuthority.
- Do not introduce an independent competing collision truth.
- Do not touch `master`.
- Do not regress Gallery A, Gallery B, Wet Paint or Breeze.
- Do not claim Character is in Museum until it is visibly/runtime proven.
- Do not claim room-to-room navigation until it has been tested.
- Use wrappers/adapters on the Museum side for surgery.
- Keep commits and gates small enough that regressions can be localized.

---

# 13. IMMEDIATE NEXT ACTION

**STOP HERE.**

The next session should perform **Phase 2 — anatomy / compatibility audit against the current Museum runtime** and produce the minimal surgical connection plan.

Only after that audit is reviewed should it create the first runtime import/adapter for **Character presence + IDLE in Gallery A**.

The final product objective remains:

> **Connect Character / Avatar 2027 to Museum so the visitor can navigate freely through the Museum and move from room to room while preserving the existing Museum experiences and keeping one coherent avatar identity.**
