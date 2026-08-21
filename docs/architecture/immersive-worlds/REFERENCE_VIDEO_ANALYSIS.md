# Immersive Worlds — Reference video analysis

> **Status:** ENGINEERING EVIDENCE — derived from the two recordings stored on this branch.
> **Method:** required by `NEXT_PASSES_MUSEUM_ROADMAP.md` §1 before any guide / camera / portal pass.
> **Scope:** behaviour and capability only. Nothing here authorizes copying art direction, character
> design, architecture, artwork, typography or source expression from either reference.

## 1. Raw reference

| | A | B |
|---|---|---|
| File | `immersive-worlds-module/145be553-0736-4df6-b639-7f584f392a83.webm` | `immersive-worlds-module/video_2026-08-09_10-44-43.webm` |
| Duration | 40.98 s | 50.10 s | 
| Resolution | 2560 × 1440 | 2560 × 1440 |
| Codec | VP9 | VP9 |
| Subject | TheVertMenthe — browser capture of the site gallery | "The Neural Museum — drawn in ink" — 3D gallery |

Both are screen recordings, so part of each frame is browser chrome, a recorder overlay and a
taskbar. That is capture noise, not reference material.

### How they were inspected

There is no ffmpeg in the execution container. Chromium decodes VP9, so the browser was used as
the decoder: load the file, seek to a timestamp, draw the video frame to a canvas, export. Two
things had to be true for that to work and both were initially false — the page must share an
origin with the media, or the canvas is tainted and cannot be exported; and the server must
answer byte-range requests, which `python -m http.server` does not, and without which Chromium's
media stack refuses the file outright. A ~20-line range-capable server fixed the second.

Eighteen frames were extracted from each recording.

---

## 2. Behavioural breakdown — B, "The Neural Museum"

This is the more useful of the two: it is a 3D gallery with an embodied character.

**Camera.** Third person throughout. The camera sits behind the character at roughly three to four
metres and slightly above, looking down the nave. The character stays near the centre of frame and
is small — perhaps a seventh of frame height. This is *not* an occasional accompanied beat: it is
the default camera for the whole experience.

**Character.** A black silhouette with a large irregular hair mass, no face, no hands, no visible
articulation. It reads as a person entirely through proportion and outline. It gives immediate
scale to the room, the works and the ceiling.

**Floor marks.** Thin outlined ellipses on the floor, one in front of each work, spaced down both
sides of the nave. They are visible at rest, not only on approach — but they are drawn as a hairline
outline in the same ink language as everything else, so they read as museography rather than as
game affordances.

**Footprints.** Small dark smudges trail behind the character as it moves. Irregular, soft-edged,
clearly transient. They give the floor depth and make the path taken legible.

**Architecture.** A long top-lit nave with a pitched skylight, black-framed works hung in a regular
rhythm on both walls, a black handrail running the length of both sides, and the institution's name
lettered directly on the end wall.

**UI.** Almost nothing. `MENU` in the top right. A single line bottom centre: `MOVE ← ↑ ↓ →`,
`READ ⏎`, `MENU ESC`. No prompts, no markers, no floating labels, no health-bar grammar.

**Focus.** Entering a work replaces the room entirely: the work is presented flat, frontal, centred,
filling roughly half the frame height with generous margin, on a plain paper ground. Metadata sits
in the top-left corner as small quiet type — title, dimensions, medium, availability, a one-line
statement. Status sits bottom-left. Chevrons at the left and right edges browse. The bottom line
becomes `BROWSE ← →`, `CLOSE P ESC`. On at least one frame the metadata block is absent and appears
later, so the text is staged rather than simultaneous with the image.

The character remains present in Focus, tiny, in the bottom-right corner, paired with a
`Contact me` link. That is the artist's signature and commercial call to action, not a museum
pattern — noted, not adopted.

---

## 3. Behavioural breakdown — A, TheVertMenthe

A browser capture of a 2D site rather than a 3D space.

**Index.** The gallery index is a plain vertical list of work titles in small type — no thumbnails,
no cards, no grid. `Home / Gallery` at the left, `CLOSE` at the right, a `Search an artwork` field
at the bottom. Content is the entire interface.

**Transition.** Moving between views plays an authored graphic transition built from dense ink
strokes that sweep across and clear. It is a designed wipe in the site's own drawing language, not
a camera move and not a crossfade. The transition carries the identity.

---

## 4. Extract

| Principle | Why it matters |
|---|---|
| Embodied presence gives scale for free | A figure of known height makes the room, the hanging height and the work size legible in one frame, with no measurement UI |
| Shared attention needs the body in the near field | Presence reads as accompaniment only when the figure is close enough to be *in front of* the viewer rather than beside them |
| Movement leaves a trace | A transient mark behind a moving figure gives the floor depth and makes the path taken readable |
| Floor marks can be museography | A hairline outline in the room's own drawing language is not a quest circle; the failure mode is the visual language, not the mark |
| Focus should replace the room, not decorate it | Flat, frontal, centred, generous margin, plain ground |
| Metadata belongs in the corners, small and staged | Never over the work, never all at once |
| Controls are one line of text or nothing | The whole control surface of B is eleven words |
| Transitions can be authored rather than physical | A designed wipe in the product's own language can carry more identity than a camera move |

## 5. Do not copy

Character design and the hair-mass silhouette. Black-and-white ink art direction. The nave
architecture and its proportions. Any artwork. Typography. Branding, `Contact me`, commercial
framing. The exact control scheme. Gallery geometry. Any code or asset from either source.

Neither recording carries a licence grant. They are behavioural references, studied and described
here; nothing was copied from them.

---

## 6. Capability extraction against the current IW Museum

| Reference capability | Current IW equivalent | Gap |
|---|---|---|
| Embodied presence for scale | Guide figure staged at a `VIEWPOINT` anchor | Present only during an accompanied beat, not while exploring. Deliberate for now — permanent presence is not assumed better |
| Over-the-shoulder shared attention | `SHOT_INTENT.ACCOMPANIED` composed from guide anchor + subject | Closed |
| Camera handoff to the visitor | ACCOMPANIED shot → FOCUS shot → EXPLORE | Closed in Pass 1 |
| Movement trace / footprints | none | Open. Optional Pass 1 experiment; only worth it once the guide actually walks a distance, which it does not yet |
| Floor marks as museography | `visualPolicy` honoured; marks appear on approach | Closed differently from the reference, and arguably better: ours are absent rather than restyled |
| Focus replaces the room | Focus with wall label, chevrons, zoom, close | Close. Ours keeps more room context than the reference, which is a deliberate difference — ours is a room you are standing in, theirs is a page |
| Metadata staged rather than simultaneous | All label text appears at once | Open, minor |
| One-line control surface | Explore chrome is four buttons plus a wall label; guided chrome adds caption and transport | Open. The guided HUD is the heaviest surface in the product |
| Authored transition language | Portal transition behaviours exist semantically; representation is a camera move | Open — Pass 2 material |
| Guide continuity between rooms | none | Open — Pass 2, explicitly not started |

## 7. Consequence for Pass 1

Two findings changed what Pass 1 did.

The reference is third-person *by default*, and ours is not. That is a real product fork, not an
oversight, and it is not Pass 1's to decide: our grammar is `EXPLORE → meaningful guide moment →
accompanied → handoff → alone`, and the roadmap explicitly records that permanent guide presence
is not assumed to be better. Worth revisiting with evidence, not by imitation.

The footprint experiment is authorized but not useful yet. In the reference the trace matters
because the character walks the length of a nave. Our guide currently appears at an anchor and
steps aside by under a metre. A trail behind a figure that has barely moved would be decoration,
which the roadmap says to remove. Deferred to when the guide actually walks — which is Pass 2.
