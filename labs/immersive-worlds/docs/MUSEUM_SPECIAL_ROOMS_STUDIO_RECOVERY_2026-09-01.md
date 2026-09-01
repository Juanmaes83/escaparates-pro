# MUSEUM — SPECIAL ROOMS + STUDIO CONTROL RECOVERY

Date: 2026-09-01

Branch: `repair/museum-control-recovery-v1`

Canonical protected branch: `claude/museum-itinerant-living-art-graft-v1`

Status: technical recovery gate passed; Breeze WebGPU human visual gate pending.

## Recovery rule

This slice restores existing Human-reviewed capabilities. It does not rebuild
Breeze, Wet Paint or Avatar and does not modify frozen Character donors.

## Proven sources located

- Wet Paint integrated Human PASS: `723b9df432b0af6e8cd6d0bc48ea66f03ec0211b`.
- Breeze reviewed lineage: `e88c2926d36de6432fa1a6c662e0c2eb725b6b7e`.
- Breeze implementation checkpoint: `4839c36cc37cc8e11b411140b78b20189730ed69`.
- Breeze panel/checkpoint baseline: `4fbca5997beaf058543ee65d682f0adae89252e2`.
- Avatar Studio Phase 5 checkpoint: `6c007f4f314a4d21ed0ffcac9b6b387db454490a`.

The proven modules were still present in the recovery tree. The failures were
integration seams in the main authoring entry point and Studio navigation.

## Findings and recovered seams

### Canonical Studio reveal

The Studio reveal callback only accepted a direct portal. Selecting Breeze or
Wet Paint from Lobby/Gallery A therefore left the preview in the wrong room.
It now resolves the shortest directed sequence of existing WorldGraph portals
and calls the canonical `runtime.traversePortal()` for every crossing.

### Breeze

The proven `breeze-persistence-adapter.js` was used by the isolated Breeze gate
but was not imported by the main `index.html`. The main Museum now mounts that
same adapter. Its existing snapshot is retained in authoring Config Schema 3,
strictly outside the semantic World/INV-6 path, and restored after reload.

The adapter also seeds the installation's existing World identity, dimensions
and accessibility before a Breeze-only save. This prevents an authored snapshot
from blanking the required focusable-entity accessibility label on reload.

### Wet Paint

The Human-PASS engine and native controls remain unchanged as authorities. The
native source accordion now reads the existing Museum media catalogue and sends
a chosen READY image through the existing Wet Paint `processFromEditor()` path.
The controls are placed before the long generic artwork editor so they do not
appear to disappear below the fold.

### Avatar

No Avatar system was rebuilt. The current Phase 5 module already appends the
Avatar workspace to the main Studio. The recovery browser gate proves exactly
one Avatar domain is present after the main boot.

## Evidence

`node labs/immersive-worlds/qa/tools/studio-schema3-boot-regression.mjs`

- persisted Schema 3 boots after reload;
- runtime World validation passes;
- INV-6 reports zero errors;
- presentation remains in authoring config;
- forbidden render keys do not reach the semantic World.

`node labs/immersive-worlds/qa/tools/museum-special-rooms-studio-recovery.mjs`

- Avatar domain mounted;
- Breeze authoring snapshot survives save/reload;
- canonical Studio route enters/exits Breeze;
- Breeze adapter and nested guest iframe mounted;
- canonical Studio route enters Wet Paint;
- Wet Paint controls visible first;
- one of six Museum Library images is processed by the Wet Paint engine.

Screenshots:

- `output/playwright/museum-recovery-breeze.png`
- `output/playwright/museum-recovery-live-smoke.png`
- `output/playwright/studio-schema3-boot-regression.png`

## Remaining human gate

Headless Chromium can verify the Breeze host/controller/iframe/state contract,
but is not visual authority for WebGPU cloth pixels. A graphic-browser deployment
must still be reviewed for sculpture, cloth/background controls, simulation,
save, exit and re-entry before this recovery slice is called visually closed.

No merge to the canonical branch is authorized by this record.
