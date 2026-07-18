# Fashion Commerce PRO Scorecard

Date: 2026-07-18
PR: #26

Core gate is not approved yet. Scores below are proposed and evidence-backed (screenshots
in `tests/phase-gate1-evidence/` and `tests/phase-gate2-evidence/`, driven-interaction
verification in `tests/fashion-commerce-gate2-verify.mjs` and the Gate 3 verification
scripts referenced in the functional parity doc), but per project policy the final
Core-gate approval (crossing 90/100) is made by the user after reviewing the Vercel preview
of the final HEAD themselves — this table is evidence for that review, not a self-granted
approval.

| Area | Points | Minimum | Current | Status |
|---|---:|---:|---:|---|
| Hero / first impression | 15 | 13.5 | 9.5 | Partial — Gate 1 fixed a severe bug where the glitch title rendered at 11px instead of 160px; still short on the eyebrow-line deviation from source and second-pass crop/overlay polish |
| Nav / architecture | 8 | 8.0 | 4.5 | Partial — nav slides in only at ready/skipped (matches source); still only 4 of source's 10 links exist (rest depend on Gate 4/5 sections) and mobile (390px) overflows; the ES/EN language selector itself is now fully removed (product decision, see Functional Parity doc), which resolves one Gate 2 pending item outright |
| Typography / art direction | 10 | 8.0 | 4.0 | Partial, unchanged this pass |
| Effects / motion | 10 | 8.0 | 5.0 | Partial — teaser stamp/line/spark keyframes ported, hover-glitch matches source's JS-randomized distortion |
| Gallery / runway | 12 | 10.8 | 9.0 | Partial — Gate 2 closure rebuilt the gallery as a full-bleed hotspot grid matching source structure (no invented header, no bordered cards), keeping the verified interaction fixes (pointer-capture click-safe drag threshold, scroll-snap suspended during drag/wheel, wheel-to-horizontal hijack with boundary release, keyboard nav, runway start/progress/stop). Remaining gap: hotspot positions are a formulaic approximation of source's per-index layout, not pixel-identical |
| Product / modal / commerce | 10 | 8.0 | 9.0 | Gate 2+3 closure — modal now has a real, Playwright-verified focus trap (initial focus, Shift+Tab wrap-to-last, Tab back-to-first, Escape, focus restored to the exact opener element), single-overlay enforcement, scroll lock, dynamic size/color selects driven by real product variants, REF/material/stock meta, color-pop. Wishlist toggles with no duplicates and syncs live to the gallery card. Cart creates a distinct line per size/color variant (verified: two sizes of the same product produced two separate lines), qty inc/dec/remove/subtotal all verified. Dynamic renders use `textContent`/DOM nodes, not string-concatenated `innerHTML` — verified with a malicious product name/description that rendered as inert text |
| Lookbook / reservation | 10 | 8.0 | 7.5 | Gate 3 — placeholder replaced with a real editorial section (3 looks, alternating image-left/image-right layout, model/credit/description, per-look "ver productos del look" shop view showing real shoppable rows with size/color/wishlist/cart/reserve). Reservation demo flow implemented and verified (validation, confirmation, no backend calls). Not yet fidelity-checked against source's own lookbook composition in detail (Gate 3 built an editorial system matching the *brief*, not a pixel port of source's specific lookbook DOM, which wasn't re-audited this pass) |
| Remaining editorial sections | 10 | 8.0 | 1.0 | Pending (Gate 4 scope) |
| Responsive | 8 | 7.2 | 3.0 | Partial, unchanged this pass (Gate 5 scope; mobile nav overflow tracked) |
| Accessibility / perf / QA | 7 | 5.6 | 4.5 | Partial — real focus trap + focus restoration now verified by Playwright (not a theoretical `.focus()` call); single-overlay manager prevents two primary overlays open at once; storage isolated by projectId+presetId with migration from legacy keys |
| Total | 100 | 90.0 | 56.5 | Not approved |

## Gate Rules

- Total score must be at least 90/100.
- No category may remain below its threshold.
- Hero must be at least 13.5/15.
- Gallery/runway must be at least 10.8/12.
- Responsive must be at least 7.2/8.
- Core must contain zero placeholders and zero pending Core sections.

## Current Decision

Suits customizer is blocked until Core reaches the 90-point gate and every category clears its minimum.
