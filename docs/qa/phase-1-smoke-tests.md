# Phase 1 Smoke Tests

Manual test plan to validate the Phase 1 API foundation before promoting to production.

---

## Prerequisites

- API is running locally (`npm run dev` inside `apps/api`) or deployed to Railway
- `BASE_URL` is set to `http://localhost:3001` (local) or the Railway URL (staging/prod)
- `curl` or any HTTP client available

---

## Test Suite

### T01 — Liveness probe

```bash
curl -i $BASE_URL/health
```

**Expected:**
- HTTP 200
- Body: `{ "status": "ok" }`

---

### T02 — Readiness probe

```bash
curl -i $BASE_URL/ready
```

**Expected:**
- HTTP 200
- Body: `{ "status": "ready" }`

---

### T03 — API root

```bash
curl -i $BASE_URL/v1
```

**Expected:**
- HTTP 200
- Body: `{ "version": "1.0.0", "status": "ok" }`

---

### T04 — Status with requestId

```bash
curl -i $BASE_URL/v1/status
```

**Expected:**
- HTTP 200
- Body contains `status`, `timestamp` (ISO 8601), `requestId` (starts with `req_`)
- Response header `X-Request-ID` matches `requestId` in body

---

### T05 — Client-supplied X-Request-ID is respected

```bash
curl -i -H "X-Request-ID: my-custom-id-123" $BASE_URL/v1/status
```

**Expected:**
- HTTP 200
- `requestId` in body is `my-custom-id-123`
- Response header `X-Request-ID: my-custom-id-123`

---

### T06 — 404 normalised error

```bash
curl -i $BASE_URL/this-route-does-not-exist
```

**Expected:**
- HTTP 404
- Body:
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Route GET /this-route-does-not-exist not found",
      "requestId": "req_...",
      "timestamp": "..."
    }
  }
  ```

---

### T07 — 404 includes requestId in header

```bash
curl -i $BASE_URL/missing
```

**Expected:**
- Response header `X-Request-ID` is present and matches `error.requestId` in body

---

### T08 — Rate limit triggers

Send 101 rapid requests to the same endpoint:

```bash
for i in $(seq 1 101); do curl -s -o /dev/null -w "%{http_code}\n" $BASE_URL/v1/status; done
```

**Expected:**
- First 100 requests return HTTP 200
- Request 101+ returns HTTP 429
- Body:
  ```json
  {
    "error": {
      "code": "RATE_LIMITED",
      "message": "Too many requests...",
      "requestId": "req_...",
      "timestamp": "..."
    }
  }
  ```

---

### T09 — Security headers present

```bash
curl -i $BASE_URL/health
```

**Expected headers (from @fastify/helmet):**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 0`
- `Content-Security-Policy` present

---

### T10 — Server-generated requestId format

```bash
curl -s $BASE_URL/v1/status | jq -r '.requestId'
```

**Expected:**
- Matches regex `^req_[0-9a-f]{8}$`

---

### T11 — Logs are valid JSON

```bash
npm run dev 2>&1 | head -5
```

**Expected:**
- Each log line is valid JSON
- Contains `level`, `time`, `service`, `msg` fields
- No pino-pretty formatting (no ANSI colour codes)

---

### T12 — TypeScript strict mode passes

```bash
cd apps/api && npm run typecheck
```

**Expected:**
- Exit code 0
- No TypeScript errors

---

### T13 — Build produces dist/

```bash
cd apps/api && npm run build && ls dist/
```

**Expected:**
- Exit code 0
- `dist/index.js` exists
- `dist/app.js` exists

---

## Pass Criteria

All 13 tests must pass before the Phase 1 foundation is considered complete and ready for Phase 2 work to begin.
