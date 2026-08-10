# Immersive Worlds — Architecture Index

> **Purpose:** canonical entry point for humans and implementation agents working on Immersive Worlds.
> **Rule:** do not implement from memory or from a chat summary when these documents are available.

## Read before implementation

Read these documents before making architectural or implementation decisions:

1. `../IMMERSIVE_WORLDS_MODULE_CONTEXT.md` — global Escaparates Pro / Immersive Worlds context and protected-baseline rules.
2. `CONSTITUTION.md` — product boundaries, invariants, subsystem contracts, scope and quality gates.
3. `DECISION_LOG.md` — explicit Product Owner decisions, proposed/approved ADRs and unresolved decisions.
4. `REFERENCE_LEDGER.md` — which repositories/references are authoritative for each subsystem and their conflict/licensing constraints.
5. `REFERENCE_REUSE_ACCELERATION_POLICY.md` — **mandatory operating doctrine for ambitious, efficient and legal reuse/adaptation of the repository library.**
6. `MUSEUM_INSTITUTIONAL_EXPERIENCE_QUALITY_BAR.md` — **mandatory creative/experiential quality doctrine for Museum / Institutional work: The Experience Is The Interface, Experience Language, authored Focus, spatial composition, content-first quality tests and quality gates.**
7. `SCULPTING_AND_GRAFTING_METHOD.md` — **mandatory current working method for Museum / Institutional: preserve capability, sculpt away prototype/generic/noisy representation, graft stronger legal capabilities when a demonstrated gap exists, and stop at visual evidence checkpoints.**
8. `GLOSSARY.md` — canonical semantic vocabulary.
9. `IW-1_IMPLEMENTATION_RECORD.md` and later implementation records, when present on the working branch — actual implementation decisions and evidence.

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

Read both `MUSEUM_INSTITUTIONAL_EXPERIENCE_QUALITY_BAR.md` and `SCULPTING_AND_GRAFTING_METHOD.md` before any new Museum quality phase.

## Current Museum working method

Museum / Institutional now follows **SCULPT + GRAFT** rather than a default feature roadmap.

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

Do not accept a graft that introduces a second competing state, ownership, camera, Focus or navigation model.

Do not automatically promote a capability from Museum or Place into shared core merely because it appears reusable; prove genuine cross-vertical value or domain independence first.

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

Juanma visual review is required before declaring a major Sculpt Pass approved, and especially when changing Focus, primary spatial composition, major UI layers, lighting/material direction, Experience Language, or a major visual graft.

## Authority order

```text
1. JUANMA — explicit current product decision
2. APPROVED IW ARCHITECTURE / ADR
3. VERIFIED CURRENT CODE / BRANCH
4. PROPOSED IW DOCUMENTS
5. REFERENCE IMPLEMENTATION
6. CHAT / AGENT HYPOTHESIS
```

Within the reference layer:

```text
APPROVED IW CONTRACT
↓
PRIMARY REFERENCE
↓
SECONDARY REFERENCES
```

## Protected baseline

Immersive Worlds remains additive and isolated until explicit integration approval.

Do not modify, delete or opportunistically refactor existing Escaparates Pro modules, Boards or Casebook to simplify IW implementation.

## Merge gate

No implementation agent may interpret successful local execution, QA, a commit, screenshots, a preview or a PR as authorization to merge.

Merge/integration requires Juanma's explicit approval after review.
