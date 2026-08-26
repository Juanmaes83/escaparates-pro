# Museum Character / Avatar 2027 — Phase 5 Gate 1 Visibility + Studio Continuity Recovery

Date: 2026-08-26
Status: HUMAN VISUAL PASS PENDING
PR: #77

## Why this recovery exists

The first Phase 5 Gate 1 human video proved that local GLB ingestion, GLTF parsing, rig inspection, height normalisation and grounding worked, but exposed two product blockers:

1. a loaded `previewRoot` was not guaranteed to be inside the current camera frustum;
2. rebuilding Museum Studio through `Vista previa` recreated the Studio with its default `build` domain and could race against an in-flight avatar load.

## Recovery contract

This is not a new phase. Phase 5 Gate 1 cannot PASS until all five human checks pass:

1. local GLB -> visible;
2. approved Character 2027 -> visible;
3. `Recolocar en vista` -> visible;
4. `Vista previa` -> returns to AVATAR with the same profile and restores in-session preview when its binary cache exists;
5. `Guardar` -> remains in AVATAR and profile metadata remains intact.

## Implementation

`avatar-phase5-visibility-continuity.js` adds a bounded compatibility seam around the existing Gate 1 controller:

- positions the avatar from the real Museum RenderHost camera forward vector;
- tests ranked distance/lateral candidates and verifies the resulting avatar bounding box against the real camera frustum;
- keeps the same Museum renderer, Scene and CameraAuthority;
- adds async generation/cancellation guards so a stale load cannot mutate a rebuilt Studio;
- blocks `Guardar` and `Vista previa` while the avatar binary is still loading;
- remembers/restores the active Studio workspace across Museum reboots;
- keeps an in-session ArrayBuffer cache so a local or approved avatar can be reparsed into the new Museum Scene after a Studio rebuild without pretending that a Blob URL is durable;
- carries avatar profile metadata into the browser-saved Museum project record through the Gate compatibility persistence seam.

## Architecture invariants

- no second WebGLRenderer;
- no second THREE.Scene;
- no second CameraAuthority;
- no CharacterStudio app mounted wholesale;
- no frozen donor mutation;
- Museum Studio remains UI owner;
- Museum RenderHost remains graphics owner.

## Gate rule

DO NOT MERGE PR #77 until the five checks above are visually demonstrated by the human gate.
