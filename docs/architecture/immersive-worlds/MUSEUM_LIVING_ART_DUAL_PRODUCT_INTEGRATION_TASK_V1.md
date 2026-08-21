# MUSEUM LIVING ART — DUAL PRODUCT INTEGRATION TASK V1

> **Status:** EXECUTION TASK — HUMAN VISUAL CONTROL REQUIRED
>
> **Branch:** `claude/museum-living-art-v1`
>
> **Repository:** https://github.com/Juanmaes83/escaparates-pro
>
> **Donors:**
> - https://github.com/Juanmaes83/wet-paint-flow
> - https://github.com/Juanmaes83/van-gogh-crows
>
> **Human authority:** Juanma decides KEEP / ADJUST / REJECT.
>
> **Builder:** Claude Code.
>
> **Audit / documentation:** ChatGPT + Juanma.

---

## 1. THE REAL OBJECTIVE

Stone 4 proved that useful capabilities can be sculpted from both donor repositories.
The mission is NOT to keep producing isolated labs.

The real product objective is to convert those capabilities into reusable, configurable visual experiences in **BOTH** existing products:

### A. MUSEUM / IMMERSIVE WORLDS

Use the donor-derived capabilities as Museum effects that can be applied to artworks / framed media.

The first Museum product proof should let us evaluate them in a real Museum context, preferably through one bounded option such as:

- a new experimental room; OR
- three selected existing frames / artworks;

without destabilizing the protected Museum baseline.

The effect system must ultimately accept OUR content:

- image;
- video where technically meaningful;

so we can take an artwork/media asset and transform it using the new painterly / living / responsive capabilities.

### B. ESCAPARATES PRO

Create one or more reusable Escaparates Pro modules/effects from the same capability family.

They must follow the platform pattern already used for other adapted modules:

- isolated viewer/runtime;
- user-supplied image/video;
- panel-driven customization;
- real preview;
- reusable commercial module/effect rather than donor demo;
- final export/viewer without the internal editor.

The two destinations must share capability thinking but MUST NOT be forced into one monolithic implementation.

---

## 2. DO NOT REDISCOVER HOW OUR PRODUCTS WORK

Before implementing the next product step, use the repository as memory.

DO NOT read the entire repository.

Read only the following startup set first.

### 2.1 Escaparates Pro — required startup reading

1. `README.md`
   - focus on **Website Modules Lab** and examples of standalone adapted modules;
   - note the existing contract: isolated iframe/runtime, panel personalization, image/video media slots, final closed viewer/export.

2. `js/website-modules.js`
   - understand `EP.WebsiteModules`;
   - understand `register`, schema, media normalization, image/video handling and standalone modules;
   - reuse the existing platform contract instead of inventing a parallel one.

3. `js/website-modules-ui.js`
   - understand how the platform catalog, picker, properties panel, preview iframe and standalone modules work;
   - learn how existing modules expose customization and how the preview is opened.

Then inspect ONLY 1–3 representative approved standalone modules that are architecturally closest to this mission, for example modules that:

- preserve an upstream visual engine;
- accept image/video;
- expose a custom editor/panel;
- produce preview/export.

Choose the examples after reading the registry/UI. Do not audit all Website Modules.

### 2.2 Museum — required startup reading

Read:

1. `docs/architecture/immersive-worlds/MUSEUM_CURRENT_STATE.md`
2. `docs/architecture/immersive-worlds/README.md`
3. `docs/architecture/immersive-worlds/IMMERSIVE_WORLDS_MODULE_CONTEXT.md`
4. `docs/architecture/immersive-worlds/SCULPTING_AND_GRAFTING_METHOD.md`
5. `labs/immersive-worlds/docs/MUSEUM_VISITOR_BASELINE_V1.md`
6. `labs/immersive-worlds/docs/VIDEO_ARCHITECTURE_AUDIT.md`
7. `docs/architecture/immersive-worlds/MUSEUM_CAPABILITY_SOURCE_LIVING_ART_DONORS.md`
8. `labs/immersive-worlds/qa/evidence-painterly-chain-v1/HUMAN_REVIEW_MAP.md`

If Museum authoring / Full Museum Studio wiring becomes necessary, THEN consult — not before — the current integration documentation on:

- `integration/museum-full-studio-three-room-v1`
- `MUSEUM_FULL_STUDIO_THREE_ROOM_INTEGRATION_MISSION_V1.md`
- `MUSEUM_FULL_STUDIO_THREE_ROOM_INTEGRATION_PREFLIGHT_V1.md`

Do NOT modify that integration branch.

### 2.3 Canonical methodology

Continue to follow the Museum Visual Engineering Playbook and operative protocols already referenced by the original Living Art mission.

Do not reread every protocol at startup. Load the relevant protocol when entering that phase.

---

## 3. WHAT STONE 4 ACTUALLY PROVED

Current proven lab capabilities include:

- direction-field analysis;
- Poisson seed distribution;
- Bézier painterly stroke geometry;
- impasto / wet-paint material;
- GPGPU flock / boid simulation;
- gradient-map recoloring;
- pointer/predator response;
- direction-field → living-mark visual orientation.

Important accuracy rule:

`direction-field → mark orientation` is currently proven.

`direction-field → boid movement/flow` is NOT yet proven unless you explicitly implement and visually prove it.

Do not overclaim capability maturity.

Current state should be treated as:

`LAB-INTEGRATION-PROVEN / MUSEUM GRAFT PENDING`.

---

## 4. PRODUCT QUESTION TO SOLVE NEXT

Stop asking only:

> "Can these capabilities coexist?"

Now answer:

> "Can Juanma use our existing platforms to place his own image/video into these capabilities, adjust them, preview them, and decide whether they deserve to become real Museum effects and Escaparates Pro modules?"

That is the next mission.

---

## 5. MUSEUM PRODUCT PROOF

Design the smallest safe Museum-native proof that allows a real visual decision.

Desired outcome:

- Museum context is visible;
- one new bounded room OR three bounded artwork/frame surfaces are used;
- content source can be selected/replaced with our own image and, where meaningful, video;
- at least two or more distinct capability modes from the donor family can be compared;
- existing Museum navigation, camera authority, rooms, Guide, Breeze and Studio integration remain protected.

Do not assume the final effect taxonomy.

Potential modes for evaluation MAY include combinations such as:

- painterly reconstruction / impasto;
- progressive / temporal paint growth;
- living marks / responsive artwork;
- flock/swarm environmental layer;
- field-driven movement if genuinely implemented;
- other higher-value donor-derived modes you discover.

These are inspiration, not a closed list.

The proof must answer:

1. Can we feed an artwork/image into it?
2. Can video be used meaningfully, or should some modes be image-only?
3. Does the transformation preserve enough source identity?
4. Is the result artistically valuable inside Museum?
5. Can the visitor interaction add meaning instead of looking like a cursor demo?

---

## 6. ESCAPARATES PRO PRODUCT PROOF

Do not create a second platform.

Reuse the existing Escaparates Pro patterns.

First decide, from the current architecture, whether the strongest fit is:

- Website Module;
- Effects family module;
- one family containing multiple modes;
- or another existing first-class platform surface.

Document the decision briefly and justify it from existing repository patterns.

Then create a bounded product proof that supports:

- user-selected/uploaded image;
- user-selected/uploaded video where supported;
- preview inside Escaparates Pro;
- semantic controls (not raw shader uniforms);
- clear reset/default;
- no donor-specific assets required;
- isolated runtime;
- export path compatible with current product contract when the module reaches that maturity.

Prefer semantic controls such as:

- paint intensity;
- stroke scale;
- wetness / impasto;
- living amount;
- motion character;
- response strength;
- growth/reveal;

rather than exposing internal GPU implementation details.

Do not freeze this vocabulary before testing what works visually.

---

## 7. SCULPTURE → SURGERY

Continue the methodology:

`DONOR STONE → SCULPT CAPABILITY → PROVE CAPABILITY → SURGERY INTO RECEIVING PRODUCT`.

At this phase, **surgery** means adapting the proven capability to the contracts of Museum and Escaparates Pro without rewriting the receiving products around the donor.

Rules:

- donor repositories remain read-only;
- preserve provenance;
- receiving product owns orchestration;
- capability owns only its bounded visual runtime;
- do not duplicate media systems, camera authority, persistence, navigation or export systems when an existing contract already exists;
- reuse before reinventing.

---

## 8. EXECUTION LOOP — MANDATORY

Work in continuous bounded loops.

For each product surface:

`READ EXACT CONTRACT`
→ `IMPLEMENT MINIMUM VERTICAL`
→ `RUN REAL BROWSER`
→ `PLAYWRIGHT FUNCTIONAL QA`
→ `CAPTURE VISUAL/TEMPORAL EVIDENCE`
→ `LOOK AT THE RESULT`
→ `ADJUST`
→ `RERUN`
→ `FRESH CRITIC / INDEPENDENT CRITIC`
→ `HUMAN REVIEW PACKAGE`.

Do NOT stop at automated PASS.

Do NOT send Juanma a Human Gate until the result is visually defendable.

A screenshot is not enough for motion-critical behavior.

Capture video or meaningful temporal evidence.

---

## 9. HUMAN VISUAL CONTROL — NON-NEGOTIABLE

Every major checkpoint must give Juanma a surface he can actually open and navigate.

Do not say "Human Review Ready" unless you provide:

- exact product/surface name;
- branch;
- exact commit SHA;
- exact runnable URL/path;
- exact local start command if no hosted preview exists;
- trailing-slash / routing requirements if relevant;
- what Juanma should click/do;
- what he should look for;
- known limitations;
- evidence folder;
- requested verdict: KEEP / ADJUST / REJECT.

Before delivery, test the SAME review route you give Juanma.

Agent-only Playwright harness success is not sufficient.

If the Human runtime differs from the Playwright harness, verify both.

---

## 10. CHECKPOINT LINKS REQUIRED

The mission should eventually expose at least these three review surfaces:

### A. CAPABILITY LAB

The evolving donor-derived lab / proof.

### B. MUSEUM PREVIEW

A navigable Museum-native preview showing the effect on real artwork/media surfaces.

### C. ESCAPARATES PRO PREVIEW

A navigable Escaparates Pro preview showing the new module/effect through the existing product UI/panel.

For each one report:

`WHAT IT IS`
`WHERE IT LIVES`
`OPEN`
`HOW TO TEST`
`WHAT WORKS`
`WHAT IS STILL EXPERIMENTAL`
`WHAT MUST NOT HAVE CHANGED`.

---

## 11. SAFETY

Do NOT:

- modify `main` / `master`;
- merge;
- modify donor repos;
- modify `integration/museum-full-studio-three-room-v1`;
- destabilize the protected Museum baseline;
- rebuild Breeze;
- replace current Museum camera/navigation/world authorities;
- build a second media library for Escaparates Pro if the current one can be reused;
- silently register experimental code as production-ready;
- claim Museum integration from a standalone lab;
- claim field-driven flock movement unless it is really implemented.

Use isolated work and rollback-safe commits.

---

## 12. FIRST EXECUTION PLAN

### PHASE 1 — PRODUCT ARCHAEOLOGY, BOUNDED

Read the exact startup documents above.

Then identify:

- the proven Escaparates Pro pattern closest to this work;
- the proven Museum media/artwork pattern closest to this work;
- the smallest existing contracts needed for image/video injection;
- where panels/controls already live;
- where an effect/module should register;
- what can be reused without touching stable product behavior.

Produce a short PORT / ADAPT / DO-NOT-TOUCH map.

This is a checkpoint, not an automatic stop.

### PHASE 2 — ESCAPARATES PRO MINIMUM VERTICAL

Create one bounded module/effect proof using the existing panel/media/preview pattern.

It must accept at least one user image.

If video is technically valid for that mode, prove video too.

Expose only enough semantic controls to judge the capability.

Run full visual loop.

### PHASE 3 — MUSEUM MINIMUM VERTICAL

Create one isolated Museum-native proof:

- new experimental room OR bounded artwork/frame targets;
- image injection first;
- video where meaningful;
- multiple modes/combinations if the architecture supports them safely.

Do not modify current product authority merely to simplify integration.

Run full visual loop.

### PHASE 4 — CROSS-PRODUCT CAPABILITY REVIEW

Compare what should remain shared capability code versus what must remain destination-specific adapters.

Do not create a generic framework prematurely.

### PHASE 5 — HUMAN GATE

Only after both product previews are navigable and visually inspected:

Deliver Juanma:

1. Capability Lab URL/path
2. Museum Preview URL/path
3. Escaparates Pro Preview URL/path
4. exact branch + SHA
5. evidence folders
6. concise change summary
7. known limitations
8. KEEP / ADJUST / REJECT questions for each surface.

No merge.

---

## 13. SUCCESS CRITERIA

This mission succeeds when Juanma can personally do the following without reading code:

### In Escaparates Pro

- open the product;
- find the new module/effect through the real platform UI;
- provide/select his own image or video;
- adjust meaningful controls;
- see the result in real time;
- decide whether it has commercial/creative value.

### In Museum

- open a real Museum preview;
- navigate to the experimental surface/room;
- see our own artwork/media transformed by donor-derived capabilities;
- observe motion/interaction in context;
- compare meaningful modes if available;
- decide whether the capability deserves deeper Museum integration.

The goal is NOT "two donor repos integrated".

The goal is:

**A reusable living/painterly visual capability family that our existing platforms can feed with our own media, control, preview, evaluate and eventually export — with Human visual authority at every major gate.**

---

## 14. CURRENT HUMAN DECISION AUTHORITY

Juanma remains the visual/product authority.

Claude may continue autonomous bounded work while it is safe and reversible.

Claude must NOT decide by itself that:

- Stone 5 is product-approved;
- Museum integration is final;
- an Escaparates Pro family/module is production-approved;
- a branch should merge.

Final product decisions remain KEEP / ADJUST / REJECT by Juanma after real visual navigation.