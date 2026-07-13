# API Contract Draft

This document defines the request/response format for the Escaparates Pro API. All endpoints follow these conventions.

---

## Base URL

```
https://api.escaparates.pro   (production)
http://localhost:3001          (local development)
```

---

## Request Headers

| Header | Required | Description |
|---|---|---|
| `Content-Type` | Yes (for POST/PUT/PATCH) | Must be `application/json` |
| `X-Request-ID` | No | Client-supplied request ID. If omitted, the server generates one. |
| `Authorization` | No (Phase 1) | Bearer JWT — required in Phase 2+ for protected routes |

---

## Response Headers

| Header | Always present | Description |
|---|---|---|
| `X-Request-ID` | Yes | The resolved request ID (client-supplied or server-generated) |
| `Content-Type` | Yes | `application/json; charset=utf-8` |

---

## Success Response

Simple endpoints (health, ready, v1 root) return a flat object:

```json
{ "status": "ok" }
```

Endpoints that return domain data use the envelope format:

```json
{
  "data": { ... },
  "requestId": "req_a1b2c3d4",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### `/v1/status` example

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_a1b2c3d4"
}
```

---

## Error Response

All errors use a consistent envelope:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Route GET /v1/unknown not found",
    "requestId": "req_a1b2c3d4",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `NOT_FOUND` | 404 | Route or resource does not exist |
| `VALIDATION_ERROR` | 400 | Request body or query params failed validation |
| `RATE_LIMITED` | 429 | Too many requests from this IP |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
| `REQUEST_ERROR` | 4xx | Generic client error |

---

## Request ID Format

Server-generated IDs follow the pattern `req_XXXXXXXX` where `X` is a lowercase hex character (0–9, a–f). Example: `req_3f8a1c2b`.

Client-supplied IDs are accepted as-is (any non-empty string).

---

## Versioning

The API is versioned via URL path prefix (`/v1`). Breaking changes will introduce a new prefix (`/v2`). Non-breaking additions (new fields, new endpoints) are made within the existing version.

---

## Pagination (Phase 2+)

List endpoints will use cursor-based pagination:

```json
{
  "data": [ ... ],
  "pagination": {
    "cursor": "eyJpZCI6IjEyMyJ9",
    "hasMore": true,
    "limit": 20
  },
  "requestId": "req_a1b2c3d4",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Rate Limiting

- **Limit:** 100 requests per minute per IP
- **Headers returned on every response:**
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
- **On limit exceeded:** HTTP 429 with `RATE_LIMITED` error body
