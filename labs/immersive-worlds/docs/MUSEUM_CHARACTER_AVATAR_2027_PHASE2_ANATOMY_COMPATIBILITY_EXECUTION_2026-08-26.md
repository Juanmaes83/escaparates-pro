# MUSEUM — CHARACTER / AVATAR 2027
# PHASE 2 — ANATOMY / COMPATIBILITY EXECUTION RECORD

**Date:** 2026-08-26  
**Repository:** `Juanmaes83/escaparates-pro`  
**Branch:** `chatgpt/museum-character-2027-integration-v1`  
**Protected baseline:** `4fbca5997beaf058543ee65d682f0adae89252e2`  
**Status:** **PHASE 2 = PASS / CLOSED**  
**Next gate:** **PHASE 3 — CHARACTER PRESENCE / RIG / SCALE / GROUNDING / IDLE IN GALLERY A**

---

## 0. EXECUTIVE VERDICT

Phase 2 confirms that Character / Avatar 2027 can be grafted into the current Museum without rebuilding Museum and without introducing a second world, camera, renderer, room graph or collision truth.

The donor code is highly valuable but is **not plug-and-play** against the current Museum. The correct strategy is:

```text
FROZEN DONOR STONES
        ↓
read / preserve / classify
        ↓
MUSEUM-SIDE BRIDGE / ADAPTERS
        ↓
CURRENT MUSEUM AUTHORITIES REMAIN UNIQUE
        ↓
CHARACTER OWNS BODY / RIG / MOTION ONLY
```

The most important Phase 2 finding is that `PropertyRoomCharacterFreeMobility.js` must **not** be mounted literally as production architecture. It creates a second `ExploreController` instance as a collision oracle and installs direct DOM keyboard/click listeners. Those were acceptable experimental/LAB techniques in the donor environment, but they would duplicate navigation/input behavior in the current Museum.

The donor remains PRIMARY knowledge for behavior, camera-comfort heuristics and locomotion semantics, while the current Museum remains authority for navigation, collision, input, camera, rooms and rendering.

---

# 1. PRODUCT DECISIONS NOW CANONICAL

The current product target is:

```text
MUSEUM
│
├── GUIDED VISIT
│   └── existing closed/direct tour remains available and protected
│
└── FREE EXPLORE
    └── Character / Avatar 2027
        ├── third-person as normal exploration view
        ├── free locomotion
        ├── Museum collision / navigation truth
        ├── Museum portals / lifecycle
        └── intentional artwork contemplation
             ↓
           user reaches authored viewing position / marker
             ↓
           explicit VER / CONTEMPLAR action
             ↓
           FOCUS first-person
             ↓
           exit Focus
             ↓
           return to third-person Character exploration
```

The new Character mode must therefore extend Museum camera behavior rather than replace `EXPLORE`, `FOCUS`, `DIRECTED`, `TRANSITION` or `AUTHOR`.

Special-room policy:

- Wet Paint: attempt full Character presence later if integration remains low-risk.
- Breeze: attempt full presence only if it does not destabilize the proven specialized guest/runtime. Safe fallback is Character parking/suspension with identity preserved and restoration on exit.

---

# 2. AUTHORITY MAP — FINAL

## 2.1 Museum remains unique authority for

- `WorldStore`
- `WorldGraph`
- `WorldState`
- `SpaceLifecycle`
- portals / room transitions
- `SceneKit` host contract
- `navigationVolume(spaceId)`
- navigation/collision truth
- `CameraAuthority`
- renderer and camera object via `RenderHost`
- Museum `InputSystem` routing
- existing guided/direct tour
- Focus behavior
- specialized room lifecycle ownership

## 2.2 Character may own

- visual/body root
- asset-local transform
- rig / skeleton
- `AnimationMixer`
- `MotionController`
- `CharacterActionAPI`
- motion/action state
- LookAt
- IK
- Character-local diagnostics/state

## 2.3 Character must never create a competing

- `WorldStore`
- `WorldGraph`
- `SceneKit`
- `CameraAuthority`
- renderer/canvas
- room lifecycle
- portal graph
- collision truth
- production input authority

---

# 3. CURRENT MUSEUM HOST ANATOMY CONFIRMED

## Runtime / lifecycle

`engine/core/runtime.js` remains the composition root and owns subsystem construction/update/disposal. Space activation already resolves spawn through SceneKit, applies `navigationVolume`, places Explore and rebuilds proximity. Portal traversal already uses canonical Museum portal records, SpaceLifecycle, WorldState and arrival anchors.

## Renderer

`render/render-host.js` owns the sole renderer and sole graphics camera object. It imports Museum's pinned local Three.js instance from:

`../vendor/three/three.module.min.js`

No Character code may create another renderer or camera object.

## SceneKit

Museum SceneKit remains the presentation/spatial host. Character may attach a root to the existing Museum scene but may not create another scene authority.

## Navigation / collision

Museum's `navigationVolume(spaceId)` remains the room spatial truth. Existing `ExploreController` contains the current room-bounds / blocker collision resolver. Phase 4 must expose/reuse that truth through a Museum-side navigation seam rather than constructing another ExploreController.

## Camera

`CameraAuthority` remains the only authority able to commit semantic camera poses. Third-person Character exploration will be added later as a controller/mode **under the same CameraAuthority**, not as another authority.

## Input

Current Museum input is routed by the application/runtime and is disabled when another camera/experience owns control. Character production input must integrate into this routing. Direct `window.addEventListener('keydown'...)` / `keyup` LAB ownership is rejected for final integration.

---

# 4. THREE.JS ABI — CLOSED

Museum has a deterministic vendored Three.js distribution recorded in:

`labs/immersive-worlds/vendor/three/VENDOR.md`

Canonical version:

`three 0.185.1` — exact / pinned.

This satisfies the donor adapter's r185 ABI expectation.

Current Museum renderer imports:

`labs/immersive-worlds/vendor/three/three.module.min.js`

Phase 3 rule:

> Every Character-facing Three.js import must resolve to this same Museum vendored 0.185.1 instance or to addons from the same pinned 0.185.1 package rewritten to import that exact local module.

Forbidden:

- npm `three` as a second runtime instance;
- CDN Three.js;
- `three185` alias that resolves to an independent module copy;
- mixed Matrix4/Object3D/Skeleton/AnimationMixer instances.

### GLTFLoader finding

The current Museum vendor only contains the core/module plus selected addons; `GLTFLoader.js` is not currently vendored under `vendor/three/addons/`.

Phase 3 therefore requires a small dependency addition:

- vendor `examples/jsm/loaders/GLTFLoader.js` from **three 0.185.1 exactly**;
- rewrite its bare `three` import, if present, to Museum's local `../../three.module.min.js` path using the same deterministic vendor policy already used by other addons;
- register the addition in `vendor/three/VENDOR.md`;
- do not introduce another Three package.

This is a dependency closure task, not a new renderer.

---

# 5. DONOR CLASSIFICATION — FINAL

## 5.1 `MuseumCharacterRuntimeAdapter.js`

**Classification:** PRIMARY DESIGN / INTEGRATION DONOR — ADAPT, DO NOT IMPORT BLINDLY.

Proven useful concepts:

- attach Character root to an existing Museum scene;
- no canvas / renderer / SceneKit / WorldState / CameraAuthority ownership;
- load and verify approved asset provenance;
- normalize avatar height;
- unify compatible skeletons;
- inspect humanoid rig;
- create `MotionController`;
- register Motion Foundation V2;
- create LookAt;
- expose Character through `CharacterActionAPI`;
- stable IDLE;
- frame-loop update and deterministic dispose;
- camera changes written through existing CameraAuthority.

Donor-specific dependencies that must not leak unchanged into current Museum:

- `three185` alias;
- `property-room-v1` camera/schema paths;
- `APPROVED_AVATAR` probe path;
- `HumanSpatialContract` donor path;
- `MUSEUM_HUMAN_PROFILE` donor path;
- direct assumptions about VECINIA's runtime globals.

Museum-side equivalents/wrappers will replace these dependencies.

## 5.2 `PropertyRoomCharacterFreeMobility.js`

**Classification:** PRIMARY BEHAVIOR / ALGORITHM DONOR — DO NOT INSTALL LITERALLY.

Keep as knowledge:

- WALK / BACKWARD / STOP / TURN / JUMP semantics;
- proven walk/back speeds;
- Character radius precedent;
- blocker handling ideas;
- third-person camera candidate search;
- camera comfort minimum distance;
- occlusion fallback / last-safe-camera behavior;
- camera smoothing and dead zones;
- diagnostics and movement reporting;
- semantic destination ideas.

Reject as final architecture:

1. `new ExploreController(...)` collision oracle;
2. direct call to private `_resolveCollision()` through a duplicate controller;
3. direct disabling of Museum input followed by own global key listeners;
4. permanent use of `DIRECTED` as the semantic identity of free third-person exploration;
5. `window.__IW_CHARACTER_FREE` as product state authority;
6. room-specific fixture names hardcoded as global Character architecture.

Phase 4 will reimplement the useful behavior around Museum-owned navigation/input/camera seams.

## 5.3 CharacterStudio runtime

**Classification:** PRIMARY CHARACTER BODY / MOTION OWNER.

`CharacterActionAPI.js` provides a suitable stable command facade and delegates body behavior to `MotionController`.

`MotionController.js` owns the Character-local AnimationMixer, motion states, turning and body navigation semantics. It currently imports/constructs Character IK support, so its dependency closure must be adapted to Museum's local module paths but its authority remains Character-local.

`BoneMap.js` + `VRMRigMapMixamo.js` provide the humanoid rig inspection / skeleton compatibility basis.

`MotionFoundationV2.js` contains `IDLE_V2` and the proven movement/action clip family.

---

# 6. PHASE 3 DEPENDENCY CLOSURE — EXACT DESIGN

Phase 3 does **not** activate free mobility.

Minimal required runtime responsibilities:

```text
MuseumCharacterBridge
│
├── CharacterAssetLoader
│   ├── Museum THREE 0.185.1
│   ├── Museum GLTFLoader 0.185.1
│   ├── fetch asset
│   ├── provenance validation when configured
│   ├── normalize visual height
│   ├── unify skeletons
│   └── inspect humanoid rig
│
└── CharacterRuntime
    ├── root
    ├── MotionController
    ├── MotionFoundationV2
    ├── CharacterActionAPI
    ├── LookAtController (constructed but advanced behavior may remain dormant)
    ├── dependency-closed Character IK internals required by MotionController
    ├── IDLE_V2
    ├── update(dt)
    └── dispose()
```

Phase 3 allowed behaviors only:

- load one approved Character asset;
- attach one Character root to existing Museum scene;
- validate rig;
- normalize scale;
- place at one safe Gallery A spawn/anchor;
- ground feet/root correctly;
- play stable `IDLE_V2`;
- update animation through Museum's existing frame loop;
- deterministic dispose/rollback.

Phase 3 explicitly dormant:

- keyboard/gamepad locomotion;
- free movement;
- third-person follow camera;
- duplicate collision solver;
- click-to-move;
- portals;
- room-to-room persistence;
- Focus artwork handoff;
- Wet Paint/Breeze Character presence;
- Avatar Studio;
- TourBridge;
- cinematic camera;
- semantic actions beyond minimum resting runtime;
- exterior/full-world stones.

---

# 7. MINIMAL MUSEUM-SIDE SEAM

Approved conceptual seam:

```text
CURRENT MUSEUM RUNTIME
│
├── WorldStore             unchanged
├── WorldGraph             unchanged
├── SpaceLifecycle         unchanged
├── SceneKit               unchanged authority
├── navigationVolume       unchanged truth
├── CameraAuthority        unchanged authority
├── RenderHost             unchanged authority
├── InputSystem            unchanged authority
│
└── MuseumCharacterBridge  NEW / Museum-side
    │
    ├── CharacterAssetLoader       NEW / Museum-side
    │
    └── Character runtime closure  adapted copies/wrappers outside frozen quarry
         ├── body/root
         ├── rig
         ├── animation
         └── IDLE
```

Later phases extend the bridge with:

```text
Phase 4  → CharacterNavigationAdapter + ThirdPersonExploreController + input routing
Phase 4B → CharacterLifecycleAdapter / portal continuity
Phase 4C → intentional artwork Focus handoff
Phase 4D → Wet Paint / Breeze specialized-room policies
Phase 5  → Avatar Profile + Museum Studio AVATAR
Phase 6  → semantic / tour / cinematic / exterior / full-world
```

---

# 8. THIRD-PERSON CAMERA CONTRACT — DESIGNED, NOT YET IMPLEMENTED

The free Character experience must not permanently masquerade as Museum `DIRECTED`.

Target semantic architecture:

```text
CameraAuthority — ONE
│
├── EXPLORE / existing behavior
├── THIRD_PERSON_EXPLORE  ← future Character free-explore controller
├── FOCUS                 ← intentional first-person artwork contemplation
├── DIRECTED              ← existing guided/cinematic tour
├── TRANSITION            ← portals / crossings
└── AUTHOR                ← authoring
```

The exact enum/controller naming may change during implementation if the current CameraAuthority contract favors another representation, but the invariant is fixed:

> Third-person is a distinct exploration behavior under the one existing CameraAuthority; it does not create a second camera authority and it does not redefine the existing guided tour as free exploration.

---

# 9. NAVIGATION CONTRACT — DESIGNED, NOT YET IMPLEMENTED

Core rule:

> **Character proposes. Museum validates.**

Target flow:

```text
Character desired position
        ↓
Museum CharacterNavigationAdapter
        ↓
current room navigationVolume
        ↓
Museum collision/navigation resolver
        ↓
valid position
        ↓
Character root commit
```

No second `ExploreController` is permitted as a product collision oracle.

If current collision code needs extraction to make this clean, Phase 4 should extract a reusable Museum-owned resolver/port while preserving existing Explore behavior, rather than cloning the controller.

---

# 10. INPUT CONTRACT — DESIGNED, NOT YET IMPLEMENTED

Target routing:

```text
Museum InputSystem
│
├── existing guided/direct behavior
├── existing Explore behavior
├── Character Explore mode
├── Focus mode
└── specialized guest ownership
```

Only the active mode receives user movement actions.

The donor LAB technique of global `keydown`/`keyup` ownership is not accepted for the final product.

---

# 11. ROOM LIFECYCLE / PORTAL CONTRACT — DESIGNED

Character belongs conceptually to the Museum visitor session/runtime, not to Gallery A.

```text
VISITOR SESSION
    └── Character identity/runtime
            ↓
        active room representation
```

Room changes must not destroy avatar identity.

Portal flow:

```text
Character reaches/requests real threshold
        ↓
Museum canonical portal
        ↓
WorldGraph / SpaceLifecycle / traversePortal
        ↓
arrival anchor / spawn
        ↓
Character root re-position/re-parent policy
        ↓
same Character identity continues
```

Phase 4B must determine from runtime evidence whether the same root remains attached globally or is safely reparented/suspended across specialized presentation boundaries. It must not create Character-owned room traversal.

---

# 12. ARTWORK FOCUS CONTRACT — DESIGNED

Product decision: **intentional entry**.

```text
THIRD-PERSON EXPLORE
        ↓
user reaches authored viewing marker / circle
        ↓
explicit VER / CONTEMPLAR
        ↓
Museum FOCUS
        ↓
FIRST-PERSON artwork view
        ↓
exit Focus
        ↓
restore THIRD-PERSON EXPLORE
```

Museum anchors/framing/Focus remain authoritative.

No automatic camera theft merely because the Character passes near an artwork.

---

# 13. SPECIALIZED ROOMS POLICY — DESIGNED

## Wet Paint

Priority after normal room-to-room traversal:

1. attempt same Character body if the Wet Paint guest/lifecycle shares a safe integration seam;
2. preserve current Wet Paint behavior as higher priority;
3. if body rendering is unsafe, suspend/park Character while preserving visitor identity/state and restore on exit.

## Breeze

Breeze remains protected.

1. never steal Breeze input while its specialized guest is active;
2. never destabilize its specialized renderer/runtime;
3. attempt visible Character only if runtime evidence shows the seam is cheap and safe;
4. otherwise park/suspend Character with identity preserved;
5. restore on canonical Museum exit/re-entry.

Visible body inside Breeze is desirable, not a prerequisite for the earlier Character gates.

---

# 14. ROLLBACK / SURGERY DISCIPLINE

Protected baseline remains:

`4fbca5997beaf058543ee65d682f0adae89252e2`

Rules:

- never edit `donors-frozen/character-2027/**`;
- no `master` mutation;
- one small gate per commit where practical;
- first Character presence commit must remain separable from locomotion;
- failures revert the last bounded gate rather than layering unrelated repairs;
- re-run Gallery A / Gallery B / Wet Paint / Breeze regression after runtime surgery gates;
- Character is not declared connected until browser/runtime evidence proves it.

---

# 15. PHASE 2 COMPATIBILITY MATRIX

| Concern | Donor assumption | Current Museum truth | Decision | Timing |
|---|---|---|---|---|
| Three.js | `three185` / r185 | vendored `three 0.185.1` | use Museum instance only | Phase 3 |
| Renderer | existing renderer expected | `RenderHost` owns sole WebGLRenderer | reuse unchanged | Phase 3 |
| Camera object | existing camera expected | `RenderHost.camera` sole graphics camera | reuse unchanged | Phase 4 camera |
| Camera authority | donor writes through existing authority | Museum `CameraAuthority` unique | preserve | all phases |
| Character scene root | donor adds root to existing scene | Museum SceneKit exposes scene | Museum bridge attaches root | Phase 3 |
| Asset loading | donor GLTFLoader + pinned asset probe | no Museum GLTFLoader vendored yet | vendor 0.185.1 GLTFLoader only | Phase 3 |
| Rig validation | BoneMap/VRM map | donor closure frozen | adapt imports, reuse logic | Phase 3 |
| Motion | MotionController + Foundation V2 | no active Character runtime | Character owns | Phase 3+ |
| IDLE | `IDLE_V2` | no Character | first active animation | Phase 3 |
| Navigation | donor creates extra ExploreController oracle | current Explore/navVolume is truth | reject duplicate; Museum adapter | Phase 4 |
| Collision | donor reuses `_resolveCollision` via duplicate instance | Museum owns resolver/bounds/blockers | expose/reuse Museum-owned resolver | Phase 4 |
| Input | donor disables Museum input and owns DOM events | Museum InputSystem routes ownership | integrate actions into Museum input | Phase 4 |
| Third-person | donor writes follow through DIRECTED | free Explore must coexist with tour | distinct third-person explore controller under same CameraAuthority | Phase 4 |
| Focus | donor lead/cinematic assumptions | Museum Focus already exists | explicit artwork handoff to Focus | Phase 4C |
| Tour | donor TourBridge available | existing tour protected | do not touch early | Phase 6 |
| Room lifecycle | donor room-specific runtime | Museum SpaceLifecycle canonical | Character visitor-level lifecycle adapter | Phase 4B |
| Portals | donor/property assumptions | Museum canonical WorldGraph/portals | traverse through Museum only | Phase 4B |
| Wet Paint | not production-decided | specialized guest | integrate later / park fallback | Phase 4D |
| Breeze | specialized runtime concerns | protected guest/input/lifecycle | integrate only if safe / park fallback | Phase 4D |
| Avatar Studio | donor knowledge pages | Museum Studio owns UX | later reuse capability knowledge | Phase 5 |

---

# 16. PHASE 2 EXIT GATE

- [x] donor dependency closure mapped against current Museum
- [x] Character ownership defined
- [x] Museum authorities explicitly protected
- [x] no unidentified WorldStore conflict
- [x] no unidentified SceneKit conflict
- [x] no unidentified renderer conflict
- [x] Three.js ABI/version verified: Museum pinned at `0.185.1`
- [x] single-Three strategy defined
- [x] missing GLTFLoader dependency identified and bounded
- [x] FreeMobility duplicate ExploreController identified and rejected for final architecture
- [x] production navigation seam designed
- [x] production input ownership designed
- [x] third-person camera architecture designed
- [x] guided tour preservation defined
- [x] intentional artwork Focus behavior defined
- [x] room lifecycle ownership designed
- [x] portal continuity strategy designed
- [x] Wet Paint policy defined
- [x] Breeze policy defined
- [x] Phase 3 minimal seam designed
- [x] rollback path documented
- [x] no frozen donor stone edited
- [x] no Character runtime import activated during Phase 2

**PHASE 2 — ANATOMY / COMPATIBILITY = PASS / CLOSED**

---

# 17. NEXT ACTION — PHASE 3 ONLY AFTER HUMAN APPROVAL

Phase 3 target is intentionally narrow:

```text
Gallery A unchanged
        ↓
MuseumCharacterBridge
        ↓
exact Museum Three 0.185.1
        ↓
GLTFLoader 0.185.1
        ↓
approved Character asset
        ↓
rig validation
        ↓
human scale
        ↓
grounding
        ↓
IDLE_V2
        ↓
no locomotion yet
```

Phase 3 PASS requires visible/browser/runtime proof plus regression evidence before Phase 4 begins.
