export interface ErrorResponse {
  error: {
    code: string
    message: string
    requestId: string
    timestamp: string
  }
}

export function buildErrorResponse(
  code: string,
  message: string,
  requestId: string,
): ErrorResponse {
  return {
    error: {
      code,
      message,
      requestId,
      timestamp: new Date().toISOString(),
    },
  }
}
