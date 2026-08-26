# MUSEUM — CHARACTER / AVATAR 2027 — PHASE 4A FAILURE / RECOVERY LOG

**Date:** 2026-08-26  
**Branch:** `chatgpt/museum-character-2027-integration-v1`  
**Phase:** 4A — Third-person free mobility / collision  
**Status:** human gate remains `PENDING`; this document records failed validation attempts and corrective surgery.

---

# INCIDENT 1 — MOBILITY GATE STARTED IN LOBBY

Human validation opened the Phase 4A URL:

`?character=1&mobility=1`

The browser showed the Museum lobby and the visible error badge:

`CHARACTER GATE ERROR · Phase 4A starts only in space.gallery-a`

No Character was mounted and therefore locomotion was not actually tested.

The browser console also displayed a Permissions Policy warning from `contentScript.js` / `[Mira]`. Repository audit found no matching Museum `unload` handler, so that warning is classified as browser-extension noise, not a Museum runtime failure.

## Root cause

The world canonically starts in `space.lobby`, while the first Phase 4A graft required `space.gallery-a` and threw otherwise.

The previous Phase 3/QA URL had used deterministic state `museum:gallery-a-overview`, whose setup crossed `portal.lobby-gallery-a`. That deterministic state was unsuitable for mobility because QA state application disables visitor movement.

## Correction

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

No direct `activeSpaceId` mutation, teleport hack, second room graph or SceneKit bypass was introduced.

Phase 4A also installs a bounded CameraAuthority/input bridge so that when the existing authority returns to `THIRD_PERSON_EXPLORE`, the same Museum `InputSystem` is re-enabled. No new DOM keyboard listeners are created.

## Lesson

Do not confuse deterministic QA setup with product runtime setup. If a prior visual test reached a room through a QA helper, inspect the semantic operations that helper performed and reproduce only the required canonical runtime operation.

---

# INCIDENT 2 — CAMERA LOST CHARACTER / SHOWED FACE WHILE ADVANCING

The next human validation proved real progress:

- Character visible;
- W/S movement working;
- A/D turn working;
- JUMP working;
- CameraAuthority remained `THIRD_PERSON_EXPLORE` with `violations 0`.

Juanma then detected two unacceptable third-person behaviours:

1. the camera could lose the Character near geometry / during turns;
2. while advancing, the camera could sometimes show the Character's face instead of remaining behind the neck/back.

## Root cause A — camera implementation was too simple

The first Museum-side `ThirdPersonExploreController` only computed one nominal rear point, clamped it to room bounds and interpolated toward it. It did **not** yet recover the camera-comfort logic already proven in the frozen `PropertyRoomCharacterFreeMobility.js` donor.

Missing behaviours included:

- blocker-aware camera candidates;
- line-of-sight segment checks;
- multiple rear distances;
- lateral alternatives;
- alternative heights;
- minimum comfort distance;
- last-safe camera hold;
- occlusion fallback;
- camera dead zones.

A straight interpolation between two valid rear positions could also cross the front hemisphere during a fast 180-degree turn, briefly showing the Character face.

## Root cause B — visual forward axis was not normalized

Museum body convention uses Character root `+Z` as canonical forward for locomotion, collision and camera following. The approved GLB visual faces the opposite local axis. Height/grounding had been normalized, but visual forward had not.

That allowed locomotion truth and visual-facing truth to disagree.

## Correction

Camera recovery commit:

`76328e36021dc1f8c19ef705f0b2e2b3096a5291`

Visual-forward recovery commit:

`ed88c21e63587f3a23ed23c2b82a1768945642c6`

The Museum-side third-person controller now recovers the proven donor strategy while preserving Museum authority:

```text
Character root / yaw
  ↓
rear camera candidates
  ├── multiple distances
  ├── lateral alternatives
  └── multiple heights
  ↓
Museum navigationVolume bounds + blockers
  ↓
line-of-sight / comfort validation
  ↓
last safe / emergency shoulder fallback
  ↓
rear-hemisphere guard
  ↓
existing CameraAuthority commit
```

The controller exposes diagnostics for:

- selected camera slot;
- occlusion fallback count;
- comfort holds;
- rear-hemisphere guard snaps;
- current camera distance.

The approved GLB visual now receives a Museum-side local yaw offset of `Math.PI`, while the body root remains unchanged:

```text
Character body root
canonical forward = +Z
        ↓
visual child
local yaw offset = π
```

Therefore locomotion, collision, portal-facing and camera-facing continue to use one clean body authority while only the visual representation is corrected.

## Anti-regression rules

1. Never reduce third-person camera behaviour back to a single clamped rear point when the donor already contains proven comfort/occlusion handling.
2. Body-facing authority and visual-facing correction must remain separate. Do not rotate the locomotion root merely to fix a mesh export axis.
3. A valid third-person camera candidate must be behind the body, inside Museum bounds, outside blockers, above minimum comfort distance and have a clear segment to the Character target.
4. During fast turns, interpolation must never cross the front hemisphere; use the rear guard rather than accepting a temporary face-on shot.
5. Keep all camera writes inside the existing `CameraAuthority`.

---

# CURRENT HUMAN GATE

Phase 4A remains **HUMAN PASS PENDING**.

The next human validation must specifically prove:

1. `W` advances while camera sees neck/back, not face;
2. `S` moves backward while body facing remains stable;
3. A/D and fast 180-degree turns do not bring the camera across the Character's face;
4. camera does not lose Character near Museum blockers/walls;
5. `Shift` follow remains stable;
6. JUMP follow remains stable;
7. wall/blocker collision still works;
8. badge remains `camera THIRD_PERSON_EXPLORE` and `violations 0`;
9. camera diagnostics may increment `occlusion` / `rear-guard` as safeguards engage, but the visual result must remain comfortable.

Gallery A → Gallery B Character continuity is **not** part of this repair. It remains Phase 4B and must not be mixed into the 4A camera/orientation closure gate.

Do not advance to Phase 4B until this human camera/orientation gate is jointly reviewed.
