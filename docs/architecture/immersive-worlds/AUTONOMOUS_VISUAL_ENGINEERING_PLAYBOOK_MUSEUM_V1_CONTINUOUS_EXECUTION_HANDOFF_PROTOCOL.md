# AUTONOMOUS VISUAL ENGINEERING PLAYBOOK — MUSEUM V1
## CONTINUOUS EXECUTION / HANDOFF PROTOCOL

> **Status:** MANDATORY OPERATIVE ADDENDUM TO MUSEUM V1 WHILE THE PLAYBOOK IS UNDER VALIDATION  
> **Repository:** `Juanmaes83/escaparates-pro`  
> **Authority:** Juanma — Product Owner / Visual Authority / Final Decision / Merge Authority  
> **Purpose:** prevent unnecessary execution stops while preserving real Human Gates and Global Outcome Stability.  
> **Core correction:** reporting progress is not the same thing as returning control to the human.

---

# 1. PRIME DIRECTIVE

> **DEFAULT STATE = CONTINUE EXECUTION.**

Claude may communicate findings, write checkpoints, commit bounded work, record evidence, update logs, declare phase completion and report risks **without returning control**.

A useful report is not, by itself, a Human Gate.

Canonical distinctions:

```text
CHECKPOINT
= record progress and CONTINUE

REPORT
= summarize progress and CONTINUE

HANDOFF
= return control to Juanma because a real human decision or blocker prevents the next safe authorized action
```

> **A REPORT IS NOT A HANDOFF.**

> **A COMMIT IS NOT A HANDOFF.**

> **A PHASE END IS NOT A HANDOFF.**

> **A NEW FINDING IS NOT A HANDOFF.**

> **A FAILED TEST IS NOT AUTOMATICALLY A HANDOFF.**

> **REPORTING GATE ≠ HUMAN DECISION GATE.**

---

# 2. THE HANDOFF TEST

Before returning control, Claude must be able to complete both lines concretely:

```text
I NEED JUANMA TO DECIDE:
<specific unresolved decision>

BEFORE I CAN SAFELY EXECUTE:
<specific next authorized action>
```

If both lines cannot be completed with a real dependency, there is no Human Gate.

Then:

```text
CONTINUE EXECUTION.
```

Do not use vague substitutes such as:

```text
I would rather report first.
This seems like a good checkpoint.
This is substantial work.
I want to be transparent before continuing.
The next phase is a clean slice.
```

None of those statements creates a Human Gate.

Transparency and continuous execution are compatible.

---

# 3. VALID HANDOFF CONDITIONS

Claude may return control only when at least one of these conditions is true:

## A. REAL HUMAN PRODUCT / VISUAL DECISION

A specific unresolved choice changes what the product should be, how an approved visual result should read, or which competing valid product contract is authoritative.

Example:

```text
I NEED JUANMA TO DECIDE:
whether the canonical settled Tour Stop state is opening pose, post-sequence pose or an explicit authored pose

BEFORE I CAN SAFELY EXECUTE:
Back destination semantics across the Guided Experience
```

This is a valid Human Gate.

## B. REAL EXTERNAL BLOCKER

An external dependency genuinely prevents the next authorized work and no independent authorized work can continue safely.

Examples:

```text
missing real environment required for byte-level persistence proof
missing credential/service that cannot be safely substituted
unavailable external runtime required by the acceptance contract
```

A blocked sub-workstream does not automatically block the project.

## C. GLOBAL OUTCOME STABILITY CANNOT BE DEMONSTRATED

The next action may modify a shared/frozen/global contract and Claude cannot prove that the intended global outcome remains stable.

Then:

```text
FULL CONTINUATION = NO
PREPARATION ONLY = evaluate
HANDOFF = only if even preparation cannot proceed safely or a human choice is required
```

## D. GENUINE HUMAN QA GATE

The next product change should not proceed until Juanma experiences and judges the real runtime because the unresolved question is perceptual/product authority rather than implementation correctness.

The Human QA package must satisfy the navigable runtime protocol.

---

# 4. NON-BLOCKING CHECKPOINTS

During a long execution mission, Claude should communicate material progress when useful.

A checkpoint may include:

```text
finding
metric
commit
status change
risk
regression result
phase completion
next phase declaration
```

After the checkpoint:

```text
IF NEXT ACTION IS AUTHORIZED + BOUNDED + GLOBALLY STABLE
→ CONTINUE IMMEDIATELY
```

Do not ask:

```text
Say the word and I will continue.
Should I proceed?
Do you want me to take the next three steps?
```

when those steps are already authorized and no human decision is required.

---

# 5. AUTHORIZED SEQUENCING

When a mission defines several ordered tasks:

```text
A
→ B
→ C
```

Claude may choose a technically sound internal sequence, but completing A does not create a stop if B is already authorized.

Required behavior:

```text
COMPLETE A
→ checkpoint/report if useful
→ evaluate B
→ if safe and authorized, EXECUTE B
→ then C
```

If B is blocked:

```text
classify blocker
→ evaluate C or other authorized work
→ continue if independent AND Global Outcome Stability is demonstrated
```

> **A BLOCKED WORKSTREAM ≠ AN AUTOMATIC GLOBAL STOP.**

---

# 6. REPORTING WITHOUT STOPPING

Claude may produce concise inline progress reports during execution, but the presence of a report must not terminate the mission.

The correct pattern is:

```text
CHECKPOINT:
Canonical Tour Stop contract PASS.
0.0000 m repeat delta.
Proceeding now to real forward-settle equivalence proof.

<execute tools / code / QA>
```

Not:

```text
Canonical Tour Stop contract PASS.
Say the word and I will continue.
```

The second pattern is prohibited when no Human Gate exists.

---

# 7. STOP-GATE SELF-CHECK

Immediately before handing control back, Claude must run this self-check:

```text
1. Is the next action already defined?
2. Is it already authorized?
3. Is it bounded?
4. Can Global Outcome Stability be demonstrated?
5. Do I need Juanma to choose something before I can execute it?
```

Decision:

```text
1–4 = YES
5 = NO
→ CONTINUE

5 = YES
→ HUMAN GATE

1–4 cannot be satisfied because of a real external/global blocker
→ classify blocker
→ evaluate PREPARATION ONLY or another independent authorized mission
→ handoff only if no safe authorized continuation remains
```

---

# 8. HUMAN GATE MUST NAME THE DECISION

A valid Human Gate report must contain:

```text
HUMAN DECISION REQUIRED:
<one exact question>

WHY CLAUDE CANNOT DECIDE IT:
<authority/product reason>

NEXT SAFE ACTION BLOCKED BY THIS DECISION:
<exact action>

WHAT CAN STILL CONTINUE INDEPENDENTLY:
<workstream or NONE, with Global Outcome Stability reasoning>
```

If `HUMAN DECISION REQUIRED` cannot be stated precisely, do not label the checkpoint a Human Gate.

---

# 9. HUMAN QA VS STATUS REPORT

Do not request Human QA merely because implementation has reached a visually interesting state.

Request Human QA when:

```text
THE HUMAN VERDICT WILL DETERMINE WHETHER THE NEXT PRODUCT CHANGE IS AUTHORIZED.
```

If Claude can still perform deterministic QA, regression proof, reference comparison, fresh-critic review, evidence preparation or another already-authorized bounded phase without affecting the human decision, those tasks should normally be completed first.

Human time is reserved for decisions that genuinely require Human authority.

---

# 10. LONG-RUN EXECUTION MODEL

Canonical continuous-execution loop:

```text
EXECUTE
→ OBSERVE
→ CLASSIFY
→ RECORD
→ CHECKPOINT IF USEFUL
→ ASK: DO I NEED JUANMA TO DECIDE SOMETHING BEFORE THE NEXT SAFE ACTION?
        │
        ├── NO
        │   → CONTINUE EXECUTION
        │
        └── YES
            → PREPARE REAL HANDOFF
            → HUMAN GATE
```

This preserves both autonomy and safety.

> **PRUDENCE DOES NOT MEAN RETURNING CONTROL UNNECESSARILY.**

> **CONTINUOUS EXECUTION DOES NOT MEAN IGNORING HUMAN AUTHORITY.**

The objective is maximum safe progress per Human intervention.

---

# 11. KNOWN FAILURE MODE THAT CREATED THIS ADDENDUM

Museum validation exposed a repeated process failure:

```text
Claude completed a bounded phase,
found useful information,
had the next authorized action clearly defined,
was blocked by no human decision,
and still returned control because the information felt report-worthy.
```

This is a PROCESS BUG.

Correct classification:

```text
REPORT-WORTHY ≠ HANDOFF-WORTHY
```

Generalized learning:

> **THE THRESHOLD FOR COMMUNICATING IS LOW. THE THRESHOLD FOR STOPPING IS HIGH.**

This rule applies to all long-running Museum execution missions while this addendum is operative.

---

# 12. RELATION TO OTHER PLAYBOOK RULES

This protocol does not weaken:

```text
EFFICIENCY NEVER MEANS PUTTING THE PROJECT AT RISK.
UNCERTAINTY ABOUT GLOBAL IMPACT = NO FULL CONTINUATION.
LOCAL INDEPENDENCE IS NOT ENOUGH. CONTINUATION REQUIRES GLOBAL OUTCOME STABILITY.
A PAUSED MISSION MAY NOT BE SILENTLY MODIFIED WHILE AWAITING HUMAN QA.
NEVER INVENT A NEW MISSION JUST TO AVOID WAITING.
FUNCTIONAL PASS ≠ PRODUCT PASS. PIXELS WIN.
AGENT KEEP ≠ HUMAN APPROVAL.
```

It clarifies when those rules actually require a stop.

If the project is already at a genuine Human Gate, this protocol does not authorize modifying the paused mission while waiting.

If there is no genuine Human Gate, this protocol requires continued execution.

---

# 13. OPERATIVE SUMMARY

```text
DEFAULT
= CONTINUE

CHECKPOINT
= COMMUNICATE + CONTINUE

REPORT
= SUMMARIZE + CONTINUE

HANDOFF
= RETURN CONTROL ONLY FOR A REAL HUMAN DECISION / REAL BLOCKER / GENUINE HUMAN QA

MANDATORY QUESTION BEFORE STOPPING
= "DO I NEED JUANMA TO DECIDE SOMETHING BEFORE I CAN SAFELY EXECUTE THE NEXT AUTHORIZED ACTION?"

IF NO
= CONTINUE
```

> **REPORTING CHECKPOINT ≠ EXECUTION STOP.**

> **A REPORT CAN BE DELIVERED WITHOUT ENDING EXECUTION.**

> **DEFAULT STATE = CONTINUE EXECUTION.**
