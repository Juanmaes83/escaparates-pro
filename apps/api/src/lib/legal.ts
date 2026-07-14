import type { FastifyRequest } from 'fastify'
import { getDb } from '../db/index.js'
import { legalAcceptances } from '../db/schema.js'

export const REQUIRED_LEGAL_DOCUMENTS = [
  { documentKey: 'terms', documentVersion: '2026-07-14-v0.1' },
  { documentKey: 'privacy', documentVersion: '2026-07-14-v0.1' },
] as const

export async function recordRegistrationLegalAcceptance(
  request: FastifyRequest,
  userId: string,
  workspaceId: string | null,
): Promise<void> {
  const userAgent = request.headers['user-agent']
  const ipAddress = request.ip || null

  await getDb()
    .insert(legalAcceptances)
    .values(
      REQUIRED_LEGAL_DOCUMENTS.map((doc) => ({
        userId,
        workspaceId,
        documentKey: doc.documentKey,
        documentVersion: doc.documentVersion,
        ipAddress,
        userAgent: Array.isArray(userAgent) ? userAgent.join(' ') : userAgent ?? null,
        source: 'registration',
      })),
    )
    .onConflictDoNothing()
}
