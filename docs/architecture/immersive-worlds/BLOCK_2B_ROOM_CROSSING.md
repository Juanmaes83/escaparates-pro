# Block 2B — room-to-room crossing

Galería A → Galería B, as a move instead of a cut. Block 2A ended at the threshold
and recorded portals as a known limitation; this closes it.

Baseline: Block 2A `7211e3f` (68/68). Room 1 closure `a0ada12`.
Contracts: `TRANSITION_LANGUAGE_SPEC.md` §T6, `BLOCK_2A_TRANSITION_LANGUAGE.md`,
`MUSEUM_CAPABILITY_SOURCE_INFINITE_WORLDS.md`.
Review: `qa/evidence-crossing/crossing-review.html`.

---

## 1. What the first-party source actually gave us

The mandate was to inspect the owned Infinite Worlds V1.2.3 crossing before writing
one. That inspection changed the answer, so it is recorded before the design.

The source (`labs/infinite-worlds-brand-expression-v1-2/app.js`, canonical commit
`453ed40008f838d6187a7e85d93872f7866ad5cb`) crosses between worlds with a
`WebGLRenderTarget(2048²)` per portal, `CameraUtils.frameCorners` to render the
destination through the portal quad, a second synced camera, and a world swap that
moves the outgoing world away and the incoming world to the origin.

**Museum does not have the problem that machinery solves.** Grey City and Living
Valley are two scenes occupying the same coordinates, so the only way to see one
from the other is to render it to a texture. Museum has one scene: Galería A is
`x ∈ [-8, 8]`, Galería B is `x ∈ [8, 20]`, they share the wall at `x = 8`, and the
portal is a real hole cut in it. `setSpacePresence(handle, 'ADJACENT')` already
makes the destination visible through that hole — verified visually before any code
was written, in `02_threshold.png`.

So the reuse is the **choreography and the warmup discipline**, not the render
target:

| From the source | Taken | Why |
|---|---|---|
| Ease *into* the portal, ease *out* of it, one continuous move | ✅ | the shape of a crossing |
| Destination live and warm before the move commits | ✅ | this is what makes the first crossing equal the second |
| Handoff at the portal plane, not before or after | ✅ | the truthful moment, and the invisible one |
| `WebGLRenderTarget` + `frameCorners` | ❌ | solves two-scenes-same-coordinates; Museum has one scene |
| Second synced camera | ❌ | would be a second camera writer, against IW-ADR-002 |
| World swap to origin | ❌ | the rooms are genuinely adjacent; moving them would be the lie |
| `PortalAppearance` distortion / edge glow | ❌ | see §7, open product question |

Transplanting the render target would have added a 2048² buffer per doorway and a
second camera to look through a hole that is already a hole. **The most valuable
result of reading the source was deciding not to copy most of it.**

## 2. Architecture — a sixth family and a fifth authority

The three-layer boundary from Block 2A holds unchanged, one room further out:

```
Experience Director  = WHY     this beat is a crossing, and what character it has
Crossing mechanism   = HOW     phases, aperture pin, fov breath, handoff moment
Museum Scene Kit     = WHERE   the hole in the wall, and which way is out
```

**T6 · ROOM CROSSING** is decided from the beat's intent — a `PORTAL` shot — and
never from distance. `TELEPORT` portals stay cuts, because there is no line of
sight to fly through and a crossing would misdescribe the building.

`CAMERA_AUTHORITY.TRANSITION` was declared in `types.js` from the beginning and had
no controller. It has one now: `CrossingController`. A crossing is its own
authority rather than a mode of the Directed controller because it outlives the
beat that starts it and belongs to neither room.

### The order, which is the whole design

1. the destination is built, warmed and made visible **before anything moves**
2. the aperture is measured and the arrival pose resolved against the built room
3. `TRANSITION` takes the camera — one writer for the whole crossing
4. the room handoff fires **on the frame the camera passes the threshold plane**
5. the camera lands on the arrival pose and hands authority back

Step 1 is what makes the first crossing look like the second. The old cut activated
the destination while the visitor was notionally already in it, so the first pass
paid for the build and every later pass did not.

### The curve

A quadratic Bézier whose control point is **solved** so the path passes through the
gate point exactly at `e = s`, where `s` is the along-axis split between approach
and arrival:

```
P = (gate − (1−s)²·A − s²·C) / (2(1−s)s)
```

Bending *toward* the gate and hoping is how a camera brushes a door jamb. Every
shaping term — the bend, the target lead, the aperture pin, the fov breath — is
zero at `k = 1` by construction, so the crossing can only choose *how* the camera
arrives.

### The aperture pin

Through the opening, the look is held **through** the opening. Without it the view
lerps between two room-interior targets and sweeps the jamb at exactly the moment
the visitor most needs to read where they are going. Measured on an oblique
departure: 0.08 °/frame inside the opening against 0.35 °/frame overall — the look
is at its calmest exactly where it matters.

### The atmosphere

Each room owns its fog, background and exposure, and `activateSpace` applies them
in one frame. That is right for arriving somewhere and wrong for walking there:
the move was continuous and the light was a cut, which reads worse than the cut it
replaced. The two atmospheres now resolve across the doorway, and at `t = 1` the
result is exactly what `activateSpace` would have set — the blend can decide when
the room changes, never what it changes to.

Galería B is the *cámara oscura*, and the guide's own line for the beat before is
"la sala siguiente está a oscuras, deje que la vista se acostumbre". The eye
adapting to the dark room is the narration made literal, not an effect added to it.

## 3. Measured

RUN: `crossing.json`, RUN_ID in the file header, generated by
`qa/tools/crossing-slice.mjs`. Frames captured by stepping the runtime by hand with
the render loop stopped, so each image is a named frame of one crossing.

| | |
|---|---|
| Camera authorities during the crossing | **1** — `TRANSITION` throughout |
| Camera authority violations | **0** |
| Crossing length | **280 frames**, 5000 ms |
| Handoff position | **0.022 m** from the wall plane, frame 192 of 281 |
| Endpoint lock | **exact** — Δ 0.0 m position, 0.0 m target |
| Join to the next beat | **exact** — Δ 0.0 |
| Path frames outside the aperture | **0** of 36 at the wall |
| Maximum turn | **0.00 °/frame** (this doorway is dead-on; oblique case 0.35) |
| Largest single-frame exposure step | **0.0013** across a 0.95 → 1.05 change |
| Destination state before the move | **READY**, visible through the opening |

Plus 21 properties of the curve itself in `qa/tools/crossing-math.mjs`, which runs
in under a second with no browser: endpoint exactness, gate passage, monotonic
travel, aperture containment, the fov breath returning to the authored value, the
handoff firing exactly once, and the reduced-motion variant.

### Reduced motion

**1100 ms against 5000 ms, the same 5.28 m of path travelled, identical
destination, no fov breath.** Shorter and plainer, not a teleport. Spatial
continuity is the accommodation; a doorway you did not see yourself go through is
the opposite of one.

### First crossing against a repeated one

The destination is built, warmed and already visible before the camera commits, so
the first crossing is not a cold path: the prefetch had already brought Galería B
to READY, and `preview()` before the move is a guarantee rather than a wait. Two
further crossings of the same doorway, warm, produced the same 5000 ms travel and
worst-frame times of 0.5–2.4 ms. **There is no first-crossing penalty to hide.**

## 4. What was found by measuring

### 4.1 A controller may not hand back the camera inside its own update

**Symptom:** `"TRANSITION" wrote the camera while "DIRECTED" was authoritative` on
the very first run.
**Cause:** the crossing's completion callback requested the next authority, and the
next line of the same `update()` committed the frame's pose under a token whose
owner was no longer authoritative. The authority was right; the controller was
wrong.
**Correction:** collect callbacks during the frame, `commit`, then fire them. **A
callback that can change who owns a resource must not run while that resource is
mid-write.** The invariant found this in the frame the mistake was made, which is
exactly what it exists for.

### 4.2 An `await` with nothing to await still costs a frame

**Symptom:** after the handoff, the active Space read as the *origin* room for one
frame; in a tight synchronous test loop it read wrong for the whole loop.
**Cause:** the handoff called `spaces.activate()`, which is `async`. Even with the
room already READY and nothing to load, the `await` defers the swap by a microtask
— so for one frame the camera was through the doorway and World State said
otherwise.
**Correction:** `activateReady()`, a synchronous activation that *requires* READY
and throws otherwise. Requiring it is the point: the caller must already have paid
for the room, and if it has not, that is a bug to surface rather than a stall to
hide inside a crossing. Handoff accuracy went from 0.189 m to 0.022 m from the
plane.

### 4.3 A framing of a room that does not exist is not a framing

**Symptom:** the endpoint check reported a 17 m error on a crossing that had landed
exactly.
**Cause:** the harness resolved the arrival pose *before* the crossing, when
Galería B was still unloaded. `framingForSpace` has nothing to frame then and
returns a placeholder. The measurement compared a correct landing against a
placeholder.
**Correction:** resolve a framing only against a built room, and assert that
precondition rather than assuming it. **A reference value obtained from a
degenerate state is worse than no reference: it fails loudly in the wrong
direction and sends you looking at working code.**

### 4.4 Measuring in batches measures the wrong frame

**Symptom:** "arrival" readings were consistently two beats past the arrival.
**Cause:** the capture loop stepped six frames per round trip, so it noticed the
landing up to five frames late — by which time the Director had legitimately
started the next beat. Then the settle loop ran the next beat to completion.
**Correction:** step one frame per round trip through the moment being measured,
and freeze the clock on the frame the event happens. **A harness's time resolution
is a floor on what it can claim**, the same way §4.2 of Block 2A found that a
baseline's precision is.

### 4.5 A test that cannot fail is not evidence

**Symptom:** "the look never whips — max 0.00 °/frame" passed on the first run.
**Cause:** this doorway is dead-on. Departure, gate and arrival all sit on
`z = −10`, so the yaw is constant and the claim is true for free — the aperture pin
was never exercised at all.
**Correction:** an oblique-departure case alongside the real one. **A property that
holds trivially for the geometry you have proves nothing about the mechanism**, and
a green result is the easiest place in the world to stop looking.

## 5. What was not changed

Room 1's 33 end poses, the artwork and sculpture grammars, guide choreography,
Focus, Collection Browse and its return contract, World State, the Tour Manifest,
Free Explore, **the world file** — no beat, anchor, duration or portal record was
edited — and the two `TELEPORT` portals, which remain cuts by design.

The portal beat's authored duration was left alone. A crossing that outran its beat
was avoided the way Block 2A avoided a lead that outran its guide: the beat waits
for the move, bounded at twice the authored duration, reusing the existing
mechanism rather than adding a second one.

## 6. Visual findings for the Product Owner

The crossing itself measured clean. Two composition defects are visible in the
evidence, both about the *guide*, and neither is fixed here because both would move
a frozen Room 1 endpoint.

**6.1 · The guide stands in the doorway she is telling you to look through.**
`02_threshold.png`. At the T5 threshold beat the guide is at
`anchor.gallery-a.guide-umbral` `[6.3, 0, −10]` — dead centre of a 2.6 m opening,
back to camera — while the caption reads *"la sala siguiente está a oscuras, deje
que la vista se acostumbre"*. She occupies roughly a third of the opening and
covers the artwork visible through it. Same class as the A05 occlusion closed in
PASS B.

**6.2 · The crossing flies through the dismissed guide.** `04_portal_active.png`.
The portal beat stages no guide, so she fades out — while the camera is travelling
straight at her along `z = −10` and passes through `x = 6.3`. She dissolves in the
middle of frame as the camera reaches her, which reads as a ghost rather than a
host who stepped aside.

**Recommended fix for both, needing approval because it moves a frozen beat:** move
`anchor.gallery-a.guide-umbral` about 1.1 m off the crossing axis, so she stands
*beside* the opening and gestures through it. One anchor, one number; it clears the
view, clears the flight path, and is what a host actually does. It changes T5's
composition, so it is not taken unilaterally.

## 7. Open product question — the portal's appearance

The first-party source draws its portals with a distortion and edge-glow shader
(`PortalAppearance`). "Spectacular" was the word in the mandate, and that shader is
the source's answer to it.

**The recommendation is not to use it here.** Watch `05_middle.png`: standing in the
doorway of the dark chamber, jamb framing the shot, *Noche de invierno* ahead and
the cove line running away over the ceiling. Nothing in that image needs an energy
effect, and an energy effect would fight the institutional art direction — a
museum doorway that glows is a themed attraction. The spectacle here is the
building.

This is Juanma's call, not an engineering one, and the mechanism does not depend on
it either way.

## 8. Known limitations

- **Only guided crossings are choreographed.** The mechanism is general and the
  Explore path can supply the same intent, but this block scoped it to the Director
  so the free-explore portal behaviour is unchanged and unmeasured. A hotspot-driven
  portal still uses the previous 650 ms authority blend.
- **The lobby → Galería A entry also became a crossing**, as a consequence of the
  family being decided by beat intent rather than by portal identity. That is the
  correct grammar and it lands on the same authored endpoint, but it was not part
  of the authorised vertical slice and has not been visually reviewed.
- **One quadratic through one gate point.** A doorway with a dog-leg behind it, or
  two openings in sequence, would need segmenting.
- **The aperture check is sampled**, and only within half a metre of the wall
  plane. It tests the curve the camera actually flies.
- **`camera.owner` reports `TRANSITION` for two different things** — the authority's
  own blend between controllers, and the crossing controller. They never overlap in
  practice, because a crossing is requested with no blend duration.
