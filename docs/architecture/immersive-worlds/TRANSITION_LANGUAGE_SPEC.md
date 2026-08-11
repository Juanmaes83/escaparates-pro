# Museum — transition language specification

Design brief for the next block. **Nothing here is implemented**, and none of it
should be until this document is approved.

Companion: `TRANSITIONS_AUDIT.md`, which records what exists today.

---

## 1. The target

> The visitor should feel accompanied through an exhibition, not moved through a
> viewport.

The failure modes to design against are specific: teleport, arbitrary tween, game
camera, Street View hop, slideshow, fade-to-black between viewpoints. Each of those
shares one property — the movement carries no information about the space. A
transition should leave the visitor knowing where they went and why.

---

## 2. Taxonomy — five families

Deliberately few. Each is defined by what the visitor should understand at the end
of it, not by its distance.

### T1 · MICRO REFRAMING
*Same subject, next beat.* B→C, C→D within one stop.

The subject never leaves frame. This is a head turn and half a step, not a journey.
Short, mostly positional, target barely moves. If the visitor notices the camera
moved, it was too big.

### T2 · LOCAL WALK
*Neighbouring works, same wall or zone.* Campo D → Horizonte A.

A few steps along the wall. The visitor should keep their bearings the whole way —
the wall stays the reference plane, the room does not spin.

### T3 · GALLERY TRAVERSE
*Across the room.* División D → Estudio A.

Long enough that the room itself is the content of the transition. The visitor
should see where they are going before they arrive. This is the family that most
needs departure/travel/arrival separation.

### T4 · OBJECT ORBIT
*Around a free-standing piece.* Vasija C → D.

Lateral movement on an arc about the subject's vertical axis, radius roughly
preserved. The point is that the object turns and the room does not — the opposite
reading from T3.

### T5 · THRESHOLD APPROACH
*Last stop of a room → doorway.* Vasija D → umbral.

The camera begins orienting toward the destination before it arrives at it. Ends
facing through the opening, not at it. This is the family that will later carry
room-to-room work; it should be built so that block can extend it rather than
replace it.

**Not a family:** the portal crossing itself. That stays an explicit cut until the
room-transition block says otherwise, and it stays a separate verb.

---

## 3. Shared principles

Every family, without exception:

- **Three phases, not one curve.** Departure eases out of the held pose, travel
  carries a roughly constant velocity, arrival decelerates and settles. The current
  single `easeInOutCubic` over the whole move is why short and long transitions
  feel like the same gesture at different speeds.
- **Target leads position.** Turn the head, then move. Give the target its own,
  earlier curve. This alone removes most of the sweeping.
- **Height is authored, not interpolated.** Hold eye height through travel and
  resolve to the destination's height on arrival.
- **The path is tested.** A segment that intersects architecture or a plinth is a
  bug, not a style. Reuse whatever the guide's locomotion already respects.
- **No roll, ever.**
- **Reduced motion shortens and simplifies; it does not cut.** A calm, direct,
  fast move preserves spatial continuity. Teleporting destroys it, which is the
  opposite of an accommodation.

---

## 4. Parameters to author per family

Proposed, not fixed:

| | departure | travel | arrival | target lead | path |
|---|---|---|---|---|---|
| T1 micro | 0.15 s | — | 0.35 s | 0 | straight |
| T2 local walk | 0.3 s | ~1.4 m/s | 0.6 s | 0.2 s | wall-parallel |
| T3 traverse | 0.4 s | ~1.6 m/s | 0.8 s | 0.45 s | floor path |
| T4 orbit | 0.3 s | ~25°/s | 0.6 s | 0 (locked) | arc |
| T5 threshold | 0.3 s | ~1.4 m/s | 0.7 s | 0.6 s | floor path |

Durations become a function of distance and family, replacing the current
`travelForIntent` table of caps. The LEAD/walk coupling must be preserved: where a
transition accompanies the guide, its travel time is still hers.

---

## 5. Transition map for the complete Room 1 route

| From → To | Family |
|---|---|
| Bienvenida → portal → Campo A | cut (portal), unchanged |
| Campo A → B | **T1 micro** |
| Campo B → C | **T1 micro** |
| Campo C → D | **T1 micro** |
| Campo D → Horizonte A | **T3 traverse** — west wall to north wall, 7.5 m |
| Horizonte A → B → C → D | **T1 micro** ×3 |
| Horizonte D → División A | **T2 local walk** — same wall, 6 m |
| División A → B → C → D | **T1 micro** ×3 |
| División D → Estudio A | **T2 local walk** — north wall to east wall corner, 3.5 m |
| Estudio A → B → C → D | **T1 micro** ×3 |
| Estudio D → Vasija A | **T3 traverse** — east wall to centre floor, 7.5 m |
| Vasija A → B | **T1 micro** |
| Vasija B → C | **T4 orbit** — the reading changes from accompanied to broadside |
| Vasija C → D | **T4 orbit** — the beat whose whole point is that the object turns |
| Vasija D → umbral | **T5 threshold approach** |
| umbral → portal → Galería B | cut (portal), unchanged |

Two observations from building this map:

- **T1 dominates.** Twelve of the sixteen intra-room transitions are micro
  reframings. Getting T1 right matters more than anything spectacular.
- **The two T3 traverses are exactly the two moves that currently cut a corner** —
  Campo→Horizonte crosses the north-west corner and Estudio→Vasija crosses the
  stanchion line. They are the first place a tested path pays for itself.

---

## 6. Risks

- **Motion sickness.** Long traverses with a moving target are the classic cause.
  Target lead helps; excessive lead makes it worse. Needs real review, not theory.
- **Orbit fighting camera authority.** T4 must remain a DIRECTED shot, not a new
  controller. If it cannot be expressed as one, that is a finding to report before
  building it.
- **Path testing cost.** If reusing the guide's navigation is not straightforward,
  the honest fallback is a small set of authored waypoints per traverse rather than
  a general solver.
- **Regression surface.** Every Room 1 beat's *end pose* is frozen. Transitions
  change how the camera gets there, never where it stops. The existing capture
  harness settles before shooting, so a correct implementation should leave all 33
  captures byte-identical. **That is the QA gate: if a capture moves, the
  transition work has overstepped.**

---

## 7. Implementation order

1. Three-phase curve + target lead, applied to T1 only. Smallest change, largest
   share of transitions, and it cannot break a long move because it is not used on
   one yet.
2. T2 local walk.
3. T3 traverse with path testing — the two corner-cutters are the acceptance cases.
4. T4 orbit for the Vasija.
5. T5 threshold approach.
6. Reduced-motion path: shortened, never cut.

Room-to-room transition work begins only after T5 exists, and extends it.

---

## 8. QA plan

- all 33 Room 1 end poses unchanged, verified against the frozen baseline;
- no camera position inside geometry at any sampled point *along* a transition, not
  only at its ends — the containment check extends from endpoints to the path;
- no target discontinuity above a threshold per frame;
- no roll;
- reduced motion produces movement, not a cut;
- guide and camera still arrive together on LEAD-accompanied transitions;
- Collection Browse and its return-to-origin unaffected.
