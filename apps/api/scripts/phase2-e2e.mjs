#!/usr/bin/env node
// The canonical Phase 2 live E2E runner lives in tools/phase2/api-e2e.mjs.
// This file is a thin wrapper that preserves the historical apps/api/scripts
// path referenced by .github/workflows/phase2-live-e2e.yml. It must NOT contain
// a second implementation — importing the canonical runner executes it in this
// same process, so process.argv (the API base URL) and the exit code propagate.
import '../../../tools/phase2/api-e2e.mjs';
