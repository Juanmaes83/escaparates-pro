# Immersive Worlds — Architecture Index

> **Purpose:** canonical entry point for humans and implementation agents working on Immersive Worlds.
> **Rule:** do not implement from memory or from a chat summary when these documents are available.
> **Current-state rule:** when implementation has advanced, `CURRENT_MUSEUM_STATE_2026-08-10.md` and the active roadmap override stale sequencing in older working notes, subject to Juanma's explicit decisions and approved architecture.

## Read before implementation

Read these documents before making architectural or implementation decisions:

1. `../IMMERSIVE_WORLDS_MODULE_CONTEXT.md` — global Escaparates Pro / Immersive Worlds context and protected-baseline rules.
2. `CURRENT_MUSEUM_STATE_2026-08-10.md` — **current Museum baseline, active grafts, latest execution order and project-isolation rule. Read this first for current work.**
3. `CONSTITUTION.md` — product boundaries, invariants, subsystem contracts, scope and quality gates.
4. `DECISION_LOG.md` — explicit Product Owner decisions, proposed/approved ADRs and unresolved decisions.
5. `MUSEUM_EXPERIENCE_GRAFTS.md` — **Projection + Live Portal + Flexible Media graft programme, reuse boundaries and authoring discoveries.**
6. `LIVE_TWO_WORLD_PORTAL_TRANSITION_REFERENCE.md` — **preserved two-world/RenderTarget/frameCorners transition mechanics and Museum integration intent. Mandatory before the Live Portal pass.**
7. `REFERENCE_LEDGER.md` — which repositories/references are authoritative for each subsystem and their conflict/licensing constraints.
8. `REFERENCE_REUSE_ACCELERATION_POLICY.md` — **mandatory operating doctrine for ambitious, efficient and legal reuse/adaptation of the repository library.**
9. `REFERENCE_REUSE_REGISTER.md` — exact inspected/reused source mechanisms and provenance.
10. `MUSEUM_INSTITUTIONAL_EXPERIENCE_QUALITY_BAR.md` — creative/experiential quality doctrine for Museum / Institutional work.
11. `SCULPTING_AND_GRAFTING_METHOD.md` — current working method: preserve capability, sculpt weak representation, graft stronger legal capability, then look/compare/decide.
12. `NEXT_PASSES_MUSEUM_ROADMAP.md` — **current Product Owner-gated execution order. Do not rely on historical pass numbers from older chat/context.**
13. `GLOSSARY.md` — canonical semantic vocabulary.
14. `IW-1_IMPLEMENTATION_RECORD.md`, `IW-2_IMPLEMENTATION_RECORD.md` and later implementation records — historical implementation decisions and evidence.

## Current Museum snapshot

The current Museum baseline has already progressed beyond the original early-pass roadmap.

Validated prior to the active Projection graft:

```text
GUIDE HANDOFF
→ GUIDE LOCOMOTION
→ AUTHORED JOURNEY
→ PORTAL CONTINUITY
→ REAL-TIME TIMING FIX
→ VISUAL AUDIT
→ 3/3 ARTWORK CYCLES
→ CANONICAL QA 46/46, EXIT 0
```

Current material programme:

```text
GRAFT 01 — PROJECTION EXPERIENCE
→ JUANMA + CHATGPT REVIEW

GRAFT 02 — LIVE TWO-WORLD PORTAL TRANSITION
→ REVIEW

GRAFT 03 — FLEXIBLE MEDIA / KINETIC TEXTILE
→ REVIEW

AUTHORING EXTRACTION
→ derive shared controls from proven experiences
```

See `CURRENT_MUSEUM_STATE_2026-08-10.md` for authoritative working detail.

## Operating principle

The reference repositories are not merely inspiration. They are an engineering acceleration library.

Before implementing a meaningful subsystem or graft:

```text
UNDERSTAND THE PROBLEM
→ DEMONSTRATE THE CAPABILITY GAP
→ SEARCH THE REFERENCE LEDGER / REPOSITORIES
→ FIND THE STRONGEST EXISTING SOLUTION
→ CHECK RIGHTS + IW CONTRACT FIT
→ REUSE / PORT / ADAPT / COMPOSE WHEN IT IS THE STRONGER PATH
→ TEST
→ RECORD PROVENANCE
```

Default principle:

> **REUSE BEFORE REINVENTION, WHEN LEGAL AND ARCHITECTURALLY SOUND.**

Do not be timid merely because code originated in a reference repository. If the relevant source is legally reusable, materially better and compatible with IW contracts, using/adapting it is preferred over recreating a weaker version from scratch.

At the same time:

- repository license does not automatically grant rights to bundled assets;
- a user-owned fork does not erase upstream ownership or licensing;
- `NO LICENSE FOUND` does **not** mean `INCOMPATIBLE`, but direct reuse remains pending verification until primary licensing evidence or permission exists;
- unlicensed/unclear code must not be copied directly;
- clean reimplementation must derive requirements/behaviour and produce an IW-native solution rather than mechanically reproducing protected source expression;
- IW contracts remain sovereign over implementation convenience;
- references solve demonstrated problems; they must not become reference soup.

## Museum / Institutional quality doctrine

For Museum / Institutional, technical correctness is necessary but insufficient.

The governing product direction is:

> **The visitor should not feel that they are using a 3D application. They should feel that they have entered an exhibition.**

The existing foundation proves that the system can be built. Museum / Institutional quality work must prove that the system can disappear behind a coherent authored experience.

The Museum Scene Kit must therefore be evaluated not only on geometry or renderer quality, but on:

- art direction;
- spatial composition;
- visual rhythm;
- content hierarchy;
- authored Focus;
- signage and navigation language;
- sound;
- presence;
- institutional coherence;
- the ability for the same semantics to support genuinely different Experience Languages.

For the current experimental spatial grafts, Juanma has additionally clarified the desired direction as:

```text
SPECTACULAR
+ COHERENT
+ CONTROLLED
```

This does not authorize incoherent effect spam; it means spectacle should not be removed merely to satisfy a default minimalist aesthetic when it materially strengthens transition, spatial narrative or visitor experience.

## Current Museum working method

Museum / Institutional follows **SCULPT + GRAFT** rather than a default feature roadmap.

Ask first:

> **WHAT IS THE BIGGEST GAP BETWEEN THE CURRENT EXPERIENCE AND THE TARGET EXPERIENCE?**

Then:

```text
CAN WE SCULPT IT?
↓
IF NOT:
WHAT CAPABILITY MUST BE GRAFTED?
```

The method is:

```text
SCULPT
+
GRAFT
+
LOOK
+
COMPARE
+
DECIDE
```

Do not remove a current representation until its underlying capability has another valid home or a verified reason to disappear.

Do not accept a graft that introduces a second competing state, ownership, authoritative visitor camera, Focus or navigation model.

A temporary offscreen/transition camera is not automatically a competing camera authority. The invariant is exactly one authoritative **visitor-camera controller** per frame; optical/render cameras may exist when explicitly bounded to rendering/transition roles.

Do not automatically promote a capability from Museum or Place into shared core merely because it appears reusable; prove genuine cross-vertical value or domain independence first.

## Mandatory Product Owner pass gate

For the Museum next-pass sequence, `NEXT_PASSES_MUSEUM_ROADMAP.md` is mandatory.

The implementation agent must execute **one material pass at a time**. Every pass must end in:

```text
QA
→ SAVED DETERMINISTIC EVIDENCE
→ BEFORE / AFTER
→ NAVIGABLE PREVIEW URL
→ STOP
→ JUANMA + CHATGPT REVIEW
```

Only Juanma's **explicit approval** authorizes the next pass. A successful test suite, commit, PR, preview, critic result or implementation-agent recommendation is not approval.

For guide, camera handoff, locomotion, spatial-anchor behaviour, artwork approach, Focus/return or Portal-transition work, Claude/Fable must inspect the actual stored reference recordings:

- `immersive-worlds-module/145be553-0736-4df6-b639-7f584f392a83.webm`
- `immersive-worlds-module/video_2026-08-09_10-44-43.webm`

For Live Two-World Portal work, `LIVE_TWO_WORLD_PORTAL_TRANSITION_REFERENCE.md` is also mandatory.

If direct video playback is unavailable in the execution environment, derive and inspect keyframes rather than ignoring the references.

## Mandatory visual supervision for every material phase

Every perceptually significant Sculpt/Graft phase must end in a state Juanma can actually inspect.

Required evidence:

1. **navigable preview / local URL**;
2. exact route or query needed to reach the changed state;
3. deterministic screenshot(s) saved in the project evidence structure;
4. **BEFORE / AFTER** captures for material visual changes;
5. browser QA / console state;
6. relevant performance and regression evidence;
7. concise explanation of what was sculpted, what capability was preserved, what was grafted and what remains open.

Screenshots are evidence but are **not a substitute** for a navigable preview.

A preview is **not approval**.

Saved visual evidence must preserve enough history to compare material changes rather than merely overwriting the only prior capture.

Juanma visual review is required before declaring a major Sculpt/Graft Pass approved.

## Authority order

```text
1. JUANMA — explicit current product decision
2. APPROVED IW ARCHITECTURE / ADR
3. VERIFIED CURRENT CODE / BRANCH
4. CURRENT WORKING-STATE DOCUMENTS
5. OTHER PROPOSED IW DOCUMENTS
6. REFERENCE IMPLEMENTATION
7. CHAT / AGENT HYPOTHESIS
```

Within the reference layer:

```text
APPROVED IW CONTRACT
↓
PRIMARY REFERENCE
↓
SECONDARY REFERENCES
```

## Project isolation

This work belongs to Escaparates Pro / Immersive Worlds / Museum and explicitly authorized source repositories.

Unrelated projects — specifically including Sarah Katerina — must not be used as context, read for implementation guidance, imported, modified or included in commits.

If unrelated workspace/search/artifact material appears, ignore it.

## Protected baseline

Immersive Worlds remains additive and isolated until explicit integration approval.

Do not modify, delete or opportunistically refactor existing Escaparates Pro modules, Boards or Casebook to simplify IW implementation.

## Merge gate

No implementation agent may interpret successful local execution, QA, a commit, screenshots, a preview or a PR as authorization to merge.

Merge/integration requires Juanma's explicit approval after review.
