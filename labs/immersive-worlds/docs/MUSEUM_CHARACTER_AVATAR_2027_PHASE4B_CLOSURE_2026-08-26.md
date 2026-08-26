# MUSEUM — CHARACTER / AVATAR 2027 — PHASE 4B CLOSURE

**Date:** 2026-08-26  
**Status:** PASS / CLOSED — HUMAN APPROVED  
**Merged PR:** #76  
**Approved head:** `785d95ce53b646151d4bdc47eb1a89b6193ba2b2`  
**Merge commit:** `54d948f35b791eff35fd1bbd6d40bf2fcb5a637f`

## Scope closed

Phase 4B proves room-to-room continuity for the same Character 2027 between Gallery A and Gallery B.

## Human-approved behaviour

- Gallery A → Gallery B through the canonical Museum portal.
- Gallery B → Gallery A through the canonical Museum portal.
- Same Character root identity across both rooms.
- Same MotionV2 instance and one Character locomotion loop.
- Same third-person camera controller under the single Museum CameraAuthority.
- Destination spawn, ground and navigationVolume rebound on crossing.
- Museum ProximitySystem rebuilt for the destination room.
- Focus interaction remains usable and returns to third-person Character Explore.
- Gallery B rope/barrier passage corrected with visual rope and its matching blocker shortened together.
- CameraAuthority violations remain zero in the approved human gate.

## Architectural invariants preserved

Museum remains authority for:
- WorldStore
- WorldGraph
- SpaceLifecycle
- SceneKit
- navigation/collision truth
- CameraAuthority
- RenderHost
- InputSystem
- canonical portal traversal

Character remains visitor-session state and is not recreated per room.

## Important non-scope

Other rooms are not part of Phase 4B continuity. Character absence after leaving the A ↔ B scope is expected until the later specialized-room / broader continuity phases.

## Next phase

**PHASE 4C — INTENTIONAL ARTWORK FOCUS**

Target product flow:

`THIRD_PERSON_EXPLORE → approach/viewing position → explicit VER / CONTEMPLAR → FOCUS first-person → exit → THIRD_PERSON_EXPLORE`

Do not reopen Phase 4B unless a demonstrated regression appears.
