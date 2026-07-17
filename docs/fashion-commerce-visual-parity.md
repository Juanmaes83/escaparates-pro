# Fashion Commerce PRO Visual Parity

Date: 2026-07-18
PR: #26
Branch: `feature/fashion-commerce-pro`
Reference: `https://juanmaes83.github.io/WEB-PREMIUM-MODA-CON-CLAUDE/`

## Objective

Rebuild Fashion Commerce PRO as a source-faithful, standalone Custom PRO template. The target gate for Core is at least 90/100 visual and functional parity, with no category below its minimum threshold.

## Required Capture Matrix

Source and preview must be compared at these viewports:

| Viewport | Purpose | Status |
|---|---|---|
| 1440 x 900 | Desktop editorial baseline | Pending capture |
| 1280 x 800 | Laptop baseline | Pending capture |
| 834 x 1112 | Tablet portrait | Pending capture |
| 390 x 844 | Mobile portrait | Pending capture |

## Required States

| State | Status |
|---|---|
| Teaser | Implemented first pass, pending source comparison |
| Preloader | Implemented first pass, pending source comparison |
| Header/nav | Partial |
| Cinematic hero | Partial, second pass with responsive crop/overlay controls |
| Glitch | Partial, autonomous pulse and hover distortion implemented |
| Gallery | Partial, snap track with prev/next and keyboard implemented |
| Drag | Partial, pointer drag/swipe implemented without global wheel hijack |
| Runway | Partial, start/stop/active/progress/cleanup implemented |
| Modal | Partial, product media/details/options/actions implemented |
| Wishlist | Partial, scoped persistence, counter, panel and removal implemented |
| Cart | Partial, scoped persistence, quantities, subtotal, counter and removal implemented |
| Editorial/store lookbook | Pending |
| Reservation | Pending |
| Co-creation | Pending |
| AR/fitting room | Pending |
| Style generator | Pending |
| Timeline/BTS | Pending |
| Designers | Pending |
| Video grid | Partial |
| Polaroids | Pending |
| Newsletter | Pending |
| Footer | Pending |
| Floating CTA | Partial |
| Cursor | Partial, custom drag cursor implemented for gallery |
| Audio/mute | Partial, UI state implemented without external audio asset |
| Back-to-top | Pending |

## Current Visual Assessment

Current implementation has moved beyond the first functional block: it preserves the authorized RUBIK SOTA hero/campaign media, uses responsive hero variables, and includes grain, scanner, film burn, autonomous glitch, custom drag cursor, CTA magnetism, audio/mute UI state, snap gallery controls, pointer drag/swipe, runway progress state, product detail modal, wishlist panel and demo cart panel. It is still below the Core gate because several source sections and deeper editorial/utility interactions are not yet reconstructed.

## Evidence Rules

- Do not claim the Core gate until browser screenshots exist for every required viewport and state.
- Do not use placeholder visual evidence for source-only states.
- Local Windows Playwright may fail with `spawn EPERM`; CI artifacts are acceptable evidence when tied to the exact HEAD and preview URL.
