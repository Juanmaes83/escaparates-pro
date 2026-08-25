# Museum Guided Tour — the contract

This is the document a future agent needs in order to change the tour without
breaking it. It should be enough on its own: no chat history required.

Companion documents:
- `TOUR_ORDER_AUDIT_BEFORE.md` — what was wrong before the Tour Control Pass and why.
- `IW-DEC-028` in `DECISION_LOG.md` — the decision this contract implements.

---

## 1. The three words

| Term | Meaning | Who executes it | Numbered? |
|---|---|---|---|
| **Beat** | One authored `StoryStep`. A lead, a portal crossing, an accompanied shot, a yield. | Experience Director — this is its unit of execution | No |
| **Tour Step** | One narrative moment the visitor perceives as *a stop*. One or more consecutive beats. | Derived; the visitor's unit of perception | **Yes — 01…N** |
| **QA state** | A named camera/debug pose in `DETERMINISTIC_STATES`. Not part of the tour. | Playwright, and reviewers by hand | No |

A lead + an accompanied shot + a yield are **three beats of one Tour Step**. They
are deliberately not three numbers. Numbering every internal transition turns a
guided visit into a slide deck, which is the failure this contract exists to prevent.

---

## 2. Where the order lives

**One place, and it is not a manifest file.**

```
worlds/museum-v1.world.json
  routes[0].chapterRefs        ordered
    → chapters[].stepRefs      ordered
      → storySteps             ← THE canonical order, by array position
```

`WorldStore.routeSteps(routeId)` flattens it. Everything else derives:

```
        route.chapterRefs → chapter.stepRefs        ← single source of truth
                     │
        ┌────────────┴─────────────┐
        │                          │
   Experience Director        buildTourManifest()    engine/experience/tour-manifest.js
   (executes beats)                │
                    ┌──────────────┼───────────────┬──────────────┐
                    │              │               │              │
              numbered panel   next/previous   progress state   QA invariants
```

A beat opens a Tour Step by carrying `tourStep: { title }`. That marker says
*"a new numbered moment begins here"* — **it does not carry a number**. The number
is the marker's position in the filtered list, so:

- numbering is contiguous 1..N *by construction* — a gap is not expressible;
- `next`/`previous` are array neighbours and cannot disagree;
- every beat belongs to exactly one Tour Step, as long as the route's first beat
  is marked (checked by `TOUR-ONE-START`).

**To reorder the tour, reorder `stepRefs`.** There is nowhere else to edit.

---

## 3. The canonical tour

7 Tour Steps over 17 beats.

| # | Technical id (opening beat) | Title | Space | Beats |
|---|---|---|---|---|
| 01 | `step.01-entrada` | Bienvenida | Vestíbulo | `step.01-entrada` |
| 02 | `step.02-paso-galeria-a` | Horizonte interrumpido | Galería A | `step.02-paso-galeria-a`, `step.03-lleva-horizonte`, `step.04-horizonte`, `step.04b-horizonte-cesion` |
| 03 | `step.05-lleva-division` | División tercera | Galería A | `step.05-lleva-division`, `step.06-division`, `step.06b-division-cesion` |
| 04 | `step.07-lleva-umbral` | La cámara oscura | Galería A → B | `step.07-lleva-umbral`, `step.08-paso-galeria-b` |
| 05 | `step.09-lleva-noche` | Noche de invierno | Galería B | `step.09-lleva-noche`, `step.10-noche`, `step.10b-noche-cesion` |
| 06 | `step.10c-lleva-cuaderno` | Cuaderno de luz | Galería B | `step.10c-lleva-cuaderno`, `step.10d-cuaderno`, `step.10e-cuaderno-permanencia` |
| 07 | `step.11-cierre` | Cierre | Galería B | `step.11-cierre` |

`previous(01) = null`, `next(07) = null`, and every other link is the array neighbour.

**Identity vs number vs label are three different things.** The id is stable; the
number is position; the title is copy. Re-titling a step changes nothing else.
Every handler and every test addresses steps by id.

---

## 4. The three navigation modes

They share the canonical sequence. They do not behave identically, and the
differences are deliberate.

### Automatic — press `G`
The Director plays beats on their authored durations, start to end. A lead also
waits for the guide to arrive (see `_waitsForGuide`). It never consults the panel
and never skips a beat. `TOUR-G-USES-CANONICAL-SEQUENCE` asserts the traversal
equals `01→02→…→07`.

### Manual — `previousTourStep()` / `nextTourStep()`
Move by **Tour Step**, not by beat. They land on the opening beat of the adjacent
moment and hold there, paused. `TOUR-MANUAL-NEXT-USES-CANONICAL-SEQUENCE` and
`TOUR-MANUAL-PREV-USES-CANONICAL-SEQUENCE` assert both directions.

### Direct jump — `runtime.goToTourStep(id)`

**This is reconstruction, not seek. Say so; do not dress it up.**

The route is an authored forward timeline — a seekable one is SHOULD LATER under
Constitution §16. `seekToTourStep` therefore *executes* the beats between here and
the target with their dwell removed: portals really are traversed, spaces really
are built and warmed, the guide really walks.

- **Forwards** — replays only the beats in between.
- **Backwards** — restarts the route and replays from beat 1. Going from 07 to 03
  costs the same as reaching 03 from the beginning, because that is literally what
  happens.

It awaits each beat's own pending work (`_pendingStep`) rather than sleeping a
fixed interval, so it runs as fast as the world can be rebuilt and it cannot frame
a shot against geometry that does not exist yet.

While a seek is running, `_seeking` is set and `update(dt)` stands down, so the
playback clock cannot race the reconstruction.

---

## 5. Progress states

Derived from the Director, never from which button was clicked.

| State | Meaning |
|---|---|
| `COMPLETED` | `step.order < currentTourStep.order` |
| `CURRENT` | `step.order === currentTourStep.order` |
| `NEXT` | `step.order === currentTourStep.order + 1` |
| `UNVISITED` | everything else, and everything when no route is running |

The panel re-renders on `route:step`, `route:started`, `experience:paused`,
`experience:resumed` and `experience:completed`. Every path into a step — `G`, the
keyboard, the panel buttons, a QA state — emits `route:step`, which is why the
panel cannot hold a private idea of what is selected.

---

## 6. Where the panel lives

The numbered panel is **preview/review scaffolding**, generated by
`qa/tools/make-preview.mjs` into the self-contained preview build. It is not part
of the shipped visitor HUD, which shows `Parada n de N` at beat granularity plus
Pausar / Siguiente / Salir.

The panel holds **no sequence of its own**. It reads `runtime.tour` at boot. A step
added to the route appears in the panel without anyone editing the preview tool.

QA/camera states are listed under their own heading, in a quieter visual treatment,
explicitly labelled as outside the tour.

---

## 7. Integrity invariants

Enforced in `engine/experience/tour-manifest.js` (`validateTourManifest`) and
surfaced as QA checks by `qa/run-qa.mjs`:

| Check | Asserts |
|---|---|
| `TOUR-ONE-START` | exactly one start, and it is the route's first beat |
| `TOUR-ONE-END` | exactly one end, and it closes on the route's last beat |
| `TOUR-ORDER-UNIQUE` | no duplicate numbers |
| `TOUR-ORDER-CONTIGUOUS` | 1..N with no gaps |
| `TOUR-IDS-UNIQUE` | no duplicate technical identities |
| `TOUR-NO-ORPHANS` | every beat belongs to exactly one Tour Step |
| `TOUR-NEXT-PREV-CONSISTENT` | links agree in both directions |
| `TOUR-NO-UNEXPECTED-CYCLES` | start has no previous, end has no next |
| `TOUR-ALL-REACHABLE` | walking `next` from the start visits every step once |
| `TOUR-G-USES-CANONICAL-SEQUENCE` | automatic traversal equals the manifest |
| `TOUR-MANUAL-NEXT-USES-CANONICAL-SEQUENCE` | forward manual traversal equals it |
| `TOUR-MANUAL-PREV-USES-CANONICAL-SEQUENCE` | backward manual traversal is its reverse |

The last three drive the real prototype end to end. An ordering regression fails QA.

---

## 8. How to safely add Tour Step N+1

1. Add the `StoryStep` records to `worlds/museum-v1.world.json`.
2. Add their ids to the right `chapter.stepRefs`, **in the position the tour should
   visit them**. That position is the order; there is no index to maintain.
3. Put `tourStep: { "title": "…" }` on the **first** beat of the new moment, and only
   on that one. Omit it entirely if the new beats belong to an existing moment.
4. Run `node labs/immersive-worlds/qa/run-qa.mjs`.

What you do **not** have to update, because it derives: the panel, the numbering,
next/previous, progress, the HUD counter, the integrity checks.

What you **do** have to update if the change is narrative rather than mechanical:
- §3 of this document (the table);
- `CURRENT_MUSEUM_STATE.md`;
- any `DETERMINISTIC_STATES` entry that names a step id you removed or renamed.

### Never do these
- **Never number a step by hand** anywhere outside this document's §3 table.
- **Never reach a step by counting `next()` calls.** That was a fourth ordering and
  it rotted silently — `museum:guided-completed` spent an unknown number of passes
  claiming to be the end of the tour while stopping at parada 10 of 17. Use
  `runtime.goToTourStep(id)`.
- **Never give the panel its own list of steps.** That is exactly the drift the
  Tour Control Pass removed.

---

## 9. Known limitation, stated plainly

Backward navigation replays from the beginning. On a 17-beat route with two portal
traversals under software rendering this is seconds, not instant. It is honest —
the UI says *reconstruction*, not *seek* — but it is a limitation, and the fix
(a genuinely seekable timeline with snapshotted world state at each beat) is a
larger piece of work that Constitution §16 already parks as SHOULD LATER.
