# MUSEUM — CHARACTER / AVATAR 2027 — PHASE 4B HUMAN GATE

**Date:** 2026-08-26  
**Branch:** `chatgpt/museum-character-2027-phase4b-continuity-v1`  
**Baseline:** Phase 4A merge `5795c26e5c4ed4438ae7863968a5fd51099c6f20`  
**Status:** `IN PROGRESS / HUMAN PASS PENDING`

## Scope

Phase 4B proves one thing only: the same Character 2027 visitor persists through the canonical Museum portal between Gallery A and Gallery B.

## Required invariants

- same Character root / identity before and after traversal;
- canonical `runtime.traversePortal()` remains the traversal path;
- Museum WorldGraph remains unique;
- Museum SpaceLifecycle remains unique;
- destination spawn comes from the portal's `destinationSpawnId`;
- destination `navigationVolume` becomes the movement/collision truth;
- Museum ProximitySystem rebuilds for the destination room;
- exactly one CameraAuthority remains active;
- Character remains under `THIRD_PERSON_EXPLORE` after arrival;
- one Museum InputSystem remains the input authority;
- no Character-owned room graph, renderer, camera or world state is created.

## Implemented seam

`character/museum-character-phase4b.js` mounts the already validated Phase 4A Character and preserves its root. For the two bounded portals:

- `portal.gallery-a-gallery-b`
- `portal.gallery-b-gallery-a`

it delegates world traversal to the existing `runtime.traversePortal()`.

The only suppressed behavior is the legacy portal handoff to first-person `EXPLORE`, because Character free exploration already owns `THIRD_PERSON_EXPLORE`. After canonical traversal completes, the same root is placed at the canonical destination spawn, the destination navigation volume is installed, proximity is rebuilt and the third-person controller is rebound to the same root.

## Human gate

Test both directions:

1. Walk in Gallery A to the Gallery B portal.
2. Press `E`.
3. Confirm Gallery B becomes active.
4. Confirm the same avatar is visible immediately after arrival.
5. Continue WALK / BACKWARD / TURN / JUMP in Gallery B.
6. Confirm collision and hotspot proximity continue in Gallery B.
7. Return through `portal.gallery-b-gallery-a`.
8. Confirm the same avatar identity returns to Gallery A.
9. Confirm camera remains third-person and `violations = 0`.

## PASS rule

Phase 4B is not PASS until human visual validation proves A → B → A with the same Character and no camera/input/world-authority regression.
