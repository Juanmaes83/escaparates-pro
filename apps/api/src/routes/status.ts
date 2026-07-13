import type { FastifyInstance } from 'fastify'

export async function statusRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/status', async (request, reply) => {
    const requestId = request.requestId

    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      requestId,
    })
  })
}
