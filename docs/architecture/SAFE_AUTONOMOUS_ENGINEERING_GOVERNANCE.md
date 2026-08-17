# SAFE AUTONOMOUS ENGINEERING — ESCAPARATES PRO GOVERNANCE

## Status

Repository-wide governance document for Escaparates Pro.

Canonical skill:

`/.claude/skills/safe-autonomous-engineering/SKILL.md`

Repository entry points:

- `/AGENTS.md` — all AI agents;
- `/CLAUDE.md` — Claude Code;
- this document — architecture/governance explanation.

## Decision

Safe Autonomous Engineering is **global to Escaparates Pro**. It is not a Museum-only skill.

The skill defines **HOW agents work**. Individual projects/modules define **WHAT they build**.

```text
ESCAPARATES PRO
│
├── GLOBAL EXECUTION GOVERNANCE
│   └── SAFE AUTONOMOUS ENGINEERING
│
├── MODULE-SPECIFIC CONTRACTS
│   ├── Immersive Worlds / Museum
│   ├── Boards
│   ├── RUBIK
│   ├── Casebooks
│   ├── Projection / Video Mapping
│   ├── Banderolas
│   └── future modules
│
└── CURRENT MANDATES
```

## Inheritance model

Every module inherits the global skill.

Module-level instructions may define:

- product objective;
- protected baseline;
- local architecture;
- local QA;
- visual gates;
- module-specific stop conditions;
- local source/reuse contracts;
- roadmap and current mandate.

They should **not reproduce the full Safe Autonomous Engineering skill**.

The intended pattern is:

```text
GLOBAL SKILL
    ↓
MODULE CONTRACT
    ↓
CURRENT MANDATE
```

This avoids documentation drift and prevents two copies of the same safety rules from diverging.

## Museum / Immersive Worlds

Museum inherits the repository-wide skill from its canonical location.

Do not create a second complete `SAFE_AUTONOMOUS_ENGINEERING` skill under Museum.

Museum-specific documentation should continue to contain only Museum/Immersive Worlds product contracts, baselines, transition language, scene-kit architecture, roadmap, QA and local lessons.

When Claude resumes Museum, it must read the repository-level skill first and then the Museum-specific canonical documents/current mandate. The global skill must not be copied into the Museum directory.

## Repository safety model

Agents may autonomously:

- clone repositories;
- create worktrees;
- create isolated branches;
- create disposable local copies;
- inspect donor repositories;
- experiment inside isolated clones;
- copy/adapt authorized first-party capabilities.

Agents may not:

- modify canonical donor repositories directly;
- experiment on stable/canonical branches;
- merge into stable;
- promote a branch to canonical;
- delete or replace canonical sources;
- perform destructive consolidation without explicit Juanma approval.

Canonical rule:

```text
CLONE TO LEARN.
CLONE TO EXPERIMENT.
NEVER EXPERIMENT IN THE SOURCE OF TRUTH.
THE ORIGINAL IS A SOURCE, NOT A SANDBOX.
```

## Human authority

Juanma remains final authority for:

- merge;
- canonical promotion;
- destructive consolidation;
- product approval;
- visual approval;
- protected-baseline changes.

Technical closure does not imply product approval.

Passing new work never grants an agent authority to rewrite a protected baseline.

## Autonomous continuation

An internal checkpoint is not a human gate.

If a mandate explicitly authorizes subsequent work, agents continue automatically after the checkpoint.

Required end status for long-run mandates:

- `MANDATE_COMPLETE`;
- `MANDATE_PARTIAL`;
- `MANDATE_BLOCKED`;
- `MANDATE_ABORTED`.

This prevents a successful subphase from being mistaken for completion of the full mandate.

## Incremental validation and evidence preservation

Safe Autonomous Engineering is intentionally rigorous, but it must not become ritualistically repetitive.

Canonical repository-wide policy:

```text
PRESERVE VERIFIED EVIDENCE.
RESUME FROM THE LAST TRUSTWORTHY CHECKPOINT.
A FAILURE INVALIDATES ONLY WHAT IT CAN REASONABLY AFFECT.
VALIDATION SCOPE SHOULD MATCH CHANGE IMPACT SCOPE.
```

A late local failure does not automatically invalidate every earlier successful step.

Agents classify changes by impact:

```text
LOCAL FIX
→ local + direct-dependency validation

SHARED-MECHANISM FIX
→ affected families/dependents + representative hard cases

CORE / BASELINE / CANONICAL-CONTRACT FIX
→ broad appropriate revalidation
```

### Contextual backtrack / validation runway

`RESUME FROM THE LAST TRUSTWORTHY CHECKPOINT` does **not** mean restarting at the exact failed step with no context.

For sequence-dependent systems, the agent must normally re-enter through a bounded window of already-verified predecessor states so the corrected point is exercised with its real preconditions and immediate lead-in.

Canonical rule:

```text
DO NOT RESTART FROM ZERO.
DO NOT RESUME BLINDLY AT THE FAILURE POINT.
RE-ENTER THROUGH A BOUNDED TRUSTED CONTEXT WINDOW.
```

Example:

```text
01–08 verified
09 fails

wrong extremes:
01 → ... → 09     unnecessary full replay
09 only           insufficient context when state-dependent

preferred:
preserve 01–08 as verified evidence
→ fix 09
→ replay a few meaningful predecessor moments, e.g. 05/06 → 07 → 08 → 09
→ verify the fix and immediate handoff
→ continue
```

The replayed predecessor states are a **validation runway**, not invalidated evidence.

`2–4` meaningful predecessor moments is a useful default for sequential flows, but it is not a rigid number. The agent chooses the smallest window that reconstructs the relevant state, preconditions and interaction boundary. Stateless isolated fixes may be validated directly; shared/core changes require a broader runway according to impact.

This rule applies to QA stages, guided sequences, camera transitions, runtime lifecycle, import/export pipelines, authoring workflows, builds/deploys and other multi-step processes.

```text
EVIDENCE PRESERVATION ≠ ZERO-CONTEXT RESUME
TARGETED REVALIDATION ≠ VALIDATE ONLY THE FAILED LINE
```

At a human gate, closure means **full appropriate validation of the affected product contracts**, not blindly rerunning every test or every step from zero.

Still-valid evidence may be retained when its dependencies and protected contract are unchanged and provenance is known.

A fresh end-to-end rerun is required when the mandate explicitly requires it, impact cannot be bounded, a shared/core change can affect most prior evidence, provenance is ambiguous, the environment/baseline changed materially, or important cross-component interactions remain untested.

```text
RIGOUR DOES NOT MEAN REPETITION.
RIGOUR MEANS VALIDATING THE RIGHT THINGS
AFTER THE RIGHT CHANGES.
```

## Learning objective

The global skill is intended to improve the entire Escaparates Pro system over time.

A significant lesson discovered in one module may be promoted from:

```text
PROJECT-SPECIFIC
→ SYSTEM-LEVEL
→ GENERAL ENGINEERING
```

when evidence justifies it.

The purpose is to avoid repeatedly paying the cost of the same failure across different modules.

## Canonical-copy rule

There must be one full canonical copy of Safe Autonomous Engineering in Escaparates Pro:

`/.claude/skills/safe-autonomous-engineering/SKILL.md`

Other documents reference it.

**Do not duplicate it inside Museum or another module.**