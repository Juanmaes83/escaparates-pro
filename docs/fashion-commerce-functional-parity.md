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
