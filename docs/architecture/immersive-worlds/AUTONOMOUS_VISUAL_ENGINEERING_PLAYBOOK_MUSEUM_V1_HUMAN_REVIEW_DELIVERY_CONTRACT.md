# AUTONOMOUS VISUAL ENGINEERING PLAYBOOK — MUSEUM V1
## HUMAN REVIEW DELIVERY CONTRACT

> **Status:** MANDATORY OPERATIVE ADDENDUM while Museum V1 is under validation.  
> **Purpose:** every Human QA handoff must tell the reviewer exactly **where to look, what changed, what to test, and what verdict is required**.  
> **Core rule:** `A REVIEW LINK WITHOUT A REVIEW MAP IS AN INCOMPLETE HUMAN QA DELIVERY.`

---

# 1. PRIME RULE

A Human QA package must not merely provide a runtime URL.

It must provide:

```text
REVIEW SURFACE
+
WORKING HUMAN-ACCESSIBLE URL
+
EXACT CHANGE / CLAIM UNDER REVIEW
+
MINI REVIEW MAP
+
EXPECTED BEHAVIOUR
+
KNOWN LIMITATIONS
+
REQUESTED HUMAN VERDICT
```

The Product Owner must never have to reconstruct from old reports:

- which surface to open;
- where inside the product the change lives;
- which control reaches it;
- what changed;
- what must remain unchanged;
- what to compare against;
- what verdict to return.

---

# 2. REVIEW SURFACE MUST BE NAMED BY ROLE

Every review URL must identify the product surface and role it exposes.

Examples for Museum:

```text
VISITOR QA
= published / visitor-facing experience

MUSEUM STUDIO QA
= canonical product authoring surface

ADVANCED ENGINE EDITOR QA
= technical authoring / engine editor

PREVIEW / REVIEW QA
= review-only surface when present
```

Never collapse them into one generic label such as `Authoring`.

A technically valid URL to the wrong role/surface is an invalid Human QA handoff for that product question.

---

# 3. CANONICAL MUSEUM SURFACE RULE

For current Museum product QA:

```text
VISITOR EXPERIENCE
index.html

FULL MUSEUM STUDIO / PRODUCT AUTHORING
index.html?authoring=1

ADVANCED / TECHNICAL ENGINE EDITOR
author.html

VS01
index.html?authoring=1&shell=vs01
= legacy/fallback/dev reference unless explicitly under test
```

If the mission is P0.1 Visitor Authoring / Museum Studio UX, the Human reviewer must be sent to the **Full Museum Studio**, not only to `author.html`.

`author.html` remains useful for technical engine/editor QA, but it does not substitute for the canonical product authoring surface.

---

# 4. MINI REVIEW MAP — REQUIRED

Every Human QA handoff must contain a compact review guide.

For each changed vertical:

```text
CHANGE:
<what changed>

OPEN:
<surface + URL>

GO TO:
<exact section / control / route / state>

DO:
<1–5 short actions>

LOOK FOR:
<visual / behavioural acceptance points>

MUST NOT CHANGE:
<frozen baseline / unrelated behaviour>

KNOWN LIMITATION:
<if any>

RETURN:
KEEP / ADJUST / REJECT
+ one-line reason if ADJUST/REJECT
```

The guide should normally fit in 3–7 bullets per vertical.

Human QA documentation may contain deeper evidence elsewhere, but the Product Owner review map must remain concise.

---

# 5. REVIEW THE CHANGE, THEN REVIEW THE PRODUCT

Human QA has two scopes.

## PASS A — TARGETED CHANGE QA

First inspect the exact feature/change delivered.

Examples:

- `← ANTERIOR` same-room movement;
- cross-room Back through the doorway;
- Tour Stop counter;
- Visitor Authoring editorial width;
- VISITA field propagation;
- new Breeze room handoff.

## PASS B — SURFACE / PRODUCT REGRESSION QA

Then inspect the containing product surface for collateral damage.

Examples:

```text
Visitor change
→ also inspect HUD, Guide, labels, forward navigation, room continuity.

Authoring change
→ also inspect panel navigation, 3D preview, neighbouring fields, layout, responsive behaviour.
```

A narrow feature PASS does not close the vertical if the enclosing product surface visibly regressed.

---

# 6. VISITOR REVIEW MAP — BASELINE TEMPLATE

When Visitor behaviour changes, the Human review map should cover only the relevant subset, but the full baseline checklist is:

```text
FIRST GLANCE
- entry/readiness
- immediate visual integrity
- obvious prototype/broken states

FORWARD GUIDED
- camera movement
- settled composition
- Guide behaviour
- caption / artwork label
- Tour Stop counter

BACK SAME ROOM
- movement reads as return, not replay/teleport
- correct canonical destination
- Guide coherent
- label follows active stop
- counter follows active stop

BACK → FORWARD
- route remains coherent
- same settled composition
- no camera/state corruption

CROSS-ROOM BACK
- real doorway traversal
- room lifecycle coherent
- no flash/black/stale world
- correct final room/stop/label

PROTECTED FORWARD CROSSING
- human-approved baseline unchanged

VISITA / HUD / SALAS / TEXT / SOUND
- relevant controls remain usable
- panel hierarchy and text remain legible
```

Motion-critical behaviour must be reviewed in motion, not only in final screenshots.

---

# 7. MUSEUM STUDIO REVIEW MAP — BASELINE TEMPLATE

When the canonical Museum Studio changes, Human QA must inspect both the changed domain and the whole shell.

Baseline:

```text
GLOBAL SHELL
- navigation is understandable
- active section is clear
- preview remains useful
- no clipping / overlap / broken columns
- no unexpected horizontal overflow

CHANGED DOMAIN
- fields have enough editing space
- labels/help text remain legible
- long content can be read back after typing
- neighbouring controls did not regress

PREVIEW RELATIONSHIP
- edits remain understandable in relation to the 3D/public preview
- preview did not become unusably small

RESPONSIVE
- inspect at agreed desktop/laptop widths
- no truncation introduced by the fix

END-TO-END WHEN RELEVANT
- author input
→ configured state
→ public/visitor output
```

If the change affects only one domain, Human QA still performs a short whole-shell regression glance.

---

# 8. URL DELIVERY RULE

Preferred Human QA URL order:

```text
1. COMMIT-PINNED external review URL
2. stable hosted preview
3. branch-hosted preview clearly marked as moving
4. reviewer-local runtime only when external hosting cannot faithfully reproduce the product
```

Before handoff, the agent must verify as far as possible that the exact URL renders the intended surface.

The final Human QA response must never require the reviewer to guess query parameters.

Example:

```text
VISITOR:
https://.../index.html

FULL MUSEUM STUDIO:
https://.../index.html?authoring=1

ADVANCED ENGINE EDITOR:
https://.../author.html
```

---

# 9. HUMAN VERDICT FORMAT

For each review item request:

```text
KEEP
= visually/product-correct enough to preserve

ADJUST
= direction is correct but needs bounded correction

REJECT
= current solution should not become product baseline
```

For ADJUST/REJECT, ask for the shortest useful explanation:

```text
WHAT FEELS / LOOKS WRONG?
WHERE?
OPTIONAL: WHAT WOULD GOOD LOOK LIKE?
```

Do not force the Human reviewer to fill a technical report.

---

# 10. HUMAN QA DELIVERY TEMPLATE

Every future Human QA handoff should begin with a compact block like:

```text
HUMAN QA — <MISSION>

BUILD
Branch: ...
Commit: ...
Preview status: pinned / moving

OPEN
Visitor: ...
Museum Studio: ...
Advanced Editor: ... (only if relevant)

REVIEW 1 — <change>
- Go to ...
- Do ...
- Look for ...
- Must remain ...
Return: KEEP / ADJUST / REJECT

REVIEW 2 — <change>
...

KNOWN ISSUE
...

DO NOT REVIEW YET
...
```

Deep evidence, metrics, critic reports and implementation records may follow or be linked separately.

---

# 11. CLOSURE RULE

A visually meaningful vertical cannot move from:

```text
TECHNICALLY CLOSED / HUMAN QA PENDING
```

to:

```text
CLOSED
```

until the Human reviewer has been given:

```text
CORRECT SURFACE
+
WORKING ACCESS
+
REVIEW MAP
+
REAL CHANGE TO INSPECT
+
VERDICT REQUEST
```

and a Human verdict has been recorded.

---

# 12. GENERALIZABLE LEARNING

This protocol should be generalized into the future cross-project Playbook.

Canonical lessons:

> **A REVIEW LINK WITHOUT A REVIEW MAP IS AN INCOMPLETE HUMAN QA DELIVERY.**

> **THE HUMAN SHOULD NEVER HAVE TO DISCOVER WHERE THE CHANGE LIVES.**

> **TARGETED CHANGE QA MUST BE FOLLOWED BY A SHORT CONTAINING-SURFACE REGRESSION GLANCE.**

> **THE CORRECT ROLE/SURFACE IS PART OF THE EVIDENCE CONTRACT.**
