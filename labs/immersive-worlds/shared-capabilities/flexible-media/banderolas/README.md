# Banderolas / Flexible Media — Type B integration

Status: **visual approval pending**.

## Canonical placement

`Escaparates Pro → Immersive Worlds → Shared Capabilities → Flexible Media / Dynamic Fabric`

The final top-level UI placement remains pending Juanma approval. During visual review, the existing RUBIK SOTA catalog card is kept only as a temporary entry point to `banderolas-tool.html`; it is not the canonical architecture classification.

## Integration rule

`PRESERVE LOCAL SOURCE → ADAPTER → PANEL → QA → APPROVAL`

## Preserved source

Source repository: `Juanmaes83/BANDEROLAS-DINAMICAS`

Approved candidate branch: `preview-output-v2`

Pinned commit: `538146f7ec2ddbd056b55da0ed0eb8a1cf96ef83`

Exact preserved source lives in:

`labs/immersive-worlds/shared-capabilities/flexible-media/banderolas/source/`

Git blob identities:

- `index.html` — `9fc683b9e988a56a8426d094bde3c4bcaa25e372`
- `output-enhancer-v2.js` — `e496e414b5ae7d77c82583ad1a071c1ee42c52f5`
- `index-output-v2.html` — `4cb27137abba038d87d025db48b4967ba1185a84`

GitHub Actions checks out the pinned source commit, verifies the blobs, copies the files byte-for-byte and verifies them again after preservation. The preserved source is not rewritten to connect Escaparates Pro.

## Adapter

The authoring host loads the preserved local `index-output-v2.html` wrapper through a same-origin iframe. Output V2 then loads its preserved `index.html` and `output-enhancer-v2.js` normally.

The outer Escaparates panel connects through a thin same-origin DOM adapter:

- content fields delegate to the original engine fields;
- media delegates to the original `media-upload` input;
- size/X/Y delegate to Output V2 `mediaScale`, `mediaX`, `mediaY`;
- Standalone HTML delegates to Output V2 `downloadHtml`;
- Embed delegates to Output V2 `copyEmbed`;
- the original canvas remains the source for PNG and WebM capture;
- Escaparates ProjectStoreLocal / ProjectVersioning provide project-level save, restore and snapshots.

There is no runtime GitHub/jsDelivr fetch, no `srcdoc`, no source-string rewriting and no injected physics/shader implementation.

## Panel

The Type B panel exposes:

- Project: Save / Restore / Create version / Original;
- Media: image/video upload, remove and preview;
- Content: title, case/reference, date, note/content and signature;
- Flexible Media: size `0.50–2.50x`, X/Y `±300`;
- Output: PNG, WebM 30/60 FPS, Standalone HTML, Project JSON, Embed, Preview Clean and fullscreen.

## Protected zones

Do not rewrite:

- WebGL shaders;
- Verlet / cloth physics;
- mouse/touch deformation;
- original WebGL render loop;
- original media-to-texture behavior;
- Output V2 controlled `drawImage` media transform patch.

## QA

GitHub Actions workflow: `.github/workflows/banderolas-local-source-qa.yml`.

Current automated gates include:

1. exact source commit checkout;
2. source Git blob verification;
3. byte-for-byte local preservation;
4. copied blob verification;
5. `node --check` for registry and adapter;
6. Type B architecture contract;
7. Chromium runtime startup;
8. nested preserved Output V2 + engine availability;
9. WebGL canvas dimensions;
10. Output V2 enhancer readiness;
11. outer panel → original title propagation;
12. outer panel → Output V2 media-scale propagation;
13. PNG canvas capture.

Manual approval still required for physics/drag feel, real image/video uploads, WebM 30/60, standalone/export usability, responsive behavior and overall visual fidelity.

## Merge policy

No merge into `master` without explicit Juanma visual approval.