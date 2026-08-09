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
6. `MUSEUM_INSTITUTIONAL_EXPERIENCE_QUALITY_BAR.md` — **mandatory creative/experiential quality doctrine for Museum / Institutional work: The Experience Is The Interface, Experience Language, authored Focus, spatial composition, content-first quality tests and the IW-2 Museum Quality & Foundation Validation Gate.**
7. `GLOSSARY.md` — canonical semantic vocabulary.
8. `IW-1_IMPLEMENTATION_RECORD.md` and later implementation records, when present on the working branch — actual implementation decisions and evidence.

## Operating principle

The reference repositories are not merely inspiration. They are an engineering acceleration library.

Before implementing a meaningful subsystem:

```text
UNDERSTAND THE PROBLEM
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
- unlicensed/unclear code must not be copied directly;
- IW contracts remain sovereign over implementation convenience;
- references solve problems; they must not become reference soup.

## Museum / Institutional quality doctrine

For Museum / Institutional, technical correctness is necessary but insufficient.

The governing product direction is:

> **The visitor should not feel that they are using a 3D application. They should feel that they have entered an exhibition.**

IW-1 proves that the system can be built. Museum / Institutional quality work must prove that the system can disappear behind a coherent authored experience.

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

Read `MUSEUM_INSTITUTIONAL_EXPERIENCE_QUALITY_BAR.md` before any Museum quality pass or IW-2 work.

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

No implementation agent may interpret successful local execution, QA, a commit, or a PR as authorization to merge.

Merge/integration requires Juanma's explicit approval after review.
