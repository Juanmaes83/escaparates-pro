# Fashion Commerce PRO Functional Parity

Date: 2026-07-18
PR: #26

## Core Contract

The exported page must remain standalone HTML with inline CSS/JS and no React, Babel, Tailwind runtime, backend dependency, auth dependency, or payment processing. Studio controls must be usable browser controls, not JSON-only inputs except for documented advanced object fields.

## Boot Contract

Initial state must be `boot`, then runtime transitions through the enabled intro states:

`boot -> teaser -> preloader -> ready`

Supported variants:

| Variant | Expected behavior |
|---|---|
| Teaser enabled, preloader enabled | Show teaser, type preloader, enter ready |
| Teaser disabled, preloader enabled | Start preloader, enter ready |
| Teaser enabled, preloader disabled | Show teaser, enter ready |
| Both disabled | Skip to ready |
| Reduced motion | Mark skipped, then ready without animated intro |

### Session gating (matches source, 2026-07-18 pass)

Source gates both the teaser and the preloader typewriter to the first page load of a
browser session (`sessionStorage`), and never repeats them on subsequent loads within the
same session. Ported with the same lifecycle, scoped per preset to avoid cross-preset
bleed inside Studio:

- `ep:fashion-commerce:<preset>:teaserShown` — once set, the teaser is hidden immediately
  (no fade) on later loads this session, matching source's `sessionStorage.getItem('teaserShown')`.
- `ep:fashion-commerce:<preset>:visited` — once set, the preloader typewriter does not run
  again this session; the page goes straight to `ready`, matching source's
  `sessionStorage.getItem('visited')` gate.
- Timings ported exactly: 2000ms teaser hold, 800ms teaser fade, preloader typewriter at
  110ms/char, preloader start offset 2200ms after boot when the teaser played this session.

Studio editing needs to re-see the intro without a fresh incognito session, so a
**"Reproducir introducción" / "Replay intro"** button is rendered in the exported page but
kept `hidden` unless the runtime detects it is running inside an iframe
(`window.self !== window.top`, i.e. Studio's preview), so production/export behavior is
unaffected. Clicking it clears the two session keys and re-runs the boot sequence without
forcing a replay on unrelated field edits or preview reloads.

## Catalog and Studio Contracts

- Source Faithful cards must not expose Studio edit links.
- Custom PRO cards must expose Studio edit links.
- Fashion Commerce must be included in the Custom PRO catalog and responsive Studio matrix.
- CTA labels remain text fields.
- CTA URLs remain URL fields.
- `Solicitar visita` and `Descubrir producto` are valid labels and must not be treated as invalid URL inputs.

## Cloud/R2 Boundary

R2/CORS is an external blocking lane. UI, Studio, catalog and local template contracts must be tested separately from the real Cloud/Railway/R2 upload flow. The R2 flow must not be hidden or skipped when explicitly run.

Current isolation rule: continue Core reconstruction while keeping the Cloud/Railway/R2 job as a separate, real CI lane. A red R2 lane is acceptable evidence of the external blocker only when the UI/Studio/catalog lane remains independently visible and green.

Last known CI split:

| Lane | Scope | Blocking Core reconstruction |
|---|---|---|
| `vercel-ui-studio-catalog` | Public catalog, Studio routing, Custom PRO contracts, responsive matrix | Yes |
| `cloud-railway-r2` | Railway auth/API smoke, signed upload, R2 persistence, export/publish/delete | No, unless UI code changes caused the failure |

Last captured isolated Cloud/R2 evidence:

| Field | Value |
|---|---|
| Run | `29619366772` |
| HEAD | `406463f81289fe1c4eece7790feaf280cb20fbb0` |
| Preview | `https://escaparates-p3ge446fu-juanma-espinosas-projects.vercel.app` |
| API host | `https://escaparates-pro-api-phase2-staging-phase2-cloud.up.railway.app` |
| UI/Studio/catalog lane | `success` |
| Cloud/R2 lane | `failure` |
| Real upload failure | `qa-video.webm` did not appear in media slot 1 after the 60s poll; card stayed at `Slot 1 · Video hero Subir desde local Eliminar Demo original disponible al previsualizar.` |
| Noise corrected after capture | The isolated cloud job now runs only `desktop-chromium`, matching the destructive-flow test guard, so missing WebKit installation cannot mask the R2 result. |

Do not merge while Cloud/R2 remains unresolved. Do not modify backend, Railway, Prisma, auth or R2 configuration inside Fashion Core commits.

## Next Functional Reconstruction

- Structured ES/EN dictionary: implemented for the current Core surface. Runtime updates text, aria labels, `html.lang` and persisted language state.
- Mobile nav overlay: implemented with hamburger, `aria-expanded`, panel close, Escape, focus trap and focus restore.
- Responsive hero controls: implemented as editable viewport values for min height, content alignment, title scale, video position, overlay strength and mobile navigation mode.
- Gallery drag/swipe/keyboard/snap behavior: implemented with prev/next controls, pointer drag, keyboard arrows, runway progress, stop-on-modal and cleanup.
- Product modal, cart and wishlist: implemented with product detail modal, size/color selectors, wishlist without duplicates, cart quantities, subtotal, counters, remove controls and scoped localStorage keys (`ep:fashion-commerce:<preset>:cart|wishlist`).
- Add lookbook, reservation, co-creation, fitting room, style generator, timeline, designers, audiovisual, polaroids, newsletter, footer and utilities.

## Gate 1 fixes (2026-07-18, this pass)

Two severe, evidence-confirmed rendering bugs were found and fixed (screenshots in
`tests/phase-gate1-evidence/`, generated by `tests/fashion-commerce-gate1-capture.mjs`):

1. **Hero title was collapsing to 11px.** `.rs-hero-copy span` was a descendant selector,
   so it also matched the `.rs-glitch-char` spans nested inside the `<h1>`, forcing the
   giant 160px glitch title down to the small mono eyebrow/label style. Fixed with a
   direct-child selector (`.rs-hero-copy>span`) so only the eyebrow line is affected.
2. **Preloader painted over the teaser.** `.rs-teaser` and `.rs-preloader` shared the same
   `z-index:180`; since the preloader comes later in DOM order, its opaque black background
   fully hid the teaser animation for its entire run. Source avoids this by giving the
   teaser a higher z-index (10001) than the preloader (10000) — ported the same relationship
   (teaser `181`, preloader `180`).

Also fixed to match source exactly: teaser/preloader session-gating (see Boot Contract
above), hover-randomized glitch distortion (removed an invented autonomous CSS glitch pulse
that doesn't exist in source — source is purely hover-interactive with JS-randomized
per-hover transform values), teaser stamp/line/spark keyframe animations (were missing
entirely; only a static two-line placeholder existed before), and preloader typewriter
speed (110ms/char, was 70ms/char).

## Gate 2 fixes (2026-07-18, this pass)

Three severe interaction bugs were found via actual driven interaction testing (not code
review — see the lesson from Gate 1) and fixed. Verification script:
`tests/fashion-commerce-gate2-verify.mjs` (drives wheel, drag, keyboard, runway, modal via
Playwright and asserts real DOM state, not just visual appearance).

1. **Product cards were unclickable whenever a real click passed through pointer capture.**
   The mouse-drag-to-scroll handler called `setPointerCapture` unconditionally on every
   `pointerdown` inside the gallery track — including simple clicks with no drag motion.
   Once captured, the browser retargets the resulting `click` event to the capturing
   element (the track shell) instead of the button/image the user actually clicked,
   silently breaking `openProduct()`. Confirmed via instrumented event logging (click
   target was `DIV.rs-track-shell`, not the product button). Fixed with a drag-threshold:
   capture is only engaged once pointer movement exceeds 6px, so a plain click never
   triggers capture and reaches the button normally.
2. **Mouse-drag never visually tracked the cursor.** `.rs-track-shell` has
   `scroll-snap-type:x mandatory`; the drag handler wrote `scrollLeft` directly on every
   `pointermove`, but the browser instantly snaps any non-snap-point `scrollLeft` back to
   the nearest card (confirmed directly: assigning `scrollLeft=40` reverted to `0`;
   `scrollLeft=250` jumped straight to `363`, the next snap point). Fixed by suspending
   `scroll-snap-type` to `none` for the duration of an active drag (or an active wheel
   burst, debounced 150ms), and restoring it on release — the standard fix for this
   class of CSS-scroll-snap-vs-JS-drag conflict.
3. **Wheel/trackpad over the gallery scrolled the page, not the gallery.** No wheel
   listener existed at all; source explicitly hijacks `deltaY` into horizontal movement
   while over the gallery, releasing control back to the page at the scroll boundaries
   (`(scrollLeft<=0 && deltaY<0) || (scrollLeft>=max && deltaY>0)`). Ported the same logic
   verbatim, confirmed working (scrollLeft moves 0→771 on wheel) and boundary release
   confirmed independently (no `preventDefault()` at `scrollLeft=0` with upward wheel).

Also added: color-pop transition when a product's modal opens (card image turns from
grayscale to color while its modal is open, matching source's `color-pop` behavior, cleared
on close), a `REF: RS-00N · STOCK: N UD` meta line in the product modal matching source's
format, and a deferred (`setTimeout(0)`) focus-to-close-button call on modal open for
keyboard/screen-reader users.

**Verified via driven interaction (not just code review):** wheel-hijack + boundary
release, mouse drag (via direct PointerEvent dispatch — Playwright's `mouse.move/down/up`
loses event delivery once `setPointerCapture` engages mid-gesture, a CDP/synthetic-input
limitation confirmed separately, not an app bug), keyboard arrow navigation, runway
start/progress/stop/cleanup, and product modal open/meta/color-pop/close.

**Known-unresolved this pass:** the deferred focus-on-open call is confirmed to actually
invoke `.focus()` on the correct, visible, enabled close button (verified by monkeypatching
the method), but `document.activeElement` does not reflect it when checked via Playwright
automation afterward — a manual `.focus()` call issued from a separate script does succeed
on the same element moments later. This could be a genuine timing bug or a Chromium
headless/CDP limitation around focus during synthetic interaction; it was not resolved with
confidence either way in the time available. Flagging honestly rather than claiming it's
fixed.

**Significant structural gap found, not fixed this pass:** the source gallery
(`.horizontal-section`) has **no header/title text at all** — its DOM is just the runway
toggle button, a runway indicator, and a full-bleed edge-to-edge image track with small
circular `.hotspot` markers overlaid on images (hover reveals a tooltip with name + price).
Our builder renders a card-grid with visible gaps, per-card borders, large number badges,
and an invented "01 / GALERÍA" eyebrow + title copy block above the track that doesn't
exist in source at all. This is a deeper visual-redesign-level gap (new hotspot/tooltip
system, full-bleed layout, removing the header) rather than a behavior bug, and was not
attempted this pass to avoid a rushed, shallow rebuild. Screenshots:
`tests/phase-gate2-evidence/{source,builder}-gallery-*.png`.

**Tracked remaining differences** (not fixed this pass, deferred to their stated gate):
- Nav only has 4 links (Hero/Gallery/Lookbook/Videos); source has 10, pointing at sections
  that don't exist yet (co-creación, probador, estilo IA, behind, polaroid, newsletter).
  Nav will be expanded incrementally as each gate adds its target section — full nav parity
  isn't reachable until Gate 4/5.
- Mobile nav (390px) overflows/wraps (brand name + hamburger + lang + mute + wishlist +
  cart + CTA don't fit in one row); source hides/condenses this chrome at narrow widths.
  Deferred to Gate 5's full responsive pass since it interacts with cart/wishlist/CTA chrome
  built in later gates.
- Hero eyebrow line ("COLECCIÓN / VOLUMEN 01") is a builder-only addition; source's hero has
  no eyebrow, only title + subtitle. Kept for now (existing Studio field with test coverage)
  as a minor, low-visual-impact deviation rather than removing a scoped field mid-gate.
