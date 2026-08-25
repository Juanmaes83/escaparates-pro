# IW-3 — Going back, and the authoring that feeds the visitor

> **Status:** DELIVERED FOR REVIEW — NOT APPROVED, NOT MERGED, NOT INTEGRATED.
> **Repository:** `Juanmaes83/escaparates-pro`
> **Branch:** `claude/immersive-worlds-module-c0d3f7`
> **Builds on:** IW-2 (`d5c3d3e`)
> **Module path:** `labs/immersive-worlds/` (unchanged, still isolated)
> **Date:** 2026-08-15

IW-2 made the Museum look like a product. IW-3 makes it *navigable in both
directions*, and connects what an institution writes to what its public reads.

This record exists because it was missing. Nine verticals shipped without one,
which is recorded as L-29 and reconciled in
`MUSEUM_PLAYBOOK_COMPLIANCE_RECONCILIATION.md`.

---

## 1. What changed, and why it was chosen

### 1.1 The guided tour can be walked backwards — the product-defining change

The audit that opened this milestone found something worse than a missing
button. Backward *destination selection* existed, but the only way the runtime
knew how to reach a previous stop was to replay the route forward from the
beginning and stop early. A visitor pressing a back control would have watched
the tour restart.

So the work was not "add ← ANTERIOR". It was to separate two things the engine
had conflated:

| | |
|---|---|
| **SEEK** | deterministic destination recovery. Reconstruction, for tooling. Nobody is watching. |
| **BACK** | a visitor changing their mind. Perceptual. Somebody is very much watching. |

`_crossingIntent` already returned null while `_seeking` — the engine knew
reconstruction should not fly a crossing. What it lacked was the other half: a
return that *is* watched, and therefore must travel.

`back()` now resolves the previous stop and moves to it directly. In the same
room that is a direct move; across a room boundary, `_returnAcrossRooms()` finds
the portal back and dispatches `ACTIVATE_PORTAL` with a CROSSING intent, so the
visitor goes *through the doorway* rather than being swapped into the other room.
Measured on the real product path: a 15.0 m travelled path where the straight
line is 6.8 m, with the portal reporting CROSSED then LANDED.

### 1.2 A Tour Stop has one canonical settled pose

Back needs somewhere fixed to return to, and a stop did not have one. A stop is
several beats, and "where the stop is" depended on which beat you asked about.
Worse, two forward arrivals at the same stop had been measured 2.5 m apart,
because LEAD framing is derived from where the guide happens to be.

Human decision (option C): each Tour Stop resolves to one canonical settled pose,
by intent priority — CONTEMPLATION, then FOCUS, ACCOMPANIED, DETAIL, OVERVIEW.
`canonicalSettle()` is that contract, and three things are now compared rather
than two: what the contract resolves, where the playing tour actually leaves the
visitor, and where the return lands. All three agree to 0.0000 m.

Comparing only the last two would have passed even if both had drifted from the
contract together. That is why there are three.

### 1.3 The HUD counter counts stops, not beats

It had been counting beats, so it jumped several at a time and named a unit no
visitor has a concept of. It now reads `experience.tourOrder` / `tourTotal` —
"Parada 4 de 10".

### 1.4 The Visitante domain became a writing surface

The authoring shell treated every domain identically. Visitor information is
prose — opening hours, access, how to get here — and it was being typed into a
195 px column where "Miércoles a domingo, 11:00 –" wrapped one word per line and
then clipped. An editorial mode roughly doubles the editing column for this
domain only.

`CONSISTENT SYSTEM ≠ IDENTICAL LAYOUT FOR EVERY TASK`.

### 1.5 Every VISITA field is traceable end to end

Twelve fields, each traced from the editor input through `hud.setVisitorInfo()`
to the surface a visitor reads, with sentinel values typed into the real editor
and read off the real panel — not by inspecting the code that connects them.
12/12 CONNECTED.

---

## 2. Defects this milestone found

### Fixed

| Defect | |
|---|---|
| Backward navigation replayed the route forward | §1.1 |
| A stop had no single settled pose; two arrivals differed by 2.5 m | §1.2 |
| The HUD counter counted beats | §1.3 |
| The Visitante editor clipped its own fields | §1.4 |
| The editorial width was published to `#st`, whose sibling `#iw-stage` could not see it | L-23 |
| The Crossing B baseline was photographed but never compared against | now guarded |

### Found and deliberately **not** fixed

**The label card does not follow Back.** The camera returns correctly and the
counter updates, and the artwork label keeps describing the stop just left —
across rooms, a work in the other room. Reproducible in both kinds of Back.

It is left for a human decision because it changes what the guided experience
*says* to a visitor, and because this milestone closed on a process
reconciliation rather than on new product behaviour. It is the first queued item.

`FUNCTIONAL PASS ≠ PRODUCT PASS`: the return is exact to four decimal places and
still tells the visitor the wrong thing.

### Instrument defects, which cost more than the product ones

Four of the six errors recorded this milestone were in the measuring apparatus,
not the product — L-23, L-27, L-28, L-30. Two of them accused the product of a
defect it did not have. The pattern is consistent enough to be worth naming: an
instrument that disagrees with an independent check is more likely to be wrong
than the product is.

---

## 3. Evidence

| | |
|---|---|
| Motion, Guided Back, real product path | `qa/evidence-vs02/guided-back-motion/index.html` — 24/26 |
| Pose equivalence, three-way | `qa/evidence-vs02/guided-reversibility/forward-settle-equivalence.json` |
| VISITA traceability | `qa/evidence-vs02/visita-traceability/` — 12/12 |
| Visitor authoring, matched before/after | `qa/evidence-vs02/visitor-workspace/{before,after}/` |
| Public VISITA panel, matched before/after | `qa/evidence-vs02/visitor-design/{current,corrected}/` |
| Nested room contract | `qa/evidence-vs02/nested-room-spike/` — 17/17 |
| Breeze core provenance | `qa/tools/breeze-core-provenance.mjs` — 16/16 |

Every navigation in the motion evidence is a click on a control a visitor
clicks. No engine call moves the camera in any of it.

---

## 4. Open, and honest

| | |
|---|---|
| The label card after Back | defect, unfixed by choice, §2 |
| P0.2 persistent assets | no byte has ever been stored or retrieved. EXTERNAL BLOCKER |
| Breeze Phase 1A | real WebGPU device and real physics bake reached; GPU readback fails, so no motion is claimed. FROZEN |
| Fresh critic on Crossing B | returned REJECT, contradicting a standing human decision. Nothing changed. Reported in the Human QA package |
| Human verdict | **absent for every vertical in this record** |

---

## 5. Protected baselines

Unchanged, and checked to be unchanged:

- **Crossing A and Crossing B geometry.** Endpoint change NOT AUTHORIZED. The red
  portal effect is not reduced or removed. The Crossing B plan is now compared
  field by field against its recorded baseline on every run of the motion
  harness, and matches exactly.
- **Where an approved beat ends.** Transitions may change how the camera travels,
  never where a beat ends.
- **The transition engine.** KEEP verdict stands; not touched.
- **Engine purity.** `engine/` imports no renderer. The WebGPU bundle loads only
  by dynamic import, and nothing on the visitor path imports it.
- **Master.** Untouched.

---

## 6. Next milestone proposed

Not started, and not to be started without a verdict:

1. The label card follows Back.
2. Whatever the Human QA verdicts in `MUSEUM_HUMAN_QA_PACKAGE.md` require.
3. Breeze Phase 1A resumed at the GPU readback — only after the above.
