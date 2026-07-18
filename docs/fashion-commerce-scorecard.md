# Fashion Commerce PRO Scorecard

Date: 2026-07-18
PR: #26

Core gate is not approved yet. Scores below are proposed and evidence-backed (screenshots
in `tests/phase-gate1-evidence/`, `tests/phase-gate2-evidence/`, `tests/phase-gate3-evidence/`
and `tests/phase-gate4-evidence/`, driven-interaction verification in
`tests/fashion-commerce-gate2-verify.mjs` and the Gate 3/4 verification scripts referenced
in the functional parity doc), but per project policy the final Core-gate approval
(crossing 90/100) is made by the user after reviewing the Vercel preview of the final HEAD
themselves — this table is evidence for that review, not a self-granted approval.

| Area | Points | Minimum | Current | Status |
|---|---:|---:|---:|---|
| Hero / first impression | 15 | 13.5 | 9.5 | Partial — Gate 1 fixed a severe bug where the glitch title rendered at 11px instead of 160px; still short on the eyebrow-line deviation from source and second-pass crop/overlay polish |
| Nav / architecture | 8 | 8.0 | 6.5 | Partial — now that Gate 4 sections exist, nav expanded from 4 to 8 of source's 10 links (Hero, Galería, Lookbook, Co-creación, Estilo IA, Behind, Videos, Polaroid — only Probador/AR and Newsletter remain, both out of scope so far); nav slides in only at ready/skipped (matches source); mobile (390px) still overflows (Gate 5 scope). ES/EN language selector fully removed (product decision) |
| Typography / art direction | 10 | 8.0 | 4.0 | Partial, unchanged this pass |
| Effects / motion | 10 | 8.0 | 5.0 | Partial — teaser stamp/line/spark keyframes ported, hover-glitch matches source's JS-randomized distortion |
| Gallery / runway | 12 | 10.8 | 9.0 | Partial — Gate 2 closure rebuilt the gallery as a full-bleed hotspot grid matching source structure (no invented header, no bordered cards), keeping the verified interaction fixes (pointer-capture click-safe drag threshold, scroll-snap suspended during drag/wheel, wheel-to-horizontal hijack with boundary release, keyboard nav, runway start/progress/stop). Remaining gap: hotspot positions are a formulaic approximation of source's per-index layout, not pixel-identical |
| Product / modal / commerce | 10 | 8.0 | 9.0 | Gate 2+3 closure — modal now has a real, Playwright-verified focus trap (initial focus, Shift+Tab wrap-to-last, Tab back-to-first, Escape, focus restored to the exact opener element), single-overlay enforcement, scroll lock, dynamic size/color selects driven by real product variants, REF/material/stock meta, color-pop. Wishlist toggles with no duplicates and syncs live to the gallery card. Cart creates a distinct line per size/color variant (verified: two sizes of the same product produced two separate lines), qty inc/dec/remove/subtotal all verified. Dynamic renders use `textContent`/DOM nodes, not string-concatenated `innerHTML` — verified with a malicious product name/description that rendered as inert text |
| Lookbook / reservation | 10 | 8.0 | 8.5 | **Rebuilt in the Gate 3 visual audit** — the first Gate 3 pass had built an invented alternating editorial-story layout not present in source; rebuilt to match source's actual responsive grid + overlay-caption + sticky editorial/shop toggle, with `looks[]` and all commerce functions (wishlist/cart/reserve) preserved and re-wired correctly. Verified against source screenshots at all 4 viewports. Reservation demo flow verified (validation, confirmation, no backend calls). Clears its 8.0 minimum with real before/after evidence, not a self-assigned bump |
| Remaining editorial sections | 10 | 8.0 | 8.0 | Gate 4 complete — co-creación (near pixel-identical to source at 1440×900, verified voting/reset), style generator (verified distinct recommendations per style tag, clearly labeled as a local rule-based demo), timeline+designers (source's growing-line reveal mechanic ported, RandomUser replaced with already-authorized imagery, creation-click opens the correct linked product), video grid (hover-spotlight + mute ported, plus new pause-outside-viewport/tab-hidden behavior, verified), polaroids (source's actual flex-wrap+rotation composition, not a grid; flip verified). Meets its 8.0 minimum; not yet audited pixel-by-pixel at every breakpoint the way hero/lookbook were |
| Responsive | 8 | 7.2 | 3.0 | Partial, unchanged this pass (Gate 5 scope; mobile nav overflow tracked) |
| Accessibility / perf / QA | 7 | 5.6 | 5.5 | Partial — real focus trap + focus restoration verified by Playwright (not a theoretical `.focus()` call); single-overlay manager prevents two primary overlays open at once; storage isolated by projectId+presetId with migration from legacy keys; keyboard support added to polaroids and video tiles (source was mouse-only there); video grid IntersectionObserver/listeners cleaned up on pagehide |
| Total | 100 | 90.0 | 68.0 | Not approved |

## Gate Rules

- Total score must be at least 90/100.
- No category may remain below its threshold.
- Hero must be at least 13.5/15.
- Gallery/runway must be at least 10.8/12.
- Responsive must be at least 7.2/8.
- Core must contain zero placeholders and zero pending Core sections.

## Current Decision

Suits customizer is blocked until Core reaches the 90-point gate and every category clears its minimum.
