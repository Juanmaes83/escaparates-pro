import fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { Readable } from 'node:stream'
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
import { authRoutes } from './routes/auth.js'
import { internalDbMigrateRoutes } from './routes/internal-db-migrate.js'
import { billingRoutes } from './routes/billing.js'
import { entitlementsRoutes } from './routes/entitlements.js'
import { projectsRoutes } from './routes/projects.js'
import { projectVersionsRoutes } from './routes/project-versions.js'
import { projectPublicationsRoutes } from './routes/project-publications.js'

export async function buildApp() {
  const app = fastify({
    logger,
    disableRequestLogging: false,
    genReqId: (req) => resolveRequestId(req.headers['x-request-id']),
  })

  app.addHook('onRequest', async (request) => {
    request.requestId = String(request.id)
  })

  app.addHook('preParsing', async (request, _reply, payload) => {
    if (request.method !== 'POST' || request.url !== '/v1/billing/webhook') {
      return payload
    }

    const chunks: Buffer[] = []
    for await (const chunk of payload) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    const rawBody = Buffer.concat(chunks)
    ;(request as typeof request & { rawBody?: Buffer }).rawBody = rawBody
    return Readable.from(rawBody)
  })

  await app.register(helmet)

  const corsOrigins = env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)

  await app.register(cors, {
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  app.addHook('onSend', async (request, reply, payload) => {
    void reply.header('X-Request-ID', request.requestId)
    return payload
  })

  app.setErrorHandler(errorHandler)
  app.setNotFoundHandler(notFoundHandler)

  await app.register(healthRoutes)
  await app.register(readyRoutes)
  await app.register(v1Routes)
  await app.register(statusRoutes)
  await app.register(authRoutes)
  await app.register(billingRoutes)
  await app.register(entitlementsRoutes)
  await app.register(projectsRoutes)
  await app.register(projectVersionsRoutes)
  await app.register(projectPublicationsRoutes)
  await app.register(internalDbSchemaRoutes)
  await app.register(internalDbMigrateRoutes)

  return app
}
