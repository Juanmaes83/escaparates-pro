# ESCAPARATES PRO — GLOBAL AI AGENT GOVERNANCE

This file applies to **every AI agent** working anywhere in this repository, including Claude Code, Codex and comparable implementation agents.

## Mandatory first read

Before planning, editing, coding, testing, refactoring, reusing donor code, running a long autonomous task, or changing any project/module in this repository, read and follow:

`/.claude/skills/safe-autonomous-engineering/SKILL.md`

That skill is the **global execution and safety contract for Escaparates Pro**.

## Scope

The global skill applies across the entire repository, including but not limited to:

- Immersive Worlds / Museum;
- Boards;
- RUBIK;
- Casebooks;
- projection / video mapping;
- Banderolas;
- authoring systems;
- future showrooms, real-estate, fashion, institutional, education and brand-experience modules;
- shared infrastructure, tooling, QA, automation and documentation.

## Inheritance rule

Module-specific instructions may add stricter constraints or product-specific contracts, but they **inherit** the global Safe Autonomous Engineering skill.

A module must **not duplicate the full global skill**. It should reference the canonical global skill and document only its local additions, exceptions, baselines, gates and product contracts.

```text
GLOBAL SAFE AUTONOMOUS ENGINEERING
        ↓ inherited by
MODULE / PROJECT INSTRUCTIONS
        ↓
CURRENT MANDATE
```

If instructions conflict, apply the safer rule and stop for a human decision when the conflict affects product intent, protected baselines, destructive actions, merge/promotion, or canonical truth.

## Non-negotiable repository rules

- Clone to learn. Clone to experiment. Never experiment in the source of truth.
- The original is a source, not a sandbox.
- Canonical donor repositories and stable/canonical branches are not experimental workspaces.
- Long-run / unattended work is additive by contract.
- Work locally and in isolated workspaces/branches before remote promotion.
- Failure blast radius should approach new work only.
- Never delete, replace or destructively consolidate unrelated/canonical work without explicit authorization.
- Never merge or promote to stable/canonical without explicit Juanma approval.
- Internal checkpoint ≠ human gate.
- Continue automatically through already-authorized internal checkpoints.
- Claims require evidence.
- Technical closure ≠ product approval.
- Significant failures must create reusable learning when justified.
- Never solve the same failure from zero twice.

## Merge authority

**Juanma is the final merge and canonical-promotion authority.**

Agents may prepare branches, commits, diffs, PRs, QA, evidence, conflict analysis and merge-readiness reports. They may not merge or promote without explicit approval.

## Canonical location

There is **one canonical global copy** of the skill:

`/.claude/skills/safe-autonomous-engineering/SKILL.md`

Do not create a second full copy inside Museum or any other module. Reference this file instead.
