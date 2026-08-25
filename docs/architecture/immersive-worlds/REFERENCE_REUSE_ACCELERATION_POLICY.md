# Immersive Worlds — Reference Reuse & Acceleration Policy

> **Status:** PRODUCT OPERATING DOCTRINE — EXPLICIT JUANMA DIRECTION, pending incorporation into the final approved IW baseline.
> **Scope:** Immersive Worlds research, implementation, QA, Scene Kits, tooling and future verticals.
> **Principle:** **BE SMART, BE AMBITIOUS, REUSE BEFORE REINVENTION — AND BE LEGAL.**

---

## 0. Why this policy exists

Immersive Worlds has access to an unusually strong internal reference library: engine architectures, Three.js systems, museum/gallery implementations, camera systems, performance tooling, deterministic QA, animation skills, spatial graphs, authoring patterns, quality loops and anti-slop tooling.

That library is not a moodboard.

It is not merely a set of aesthetic references.

It is an **implementation advantage**.

The project must use that advantage aggressively and intelligently.

The default mindset is therefore **not**:

```text
REFERENCE EXISTS
→ read it
→ understand it
→ rewrite everything from zero
```

The preferred mindset is:

```text
PROBLEM
→ SEARCH OUR REFERENCE LIBRARY FIRST
→ FIND THE STRONGEST EXISTING SOLUTION / PATTERN / TOOL
→ VERIFY RIGHTS + ARCHITECTURAL FIT
→ REUSE / PORT / ADAPT / COMPOSE WHEN IT IS BETTER
→ INTEGRATE THROUGH IW CONTRACTS
→ TEST
→ RECORD PROVENANCE
```

Reimplementation from scratch requires a reason.

---

# 1. Core doctrine

## REUSE BEFORE REINVENTION, WHEN LEGAL AND ARCHITECTURALLY SOUND

Immersive Worlds should prefer a proven implementation over a weaker new implementation when all of the following are true:

- the source can legally be reused or adapted;
- the specific file/asset rights are compatible;
- the implementation materially saves time, reduces risk or raises quality;
- it can be adapted without violating approved IW contracts;
- provenance and obligations can be recorded clearly;
- the adapted result can be tested independently.

There is no product value in rewriting a solved problem merely to make the code "ours".

Independence means that **IW owns its contracts, product model and integration boundaries**. It does not mean every algorithm, utility, QA tool or rendering technique must be rewritten from first principles.

---

# 2. Ambition rule

Agents working on Immersive Worlds are expected to be **ambitious and resourceful**.

They should actively ask:

- Has this problem already been solved in one of our reference repositories?
- Is there a stronger implementation than the one I am about to write?
- Can I port a tested subsystem rather than invent a weaker substitute?
- Can existing tooling eliminate a whole class of work?
- Can multiple compatible references be composed behind an IW contract?
- Can I reuse an existing test harness, profiler, capture pipeline, camera algorithm, room lifecycle or material system?
- Is there a skill or procedure that should be loaded before solving this subsystem?

A technically acceptable result is not enough if a substantially stronger solution already exists in our approved reference library and could legally be adapted with reasonable effort.

---

# 3. Four legitimate reference-use modes

## 3.1 DIRECT REUSE

Use when code is legally reusable, architecturally compatible and already solves the problem well.

Examples may include:

- utilities;
- deterministic QA helpers;
- capture tooling;
- profiling tools;
- generic Three.js helpers;
- lifecycle utilities;
- algorithms;
- licensed shaders;
- camera/framing logic;
- supporting infrastructure.

Process:

```text
VERIFY LICENSE
→ VERIFY FILE/ASSET RIGHTS
→ PIN SOURCE / VERSION / SHA
→ RECORD OBLIGATIONS
→ ISOLATE
→ INTEGRATE THROUGH IW CONTRACT
→ TEST
```

Direct reuse is not a failure of originality. When appropriate, it is efficient engineering.

## 3.2 ADAPT / PORT

Use when the implementation is strong but coupled to another product metaphor, framework or domain.

Examples:

```text
Artwork CameraManager
→ generic FocusableEntity camera behaviour

Portfolio RoomWarmup
→ generic Space warmup/lifecycle

Game capture harness
→ Immersive Worlds deterministic visual QA

Museum add-to-wall API
→ semantic placement / Anchor authoring
```

The source implementation may be transformed substantially while preserving useful mechanisms.

## 3.3 COMPOSE

Use when no single repository contains the full answer, but compatible strengths can be combined behind an IW-owned contract.

Example:

```text
Focus Camera contract
+
artwork-3D-museum framing approach
+
TheVertMenthe interaction behaviour
+
IW CameraAuthority
+
IW deterministic QA
```

Composition is encouraged when responsibilities remain clear and there is no reference soup.

## 3.4 PATTERN / KNOWLEDGE ONLY

Use when direct reuse is not legal, rights are unclear, or the implementation is too product-specific.

We may still extract:

- architecture;
- sequencing;
- state models;
- interaction grammar;
- performance lessons;
- visual quality bars;
- failure modes;
- construction workflows.

This is the fallback mode, not the default assumption for every repository.

---

# 4. Reference library is an implementation search space

Before implementing a meaningful subsystem, Fable / Claude Code / any implementation agent should search the Reference Ledger and relevant repositories.

The question is not:

> "Which repository can I force into this feature?"

The question is:

> "What is the best existing solution to the problem I am solving, and can it be legally and cleanly integrated into IW?"

This applies especially to:

- camera;
- navigation;
- focus;
- gallery architecture;
- lighting;
- materials;
- Room/Space lifecycle;
- shader warmup;
- asset loading;
- device tiers;
- deterministic QA;
- screenshot capture;
- image diff;
- profiling;
- world graph;
- authoring;
- animation/motion;
- portal transitions;
- audio transport;
- accessibility patterns;
- anti-slop review;
- adversarial quality comparison.

---

# 5. Priority repositories and how boldly to use them

This section does not override `REFERENCE_LEDGER.md`; it defines the expected implementation attitude toward the library.

## Claude-of-Duty

Treat as a potential **source of reusable engine discipline and QA tooling**, not merely conceptual inspiration.

Investigate real implementations of:

- capture;
- shot sets;
- deterministic baselines;
- image diff;
- profiling;
- hitch attribution;
- playtesting;
- shader prewarm;
- subsystem lifecycle;
- ownership enforcement.

If the license and exact files permit reuse and the implementation fits IW, port/adapt them instead of rebuilding inferior equivalents.

## threejs-game-skills

Treat as an **execution playbook and tooling library**.

Relevant skills should be loaded when the corresponding problem appears. Do not rederive known Three.js QA, rendering, profiling or technical-art procedures from scratch if an appropriate skill already exists.

## portfolio-itom-and-advanced-WebGL

Treat as a serious implementation reference for:

- RoomWarmup;
- shader precompilation;
- room lifecycle;
- device tiering;
- adaptive DPR;
- loading strategy;
- hybrid DOM/WebGL architecture;
- performance-sensitive state handling.

MIT-compatible implementation may be adapted when verified and useful.

## artwork-3D-museum

Treat as a serious implementation source for Museum/Institutional interaction.

Inspect the actual camera and room code, not just README summaries.

Compare its focus behaviour directly with IW's implementation. Where its algorithm is stronger and legally reusable, port/generalize it behind IW contracts.

## 3D-art-gallery-threejs

Use the implementation and commit history as an **accelerated construction laboratory** for gallery architecture, scale, materials, lighting, placement and navigation.

Do not merely compare screenshots. Study how the scene became convincing and apply the strongest reusable mechanics to the Museum Scene Kit.

## 3DArtMuseum

Use its data-driven placement model aggressively as evidence for thin authoring and placement semantics. Evolve the concept rather than recreating hard-coded placement systems.

## MengTo skills / Kage / GSAP Three.js references

Use relevant skills and code/procedures where rights permit for camera grammar, transition systems, continuous worlds, editorial motion and performance-conscious storytelling.

Do not import Kage's visual identity. Reuse mechanisms, not brand/style.

## a-long-expected-party

Inspect real transport/audio/timeline implementation before building parallel equivalents. Reuse/adapt legal generic mechanisms when they fit the Experience Director contract.

## Unslop

Do not reduce Unslop to a manually remembered checklist.

Where practical, **run the actual workflow/tooling** to generate domain-specific analysis and anti-slop guidance for Immersive Worlds / Museum / Institutional work.

Use its outputs as evidence, not as a replacement art direction.

## Gauntlet Loop

Do not treat Gauntlet as a metaphor.

Use the actual methodology/tools/prompts where appropriate:

```text
NAMED REAL BAR
→ BUILDER
→ FRESH CRITIC
→ REAL ARTIFACT COMPARISON
→ ITERATE WHEN OURS LOSES
```

## img2threejs

Use its build-pass methodology as an active production accelerator:

```text
SPEC
→ BLOCKOUT
→ STRUCTURE
→ FORM
→ MATERIAL
→ LIGHTING
→ INTERACTION
→ OPTIMIZATION
```

## specialist graph / transition / showroom references

Use them when the corresponding problem exists. Do not defer useful code merely because a repo is labelled specialist rather than core.

---

# 6. Legal does not mean timid

**Legal caution must never become engineering paralysis.**

A permissive license exists to permit reuse under its terms.

When a source is MIT / BSD / Apache / CC-compatible or otherwise permits the intended reuse:

- use it if it improves the project;
- preserve notices/attribution;
- track source and version;
- respect modification/distribution obligations;
- keep third-party ownership clear.

If code is unlicensed, proprietary, unclear or incompatible, do not copy it directly.

If assets have separate rights, treat those rights separately from the repository's source-code license.

The project must distinguish:

```text
CODE RIGHTS
≠
ASSET RIGHTS
≠
BRAND / TRADEMARK RIGHTS
≠
QUALITY-REFERENCE USE
```

---

# 7. Provenance requirement

Any non-trivial direct reuse or adaptation should be traceable.

Record at minimum:

- source repository;
- source URL/path;
- commit/tag/version;
- license;
- asset-specific rights if applicable;
- files/algorithms reused or adapted;
- target IW subsystem;
- nature of transformation;
- attribution/notice requirements;
- why reuse was preferable to reimplementation.

This record may live in the Reference Ledger, vendor record or implementation ADR depending on the case.

Traceability is a speed enabler: it lets future agents reuse confidently instead of repeating legal/research work.

---

# 8. Architectural fit gate

Legal reuse is necessary but not sufficient.

A reused implementation must not silently override an approved IW contract.

Authority remains:

```text
JUANMA CURRENT PRODUCT DECISION
↓
APPROVED IW CONTRACT / ADR
↓
PRIMARY REFERENCE
↓
SECONDARY REFERENCE
↓
IMPLEMENTATION CONVENIENCE
```

When source code conflicts with IW architecture, adapt the source to IW — not IW to the source — unless Juanma explicitly approves an architectural change.

---

# 9. Quality and speed test

The implementation agent should prefer reuse/adaptation when one or more are true:

- it saves meaningful implementation time;
- it is more mature than a fresh implementation;
- it has already survived browser/visual/performance use;
- it handles edge cases we would otherwise rediscover;
- it gives us stronger deterministic QA;
- it substantially improves visual quality;
- it lowers integration risk;
- it accelerates experimentation;
- it provides a stronger base for Gauntlet iteration.

Do not reuse merely to reduce line count.

Do not rewrite merely to increase originality.

Choose the path that produces the strongest product fastest without compromising legality or architecture.

---

# 10. Anti-patterns

## Too timid

```text
"The repo is only inspiration."
"I should rewrite this to be safe even though it is MIT."
"I will implement a smaller custom version without checking the existing one."
```

Reject this when legal, proven reuse would be stronger.

## Too reckless

```text
"We own a fork, therefore everything is ours."
"The repo is MIT, therefore all bundled art/models/music are MIT."
"This code looks useful, copy it now and investigate later."
```

Reject this completely.

## Reference soup

```text
Repo A technique
+ Repo B architecture
+ Repo C state model
+ Repo D helper
```

without clear subsystem ownership or conflict resolution.

References solve problems. They do not create architecture by accumulation.

---

# 11. Expected Fable / implementation-agent behaviour

When starting a milestone or subsystem, an implementation agent should autonomously:

1. understand the product objective and approved IW contracts;
2. identify the problem being solved;
3. inspect the Reference Ledger;
4. inspect the strongest relevant repositories and exact source when needed;
5. determine whether direct reuse, adaptation, composition or patterns-only is best;
6. verify relevant license/rights before direct reuse;
7. choose the most effective legal path;
8. implement through IW-owned contracts;
9. test against invariants and real browser evidence;
10. record provenance and material decisions;
11. compare against the named quality bar;
12. iterate when the result is weaker.

The agent should not repeatedly ask Juanma for ordinary implementation choices that can be resolved through repository evidence, licenses, tests and IW contracts.

It should stop only for true product/architecture conflicts, protected-baseline changes, unclear rights, shared/global changes, integration or merge gates.

---

# 12. Strategic objective

The repository library should compound over time.

Every useful solved subsystem should make the next Immersive Worlds milestone faster.

The intended flywheel is:

```text
REFERENCE LIBRARY
→ LEGAL REUSE / ADAPTATION
→ IW CONTRACT
→ TESTED IW IMPLEMENTATION
→ QA / GAUNTLET EVIDENCE
→ NEW INTERNAL REUSABLE ASSET
→ FASTER NEXT VERTICAL
```

Museum / Institutional is not only the first template. It is the first opportunity to create reusable internal assets for every future vertical.

The ambition is not merely to finish Museum V1.

The ambition is to turn the combined repository library + IW contracts + QA system into an **engineering and creative acceleration system**.

---

## Guiding rule

> **Do not reinvent proven work by default. Search first. Reuse boldly when legal. Adapt intelligently. Keep IW contracts sovereign. Record provenance. Test everything. Build the strongest product faster.**
