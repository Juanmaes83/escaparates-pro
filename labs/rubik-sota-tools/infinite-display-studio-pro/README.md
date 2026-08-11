# Infinite Display Studio PRO

Status: **TYPE B PLACEMENT APPROVED / ORIGINAL PARITY CLOSURE PENDING / DO NOT MERGE YET**

## Placement in Escaparates Pro

`RUBIK SOTA → Infinite Display Studio PRO → Advanced Integrated Tool (Type B)`

This product is the first approved implementation candidate of the Escaparates Pro **Advanced Module Integration / Type B** contract.

## Integration principle

`PRESERVE ENGINE → ADAPTER → ESCAPARATES AUTHORING SYSTEM → MODULE PRO`

The visual engine must not be rebuilt or replaced. Escaparates Pro adds native authoring, project state, media, outputs and QA around the preserved engine.

## Canonical source

Repository: `Juanmaes83/ESCAPARATES-INMERSIVOS-DE-IMAGEN-VIDEO`

- branch: `main`
- commit: `89ee1beb56a0c86c06366bbbb155f421e2d23981`
- canonical `index.html` Git blob: `f74424403b3dd276919035e86b3b0abb1c48224c`

The original repository contains only `READ ME.txt` and the canonical `index.html`. The Type B host loads the immutable source and creates a runtime integration layer; the original source remains the fallback.

## Original product capabilities

The canonical engine provides:

- 12 display modes: Spiral, Curl, Bands, Drift, Parallax, Galaxy, DNA, Vortex, Kaleidoscope, Falling Rain, Mobius and Exploded Grid;
- image and video upload;
- media management, preview and removal;
- background, speed, camera zoom and tilt;
- plane count and bands/sectors;
- bloom and vignette post-processing;
- overlay branding with headline, CTA and uploaded logo;
- ambient music tracks;
- presentation mode;
- fullscreen;
- WebM recording;
- screenshot/share;
- HTML download;
- mouse, wheel, keyboard, touch, inertia and Shift+drag free-look interaction.

## Escaparates Pro value added

The Type B integration adds or standardizes:

- native Escaparates authoring panel;
- explicit project state;
- Save / Restore;
- autosave;
- project versions/snapshots;
- Project JSON;
- output presets;
- renderer adapter;
- source pinning and Git blob integrity verification;
- isolated rollback to the canonical standalone source.

## Current integrated status

Verified in the current isolated branch/preview:

- Type B registry and host;
- canonical source loading and integrity guard;
- all 12 modes exposed by the registry;
- native Experience / Look / Camera / Geometry / Post FX controls;
- native Branding controls;
- image/video upload foundation;
- logo upload;
- Save / Restore / Versions;
- PNG;
- WebM recording;
- Project JSON;
- presentation mode;
- fullscreen;
- improved full-height editor layout.

## Parity closure required before merge

The integration must not be considered complete until the original capabilities below are explicitly exposed/tested in the Type B experience:

- ambient music selection/control;
- full media manager parity, including individual preview and management workflow;
- Share / Web Share fallback behavior;
- portable HTML export that preserves the **complete project state**, not only the original image URL array;
- preservation/QA of the original mouse, keyboard, touch, inertia and Shift+drag free-look behavior;
- visual QA across all 12 modes with uploaded image/video media;
- Save → close → Restore state fidelity;
- version snapshot → modify → restore fidelity.

`HTML / Embed / Publish` must not be marked complete until user media persistence and full project-state serialization are demonstrably portable.

## Safety / rollback

- `master` is not the implementation workspace.
- The original repository remains untouched and is the fallback source.
- Existing RUBIK SOTA Type A tools remain unchanged.
- No existing module is replaced, deleted or renamed.
- No merge to `master` without Juanma's explicit approval after visual/functional parity review.

## Review surface

Current isolated work:

- branch: `feature/type-b-infinite-display-studio-pro`
- Draft PR: `#42`
- preview route: `/advanced-tool.html?tool=infinite-display-studio-pro`

Decision status: **KEEP as Type B architecture and RUBIK SOTA placement; ADJUST until original parity is complete; MERGE NOT AUTHORIZED.**
