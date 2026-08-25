# CHATGPT SCHEDULED TASKS & AUTOMATION MONITORING OS — V1

Status: canonical playbook companion  
Project family: Generic Autonomous Project Operating System  
Primary use cases: Juanma / Rubik Sota / Museum / Sarah Katerina / Escaparates Pro  
Human authority: Juanma = Product Owner / Visual Authority / Merge Authority

## 1. Purpose

Scheduled Tasks are not treated as sophisticated reminders. In this operating system they are a **persistent supervision layer** that can keep watching CI, deployments, pull requests, releases, market signals, content opportunities and human gates while no active chat session is being used.

The architecture separates three responsibilities:

```text
AGENT EXECUTION
      ↓
AUTOMATED QA / EXTERNAL SIGNAL
      ↓
AUTOMATION & MONITORING LAYER
      ↓
MATERIAL CHANGE?
   ├── NO → SILENCE
   ├── REAL ERROR → AGENT FIXES
   ├── QA/HARNESS BLOCK → HUMAN QUICK CHECK
   └── READY → JUANMA HUMAN GATE
```

Automation supervises. It does **not** inherit Juanma's authority to approve visuals, merge, publish, spend money or redefine scope.

## 2. Three operating modes

### ONE-SHOT
Use for one future action.

Examples:
- remind Juanma to review a deployment tomorrow;
- re-check a release after a known publishing window;
- verify a PR after CI is expected to finish.

### RECURRING
Use for repeated delivery at a cadence.

Examples:
- weekly portfolio health report;
- Monday Sarah Katerina competitor scan;
- Friday open-PR review;
- monthly canonical-document drift audit.

### CONDITION WATCH
Use when notification should happen only when a future condition becomes true or a material change occurs.

Examples:
- notify when Museum Phase 2 is green;
- notify when Vercel preview reaches READY;
- notify when a PR becomes blocked or unmergeable;
- notify when a competitor launches a materially relevant new offer;
- notify when SEO visibility drops beyond an agreed threshold.

Condition Watch is the preferred mode for engineering gates because **silence is a valid result**.

## 3. Juanma Automation Control Plane

Juanma should not spend time repeatedly asking "¿ya está?". The system should push only decisions or blockers that need him.

Recommended control plane:

```text
P0  Engineering Gate Watch
P1  Preview / Deployment Watch
P1  Human Visual QA Needed
P1  Regression Watch
P2  Documentation / Capability Drift
P2  Market / Competitor Intelligence
P2  Content Opportunity Watch
P3  Portfolio Hygiene / stale PRs / stale branches
```

Every watcher must state:
1. object being watched;
2. source of truth;
3. frequency;
4. material-change condition;
5. silent condition;
6. notification payload;
7. human authority required;
8. stop condition.

## 4. Rubik Sota — high-value automation pattern

Rubik Sota is especially suitable because its quality gates combine implementation, visual precision, QA evidence and human approval.

Recommended watchers:

### RS-CI-WATCH
Watch CI/build status. Notify only on green or on a real blocker requiring implementation work.

### RS-VISUAL-QA-WATCH
Notify Juanma when the exact candidate build is ready for human visual comparison. Never approve visual quality autonomously.

### RS-DEPLOY-WATCH
Verify the preview corresponding to the audited SHA is available and not a stale deployment.

### RS-REGRESSION-WATCH
Notify when a new change breaks an already frozen visual/behavioral contract.

### RS-HUMAN-GATE-WATCH
When all machine gates are satisfied, notify: "READY FOR JUANMA". Do not merge or publish.

Permanent Rubik Sota rule:

> **Automate the control of the gate, never the authority to cross the gate.**

## 5. Museum — canonical engineering watcher

Museum produced the reference pattern:

```text
IMPLEMENT
↓
PLAYWRIGHT
↓
IS FAILURE REAL?
├── YES → agent fixes product
└── NO / harness limitation → human quick QA
↓
VERCEL PREVIEW OF EXACT CANDIDATE
↓
FULL HUMAN AUDIT
↓
JUANMA APPROVES OR RETURNS CHANGES
```

Recommended Museum watchers:
- Phase QA Green Watch;
- Phase 1 Regression Watch;
- Vercel Preview Ready Watch;
- PR Mergeability Watch;
- Human QA Required Watch;
- Canonical Registry Drift Watch;
- accessibility regression watch;
- preview ENTER → USE → EXIT → RESUME regression watch.

A QA failure must be classified before notification:

```text
REAL PRODUCT ERROR
→ agent must fix

HARNESS / HEADLESS INTERACTION LIMITATION
→ ask Juanma for a 2-minute manual validation

GREEN
→ provide exact SHA + verified preview for human audit
```

## 6. Sarah Katerina — intelligence and operating watchers

Recommended recurring/condition tasks:

### SK-COMPETITOR-WATCH
Check priority buyer-agent competitors and notify only on material changes in positioning, offer, landing pages, ads, content formats or credibility signals.

### SK-SEO-WATCH
Monitor available first-party SEO signals and notify on meaningful indexing, technical or visibility changes. Never invent GA/GSC/Ads numbers when access is unavailable.

### SK-CONTENT-OPPORTUNITY-WATCH
Watch UK/NL and other approved-market conversations around buying/living in Spain and surface high-confidence content opportunities.

### SK-CREDIBILITY-WATCH
Track missing/changed trust sources, institutional references and proof signals relevant to search engines, AI answers and buyers.

### SK-WEB-QA-WATCH
Notify when landing/page candidate is ready for Juanma's visual and messaging review.

### SK-CAMPAIGN-WATCH
Where connected data exists, detect significant campaign changes. Do not silently optimize spend without explicit authority.

## 7. Escaparates Pro — portfolio supervision

Recommended watchers:
- open PR health;
- stale branches / phases waiting for decision;
- Vercel deployment failures;
- regression failures across frozen modules;
- capability duplication / drift against registries;
- new reusable capability discoveries from repository archaeology;
- documentation gaps where code exists but canonical registry is missing.

Escaparates Pro should eventually expose a portfolio-level Automation Registry rather than isolated chat reminders.

## 8. Generic Automation Spec

Every project watcher should be documented in this format:

```yaml
id: <PROJECT>-<WATCHER>
name: <human-readable name>
mode: one-shot | recurring | condition-watch
project: <project>
owner: Juanma
source_of_truth:
  - <GitHub / Vercel / Gmail / public web / other connected source>
check:
  condition: <what is evaluated>
  material_change: <what deserves notification>
  silent_when: <when no notification is sent>
classification:
  real_error: <agent action>
  qa_manual: <human quick check>
  ready: <human gate>
human_authority:
  required_for:
    - visual approval
    - merge
    - publish
stop_condition: <when monitoring ends>
```

## 9. Automation Registry

Recommended project table:

| ID | Project | Watcher | Mode | Source | Notify when | Human gate |
|---|---|---|---|---|---|---|
| MUSEUM-QA | Museum | Phase QA | condition | GitHub Actions | green / real error / manual QA | visual approval |
| MUSEUM-DEPLOY | Museum | Preview Ready | condition | Vercel | exact candidate deploy ready | audit |
| RS-VISUAL | Rubik Sota | Visual candidate | condition | build + QA | candidate ready | visual authority |
| SK-COMP | Sarah Katerina | Competitors | recurring/condition | public web | material change | strategy decision |
| EP-PORTFOLIO | Escaparates Pro | Portfolio health | recurring | GitHub/Vercel | blockers/stale work | prioritization |

## 10. Prompt patterns Juanma can use

No special command is required. Natural language is enough.

### Condition watch
> Supervisa esta PR y avísame cuando todos los gates estén verdes. Si falla por error real, dime exactamente cuál; si es sólo harness y puedo validarlo manualmente en dos minutos, pídeme esa validación. Si no cambia nada, no me avises.

### Recurring intelligence
> Cada lunes revisa los cambios materiales de los competidores prioritarios de Sarah Katerina. No me mandes un informe si no existe una señal nueva que pueda cambiar una decisión.

### Deployment gate
> Vigila el deployment de esta rama y avísame sólo cuando el preview del SHA candidato esté READY y cargue la ruta exacta que debo auditar.

### Portfolio control
> Cada viernes revisa PRs abiertas y fases no cerradas de Escaparates Pro. Avísame sólo de bloqueos, trabajo estancado o decisiones que requieran mi autoridad.

## 11. Anti-patterns

Do not create a watcher when:
- the task can be completed immediately;
- it would notify on every run regardless of change;
- the source of truth is unavailable;
- it would make a visual/merge/publishing decision reserved for Juanma;
- it creates duplicate monitoring already covered by another watcher;
- the condition is too vague to classify reliably.

Never use automation to hide uncertainty. If a source is unavailable or stale, the watcher must say so.

## 12. Playbook integration — MUST rules

1. Every autonomous project may define an `AUTOMATION & MONITORING` layer.
2. Watchers are project capabilities and must be registered, not left as undocumented chat behavior.
3. The watcher must preserve project governance and human authority.
4. Condition watchers should be silent when no material change exists.
5. Engineering watchers must classify **real product error vs QA/harness limitation vs ready**.
6. Human visual approval remains mandatory wherever the project contract requires it.
7. A green CI result does not equal product approval.
8. A deployment URL must correspond to the exact audited candidate/branch/SHA.
9. Monitoring must stop when its gate is closed or the watcher is superseded.
10. Future agents must read the project Automation Registry before creating a duplicate watcher.

## 13. Operating principle

```text
AUTOMATE OBSERVATION
AUTOMATE REPETITION
AUTOMATE ESCALATION

DO NOT AUTOMATE
JUANMA'S VISUAL AUTHORITY
FINAL PRODUCT DECISIONS
MERGE AUTHORITY
PUBLISHING AUTHORITY
```

This protocol is reusable beyond Museum. Museum is the first validated case that made the Automation Layer explicit.