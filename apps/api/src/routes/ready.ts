import type { FastifyInstance } from 'fastify'
import { checkDbConnection } from '../db/index.js'

export async function readyRoutes(app: FastifyInstance): Promise<void> {
  app.get('/ready', async (_request, reply) => {
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
