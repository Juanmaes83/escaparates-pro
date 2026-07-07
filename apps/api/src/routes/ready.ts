import type { FastifyInstance } from 'fastify'

export async function readyRoutes(app: FastifyInstance): Promise<void> {
  app.get('/ready', async (_request, reply) => {
    return reply.status(200).send({ status: 'ready' })
  })
}
