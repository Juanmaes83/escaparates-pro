import type { FastifyInstance } from 'fastify'
import { eq, or } from 'drizzle-orm'
import Stripe from 'stripe'
import { z } from 'zod'
import { env } from '../config/env.js'
import { getDb } from '../db/index.js'
import {
  creditLedgerEntries,
  stripeWebhookEvents,
  users,
  workspaces,
} from '../db/schema.js'
import { findAuthContextByBearerToken } from '../lib/auth-context.js'
import { buildErrorResponse } from '../lib/errors.js'
import {
  CREDIT_PACKS,
  getCreditPackPriceId,
  getSubscriptionPriceId,
  publicPricingCatalog,
} from '../lib/pricing.js'
import {
  ensureDefaultWorkspace,
  findPrimaryWorkspace,
} from '../lib/workspace-defaults.js'

const checkoutSchema = z.object({
  kind: z.enum(['subscription', 'credits']).default('subscription'),
  plan: z.enum(['pro', 'studio']).default('pro'),
  interval: z.enum(['monthly', 'yearly']).default('monthly'),
  creditPack: z.enum(['credits_29']).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

function billingIsConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY)
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

async function addCreditsFromCheckoutSession(
  session: Stripe.Checkout.Session,
  eventId: string,
) {
  const workspaceId = session.metadata?.workspaceId
  const userId = session.metadata?.userId
  const creditPack = session.metadata?.creditPack

  if (!workspaceId || creditPack !== 'credits_29') {
    return null
  }

  const [entry] = await getDb()
    .insert(creditLedgerEntries)
    .values({
      workspaceId,
      userId: userId ?? null,
      source: 'stripe_checkout',
      amount: CREDIT_PACKS.credits_29.credits,
      stripeEventId: eventId,
      checkoutSessionId: session.id,
      metadata: {
        creditPack,
        stripeCustomerId:
          typeof session.customer === 'string' ? session.customer : session.customer?.id,
      },
    })
    .onConflictDoNothing()
    .returning()

  return entry ?? null
}

async function processStripeEvent(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.metadata?.kind === 'credits') {
      return await addCreditsFromCheckoutSession(session, event.id)
    }

    return await updateWorkspaceSubscription({
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
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription
    const subscriptionWithPeriod = subscription as Stripe.Subscription & {
      current_period_end?: number
    }

    return await updateWorkspaceSubscription({
      workspaceId: subscription.metadata?.workspaceId ?? null,
      customerId:
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id,
      subscriptionId: subscription.id,
      plan:
        event.type === 'customer.subscription.deleted'
          ? 'free'
          : subscription.metadata?.plan ?? 'pro',
      billingStatus:
        event.type === 'customer.subscription.deleted'
          ? 'cancelled'
          : subscription.status,
      currentPeriodEnd: toDateFromStripeTimestamp(
        subscriptionWithPeriod.current_period_end ?? null,
      ),
    })
  }

  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const invoiceWithSubscription = invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null
    }
    const subscriptionId =
      typeof invoiceWithSubscription.subscription === 'string'
        ? invoiceWithSubscription.subscription
        : invoiceWithSubscription.subscription?.id
    const customerId =
      typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

    return await updateWorkspaceSubscription({
      customerId,
      subscriptionId,
      billingStatus: event.type === 'invoice.paid' ? 'active' : 'past_due',
    })
  }

  return null
}

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/billing/catalog', async (_request, reply) => {
    return reply.status(200).send({
      ...publicPricingCatalog(),
      currency: 'EUR',
    })
  })

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
      portalConfigured: billingIsConfigured(),
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

    const priceId =
      parsed.data.kind === 'credits'
        ? getCreditPackPriceId(parsed.data.creditPack ?? 'credits_29')
        : getSubscriptionPriceId(parsed.data.plan, parsed.data.interval)

    if (!priceId) {
      return reply.status(503).send(
        buildErrorResponse(
          'PRICE_NOT_CONFIGURED',
          'Stripe price is not configured for this checkout option',
          requestId,
        ),
      )
    }

    const stripe = buildStripeClient()
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
      mode: parsed.data.kind === 'credits' ? 'payment' : 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: buildSuccessUrl(parsed.data.successUrl),
      cancel_url: buildCancelUrl(parsed.data.cancelUrl),
      metadata: {
        userId: auth.user.id,
        workspaceId: workspace.id,
        kind: parsed.data.kind,
        plan: parsed.data.plan,
        interval: parsed.data.interval,
        creditPack:
          parsed.data.kind === 'credits'
            ? parsed.data.creditPack ?? 'credits_29'
            : '',
      },
      ...(parsed.data.kind === 'subscription'
        ? {
            subscription_data: {
              metadata: {
                userId: auth.user.id,
                workspaceId: workspace.id,
                plan: parsed.data.plan,
                interval: parsed.data.interval,
              },
            },
          }
        : {}),
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

  app.post('/v1/billing/portal', async (request, reply) => {
    const requestId = request.requestId
    const auth = await findAuthContextByBearerToken(request)

    if (!auth) {
      return reply.status(401).send(
        buildErrorResponse('UNAUTHORIZED', 'Authentication required', requestId),
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

    const workspace = await ensureDefaultWorkspace(auth.user)
    const customerId = workspace.stripeCustomerId || auth.user.stripeCustomerId

    if (!customerId) {
      return reply.status(409).send(
        buildErrorResponse(
          'STRIPE_CUSTOMER_MISSING',
          'Create a checkout session before opening the customer portal',
          requestId,
        ),
      )
    }

    const stripe = buildStripeClient()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: env.APP_PUBLIC_URL,
    })

    return reply.status(200).send({
      portalUrl: session.url,
      requestId,
    })
  })

  app.get('/v1/billing/credits', async (request, reply) => {
    const requestId = request.requestId
    const auth = await findAuthContextByBearerToken(request)

    if (!auth) {
      return reply.status(401).send(
        buildErrorResponse('UNAUTHORIZED', 'Authentication required', requestId),
      )
    }

    const workspace = await ensureDefaultWorkspace(auth.user)
    const entries = await getDb()
      .select()
      .from(creditLedgerEntries)
      .where(eq(creditLedgerEntries.workspaceId, workspace.id))

    const balance = entries.reduce((total, entry) => total + entry.amount, 0)

    return reply.status(200).send({
      balance,
      entries: entries.map((entry) => ({
        id: entry.id,
        source: entry.source,
        amount: entry.amount,
        createdAt: entry.createdAt.toISOString(),
      })),
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
      const workspaceOrCreditEntry = await processStripeEvent(event)
      const workspaceId =
        workspaceOrCreditEntry && 'workspaceId' in workspaceOrCreditEntry
          ? workspaceOrCreditEntry.workspaceId
          : workspaceOrCreditEntry && 'id' in workspaceOrCreditEntry
            ? workspaceOrCreditEntry.id
            : null

      await getDb().insert(stripeWebhookEvents).values({
        stripeEventId: event.id,
        eventType: event.type,
        processingStatus: 'processed',
        workspaceId,
        payload: event as unknown as Record<string, unknown>,
      })

      return reply.status(200).send({
        received: true,
        duplicate: false,
        eventId: event.id,
        eventType: event.type,
        workspaceId,
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
