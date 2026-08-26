# MUSEUM — CHARACTER / AVATAR 2027 — PHASE 4A HUMAN GATE CHECKPOINT

**Date:** 2026-08-26  
**Branch:** `chatgpt/museum-character-2027-integration-v1`  
**Status:** `READY FOR HUMAN VALIDATION` — **NOT PASS YET**  
**Gate:** Gallery A → Character 2027 controllable in third person → Museum input/navigation/collision/CameraAuthority remain authoritative.

---

## PREVIOUS GATE

Phase 3 presence was human-validated by Juanma on 2026-08-26 with visual evidence showing Character 2027 present inside Gallery A. The reported limitation — visible avatar but no movement — was expected at the Phase 3 boundary because that gate intentionally activated only presence / rig / 1.66 m scale / grounding / `IDLE_V2`.

**PHASE 3 = PASS / CLOSED for the presence gate.**

Do not ask for Phase 3 validation again unless new evidence shows a regression.

---

# PHASE 4A OBJECTIVE

Turn the validated Character body into the real controllable visitor in Gallery A while preserving Museum authority:

```text
Museum InputSystem
        ↓
Character movement sink
        ↓
Character body + proven V2 motions
        ↓
Museum ExploreController navigation resolver
        ↓
Museum navigationVolume bounds/blockers
        ↓
valid Character position

Character pose
        ↓
THIRD_PERSON_EXPLORE controller
        ↓
existing CameraAuthority
        ↓
existing RenderHost camera
```

No second renderer, WorldStore, SceneKit, ExploreController, collision truth, InputSystem or CameraAuthority is created.

---

# WHAT WAS IMPLEMENTED

## 1. Third-person camera controller

New Museum-side controller:

`labs/immersive-worlds/engine/camera/controllers/third-person-explore-controller.js`

It:

- observes Character position/yaw;
- computes a third-person follow pose;
- clamps the camera to room bounds;
- smooths camera/target movement;
- writes only through the commit token supplied by the existing `CameraAuthority`.

A new authority **state/controller slot** exists under the same authority:

`THIRD_PERSON_EXPLORE`

This is not a second camera authority.

---

## 2. Proven motion subset recovered

New Museum-side runtime seam:

`labs/immersive-worlds/character/character-motion-v2.js`

Source of truth:

- CharacterStudio commit: `f5a93a48ed0e3904fce58f08f7fbe08b5411b289`
- frozen `MotionFoundationV2.js` blob: `3ffa2617b107c1bdf885befce8bfcd4e0bda067c`

Activated Phase 4A subset:

- `IDLE_V2`
- `WALK_V2`
- `STOP_V2`
- `TURN_LEFT_V2`
- `TURN_RIGHT_V2`
- `JUMP`

No advanced semantic action, IK family, LookAt, tour or cinematic capability is activated in this gate.

---

## 3. One Museum navigation/collision truth

`ExploreController` now exposes its existing collision solver through:

`resolveNavigationPosition(next)`

Character uses that method for every proposed horizontal movement.

Therefore:

```text
Character proposes desired X/Z
        ↓
Museum ExploreController resolver
        ↓
Museum navigationVolume bounds + blockers
        ↓
resolved X/Z
        ↓
Character root
```

The donor pattern that created a second `ExploreController` as a collision oracle was deliberately **not** reproduced.

---

## 4. One Museum InputSystem

`InputSystem` now supports a bounded `movementSink`.

When Character Explore is active:

- `W / ArrowUp` → forward;
- `S / ArrowDown` → backward;
- `A` → turn left;
- `D` → turn right;
- `Shift` → faster movement;
- `Space` → jump.

Museum commands (`E`, `Enter`, `Esc`, `M`, `G`) stay inside the existing Museum InputSystem.

No Character-owned global keyboard listeners were installed.

---

## 5. Phase 4A mobility bridge

New file:

`labs/immersive-worlds/character/museum-character-phase4a.js`

It:

- fetches the same approved Character asset;
- verifies exact byte length + SHA-256 before attachment;
- validates rig;
- normalizes to 1.66 m;
- starts in Gallery A at an existing Museum anchor;
- drives WALK/BACK/TURN/STOP/JUMP;
- resolves movement against Museum navigation/collision;
- keeps ground Y owned by Gallery A navigation volume;
- registers third-person camera behavior inside the existing CameraAuthority;
- exposes diagnostics at `window.__IW_CHARACTER_PHASE4A`;
- has deterministic cleanup back to legacy Explore.

Current final mobility correction commit:

`635481da45ae92f161574d381acf13060b51f0d7`

---

## 6. Explicit opt-in

Phase 4A is isolated behind:

`?character=1&mobility=1`

The old Phase 3 gate remains available with only:

`?character=1`

The normal Museum URL without Character flags remains the protected baseline.

Do **not** use `state=museum:gallery-a-overview` for the mobility human test because deterministic QA states intentionally disable visitor movement.

---

# PROBLEMS FOUND AND LESSONS

## A. Broad schema replacement was caught and corrected

During addition of `THIRD_PERSON_EXPLORE`, an update initially replaced more of `types.js` than necessary. Although exports were retained, comments/typedef documentation would have been lost.

This was treated as a regression and corrected immediately by restoring the full pre-Phase4 file and inserting only the new authority entry.

**Lesson:** for constitutional/core files, patch the smallest possible seam; never accept a broad rewrite merely because runtime exports still work.

## B. A proposed pre-camera Runtime seam did not materialize reliably

A one-purpose workflow was considered to add a pre-camera updater to `Runtime.step()`. Verification of the real branch showed the Runtime file had not changed at that point.

We did not assume success. The design was simplified for this bounded gate:

- Character updates inside the existing `runtime.onFrame` wrapper;
- body changes occur before the existing render callback;
- third-person camera can follow with at most one-frame (~16 ms at 60 fps) latency.

This keeps the composition root untouched for the human mobility gate. If the human test exposes visible camera lag, the pre-camera seam can be reconsidered with evidence.

**Lesson:** verify the actual branch file, not the intended workflow result.

## C. Turn animation direction mismatch caught before human gate

The physical yaw direction and TURN animation mapping were initially opposite for A/D. It was corrected before delivery:

- `A` → `TURN_LEFT_V2`
- `D` → `TURN_RIGHT_V2`

**Lesson:** movement truth and motion-state naming must be validated together, not independently.

## D. One-purpose workflows removed after use

Temporary surgical workflows used to repair/patch core files were removed after their purpose was complete so they cannot remain as hidden mutation paths.

---

# HUMAN VALIDATION CHECKLIST

Test only Gallery A in this gate.

1. Exactly one Character is visible.
2. `W` moves forward and visibly plays WALK.
3. `S` moves backward without turning the body around unexpectedly.
4. `A` turns left.
5. `D` turns right.
6. Releasing movement produces STOP then returns to IDLE.
7. `Space` jumps and lands back on the same Museum ground plane.
8. Character cannot leave Gallery A through solid walls.
9. Character does not pass through relevant blockers/furniture covered by Museum `navigationVolume`.
10. Third-person camera follows Character without creating another camera or visible fighting/jitter.
11. Camera badge/report should show `THIRD_PERSON_EXPLORE` and `violations 0`.
12. Normal Museum baseline without `character/mobility` flags remains unchanged.

Record a video showing forward, backward, left/right turn, stop, jump, at least one wall/blocker collision and several seconds of third-person camera follow.

Then Juanma + ChatGPT review the video together before Phase 4A can be marked PASS / CLOSED.

---

# NOT ACTIVE YET

Phase 4A does not activate:

- Gallery A → Gallery B portal continuity (Phase 4B);
- intentional artwork Focus / 3rd→1st→3rd (Phase 4C);
- Wet Paint Character integration (Phase 4D);
- Breeze Character integration (Phase 4D);
- Avatar Profile / Museum Studio (Phase 5);
- advanced semantic/tour/cinematic/full-world capabilities (Phase 6).

---

# CURRENT DECISION

**PHASE 3 = PASS / CLOSED.**

**PHASE 4A = TECHNICAL GATE READY / HUMAN VALIDATION PENDING.**

Do not advance to Phase 4B until the Phase 4A human video is jointly reviewed.
