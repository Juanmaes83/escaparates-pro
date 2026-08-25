# Museum Guided Tour — order audit BEFORE the Tour Control Pass

Snapshot taken at `d8e710d`, before any change in this pass. Every number below was
measured by driving the running prototype, not read off the source.

Raw measurement: `labs/immersive-worlds/qa/evidence-tour/landing-before.json`
Panel screenshot: `labs/immersive-worlds/qa/evidence-tour/panel_before.png`

---

## 1. How many representations of tour order existed

Five. Only one was authoritative; three of the others could — and did — diverge from it.

| # | Representation | Where | Authoritative? | Can diverge? |
|---|---|---|---|---|
| 1 | `route.chapterRefs` → `chapter.stepRefs`, flattened by array position | `worlds/museum-v1.world.json`, read by `WorldStore.routeSteps()` | **YES** — the Experience Director consumes exactly this | — |
| 2 | Hand-written `STATES` array with hand-typed circled numerals ①…⑪ | `qa/tools/make-preview.mjs` | No, but it *looked* authoritative to a reviewer | **Yes — and had** |
| 3 | `DETERMINISTIC_STATES` object insertion order → `STATE_NAMES` | `qa/deterministic-states.js` | No | Yes |
| 4 | Counting `next()` calls | `museum:guided-step-04`, `museum:guided-completed` | No | **Yes — and had** |
| 5 | `Parada n de N` | `app/ui/hud.js`, from `ROUTE_STEP.index/total` | No — correctly derived from (1) | No |

Representation (5) was already correct. The damage came from (2) and (4).

---

## 2. The canonical route as the Director actually sees it

17 story steps, one route (`route.comentado`), three chapters.

| Parada | Step id | Chapter | Intent | Guide |
|---|---|---|---|---|
| 1 | `step.01-entrada` | vestíbulo | ENTRY | yes |
| 2 | `step.02-paso-galeria-a` | horizontes | PORTAL | — |
| 3 | `step.03-lleva-horizonte` | horizontes | LEAD | yes |
| 4 | `step.04-horizonte` | horizontes | ACCOMPANIED | yes |
| 5 | `step.04b-horizonte-cesion` | horizontes | FOCUS | yes (aside) |
| 6 | `step.05-lleva-division` | horizontes | LEAD | yes |
| 7 | `step.06-division` | horizontes | ACCOMPANIED | yes |
| 8 | `step.06b-division-cesion` | horizontes | FOCUS | yes (aside) |
| 9 | `step.07-lleva-umbral` | cámara oscura | LEAD | yes |
| 10 | `step.08-paso-galeria-b` | cámara oscura | PORTAL | — |
| 11 | `step.09-lleva-noche` | cámara oscura | LEAD | yes |
| 12 | `step.10-noche` | cámara oscura | ACCOMPANIED | yes |
| 13 | `step.10b-noche-cesion` | cámara oscura | FOCUS | yes (aside) |
| 14 | `step.10c-lleva-cuaderno` | cámara oscura | LEAD | yes |
| 15 | `step.10d-cuaderno` | cámara oscura | ACCOMPANIED | yes |
| 16 | `step.10e-cuaderno-permanencia` | cámara oscura | FOCUS | yes (aside) |
| 17 | `step.11-cierre` | cámara oscura | EXIT | — |

This sequence was and is internally sound: one start, one end, no gaps, no cycles.
**The route was never the problem.**

---

## 3. What the panel actually did — measured

| Panel badge | State id | Lands on parada | Transport | Mode |
|---|---|---|---|---|
| ① | `museum:journey-lead-horizonte` | **3** | PAUSED | GUIDED |
| ② | `museum:guide-accompanied` | **4** | PAUSED | GUIDED |
| ③ | `museum:guide-handoff` | **5** | PAUSED | GUIDED |
| ④ | `museum:journey-lead-division` | **6** | PAUSED | GUIDED |
| ⑤ | `museum:journey-division` | **7** | PAUSED | GUIDED |
| ⑥ | `museum:journey-threshold` | **9** | PAUSED | GUIDED |
| ⑦ | `museum:journey-crossed` | **11** | PAUSED | GUIDED |
| ⑧ | `museum:journey-noche` | **12** | PAUSED | GUIDED |
| ⑨ | `museum:guide-released` | reaches 13, then **exits the route** | IDLE | EXPLORE |
| ⑩ | `museum:journey-proyeccion` | **15** | PAUSED | GUIDED |
| ⑪ | `museum:proyeccion-permanencia` | **16** | PAUSED | GUIDED |
| (unnumbered ×10) | camera / QA / debug states | none — route never starts | IDLE | EXPLORE |

Panel numbering ①…⑪ maps to paradas **3, 4, 5, 6, 7, 9, 11, 12, (13→exit), 15, 16**.

Paradas never reachable from the panel: **1, 2, 8, 10, 14, 17** — the opening, both
portals, one yield, one lead, and the closing.

---

## 4. BEFORE graph — the real traversal

```
CANONICAL ROUTE (what G traverses, correct):

  START → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09
                → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → END


PANEL SEQUENCE (what the reviewer reads as "the tour"):

  ①      ②      ③      ④      ⑤      ⑥      ⑦      ⑧      ⑨      ⑩      ⑪
  │      │      │      │      │      │      │      │      │      │      │
  ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
 p03 →  p04 →  p05 →  p06 →  p07 →  p09 →  p11 →  p12 →  p13 →  p15 →  p16
                                ↑      ↑             ⇢EXIT    ↑
                             skips  skips                  skips
                              p08  p10                     p14
  ✗ p01, p02 unreachable                        ✗ p17 unreachable

ORPHANS (in the panel, outside the tour, visually identical to tour chips):
  Galería A — eje · Galería A — diagonal · Foco: Horizonte · Foco: Vasija
  Umbral A → B · Galería B — cámara oscura · Archivo · GUÍA vuelta de personaje
  Vestíbulo

DUPLICATE:
  "Recorrido comentado — parada 4"  ==  ② Acompañado — sobre el hombro
  (both land on parada 4; one by step id, one by counting next() calls)

STALE BY CALL-COUNT:
  museum:guided-completed  → advertises "recorrido terminado"
                           → actually lands on parada 10 of 17, transport PLAYING
```

---

## 5. Root cause

**Two hand-maintained lists, one of which was never derived from the other.**

The canonical order lives in the world file and the Director reads it correctly. The
panel's ①…⑪ were typed by hand in `make-preview.mjs` over a *subset* of steps chosen
for their review value, at a time when that subset happened to read as a sequence.
Nothing linked the two. Every step added to the route since then — three of them in
GRAFT 01 alone — widened the gap without any signal, because no test compared the
panel's order with the route's.

Two aggravating factors:

- **Counting `next()` calls** as a way to reach a step (`guided-step-04`,
  `guided-completed`) is a fourth ordering that silently retargets whenever a step is
  inserted before it. `guided-completed` had already rotted: it was written when the
  route had ten steps, and now stops at parada 10 of 17 while still claiming to be the
  end of the tour.
- **Tour states and QA/camera states share one visual language** in one flat list, so
  a reviewer cannot tell a narrative moment from a debug pose.

The perceived "01 → 04" and "04 → 07" jumps are therefore real, but they are not
skips in the tour. They are the panel's private numbering being read as the tour's.

---

## 6. Direct-jump behaviour before the pass — truthful classification

**REPLAY, not seek.** `runToStep()` calls `startRoute()` (which resets to the first
step) and then `next()` in a loop until the target step id matches, sleeping a fixed
320 ms per step and 2500 ms per portal step.

Consequences measured:

- reaching parada 16 replays 15 steps including two portal traversals — roughly 9 s
  under software rendering, during which the panel shows intermediate steps;
- there is no seek, no rewind and no true random access;
- **the Director has no `previous()` at all** — backwards navigation did not exist in
  any form. The HUD transport offers Pausar / Siguiente / Salir only.

This is not a defect to hide behind a spinner. A forward-only authored timeline is
what Constitution §16 says we have; the honest fix is to name it, not to disguise it.

---

## 7. What this pass must therefore change

Not the button order. The contract:

1. one authoritative order, with everything tour-facing derived from it;
2. an explicit separation between a canonical Tour Step and an internal beat;
3. tour navigation separated from QA/debug states in the panel;
4. real PREVIOUS/NEXT at canonical granularity;
5. truthful naming of what a jump does;
6. automated invariants, so the next inserted step cannot silently break the sequence.
