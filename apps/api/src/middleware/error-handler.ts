import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { buildErrorResponse } from '../lib/errors.js'

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const requestId = request.requestId ?? 'unknown'

  // Rate limit errors from @fastify/rate-limit
  if (error.statusCode === 429) {
    void reply.status(429).send(
      buildErrorResponse('RATE_LIMITED', 'Too many requests', requestId),
    )
    return
  }

  // Validation errors
  if (error.statusCode === 400) {
    void reply.status(400).send(
      buildErrorResponse('VALIDATION_ERROR', error.message, requestId),
    )
    return
  }

  // Generic server error
  const statusCode = error.statusCode ?? 500
  const code = statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'
  const message =
    statusCode >= 500 ? 'An unexpected error occurred' : error.message

  request.log.error({ err: error, requestId }, 'Request error')

  void reply.status(statusCode).send(buildErrorResponse(code, message, requestId))
}
