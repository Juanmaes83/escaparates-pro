export type PlanId = 'free' | 'pro' | 'studio' | 'enterprise' | 'blocked'

export type EntitlementPayload = {
  plan: PlanId
  billingStatus: string
  features: Record<string, boolean>
  limits: {
    userAssets: number
    assetMb: number
    videoSeconds: number
    exportsPerMonth: number
    publishes: number
    brandKits: number
    seats: number
    aiCredits: number
  }
}

const catalog: Record<PlanId, Omit<EntitlementPayload, 'billingStatus'>> = {
  free: {
    plan: 'free',
    features: {
      demoAssets: true,
      uploadAssets: true,
      uploadLogo: false,
      exportBasic: true,
      exportPremium: false,
      publish: false,
      customBranding: false,
      reviewLinks: false,
      teamSeats: false,
      aiTools: false,
    },
    limits: {
      userAssets: 3,
      assetMb: 5,
      videoSeconds: 10,
      exportsPerMonth: 5,
      publishes: 0,
      brandKits: 0,
      seats: 1,
      aiCredits: 0,
    },
  },
  pro: {
    plan: 'pro',
    features: {
      demoAssets: true,
      uploadAssets: true,
      uploadLogo: true,
      exportBasic: true,
      exportPremium: true,
      publish: true,
      customBranding: true,
      reviewLinks: false,
      teamSeats: false,
      aiTools: false,
    },
    limits: {
      userAssets: 15,
      assetMb: 50,
      videoSeconds: 60,
      exportsPerMonth: 100,
      publishes: 5,
      brandKits: 1,
      seats: 1,
      aiCredits: 0,
    },
  },
  studio: {
    plan: 'studio',
    features: {
      demoAssets: true,
      uploadAssets: true,
      uploadLogo: true,
      exportBasic: true,
      exportPremium: true,
      publish: true,
      customBranding: true,
      reviewLinks: true,
      teamSeats: true,
      aiTools: true,
    },
    limits: {
      userAssets: 75,
      assetMb: 200,
      videoSeconds: 180,
      exportsPerMonth: 500,
      publishes: 25,
      brandKits: 5,
      seats: 5,
      aiCredits: 500,
    },
  },
  enterprise: {
    plan: 'enterprise',
    features: {
      demoAssets: true,
      uploadAssets: true,
      uploadLogo: true,
      exportBasic: true,
      exportPremium: true,
      publish: true,
      customBranding: true,
      reviewLinks: true,
      teamSeats: true,
      aiTools: true,
    },
    limits: {
      userAssets: 500,
      assetMb: 1000,
      videoSeconds: 600,
      exportsPerMonth: 5000,
      publishes: 250,
      brandKits: 50,
      seats: 50,
      aiCredits: 10000,
    },
  },
  blocked: {
    plan: 'blocked',
    features: {
      demoAssets: false,
      uploadAssets: false,
      uploadLogo: false,
      exportBasic: false,
      exportPremium: false,
      publish: false,
      customBranding: false,
      reviewLinks: false,
      teamSeats: false,
      aiTools: false,
    },
    limits: {
      userAssets: 0,
      assetMb: 0,
      videoSeconds: 0,
      exportsPerMonth: 0,
      publishes: 0,
      brandKits: 0,
      seats: 0,
      aiCredits: 0,
    },
  },
}

export function normalizePlan(plan?: string | null, billingStatus?: string | null): PlanId {
  const status = String(billingStatus ?? '').toLowerCase()
  if (['blocked', 'suspended', 'past_due', 'unpaid'].includes(status)) return 'blocked'

  const rawPlan = String(plan ?? 'free').toLowerCase()
  if (rawPlan === 'enterprise') return 'enterprise'
  if (rawPlan === 'studio' || rawPlan === 'agency') return 'studio'
  if (rawPlan === 'pro' || rawPlan === 'creator') return 'pro'
  return 'free'
}

export function buildEntitlements(plan?: string | null, billingStatus?: string | null): EntitlementPayload {
  const normalizedPlan = normalizePlan(plan, billingStatus)
  return {
    ...catalog[normalizedPlan],
    billingStatus: billingStatus ?? (normalizedPlan === 'free' ? 'free' : 'active'),
  }
}
