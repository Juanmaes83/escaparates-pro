# MUSEUM — CHARACTER / AVATAR 2027 — PHASE 4A FAILURE / RECOVERY LOG

**Date:** 2026-08-26  
**Branch:** `chatgpt/museum-character-2027-integration-v1`  
**Phase:** 4A — Third-person free mobility / collision  
**Status:** human gate remains `PENDING`; this document records a failed validation attempt and the corrective surgery.

---

# INCIDENT

Human validation opened the Phase 4A URL:

`?character=1&mobility=1`

The browser showed the Museum lobby and the visible error badge:

`CHARACTER GATE ERROR · Phase 4A starts only in space.gallery-a`

No Character was mounted and therefore locomotion was not actually tested.

The browser console also displayed a Permissions Policy warning from `contentScript.js` / `[Mira]`. Repository audit found no matching Museum `unload` handler, so that warning is classified as browser-extension noise, not a Museum runtime failure.

---

# ROOT CAUSE

The world canonically starts in:

`space.lobby`

but `museum-character-phase4a.js` previously required:

`runtime.state.activeSpaceId === 'space.gallery-a'`

and threw otherwise.

The previous Phase 3/QA URL had used the deterministic state `museum:gallery-a-overview`, whose setup crossed `portal.lobby-gallery-a` before positioning the camera. That deterministic state is unsuitable for mobility because QA state application disables visitor movement.

We correctly removed the deterministic `state=` from the Phase 4A human URL, but initially failed to replace its Gallery-A entry with a real runtime entry path.

---

# CORRECTION

Commit:

`5ea07c6f5b08981d8c637def916a0469f632d8f4`

Phase 4A now performs a bounded canonical entry step before Character mount:

```text
Museum boot
  ↓
space.lobby
  ↓
runtime.traversePortal('portal.lobby-gallery-a')
  ↓
WorldGraph / SpaceLifecycle / SceneKit update normally
  ↓
verify activeSpaceId === space.gallery-a
  ↓
mount Character 2027
  ↓
THIRD_PERSON_EXPLORE
```

No `activeSpaceId` mutation, teleport hack, second room graph or SceneKit bypass was introduced.

Phase 4A also installs a bounded CameraAuthority/input bridge so that whenever the existing authority returns to `THIRD_PERSON_EXPLORE`, the same Museum `InputSystem` is re-enabled. No new DOM keyboard listeners are created.

---

# LESSON / ANTI-REGRESSION RULE

Do not confuse **deterministic QA setup** with **product runtime setup**.

If a previous visual test reached a room through a QA helper, audit what semantic operations that helper performed before removing it. When converting a deterministic screenshot state into an interactive human gate, reproduce only the necessary canonical runtime operations — here, `runtime.traversePortal()` — and do not copy QA-only input disabling or camera positioning.

For future gates:

```text
PROBLEM
  ↓
inspect prior working path
  ↓
identify semantic operation that made it work
  ↓
reuse canonical runtime operation
  ↓
never mutate state directly
  ↓
human validation again
```

---

# CURRENT GATE

Phase 4A remains **HUMAN PASS PENDING**.

The next human check must prove actual Character locomotion in Gallery A: WALK, BACKWARD, TURN LEFT/RIGHT, STOP→IDLE, JUMP, wall/blocker collision, grounding and third-person camera with `CameraAuthority` violations = 0.

Do not advance to Phase 4B until that video is jointly reviewed.
