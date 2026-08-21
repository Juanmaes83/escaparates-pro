# MUSEUM — NEXT AUTONOMOUS LOOP

Authoring UX + Transition Authoring → Visitor / Institutional Layer → Gallery B Projection / Video Mapping

## Execution context

Continue from the current trustworthy checkpoint on:

`claude/immersive-worlds-module-c0d3f7`

First reconstruct the actual current HEAD and repository state. Do not assume a SHA from this document if the branch has advanced.

Juanma may be away during execution.

You are authorized to work autonomously through the bounded sequence below and STOP only at the final HUMAN GATE, unless a frozen product contract must be broken or a destructive/data-risk decision appears.

**NO MERGE. NO PROMOTION. MASTER UNTOUCHED.**

---

## 0. Preserve current verified baseline

The current VS02 Authoring baseline is KEEP.

Do not reopen or rewrite without regression evidence:

- Experience Tree
- five Authoring Workspaces
- real Museum preview
- contextual editor
- Project Readiness
- Media Library V1
- thumbnails
- media reuse
- image authoring
- video authoring
- text authoring
- artwork focus
- semantic synchronization
- Museum B proof
- MediaVault architecture
- current image/video replacement semantics
- current camera contracts
- approved destination framings
- existing transition engine
- portal debt
- video architecture

Human-verified capabilities remain KEEP unless a real regression appears.

---

## 1. Progressive disclosure — implement on touched surfaces

The Constitution records:

> **ESSENTIAL FIRST. DEEPER ON DEMAND.**

This is no longer documentation-only for the surfaces touched by this mandate.

Implement the pattern carefully in the Authoring UI.

The first view of a family must not expose every possible control.

Show the essential controls first. Then expose deeper controls through a named, contextual opening such as:

- `PERSONALIZAR MÁS · OBRA`
- `PERSONALIZAR MÁS · INSTITUCIÓN`
- `PERSONALIZAR MÁS · MEDIOS`
- `PERSONALIZAR MÁS · EXPERIENCIA`
- `PERSONALIZAR MÁS · VISITANTE`
- `PERSONALIZAR MÁS · PUBLICACIÓN`

Do not use meaningless generic labels like `Advanced`, `More`, or `Settings` when a family-specific label can explain what is opening.

The goal is not to hide functionality. The goal is:

`ESSENTIAL → ENRICH → EXPERT DETAIL`

The first visual hit must remain calm, clear and premium.

### 1.1 Rules

For every family touched in this mandate:

- **LEVEL 1** = essential fields needed to create a valid useful result quickly.
- **LEVEL 2** = contextual enrichment through `Personalizar más · [familia]`.
- **LEVEL 3** = specialist / advanced controls only when materially useful.

Do not retrofit every existing surface blindly.

Use a fresh visual critic to identify where the current interface is already too dense or where this mandate adds enough new controls to create a wall.

Preserve discoverability:

- expanded sections must have clear headings;
- state must be visible;
- collapsing must not silently discard edits;
- validation/readiness must still account for hidden fields correctly;
- hidden ≠ ignored.

---

## 2. Transitions — Authoring, not engine reimplementation

Important distinction:

**THE TRANSITION ENGINE ALREADY EXISTS.**

Do not rebuild it.

Do not reopen approved camera endpoints.

Do not alter the frozen contract:

> **Transitions may change HOW camera travels, never WHERE approved beat ends.**

Approved transition vocabulary already exists:

- T1 — Micro Reframing
- T2 — Local Walk
- T3 — Gallery Traverse
- T4 — Object Orbit
- T5 — Threshold Approach

The current gap is **AUTHORING / PERSONALIZATION**.

The Studio should allow an authorized creator to choose or tune transition intent where the product supports it, without exposing engine complexity.

### 2.1 Transition Authoring UX

Place this under:

`EXPERIENCIA → Recorridos / Transiciones`

Use progressive disclosure.

Essential view may show:

- current transition style
- preview/replay
- reduced-motion behavior/status

Then:

`PERSONALIZAR MÁS · TRANSICIÓN`

may expose only safe semantic controls such as:

- transition family/type
- intensity / pacing if already safely supported
- transition intent
- reduced-motion alternative
- perhaps duration when contract-safe

Do not expose:

- raw camera coordinates
- raw vectors
- destination poses
- engine ids
- `frameCorners` internals
- controller ownership
- low-level easing internals unless translated into author language

Semantic language first.

Example author-facing vocabulary should describe experience:

- Suave
- Paseo corto
- Recorrido de sala
- Órbita de objeto
- Aproximación al umbral

rather than internal engine nomenclature.

### 2.2 Transition QA

Must prove:

- approved endpoint is unchanged;
- selecting a different transition changes HOW travel occurs;
- it does not change WHERE the beat ends;
- Focus return still works;
- Explore state remains valid;
- reduced-motion path remains valid;
- no duplicate authoritative camera writer;
- existing 33 beats / 10 stops contracts remain intact where applicable.

Use targeted QA matched to change impact.

Do not rerun unrelated archaeology from zero.

Real browser evidence is mandatory.

---

## 3. Visitor / Institutional Layer

After transition authoring is stable, continue directly into the next product layer.

This is not visitor authoring by the final visitor.

Clarification:

`STUDIO AUTHOR` configures visitor-facing institutional information.

`FINAL VISITOR` consumes/interacts with it.

The visitor never sees authoring controls.

### 3.1 Purpose

Museum must become more than a virtual exhibition.

It must function as an institutional and conversion layer for:

- museums
- galleries
- foundations
- exhibitions
- cultural institutions
- cultural events

The same semantic record should feed appropriate visitor-facing representations.

### 3.2 Visitor Information — first real vertical

Implement a coherent V1 for:

#### VISITA

- opening hours
- physical location
- accessibility information
- admission / price information
- ticket URL or ticket action
- reservation URL or reservation action
- contact information
- transport information
- parking information when provided

#### PROGRAMACIÓN

- current exhibition/programme item
- upcoming activities
- guided visits
- talks
- workshops
- performances
- events

#### CALENDAR / DATE INFORMATION

- relevant dates
- event date/time
- add-to-calendar action where technically reasonable and truthful

#### CTA

- RESERVAR VISITA
- COMPRAR ENTRADA
- VER PROGRAMACIÓN
- AÑADIR AL CALENDARIO
- CÓMO LLEGAR
- CONTACTAR

Do not invent live booking integrations.

If the source is a URL/action, treat it honestly as a URL/action.

Do not pretend availability exists if it does not.

### 3.3 Authoring UX for Visitor Layer

Workspace:

`VISITANTE`

The first view must remain simple.

Suggested hierarchy:

**Essential**

- Horarios
- Dirección / ubicación
- CTA principal
- Accesibilidad summary
- Entrada / reserva

`[ PERSONALIZAR MÁS · VISITANTE ]`

**Expanded**

- transport
- parking
- contacts
- secondary CTA
- languages
- visitor notes
- calendar/programme behavior
- other non-essential institutional fields

PROGRAMACIÓN should have its own coherent sub-area rather than becoming twenty fields inside one visitor form.

Use real repeatable programme records.

Conceptually:

```text
ProgrammeItem {
  id
  title
  type
  description
  start
  end
  location?
  bookingUrl?
  ticketUrl?
  accessibilityNote?
  status?
}
```

Exact schema should be designed after checking existing architecture.

Do not create a CMS monster.

Build the smallest reusable semantic system.

### 3.4 Visitor-facing representation

The information must not exist only in Authoring.

Demonstrate at least one real visitor-facing representation.

It may be:

- institutional visitor panel
- visit/info overlay
- programme panel
- entry/exit information surface
- another Museum-native representation

But:

`AUTHORING DATA → MUST REACH VISITOR EXPERIENCE.`

One semantic record → multiple representations remains the rule.

Visitor UI must never expose Studio controls.

### 3.5 Second-museum test

Use the Museum B / second-institution configuration to prove the Visitor Layer is not hard-coded to Fundación Arenas.

A second institution must be able to change, without engine changes:

- hours
- address/location
- programme
- booking/ticket CTA
- contact
- relevant dates

Do not create a second custom implementation.

---

## 4. Gallery B — Projection / Video Mapping expansion

Only after the Visitor / Institutional V1 has passed its bounded QA:

continue into Gallery B.

This is an expansion of existing capabilities.

Do not replace the existing video architecture.

Do not confuse video authoring with projection behavior.

Goal:

make Gallery B a stronger specialized experience for:

- PROJECTION
- VIDEO MAPPING
- MOVING IMAGE
- IMMERSIVE MEDIA

### 4.1 First audit what already exists

Before implementing:

inspect the current Gallery B code, existing `PROJECTION_IMAGE` / `PROJECTION_VIDEO` slots, current projection surfaces, media architecture, and relevant existing donors already inside Escaparates Pro.

Reuse proven capabilities.

Do not invent a new media subsystem.

### 4.2 Bounded Gallery B V1

Target a coherent first vertical such as:

- choose image/video projection media
- apply to designated projection surface
- author-facing preview
- basic safe presentation controls where supported
- correct aspect behavior
- loop / playback semantics
- real visitor output

Potential safe controls may include, only if architecture supports them cleanly:

- fit / fill
- scale
- position
- opacity
- brightness / exposure-like presentation adjustment
- loop
- muted state where relevant

Do not add every possible shader parameter.

Use progressive disclosure:

`PROYECCIÓN` essential controls

`[ PERSONALIZAR MÁS · PROYECCIÓN ]`

for secondary controls.

---

## 5. Do not open tomorrow's scope

Absolutely do not implement now:

- reactive sculpture room
- cloth / scarf
- Breeze reactive installation
- new 3D sculpture pipeline
- avatar / AI cultural guide
- billing
- accounts
- plan gating implementation
- full Output Center
- full DAM
- remote media persistence
- room map
- activity feed

**SCULPTURE + CLOTH IS TOMORROW'S SEPARATE PHASE.**

Do not touch it tonight.

---

## 6. Visual Gauntlet throughout

Every new surface must be judged against:

`docs/visuals/museum-authoring/museum-authoring-ui-reference-v1.png`

and the approved blueprint.

The criterion is not merely:

> does it work?

Ask:

> Does this look like an expensive, mature, professional museum-authoring product?

Maintain:

- calm first view
- strong hierarchy
- preview prominence
- contextual editing
- restrained premium accent
- real thumbnails/media
- no wall of controls
- sentence-case author language
- no engine vocabulary leakage

Progressive disclosure must visibly improve the shell, not merely hide elements.

---

## 7. Gauntlet loop

For each major vertical:

`LEAD → meaningful implementation → targeted functional QA → real browser → screenshots → fresh visual critic → largest meaningful defect → correction → recapture`

Do not run infinite micro-polish.

At most one or two meaningful correction loops per vertical unless a blocker is real.

Builder evidence is not critic evidence.

**FUNCTIONAL PASS ≠ PRODUCT PASS.**

**PIXELS WIN.**

---

## 8. Error / learning log — mandatory

Every meaningful failure, false assumption, stale-evidence mistake, QA-instrument flaw, regression, or process error discovered during this mandate must be recorded for future agents.

Do not merely fix and forget.

Use the existing project learning/error documentation if one already exists. If there is no appropriate canonical log, append a bounded section to the nearest existing QA/process document rather than creating multiple competing logs.

For each meaningful error, record:

- what happened;
- why it happened / root cause if known;
- which evidence exposed it;
- whether product or QA instrument was wrong;
- what was changed;
- what rule prevents recurrence;
- what evidence remains trustworthy and what became stale.

Examples already learned from previous work include:

- input harnesses that set `.value` directly can hide real keyboard bugs;
- video tests that cover only one projection slot can falsely imply all artwork video authoring exists;
- WebGL canvas readback can lie when `preserveDrawingBuffer` is false;
- a looping video can wrap `currentTime` without being stopped;
- stale captures must never be read as current evidence;
- a wrong CLI flag can silently rerun the wrong wave;
- measurements taken while layout overlaps are not valid measurements;
- a review board must be built from the actual evidence it captions.

Treat these as institutional memory, not anecdotes.

The process should get better because mistakes are preserved.

---

## 9. Human visual QA requirement

Juanma + ChatGPT will manually test the final artifact when Juanma returns.

Therefore do not claim HUMAN PASS.

Report:

- INTERNAL QA: PASS/FAIL
- CLAUDE VISUAL CRITIC: PASS/FAIL
- HUMAN QA: PENDING

The final artifact must be unmistakably the Museum project.

Its page/title/review surface should clearly identify:

`MUSEUM AUTHORING VS02 / ESTUDIO DE EXPERIENCIA`

so it cannot be confused with Paint Your Logo Wall or another Escaparates Pro module.

---

## 10. Documentation

Update existing canonical documentation rather than creating competing docs.

Record:

- Progressive Disclosure implemented pattern
- Transition Authoring contract
- Visitor / Institutional Layer schema and responsibilities
- Programme semantics
- CTA semantics
- Gallery B projection expansion
- deferred items
- exact human-review debt
- meaningful errors / learning rules from this mandate

Do not turn documentation into speculative promises.

Mark accurately:

- IMPLEMENTED
- DEFERRED
- PROPOSED

---

## 11. Final Human Gate

When all bounded work above is complete:

STOP.

Report exactly:

### BRANCH / HEAD / TREE STATUS

### A. PROGRESSIVE DISCLOSURE
- families implemented
- before/after
- hidden vs essential controls

### B. TRANSITION AUTHORING
- existing engine reused
- author controls
- endpoint preservation proof
- reduced motion proof
- real visual evidence

### C. VISITOR / INSTITUTIONAL LAYER
- fields/schema
- programme
- hours
- booking
- tickets
- calendar
- visitor info
- CTA
- second-museum proof
- real visitor representation

### D. GALLERY B
- projection/video-mapping capabilities
- controls
- media flow
- real visitor output

### E. QA
- targeted tests
- smoke
- console
- regressions
- visual critic

### F. VISUAL EVIDENCE
- before/after
- screenshots
- review board

### G. ERROR / LEARNING LOG
- errors discovered
- root causes
- product vs instrument mistakes
- recurrence-prevention rules
- stale vs trustworthy evidence

### H. URLS
- ONE clearly-labelled current Museum interactive artifact
- review board

### I. DEBT
- explicitly deferred items

### J. HUMAN QA

`PENDING — Juanma + ChatGPT`

**PRODUCT APPROVAL: PENDING**

**NO MERGE**

**NO PROMOTION**

**MASTER UNTOUCHED**

Then STOP.

---

## 12. Autonomy

Juanma may be away.

Do not stop for minor implementation choices that the repository, approved reference, Constitution or existing architecture can resolve.

Do stop only if:

- a frozen contract must be violated;
- a destructive/data-loss decision appears;
- the existing architecture makes two materially different product paths equally plausible and choosing one would create expensive lock-in;
- or the final HUMAN GATE is reached.

Otherwise continue autonomously through the bounded mandate.

**PRESERVE VERIFIED EVIDENCE.**

**RESUME FROM THE LAST TRUSTWORTHY CHECKPOINT.**

**VALIDATION SCOPE MUST MATCH CHANGE IMPACT.**

**NO LOCAL-MAXIMA LOOP.**
