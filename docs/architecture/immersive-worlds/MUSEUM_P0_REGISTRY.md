# Museum — P0 registry

> **Status:** SINGLE SOURCE OF TRUTH for P0 state. Supersedes every P0 status
> statement in older reports.
> **Branch:** `claude/immersive-worlds-module-c0d3f7` · **Master:** UNTOUCHED
> **Product approval:** PENDING

States, and what each one means precisely:

| State | Meaning |
|---|---|
| **CLOSED** | Playbook loop complete **and** a human verdict exists |
| **TECHNICALLY CLOSED / HUMAN QA PENDING** | Everything an agent can produce exists; a human has not looked |
| **OPEN** | Work remains that this branch can do |
| **EXTERNAL BLOCKER** | Cannot proceed without something outside the repository |
| **REGRESSED** | Previously working, now not |

---

# The registry

| # | P0 | State | One-line truth |
|---|---|---|---|
| P0.1 | Visitor authoring — editorial measure | TECHNICALLY CLOSED / HUMAN QA PENDING | Matched responsive evidence exists at four viewports; no human has seen it |
| P0.2 | Persistent assets — real bytes | **EXTERNAL BLOCKER** | No byte has ever been stored or retrieved. Adapter written, deliberately unwired |
| P0.3 | Authoring → VISITA | TECHNICALLY CLOSED / HUMAN QA PENDING | 12/12 fields traced end to end with sentinels through the real editor |
| P0.4 | Guided Back — same room | TECHNICALLY CLOSED / HUMAN QA PENDING | Return lands on the canonical settle to 0.0000 m; motion evidence now exists |
| P0.5 | Guided Back — cross room | TECHNICALLY CLOSED / HUMAN QA PENDING | Return crosses the doorway as a crossing, not a teleport |
| P0.6 | Canonical settled pose per Tour Stop | TECHNICALLY CLOSED / HUMAN QA PENDING | Contract, forward arrival and Back return all agree |
| P0.7 | HUD Tour Stop counter | TECHNICALLY CLOSED / HUMAN QA PENDING | Counts stops, not beats; now read from the DOM in evidence |
| P0.8 | Crossing B — regression protection | TECHNICALLY CLOSED / HUMAN QA PENDING | Baseline had never been *compared against*; a plan diff now guards it |

Nothing in this registry is CLOSED. Nothing is REGRESSED.

---

# P0.2 — the one that must not be softened

> **Do not call P0.2 closed unless real persistent bytes survive the required
> lifecycle.**

They have not. To be explicit about what has and has not happened:

| | |
|---|---|
| An adapter exists | `authoring/project-cloud/asset-client.js` |
| It is wired into the product | **No** — deliberately |
| A byte has been uploaded | **No** |
| A byte has been retrieved after a reload | **No** |
| A byte has survived a session boundary | **No** |
| A second storage backend was created | **No** — forbidden, and not done |
| Persistence was faked to make a test pass | **No** |

`READY ≠ SAVED`. `CONFIG PERSISTENCE ≠ ASSET PERSISTENCE`.

## What is needed to unblock it

All four, from outside this repository:

1. **API base URL** for Escaparates Pro Project Cloud in a usable environment.
2. **A development workspace / user / project** the Museum may write into.
3. **A runtime session mechanism.** Not a fixed bearer token in the client —
   that was explicitly refused: *"STATIC DEPLOYED CLIENT → EMBEDDED LONG-LIVED
   BEARER TOKEN is NOT AUTHORIZED."* The adapter therefore takes a
   `session.authorize()` provider with no default and no fallback constant, and
   throws `UNAUTHENTICATED` rather than inventing one.
4. **An R2 test bucket** or equivalent that may be written to and read back.

Until those exist, the honest state is EXTERNAL BLOCKER. No amount of work in
this branch changes it, and no test written here can close it.

---

# Related, not P0

| Item | State | Note |
|---|---|---|
| Breeze Option E1 nested-room host | ARCHITECTURE APPROVED, unwired | 17/17; guest was a test double, and the spike says so |
| Breeze Phase 1A — real compute core | **OPEN, FROZEN** | Real WebGPU device and a real bake reached; GPU readback fails, so motion is unproven and not claimed |
| Breeze Phases 1B–1G, Phase 2 | NOT STARTED | Frozen by human decision until the Museum state is reconciled |
| Crossing A / transition engine | HUMAN VERDICT: ADJUST | Engine KEEP; endpoint change NOT AUTHORIZED |
