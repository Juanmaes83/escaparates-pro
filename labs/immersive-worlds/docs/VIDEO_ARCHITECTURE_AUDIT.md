# Audit — proven Escaparates Pro video implementations vs Museum authoring

Written before changing Museum, because the instruction was to understand the
three architectures we already own rather than invent a fourth.

Four first-party sources were read in full. Two of them do not live on this
branch and were read read-only via `git show`; nothing was checked out, copied
or modified.

| # | Source | Where |
|---|---|---|
| 1 | `js/media-manager.js` | this branch |
| 2 | `BrandMediaManager.applyVideo()` — `labs/infinite-worlds-brand-expression-v1-2/enhancements.js` | `origin/feat/infinite-worlds-v1-2-brand-expression` |
| 3 | `breeze-studio-pro` — README + `assets/index-*.js` (`applyUserMediaFile`) | `origin/feature/breeze-studio-pro` |
| 4 | `kinetic-letter-curtain-pro-v2-video-projection` — README + `index.html` | this branch |

---

## The comparison

| | 1 · media-manager | 2 · brand expression | 3 · breeze studio | 4 · kinetic V2 | Museum (before) |
|---|---|---|---|---|---|
| **File** | `File` from input | `File` from input | `File`, MIME-gated | `File` → **Blob in IndexedDB** | `File` from input |
| **Video element** | one, created on load | one, created on load | one, created on load | one per projection slot | **two: a probe, then a different one at render** |
| **Object URL** | created on load, kept on the slot | created, pushed to `urls[]` | created, kept as `userMediaUrl` | re-derived from the stored Blob on every hydrate | created in the vault, kept as a string |
| **Readiness** | `loadeddata` → real `videoWidth`/`duration` | `loadedmetadata` (for aspect only) | `waitForVideoReady`: `loadeddata`/`canplay`, **12 s timeout** | `loadeddata`, error resolves too | `canplaythrough`/`loadeddata`, **no timeout** |
| **Resource ownership** | the slot owns the live element | the manager owns element + URL | the cloth owns element, URL, canvas | the record owns element + canvas | **split: the vault owns the URL, the loader owns the element** |
| **Video texture** | `new THREE.VideoTexture(retained element)` | `new THREE.VideoTexture(retained element)` | canvas grading → texture | canvas sampling → per-letter colour | `new THREE.VideoTexture(loader's own element)` |
| **Playback** | `play().catch(noop)` | `autoplay` + `play().catch(noop)` | `play()`, **retry on next `pointerdown`** | `play()` on ready + `syncProjectionPlayback()` | `play()`, refusal recorded only |
| **Persistence** | session only | session only | session only | **IndexedDB, survives reload** | session only |
| **Replacement** | revoke old URL, then load | pushes to `urls[]` | `cleanupUserMedia()` first | `dbPut` overwrites, then re-hydrate all | vault releases the old asset |
| **Cleanup** | `URL.revokeObjectURL` on remove | bulk revoke | cancel frame callback → `pause` → `removeAttribute('src')` → `load()` → revoke → dispose | `pause` → `removeAttribute('src')` → `load()` → revoke | `pause()` → **`src = ''`** → dispose |
| **Apply/rebuild** | `renderSlots()` + `needsUpdate` | rebuild material | `rebuildScene()` | `hydrateAssets()` → `renderAll()` | world rebuild from config |

---

## Where Museum differed unnecessarily

**1. `src = ''` is not how you release a video element.** All four proven
sources either revoke the URL or use `removeAttribute('src')` + `load()`. An
empty string is not "no source": it resolves against the document's own address,
so the element goes and fetches the page and tries to decode HTML as video.
Museum did this in two places. *Fixed — `releaseVideo()` in `media-loader.js`,
`teardown()` in `media-vault.js`.*

**2. No timeout on the probe.** Breeze bounds the wait at 12 s and says why.
Museum waited forever, so a codec the browser half-recognises left the author on
"Cargando…" with no way to tell a slow file from a dead one. *Fixed — 20 s, with
a message naming the likely cause.*

**3. An autoplay refusal was recorded but never recovered.** Breeze retries on
the next `pointerdown`. Museum wrote the refusal into the log and left a frozen
frame on the wall for the rest of the visit — which looks exactly like a video
playing very slowly, and is the one failure mode a screenshot cannot catch.
*Fixed — `_retryOnGesture()`, adopting Breeze's pattern.*

**4. Probe-and-destroy vs one retained element.** This is the largest structural
divergence and it is the one I have **not** acted on. Every proven source keeps
the element it loaded and hands that same element to `THREE.VideoTexture` — one
owner, from file to pixels. Museum decodes the file twice: once in the vault to
learn its shape, discarding the element, and again in the render layer from the
surviving object URL.

It is genuinely worse — two decodes, and the readiness the author was shown was
measured on an element that no longer exists — but under measurement it is not
what was failing: MP4 and WebM both reach the wall and both advance, at the top
level and inside a frame. Collapsing it means either the vault reaching into the
render layer or the render layer trusting an authoring object, and both cost the
engine/authoring separation that makes the second museum possible. **Documented
and deferred**, per the instruction not to add complexity without evidence.

**5. IndexedDB persistence.** Kinetic V2 stores heavy media as a Blob in
IndexedDB and re-derives object URLs on every hydrate, so a reload keeps the
video. Museum's media is session-only: reload and the file is gone. Real, and a
different problem from the reported one — no evidence links it to the failure
Juanma saw, and it is adjacent to the cloud-storage question the mandate put out
of scope. **Documented and deferred.**

---

## What was actually failing

Neither of the two structural divergences. The audit was still worth doing — it
produced three real fixes above — but the reported failures were elsewhere, and
finding them needed a browser rather than a reading.

### Video — the product model, not the pipeline

`experience-config.js` asserted, in a comment and in code:

> A video on a framed canvas is not a thing this Scene Kit can draw, so it is
> not a thing the config can express.

That is false. `museum-scene-kit.js:562` reads
`loaded?.texture || artworkTexture(...)` and hangs whatever texture the media
layer returns; a `VideoTexture` is a texture. The kit has always been able to
draw it. Only the config forbade it.

The consequence: video was authorable on exactly **one** entity in the whole
Museum — the single projection. The other nine pieces are artworks, so an author
who opened a piece and looked for a way to give it a moving image found none.
That is the reported failure, and it is why the QA fixture played while the
product failed: the fixture exercised the one slot that existed.

Corrected to explicit slots — never a generic `MEDIA` slot:

```
INSTITUTION_LOGO   image   a mark is not a moving image
ARTWORK_IMAGE      image
ARTWORK_VIDEO      video   video art has hung in museums since the 1960s
PROJECTION_VIDEO   video
PROJECTION_IMAGE   image   a projected still is an ordinary thing to want
```

Slots on one kind are alternatives — a piece shows one representation — so
choosing one releases the other. No schema bump: v2 entities already carried
both an `image` and a `video` field.

### Text — a window-level keyboard handler

`app/ui/input.js` listened for `keydown` on `window` and never asked whether the
key was going into a text field. Typing in the authoring panel therefore drove
the camera: W/A/S/D and the space bar were swallowed by `preventDefault`, and M,
G and E fired the map, the guided route and "activate the nearest point".

Typing `Museo Atlántico de Vigo` into the institution name produced

```
Fundación AMueotlánticoeVigorenas (institución ficticia)
```

— every `s`, every `a` and every space gone, and `Ctrl+A` never selecting because
its `a` was eaten too. It read as a text box that could not be edited. The panel
that names the institution is the first one an author opens and the one most
certain to contain spaces, which is why it looked like *the first panel* was
broken while others seemed fine.

*Fixed — `isTyping()` guards the handler by role, so any future panel is covered
without this file knowing it exists.*

---

## Why my own instruments missed both

Consistent with the pattern I keep hitting: **an instrument that cannot fail.**

- The video harness drove the one slot that existed, so it could not discover the
  nine panels that had no slot at all. It answered "does this file decode",
  which was never the question.
- The authoring harness set `input.value` and dispatched `input` directly. Real
  keys never reached the page, so a handler eating real keys was invisible to it.
  `page.keyboard.type()` found it on the first run.
- Earlier video runs passed `--autoplay-policy=no-user-gesture-required`, which
  makes an autoplay refusal structurally unobservable. That flag is gone.

The repro now types with real keys and tests both the top level and inside a
frame, because the reviewer reads a published artifact rather than a local page.
