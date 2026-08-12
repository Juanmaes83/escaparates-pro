# Infinite Worlds — V1.2.2 Art Direction & First-Cross Polish

## Purpose

Raise Brand Expression by World from functional placement to authored spatial campaign design while preserving the proven portal transition.

## First-cross rule

The GSAP transition, camera path, world swap and portal mechanics remain untouched. After APPLY EXPERIENCE, V1.2.2 runs an invisible preflight using the existing renderer:

1. wait for the active Three.js renderer;
2. update world/camera matrices;
3. ensure active VideoTextures are playing;
4. compile City and Nature materials where supported;
5. render both scenes into a small offscreen target;
6. prime City and Nature portal render targets;
7. wait additional animation frames;
8. only then report EXPERIENCE READY and enable START EXPERIENCE.

Goal: first traversal should arrive at the same technical readiness state as later traversals.

## Adaptive support contract

Uploaded media determines the visible support proportions. Assets are not stretched to fill arbitrary rectangles.

- Video: keeps source aspect ratio inside a large authored hero envelope.
- Campaign Image: keeps source aspect ratio inside an editorial vertical/portrait envelope.
- Logo: its physical crown/monolith support contracts around the actual fitted identity, avoiding large empty rectangles.
- Text: remains authored spatial typography rather than a generic media card.

## City art direction

- Hero Media Wall: moved to the left flagship façade, further from the portal, with an architectural backing volume and larger scale.
- Campaign Image: moved to the right façade, with a taller luxury lightbox/architectural blade.
- Brand Crown: enlarged and raised as a building-level signature; support adapts to logo proportions.
- Narrative: moved to a large right-side architectural wall to behave as city-scale editorial typography.

## Nature art direction

- Landscape Cinema: moved left and outward into a dedicated stone pavilion with roof, side piers and base.
- Scenic Gallery: moved right and outward into a freestanding garden-gallery intervention.
- Brand Monolith: brought into the foreground; stone support adapts to actual logo proportions.
- Landscape Narrative: brought into the foreground left with a low material plinth for land-art presence.
- Additional immediate safe zones prevent procedural vegetation from blocking campaign roles.

## Portal storytelling

Portal transition mechanics remain unchanged. A subtle contextual tint is applied according to the destination world:

- City → Nature: green/warm destination tint.
- Nature → City: steel blue/cool destination tint.

This changes only visual storytelling, not movement or timing.

## Explicitly protected

- `moveCameraToPortal()`
- `moveWorldToEnd()`
- `switchWorlds()`
- `moveWorldAndCameraToOrigin()`
- `CameraUtils.frameCorners()`
- camera sync
- WebGLRenderTarget portal architecture
- recursive traversal

## Approval target

V1.2.2 is not considered approved because code exists. It must pass browser review for:

1. first transition visually equal to later transitions;
2. City and Nature video playback;
3. source proportions respected;
4. logo support no longer visibly oversized/empty;
5. City reads as a branded city, not assets around a portal;
6. Nature reads as landscape installation/pavilion, not screens in grass;
7. narrative typography has architectural/land-art scale;
8. portal remains mechanically identical and bidirectional.
