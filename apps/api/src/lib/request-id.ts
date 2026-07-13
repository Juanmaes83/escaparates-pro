/**
 * Generates a request ID with the format req_XXXXXXXX (8 hex chars).
 * Respects an incoming X-Request-ID header if present.
 */
export function generateRequestId(): string {
  const hex = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, '0')
  return `req_${hex}`
}

export function resolveRequestId(incoming?: string | string[]): string {
  if (incoming) {
    const id = Array.isArray(incoming) ? incoming[0] : incoming
    if (id && id.trim().length > 0) {
      return id.trim()
    }
  }
  return generateRequestId()
}
