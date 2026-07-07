export interface SuccessResponse<T = Record<string, unknown>> {
  data: T
  requestId: string
  timestamp: string
}

export function buildSuccessResponse<T>(
  data: T,
  requestId: string,
): SuccessResponse<T> {
  return {
    data,
    requestId,
    timestamp: new Date().toISOString(),
  }
}
