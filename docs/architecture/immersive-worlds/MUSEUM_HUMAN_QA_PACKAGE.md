# Museum — Human QA package

> **One package. Current as of this commit.** It supersedes every earlier Human
> QA note. Nothing here asks you to reconstruct product state from older reports.

| | |
|---|---|
| **Branch** | `claude/immersive-worlds-module-c0d3f7` |
| **HEAD** | *(filled at commit — see `git log -1` on the branch)* |
| **Master** | **UNTOUCHED.** No merge, no promotion, no PR. |
| **Product approval** | **PENDING** |
| **Runtime** | local static server, §2 |
| **Scope of this package** | Guided Back (both kinds), the canonical settled pose, the HUD Tour Stop counter, Crossing B protection, P0.1 Visitor authoring, P0.3 VISITA |
| **Explicitly out of scope** | P0.2 persistent assets (external blocker), Breeze (frozen) |

---

# 1. What changed, and what did not

## Changed

| Change | Where you see it |
|---|---|
| **← ANTERIOR** exists in the guided transport | bottom bar, left of Pausar |
| Going back returns to the composition the tour left you on, not to a stop's opening beat | press ← ANTERIOR at any stop |
| Going back across a room boundary travels through the doorway | press ← ANTERIOR just after arriving in Galería B |
| The HUD counter counts **Tour Stops**, not beats | "PARADA 4 DE 10" |
| The Visitante authoring domain has an editorial measure — wider fields, a real writing column | author.html → Visitante |
| Every VISITA field is traceable from what staff type to what the public reads | author.html → Visitante → then Visita in the experience |

## Deliberately NOT changed

| | |
|---|---|
| **Crossing A and Crossing B geometry** | endpoint change NOT AUTHORIZED; the red portal effect is not reduced or removed |
| The transition engine | KEEP verdict stands |
| Where any approved beat ends | transitions may change how the camera travels, never where a beat ends |
| The Museum renderer | still WebGL Three 0.185.1 |
| Any Breeze integration on the visitor path | nothing Breeze is reachable by a visitor |
| Master | untouched |

---

# 2. Human QA runtime

From the repository root, on your machine:

```bash
node tests/static-server.mjs 4180 .
```

| Surface | URL |
|---|---|
| **The experience (visitor)** | `http://127.0.0.1:4180/labs/immersive-worlds/index.html` |
| **The authoring layer (author)** | `http://127.0.0.1:4180/labs/immersive-worlds/author.html` |

Requires WebGL2. No build step, no install, no network.

**Note on verification honesty:** this launch path was exercised end to end by
`qa/tools/human-qa-access-check.mjs` — load, enter, canvas painting, Visita open
and close, guided route started from its own button, crossing flown, Gallery A
reached — using the same plain static server named above, driving only visitor
controls. It was verified inside this container, which is not your machine.
Nothing about your local environment has been checked.

---

# 3. Human test script

Twelve minutes. Follow it in order; the order is what makes the Back behaviour
legible.

### A. Guided Back — same room (≈4 min)

1. Open the experience. Press **Entrar**.
2. Press **Recorrido comentado**.
3. Let the tour run until it settles on a stop and stops moving. Note the
   counter — "PARADA n DE 10" — and the label card on the left.
4. Press **← ANTERIOR**.
   - **Watch the movement itself, not the destination.** Does it read as walking
     back, or as being teleported and then told about it?
   - Does the counter follow?
   - **Does the label card on the left now describe the artwork you are looking
     at, or the one you just came from?** *(See the known limitation in §5 — this
     is the one thing most likely to be wrong.)*
5. Press **REANUDAR**. Let the tour play forward again to the same stop.
   - Does it leave you in the same composition you were in at step 3, or in a
     near-miss of it?

### B. Guided Back — across rooms (≈5 min)

6. Let the tour continue until it crosses into **Galería B**. Watch the crossing.
   *This crossing must look exactly as it did before. If anything about it has
   changed, that is a regression and the most important thing you can report.*
7. Once settled in Galería B, press **← ANTERIOR**.
   - Do you travel **through the doorway**, or does the room simply swap?
   - Does the guide survive the return?
8. Press **REANUDAR** and let it cross into Galería B again.
   - Is the second crossing the same as the first?

### C. Authoring (≈3 min)

9. Open the authoring layer. Go to the **Visitante** domain.
   - Is it a writing surface or a form? Do fields have room? Is anything clipped?
   - Is the 3D preview still usefully visible while you write?
10. Type a distinctive value into **Horarios**. Return to the experience and open
    **Visita**. Your value should be there.

---

# 4. Evidence index

Open the boards rather than the raw folders — they lay the frames out to be
looked at.

## Motion evidence

| | |
|---|---|
| **Guided Back, all six moments + both filmstrips + continuous recording** | `labs/immersive-worlds/qa/evidence-vs02/guided-back-motion/index.html` |
| Crossing A, continuous recording | `labs/immersive-worlds/qa/evidence-vs02/crossing/crossing-NATURAL.webm` |

## Visual evidence

| Vertical | Where |
|---|---|
| Guided Back — six matched moments | `evidence-vs02/guided-back-motion/0*.png` |
| Guided Back — earlier pose evidence | `evidence-vs02/guided-reversibility/fs-*.png`, `xr-*.png` |
| Crossing B — twelve beats | `evidence-vs02/crossing/museum-B-NATURAL-SCRUB-*.png` |
| P0.1 Visitor **authoring tool** at 1366 / 1440 / 1920, before **and** after | `evidence-vs02/visitor-workspace/{before,after}/` |
| P0.3 VISITA — the **public panel** at 4 viewports × 4 states, before **and** after | `evidence-vs02/visitor-design/{current,corrected}/` |
| P0.3 VISITA — authoring input beside visitor output | `evidence-vs02/visita-traceability/visita-trazabilidad.png` |
| Option E nested room — four lifecycle stills | `evidence-vs02/nested-room-spike/` |

---

# 5. Known limitations — read before you judge

1. **Everything below was captured in a software-rendered container at a few
   frames per second.** Pacing in the recordings is not the pacing you will see.
   Judge composition, framing and continuity from them; judge *tempo* only in
   your own browser.

2. **A defect was found and deliberately not fixed: the label card does not
   follow Back.** Going back moves the camera correctly and updates the counter
   correctly, but the artwork label on the left keeps describing the stop you
   just left — in the cross-room case, a work in the other room. Reproducible in
   both kinds of Back. Not fixed here because this reconciliation is about
   evidence, and because changing what the guided experience says to a visitor is
   your call, not mine. It is the first item queued for after your verdict.

3. **P0.2 is not done and is not claimed.** No byte has ever been stored or
   retrieved. See `MUSEUM_P0_REGISTRY.md`.

4. **Breeze is frozen.** The nested-room host exists and is proven as
   architecture, with a test double as the guest — the spike says so in its own
   header. Phase 1A reached a real WebGPU device and a real physics bake, then
   failed at reading positions back off the GPU, so no Breeze motion is claimed.
   Nothing Breeze is reachable by a visitor.

5. **No agent verdict in this repository is an approval.** Fresh-critic verdicts
   are recorded in §6 because the process requires them, not because they carry
   weight. `AGENT KEEP ≠ HUMAN APPROVAL`.

---

# 5b. Regression matrix

What was protected, how it was checked, and the result. "Protected" means the
thing must not have changed; a green row is the *absence* of a change.

| Protected property | How it is guarded | Result |
|---|---|---|
| **Crossing B geometry** — the human baseline | the crossing plan is re-derived from the played route and compared field by field against the recorded baseline (`s`, `gate`, `via`, `window`, `durationMs`, `recoil`) | **UNCHANGED** — `s 0.7302 · 4667 ms · recoil 0.62 · window 0.22`, exact |
| **Crossing B stability across a Back** | the plan is read again after going back through the doorway and forward across it a second time | **UNCHANGED** — identical `s` and duration |
| **Where an approved beat ends** | forward arrival compared against the canonical settle, then against the Back return | **HELD** — Δpos 0 m, Δtgt 0 m |
| **The way out is never swallowed** | HUD hit-tested with `elementFromPoint` while a nested room presents | **HELD** — 17/17 in the Option E spike |
| **One camera authority per frame** | camera owner sampled every frame through the whole route | **HELD** — no frame with two writers |
| **The transition engine** | not touched by any commit in this reconciliation | **UNCHANGED** |
| **Museum renderer stays WebGL** | `engine/**` imports no renderer; the WebGPU bundle loads only on demand and is not on the visitor path | **HELD** |
| **Master** | no merge, no promotion, no PR | **UNTOUCHED** |

The Crossing B guard is new. The baseline had been *photographed* since `6e87a9b`
but never *compared against* — a baseline nothing checks is a screenshot, not a
guard. That gap is now closed, and the first comparison passes.

---

# 6. Fresh critic verdicts

Run on the visual evidence by a critic given no build history, no test results,
no author intent and no knowledge of any previous human decision — only the
images and a neutral description of what each surface is for. Its verdicts are
reproduced faithfully, including the one that contradicts a decision you have
already made.

| Surface | Verdict |
|---|---|
| Public VISITA panel — presentation redesign | **ADJUST** (the redesigned version is decisively better) |
| Authoring tool — Visitante editorial measure | **ADJUST** |
| Crossing B | **REJECT** |

## Public VISITA panel — ADJUST

**Works.** The redesign turns a ~1300 px scroll into one view: a three-up facts
band (Horarios / Dirección / Entrada), then Programación against Planificar la
visita, then a fixed action bar. Headings moved to a serif that matches the wall
labels inside the room — the previous bold sans "reads like a browser dialog
dropped on top of a museum". A raw default-blue "Reservar" link was fixed.
Accessibility is placed first in the planning column rather than buried.

**Does not.** The previous version clipped text mid-glyph at three of four
viewport sizes — "ACCESIBILIDAD" sliced at the panel edge on laptop,
"Recorrido comentado por la" guillotined through the letterforms on mobile. The
mobile title stacked to five lines leaving CERRAR in a notch beside it. In the
redesign, the two columns can go badly out of balance: with a thin programme the
left column ends early and leaves roughly 230 px of dead panel, so an institution
showing one exhibition "gets a panel that looks half-loaded". `CÓMO LLEGAR`
appears twice — as a field and again as a footer button — and `RESERVAR VISITA`
and `CÓMO LLEGAR` are styled as peers despite one being a commitment.

**Highest-value change.** Let the planning column reflow across the full width
when programming holds fewer than two or three items.

## Authoring tool — ADJUST

**Works.** The editing column roughly doubles (~195 px → ~420 px at 1440). In the
before state, Horarios rendered one word per line — "Miércoles / a / domingo, /
11:00 –" — and then clipped, with help text reading vertically. The critic's
words: *"That is not a cramped tool, it is an unusable one."* The 3D preview
survives the widening at both 1440 and 1920.

**Does not.** `Entrada` is still a single-line input and truncates —
"Entrada libre. Aforo limitado en la sala de" — while Horarios, Dirección and
Accesibilidad beside it are multi-line textareas holding comparable sentences.
The Reservar URL truncates the same way. Staff cannot read back what they
published. The right-hand Institución panel is now narrower and word-breaks
mid-syllable ("seleccionad / o"), and the institution-name field regressed from
showing "Fundación Arenas (ins" to "Fundación Are".

**Highest-value change.** Make `Entrada` and the URL fields wrap or auto-expand
like their neighbours.

## Crossing B — REJECT

**This verdict contradicts your standing decision, and nothing has been changed
because of it.**

Your instruction on record: Crossing B is the current best baseline, it is not
rejected, the endpoint may not change, and the red portal effect must not be
automatically reduced or removed. That instruction governs. The critic was given
no knowledge of it — that is what "amnesiac" means, and it is why the verdict is
worth reading rather than dismissing.

What it saw, in its terms: frames 02–04 are "a saturated pure-red and white swirl
with concentric ringing" filling the doorway and then the frame, with hard
diagonal seams — "not a colour outside the museum's bone-and-graphite palette; it
reads as a failed shader or a debug pass", and "three of twelve frames — a
quarter of the passage — are unshowable". Frame 05 still has red bleeding onto
walls and a ghosted duplicate painting. Frames 06–07 are near-identical and the
arrival room is "unintentionally dark, not dramatically dark". Frame 08 is "a
hard cut… exposure jumps from near-black to full brightness in one frame", with
"no threshold in that cut — which is the one thing the sequence exists to
deliver". Frames 09–12 are indistinguishable, "a dead hold".

It also flagged the guide as placeholder geometry: *"A crude low-poly human
figure in a blue jacket stands centre-frame… Its face is a blank oval."* The
guide is deliberate, authored, and part of the product — but a first-time viewer
read it as leftover test geometry, which is worth knowing.

**Two cautions before you weigh any of this.** First, the twelve frames it judged
are a *deterministic scrub* — sampled at chosen fractions of the move, not at a
constant frame rate — so "frames 09–12 are identical" and "the pacing is a dead
hold" are statements about the sampling, not about tempo. Second, the container
renders in software; exposure and darkness on your machine will differ. The
red-swirl frames and the exposure discontinuity at 08 are, however, real content
and not artefacts of either.

**First-glance impression, verbatim:** *"A director opening the corrected visitor
panel would think this looks like a real institution… Then they would scrub the
room transition, hit a screen of swirling red, and immediately stop trusting
everything they just saw."*

`AGENT KEEP ≠ HUMAN APPROVAL`, and the same holds for `AGENT REJECT`. Nothing was
changed. The decision is yours.

---

# 7. What I need from you

Only these, in whatever form is convenient:

| Vertical | Question |
|---|---|
| Guided Back — same room | KEEP / ADJUST / REJECT, and if ADJUST: is it the *movement* or the *destination*? |
| Guided Back — cross room | KEEP / ADJUST / REJECT |
| Label card after Back | Is the desync described in §3 step 4 present for you? |
| Crossing B | **Unchanged, or regressed?** |
| P0.1 Visitor authoring | KEEP / ADJUST / REJECT |
| P0.3 VISITA | KEEP / ADJUST / REJECT |

Nothing proceeds to Breeze until this reconciliation has your verdict.
