import type { FastifyRequest } from 'fastify'
import { and, eq, gt } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { sessions, users } from '../db/schema.js'
import { hashRefreshToken } from './session-token.js'

export type UserPublic = {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  createdAt: string
}

export function toPublicUser(user: typeof users.$inferSelect): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  }
}

export function readBearerToken(request: FastifyRequest): string | null {
  const raw = request.headers.authorization
  if (!raw) {
    return null
  }

  const [scheme, token] = raw.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return null
  }

  return token
}

export async function findAuthContextByBearerToken(request: FastifyRequest) {
  const refreshToken = readBearerToken(request)
  if (!refreshToken) {
    return null
  }

  const refreshTokenHash = hashRefreshToken(refreshToken)
  const rows = await getDb()
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.refreshTokenHash, refreshTokenHash),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1)

  return rows[0] ?? null
}
