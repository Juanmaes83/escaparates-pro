# MUSEUM — CHARACTER / AVATAR 2027 CONNECT HANDOFF

**Date:** 2026-08-26  
**Status:** **PHASE 2 PASS / CLOSED — STOP POINT BEFORE FIRST RUNTIME SURGERY**  
**Working branch:** `chatgpt/museum-character-2027-integration-v1`  
**Protected four-room baseline:** `4fbca5997beaf058543ee65d682f0adae89252e2`  
**Current branch head after Phase 2 documentation:** `d328b65551c42c2b0b89674ed9075caacfe3d3c7` at time of Phase 2 isolation check; later documentation-only handoff commits may advance the head.  
**Do not merge to `master` without explicit Juanma approval.**

---

# 1. CURRENT TRUTH

```text
PHASE 0 — FREEZE / PROVENANCE                 PASS / CLOSED
PHASE 1 — BRING DONOR STONES WHOLE           PASS / CLOSED
PHASE 2 — ANATOMY / COMPATIBILITY            PASS / CLOSED
PHASE 3 — CHARACTER PRESENCE + IDLE          PENDING / NEXT AFTER HUMAN APPROVAL
PHASE 4A — THIRD-PERSON FREE MOBILITY        PENDING
PHASE 4B — ROOM-TO-ROOM CONTINUITY           PENDING
PHASE 4C — INTENTIONAL ARTWORK FOCUS         PENDING
PHASE 4D — WET PAINT / BREEZE INTEGRATION    PENDING
PHASE 5 — AVATAR PROFILE + MUSEUM STUDIO     PENDING
PHASE 6 — ADVANCED CAPABILITIES              PENDING
```

Character is still **NOT active in Museum**. Phase 2 made no runtime imports and no product code changes.

---

# 2. PHASE 2 EVIDENCE

Canonical execution record:

`labs/immersive-worlds/docs/MUSEUM_CHARACTER_AVATAR_2027_PHASE2_ANATOMY_COMPATIBILITY_EXECUTION_2026-08-26.md`

Living tracker:

`labs/immersive-worlds/docs/MUSEUM_CHARACTER_AVATAR_2027_PROGRESS_TRACKER.md`

Isolation proof for Phase 2 execution:

- base before Phase 2 docs: `725970c6b6c1bc58a212b59f737e3c57f65df9d0`
- checked head: `d328b65551c42c2b0b89674ed9075caacfe3d3c7`
- ahead by: 2 commits
- files changed: exactly 2
  - Phase 2 execution record — added
  - Progress Tracker — modified
- runtime files changed: 0
- donor frozen files changed: 0
- Gallery A/B files changed: 0
- Wet Paint files changed: 0
- Breeze files changed: 0

This handoff itself is a later documentation-only commit and does not change the product isolation result.

---

# 3. PHASE 2 FINAL ARCHITECTURE

## Museum remains authority

- WorldStore
- WorldGraph
- WorldState
- SpaceLifecycle
- SceneKit
- navigationVolume / collision truth
- CameraAuthority
- RenderHost / renderer / graphics camera
- InputSystem routing
- portals
- existing guided tour
- Focus
- specialized-room lifecycle

## Character owns only

- body/root
- asset-local transform
- rig/skeleton
- animation mixer
- MotionController
- CharacterActionAPI
- motion/action state
- LookAt
- IK
- Character-local state/diagnostics

Core rule:

> **Character proposes. Museum validates.**

---

# 4. CRITICAL DONOR DECISIONS

## `MuseumCharacterRuntimeAdapter.js`

PRIMARY DESIGN / INTEGRATION DONOR.

Use its proven principles, but adapt it on the Museum side. Do not import it blindly because it contains VECINIA/property-room-specific imports and globals.

## `PropertyRoomCharacterFreeMobility.js`

PRIMARY BEHAVIOR / ALGORITHM DONOR.

Do **not** mount literally as final production architecture because it:

- creates a second ExploreController instance as a collision oracle;
- calls the private collision solver through that duplicate instance;
- disables Museum input and installs direct global key listeners;
- uses DIRECTED as the camera slot for free third-person behavior;
- keeps LAB state in globals.

Recover locomotion/camera-comfort knowledge, not those temporary authority patterns.

---

# 5. THREE.JS ABI — CLOSED

Museum uses deterministic vendored:

`three 0.185.1` — exact, pinned.

Source of truth:

`labs/immersive-worlds/vendor/three/VENDOR.md`

RenderHost imports:

`labs/immersive-worlds/vendor/three/three.module.min.js`

This matches the donor r185 expectation.

Permanent Character rule:

> Character must use Museum's exact vendored Three 0.185.1 instance. No npm/CDN/alias copy may create a second Three runtime.

Current bounded dependency gap:

- Museum vendor does not yet contain `GLTFLoader.js`.
- Phase 3 must vendor `examples/jsm/loaders/GLTFLoader.js` from **Three 0.185.1 exactly**, rewrite its bare import to Museum's local vendored module if necessary, and record it in `VENDOR.md`.

---

# 6. PRODUCT EXPERIENCE DECISIONS — CANONICAL

Museum keeps two ways to visit:

```text
GUIDED VISIT
→ existing protected directed/closed tour

FREE EXPLORE
→ Character / Avatar 2027
→ third-person normal navigation
```

Artwork contemplation is intentional:

```text
THIRD-PERSON CHARACTER
↓
approach authored viewing position / optional visible circle marker
↓
explicit VER / CONTEMPLAR
↓
Museum FOCUS
↓
FIRST-PERSON artwork view
↓
EXIT
↓
restore THIRD-PERSON CHARACTER
```

Do not trigger first-person automatically merely from proximity.

---

# 7. THIRD-PERSON CAMERA TARGET

There remains exactly one CameraAuthority.

Target model:

```text
CameraAuthority
├── existing EXPLORE behavior
├── future THIRD_PERSON_EXPLORE Character behavior
├── FOCUS
├── DIRECTED existing guided tour
├── TRANSITION
└── AUTHOR
```

Exact implementation naming may vary, but third-person free exploration must not become a second camera authority and must not permanently masquerade as the guided DIRECTED mode.

---

# 8. ROOM CONTINUITY TARGET

Character belongs to the visitor session/runtime, not to Gallery A.

Room traversal must use canonical Museum WorldGraph / portals / SpaceLifecycle / arrival anchors.

Target after locomotion works:

```text
Gallery A
↓ real Museum portal
Gallery B
↓
normal Museum graph
↓
Wet Paint where safe
↓
Breeze where safe
```

Same avatar identity/profile must survive room transitions.

---

# 9. SPECIALIZED ROOMS

## Wet Paint

Try visible Character integration later if low-risk. If the specialized guest seam makes body rendering unsafe, park/suspend Character but preserve identity and restore on exit.

## Breeze

Breeze remains protected. Never steal its input or destabilize its specialized runtime/WebGPU path. Visible Character inside Breeze is desirable but not mandatory if a clean park/suspend/reappear policy preserves the visitor identity and existing Breeze behavior.

---

# 10. NEXT PHASE — PHASE 3 ONLY

Do not start Phase 4 work in the first runtime surgery.

Phase 3 target:

```text
Gallery A unchanged
↓
add exact Three 0.185.1 GLTFLoader dependency
↓
MuseumCharacterBridge
↓
CharacterAssetLoader
↓
load one approved Character asset
↓
rig validation
↓
correct human scale
↓
correct grounding
↓
IDLE_V2 stable
↓
no Character locomotion/input yet
```

Phase 3 must preserve:

- one WorldStore
- one WorldGraph
- one SceneKit authority
- one CameraAuthority
- one renderer
- current Explore / Focus / Directed behavior
- Gallery A
- Gallery B
- Wet Paint
- Breeze

Phase 3 is not PASS until browser/runtime evidence and four-room regression evidence exist.

---

# 11. SOURCE-OF-TRUTH READ ORDER FROM NOW ON

1. **THIS FILE**  
   `labs/immersive-worlds/docs/MUSEUM_CHARACTER_AVATAR_2027_CONNECT_HANDOFF_2026-08-26.md`

2. Phase 2 execution record  
   `labs/immersive-worlds/docs/MUSEUM_CHARACTER_AVATAR_2027_PHASE2_ANATOMY_COMPATIBILITY_EXECUTION_2026-08-26.md`

3. Progress Tracker  
   `labs/immersive-worlds/docs/MUSEUM_CHARACTER_AVATAR_2027_PROGRESS_TRACKER.md`

4. Surgery Roadmap  
   `labs/immersive-worlds/docs/MUSEUM_CHARACTER_AVATAR_2027_SURGERY_ROADMAP.md`

5. Frozen donor manifest  
   `labs/immersive-worlds/donors-frozen/character-2027/MANIFEST`

The 2026-08-25 handoff is historical and is superseded by this file for current phase status.

If older documents still say Phase 2 is NEXT/PENDING, this 2026-08-26 handoff + Phase 2 execution record + current tracker win.

---

# 12. HARD RULES

- Never edit `donors-frozen/character-2027/**` in place.
- Never touch `master` without Juanma's explicit approval.
- Never introduce a second WorldStore.
- Never introduce a second WorldGraph.
- Never introduce a second CameraAuthority.
- Never introduce a second product renderer.
- Never introduce a competing collision truth.
- Never turn donor LAB input globals into production authority.
- Never rebuild Museum around Character.
- Never rebuild Character from scratch while proven donors exist.
- Do not regress Gallery A, Gallery B, Wet Paint or Breeze.
- Do not claim Character is connected until visibly/runtime proven.
- Keep runtime surgery commits/gates small and reversible.
