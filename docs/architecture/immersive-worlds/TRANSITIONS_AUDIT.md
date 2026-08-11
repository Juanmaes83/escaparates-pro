# Museum — transition behaviour audit

What actually happens between beats today, read from the code rather than assumed.
Analysis only: **nothing in this document is implemented.**

Source: `engine/camera/controllers/directed-controller.js`,
`engine/experience/experience-director.js`, `engine/core/runtime.js`.

---

## 1. The whole mechanism, in one paragraph

`ExperienceDirector._applyShot` computes a pose for the beat, asks for DIRECTED
authority, and calls `playShot(pose, { travelMs })`. `DirectedController.playShot`
stores the current pose as `from` and the new pose as `to`. Every frame it computes
`k = elapsed / duration`, applies `easeInOutCubic(k)`, and linearly interpolates
position, target and fov between the two. When `k` reaches 1 it fires
`onShotComplete`. There is nothing else. **A transition is one eased straight-line
lerp of two points and a look-at.**

---

## 2. Measured properties

| Property | Current behaviour |
|---|---|
| Position path | straight line, `vec3.lerp` |
| Target path | straight line, `vec3.lerp`, **same easing, same clock** |
| FOV | linear between shots |
| Easing | `easeInOutCubic` over the whole move — one curve, no phases |
| Default duration | 2200 ms |
| Portals | `travelMs = 0` → `snapTo`, a hard cut |
| Reduced motion | duration forced to 0 — every transition becomes a cut |
| Collision | **none** — the segment is not tested against anything |
| Navigation mesh | not consulted |
| Path/route following | none; the guide walks a path, the camera does not |
| Fade | none between beats |
| Look-ahead / lead | none |
| Anticipation | none |
| Arrival settle | none beyond the easing tail |
| User control | suspended; DIRECTED owns the camera |

### Authored durations, by intent

```
PORTAL         0 ms          cut
DETAIL         ≤ 1800 ms
FOCUS          ≤ 2600 ms
CONTEMPLATION  ≤ 3000 ms
ENTRY/OVERVIEW ≤ 3200 ms
ACCOMPANIED    ≤ 3400 ms
LEAD           ≤ 7000 ms     matched to the guide's walk
default        ≤ 2400 ms
```

The LEAD duration is deliberately tied to the walk so the camera and the guide
arrive together. That coupling is the one piece of real transition intent already
in the system, and it should survive whatever replaces the rest.

---

## 3. Problems this creates

1. **The look direction sweeps.** Position and target interpolate on the same
   clock, so a move that changes which wall we face rotates the view across the
   room at travel speed. A visitor turns their head first and then walks; this does
   both at once, evenly.

2. **Straight lines cut corners.** Nothing tests the segment. Between two beats on
   perpendicular walls the camera passes through the corner of the room. Around the
   plinth it can pass through the vessel.

3. **One curve for every distance.** A 0.4 m reframe between B and C and an 11 m
   traverse from Campo to Estudio use the same shape, differing only in duration.
   The short move feels sluggish and the long one feels like a dolly on rails.

4. **Portals are cuts.** Defensible for a threshold, but it means the one moment
   with the most spatial meaning — crossing into another room — has the least
   authored movement.

5. **Reduced motion equals teleport.** Accessibility currently means losing all
   spatial continuity rather than gaining a calmer version of it.

6. **No arrival.** The eased tail is the only settling. Nothing distinguishes
   "stopping in front of a work" from "stopping anywhere".

7. **Height interpolates blindly.** Camera height is whatever the lerp gives at
   that instant, so a move between a 1.58 m contemplation and a 2.12 m dwell
   floats upward through the middle of the room.

---

## 4. What is already right, and must be preserved

- one authority writes the camera per frame, and transitions do not contest it;
- LEAD travel is matched to the guide's walk;
- the Director asks for shots and never touches the camera;
- reduced motion is respected as a first-class path, even if its current answer is
  crude;
- `snapTo` exists as an explicit, separate verb from `playShot` — a cut is a
  decision, not an accident.

Any transition system must keep all five.
