import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { env } from '../config/env.js'
import { getDb } from '../db/index.js'
import { sessions, users } from '../db/schema.js'
import {
  findAuthContextByBearerToken,
  readBearerToken,
  toPublicUser,
} from '../lib/auth-context.js'
import { buildErrorResponse, extractDbDiagnostic } from '../lib/errors.js'
import { recordRegistrationLegalAcceptance } from '../lib/legal.js'
import { hashPassword, normalizeEmail, verifyPassword } from '../lib/password.js'
import {
  createRefreshToken,
  createRefreshTokenExpiry,
  hashRefreshToken,
} from '../lib/session-token.js'
import { ensureDefaultWorkspace } from '../lib/workspace-defaults.js'

const registerSchema = z.object({
  email: z.string().email().max(320).transform(normalizeEmail),
  password: z.string().min(8).max(256),
  name: z.string().trim().min(1).max(120).optional(),
  termsAccepted: z.literal(true),
})

const loginSchema = z.object({
  email: z.string().email().max(320).transform(normalizeEmail),
  password: z.string().min(1).max(256),
})

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

type StagedError = { epStage?: string }

/**
 * Label the stage that owns a DB operation so a failure can be attributed to the
 * exact step (email_lookup, insert_user, ensure_workspace, ...).
 */
async function runStage<T>(stage: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (err && typeof err === 'object') {
      ;(err as StagedError).epStage = stage
    }
    throw err
  }
}

// Expose the PII-free DB diagnostic everywhere except production, so a single
// failing auth request in staging reveals its exact stage/SQLSTATE/column.
const EXPOSE_DIAGNOSTIC = env.NODE_ENV !== 'production'

function replyAuthFailure(
  request: FastifyRequest,
  reply: FastifyReply,
  err: unknown,
) {
  const stage =
    err && typeof err === 'object' && typeof (err as StagedError).epStage === 'string'
      ? ((err as StagedError).epStage as string)
      : 'unknown'
  const diagnostic = extractDbDiagnostic(err, stage)
  request.log.error({ requestId: request.requestId, ...diagnostic }, 'auth request failed')
  return reply.status(500).send(
    buildErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      request.requestId,
      EXPOSE_DIAGNOSTIC ? diagnostic : undefined,
    ),
  )
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

    try {
      const existing = await runStage('email_lookup', () =>
        getDb()
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, parsed.data.email))
          .limit(1),
      )

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
      const [user] = await runStage('insert_user', () =>
        getDb()
          .insert(users)
          .values({
            email: parsed.data.email,
            passwordHash,
            name: parsed.data.name ?? null,
          })
          .returning(),
      )

      if (!user) {
        throw new Error('User could not be created')
      }

      const workspace = await runStage('ensure_workspace', () =>
        ensureDefaultWorkspace(user),
      )
      await runStage('legal_acceptance', () =>
        recordRegistrationLegalAcceptance(request, user.id, workspace.id),
      )

      const { refreshToken, session } = await runStage('create_session', () =>
        createSession(user.id),
      )

      return reply.status(201).send({
        user: toPublicUser(user),
        session: {
          refreshToken,
          expiresAt: session.expiresAt.toISOString(),
        },
        requestId,
      })
    } catch (err) {
      return replyAuthFailure(request, reply, err)
    }
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

    try {
      const [user] = await runStage('user_lookup', () =>
        getDb()
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email))
          .limit(1),
      )

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

      const { refreshToken, session } = await runStage('create_session', () =>
        createSession(user.id),
      )

      return reply.status(200).send({
        user: toPublicUser(user),
        session: {
          refreshToken,
          expiresAt: session.expiresAt.toISOString(),
        },
        requestId,
      })
    } catch (err) {
      return replyAuthFailure(request, reply, err)
    }
  })

  app.get('/v1/auth/me', async (request, reply) => {
    const requestId = request.requestId
    const auth = await findAuthContextByBearerToken(request)

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
