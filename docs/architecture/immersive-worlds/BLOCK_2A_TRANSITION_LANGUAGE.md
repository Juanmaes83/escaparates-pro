# Block 2A — in-room transition language

How the camera travels between beats inside a room. Destinations do not change:
every transition lands on the frozen Room 1 pose.

Baseline: Room 1 closure `a0ada12` (68/68).
Contracts: `TRANSITION_LANGUAGE_SPEC.md` (design), `TRANSITIONS_AUDIT.md` (before),
`ROOM_1_CLOSURE_REPORT.md` (the frozen destinations).
Review: `qa/evidence-transitions/transition-review.html`.

---

## 1. Architecture — one mechanism, five configurations

There are not five transition subsystems. `DirectedController` gained four
properties, and the families are parameter sets over them:

| | what it does |
|---|---|
| `phased(k, flat)` | departure → travel → arrival as one reparametrisation of [0,1] |
| separate target clock | the look leads the move by `lead`, so the view stops sweeping |
| `via` waypoint | a quadratic Bézier control point; bends the middle only |
| `holdHeight` | height resolves late instead of drifting through the room |

The three-layer boundary is literal, and was corrected by the Product Owner
mid-design after a first version that would have derived meaning from distance:

```
Experience Director  = WHY     chooses the family from the beat relationship
Transition mechanism = HOW     phases, curves, lead, arc
Museum Scene Kit     = WHERE   room bounds, obstacles, a safe waypoint
```

The Scene Kit is asked whether a segment is passable and where to bend it. It is
never asked what a move means.

## 2. The families, and how each is decided

| Family | Decided by | Shape |
|---|---|---|
| **T1 micro reframing** | same subject, next beat | flat 0.00, lead 0.00, no waypoint |
| **T2 local walk** | different subject, neighbouring | flat 0.45, lead 0.18, waypoint if needed |
| **T3 gallery traverse** | different subject, cross-zone | flat 0.70, lead 0.40, waypoint, hold height |
| **T4 object orbit** | same subject, free-standing piece under inspection | arc waypoint at constant radius |
| **T5 threshold approach** | destination is a space | flat 0.55, lead 0.50, hold height |

Semantics decide; geometry executes. Only the T2/T3 split consults distance, and
only because the world does not yet declare zones — distance stands in as evidence
for a distinction the data cannot express. **No beat in the world carries a
transition label.**

## 3. Measured — whole route

RUN: `slice.json`, generated `2026-08-12T09:43:06Z`, code at `cd49e13`.

| | |
|---|---|
| Transitions measured | **30** |
| Failures | **0** |
| Endpoint lock | **exact** — worst case 4.4e-16 |
| Path samples outside a room | **0** |
| Maximum turn | **3.10 °/frame** at `step.11-cierre` (T5) |
| Families | 19 T1 · 4 T2 · 3 T3 · 2 T4 · 2 T5 |
| Authored cuts, out of scope | 2 portals |

All five families are in use. **No sixth family was needed**, which was the
condition for stopping and consulting.

### Reduced motion

On the hard Campo→Horizonte traverse: **700 ms against 6667 ms, the same 3.43 m of
path travelled, identical destination.** Shorter and calmer, not a teleport.
Previously it resolved to a cut, which removed the spatial continuity an
accommodation is supposed to protect.

### QA closure

**68 contracts covered, zero failures**, across two runs whose union is exact:

| Run | Checks | Result |
|---|---|---|
| `qa-partial-run.log` — killed by a container restart at `WARMUP-COMPILES` | 51 unique | 51 ok, 0 fail |
| `qa-tail-run.log` — resumed with `IW_QA_TAIL=1` | 19 unique | 19 ok, 0 fail |
| **Union** | **68 unique, no gap** | two static file checks overlap and agree |

Both logs are committed rather than summarised: a partial run's evidence is only
usable if the reader can see where it stopped.

`STATES-DETERMINISTIC` is the one that mattered — 23 deterministic states, every
guided one among them, zero camera violations. Those states drive the Director and
the DirectedController this block changed.

---

## 4. Lessons

Promoted only where there is an observable symptom, a root cause and a reusable
correction.

### 4.1 A velocity profile must integrate to exactly one

**Symptom:** the first phased curve returned 1.038 at k=0.75 and then fell back —
non-monotonic, an overshoot mid-move.
**Cause:** I wrote the ramp integral by hand instead of deriving it. With a
smoothstep ramp of width `r` at each end, area is `vMax·(1−r)`, so `vMax = 1/(1−r)`.
**Correction:** derive the normalisation; assert monotonicity and exact endpoints
across the parameter range before using a curve. Both are cheap and would have
caught it before any render.

### 4.2 Baseline precision is a floor on what you can conclude

**Symptom:** a 2–4.5 mm endpoint residual read as a product defect.
**Cause:** the frozen baseline stores positions rounded to centimetres, so it
cannot resolve better than 5 mm. Full-precision values were being compared against
rounded ones.
**Correction:** measure exactness against what the system actually requested, and
compare to a stored baseline only within that baseline's own granularity. **A
tolerance below the reference's precision is not a tolerance.**

### 4.3 A quadratic harness makes evidence too expensive to preserve

**Symptom:** the route harness took forty minutes because every case replayed the
route from the start.
**Cause:** O(n²) reconstruction — measuring beat 30 cost 30 replays.
**Correction:** one pass, measuring each transition as it happens. Four times
faster and strictly more faithful, since a real transition begins wherever the
previous beat left the camera. **Measurement cost is a correctness concern: an
expensive harness gets run less, and unrun checks prove nothing.**

### 4.4 Record kind is not entity kind

**Symptom:** the orbit family never fired; both sculpture inspection beats
classified as micro reframings.
**Cause:** `store.kindOf` answers the record *category* — ENTITY, SPACE — not the
entity's own `kind`, so testing it for `'SCULPTURE'` silently never matched.
**Correction:** read the entity record for entity semantics. More generally: **a
lookup that returns a plausible string for the wrong question fails silently.**
Prefer accessors whose name states which taxonomy they answer.

### 4.5 An absent category is a diagnostic signal

**Symptom:** the family map came back `19/4/3/0/3` on a route that plainly contains
an orbit.
**Cause:** 4.4, invisible in review — the classification code reads correctly.
**Correction:** **count what you expect to exist, not only what you expect to
pass.** A zero in a distribution is evidence. This is now the cheapest check in the
transition harness and it found the most hidden defect of the block.

### 4.6 Travelling around an object is not detouring past it

**Symptom:** the orbit swung the look 40.6°/frame.
**Cause:** the waypoint pulled the midpoint toward open floor — correct for
rounding a corner, wrong for an orbit — and the curve passed 0.67 m from the centre
of an 88 cm vessel. The subject was also excluded from its own clearance test.
**Correction:** an orbit holds its radius: control point on the bisector at
`r / cos(θ/2)`. **A heuristic that is right for one intent is not automatically
right for another that happens to use the same mechanism.**

### 4.7 Arc reach must be bounded, and bends must stay in the room

**Symptom:** the radius fix threw 113 path samples outside the gallery.
**Cause:** past about a third of a turn `r / cos(θ/2)` runs away; eight metres of
reach put the control point outside the building. The orbit branch also returned
early, skipping the bounds clamp the corner branch used.
**Correction:** bound the reach and clamp every waypoint to the room. **A flatter
arc inside the room is the better failure.** And when adding an early return,
check what it skips.

### 4.8 Auditing evidence and then discarding it is not auditing

**Symptom:** ninety minutes spent re-proving 51 checks that an audited run had
already proven, then losing that run to a container restart too.
**Cause:** I verified the preserved evidence was valid and re-ran it anyway,
justifying it as "clean provenance". The governance already answers that: record
provenance per run. My cost estimate for the replayed prefix was also wrong.
**Correction:** the runner now has `IW_QA_TAIL=1`, which boots into the gallery and
runs only the closing sections. The mechanical inability to resume is what made
restarting easy to justify. **If preserving evidence is not mechanically possible,
it will not happen under pressure.**

---

## 5. What was not changed

Room 1's 33 end poses, the artwork and sculpture grammars, guide choreography,
Focus, Collection Browse and its return contract, World State, the Tour Manifest,
camera authority, Free Explore, the world file, and both portal cuts. Transitions
change how the camera arrives, never where it stops.

## 6. Known limitations

- **Portals remain hard cuts.** Deliberate: Block 2A ends at the threshold.
- **The T2/T3 split uses distance** because zones are not declared in the world.
  When they are, the classifier should read them instead.
- **A single quadratic cannot describe a wide arc**, so orbits beyond roughly a
  third of a turn flatten rather than follow the circle. Acceptable here; a wider
  orbit would need segmenting.
- **Path containment is sampled, not solved.** It tests the curve the camera
  actually flies, not every possible curve.
