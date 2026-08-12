# Portal Studio — Premium V3 Lucy Adapter

V3 adds Decart Lucy 2.5 realtime AI as an optional portal-content provider without modifying the V2.1.1 gesture engine or compositor.

## Architecture

`Portal Studio V2.1.1 camera → Lucy 2.5 → remote MediaStream → mirrored bridge canvas → FingerFrameV211.setRemoteStream() → portal compositor`

The V2.1.1 app is loaded as the stable authoring core. V3 is an additive provider shell around it.

## Why a bridge canvas exists

Portal Studio mirrors its camera view. Lucy returns a full-frame transformed stream. V3 mirrors and normalizes the selected source before injecting it into the portal so the AI world remains screen-aligned with the user's camera view.

## Source modes

- ORIGINAL — mirrored original camera feed inside the portal.
- AI — Lucy transformed camera stream. Falls back to original while Lucy is unavailable.
- SPLIT — original on the left and Lucy AI on the right.

## Lucy controls

- Decart API key, session-only or remembered locally.
- 3D Movie, Anime, Cyberpunk, Watercolor, LEGO and Custom prompt presets.
- Live prompt update without intentionally rebuilding Portal Studio.
- Connect / Disconnect.
- Basic automatic reconnect with exponential backoff on connection failures.
- Clear status for camera, Lucy, selected output and remote stream.

## Privacy / billing

Hand tracking remains local in Portal Studio. When Lucy is connected, the camera video track is sent to Decart for realtime transformation. API usage may incur provider charges. The key is stored only in sessionStorage or localStorage according to the user's choice.

## Test flow

1. Open V3.
2. In the underlying Portal Studio panel, press Start camera.
3. Verify the base V2.1.1 gesture/TEST PORTAL still works.
4. Add a Decart API key in the AI LIVE dock.
5. Press CONNECT AI.
6. Wait for `LIVE` and a remote video track.
7. Select AI.
8. Open the portal with both hands.
9. Test style changes while connected.
10. Test ORIGINAL and SPLIT.
11. Disconnect and confirm the local portal remains usable.

## Status

This is an isolated review build. It has not been merged to `main` and should not be treated as browser-validated until visual QA is completed.

## Next

After V3 visual/runtime approval:

- V4 — fal adapter (fal Lucy + FLUX realtime).
- V5 — premium authoring: playlists, cue points, trigger rules, presets, standalone/embed.