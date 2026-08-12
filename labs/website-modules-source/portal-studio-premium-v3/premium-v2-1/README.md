# Finger Frame Studio — Premium V2.1

V2.1 is the polish/reliability pass for the local Portal Engine. It does not integrate Lucy or fal yet.

## Main fixes

- Portal transition opacity is separated from media opacity. The content can remain fully opaque while the portal edge/state animates.
- Content image controls: opacity, brightness, contrast, saturation and backdrop dim.
- Portal content is rendered in the portal's local coordinate system so rotation and clipping share the same transform.
- OPEN is now an animated reveal instead of a simple fade.
- EXPAND interpolates progressively to immersive fullscreen instead of jumping.
- CLOSE collapses with an eased transition.
- Portal geometry uses hand-distance normalized by average palm width, improving behaviour at different camera distances.
- Optional open-hand intent gate reduces accidental activation.
- Mystic energy animation is deterministic/time-based instead of using `Math.random()` every frame.
- Portal trail adds subtle motion persistence.
- Media sources wait for `onload` / `canplay` before becoming ready.
- HLS waits for manifest readiness and includes network/media recovery paths.
- Remote MediaStream ownership is explicit; provider-owned streams can be detached without killing their tracks.
- Recording can combine microphone audio and portal-content audio when the browser/source exposes audio tracks.

## State machine

`IDLE → OPENING → ACTIVE → EXPANDING → IMMERSIVE → CLOSING → IDLE`

The expand transition uses an eased progress value so portal position, size and angle continuously interpolate toward fullscreen.

## Adaptive gesture metrics

Portal gesture logic derives:

- hand centers;
- distance between hands;
- average palm width;
- normalized hand-distance ratio;
- center;
- angle;
- opening velocity;
- open-hand intent.

This is deliberately deterministic and local. No gesture-classification cloud model is required.

## Media/stream contract

Local media, screen share and HLS are supported directly.

Future realtime providers use:

```js
FingerFrameV21.setRemoteStream(mediaStream, { owned: false })
```

`owned: false` means the external provider keeps lifecycle ownership of the stream. This is the contract intended for the later Lucy/fal adapters.

## Output

- Preview clean
- WebM 30/60 FPS
- PNG
- Save/Restore visual + gesture settings
- microphone audio toggle
- portal-content audio toggle

Audio capture is best-effort because browser support for `HTMLMediaElement.captureStream()` and cross-origin/HLS audio varies.

## Status

Isolated review build. Do not merge into `main` until visual/browser testing is approved.