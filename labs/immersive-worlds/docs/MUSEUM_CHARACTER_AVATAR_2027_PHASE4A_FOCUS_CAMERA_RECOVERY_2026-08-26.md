# MUSEUM CHARACTER / AVATAR 2027 — PHASE 4A FOCUS + CAMERA RECOVERY

**Date:** 2026-08-26  
**Branch:** `chatgpt/museum-character-2027-integration-v1`  
**Status:** IMPLEMENTED — HUMAN VALIDATION PENDING

## Human symptom

During Character third-person exploration, entering an artwork with `E` correctly moved to Focus / first person, but leaving Focus could return with the Character very far away or with the wrong perspective. Human review also showed that near/far camera rules were not hard guarantees: the Character could still become too small or too large in frame.

## Root causes

### 1. Wrong camera authority on Focus release

The legacy Runtime `releaseFocus()` always returns to `CAMERA_AUTHORITY.EXPLORE`. That is correct for the legacy first-person visitor, but wrong when Focus was entered from `THIRD_PERSON_EXPLORE`.

The Character graft now owns only the session-specific free-explore return path while mounted:

`THIRD_PERSON_EXPLORE -> FOCUS -> THIRD_PERSON_EXPLORE`

Guided/tour mode still delegates to the original Runtime policy.

### 2. Third-person controller adopted the Focus pose

`ThirdPersonExploreController.onGain()` previously accepted the incoming Focus camera pose as its third-person starting pose. A Focus pose is not guaranteed to be behind, near, or compositionally valid relative to Character.

On `focus:release:character-*`, the controller now:

- discards the Focus pose;
- invalidates stale safe-camera state;
- clears near/far counters;
- reacquires a fresh rear candidate around the current Character root.

### 3. Near/far envelope was advisory, not guaranteed

The old envelope attempted one corrected physical position. If that candidate failed the geometry/line-of-sight comfort test, the correction was abandoned and the camera could remain too far or too near.

The recovery now searches several distances, shoulders and heights. Hard violations trigger immediate recovery; persistent soft violations also trigger recovery.

### 4. Missing optical shot fallback

Physical distance alone cannot guarantee readable Character scale when room geometry prevents an ideal camera position.

The controller now has framing modes:

- `NORMAL`
- `REACQUIRE`
- `FAR_RECOVERY`
- `CLOSE_RECOVERY`
- `FAR_OPTICAL`
- `CLOSE_OPTICAL`

When geometry prevents the preferred physical move, FOV becomes the fallback plane-control mechanism rather than allowing the Character to become tiny or fill/leave the frame.

## Architecture preserved

No second CameraAuthority, renderer, WorldStore, ExploreController, InputSystem, navigation truth or Character root was created.

The Character-only `releaseFocus` override exists only while the Phase 4A graft is mounted and is restored on `dispose()`. Guided mode continues to use the Runtime's original focus-release path.

## Human validation gate

Test this exact loop repeatedly:

1. walk in third person;
2. approach artwork;
3. press `E`;
4. confirm Focus / first person;
5. leave Focus;
6. confirm immediate return behind the same Character at a readable distance;
7. force camera near the Character;
8. force Character far from camera;
9. verify physical or optical recovery;
10. confirm `CameraAuthority violations = 0`.

Phase 4A is not formally closed until this human gate passes.
