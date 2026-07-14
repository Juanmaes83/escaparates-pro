import type { FastifyInstance } from 'fastify'
import { findAuthContextByBearerToken } from '../lib/auth-context.js'
import { buildEntitlements } from '../lib/entitlements.js'
import { buildErrorResponse } from '../lib/errors.js'
import { findPrimaryWorkspace } from '../lib/workspace-defaults.js'

export async function entitlementsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/entitlements', async (request, reply) => {
    const requestId = request.requestId
    const auth = await findAuthContextByBearerToken(request)

    if (!auth) {
      return reply.status(401).send(
        buildErrorResponse('UNAUTHORIZED', 'Authentication required', requestId),
      )
    }

    const workspace = await findPrimaryWorkspace(auth.user.id)
    const entitlements = buildEntitlements(
      workspace?.plan ?? 'free',
      workspace?.billingStatus ?? 'free',
    )

    return reply.status(200).send({
      workspace: workspace
        ? {
            id: workspace.id,
            name: workspace.name,
            plan: workspace.plan,
            billingStatus: workspace.billingStatus,
            currentPeriodEnd: workspace.currentPeriodEnd?.toISOString() ?? null,
          }
        : null,
      entitlements,
      source: 'server',
      requestId,
    })
  })
}
