# Immersive Worlds — Museum / Institutional
# NEXT PASSES ROADMAP — PRODUCT OWNER GATED

> **Status:** ACTIVE NEXT-STEPS PLAN — UPDATED 2026-08-10  
> **Working implementation branch:** `claude/immersive-worlds-module-c0d3f7`  
> **Documentation branch:** `docs/immersive-worlds-current-state-2026-08-10`  
> **Method:** `SCULPT + GRAFT + LOOK + COMPARE + DECIDE`  
> **Critical rule:** **ONE MATERIAL PASS AT A TIME. EVERY PASS ENDS IN STOP. JUANMA + CHATGPT REVIEW THE NAVIGABLE RESULT. ONLY EXPLICIT APPROVAL AUTHORIZES THE NEXT PASS.**

## 0. Why this roadmap changed

The previous roadmap was overtaken by implementation progress.

Since it was written, the Museum has advanced through Guide handoff, Guide locomotion, authored journey, portal continuity, real-time timing fixes, full visual audit, 3/3 artwork cycles and canonical 46/46 QA. GRAFT 01 Projection is now in implementation.

This document supersedes the old linear Pass 1–6 ordering as the **current execution plan**.

Historical intent remains useful, but agents must not execute the old pass numbers as if the project were still at that state.

Read first:

- `CURRENT_MUSEUM_STATE_2026-08-10.md`
- `MUSEUM_EXPERIENCE_GRAFTS.md`
- `LIVE_TWO_WORLD_PORTAL_TRANSITION_REFERENCE.md`
- `DECISION_LOG.md`
- `REFERENCE_REUSE_REGISTER.md`

## 1. Mandatory pass gate

```text
PASS / GRAFT N
→ IMPLEMENT ONLY THAT MATERIAL CHANGE
→ RUN IT
→ VISUAL QA
→ TECHNICAL QA
→ SAVE DETERMINISTIC EVIDENCE
→ SAVE BEFORE / AFTER
→ PROVIDE NAVIGABLE PREVIEW
→ STOP
→ JUANMA + CHATGPT REVIEW
→ EXPLICIT APPROVAL?
   NO  → REVISE SAME PASS
   YES → NEXT PASS MAY START
```

A green QA suite, commit, preview, PR, critic score or agent recommendation is **not** approval.

For every material pass, Claude/Fable must deliver before STOP:

1. branch, base SHA and HEAD SHA;
2. exact files changed;
3. confirmation that `master`, Boards, Casebook and unrelated protected modules remain untouched;
4. QA/regression results;
5. deterministic evidence preserved without destroying prior baselines;
6. BEFORE / AFTER for material visual changes;
7. exact navigable preview URL and exact state/route to inspect;
8. concise `SCULPTED / PRESERVED / GRAFTED / OPEN` report.

Screenshots are evidence but never replace the navigable preview.

## 2. Mandatory behavioural references

The two stored Museum navigation recordings remain mandatory study material before Guide/camera/Portal work:

- `immersive-worlds-module/145be553-0736-4df6-b639-7f584f392a83.webm`
- `immersive-worlds-module/video_2026-08-09_10-44-43.webm`

For the Live Two-World Portal pass, also read:

- `LIVE_TWO_WORLD_PORTAL_TRANSITION_REFERENCE.md`

## 3. CURRENT — GRAFT 01: PROJECTION EXPERIENCE

### Status

**IMPLEMENTATION IN PROGRESS / AWAITING VISUAL SIGN-OFF.**

### Goal

Transform Gallery B from a dark room containing a conventional video-screen representation into a dark exhibition where audiovisual content becomes projected light, wall and time.

```text
VIDEO ON A WALL
→ LIGHT IN ARCHITECTURE
```

### Product constraints

- Projection is a first-class Entity kind, not a one-off effect.
- No physical screen/bezel/panel for the Projection representation.
- Gallery B remains dark-exhibition.
- Guide introduces, shares attention and yields.
- Time-based work receives meaningful dwell.
- Configurable media is proven.
- No second WebGL context.
- No competing visitor camera/state/route model.

### Gate

Do not begin GRAFT 02 until Juanma + ChatGPT visually review GRAFT 01 and Juanma explicitly approves continuation.

---

## 4. NEXT — GRAFT 02: LIVE TWO-WORLD PORTAL TRANSITION

> **DO NOT START UNTIL GRAFT 01 IS EXPLICITLY APPROVED.**

### Goal

Turn a selected Museum Portal transition into a spectacular, perspective-correct crossing between two complete Spaces / Worlds.

Preferred first proof:

```text
GALLERY A
→ AUTHORED TRANSITION POINT
→ LIVE VIEW OF GALLERY B
→ TEMPORARY TRANSITION CAMERA / RENDER TARGET
→ PERSPECTIVE-CORRECT PORTAL
→ SPECTACULAR CROSSING
→ GALLERY B / PROJECTION EXPERIENCE
→ NORMAL CAMERA AUTHORITY RESUMES
```

### Product rationale

The new Projection room gives the destination visual life before crossing. The visitor should be able to glimpse the dark, active destination from Gallery A, creating anticipation and continuity.

### Source reference

`LIVE_TWO_WORLD_PORTAL_TRANSITION_REFERENCE.md`

Core source mechanics include:

```text
ONE RENDERER
+ OFFSCREEN WebGLRenderTarget
+ DESTINATION / TRANSITION CAMERA
+ CameraUtils.frameCorners
+ PORTAL CORNERS IN WORLD SPACE
+ TWO-WORLD TRANSITION CHOREOGRAPHY
```

### Camera rule

A temporary secondary camera is allowed as an offscreen transition/render instrument.

It is **not** a second visitor-navigation authority.

Exactly one authoritative visitor camera controller remains true.

### Authored points

Reuse `Anchor = WHERE` rather than creating a second point system.

Potential authored intentions:

- transition entry;
- Guide staging;
- visitor staging;
- portal viewpoint;
- destination target/view;
- destination arrival;
- Guide destination.

### Quality direction

For this pass the desired quality is:

```text
SPECTACULAR
+ COHERENT
+ CONTROLLED
```

Do not automatically strip the source membrane/shader merely for minimalism. Test whether spectacle strengthens the transition.

### Gate

STOP after navigable visual proof, technical QA and BEFORE/AFTER.

---

## 5. GRAFT 03: FLEXIBLE MEDIA / KINETIC TEXTILE

> **DO NOT START UNTIL GRAFT 02 IS EXPLICITLY APPROVED.**

### Source

`Juanmaes83/BANDEROLAS-DINAMICAS`

Juanma has explicitly authorized direct reuse/adaptation of his source.

### Goal

Turn authored media into a deformable, moving, interactive surface inside the Museum.

```text
IMAGE / VIDEO / TEXT
→ TEXTURE
→ FLEXIBLE SURFACE
→ VERLET PHYSICS
→ WIND / GRAVITY / CONSTRAINTS
→ INTERACTION
→ KINETIC MEDIA EXPERIENCE
```

### Strong reuse candidates

- Verlet solver maths;
- structural/shear/bend constraints;
- canvas → texture authoring path;
- interaction concept.

### Must not import as competing ownership

- independent WebGL renderer/context;
- independent visitor camera;
- independent World State;
- source matrix/camera ownership;
- demo-specific panel/metadata.

### Room decision

`space.archive` is the current strongest low-risk candidate, but is **not locked**. Gallery A west bay remains a spatial fallback. Decide from visual evidence when the pass begins.

### Main risk

Physics cost on mobile / slow devices. Port correct behaviour, measure, then optimize from evidence.

### Gate

STOP for visual/performance review before authoring consolidation.

---

## 6. AUTHORING EXTRACTION

> **ONLY AFTER REAL EXPERIENCES ABOVE HAVE BEEN REVIEWED.**

### Goal

Extract common author controls from proven Artwork / Projection / Flexible Media / Guided needs rather than inventing a generic panel first.

Current likely common controls:

```text
MEDIA SOURCE
MEDIA KIND
PLACEMENT / ANCHOR
SCALE
OPACITY
PLAYBACK
TITLE / METADATA
```

Experience-specific controls remain specific until evidence justifies generalisation.

This is still a thin-authoring stage, not a Unity-like editor.

---

## 7. LATER PRODUCT PASSES — ORDER NOT FROZEN

These remain important but are no longer positioned ahead of the active graft programme:

- World Map / visited / unseen / next route;
- sound / narration;
- institutional credibility / fixtures;
- broader Authoring / personalization panel;
- Experience Languages;
- guided recording / output;
- cross-vertical proof.

Their exact order may be changed by Juanma after reviewing the material grafts.

## 8. Experience Points / Anchors

Semantic point ≠ visible circle.

Reuse Anchor / Viewpoint / Hotspot / Action / Guided contracts.

Possible authored purposes now include:

1. guided stop;
2. listening point;
3. suggested Focus;
4. visitor viewpoint;
5. Guide position;
6. narration activation;
7. transition entry;
8. portal viewpoint;
9. destination arrival;
10. state change.

Do not create a parallel coordinate/point truth model.

## 9. Portal invariant

Preserve:

```text
HOTSPOT = trigger / interaction
PORTAL = spatial connection / transition
ANCHOR = where
ACTION = what happens
```

The Live Two-World capability is a stronger transition representation/choreography, not permission to create another semantic Portal system.

## 10. Project isolation

Only Escaparates Pro / Immersive Worlds / Museum and explicitly authorized source repositories belong to this work.

Unrelated projects, including Sarah Katerina, must not be used as context, imported, modified or included in commits.

## 11. No merge / no automatic progression

This roadmap authorizes isolated work only after each preceding approval.

It does **not** authorize:

- merge to `master`;
- global navigation;
- Boards changes;
- Casebook changes;
- broad shared refactors;
- automatic progression through grafts.

Every material pass ends with:

```text
IMPLEMENT
→ RUN
→ SAVE EVIDENCE
→ GIVE JUANMA THE LINK
→ STOP
→ HUMAN REVIEW
```
