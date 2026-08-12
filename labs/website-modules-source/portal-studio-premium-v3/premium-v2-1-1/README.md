# Finger Frame Studio — Premium V2.1.1 Hotfix

V2.1.1 is a reliability hotfix for Premium V2.1. It preserves the V2.1 visual polish while relaxing gesture activation and making media state observable.

## Fixes

- MediaPipe thresholds reduced to 0.30 / 0.30 / 0.32.
- Open-hand intent is OFF by default.
- Intent is now a confidence score instead of a strict boolean.
- Portal opening no longer requires a velocity threshold.
- Opening hold tolerates a few bad tracking frames instead of resetting immediately.
- Palm size and hand-distance ratio are independently smoothed.
- Default open/expand/close thresholds are relaxed.
- Video, HLS, screen share and remote streams start muted to avoid browser autoplay blocking.
- Playback failures are reported instead of silently swallowed.
- Content has an independent visible preview in the authoring panel.
- Live diagnostics expose hands, intent, normalized ratio, velocity, open hold and content readiness.
- TEST PORTAL opens the compositor without MediaPipe so media/rendering and tracking can be tested independently.
- Fixed the V2.1 opening-scale bug caused by `portal.openP || 1`; zero is now treated correctly.
- Content opacity remains independent from portal transition opacity.
- Existing cinematic OPEN / EXPAND / IMMERSIVE / CLOSE visuals are retained.

## Test sequence

1. Upload a video or image.
2. Confirm the media appears in CONTENT PREVIEW and CONTENT shows READY.
3. Press TEST PORTAL. The same content must appear inside the portal even without camera tracking.
4. Start camera.
5. Confirm HANDS reaches 2/2.
6. Separate both hands. The ratio should pass the Open threshold and OPEN HOLD should rise.
7. Portal should transition IDLE → OPENING → ACTIVE.
8. Move and separate hands further to reach EXPANDING → IMMERSIVE.

## Diagnostic interpretation

- CONTENT EMPTY: media layer is the problem.
- CONTENT READY + TEST PORTAL works: media/compositor are healthy; inspect tracking diagnostics.
- HANDS below 2/2: MediaPipe/camera visibility issue.
- HANDS 2/2 but RATIO below threshold: lower Open threshold or separate hands more.
- Require open-hand intent is optional. Enable only after basic tracking is reliable.

## Status

Isolated review build. Do not merge into `main` until browser and visual QA are approved.