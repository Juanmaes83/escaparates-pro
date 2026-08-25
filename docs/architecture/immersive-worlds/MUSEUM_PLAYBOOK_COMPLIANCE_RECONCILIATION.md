# Museum — Playbook compliance reconciliation

> **Status:** PROCESS AUDIT · authoritative as of this commit
> **Branch:** `claude/immersive-worlds-module-c0d3f7`
> **Master:** UNTOUCHED
> **Product approval:** PENDING
> **Ordered by:** human decision — *"STOP EXPANDING PRODUCT SCOPE TEMPORARILY. The current problem is PROCESS COMPLIANCE."*

---

# 0. The finding, stated plainly

Nine verticals were implemented and each one passed its own tests. Not one of
them completed the Playbook loop that makes a vertical *closed*. The gap is
almost perfectly uniform, which is what makes it a process defect rather than
nine separate oversights:

| Stage | Verticals reaching it |
|---|---|
| CONTRACT | 9 of 9 |
| IMPLEMENTATION | 8 of 9 (P0.2 unwired by decision) |
| TARGETED QA | 9 of 9 |
| REAL PRODUCT-PATH QA | 7 of 9 |
| VISUAL EVIDENCE | 7 of 9 |
| MOTION EVIDENCE | 1 of 9 *(only the crossing, and that predates these verticals)* |
| FRESH AMNESIAC CRITIC | **0 of 9** |
| IMPLEMENTATION RECORD | 0 of 9 → **9 of 9** (`IW-3`) |
| LEARNING LOG | 7 of 9 |
| NAVIGABLE HUMAN RUNTIME | 9 of 9 (one shared runtime) |
| HUMAN FIRST-GLANCE | 1 of 9 |
| HUMAN VERDICT | 1 of 9 |

The right-hand column is the product owner's field of view. It has been narrow
for nine verticals in a row, and every one of those verticals reported green.

`AGENT KEEP ≠ HUMAN APPROVAL`. Neither does `TESTS GREEN ≠ HUMAN SIGHT`.

---

# 1. Playbook compliance matrix

Legend: **DONE** · **MISSING** · **N/A** (not applicable) · **BLOCKED** (external).

`DONE` is never inferred from a passing functional test. A stage is DONE only if
the artefact that stage produces exists in the repository.

## 1.1 P0.1 — Visitor authoring (editorial measure)

Commits `8c545bd`, `f417925`. Tools `visitor-audit.mjs`, `visitor-workspace-audit.mjs`.

| Stage | State | Artefact / reason |
|---|---|---|
| CONTRACT | DONE | `G2_VS02_AUTHORING_P0_PRODUCT_HARDENING_EXECUTION_BRIEF.md`; CONSTITUTION 38 |
| IMPLEMENTATION | DONE | `authoring/studio/studio.css` editorial mode, `studio-shell.js` |
| TARGETED QA | DONE | `visitor-audit.mjs`, `visitor-workspace-audit.mjs` |
| REAL PRODUCT-PATH QA | DONE | captured through the real authoring shell, not a fixture |
| VISUAL EVIDENCE | DONE | `evidence-vs02/visitor-workspace/{before,after}` at 1366/1440/1920, matched. **Correction:** `visitor-design/{current,corrected}` was previously filed here too. It is not this vertical — those frames are the *public* VISITA panel, which belongs to §1.3. The fresh critic caught the mislabelling; it is fixed here rather than quietly |
| MOTION EVIDENCE | N/A | a static layout measure; nothing moves |
| FRESH AMNESIAC CRITIC | **MISSING** | never run |
| IMPLEMENTATION RECORD | **MISSING → WRITTEN** | `IW-3_IMPLEMENTATION_RECORD.md` |
| LEARNING LOG | DONE | L-23, L-24 |
| NAVIGABLE HUMAN RUNTIME | DONE | shared runtime, §5 |
| HUMAN FIRST-GLANCE | **MISSING** | |
| HUMAN VERDICT | **MISSING** | |

## 1.2 P0.2 — Persistent assets

Commit `1dc8628`. Tool `project-cloud-contract-test.mjs`.

| Stage | State | Artefact / reason |
|---|---|---|
| CONTRACT | DONE | `MUSEUM_PROJECT_CLOUD_INTEGRATION_DECISION.md`; human gate: reuse Project Cloud, no second backend |
| IMPLEMENTATION | BLOCKED | `authoring/project-cloud/asset-client.js` exists and is deliberately unwired — wiring it requires a session provider that does not exist yet |
| TARGETED QA | DONE | contract test against the adapter's own surface |
| REAL PRODUCT-PATH QA | **BLOCKED** | needs API base, dev workspace/user/project, runtime session, R2 test bucket |
| VISUAL EVIDENCE | BLOCKED | nothing to photograph until bytes move |
| MOTION EVIDENCE | N/A | |
| FRESH AMNESIAC CRITIC | BLOCKED | |
| IMPLEMENTATION RECORD | **MISSING → WRITTEN** | `IW-3_IMPLEMENTATION_RECORD.md` |
| LEARNING LOG | DONE | recorded in the integration decision |
| NAVIGABLE HUMAN RUNTIME | N/A | not reachable by a visitor |
| HUMAN FIRST-GLANCE | BLOCKED | |
| HUMAN VERDICT | BLOCKED | |

## 1.3 P0.3 — Authoring → VISITA

Commit `2873945`. Tool `visita-traceability.mjs`.

| Stage | State | Artefact / reason |
|---|---|---|
| CONTRACT | DONE | `VISITA_TRACEABILITY_MATRIX.md` |
| IMPLEMENTATION | DONE | authored field → `hud.setVisitorInfo()` → VISITA surface |
| TARGETED QA | DONE | 12/12 fields CONNECTED |
| REAL PRODUCT-PATH QA | DONE | sentinel values typed into the real editor and read off the real VISITA panel |
| VISUAL EVIDENCE | DONE | `evidence-vs02/visita-traceability/visita-trazabilidad.png`; **and** `visitor-design/{current,corrected}` — the public panel at 4 viewports × 4 states, before and after the presentation redesign (`f417925`), reassigned here from §1.2 |
| MOTION EVIDENCE | N/A | |
| FRESH AMNESIAC CRITIC | **MISSING** | |
| IMPLEMENTATION RECORD | **MISSING → WRITTEN** | `IW-3_IMPLEMENTATION_RECORD.md` |
| LEARNING LOG | DONE | |
| NAVIGABLE HUMAN RUNTIME | DONE | §5 |
| HUMAN FIRST-GLANCE | **MISSING** | |
| HUMAN VERDICT | **MISSING** | |

## 1.4 Guided Back — same room

Commits `25d67eb` (audit), `1e025f3` (cost), `4415f1c` (implementation), `de601a3` (equivalence).

| Stage | State | Artefact / reason |
|---|---|---|
| CONTRACT | DONE | `MUSEUM_GUIDED_TOUR_CONTRACT.md`; SEEK vs BACK separated |
| IMPLEMENTATION | DONE | `experience-director.js` `back()` / `_returnToSettle()`; HUD ← ANTERIOR |
| TARGETED QA | DONE | `guided-reversibility-audit.mjs`, `guided-replay-cost.mjs` |
| REAL PRODUCT-PATH QA | DONE | `forward-settle-equivalence.mjs` clicks the real `[data-el="prevBtn"]`; forward↔back 0.0000 m |
| VISUAL EVIDENCE | DONE | `fs-forward-{3,4,5}.png` / `fs-back-{3,4,5}.png` |
| MOTION EVIDENCE | **WAS MISSING → PRODUCED** | `evidence-vs02/guided-back-motion/` — recording + per-frame filmstrip (§3) |
| FRESH AMNESIAC CRITIC | **MISSING → RUN** (§4) | |
| IMPLEMENTATION RECORD | **MISSING → WRITTEN** | `IW-3_IMPLEMENTATION_RECORD.md` |
| LEARNING LOG | DONE | L-25, L-26, L-27 |
| NAVIGABLE HUMAN RUNTIME | DONE | §5 |
| HUMAN FIRST-GLANCE | **MISSING** | pending, package in §5 |
| HUMAN VERDICT | **MISSING** | |

## 1.5 Guided Back — cross room

Commit `8c20452`.

| Stage | State | Artefact / reason |
|---|---|---|
| CONTRACT | DONE | return crosses the doorway, never teleports |
| IMPLEMENTATION | DONE | `_returnAcrossRooms()` dispatches `ACTIVATE_PORTAL` with a CROSSING intent |
| TARGETED QA | DONE | portal events and space sequence traced |
| REAL PRODUCT-PATH QA | DONE | `IW_CROSS=1 forward-settle-equivalence.mjs`, real control |
| VISUAL EVIDENCE | DONE | `xr-00…xr-13.png` |
| MOTION EVIDENCE | **WAS MISSING → PRODUCED** | §3 |
| FRESH AMNESIAC CRITIC | **MISSING → RUN** (§4) | |
| IMPLEMENTATION RECORD | **MISSING → WRITTEN** | `IW-3_IMPLEMENTATION_RECORD.md` |
| LEARNING LOG | DONE | |
| NAVIGABLE HUMAN RUNTIME | DONE | |
| HUMAN FIRST-GLANCE | **MISSING** | |
| HUMAN VERDICT | **MISSING** | |

## 1.6 Canonical settled pose per Tour Stop

Commit `ed45704`. Human decision: option C.

| Stage | State | Artefact / reason |
|---|---|---|
| CONTRACT | DONE | one canonical settle per stop; forward settle = back return |
| IMPLEMENTATION | DONE | `_settleBeat()` / `canonicalSettle()` |
| TARGETED QA | DONE | three-way comparison: canonical / forward / back |
| REAL PRODUCT-PATH QA | DONE | route played, not sought |
| VISUAL EVIDENCE | DONE | shared with §1.4 |
| MOTION EVIDENCE | **WAS MISSING → PRODUCED** | §3, moment 3 (forward after Back) |
| FRESH AMNESIAC CRITIC | **MISSING → RUN** | |
| IMPLEMENTATION RECORD | **MISSING → WRITTEN** | `IW-3_IMPLEMENTATION_RECORD.md` |
| LEARNING LOG | DONE | L-26, L-27 |
| NAVIGABLE HUMAN RUNTIME | DONE | |
| HUMAN FIRST-GLANCE | **MISSING** | |
| HUMAN VERDICT | **MISSING** | |

## 1.7 HUD Tour Stop counter

Part of `4415f1c` / `ed45704`.

| Stage | State | Artefact / reason |
|---|---|---|
| CONTRACT | DONE | the counter names Tour Stops, not beats |
| IMPLEMENTATION | DONE | `hud.js` reads `experience.tourOrder` / `tourTotal` |
| TARGETED QA | **WAS MISSING → ADDED** | the counter had no check of its own; §3 reads it from the DOM at every moment |
| REAL PRODUCT-PATH QA | **WAS MISSING → ADDED** | §3 |
| VISUAL EVIDENCE | **WAS MISSING → PRODUCED** | the counter is legible in every §3 still and printed in its caption |
| MOTION EVIDENCE | **PRODUCED** | §3 |
| FRESH AMNESIAC CRITIC | **MISSING → RUN** | |
| IMPLEMENTATION RECORD | **MISSING → WRITTEN** | `IW-3_IMPLEMENTATION_RECORD.md` |
| LEARNING LOG | DONE | the beat-vs-stop defect is recorded |
| NAVIGABLE HUMAN RUNTIME | DONE | |
| HUMAN FIRST-GLANCE | **MISSING** | |
| HUMAN VERDICT | **MISSING** | |

## 1.8 Crossing B regression protection

Commits `6e87a9b`, `87e8149`, `9f8669a`.

| Stage | State | Artefact / reason |
|---|---|---|
| CONTRACT | DONE | human: Crossing B is the current best baseline; endpoint change NOT AUTHORIZED; do not reduce the red portal effect |
| IMPLEMENTATION | N/A | nothing to build — the requirement is that it not change |
| TARGETED QA | DONE | `crossing-subsystem-isolation.mjs` |
| REAL PRODUCT-PATH QA | DONE | `crossing-storyboard.mjs` plays the route; no `traversePortal` |
| VISUAL EVIDENCE | DONE | contact sheets, per-beat stills |
| MOTION EVIDENCE | DONE | `crossing-NATURAL.webm` — the one vertical that had it |
| REGRESSION GUARD | **WAS MISSING → ADDED** | the baseline was photographed but never *compared against*. §3 now re-derives the Crossing B plan and diffs it |
| FRESH AMNESIAC CRITIC | **MISSING → RUN** | |
| IMPLEMENTATION RECORD | DONE | `MUSEUM_CROSSING_FIDELITY_FINDING.md` |
| LEARNING LOG | DONE | L-17 … L-22 |
| NAVIGABLE HUMAN RUNTIME | DONE | |
| HUMAN FIRST-GLANCE | DONE | Human QA #1 |
| HUMAN VERDICT | DONE | ADJUST on transitions overall; Crossing B KEEP as baseline |

## 1.9 Nested Breeze — Option E spike

Commit `dc533a4`; frozen extension `ac968ec`.

| Stage | State | Artefact / reason |
|---|---|---|
| CONTRACT | DONE | human decision: Option E1 is the V1 architecture |
| IMPLEMENTATION | DONE | `app/nested/nested-room-host.js` — registered, unwired into the route |
| TARGETED QA | DONE | 17/17 |
| REAL PRODUCT-PATH QA | DONE | runs inside the live Museum page, HUD intact |
| VISUAL EVIDENCE | DONE | 4 stills |
| MOTION EVIDENCE | **MISSING** | deliberately not produced — the guest was a test double, so a recording would show a coloured rectangle and nothing about Breeze |
| FRESH AMNESIAC CRITIC | N/A | there is no product surface yet to criticise |
| IMPLEMENTATION RECORD | DONE | spike header states what it proves and what it does not |
| LEARNING LOG | DONE | L-28 |
| NAVIGABLE HUMAN RUNTIME | N/A | not on the visitor path |
| HUMAN FIRST-GLANCE | N/A | |
| HUMAN VERDICT | DONE | E1 approved as architecture (not as a visual) |

---

# 2. Re-entry points — contextual backtrack, not restart

No vertical is restarted. For each gap, the last trustworthy checkpoint and the
smallest re-entry:

| Vertical | Last trustworthy checkpoint | Re-enter at | Re-run only |
|---|---|---|---|
| Guided Back (both) | `de601a3` / `8c20452` — pose equivalence proved, real control used | just before MOTION EVIDENCE | new motion harness (§3) |
| Canonical settle | same | same | shared with the above |
| HUD counter | implementation in `4415f1c` | before TARGETED QA — it never had one | counter read into §3 |
| Crossing B | `6e87a9b` — baseline captured | before REGRESSION GUARD | plan diff inside §3, baseline files untouched |
| P0.1 | `f417925` — matched responsive sets exist | before FRESH CRITIC | critic on existing images; no recapture |
| P0.3 | `2873945` — 12/12 | before FRESH CRITIC | critic on existing image |
| P0.2 | `1dc8628` | cannot re-enter | external blocker, §5 |
| Breeze E1 spike | `dc533a4` | frozen | none |
| Breeze Phase 1A | `ac968ec` | frozen, incomplete | none until the Museum state is reconciled |

Nothing above requires re-implementing a line of product code. The gap is
evidence and human sight, and that is what is being closed.

---

# 3. Process bug — recorded

**PROCESS BUG · TECHNICAL PROGRESS WITHOUT THE PLAYBOOK EVIDENCE / CRITIC /
HUMAN-VISIBILITY LOOP CAUSES PRODUCT-OWNER BLINDNESS.**

What happened: nine consecutive verticals were driven to green functional tests
and committed. Each commit was individually defensible. Across the sequence, the
product owner's ability to see the product did not improve at all — no motion
evidence, no critic, no packaged human view. The `DEFAULT STATE = CONTINUE
EXECUTION` rule was honoured; the rule it sits beside, that a vertical is not
closed until a human can *see* it, was not.

Why it is easy to commit: every individual step feels like the responsible
choice. Stopping to package evidence looks like the process bug the Continuous
Execution Protocol was written to eliminate. It is not the same thing. Continuing
without stopping and continuing without producing human-visible evidence are
different failures, and eliminating the first does not license the second.

**Generalizable lesson:**

> A SERIES OF GREEN IMPLEMENTATION CHECKPOINTS DOES NOT EQUAL A CLOSED PRODUCT
> VERTICAL.
>
> A VISUAL PRODUCT VERTICAL IS NOT CLOSED UNTIL:
> FUNCTIONAL QA + REAL PRODUCT-PATH QA + VISUAL/MOTION EVIDENCE + FRESH CRITIC +
> HUMAN QA PACKAGE exist.

**Detection rule, so this is catchable next time:** if the last human verdict is
more than two verticals old, evidence debt is accumulating — produce the package
before the next vertical, regardless of how green the tests are.

Filed in `DECISION_LOG.md` as **L-29**.

---

# 3b. What the new motion evidence found

`qa/tools/guided-back-motion-evidence.mjs` — 24 of 26 checks. Both failures are
the same defect, and it is a real one.

## Confirmed working, now with motion evidence rather than only numbers

| | |
|---|---|
| Same-room Back is a travelled move | 9 distinct camera positions over 3 484 ms |
| Cross-room Back goes **through the doorway** | 18 positions along a 15.0 m path whose straight line is 6.8 m, `portal.gallery-b-gallery-a` CROSSED then LANDED, camera owner DIRECTED → TRANSITION |
| Continuing after Back returns to the same composition | Δpos 0 m, Δtgt 0 m, same stop |
| The HUD counter follows in both directions | "Parada 4 de 10" → "Parada 3 de 10" → "Parada 4 de 10" |
| Crossing B is unchanged | plan identical to baseline, and identical again after a Back and a second crossing |
| The guide survives the return, in both rooms | |

Durations are wall-clock in a software-rendered container and are **not**
authored tempo. The ratio of path length to straight-line distance is the figure
that means something; the milliseconds are not.

## DEFECT FOUND — the label card does not follow Back

**Reproducible, both in-room and across rooms.**

| Moment | Stop | Label card shows |
|---|---|---|
| Forward, settled | Parada 4 | «División tercera» 3 / 5 |
| After ← ANTERIOR | Parada **3** | «División tercera» 3 / 5 ← **stale** |
| Arrived in Galería B | Parada 7 | «Vasija de arenas» 5 / 5 |
| After ← ANTERIOR | Parada **6**, back in Galería A | «Vasija de arenas» 5 / 5 ← **stale** |

The camera returns correctly, the counter updates correctly, and the label on
the left keeps describing the stop the visitor just left. A visitor reading the
card is told they are looking at a work that is now behind them — and in the
cross-room case, at a work that is in a different room.

This is the L-18 family — a caption and its picture from different instants —
recurring on the *backward* path, which no forward test could have caught.
`FUNCTIONAL PASS ≠ PRODUCT PASS` in one line: the return is geometrically exact
to four decimal places and still tells the visitor the wrong thing.

**Not fixed in this reconciliation.** The mandate is to reconcile evidence, not
to add product changes; and this is a visible behavioural change to the guided
experience, which is Juanma's call. It is the first item in the next work.

---

# 4. What this reconciliation does not claim

- It does not close P0.2. No persistent bytes have survived a lifecycle.
- It does not close Phase 1A. The Breeze readback fails; motion is unproven.
- It does not convert any agent verdict into approval. Every HUMAN VERDICT cell
  reading MISSING stays MISSING until Juanma looks.
- Master is untouched. No merge, no promotion. `PRODUCT APPROVAL: PENDING`.
