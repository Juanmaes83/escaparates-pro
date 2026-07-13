import type { FastifyInstance, FastifyRequest } from 'fastify'
import { and, eq, gt } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../db/index.js'
import { sessions, users } from '../db/schema.js'
import { buildErrorResponse } from '../lib/errors.js'
import { hashPassword, normalizeEmail, verifyPassword } from '../lib/password.js'
import {
  createRefreshToken,
  createRefreshTokenExpiry,
  hashRefreshToken,
} from '../lib/session-token.js'

const registerSchema = z.object({
  email: z.string().email().max(320).transform(normalizeEmail),
  password: z.string().min(8).max(256),
  name: z.string().trim().min(1).max(120).optional(),
})

const loginSchema = z.object({
  email: z.string().email().max(320).transform(normalizeEmail),
  password: z.string().min(1).max(256),
})

type UserPublic = {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  createdAt: string
}

function toPublicUser(user: typeof users.$inferSelect): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  }
}

function readBearerToken(request: FastifyRequest): string | null {
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

async function createSession(userId: string) {
  const refreshToken = createRefreshToken()
  const refreshTokenHash = hashRefreshToken(refreshToken)
  const expiresAt = createRefreshTokenExpiry()

  const [session] = await getDb()
    .insert(sessions)
    .values({
      userId,
      refreshTokenHash,
      expiresAt,
    })
    .returning()

  if (!session) {
    throw new Error('Session could not be created')
  }

  return { refreshToken, session }
}

async function findUserByBearerToken(request: FastifyRequest) {
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

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/v1/auth/register', async (request, reply) => {
    const requestId = request.requestId
    const parsed = registerSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send(
        buildErrorResponse(
          'VALIDATION_ERROR',
          'Invalid email, password, or name',
          requestId,
        ),
      )
    }

    const existing = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1)

    if (existing.length > 0) {
      return reply.status(409).send(
        buildErrorResponse(
          'EMAIL_ALREADY_EXISTS',
          'An account with this email already exists',
          requestId,
        ),
      )
    }

    const passwordHash = await hashPassword(parsed.data.password)
    const [user] = await getDb()
      .insert(users)
      .values({
        email: parsed.data.email,
        passwordHash,
        name: parsed.data.name ?? null,
      })
      .returning()

    if (!user) {
      throw new Error('User could not be created')
    }

    const { refreshToken, session } = await createSession(user.id)

    return reply.status(201).send({
      user: toPublicUser(user),
      session: {
        refreshToken,
        expiresAt: session.expiresAt.toISOString(),
      },
      requestId,
    })
  })

  app.post('/v1/auth/login', async (request, reply) => {
    const requestId = request.requestId
    const parsed = loginSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send(
        buildErrorResponse(
          'VALIDATION_ERROR',
          'Invalid email or password',
          requestId,
        ),
      )
    }

    const [user] = await getDb()
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1)

    const passwordOk = await verifyPassword(
      parsed.data.password,
      user?.passwordHash,
    )

    if (!user || !passwordOk) {
      return reply.status(401).send(
        buildErrorResponse(
          'INVALID_CREDENTIALS',
          'Invalid email or password',
          requestId,
        ),
      )
    }

    const { refreshToken, session } = await createSession(user.id)

    return reply.status(200).send({
      user: toPublicUser(user),
      session: {
        refreshToken,
        expiresAt: session.expiresAt.toISOString(),
      },
      requestId,
    })
  })

  app.get('/v1/auth/me', async (request, reply) => {
    const requestId = request.requestId
    const auth = await findUserByBearerToken(request)

    if (!auth) {
      return reply.status(401).send(
        buildErrorResponse('UNAUTHORIZED', 'Authentication required', requestId),
      )
    }

    return reply.status(200).send({
      user: toPublicUser(auth.user),
      session: {
        id: auth.session.id,
        expiresAt: auth.session.expiresAt.toISOString(),
      },
      requestId,
    })
  })

  app.post('/v1/auth/logout', async (request, reply) => {
    const requestId = request.requestId
    const refreshToken = readBearerToken(request)

    if (!refreshToken) {
      return reply.status(401).send(
        buildErrorResponse('UNAUTHORIZED', 'Authentication required', requestId),
      )
    }

    await getDb()
      .delete(sessions)
      .where(eq(sessions.refreshTokenHash, hashRefreshToken(refreshToken)))

    return reply.status(200).send({ status: 'ok', requestId })
  })
}
