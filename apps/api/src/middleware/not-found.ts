import type { FastifyReply, FastifyRequest } from 'fastify'
import { buildErrorResponse } from '../lib/errors.js'

export function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const requestId = request.requestId ?? 'unknown'

  void reply.status(404).send(
    buildErrorResponse(
      'NOT_FOUND',
      `Route ${request.method} ${request.url} not found`,
      requestId,
    ),
  )
}
