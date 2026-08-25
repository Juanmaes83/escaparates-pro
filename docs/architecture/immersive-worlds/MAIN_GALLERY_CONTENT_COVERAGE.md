# Main Gallery — content coverage map

**Space:** `space.gallery-a` — "Galería A — Horizontes", 16 × 4.8 × 11 m, origin `[0, 0, -10]`.

Audit/mapping pass. **No product code, world data or composition was changed.**
Written: two read-only tools in `qa/tools/`, captures in `qa/evidence-gallery-a/`,
and this document.

Visual board: `qa/evidence-gallery-a/coverage-board.html`.
Companions: `ARTWORK_GRAMMAR_VISUAL_AUDIT.md`, `EXPERIENCE_GRAMMAR_RECONCILIATION.md`,
`MUSEUM_GUIDED_TOUR_CONTRACT.md`.

---

## A. Physical inventory

Five content pieces are physically present. Extracted from `worlds/museum-v1.world.json`
and confirmed by driving the running prototype into the room.

| # | Piece | Kind | Size (m) | Anchor | Position |
|---|---|---|---|---|---|
| 1 | **Horizonte interrumpido** — Amalia Serrat, 1971, óleo sobre lienzo | ARTWORK | 2.60 × 1.78 | `wall-1` | `[-0.9, 1.64, -15.5]` |
| 2 | **Campo de ceniza** — Amalia Serrat, 1974, óleo y ceniza sobre lienzo | ARTWORK | 1.75 × 2.15 | `wall-2` | `[-8.0, 1.55, -12.4]` |
| 3 | **División tercera** — Bruno Ferrán, 1968, acrílico sobre tabla | ARTWORK | 2.10 × 1.50 | `wall-3` | `[5.1, 1.50, -15.5]` |
| 4 | **Estudio de figura, IV** — Bruno Ferrán, 1963, grafito sobre papel | ARTWORK | 0.95 × 1.22 | `wall-4` | `[8.0, 1.50, -13.6]` |
| 5 | **Vasija de arenas** — Teresa Miralles, 1986, gres torneado | SCULPTURE | 0.60 × 0.88 × 0.60 | `plinth` | `[4.3, 0, -7.0]` |

Non-content furniture: a bench at `[-4.4, -1.0]`, stanchion lines, three doorways
(lobby, Galería B, Archivo). These are room fabric, not candidate Stops.

**The sculpture exists and is fully built** — plinth, vessel, label, its own lighting.
It is not a placeholder.

---

## B. Status classification

| Piece | Status | Evidence |
|---|---|---|
| Horizonte interrumpido | **IN_TOUR** | Stop 02, four beats: `03-lleva`, `04`, `04c-contemplacion`, `04b-cesion` |
| División tercera | **IN_TOUR** | Stop 03, four beats: `05-lleva`, `06`, `06c-contemplacion`, `06b-cesion` |
| Campo de ceniza | **PRESENT_BUT_NOT_IN_TOUR** | no story step references it |
| Estudio de figura, IV | **PRESENT_BUT_NOT_IN_TOUR** | no story step references it |
| Vasija de arenas | **PRESENT_BUT_NOT_IN_TOUR** | no story step references it |

**Two of five are guided. Three are not.** Nothing is QA_ONLY, decorative or unknown:
every piece is authored content with a title, creator, year, medium and dimensions.

### What the three unintegrated pieces already have

This is the important finding, and it narrows the gap considerably:

| Capability | Campo de ceniza | Estudio de figura | Vasija de arenas |
|---|---|---|---|
| Physically built and lit | ✅ | ✅ | ✅ |
| Wall/plinth label | ✅ | ✅ | ✅ |
| `FOCUS_ENTITY` hotspot | ✅ | ✅ | ✅ |
| Focusable, camera settles | ✅ | ✅ | ✅ |
| Ficha with full metadata | ✅ | ✅ | ✅ |
| In Collection Browse | ✅ 2/5 | ✅ 4/5 | ✅ 5/5 |
| Zoom / detail control | ✅ | ✅ | ✅ |
| **Guided beats** | ❌ | ❌ | ❌ |

All five pieces are already reachable, framed and documented in Explore and in
Collection Browse. **The only thing the three lack is authored guided beats.**

### One consequence worth deciding

Collection Browse currently steps through **five** pieces, and the fifth is the
sculpture. Browsing "next artwork" from a painting therefore lands on a ceramic
vessel. That may be correct — it is one collection in one room — or the browse set
may want to be artwork-only. This is a product question, not a defect, and it is
recorded here rather than answered.

---

## C. Experience type

| Piece | Experience type | Grammar it would take |
|---|---|---|
| Horizonte interrumpido | ARTWORK | A/B/C/D — already complete |
| Campo de ceniza | ARTWORK | A/B/C/D |
| División tercera | ARTWORK | A/B/C/D — already complete |
| Estudio de figura, IV | ARTWORK | A/B/C/D |
| Vasija de arenas | **SCULPTURE** | A / B / C human-scale / D detail-orbit |

The doorways are TRANSITION and already serve Stop 04's threshold; the bench and
stanchions are room fabric and take no grammar. Nothing here is forced into A/B/C/D
that should not be.

---

## D. Expected grammar for the unintegrated pieces

### Campo de ceniza — ARTWORK, conventional

| Beat | Function | Reuse available |
|---|---|---|
| A | context / arrival | LEAD framing — but see the known FAIL below |
| B | shared attention | ACCOMPANIED framing, unchanged |
| C | human contemplation | `_contemplationFraming` + visitor figure, unchanged |
| D | pure artwork POV | FOCUS/cesión, unchanged |

Needs: one guide anchor, one visitor anchor, four authored beats. **No new code.**
Note it is the only portrait-format work in the room (1.75 wide × 2.15 tall) and it
hangs on the west wall, so its A and C will be spatially distinct from Stops 02/03
by construction — which is the desired "equivalent, not clone".

### Estudio de figura, IV — ARTWORK, small work

Same grammar, same reuse. It is small (0.95 × 1.22) and hangs on the east wall near
the Galería B doorway. Its Focus already frames it correctly, verified.

### Vasija de arenas — SCULPTURE, different grammar

| Beat | Function | Reuse available |
|---|---|---|
| A | context | LEAD framing should work — plinth in the room |
| B | shared attention | ACCOMPANIED framing, probably reusable |
| C | **human / scale relation** | visitor figure exists; `_contemplationFraming` assumes a *wall* work and derives the camera from the wall normal — a free-standing plinth has no wall normal, so this is **not** directly reusable |
| D | **detail / orbit focus** | current Focus is a flat frontal shot; there is no orbit, no turntable, no detail movement |

**This is the honest gap.** Beats A and B are probably reusable. Beats C and D are
not: the sculpture grammar asks for spatial inspection and the current Focus gives a
photograph of a vase. Verified visually — the frontal Focus is correct and handsome,
but it is artwork language applied to a three-dimensional object.

---

## E. Gap analysis

| Piece | Wiring only? | New composition? | New Stop? | Verdict |
|---|---|---|---|---|
| Campo de ceniza | **yes** — anchors + 4 beats | no | yes, one | **Ready to integrate** |
| Estudio de figura | **yes** — anchors + 4 beats | no | yes, one | **Ready to integrate** |
| Vasija de arenas | no | **yes** — C and D both | yes, one | **Defer** — needs sculpture grammar |

Blocking dependency, stated plainly: **integrating any new artwork Stop inherits the
Beat A defect** already documented in `ARTWORK_GRAMMAR_VISUAL_AUDIT.md` §6.1.
`_leadFraming` composes from the guide's position at beat start and never re-aims at
the subject, so A02 settles on bare wall and A05 puts the guide in front of the work.
Adding two more artwork Stops before fixing that multiplies the defect from three
instances to five.

---

## F. Recommended expansion order

**1 · Fix Beat A first. Integrate nothing until it is fixed.**
It is the one defect that scales with every Stop added. Cheap now, five times more
expensive later.

**2 · Then Campo de ceniza.** Wiring only, no new code, and it is the most different
work in the room — portrait format, ash surface, west wall — so it tests whether the
grammar produces equivalents rather than clones. It would become Stop 03, pushing the
others down.

**3 · Then Estudio de figura, IV.** Same pattern, and being small it tests the
grammar at the other end of the scale range.

**4 · Wait on the sculpture.** It deserves its own pass, because its C and D are
genuinely absent and Beat D would need a camera language the Museum does not have
(controlled orbit or detail traverse under one camera authority). Doing it badly
would mean applying artwork grammar to an object that is not a wall work — exactly
what the Experience Grammar §6 warns against.

**5 · Decide the Collection Browse set.** Whether browsing should include the
sculpture. One line of product intent, no engineering.

---

## Final answers

1. **Pieces in the main gallery:** five — Horizonte interrumpido, Campo de ceniza,
   División tercera, Estudio de figura IV, Vasija de arenas.
2. **Already integrated:** two — Horizonte interrumpido (Stop 02), División tercera (Stop 03).
3. **Not integrated:** three — Campo de ceniza, Estudio de figura IV, Vasija de arenas.
4. **Is the sculpture integrated?** **No.** It is fully built, lit, labelled, focusable,
   has a complete ficha and appears in Collection Browse as 5/5 — but the guided tour
   never visits it, and the sculpture grammar's C and D do not exist.
5. **Next recommended target:** fix Beat A, then Campo de ceniza.
6. **Is the main gallery understood well enough to move to new rooms?** **Yes for
   inventory, no for readiness.** Nothing unknown remains in the room, but 60% of its
   content is outside the guided experience and the arrival beat is defective. Opening
   new rooms now would replicate a known defect into unbuilt space.
