# CASEBOOK PRO V3 — PHASE 3F / FASHION SPATIAL SCENE LAB

## Status
ISOLATED DEVELOPMENT LAB. Fashion is the only active Phase 3 vertical. Real Estate, Museum, Institutional and future kits are explicitly deferred until Fashion is visually and functionally approved.

## Frozen baseline
Cloned from Casebook PRO V3 Phase 2 product commit `a7776bf8ad0e653c96c8dad6da3cbabb64d86bca`.

The original V3 folder, V2, V1.1 and master are forbidden baselines for this phase.

## Product invariant — Spatial World in five steps
1. WORLD — define the spatial world and Fashion scene language.
2. SPACES — create Chapters / environments.
3. HOTSPOTS — place INFO, MEDIA, PORTAL, ACTION and STORY interactions using visual placement and stable anchors.
4. WORLD MAP / ROUTE — understand the world and author the journey.
5. EXPERIENCE — Explore / Guided Tour / Story / Present / Record.

Three.js exists to elevate these five steps. It must never turn the product into a generic 3D demo.

## Fashion Phase 3 objective
Replace the inherited detective/corkboard visual metaphor with an authored Fashion Spatial Scene System while preserving Casebook data, navigation, Story, Presentation, Recording, export/import and rollback.

## Fashion scene families
- BLACK RUNWAY — deep black showroom/runway, authored light, large imagery, controlled reflection, spatial typography.
- WHITE EDITORIAL STUDIO — cyclorama/studio, soft editorial lighting, floating prints and publication objects.
- CAMPAIGN WALL — 2.5D spatial editorial spread with asymmetry, oversized typography and controlled image crops.
- MATERIAL LIBRARY — textile/material/accessory/reference system with physical scale and material identity.

## Semantic model
The Fashion renderer does not think in corkboard metaphors.

Legacy visual metaphor → Fashion semantic object:
- card → CONTENT OBJECT
- pin → ANCHOR
- thread → RELATIONSHIP
- post-it → ANNOTATION / COPY OBJECT
- board → SPACE / SCENE
- link endpoint → SEMANTIC SOCKET

Fashion content subtypes:
`look`, `garment`, `material`, `campaign`, `reference`, `talent`, `location`, `copy`, `product`, `mood`.

Fashion relationship subtypes:
`inspired-by`, `styled-with`, `material-of`, `variation-of`, `campaign-for`, `paired-with`, `selected-for`, `approved-by`.

## Visual object families — no primitive slop
A primitive may be used internally as collision/hit geometry, but not accepted as final authored appearance merely because it is 3D.

CONTENT OBJECTS
- Floating Print — paper thickness, edge response, micro roughness, controlled shadow gap.
- Editorial Lightbox — frame, acrylic/glass layer, controlled emission, internal image plane.
- Magazine Spread — paired pages, spine, subtle page curvature, publication hierarchy.
- Film Frame — image, physical border, numbering/metadata sockets.
- Look Panel — image-led Fashion object with look / collection / material metadata.
- Material Sample — thickness, edge, scale-correct surface identity and semantic material socket.
- Copy Object — typography as a spatial object, not text trapped inside a generic card.

ANCHORS
- Registration Mark
- Edge Tab
- Baseline Tick
- Magnetic Clip only where the physical metaphor is appropriate
- Invisible Semantic Anchor

RELATIONSHIPS
- Editorial Rule
- Art Direction Spline
- Sequence Track
- Reference Baseline
- Ghost / Focus-only Link

## Hotspot invariant
Interaction region and visual marker are separate.
A complete object or doorway may be clickable while the visual marker is `none` in Explore mode.
States: EDIT, IDLE, HOVER, ACTIVE, VISITED, HIDDEN, NEXT-TOUR.

## Camera language
Camera is authored, not a passive viewport.
Shot intents: ENTRY, HERO, OVERVIEW, DETAIL, PORTAL, EXIT.
Fashion presets: editorial crop, snap push, lateral track, detail push, runway reveal, object continuity.
Framing derives from semantic subject bounds / desired screen occupancy rather than one fixed distance.

## Transition language
- EDITORIAL CROP — source image becomes the next composition.
- OBJECT CONTINUITY — selected content persists across scene handoff.
- CAMPAIGN IMAGE DIVE — image/detail becomes a destination space.
- SCREEN PORTAL — display/media becomes another Space.
- CONTROLLED WIPE / MASK — shader-backed only when it improves semantic continuity.

Shaders are never decorative defaults.

## Technical-art references and responsibilities
- `threejs-journey`: camera, raycasting, lights, shadows, realistic render, shaders, post, performance, HTML/WebGL integration.
- `Threejs-Awesome-Graphics-Agent-Skills`: authored camera direction, procedural materials/geometry, exposure/color, visual validation and anti-cheap-graphics mechanisms.
- `img2threejs`: quality-gated object construction passes and semantic runtime hierarchy/pivots/sockets.
- `gsap-threejs-codrops`: GSAP/Flip visual continuity, SplitText/editorial motion and shader-uniform timing.
- `webGLImageTransitions`: source/destination texture + progress + mask/displacement transition architecture.
- 3D configurator references: semantic part selection, direct object interaction, product lighting/environment/contact shadow patterns.
- holographic material references: restricted to functional signal states, never the global Fashion look.
- procedural environment references: grammar/theme separation, deterministic composition, instancing and performance budgets.
- `open-design`: Fashion/Editorial/Brutalist creative direction and composition vocabulary.
- `design-system`: semantic visual tokens and future Brand DNA compatibility.
- `power-design`: UX hierarchy, progressive disclosure, interaction states, legibility and density guardrails.
- scrolling/GSAP references in Escaparates Pro: cinematic pacing and scroll/timeline patterns where useful, without coupling the Fashion engine to a single presentation mode.

## Construction pipeline
Every major Fashion visual system is built and reviewed in passes:
SPEC → BLOCKOUT → STRUCTURE → FORM → MATERIAL → LIGHTING → INTERACTION → OPTIMIZATION.

A pass cannot use post-processing to hide weak form/material work.

## Anti-slop constitution
Reject:
- generic cubes/rectangles/diamonds as final visual language without authored reason;
- flat roughness or disconnected PBR noise;
- ambient-only lighting;
- bloom/glow carrying the underlying form;
- arbitrary connections crossing visual content;
- floating hotspot badges unrelated to the scene;
- inconsistent physical scale;
- gratuitous particles/shaders/transitions;
- random procedural composition without an authored Fashion grammar.

## Visual validation contract
For each accepted scene family capture at minimum:
- final hero;
- no-post baseline;
- flat-material / structure diagnostic where relevant;
- grazing-light/material diagnostic;
- close, design-distance and far views;
- motion/transition evidence;
- renderer/performance budget.

Browser interaction QA must verify the unchanged product contract: create/switch Space, INFO hotspot, PORTAL hotspot, World Map, Guided Tour, Story, Present, Record, export/import.

## Release rule
Fashion Phase 3 does not merge into V3 or master until explicit human visual/functional approval. The original V3 remains directly comparable throughout development.
