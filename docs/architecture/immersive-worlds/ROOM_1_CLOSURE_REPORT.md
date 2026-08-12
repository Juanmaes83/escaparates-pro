# Room 1 — closure report

**Galería A — Horizontes**, 16 × 4.8 × 11 m, origin `[0, 0, −10]`.

Contact sheets: `qa/evidence-grammar/contact-sheet.html`
Captures: `qa/evidence-grammar/current/` · Containment: `.../containment.json`

---

## 1. Final route

Geometry-driven. Arrival is at `[0, −5.9]` facing the north wall; the exit is the
east door at `[8, −10]`. A west-to-east sweep of the walls with the free-standing
piece last, on the way out, is the only order that never doubles back.

```
Bienvenida
  → portal
Campo de ceniza      west wall,   1.75 × 2.15  (portrait)
Horizonte interrumpido north wall, 2.60 × 1.78
División tercera     north wall,  2.10 × 1.50
Estudio de figura, IV east wall,   0.95 × 1.22  (small)
Vasija de arenas     plinth,      0.60 × 0.88 × 0.60  (free-standing)
  → threshold → Galería B
```

Keeping the previous order would have meant 13.4 m back west from División to
Campo and 16 m east again to Estudio.

## 2. Structure

| | |
|---|---|
| Stops | 10 |
| Beats | 33 |
| Duplicate ids | 0 |
| Orphaned beats | 0 |
| Stops with ambiguous subject | 0 |
| Threshold beats | appears once |
| Unsettled captures | 0 |
| Perceptually duplicate pairs | 0 |
| Console errors | none |

Galería A itself holds **5 stops and 20 beats**; the remainder are the welcome, the
threshold, Galería B's two stops and the close.

---

## 3. Camera language rules

Two rules and one predicate, shared by all three framings. **There is no per-object
exception anywhere in the code.**

### Wall works
Facing comes from the artwork's own anchor normal. Optical centre is the anchor.
Standoff retreats into the room: ≥ 4.8 m for contemplation, ≥ 5 m for arrival.

### Free-standing objects — `isFloorAnchor(anchor)`
An anchor whose normal points at the ceiling.

- **Facing** (`_facingFor`) comes from the observer, not from a normal: a piece with
  no front faces whoever is looking at it.
- **Optical centre** (`_subjectCentre`) is a plinth height plus half the object,
  not the floor.
- **Standoff** is short — ≥ 1.4 m past the figure, capped at 5.5 m — because a
  plinth sits in the middle of a room and there is no six metres to retreat into.
- **Contemplation stands across** the line between person and object, so both read
  broadside at the same depth. This is the rule that replaced a constant sideways
  nudge, and the reason it was needed is structural: deriving facing from the
  figure makes that figure's lateral offset identically zero, so a camera behind
  them always sees them in front of the work.
- **Detail swings off the approach axis** and lifts above the rim, framing the
  whole volume. It is not a macro crop: a vessel shot dead-on is a silhouette.

Wall works take a byte-identical path to the one they took before these rules
existed, which is what makes the regression result below possible.

### Room containment
Space overviews are clamped inside the bounds they frame.

---

## 4. Drift metric

```
drift = |camera.target − subjectOpticalCentre|
```

where the optical centre is the anchor for a hung work and
`anchor + plinthHeight + height/2` for a free-standing one. The metric answers one
question for every subject type: **how far is the camera aiming from what it is
supposed to be showing?**

It previously compared against the raw anchor, which for a plinth is on the floor,
and reported 1.46 m of drift on shots aimed exactly right.

**Drift is necessary and not sufficient.** The arrival at the Vasija measured
0.06 m — dead on the vessel — while the guide covered it completely. Containment
and visual review exist because of cases like that.

---

## 5. Regression — approved beats

Baseline: PASS B closure, commit `f7c1645` — the state that was approved.

| Work | Beats | Max Δposition | Max Δtarget | Status |
|---|---|---|---|---|
| Horizonte interrumpido | 4 | 0.000 | 0.000 | UNCHANGED / PASS |
| División tercera | 4 | 0.000 | 0.000 | UNCHANGED / PASS |
| Noche de invierno | 4 | 0.000 | 0.000 | UNCHANGED / PASS |
| Cuaderno de luz | 4 | 0.000 | 0.000 | UNCHANGED / PASS |

**16 / 16 identical. Maximum deviation 0.0000 m.**

## 6. Drift, all Room 1 beats

| Stop | A | B | C | D |
|---|---|---|---|---|
| Campo de ceniza | 0.24 | 0.31 | 0.34 | 0.30 |
| Horizonte interrumpido | 0.39 | 0.31 | 0.49 | 0.25 |
| División tercera | 0.19 | 0.32 | 0.48 | 0.21 |
| Estudio de figura, IV | 0.17 | 0.32 | 0.25 | 0.17 |
| Vasija de arenas | 0.35 | 0.49 | 0.54 | 0.00 |

## 7. Containment

**33 / 33 cameras inside legal space.**

Its first run found a defect nobody had seen: the closing address rendered black,
because the room overview retreats far enough to fit a twelve-metre gallery in
frame — two metres past its east wall. Aimed perfectly at a room it stood outside
of, with every state variable agreeing it was fine.

---

## 8. Gate results

| Gate | Result |
|---|---|
| Route verified | PASS |
| 10 stops / 33 beats | PASS |
| No duplicate beats | PASS |
| No missing headers | PASS |
| Approved beats unchanged | PASS — 0.0000 m |
| Campo vertical-format test | PASS |
| Estudio small-scale test | PASS |
| Vasija A | PASS |
| Vasija B | PASS |
| Vasija C | PASS with a minor issue |
| Vasija D | PASS |
| All cameras inside valid space | PASS — 33/33 |
| Drift metric semantically correct | PASS |
| Deterministic captures | PASS — 33, all settled |
| Contact sheets | PASS |
| Visual review completed | PASS |
| Unresolved blockers | none |
| QA suite | **68 / 68** |

### Visual verdicts

- **Campo de ceniza** — PASS. Portrait format immediately readable, visitor gives
  credible scale, the Archivo doorway remains as spatial context.
- **Estudio de figura, IV** — PASS. The visitor is nearly as tall as the frame,
  which is exactly what proves the work is small. Not monumentalised.
- **Vasija A** — PASS. Vessel on plinth with the guide beside it, gallery context,
  camera inside.
- **Vasija B** — PASS. Both figure and object readable, observational.
- **Vasija C** — PASS, minor issue: the visitor's feet are cropped at the frame
  edge. Scale relation, silhouette, pedestal and containment are all correct;
  the crop is compositional and was deliberately left rather than reopened.
- **Vasija D** — PASS. Whole volume at an angle, rim visible from slightly above,
  self-shadow describing the form. Not painting language.

The three camera languages are visibly distinct: a wall work is framed from in
front of its wall, a small work is approached closer with the figure for scale, and
a free-standing object is read broadside and then turned.

---

## 9. Known limitations

- **Vasija C crops the visitor's feet.** Recorded, not fixed.
- **The visitor figure is provisional** (IW-DEC-029) — the guide's geometry without
  its bun. Avatar quality is deferred.
- **Beat A and Beat C share a family of composition**, both holding a figure beside
  a work. Separable by figure, width and camera height, but closer to each other
  than either is to B or D.
- **Campo de ceniza renders very dark.** Consistent with an ash-and-oil work, but
  worth a Product Owner eye.
- **Transitions between beats are single eased lerps** — see `TRANSITIONS_AUDIT.md`.
  This is the subject of the next block and is not a Room 1 defect.

---

## 9b. QA

**68 / 68, exit 0.** Baseline raised from 67 to 68 by a sculpture-specific check.

The closure run first reported 64/67 with three failures, and all three were stale
assertions of mine rather than product defects: the messages printed six correct
contemplation beats and six correct D beats while failing a literal `=== 3`
written when the gallery held three artwork stops. Two related repairs came with
the fix — `DETAIL` was missing from the role map, so the sculpture's D read as a
gap, and the sculpture was being measured against the painting matrix.

The counts now derive from the route. The lesson is worth keeping: the
tour-integrity checks scaled from seven stops to ten by themselves because they
read the manifest; these did not, because they carried a number by hand.

```
ok  GRAMMAR-ARTWORK-ABCD        02:·ABCD · 03:ABCD · 04:ABCD · 05:ABCD · 08:ABCD
ok  GRAMMAR-SCULPTURE-ABCD      06h-lleva-vasija:ABCD
ok  GRAMMAR-C-VISITOR-NOT-GUIDE 6 beats, visitor present, guide absent
ok  GRAMMAR-D-NO-VISITOR-FIGURE 5 artwork beats, no figure
ok  GRAMMAR-PROJECTION-D-NO-GUIDE
ok  BROWSE-MOVES-THE-CAMERA · BROWSE-DOES-NOT-MOVE-THE-TOUR · BROWSE-RETURNS-TO-ORIGIN
ok  STATES-DETERMINISTIC        23/23 states, zero camera violations
ok  TOUR forward 1→…→10 · backward 10→9→8→7
```

Collection Browse and its exact return to origin survive the route being
reordered and the stops renumbered, which was the regression that mattered most.

---

## 10. Frozen

```
ROOM 1 = CLOSED / APPROVED BASELINE
```

Frozen components: the 20 Galería A beats and their end poses; the wall-work and
free-standing camera rules in `scene-kits/museum/museum-scene-kit.js`; the anchors
of all five pieces; the route order.

**Do not alter Room 1 camera beats in future blocks without explicit regression
evidence and approval.** The regression harness is
`qa/tools/grammar-contact-sheet.mjs` plus `qa/tools/camera-containment.mjs`; the
baseline is this commit's `qa/evidence-grammar/current/audit.json`.

For the transitions block specifically: transitions change how the camera arrives,
never where it stops. A correct implementation leaves all 33 captures identical.
