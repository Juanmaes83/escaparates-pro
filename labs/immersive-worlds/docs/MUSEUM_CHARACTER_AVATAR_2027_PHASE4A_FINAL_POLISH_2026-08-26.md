# MUSEUM — CHARACTER / AVATAR 2027 — PHASE 4A FINAL POLISH

**Date:** 2026-08-26  
**Branch:** `chatgpt/museum-character-2027-integration-v1`  
**Status:** `READY FOR SHORT HUMAN VALIDATION` — **NOT PASS YET**

## Human evidence that triggered this polish

The second human video showed Phase 4A was substantially improved: Character movement, jump, rear-facing visual orientation and third-person CameraAuthority all worked. Two residual camera-composition problems remained:

1. in some stretches the camera could remain too far away, making Character visually too small;
2. in some close approaches the Character could fill/leave too much of the frame.

These are classified as Phase 4A camera-composition defects, not Phase 4B continuity work.

## Final-polish implementation

Runtime commit:

`5e4e1a0926f4effce610176fb94c1bbfabfe53fb`

File:

`labs/immersive-worlds/engine/camera/controllers/third-person-explore-controller.js`

### Camera-distance envelope

The controller now enforces a bounded third-person envelope around Character:

- target distance: ~3.25 m;
- minimum distance: 2.75 m;
- maximum distance: 3.72 m;
- candidate distances are concentrated inside that band;
- smoothing is followed by a final distance guard so interpolation cannot leave Character too small or too large for long.

### Fresh fallback instead of arbitrary old pose

If no comfortable candidate exists, the last-resort pose is rebuilt around the **current** Character position instead of indefinitely holding an old distant camera pose.

### Stale `lastSafeCamera` invalidation

A remembered safe camera pose is invalidated when Character has materially changed context:

- Character translated more than ~1.15 m from the state where the pose was recorded; or
- Character yaw changed more than 60°.

This prevents a previously safe pose from becoming visually stale and making Character appear far away after movement/turning.

### Authority invariant

No new renderer, camera, CameraAuthority, ExploreController or input system was introduced. The camera remains a controller registered under Museum's existing `CameraAuthority`.

## Final human gate

A short human validation should prove:

- Character remains visually readable in size while walking;
- camera no longer stays excessively far away;
- Character does not fill/leave the frame during normal close movement;
- fast turns still keep camera behind Character;
- movement / jump / collision behaviour remain unchanged;
- CameraAuthority reports `violations = 0`.

If this short gate passes, **PHASE 4A = PASS / CLOSED** and the next phase is **PHASE 4B — same Character continuity Gallery A → Gallery B**.
