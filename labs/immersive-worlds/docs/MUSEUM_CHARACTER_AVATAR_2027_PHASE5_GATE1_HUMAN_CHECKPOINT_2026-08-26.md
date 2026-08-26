# MUSEUM — CHARACTER / AVATAR 2027 — PHASE 5 GATE 1 HUMAN CHECKPOINT

**Date:** 2026-08-26  
**Official phase:** PHASE 5 — AVATAR PROFILE + MUSEUM STUDIO  
**Gate:** 5.1 / 5.2 first visual gate  
**Status:** READY FOR HUMAN VALIDATION — NOT PASS / NOT MERGED

## Scope implemented

- Dedicated top-level **AVATAR** workspace inside the existing Museum Studio panel.
- Museum-facing `avatarProfile` with asset, scale, grounding, rig status, Motion V2 declaration, LookAt/IK placeholders, semantic actions placeholder and validation state.
- Approved Character 2027 selector with exact byte-length + SHA-256 provenance verification.
- Local test upload for `.glb`, `.gltf` and `.vrm`.
- Rig inspection against the same required humanoid bone family used by the proven Character runtime.
- Target-height normalization, default 1.66 m.
- Grounding against the active Museum `navigationVolume`, with bounded Y offset.
- Avatar preview added to the **existing Museum Scene** and drawn by the **existing RenderHost**.
- No second renderer, no second Scene, no second CameraAuthority.
- Motion/Lab/IK/Actions are visibly staged but not activated in this gate.

## Local-file persistence truth

The current Museum MediaVault is session-oriented: uploaded binary files are not claimed to survive a browser reload. Gate 1 persists the avatar profile/measurements and explicitly marks a local avatar as requiring re-selection after reload. Durable binary persistence can be promoted only through an explicit Museum persistence contract; Blob URLs are never presented as durable storage.

## Human gate

1. Open Museum Studio with `?authoring=1`.
2. Confirm a dedicated **Avatar** area exists in the left workspace rail.
3. Enter Avatar.
4. Select **Character 2027 aprobado** and confirm it appears in the central Museum preview.
5. Confirm Rig, Scale and Grounding populate and Rig reports PASS for the approved avatar.
6. Change target height and confirm preview/profile update.
7. Upload one local GLB or VRM and confirm the same panel/preview path is used.
8. Confirm there is still one Museum canvas / renderer and the rest of Studio remains navigable.

## Gate decision

Human visual approval is mandatory before Gate 1 is marked PASS or before Phase 5 advances to Motion + LAB.
