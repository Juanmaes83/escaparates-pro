import fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { resolveRequestId } from './lib/request-id.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFoundHandler } from './middleware/not-found.js'
import { healthRoutes } from './routes/health.js'
import { readyRoutes } from './routes/ready.js'
import { v1Routes } from './routes/v1.js'
import { statusRoutes } from './routes/status.js'
import { internalDbSchemaRoutes } from './routes/internal-db-schema.js'
import { internalDbMigrateRoutes } from './routes/internal-db-migrate.js'

export async function buildApp() {
  const app = fastify({
    logger,
    disableRequestLogging: false,
    genReqId: (req) => resolveRequestId(req.headers['x-request-id']),
  })

  // ── Request ID hook (must run before rate-limit) ─────────────────────────

  app.addHook('onRequest', async (request) => {
    // genReqId already resolved the ID; expose it on request.requestId
    // Fastify stores it as request.id — mirror it to our typed field
    request.requestId = String(request.id)
  })

  // ── Plugins ──────────────────────────────────────────────────────────────

  await app.register(helmet)

  const corsOrigins = env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)

  await app.register(cors, {
    // Browser access stays disabled until an explicit allowlist is configured.
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  app.addHook('onSend', async (request, reply, _payload) => {
    void reply.header('X-Request-ID', request.requestId)
    return _payload
  })

  // ── Error handlers ────────────────────────────────────────────────────────

  app.setErrorHandler(errorHandler)
  app.setNotFoundHandler(notFoundHandler)

  // ── Routes ────────────────────────────────────────────────────────────────

  await app.register(healthRoutes)
  await app.register(readyRoutes)
  await app.register(v1Routes)
  await app.register(statusRoutes)
  await app.register(internalDbSchemaRoutes)
  await app.register(internalDbMigrateRoutes)

  return app
}
