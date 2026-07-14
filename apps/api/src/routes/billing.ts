import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { z } from 'zod'
import { env } from '../config/env.js'
import { getDb } from '../db/index.js'
import { users, workspaces } from '../db/schema.js'
import { findAuthContextByBearerToken } from '../lib/auth-context.js'
import { buildErrorResponse } from '../lib/errors.js'
import {
  ensureDefaultWorkspace,
  findPrimaryWorkspace,
} from '../lib/workspace-defaults.js'

const checkoutSchema = z.object({
  plan: z.literal('pro').default('pro'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

function billingIsConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_PRO_MONTHLY)
}

function buildStripeClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  return new Stripe(env.STRIPE_SECRET_KEY)
}

function buildSuccessUrl(url?: string): string {
  return url ?? `${env.APP_PUBLIC_URL}?billing=success&session_id={CHECKOUT_SESSION_ID}`
}

function buildCancelUrl(url?: string): string {
  return url ?? `${env.APP_PUBLIC_URL}?billing=cancelled`
}

async function ensureStripeCustomer(
  stripe: Stripe,
  user: typeof users.$inferSelect,
): Promise<string> {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: {
      userId: user.id,
      source: 'escaparates-pro',
    },
  })

  await getDb()
    .update(users)
    .set({
      stripeCustomerId: customer.id,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  return customer.id
}

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/billing/status', async (request, reply) => {
    const requestId = request.requestId
    const auth = await findAuthContextByBearerToken(request)

    if (!auth) {
      return reply.status(401).send(
        buildErrorResponse('UNAUTHORIZED', 'Authentication required', requestId),
      )
    }

    const workspace = await findPrimaryWorkspace(auth.user.id)

    return reply.status(200).send({
      billingConfigured: billingIsConfigured(),
      plan: workspace?.plan ?? 'free',
      billingStatus: workspace?.billingStatus ?? 'free',
      stripeCustomerLinked: Boolean(
        auth.user.stripeCustomerId ?? workspace?.stripeCustomerId,
      ),
      stripeSubscriptionLinked: Boolean(workspace?.stripeSubscriptionId),
      currentPeriodEnd: workspace?.currentPeriodEnd?.toISOString() ?? null,
      requestId,
    })
  })

  app.post('/v1/billing/checkout', async (request, reply) => {
    const requestId = request.requestId
    const auth = await findAuthContextByBearerToken(request)

    if (!auth) {
      return reply.status(401).send(
        buildErrorResponse('UNAUTHORIZED', 'Authentication required', requestId),
      )
    }

    const parsed = checkoutSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply.status(400).send(
        buildErrorResponse(
          'VALIDATION_ERROR',
          'Invalid checkout request',
          requestId,
        ),
      )
    }

    if (!billingIsConfigured()) {
      return reply.status(503).send(
        buildErrorResponse(
          'BILLING_NOT_CONFIGURED',
          'Stripe billing is not configured for this environment',
          requestId,
        ),
      )
    }

    const stripe = buildStripeClient()
    const priceId = env.STRIPE_PRICE_PRO_MONTHLY
    if (!priceId) {
      throw new Error('STRIPE_PRICE_PRO_MONTHLY is not configured')
    }

    const workspace = await ensureDefaultWorkspace(auth.user)
    const customerId = await ensureStripeCustomer(stripe, auth.user)

    await getDb()
      .update(workspaces)
      .set({
        stripeCustomerId: customerId,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspace.id))

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: buildSuccessUrl(parsed.data.successUrl),
      cancel_url: buildCancelUrl(parsed.data.cancelUrl),
      metadata: {
        userId: auth.user.id,
        workspaceId: workspace.id,
        plan: parsed.data.plan,
      },
      subscription_data: {
        metadata: {
          userId: auth.user.id,
          workspaceId: workspace.id,
          plan: parsed.data.plan,
        },
      },
    })

    if (!session.url) {
      return reply.status(502).send(
        buildErrorResponse(
          'CHECKOUT_SESSION_ERROR',
          'Stripe did not return a checkout URL',
          requestId,
        ),
      )
    }

    return reply.status(200).send({
      checkoutUrl: session.url,
      requestId,
    })
  })
}
