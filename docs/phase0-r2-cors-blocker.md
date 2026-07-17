# Phase 0 R2/CORS blocker

PR #24 keeps the real Vercel/Railway/R2 browser QA enabled. The remaining failure is external to the Studio contract changes: the browser cannot complete the direct signed PUT to R2 because the bucket preflight is rejected.

Last verified evidence:

- Preview origin: `https://escaparates-344turfnw-juanma-espinosas-projects.vercel.app`
- Signed PUT host: `5cb4106891067d530590556cbb35113b.r2.cloudflarestorage.com`
- Preflight request: `OPTIONS` with `Origin`, `Access-Control-Request-Method: PUT`, and `Access-Control-Request-Headers: content-type`
- Preflight status: `403`
- Missing response headers: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`

Resolution must be handled separately:

1. Configure CORS on the R2 bucket for the current Vercel preview/prod origins and signed PUT headers.
2. Use a backend upload proxy only if that architectural change is approved.

After the storage fix, rerun only the failed `Phase 2 Vercel Browser QA` workflow on the current PR head and confirm WebM upload, PNG upload, persistence, replacement, deletion, export, and publication.
