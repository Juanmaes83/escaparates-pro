import type { FastifyInstance } from 'fastify'

export async function v1Routes(app: FastifyInstance): Promise<void> {
  app.get('/v1', async (_request, reply) => {
    return reply.status(200).send({ version: '1.0.0', status: 'ok' })
  })
}
