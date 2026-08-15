# AUTONOMOUS VISUAL ENGINEERING PLAYBOOK — MUSEUM V1
## BROWSER AUTOMATION / PLAYWRIGHT QA PROTOCOL

> **Status:** MANDATORY OPERATIVE ADDENDUM TO MUSEUM V1 WHILE THE PLAYBOOK IS UNDER VALIDATION  
> **Repository:** `Juanmaes83/escaparates-pro`  
> **Authority:** Juanma — Product Owner / Visual Authority / Final Decision / Merge Authority  
> **Purpose:** make browser-based QA, runtime verification and Human QA access more reliable, observable and reproducible without confusing agent-local automation with Human-accessible review.

---

# 1. PRIME RULE

> **PLAYWRIGHT CAN VERIFY AND AUTOMATE A BROWSER SESSION; IT DOES NOT MAKE AN UNSTARTED REVIEWER-LOCAL SERVER EXIST.**

A `http://127.0.0.1:<port>/...` Human QA URL is valid only when the required server is actually running on the Human reviewer's machine.

Browser automation may prove that a launch command and product path work in the agent environment, but that does not prove the reviewer-local server is running.

Therefore:

```text
AGENT AUTOMATION PASS
≠
REVIEWER-LOCAL SERVER RUNNING
≠
HUMAN REVIEW COMPLETED
```

---

# 2. FIRST-PARTY REFERENCE SOURCES

Juanma maintains first-party repository copies that may be used as reference material:

```text
Juanmaes83/playwright
Juanmaes83/playwright-mcp
Juanmaes83/awesome-playwright
```

Their roles are different:

```text
playwright
= PRIMARY browser automation / E2E / screenshot / video / trace capability reference

playwright-mcp
= OPTIONAL agent browser-control interface, useful for persistent exploratory agent loops and structured accessibility interaction

awesome-playwright
= RESEARCH / CAPABILITY INDEX ONLY; never a runtime dependency or authority by itself
```

Do not vendor or copy these repositories into a project merely because they exist.

---

# 3. TOOL SELECTION FOR CODING AGENTS

When a coding agent needs deterministic browser QA, prefer the smallest tool that proves the required fact.

Recommended order:

```text
1. EXISTING PROJECT QA HARNESS
2. PLAYWRIGHT TEST / PLAYWRIGHT LIBRARY
3. PLAYWRIGHT CLI FOR CODING AGENTS
4. PLAYWRIGHT MCP WHEN PERSISTENT / EXPLORATORY AGENT BROWSER STATE IS MATERIALLY USEFUL
```

For coding-agent loops, Playwright CLI may be more token-efficient than MCP because it avoids continuously loading large MCP schemas and accessibility trees.

MCP remains valid when persistent browser context, structured introspection, iterative exploration or long-running autonomous browser state is useful.

> **TOOL SELECTION IS FITNESS-FOR-PURPOSE, NOT MCP-BY-DEFAULT.**

---

# 4. HUMAN QA ACCESS MUST BE PROVEN SEPARATELY

Before handing a localhost URL to Juanma, the delivery must distinguish:

```text
A. AGENT RUNTIME VERIFICATION
B. HUMAN REVIEWER LAUNCH INSTRUCTIONS
C. HUMAN ACCESS CONFIRMATION
```

A valid reviewer-local package must include:

```text
REPOSITORY
BRANCH
HEAD / COMMIT
WORKING DIRECTORY
EXACT SERVER COMMAND
EXPECTED PORT
EXPECTED URL
EXPECTED SUCCESS SIGNAL
HOW TO STOP SERVER
```

If the Human reports that the URL does not open, classify first:

```text
SERVER NOT STARTED
WRONG WORKING DIRECTORY
PORT ALREADY USED / DIFFERENT PORT
COMMAND FAILED
DEPENDENCY MISSING
PATH / ROUTE WRONG
LOCAL FIREWALL / BROWSER ISSUE
PRODUCT BOOT FAILURE
```

Do not respond by simply repeating the same localhost URL.

---

# 5. PLAYWRIGHT AS ACCESS VERIFICATION

Playwright should be used to verify browser-level facts where appropriate:

```text
PAGE LOAD
REAL PRODUCT ROUTE
BUTTON DISCOVERABILITY
CONTROL CLICKABILITY
CANVAS PAINTING
DOM STATE
VISITOR FLOW
AUTHORING FLOW
RESPONSIVE VIEWPORTS
SCREENSHOTS
VIDEO
TRACES
CONSOLE ERRORS
NETWORK FAILURES
```

Where the project is visual or motion-critical, Playwright evidence complements but does not replace Human visual review.

> **ACCESSIBILITY-TREE SUCCESS ≠ VISUAL PRODUCT SUCCESS.**

---

# 6. HEADED / OBSERVABLE AGENT QA

When practical, browser automation used for product QA should support a visible or inspectable run.

Useful modes include:

```text
headed browser
screenshots
recorded video
trace viewer
live session monitoring where supported
```

For Playwright CLI, a live session dashboard can be used when available to make agent browser activity inspectable.

This improves trust when diagnosing:

```text
wrong route
wrong button
stale build
unexpected redirects
visual state mismatch
interaction timing
```

---

# 7. TRACE / VIDEO / SCREENSHOT RULE

When a browser-based defect is difficult to reproduce, prefer evidence with temporal context:

```text
TRACE
+
SCREENSHOTS
+
VIDEO WHEN MOTION MATTERS
+
CONSOLE / NETWORK OUTPUT WHEN RELEVANT
```

A trace is particularly useful for reconstructing:

```text
what action occurred
what DOM state existed
what request failed
what console error happened
what screenshot corresponded to the action
```

But trace evidence remains agent evidence.

Human verdict remains separate.

---

# 8. SAME-CONTEXT CAPABILITY PROBES

Browser capability checks must run under conditions materially equivalent to the product runtime.

This includes, where relevant:

```text
origin / secure context
browser flags
GPU mode
viewport
permissions
storage
media autoplay policy
cross-origin rules
```

Do not declare a capability unavailable from an `about:blank`, `file://`, insecure or otherwise non-equivalent context when the product runs under different conditions.

Canonical lesson:

> **PROBE THE CAPABILITY IN THE SAME CONTEXT THE PRODUCT USES.**

---

# 9. HUMAN-FIRST PRINCIPLE REMAINS

Playwright may automate the exact Human test path before handoff, but it must not silently replace Human First-Glance.

For meaningful interactive or visual gates:

```text
PLAYWRIGHT / AGENT PRODUCT-PATH QA
→ EVIDENCE
→ FRESH CRITIC WHEN REQUIRED
→ HUMAN NAVIGABLE RUNTIME
→ HUMAN FIRST-GLANCE
→ DIRECTED REPRODUCTION
→ HUMAN VERDICT
```

---

# 10. ANTI-PATTERNS

Do not:

- present agent-local localhost as if it were already running on Juanma's machine;
- repeat a dead localhost URL without diagnosing the launch state;
- install Playwright MCP merely because browser QA exists;
- treat MCP as superior to CLI/Test by default;
- add `awesome-playwright` as a production dependency;
- equate accessibility snapshots with visual fidelity;
- call a Playwright PASS a Human approval;
- probe WebGPU, storage, media or security-sensitive features in the wrong browser context and report a blocker;
- capture only a final screenshot when the defect is temporal;
- hide browser console/network failures behind a green DOM assertion.

---

# 11. DELIVERY TEMPLATE

For browser-based Human QA handoff:

```text
BRANCH:
HEAD:
SURFACE:

AGENT BROWSER QA:
PASS / FAIL / BLOCKED

AUTOMATION METHOD:
existing harness / Playwright Test / Playwright Library / CLI / MCP

AGENT EVIDENCE:
trace / screenshots / video / console / network

REVIEWER-LOCAL START:
<exact command>

EXPECTED SUCCESS SIGNAL:
<what Juanma should see in terminal>

HUMAN URL:
<exact URL>

IF URL DOES NOT OPEN:
<short diagnostic path>

HUMAN QA:
PENDING
```

---

# 12. CANONICAL RULE

> **BROWSER AUTOMATION SHOULD REDUCE UNCERTAINTY, NOT HIDE THE DISTINCTION BETWEEN AGENT ACCESS AND HUMAN ACCESS.**
