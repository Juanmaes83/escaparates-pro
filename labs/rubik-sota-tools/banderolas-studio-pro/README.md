# Banderolas Studio PRO

Status: TYPE B / visual review pending

## Placement

`Escaparates Pro → RUBIK SOTA → Banderolas Studio PRO`

Banderolas is classified as an Advanced Integrated Tool rather than an Immersive World. Its reusable capability is flexible/dynamic media, but the product is preserved first as a complete authoring tool.

## Canonical source

- Repository: `Juanmaes83/BANDEROLAS-DINAMICAS`
- Canonical branch: `preview-output-v2`
- Canonical commit: `538146f7ec2ddbd056b55da0ed0eb8a1cf96ef83`
- Engine entrypoint: `index.html`
- Output V2 reference: `index-output-v2.html`
- Output enhancer reference: `output-enhancer-v2.js`

`preview-output-v2` is 9 commits ahead of `preview-output-v1` and 0 behind. Output V2 documents Record/Stop, 30/60 FPS, PNG, Preview Clean, Save/Restore, Standalone HTML, Copy Embed and media scale/X/Y while explicitly protecting shaders, Verlet/cloth physics, original upload, mouse interaction and WebGL rendering.

## Integration rule

`PRESERVE ENGINE → ADAPTER → ESCAPARATES AUTHORING → MODULE PRO`

The Type B host fetches the immutable canonical `index.html` at the pinned commit and injects a narrow in-memory bridge. The original repository is not modified.

## Custom panel

- Project: Save / Restore / Create version / Original.
- Media: image or video upload, remove, preview.
- Content: title, case/reference, date, main note/content, signature.
- Media transform: scale 0.50–2.50x, X/Y ±300.
- Output: 30/60 FPS, PNG, WEBM, Standalone HTML, Project JSON, temporary Embed, Preview Clean, fullscreen.

## Protected engine zones

Do not rewrite:

- WebGL shaders.
- Verlet / cloth physics.
- mouse interaction and deformation.
- WebGL rendering loop.
- original media-to-texture behavior.

The media scale/X/Y behavior is implemented as the same controlled `CanvasRenderingContext2D.drawImage` interception concept documented by Output V2, restricted to `platformState.mediaElement`.

## Project state

Stored through the existing Type B `AdvancedToolProjectAdapter` and `EP.ProjectStoreLocal`:

- content fields;
- media data URL + metadata;
- media scale/X/Y;
- recording FPS;
- module/source metadata.

Local snapshots use the existing `EP.ProjectVersioning`.

## QA gates before merge

- Original canonical engine loads.
- Cloth deformation and mouse interaction preserve visual behavior.
- Image upload works.
- Video upload works and loops.
- Remove media works.
- Content controls update the cloth texture.
- Scale/X/Y affect only the media inside the cloth.
- Save → close/reload → Restore reproduces state.
- Version snapshot works.
- PNG works.
- WEBM 30 FPS works.
- WEBM 60 FPS works where browser supports it.
- Standalone HTML restores content/media/transform.
- Preview Clean / fullscreen work.
- Infinite Display Studio PRO remains unchanged.
- Existing RUBIK SOTA Type A tools remain unchanged.
- Juanma visual approval.

## Merge policy

No merge into `master` without explicit visual approval.