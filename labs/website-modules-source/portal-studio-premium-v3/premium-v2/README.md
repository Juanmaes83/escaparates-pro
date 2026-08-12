# Finger Frame Studio — Premium V2

Premium V2 turns the original finger-frame experiment into a gesture-driven portal engine.

## What V2 adds

### Portal Gestures

Portal mode uses two-hand geometry instead of requiring the exact thumb/index rectangle.

The engine derives:
- hand A / hand B center;
- distance between hands;
- center point;
- angle;
- opening / closing state.

These values drive six product actions:
- OPEN
- MOVE
- SCALE
- ROTATE
- EXPAND
- CLOSE

A small state machine prevents the portal from flickering between states:

`IDLE → OPENING → MANIPULATING → EXPANDED → CLOSING → IDLE`

Thresholds, smoothing and sensitivity can be adjusted from the panel.

### Classic mode

The original Finger Frame behaviour remains available as a separate Gesture Mode.

### Portal looks

Two initial styles:
- Clean — presentation / branded screen.
- Mystic — elliptical energy portal with glow and animated particles.

### Content adapters

V2 keeps local media and adds a stream-oriented source layer:
- uploaded video;
- uploaded image;
- screen share;
- HLS (`.m3u8`) using native HLS when available and `hls.js` elsewhere;
- generic WebRTC / MediaStream adapter.

External integrations can inject any remote MediaStream with:

```js
FingerFrameV2.setRemoteStream(mediaStream)
```

This is the contract intended for later Lucy and fal adapters.

### Output

- Preview clean
- WebM recording via `canvas.captureStream()`
- 30 / 60 FPS
- PNG
- Save / Restore settings

## Architecture decision

V2 does not integrate Lucy or fal yet.

The important contract is:

`AI / stream provider → MediaStream → FingerFrameV2.setRemoteStream() → portal compositor`

This keeps gesture tracking and portal rendering independent from provider-specific networking.

## Next phases

### V3 — Lucy adapter
- direct Decart Lucy realtime connection;
- prompt / style controls;
- lifecycle / reconnect;
- remote stream injected through the V2 MediaStream contract.

### V4 — fal adapter
- fal Lucy realtime;
- fal FLUX / Klein realtime;
- same content-source contract.

### V5 — Premium authoring
- playlists;
- cue points;
- gesture triggers;
- transitions;
- presets;
- standalone viewer / embed.

## Status

V2 is an isolated review build. Do not merge to `main` until visual/browser approval.