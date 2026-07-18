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
| Nav / architecture | 8 | 8.0 | 7.0 | Partial — nav now carries 9 destinations (added Newsletter); the decorative `#rsAudio` control that was incorrectly sitting inside the nav bar (source has no nav audio control at all) has been moved out to the floating utilities and given a real function. Still short of full 8/8: mobile (390px) overflow and the full architecture hardening pass are tracked under the pending hardening task, not yet done |
| Typography / art direction | 10 | 8.0 | 4.0 | Partial, unchanged this pass — pending hardening task |
| Effects / motion | 10 | 8.0 | 5.0 | Partial, unchanged this pass — pending hardening task |
| Gallery / runway | 12 | 10.8 | 9.0 | Partial, unchanged this pass — hotspot positions still a formulaic approximation, not source-identical; pending hardening task |
| Product / modal / commerce | 10 | 8.0 | 9.0 | Gate 2+3 closure — modal now has a real, Playwright-verified focus trap (initial focus, Shift+Tab wrap-to-last, Tab back-to-first, Escape, focus restored to the exact opener element), single-overlay enforcement, scroll lock, dynamic size/color selects driven by real product variants, REF/material/stock meta, color-pop. Wishlist toggles with no duplicates and syncs live to the gallery card. Cart creates a distinct line per size/color variant (verified: two sizes of the same product produced two separate lines), qty inc/dec/remove/subtotal all verified. Dynamic renders use `textContent`/DOM nodes, not string-concatenated `innerHTML` — verified with a malicious product name/description that rendered as inert text |
| Lookbook / reservation | 10 | 8.0 | 8.5 | **Rebuilt in the Gate 3 visual audit** — the first Gate 3 pass had built an invented alternating editorial-story layout not present in source; rebuilt to match source's actual responsive grid + overlay-caption + sticky editorial/shop toggle, with `looks[]` and all commerce functions (wishlist/cart/reserve) preserved and re-wired correctly. Verified against source screenshots at all 4 viewports. Reservation demo flow verified (validation, confirmation, no backend calls). Clears its 8.0 minimum with real before/after evidence, not a self-assigned bump |
| Remaining editorial + Gate 5 sections | 10 | 8.0 | 8.5 | Gate 4 complete (co-creación, style generator, timeline+designers, video grid, polaroids — see prior rows' history) **plus Gate 5 complete this pass**: newsletter (real empty/invalid/valid email validation, demo-labeled confirmation, QA reset, single-select interest pills — all Playwright-verified), footer (faithful brand-statement/live-viewers/certificate/credit/copyright structure, no invented nav/social row), and floating utilities (audio/mute relocated out of the nav with a real mute effect on hero+campaign videos, new back-to-top with correct show/hide threshold and no overlap with the floating CTA, verified with a real `getBoundingClientRect()` check at 390px). Not yet audited pixel-by-pixel at every breakpoint the way hero/lookbook were — that pass is still pending |
| Responsive | 8 | 7.2 | 3.0 | Partial — the Gate 5 sections themselves were checked for mobile overlap/overflow as they were built, but the full cross-Gate 1-5 responsive hardening pass across all 4 viewports has not happened yet |
| Accessibility / perf / QA | 7 | 5.6 | 6.0 | Partial — real focus trap + focus restoration verified by Playwright; single-overlay manager; storage isolated with migration from legacy keys; keyboard support on polaroids/video tiles; video grid observers cleaned up on pagehide. Gate 5 adds: `aria-invalid`/`aria-live`/`role="alert"` on newsletter validation, focus returned to the input on error and after reset, keyboard-operable back-to-top. A real bug was found and fixed via driven interaction (not code review): a Studio-only debug button was overlapping and intercepting clicks on the new floating controls inside the Studio iframe — see Functional Parity doc §5.4 |
| Total | 100 | 90.0 | 69.5 | Not approved |

## Gate Rules

- Total score must be at least 90/100.
- No category may remain below its threshold.
- Hero must be at least 13.5/15.
- Gallery/runway must be at least 10.8/12.
- Responsive must be at least 7.2/8.
- Core must contain zero placeholders and zero pending Core sections.

## Current Decision

Suits customizer is blocked until Core reaches the 90-point gate and every category clears its minimum.
