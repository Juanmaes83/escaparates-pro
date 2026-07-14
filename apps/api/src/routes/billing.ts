import type { FastifyInstance } from 'fastify'
import { eq, or } from 'drizzle-orm'
import Stripe from 'stripe'
import { z } from 'zod'
import { env } from '../config/env.js'
import { getDb } from '../db/index.js'
import { stripeWebhookEvents, users, workspaces } from '../db/schema.js'
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

function webhookIsConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET)
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

function toDateFromStripeTimestamp(timestamp?: number | null): Date | null {
  return timestamp ? new Date(timestamp * 1000) : null
}

async function findWorkspaceForStripeEvent(params: {
  workspaceId?: string | null
  customerId?: string | null
  subscriptionId?: string | null
}) {
  if (params.workspaceId) {
    const [workspace] = await getDb()
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, params.workspaceId))
      .limit(1)
    if (workspace) return workspace
  }

  if (params.subscriptionId || params.customerId) {
    const condition =
      params.subscriptionId && params.customerId
        ? or(
            eq(workspaces.stripeSubscriptionId, params.subscriptionId),
            eq(workspaces.stripeCustomerId, params.customerId),
          )
        : params.subscriptionId
          ? eq(workspaces.stripeSubscriptionId, params.subscriptionId)
          : eq(workspaces.stripeCustomerId, params.customerId as string)

    const [workspace] = await getDb()
      .select()
      .from(workspaces)
      .where(condition)
      .limit(1)
    if (workspace) return workspace
  }

  return null
}

async function updateWorkspaceSubscription(params: {
  workspaceId?: string | null
  customerId?: string | null
  subscriptionId?: string | null
  plan?: string | null
  billingStatus: string
  currentPeriodEnd?: Date | null
}) {
  const workspace = await findWorkspaceForStripeEvent(params)
  if (!workspace) return null

  const plan =
    params.plan ||
    (params.billingStatus === 'active' || params.billingStatus === 'trialing'
      ? 'pro'
      : workspace.plan)

  const [updated] = await getDb()
    .update(workspaces)
    .set({
      plan,
      billingStatus: params.billingStatus,
      stripeCustomerId: params.customerId ?? workspace.stripeCustomerId,
      stripeSubscriptionId: params.subscriptionId ?? workspace.stripeSubscriptionId,
      currentPeriodEnd: params.currentPeriodEnd ?? workspace.currentPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(workspaces.id, workspace.id))
    .returning()

  return updated ?? workspace
}

async function processStripeEvent(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const workspace = await updateWorkspaceSubscription({
      workspaceId: session.metadata?.workspaceId ?? null,
      customerId:
        typeof session.customer === 'string' ? session.customer : session.customer?.id,
      subscriptionId:
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id,
      plan: session.metadata?.plan ?? 'pro',
      billingStatus: 'active',
    })
    return workspace
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription
    const subscriptionAny = subscription as Stripe.Subscription & {
      current_period_end?: number
    }
    const workspace = await updateWorkspaceSubscription({
      workspaceId: subscription.metadata?.workspaceId ?? null,
      customerId:
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id,
      subscriptionId: subscription.id,
      plan: event.type === 'customer.subscription.deleted'
        ? 'free'
        : subscription.metadata?.plan ?? 'pro',
      billingStatus:
        event.type === 'customer.subscription.deleted'
          ? 'cancelled'
          : subscription.status,
      currentPeriodEnd: toDateFromStripeTimestamp(
        subscriptionAny.current_period_end ?? null,
      ),
    })
    return workspace
  }

  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const invoiceAny = invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null
    }
    const subscriptionId =
      typeof invoiceAny.subscription === 'string'
        ? invoiceAny.subscription
        : invoiceAny.subscription?.id
    const customerId =
      typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
    const workspace = await updateWorkspaceSubscription({
      customerId,
      subscriptionId,
      billingStatus: event.type === 'invoice.paid' ? 'active' : 'past_due',
    })
    return workspace
  }

  return null
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

  app.post('/v1/billing/webhook', async (request, reply) => {
    const requestId = request.requestId

    if (!webhookIsConfigured()) {
      return reply.status(503).send(
        buildErrorResponse(
          'WEBHOOK_NOT_CONFIGURED',
          'Stripe webhook secret is not configured for this environment',
          requestId,
        ),
      )
    }

    const signature = request.headers['stripe-signature']
    if (!signature || Array.isArray(signature)) {
      return reply.status(400).send(
        buildErrorResponse(
          'WEBHOOK_SIGNATURE_MISSING',
          'Stripe signature header is required',
          requestId,
        ),
      )
    }

    const rawBody = (request as typeof request & { rawBody?: Buffer }).rawBody
    if (!rawBody) {
      return reply.status(400).send(
        buildErrorResponse(
          'WEBHOOK_RAW_BODY_MISSING',
          'Raw webhook body is required for signature verification',
          requestId,
        ),
      )
    }

    const stripe = buildStripeClient()
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET as string,
      )
    } catch (error) {
      return reply.status(400).send(
        buildErrorResponse(
          'WEBHOOK_SIGNATURE_INVALID',
          error instanceof Error ? error.message : 'Invalid Stripe webhook signature',
          requestId,
        ),
      )
    }

    const existing = await getDb()
      .select({ id: stripeWebhookEvents.id })
      .from(stripeWebhookEvents)
      .where(eq(stripeWebhookEvents.stripeEventId, event.id))
      .limit(1)

    if (existing.length > 0) {
      return reply.status(200).send({
        received: true,
        duplicate: true,
        eventId: event.id,
        requestId,
      })
    }

    try {
      const workspace = await processStripeEvent(event)
      await getDb().insert(stripeWebhookEvents).values({
        stripeEventId: event.id,
        eventType: event.type,
        processingStatus: 'processed',
        workspaceId: workspace?.id ?? null,
        payload: event as unknown as Record<string, unknown>,
      })

      return reply.status(200).send({
        received: true,
        duplicate: false,
        eventId: event.id,
        eventType: event.type,
        workspaceId: workspace?.id ?? null,
        requestId,
      })
    } catch (error) {
      await getDb().insert(stripeWebhookEvents).values({
        stripeEventId: event.id,
        eventType: event.type,
        processingStatus: 'failed',
        payload: event as unknown as Record<string, unknown>,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })

      throw error
    }
  })
}
