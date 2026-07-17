# Fashion Commerce PRO - Source Audit and Parity Contract

Date: 2026-07-17

## Scope

Target repository: `Juanmaes83/escaparates-pro`

Initial target SHA: `cf748957f6aa6fb17681f951a11976de4dcc160f`

Working branch: `feature/fashion-commerce-pro`

Backup branch: `backup/pre-fashion-commerce-pro-2026-07-17`

Source repository: `Juanmaes83/WEB-PREMIUM-MODA-CON-CLAUDE`

Source SHA: `bce87794e4ef5643ac9e50abfbc783cac784d870`

Public source URL: `https://juanmaes83.github.io/WEB-PREMIUM-MODA-CON-CLAUDE/`

Canonical preset requested: `rubik-sota-disruption`

Public preset label requested: `RUBIK SOTA - DISRUPCION`

## Execution Evidence

The source was not audited from README only. It was opened and executed through Playwright CLI against the public GitHub Pages URL.

Observed page title: `RUBIK SOTA · COLECCION VOLUMEN 01`

Observed public runtime state:

- Sticky navigation renders `HERO`, `GALERIA`, `LOOKBOOK`, `CO-CREACION`, `PROBADOR`, `ESTILO IA`, `BEHIND`, `VIDEOS`, `POLAROID`, `NEWSLETTER`.
- Hero renders the `DISRUPCION` headline, `VOLUMEN 01 · INVIERNO 2025`, and a background video request.
- Product gallery renders 10 products with prices from `79 EUR` to `249 EUR`.
- Lookbook renders editorial cards, influencer/model labels, and a view toggle.
- Co-creation renders voting cards at `0 votos`.
- AR section exposes a camera CTA and product selector.
- Style generator exposes upload area, style tags, and disabled generate CTA until selection.
- Timeline, designers, video grid, polaroid wall, newsletter, footer certificate, wishlist, cart, floating chat, floating CTA, QR, and collector achievement elements exist in the executed DOM.
- Console shows one source runtime log and one 404 for `/favicon.ico`.

Network evidence from the executed public page:

- Source HTML: `200`
- Google Fonts CSS and font files: `200`
- Unsplash images: `200`
- RandomUser portraits: `200`
- CloudFront campaign videos: `206`
- Favicon: `404`

Saved audit artifact:

- `artifacts/fashion-commerce-source-audit/source-page.png`

## Asset Provenance Gate

The source depends on remote media that are essential to the requested visual fidelity:

- Four CloudFront MP4 campaign videos from `d8j0ntlcm91z4.cloudfront.net`.
- Multiple Unsplash images used as product, lookbook, timeline, designer-creation, polaroid, and poster media.
- RandomUser portraits used as influencers/designers.
- Google-hosted fonts: Bebas Neue, Space Mono, Inter.

The source repository does not include local media files, license files, ownership evidence, or an asset manifest proving that the CloudFront, Unsplash, and RandomUser media may be copied into `assets/templates/fashion-commerce/rubik-sota/`.

Per the user instruction, production hotlinking is not allowed and only owned, authorized, or clearly usable assets may be copied locally. Since the hero video and campaign media are key to the required immediate visual recognition, this audit triggers the stop condition:

> Detenerse si la procedencia de assets clave es dudosa.

No builder implementation should start until one of these routes is approved:

1. Provide written confirmation that the CloudFront MP4s and selected source imagery are owned/authorized for copying into Escaparates Pro.
2. Provide a replacement asset pack for `assets/templates/fashion-commerce/rubik-sota/` with equivalent composition and rights.
3. Approve a legal fallback strategy that preserves layout and interaction but accepts documented visual differences from the source.

## Section and Function Matrix

| Seccion/funcion | Fuente | Estado real | Fidelidad requerida | Editable en Studio | QA prevista | Riesgo |
|---|---|---|---|---|---|---|
| Teaser inicial | `index.html` overlay `teaserOverlay`; `QUE_FUNCIONA_HOY.md` feature 1 | Funciona en primera visita; puede colgarse si se recarga en carrera | Core fidelity: logo, lineas, timing, volumen | brand, volumeLabel, teaser timing, enable/disable | Browser first-load and reload tests | Race condition conocida |
| Preloader typewriter | `preloader`, `preloaderText` | Funciona condicionalmente | Core fidelity con cursor y letras progresivas | preloaderText, speed, enable/disable | Browser first-load and reload tests | Race condition con teaser |
| Navegacion sticky | `navbarSticky`, `navItems` | Funciona desktop/mobile | Core fidelity: negro, compacto, enlaces por seccion | nav labels, visibility, language | Click nav, mobile menu, focus | Debe no hardcodear tabs globales |
| Cambio ES/EN | `translations`, `langToggle`, `data-i18n` | Funciona en general | Core fidelity en nav, hero, galeria, lookbook, modal, footer | grouped translation controls | Toggle language and assert text | Ganador de co-creacion no se actualiza si ya renderizado |
| Cursor personalizado | `customCursor` | Funciona en desktop fino | Core desktop; disabled on touch/reduced motion | cursorEnabled, cursorLabel, intensity | Desktop/motion tests | `mix-blend-mode` puede perder contraste |
| Hero con video | `section0`, CloudFront MP4, Unsplash poster | Funciona; video request `206` | Core, visual recognition required | heroVideo, heroPoster, title, subtitle, overlay | Screenshot parity and media request test | Asset provenance unclear and critical |
| Titular glitch | `glitchTitle`, per-character hover | Funciona | Core fidelity: `DISRUPCION`, hover orange/glitch | heroTitle, glitchEnabled, intensity | Hover per char visual/state test | Text must preserve accents in UTF-8 |
| Galeria horizontal | `section1`, `horizontalTrack` | Funciona with wheel caveat | Core; scroll horizontal, numbered products, grayscale/color | products repeater, gallery settings | Wheel/touch/keyboard tests | Wheel hijack known |
| Modo pasarela | `runwayToggle`, key `R` x3 | Toggle visible works; key deactivation bug | Core via button; key optional with fix | runwayEnabled, interval, autoplay | Click toggle, advance, stop, reduced motion | Interval cleanup bug risk |
| Modal producto | `productModal`, `openProductModal` | Works, but no visible X | Core with improved accessibility | product fields, CTAs, media, demo flags | Open, close X/Escape/backdrop/focus | Current close UX incomplete |
| Carrito demo | `cart`, `localStorage`, cart modal | Works and persists | Core demo only, no fake checkout | cart mode, labels, currency | Add/remove/qty/total/reload | `parseInt` loses decimals in source |
| Wishlist | `wishlist`, `localStorage`, wishlist modal | Works and persists | Core | wishlistEnabled, labels | Add/remove/reload | Media/product IDs must stay stable |
| Lookbook | `section2`, `lookbookPhotos` | Editorial renders | Core | looks repeater, layout, media, credits | Render/interaction tests | Source images remote |
| Vista editorial | `renderLookbook` default | Works | Core | default mode, editorial labels | Toggle and snapshot | Influencer assets remote |
| Vista tienda | `toggleViewBtn`, shop mode | Works | Core | shop labels, sizes, reserve labels | Toggle, reserve CTA | Needs product ID mapping |
| Reserva demo | `reservaModal` | Mock works | Core demo; no backend claim | reservationEnabled, CTA URL, demo copy | Reserve modal and ref format | Must label as demo |
| Co-creacion | `section8`, `cocreationGrid` | Works local/session | Advanced optional | showCocreation, items repeater | Vote once, reset QA | Must not imply global voting |
| Votacion | `cocreationVotes`, `userVoted` | Local/session only | Advanced optional demo | vote items and labels | Vote and persistence tests | Simulated percentages |
| Probador AR | `section9`, `getUserMedia` | Works with camera issues | Advanced optional demo | showArDemo, labels, product overlay | Permission/fallback/stop camera | Privacy, HTTPS, manual stop |
| Style generator | `section10`, local style map | Works locally | Advanced optional demo | style tags, recommendation rules | Select tag, generate results | Must not call real AI |
| Timeline | `section7`, `timelineItems` | Works | Core | timeline repeater | Scroll reveal | Source thumbs remote |
| Disenadores | `designersGrid`, RandomUser portraits | Works | Core | designers repeater, portraits, roles | Render/click tests | RandomUser provenance not acceptable for copy |
| Grid audiovisual | `section3`, four CloudFront videos | Works; loads videos | Core | campaignVideo slots, mute behavior | Hover/mute/lazy tests | Video provenance unclear and critical |
| Audio/mute | Web Audio and video mute | Works but source creates AudioContext too early | Advanced optional | audioEnabled, gesture labels | User gesture start/stop | Browser autoplay warning risk |
| Polaroid wall | `section4`, 12 remote images | Works | Core | polaroids repeater, stories | Flip card tests | Remote image provenance |
| Newsletter | `section5` | Mock discount works | Core demo | email labels, interests, legal copy | Fill/submit/validation | Missing privacy consent |
| WhatsApp demostrativo | `whatsappChat`, placeholder number | Works but fake number | Advanced optional demo | phone/link/options | Open chat and safe URL validation | Placeholder phone must not ship as real |
| CTA flotante | `floatingCta` | Appears after scroll | Core | label, target section/URL | Scroll/click test | Needs valid URL/target semantics |
| Progress bar | `scrollProgress` | Works | Core | color, enabled | Scroll progress assert | None material |
| Back to top | `backToTop` | Works | Core | label/visibility | Scroll and click | None material |
| Toasts | `showToast` | Works | Core | labels, duration | Action triggers toast | Emoji/messaging consistency |
| Footer | `section6`, certificate, live viewers, gear | Works | Core | footer copy, certificate demo, contact | Scroll/footer snapshot | Phone visible; simulated viewers |
| Logros/easter eggs | collector, QR, factory mode | Works partly; QR invisible; toggles bug | Advanced optional demo | showAchievements, QR pieces, factory mode | Find piece, collector, reset QA | Discoverability and storage validation |

## Function Classification

Core fidelity for V1:

- identity, teaser, preloader, navigation, ES/EN, hero video, glitch, horizontal gallery, runway, product modal, demo cart, wishlist, lookbook editorial/store, demo reservation, audiovisual grid, timeline/designers, polaroids, newsletter, floating CTA, progress, toasts, footer.

Advanced optional:

- co-creation, voting, AR, style generator, ambient audio, WhatsApp, achievements, QR/easter eggs.

Demo only:

- checkout, stock, blockchain/NFT certificate, AI generation, multi-user voting, inventory, reservations backend, precise AR, live viewers.

## Required Builder Contract After Asset Gate

The `fashion-commerce-pro` builder must use one template definition and one builder module: `js/sector-blueprints/fashion-commerce-pro.js`.

Required schema groups:

- global brand settings
- section definitions
- hero campaign fields
- `products[]` repeater
- `looks[]` repeater
- media slots
- translation groups
- demo commerce settings
- suits customizer data model
- motion/responsive controls

Required Suits data:

- `suitModels[]`
- `fabrics[]`
- `linings[]`
- `lapels[]`
- `buttons[]`
- `pockets[]`
- `trouserOptions[]`
- `monogramOptions[]`
- `sizeProfiles[]`
- `suitConfiguration`

## Current Decision

Implementation is paused at the source-audit gate. Continuing without an approved asset route would either hotlink production assets, copy media with unclear provenance, or build a reinterpretation that violates the requested fidelity.
