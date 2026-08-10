# IW-3 — Guided Journey + Material Graft Checkpoint

> **Status:** IMPLEMENTATION RECORD / CURRENT CHECKPOINT
> **Date:** 2026-08-10
> **Purpose:** close the documentation gap between IW-2 and the current Museum state.

## 1. Scope covered by this record

IW-3 is used here as the continuity record for the work that happened after IW-2 and before the next major source grafts are reviewed.

It covers:

- Guide handoff refinement;
- real Guide locomotion;
- authored journey sequencing;
- portal continuity between Gallery A and Gallery B;
- real-time timing defect discovery and correction;
- visual audit methodology correction;
- canonical QA closure;
- transition into the source-graft programme;
- GRAFT 01 Projection checkpoint.

It does **not** imply merge approval or completion of all future Museum work.

## 2. Guided journey outcome

The Guide evolved from static/checkpoint presence into a real authored visit.

Core repeated grammar:

```text
GUIDE LEADS
→ VISITOR FOLLOWS
→ ARRIVAL
→ SHARED ATTENTION / OVER-SHOULDER
→ GUIDE YIELDS
→ ARTWORK BECOMES PROTAGONIST
→ RETURN
→ CONTINUE TO NEXT WORK
```

The working proof reached three complete artwork cycles.

Important product rule that survived:

> **The Guide does not own the camera.**

The Guide provides scale, presence, orientation and narrative accompaniment.
Camera authority remains explicit through the existing Museum camera system.

## 3. Real-time visual audit correction

A major lesson from IW-3 was that deterministic QA alone was insufficient to certify the experience.

The earlier suite used reduced-motion/manual-time conditions that masked real-time defects.

A full visual audit of the actual guided journey exposed:

- journey durations stretching badly under slow software rendering;
- Guide still walking during shots that expected settled presence;
- narration and framing falling out of sync;
- Guide occluding artwork during yield;
- checkpoint stepping replaying intermediate beats rather than seeking directly.

The most important root cause was narrative time being clamped too aggressively under slow frames.

This changed the QA doctrine:

```text
TECHNICAL QA GREEN
≠
EXPERIENCE VALIDATED
```

Material experience passes require real navigable observation and saved visual evidence.

## 4. Timing / Guide synchronization correction

The real-time correction introduced a more tolerant clock delta and a resume path after tab visibility changes.

Experience Director lead steps were also prevented from advancing before the Guide had actually settled, within a bounded wait.

The conceptual outcome matters more than the implementation detail:

```text
AUTHORED DURATION
= minimum experience intent

GUIDE SETTLED STATE
= required visual condition for selected lead beats
```

This closed the primary visible mismatch between semantic route state and what the visitor actually saw.

## 5. Canonical QA closure

After the product fix, the canonical suite initially died late in the run because multiple live WebGL contexts overlapped under SwiftShader.

The second world itself booted successfully in isolation, which identified the problem as runner/environment ownership rather than product regression.

The runner was corrected by closing the mobile page before the second-world stage.

Final result:

```text
46 / 46 PASS
EXIT 0
```

Important lesson:

> **WebGL context ownership and test-runner lifecycle are product-quality concerns in a multi-scene spatial system.**

## 6. Published preview discipline

The prior persistent artifact was discovered to contain an older pre-fix build.

Rather than force-overwrite an uncertain artifact baseline, a distinct preview was published for the validated build.

This reinforced the evidence rule:

```text
PREVIEW URL
must correspond to
THE BUILD ACTUALLY REVIEWED
```

## 7. Transition into source-graft programme

After Guided closure, the working method shifted from mainly sculpting existing Museum representation to selective source-technology grafting.

The approved doctrine is:

```text
WORKING MUSEUM
→ IDENTIFY WEAK REPRESENTATION
→ FIND REAL CAPABILITY GAP
→ INSPECT AUTHORIZED SOURCE
→ REUSE / PORT / ADAPT
→ GRAFT INTO IW CONTRACTS
→ VISUAL REVIEW
```

Do not clone another museum or restart the Scene Kit.

## 8. GRAFT 01 — Projection checkpoint

Source:

`Juanmaes83/projection-video-mapping-experience`

Source audit found that the repository is not a generic 4-corner homography engine. Its actual value is its compositing / playback / authoring vocabulary.

Current implementation branch has introduced Projection as a first-class semantic kind:

```text
ENTITY_KIND.PROJECTION
```

Gallery B is the chosen target because it was already the dark-exhibition room and already contained the weakest conventional video-screen representation.

Current product transformation:

```text
BEZELLED VIDEO SCREEN
→ PROJECTED LIGHT ON ARCHITECTURE
```

The current implementation checkpoint includes:

- projection dimensions from entity data;
- projection parameters from content data;
- normal media-loading path;
- no physical panel/bezel representation;
- additive/light-field treatment;
- spill / halo;
- real room light contribution;
- floor bounce/reflection;
- optional projected text;
- time-based Guided dwell.

The current GRAFT 01 implementation must still receive Juanma + ChatGPT visual sign-off before it is considered approved.

## 9. New next-step discoveries

Two additional source-driven capabilities are now explicitly part of the Museum programme.

### Live Two-World Portal Transition

Purpose:

```text
SPACE A
→ LIVE PERSPECTIVE-CORRECT VIEW OF SPACE B
→ SPECTACULAR CROSSING
→ SPACE B ACTIVE
```

This should improve the transition between rooms, particularly Gallery A → Gallery B after Projection is approved.

Read:

`LIVE_TWO_WORLD_PORTAL_TRANSITION_REFERENCE.md`

### Flexible Media / Kinetic Textile

Source:

`Juanmaes83/BANDEROLAS-DINAMICAS`

Purpose:

```text
MEDIA
→ DEFORMABLE SURFACE
→ PHYSICS
→ KINETIC / INTERACTIVE MUSEUM WORK
```

The source contains a real portable solver and author-input-to-texture path.

Read:

`MUSEUM_EXPERIENCE_GRAFTS.md`

## 10. Current architecture invariants

Still non-negotiable:

```text
SEMANTIC DATA ≠ VISUAL REPRESENTATION
ONE SEMANTIC OBJECT → ONE CANONICAL RECORD → MULTIPLE REFERENCES
WORLD ≠ CAMERA
EXPLORE + GUIDED SHARE ONE WORLD STATE
HOTSPOT ≠ PORTAL
PORTAL BEHAVIOUR ≠ PORTAL REPRESENTATION
ANCHOR = WHERE
ACTION = WHAT
SCENE KIT OWNS VISUAL REALIZATION
```

Camera clarification after the Live Portal discovery:

```text
ONE AUTHORITATIVE VISITOR-CAMERA CONTROLLER PER FRAME
```

A temporary secondary camera is allowed when it is only an offscreen/render/transition instrument and does not independently control visitor navigation.

## 11. Current quality direction

The current experimental graft phase should optimize for:

```text
SPECTACULAR
+ COHERENT
+ CONTROLLED
```

rather than automatically stripping spectacle in the name of minimalism.

The technology should still serve the spatial experience, not become disconnected effect spam.

## 12. Current continuation gate

```text
GRAFT 01 PROJECTION
→ VISUAL REVIEW
→ EXPLICIT JUANMA APPROVAL
→ GRAFT 02 LIVE TWO-WORLD PORTAL
→ REVIEW
→ GRAFT 03 FLEXIBLE MEDIA
```

No automatic progression and no merge to `master` are authorized by this record.
