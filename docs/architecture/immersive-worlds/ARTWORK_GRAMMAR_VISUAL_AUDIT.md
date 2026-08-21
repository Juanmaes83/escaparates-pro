# Artwork Grammar — visual audit (PASS A)

Read-only. **No product code, world data or composition was changed in this pass.**
The only files written are the two audit tools in `qa/tools/` and the evidence
under `qa/evidence-grammar/current/`.

Verified HEAD at audit time: `f2c6154`.

Contact sheets: `qa/evidence-grammar/contact-sheet.html`.

---

## 1. Method

The previous passes proved the beats *exist* and stage the right figures. They
never proved the grammar is *legible*. This audit answers the second question, and
it does so with three instruments:

**Settled capture.** Every beat is driven until the camera pose, both figures'
positions and their opacities stop changing and the camera authority is stable and
not mid-transition. Only then is the frame captured. A beat that will not settle is
recorded as failed and **not** photographed — a screenshot taken mid-flight looks
like evidence and lies. All 21 beats settled.

**Target drift.** The distance between where the camera is aimed and where the
beat's own subject actually hangs. This detects "correct label, wrong artwork"
mechanically, without waiting for a human to notice.

**Perceptual distance.** Mean per-pixel difference on the composited frame with the
HUD hidden, so a shared caption bar cannot mask two beats that render the same shot.
It flags pairs to inspect; it never returns a verdict.

### A measurement bug, declared

The first version fingerprinted the WebGL canvas directly and reported **all 21
beats as pixel-identical — 210 duplicate pairs**. That was false. The renderer is
created without `preserveDrawingBuffer`, so the drawing buffer is already gone when
script reads it, and every hash was the same empty buffer. Reporting it would have
cost a full human review chasing duplicates that do not exist. Fixed by hashing the
composited screenshot instead. **The corrected run finds zero suspicious pairs.**

---

## 2. Duplicate suspicion — disproved

Across all 210 beat pairs, none falls below the similarity threshold. There are no
duplicate renders, no near-duplicate poses, and no beat resolving to another Stop's
camera. The earlier suspicion of repeated screenshots is not confirmed by the
current canonical state.

The `División tercera` frame that prompted it is `audit_browse_2hops.png`, which is
**historical BEFORE evidence** of a defect fixed in `81ce767`, deliberately kept for
comparison. It is not in `current/` and is not part of this audit.

---

## 3. Target drift — the mechanical finding

| Beat | Role | Drift | Reading |
|---|---|---|---|
| `step.03-lleva-horizonte` | A | **3.63 m** | frames bare wall |
| `step.10c-lleva-cuaderno` | A | **3.57 m** | same pattern |
| `step.05-lleva-division` | A | **2.19 m** | partial |
| `step.09-lleva-noche` | A | 1.08 m | aims at the work |
| every B | B | 0.31–0.32 m | correct |
| every C | C | 0.43–0.49 m | correct |
| every D | D | 0.19–0.40 m | correct |

**Drift is exclusive to Beat A.** Nine of twelve canonical beats are tight; the
spread is entirely in the arrival shots.

---

## 4. Per-beat matrix

| Stop | Beat | Role | Expected artwork | Guide | Visitor | Drift | Verdict |
|---|---|---|---|---|---|---|---|
| 02 | `03-lleva-horizonte` | A | Horizonte interrumpido | presente | ausente | 3.63 | **FAIL** |
| 02 | `04-horizonte` | B | Horizonte interrumpido | presente | ausente | 0.31 | KEEP |
| 02 | `04c-horizonte-contemplacion` | C | Horizonte interrumpido | ausente | presente | 0.49 | KEEP |
| 02 | `04b-horizonte-cesion` | D | Horizonte interrumpido | presente* | ausente | 0.25 | KEEP |
| 03 | `05-lleva-division` | A | División tercera | presente | ausente | 2.19 | **ADJUST** |
| 03 | `06-division` | B | División tercera | presente | ausente | 0.32 | KEEP |
| 03 | `06c-division-contemplacion` | C | División tercera | ausente | presente | 0.48 | KEEP |
| 03 | `06b-division-cesion` | D | División tercera | presente* | ausente | 0.21 | KEEP |
| 05 | `09-lleva-noche` | A | Noche de invierno | presente | ausente | 1.08 | **FAIL** |
| 05 | `10-noche` | B | Noche de invierno | presente | ausente | 0.31 | KEEP |
| 05 | `10f-noche-contemplacion` | C | Noche de invierno | ausente | presente | 0.46 | **ADJUST** |
| 05 | `10b-noche-cesion` | D | Noche de invierno | presente* | ausente | 0.19 | KEEP |

\* staged in the room but stepped aside and out of frame — the approved Beat D
behaviour, unchanged by this pass.

---

## 5. Cross-artwork harmony

| Role | Stop 02 | Stop 03 | Stop 05 | Verdict |
|---|---|---|---|---|
| **A** context/arrival | bare wall | partial | guide occludes work | **FAIL — not one family** |
| **B** shared attention | correct | correct | correct | **PASS** |
| **C** human contemplation | correct | correct | wrong instance | **ADJUST** |
| **D** pure artwork POV | correct | correct | correct | **PASS** |

B and D are already a coherent family across all three works. The rhythm breaks at
A, and once at C.

---

## 6. Defects, with root cause

### 6.1 Beat A ends on bare wall · FAIL · behavioural

`step.03-lleva-horizonte` renders no artwork, no guide and no room — a lit empty
wall under the caption "Horizonte interrumpido / Acompáñeme".

**Root cause, not the camera.** `_leadFraming` composes the shot from the guide's
position *at the instant the beat starts* and never re-aims at the subject:

```js
const from = this._guide && this._guide.current.opacity > 0.05
  ? this._guide.current.position
  : …
```

The further the guide has to walk, the further the settled frame ends from the work.
Drift confirms the mechanism: 3.63 m and 3.57 m for the two longest walks, 1.08 m
for the shortest. This is a wiring defect, not a taste question, and it is why the
three A beats are not equivalents.

**Not fixed.** Recommended smallest intervention: make the LEAD shot's end pose
frame the beat's subject rather than the guide's starting point, leaving the travel
path alone. To be confirmed in PASS B.

### 6.2 Beat A05: the guide occludes the work · FAIL · staging

In `step.09-lleva-noche` the camera does aim at the artwork (drift 1.08 m), but the
guide stands squarely between camera and wall and hides almost all of *Noche de
invierno*. Beat A's function — room, work, guide, spatial relation — is not met
because the work is not visible.

**Root cause:** the guide anchor for this work sits nearly on the camera–artwork
axis, and the LEAD camera is placed 2.9 m directly behind her.

**Not fixed.** Likely resolved by the same intervention as 6.1, plus a lateral
offset so she stands beside the sightline rather than on it. To be confirmed.

### 6.3 Beat C05: wrong spatial instance · ADJUST · authored data

C02 and C03 are correct and equivalent: visitor on the left, at viewing distance,
work fully legible, figure giving scale. C05 breaks the family — the figure stands
on the **right**, at the very edge of the work, and dominates the frame while the
artwork reads small behind.

**Root cause:** I placed the three visitor anchors by hand in the previous pass
without accounting for the smaller work (200 × 136 cm against 260 × 178 cm) or for
which side keeps the family consistent. `_contemplationFraming` then derives a
correct camera for an incorrectly placed figure — the framing code is fine, the
authored anchor is not.

**Not fixed.** Recommended: move `anchor.gallery-b.visitor-noche` to the same side
and relative offset as the other two. Data change only, no code.

---

## 7. Frame classification

| Type | Count | Frames |
|---|---|---|
| Canonical narrative beat | 12 | the A/B/C/D of Stops 02, 03, 05 |
| Projection specialised sequence | 4 | Stop 06 A/B/C/D |
| Address (not artwork grammar) | 2 | Bienvenida, Cierre |
| Transition | 3 | two PORTAL beats, threshold lead |
| Unsettled / invalid | 0 | — |

---

## 8. What is already correct

- All twelve B and D beats, across all three works.
- C02 and C03.
- The whole Projection sequence, including the empty dwell.
- Zero duplicate renders; zero console errors; all 21 beats settle.
- Collection Browse and its return contract — untouched here, still green at 67/67.

## 9. What was not changed

Everything. This pass mutated no product code, no world data, no composition and no
approved shot. Recommendations above wait for explicit approval.


---

# PASS B — the defects closed

Corrective pass. Evidence from before the fixes is preserved under
`qa/evidence-grammar/before-passb/` and shown side by side in §3 of the contact
sheet; it is never mixed into the current matrix.

## 10. Root cause, confirmed against HEAD

The PASS A diagnosis said the lead shot "composes from the guide's position at beat
start". Reading the code at HEAD made it sharper, and the sharper version is the
one that matters:

**`_leadFraming` composed on the guide and nothing else.** Its own declared subject
size was `[0.6, 1.7, 0.4]` — a human bounding box — and it aimed 1.2 m *past* her
along her heading. The work was never an input. Whether it appeared in frame was
luck, and the luck scaled with how far she had to walk.

**A05 had a second, independent cause.** `anchor.gallery-b.guide-noche` sits at
lateral **+0.00** — exactly on the work's centre axis. Any camera behind her sees
her covering the print. The other leads sit at +0.75 and +1.60.

## 11. The three corrections

**11.1 The arrival holds the work** — `_leadFraming` now receives the resolved
subject and composes on the pair, wider and higher than the contemplation beat so
the two read differently. The no-subject branch — the first arrival, the walk to a
threshold — keeps the guide-only shot it always had. **Locomotion is untouched:**
this changes where the camera stands, not where she walks.

**11.2 A05 gets its own arrival anchor** — the guide had to leave the work's axis,
but her anchor is shared with B05 and D05, which are correct and protected. Rather
than move theirs, the lead beat takes a new `anchor.gallery-b.guide-noche-llegada`
at lateral +1.30. B05 and D05 are provably unchanged.

**11.3 C05 rejoins the family** — the visitor stood on the opposite side to C02/C03
and at the edge of the work. All three now stand on the same side with the offset
scaled to each work rather than copied:

| Beat | Work width | Visitor offset | As fraction | Distance out |
|---|---|---|---|---|
| C02 Horizonte | 2.60 m | +1.15 m | 0.44 × w | 2.20 m |
| C03 División | 2.10 m | +1.15 m | 0.55 × w | 2.20 m |
| C05 Noche | 2.00 m | **+0.92 m** | 0.46 × w | 2.10 m |

Equivalent, not cloned: Noche is the smallest work and takes the smallest offset.

## 12. Target drift, before and after

| Beat | Before | After |
|---|---|---|
| A02 Horizonte | 3.63 m | **0.39 m** |
| A03 División | 2.19 m | **0.19 m** |
| A05 Noche | 1.08 m | **0.31 m** |
| A06 Cuaderno | 3.57 m | **0.24 m** |
| B02 / B03 / B05 | 0.31 / 0.32 / 0.31 | unchanged |
| C02 / C03 | 0.49 / 0.48 | unchanged |
| C05 | 0.46 | 0.39 |
| D02 / D03 / D05 | 0.25 / 0.21 / 0.19 | unchanged |

Every A beat now sits in the same 0.19–0.39 m band as the beats that were already
correct. The protected keeps are numerically identical.

## 13. Visual verdicts

Judged from the rendered frames, not from the numbers.

| Beat | Verdict | What the frame shows |
|---|---|---|
| **A02** | **PASS** | room, *Horizonte* fully legible, guide at left facing the work, stanchion line — an arrival |
| **A03** | **PASS** | same language, División's own position in the room |
| **A05** | **PASS** | guide beside the work, print fully legible, dark-room context intact |
| **A06** | **PASS** | guide at left, projection wall with its light band, *Noche* at frame edge as room context |
| **C05** | **PASS** | visitor at left at contemplation distance, work legible, figure gives scale without dominating |

## 14. Preserved and untouched

Unchanged, and verified unchanged: B02, B03, B05, C02, C03, D02, D03, D05, the
Projection's specialised C and D, Collection Browse and its return contract, the
visitor figure, the guide representation, transition architecture, rooms, and the
content inventory. No artwork was added to the tour — Campo de ceniza, Estudio de
figura IV and Vasija de arenas remain outside it, as PASS B requires.

## 15. Known limitations

- The Projection's A shows a dim wall because the work itself is dim in a dark
  room. It is legible and correctly framed; it is simply a quiet image.
  **Product Owner decision: A06 is KEEP.** Reviewed visually and accepted as it
  stands; no further composition work on it in this pass.
- The visitor figure remains provisional (IW-DEC-029). Unchanged here.
- Beat A and Beat C now share a family of composition — both hold a figure beside a
  work. They are distinguishable by figure (guide with gathered bun and blue coat
  versus visitor with loose hair and olive coat), by width and by camera height,
  but they are closer to each other than either is to B or D. Recorded as an
  observation for review rather than defended as ideal.
