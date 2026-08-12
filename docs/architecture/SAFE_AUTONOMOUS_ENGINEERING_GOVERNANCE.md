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

## Autonomous continuation

An internal checkpoint is not a human gate.

If a mandate explicitly authorizes subsequent work, agents continue automatically after the checkpoint.

Required end status for long-run mandates:

- `MANDATE_COMPLETE`;
- `MANDATE_PARTIAL`;
- `MANDATE_BLOCKED`;
- `MANDATE_ABORTED`.

This prevents a successful subphase from being mistaken for completion of the full mandate.

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
