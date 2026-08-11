# Museum — Experience Grammar reconciliation audit

What `MUSEUM_EXPERIENCE_GRAMMAR.md` asks for, measured against what the Museum
already does. Audit first; the working hypothesis was that most of it already
exists under different names. **That hypothesis was largely correct.**

Companions: `MUSEUM_GUIDED_TOUR_CONTRACT.md` (order, control, integrity),
`TOUR_ORDER_AUDIT_BEFORE.md` (the drift that preceded it).

---

## 1. Documentation read

**Implementation branch `claude/immersive-worlds-module-c0d3f7` @ `3db2d9d`:**
`MUSEUM_GUIDED_TOUR_CONTRACT.md`, `TOUR_ORDER_AUDIT_BEFORE.md`,
`qa/evidence-tour/RESULTADO.md`, `DECISION_LOG.md` (through IW-DEC-028),
`engine/experience/experience-director.js`, `engine/experience/tour-manifest.js`,
`engine/core/runtime.js`, `engine/world/world-store.js`, `app/ui/hud.js`,
`qa/deterministic-states.js`, `qa/run-qa.mjs`, `worlds/museum-v1.world.json`.

**Documentation branch `docs/immersive-worlds-current-state-2026-08-10` (PR #40):**
`MUSEUM_EXPERIENCE_GRAMMAR.md` in full. Not merged, not cherry-picked; read as
product memory.

**Drift found:** none that contradicts. The grammar document's §23 anticipates
exactly this reconciliation and its §27 gate matches the pass that ran. Its §12
allows reconstruction instead of true seek provided the UI says so truthfully —
which is what `MUSEUM_GUIDED_TOUR_CONTRACT.md` §4 already documents. Authority
order was never contested.

---

## 2. The 17 beats, mapped

Seven canonical Stops over seventeen beats — the grouping established by
IW-DEC-028, unchanged by this pass. Grammar role assigned by **observed
behaviour**, not by name.

| Stop | Beat | Intent | Grammar role | Evidence |
|---|---|---|---|---|
| 01 Bienvenida | `step.01-entrada` | ENTRY | **A** context/arrival | lobby wide, guide present |
| 02 Horizonte | `step.02-paso-galeria-a` | PORTAL | **Transition** (space→space) into the Stop | portal crossing |
| | `step.03-lleva-horizonte` | LEAD | **A** context/arrival | camera 2.9 m behind guide, room + work + guide |
| | `step.04-horizonte` | ACCOMPANIED | **B** shared attention | over-the-shoulder |
| | `step.04b-horizonte-cesion` | FOCUS | **D** pure artwork POV | verified: no guide in frame, ficha, `1/5` |
| 03 División | `step.05-lleva-division` | LEAD | **A** | |
| | `step.06-division` | ACCOMPANIED | **B** | |
| | `step.06b-division-cesion` | FOCUS | **D** | |
| 04 Cámara oscura | `step.07-lleva-umbral` | LEAD | **Transition** (approach to threshold) | |
| | `step.08-paso-galeria-b` | PORTAL | **Transition** (space→space) | |
| 05 Noche | `step.09-lleva-noche` | LEAD | **A** | |
| | `step.10-noche` | ACCOMPANIED | **B** | |
| | `step.10b-noche-cesion` | FOCUS | **D** | |
| 06 Cuaderno (projection) | `step.10c-lleva-cuaderno` | LEAD | **A** | |
| | `step.10d-cuaderno` | ACCOMPANIED | **B** | |
| | `step.10e-cuaderno-permanencia` | FOCUS, 26 s | **D** time-based dwell | dwell length already specialised |
| 07 Cierre | `step.11-cierre` | EXIT | closing address | |

**Stop 04 is not an artwork Stop.** It is a pure threshold moment — two transition
beats and no work. It is correctly a Stop (the visitor perceives "we are moving to
the dark room" as an authored moment) but it does not take artwork A/B/C/D, and it
should not be forced to.

---

## 3. Reuse matrix

| Required function | Current capability | Classification | Action |
|---|---|---|---|
| A context / arrival | LEAD framing: camera behind the guide's destination, room + work + guide in frame | **KEEP + RECLASSIFY** | none |
| B shared attention | ACCOMPANIED framing, over-the-shoulder | **KEEP + RECLASSIFY** | none |
| C human contemplation | — | **TRUE GAP** | see §6, stop-gated |
| D pure artwork POV (wall works) | FOCUS/cesión beat: guide steps aside 0.92 m and leaves frame, artwork alone, ficha shown | **KEEP** | none |
| D time-based dwell (projection) | 26 s FOCUS beat | **KEEP** | none |
| Transition artwork→artwork | LEAD beats already walk the guide between works | **KEEP + RECLASSIFY** | none |
| Transition space→space | PORTAL beats | **KEEP + RECLASSIFY** | none |
| Tour forward / backward | `nextTourStep` / `previousTourStep` (IW-DEC-028) | **KEEP** | none |
| Collection Browse prev/next artwork | `runtime.focusNeighbour(±1)`, already preserving the return pose across hops | **KEEP + RECONNECT** | camera fix, §5 |
| Collection Browse controls in the tour | existed, but hidden at every guided beat | **KEEP + EXPOSE** | §5 |
| Return to exact guided origin | tour position already never moved | **KEEP + RECONNECT** | origin capture + restore, §5 |
| Ficha / expandable content | detail panel, `LEER LA FICHA` | **KEEP** | none |
| Two navigation meanings legible | both prev/next pairs could be live at once | **SCULPT** | §5 |

Nothing in this pass created a camera composition, an image, a guide staging or a
scene asset. The world file was not touched at all.

---

## 4. Pure Artwork POV — proof

Measured at `step.04b-horizonte-cesion` (Stop 02, beat 5 of 17):

| Question | Answer | Evidence |
|---|---|---|
| Guide in frame? | **No** — steps aside 0.92 m, out of shot | `qa/evidence/museum_guide-handoff.png` |
| Visitor character in frame? | No — there is no avatar | same |
| Artwork sole protagonist? | Yes | same |
| Ficha present? | Yes: title, creator, year, medium, dimensions, `LEER LA FICHA` | same |
| Focus state? | `state.focusedEntityId` set; camera stays DIRECTED on the authored shot | audit JSON |
| Previous/next available? | Now yes — was hidden | §5 |

One qualification, stated rather than smoothed over: the guide is **out of frame**,
not dismissed. At this framing and aspect she is not visible. At the projection's
dwell beat she *is* partially visible at the bottom of frame — see §6.

---

## 5. What changed

Three behavioural fixes. No new visual material.

### 5.1 Collection Browse moved the label but not the camera

**The defect.** From a guided beat, `focusNeighbour` changed the wall label and the
`n / 5` counter to the next work while the camera kept showing the previous one.
Captured before and after: `qa/evidence-grammar/audit_browse_2hops.png` reads
"División tercera · Bruno Ferrán, 1968 · 3 / 5" over an image of *Horizonte
interrumpido*.

**Cause.** `Runtime.focusEntity` refused the camera for *any* focus while a route
ran:

```js
if (params.camera === false || this.state.mode === EXPERIENCE_MODE.GUIDED) return …;
```

The clause existed so a guided beat's own focus dispatch would not steal the camera
from the Director — but the Director already passes `camera: false` explicitly, so
the `|| GUIDED` half only ever suppressed the one case that legitimately wants the
camera: a visitor browsing.

**Fix.** Drop the redundant half. Entering browse from inside the tour now records
the origin once, pauses the route so it cannot advance underneath the visitor, and
dismisses the guide so the presentation stays artwork-first.

### 5.2 Exit returns to the exact origin beat

`releaseFocus` during a route returned `true` and did nothing. It now restores the
recorded origin through `ExperienceDirector.reapplyCurrentShot()` — DIRECTED
authority, the beat's authored shot, the beat's guide staging — and resumes the
transport state it found. The browsed work never entered the tour's position, so
there is nothing to unwind in World State.

### 5.3 The two previous/next meanings are no longer both live

Browse controls were hidden at every guided beat, making an existing capability
unreachable. They are now exposed at the beat where the grammar says browse is
entered from — the yield beat, `shotIntent === FOCUS` — and while browsing:

- the tour transport reads `Colección · vuelve a la parada NN` instead of implying
  it is still advancing;
- the tour's own Pausar/Siguiente stand down;
- Close reads `Volver a la parada`.

---

## 6. True gaps — stop-gated, not built

### 6.1 Beat C — human contemplation · TRUE GAP · VISUAL

No beat shows a human contemplating the work. The rhythm currently runs
A → B → D: the guide presents, then leaves the frame. The step from "I am being
guided" to "I am contemplating" happens without the intermediate human view the
grammar §7 asks for.

- **Why existing content cannot fulfil it.** B is over-the-shoulder — the guide is
  the near-field mediator, not a figure being observed. D is deliberately empty of
  people. Neither is a medium view of a person in front of a work.
- **Smallest intervention I would recommend.** One new framing function in the
  Museum Scene Kit — a medium lateral view holding the guide and the work in the
  same frame at contemplation distance, reusing the existing guide, the existing
  `aside` staging and the existing anchors. One beat inserted per artwork Stop,
  authored in the world file. No new images, no new character work, no new
  geometry.
- **Not built.** This is a new material camera composition, which the pass's visual
  stop gate reserves for Juanma + ChatGPT approval.

### 6.2 Beat D purity at the projection · TRUE GAP · VISUAL, small

At `step.10e-cuaderno-permanencia` the guide's head is visible at the bottom of
frame (`qa/evidence/museum_proyeccion-permanencia.png`). For a 4.6 m projection the
camera sits further back than for a wall work, so the 0.92 m step aside no longer
clears the frame.

- **Smallest intervention.** Either dismiss the guide entirely for time-based dwell
  beats, or widen the aside for large subjects. Both are staging changes, not new
  assets — but both alter an approved composition, so they wait for the same gate.
- **Not built.**

---

## 7. Transition map

| Connection | Family | Realised by | Status |
|---|---|---|---|
| 01 → 02 | space → space | `step.02-paso-galeria-a` (PORTAL) | authored |
| 02 → 03 | artwork → artwork | `step.05-lleva-division` (LEAD) | authored |
| 03 → 04 | artwork → space threshold | `step.07-lleva-umbral` (LEAD) | authored |
| 04 → 05 | space → space | `step.08-paso-galeria-b` (PORTAL) | authored |
| 05 → 06 | artwork → artwork | `step.10c-lleva-cuaderno` (LEAD) | authored |
| 06 → 07 | in place | `step.11-cierre` (EXIT) | authored, no locomotion |

Every connection is authored; none is an accidental teleport. The two families are
already distinguished by `SHOT_INTENT` — LEAD for artwork→artwork, PORTAL for
space→space — so the distinction the grammar asks for is expressed in existing
data. **No transition records were created.** The future Live Two-World Portal
belongs to the PORTAL rows and was not touched.

---

## 8. What was deliberately not changed

- the world file — **zero edits in this pass**;
- the 17 beats, their ids, their order, their durations;
- any camera composition, guide staging, artwork image or scene asset;
- the Focus system — reconnected, not duplicated;
- the Tour Contract and its twelve invariants;
- `SHOT_INTENT` vocabulary — no renaming for semantic neatness;
- the Projection graft;
- `master`.
