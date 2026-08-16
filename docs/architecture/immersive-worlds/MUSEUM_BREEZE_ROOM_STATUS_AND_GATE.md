# Breeze room — status, and the gate this stops at

> **Branch:** `claude/immersive-worlds-module-c0d3f7` · **Master:** UNTOUCHED
> **Product approval:** PENDING
> **Status:** the room runs and is reachable. **It does not yet deliver its central moment.**

---

# 0. The one-line truth

Everything that makes the Breeze room *work* is real and proven — a WebGPU
device inside the Museum, the donor's physics with 6 561 vertices and 51 040
springs, the real Venus, the real fabric, the real wind, the collider built from
the sculpture's own geometry, the handoff in and out, the route, the guide.

And the visitor never sees the cloth. The camera is not framing the moment the
simulation produces, so the four beats of the arc — approach, contact, release,
settle — come back as four **byte-identical frames** with four different captions
under them.

A room whose one work is invisible has not delivered its premise, and no amount
of correct machinery underneath changes that. This is where it stops.

---

# 1. What is real, and proven on the real product path

`qa/tools/breeze-room-evidence.mjs` — 25 of 27, one continuous run, the visitor
walking the guided route.

| | |
|---|---|
| The room is reachable through the guided route | `space.breeze`, 12 stops, reached by playing — not by seeking |
| The Museum stands down and the guest presents | museum canvas hidden not destroyed, exactly one guest canvas |
| **Real WebGPU inside the Museum** | backend `webgpu`, no WebGL fallback accepted |
| **Real Breeze physics** | 6 561 vertices · 51 040 springs baked, kernels compiled including BVH traversal |
| **Real Venus** | the donor's GLB, ~7 m, with its collision OBJ |
| **Real wind** | the donor's own `triNoise3Dvec` expression behind a named strength |
| Museum camera → guest | `[50.87, 1.72, −17.79] − [60, 0, −10] → [−9.13, 1.72, −7.79]`, and the guest has no controls |
| The guide steps aside for the hero beat | opacity 0 at the collision beat |
| Exit restores the Museum | presentation MUSEUM, zero guest canvases, Museum painting again |
| Re-entry works | second cycle also WebGPU, no orphan loops |
| Crossing B | **unchanged**, exactly: `s 0.7302 · 4667 ms · recoil 0.62 · window 0.22` |

The label defect is fixed and proven separately — §3.

---

# 2. What is NOT delivered

## 2.1 The cloth is never in frame

Beats D, E, F and G are the same image. The simulation is running underneath —
step counts rise from 18 to 98 across them — but Venus does not move and the
cloth is outside the camera's view, so the picture does not change.

Consequences, all of them real:

- The caption at the hero beat says *«Al alcanzarla, la tela se pliega sobre el
  hombro y sigue»* over a frame where nothing happens, and where the shoulder it
  names is cropped out.
- «settled» and «collision» are visually identical, so neither moment exists.
- Arrival and the end of the tour look the same.

**Cause, as far as it is known.** The cloth is an 8 m sheet released 10 m upwind
and carried past the sculpture over tens of seconds. The room does not yet
relaunch it on arrival, and the beats are not timed to its flight, so the visitor
is shown a window of the simulation in which the cloth is elsewhere. The camera
is also too close and too low: Venus is cropped at the collarbone at the very
beat that needs the widest shot in the room.

**Why it is not fixed here.** Each look costs about twenty minutes on this
container's software renderer, and this is composition — where the camera stands,
how wide, when the cloth is released relative to the beat. That is visual
authority, and it is yours.

## 2.2 The room does not read as a room

The Museum's own galleries read as architecture — walls meeting, a cornice wash,
a floor with a sheen, a rope barrier. The Breeze room is the sculpture in black:
no floor, no contact shadow, no bounding surfaces, no scale cue. Nothing in the
frame distinguishes a 7 m replica from a 40 cm one.

## 2.3 There is no degraded state

The room stakes everything on one continuously simulated element with no
fallback. If the simulation does not run, what remains is a static replica in an
unlit void — with the narration still describing cloth in detail.

---

# 3. The label defect — CLOSED

Two bugs behind one symptom, both fixed at the semantic layer and proven on the
real product path (26/27, `qa/tools/guided-back-motion-evidence.mjs`):

| | Before | After |
|---|---|---|
| After same-room Back | «División tercera» — the stop just left | «Horizonte interrumpido» — the stop you are on |
| On arrival in Galería B | «Vasija de arenas» — a work in the *other* gallery | no card at all |

The second was a **forward**-path defect nobody had looked for: focus survived a
doorway. Fixed in World State rather than the Director, because a crossing is a
crossing whether the route drives it, a hotspot does, or the visitor walks
through in Explore.

---

# 4. Fresh critic — REJECT

Run with no build history, no intent, no knowledge of what anything was supposed
to look like. Its verdict on the room as it stands:

> **REJECT.** … the room is a single-work gallery whose one work is a real-time
> physical simulation, and in this evidence the simulation does not run … Strip
> out the cloth and what remains is a static replica floating in an unlit void,
> which is not a reduced version of the intended experience but a different and
> much weaker one. The narration is meanwhile still describing the cloth in
> detail, so the room actively tells the visitor about an event it is not showing
> them.

> The underlying idea — wind made legible by what it touches, a cloth reading the
> volume of a marble body, the guide stepping aside so the visitor is alone with
> it — is a good idea and worth rebuilding. The verdict is about this execution,
> not the concept.

Its three highest-value changes, in its order:

1. Make the cloth exist and verifiably move — treat *consecutive beat frames are
   pixel-identical* as an automatic build failure.
2. Build the room around the work — floor with contact shadow, bounding walls, a
   raking light, a plinth of readable height.
3. Direct four distinct cameras for D/E/F/G, **widest at E**, with air on the
   windward side and the head never cropped.

The critic also flagged two things worth keeping: the caption is stale for one
frame after leaving the room, and the beat labelled *guide accompanies* contains
no visible guide.

I agree with all of it. It is a harder verdict than the machinery deserves and a
fair one for the room.

---

# 5. THE GATE — what I need from you

## Decision 1 — the hosted review environment

**I NEED JUANMA TO DECIDE:** which hosted review environment the Human QA build
should be published to, and to enable it.

**BEFORE I CAN SAFELY EXECUTE:** publishing and validating a commit-pinned Human
QA URL — the defined Human Gate for this mission.

This container's network policy denies every hosted origin I could use. Measured,
not assumed:

| Origin | Result |
|---|---|
| `raw.githack.com` | 403 at the proxy |
| `cdn.jsdelivr.net` | 403 |
| `statically.io` | 403 |
| `rawcdn.githack.com` | 403 |
| `juanmaes83.github.io` | 403 |
| `raw.githubusercontent.com` | 200, but serves `text/plain` — ES modules will not execute |
| `github.com` | 200 |

The mandate is explicit that a URL which merely exists is not sufficient and that
success must not be faked. I cannot reach any candidate origin to check that the
page returns, the product boots, or — the one that matters most — that **WebGPU
presents in that origin's security context**. So I am not handing you a URL.

Enabling GitHub Pages on this repository would publish it, which is an
outward-facing change I will not make on your behalf.

**Reviewer-local remains available and is verified as far as this container
allows:** `node tests/static-server.mjs 4180 .` →
`http://127.0.0.1:4180/labs/immersive-worlds/index.html`. Requires a browser with
working WebGPU. This is the fallback the URL delivery rule allows only when
hosting cannot faithfully reproduce the product; here it is the only option I
have.

## Decision 2 — the room's composition

**I NEED JUANMA TO DECIDE:** whether the Breeze room's hero composition is mine
to iterate or yours to art-direct.

**BEFORE I CAN SAFELY EXECUTE:** authoring the four cameras and the cloth launch
timing that make the collision visible.

I can converge it by iteration, but blindly and slowly — twenty minutes per look
in a container with no GPU, which is how the current framing came to crop Venus
at the collarbone. If you give me the shot — roughly where the visitor stands,
how wide, and whether the cloth should be released on arrival — I can author it
directly instead of hunting for it.

---

# 6. Status table

| | |
|---|---|
| P0 LABEL CARD | **PASS** |
| P0.2 DURABLE ASSET PERSISTENCE | **EXTERNAL BLOCKER**, unchanged — no byte stored or retrieved |
| BREEZE PHASE 1A EVIDENCE | **PASS** — calibrated against known zero, known pin, known fall |
| REAL VENUS | **PASS** |
| REAL CLOTH (simulation) | **PASS** — 6 561 vertices, 51 040 springs |
| REAL CLOTH (visible to the visitor) | **FAIL** |
| REAL WIND | **PASS** as a force; **not demonstrated** on screen |
| REAL BVH COLLISION | **PASS** numerically; **FAIL** as something the camera can see |
| OPTION E1 HOST | **PASS** |
| MUSEUM CAMERA → BREEZE | **PASS** |
| REAL MUSEUM ROOM | **ADJUST** — reachable and authored; reads as an object in black, not a room |
| GUIDE V1 | **ADJUST** — steps aside correctly; not visibly present beforehand |
| FORWARD / BACK / RE-ENTRY | **PASS** |
| CROSSING B | **PRESERVED**, exactly |
| FRESH CRITIC | **REJECT** |
| GLOBAL REGRESSION | **NONE** — Galería A, Galería B, Crossing B, Studio, Visitor untouched |
| HUMAN QA STATUS | **NOT READY** — no validated hosted build, and the room's premise is not on screen |
