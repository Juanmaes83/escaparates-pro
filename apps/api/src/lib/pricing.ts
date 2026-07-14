import { env } from '../config/env.js'

export type BillingInterval = 'monthly' | 'yearly'
export type CheckoutKind = 'subscription' | 'credits'
export type PaidPlanId = 'pro' | 'studio'
export type PublicPlanId = 'free' | PaidPlanId | 'enterprise'
export type CreditPackId = 'credits_29'

export type PricingPlan = {
  id: PublicPlanId
  name: string
  monthly: number | null
  yearly: number | null
  currency: 'EUR'
  audience: string
  cta: string
  stripeConfigured: {
    monthly: boolean
    yearly: boolean
  }
}

export type CreditPack = {
  id: CreditPackId
  name: string
  price: number
  credits: number
  currency: 'EUR'
  stripeConfigured: boolean
}

export const PLAN_PRICES: Record<PublicPlanId, PricingPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    monthly: 0,
    yearly: 0,
    currency: 'EUR',
    audience: 'Prueba, efectos basicos y descargas limitadas.',
    cta: 'Empezar gratis',
    stripeConfigured: { monthly: true, yearly: true },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthly: 49,
    yearly: 490,
    currency: 'EUR',
    audience: 'Freelance, comercios pequenos y creadores.',
    cta: 'Upgrade Pro',
    stripeConfigured: {
      monthly: Boolean(env.STRIPE_PRICE_PRO_MONTHLY),
      yearly: Boolean(env.STRIPE_PRICE_PRO_YEARLY),
    },
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    monthly: 99,
    yearly: 990,
    currency: 'EUR',
    audience: 'Agencias, estudios y marcas con volumen.',
    cta: 'Upgrade Studio',
    stripeConfigured: {
      monthly: Boolean(env.STRIPE_PRICE_STUDIO_MONTHLY),
      yearly: Boolean(env.STRIPE_PRICE_STUDIO_YEARLY),
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: null,
    yearly: null,
    currency: 'EUR',
    audience: 'Retail, eventos, instalaciones e integraciones.',
    cta: 'Contactar',
    stripeConfigured: { monthly: false, yearly: false },
  },
}

export const CREDIT_PACKS: Record<CreditPackId, CreditPack> = {
  credits_29: {
    id: 'credits_29',
    name: 'Pack de creditos',
    price: 29,
    credits: 100,
    currency: 'EUR',
    stripeConfigured: Boolean(env.STRIPE_PRICE_CREDITS_29),
  },
}

export function getSubscriptionPriceId(
  plan: PaidPlanId,
  interval: BillingInterval,
): string | null {
  if (plan === 'pro' && interval === 'monthly') return env.STRIPE_PRICE_PRO_MONTHLY ?? null
  if (plan === 'pro' && interval === 'yearly') return env.STRIPE_PRICE_PRO_YEARLY ?? null
  if (plan === 'studio' && interval === 'monthly') return env.STRIPE_PRICE_STUDIO_MONTHLY ?? null
  if (plan === 'studio' && interval === 'yearly') return env.STRIPE_PRICE_STUDIO_YEARLY ?? null
  return null
}

export function getCreditPackPriceId(pack: CreditPackId): string | null {
  if (pack === 'credits_29') return env.STRIPE_PRICE_CREDITS_29 ?? null
  return null
}

export function publicPricingCatalog() {
  return {
    plans: Object.values(PLAN_PRICES),
    creditPacks: Object.values(CREDIT_PACKS),
  }
}
