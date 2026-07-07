import type { FastifyInstance } from 'fastify'
import { checkDbConnection } from '../db/index.js'
import { env } from '../config/env.js'

export async function readyRoutes(app: FastifyInstance): Promise<void> {
  app.get('/ready', async (_request, reply) => {
    if (!env.DATABASE_URL) {
      return reply.status(200).send({
        status: 'ready',
        database: 'not_configured',
      })
    }

    const dbOk = await checkDbConnection()

    if (!dbOk) {
      return reply.status(503).send({
        status: 'unavailable',
        database: 'disconnected',
      })
    }

    return reply.status(200).send({
      status: 'ready',
      database: 'connected',
    })
  })
}
