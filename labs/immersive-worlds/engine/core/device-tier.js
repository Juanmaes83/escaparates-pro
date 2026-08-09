/**
 * Immersive Worlds — Device tier & quality policy
 *
 * IW-0 Constitution §21: "performance tier must affect expensive features,
 * not merely label the device."
 *
 * This file decides the tier and publishes a QualityPolicy. It does not know
 * what a shadow map is — the Scene Kit and the render host read the policy and
 * apply it. That keeps quality decisions in one place and their realization in
 * the layer that owns rendering.
 */

export const TIERS = Object.freeze({ LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' });

/**
 * @typedef {Object} QualityPolicy
 * @property {'LOW'|'MEDIUM'|'HIGH'} tier
 * @property {number} dprCap          maximum device pixel ratio to render at
 * @property {boolean} shadows        shadow maps allowed at all
 * @property {number} shadowMapSize   resolution per shadow-casting light
 * @property {number} maxShadowCasters how many lights may cast
 * @property {boolean} environmentIBL generated image-based lighting allowed
 * @property {number} textureScale    multiplier for generated texture resolution
 * @property {boolean} antialias
 * @property {number} warmupBudgetMs  per-frame budget for space warmup work
 */

const POLICIES = {
  LOW: {
    tier: TIERS.LOW,
    dprCap: 1,
    shadows: false,
    shadowMapSize: 512,
    maxShadowCasters: 0,
    environmentIBL: true,
    textureScale: 0.5,
    antialias: false,
    warmupBudgetMs: 6
  },
  MEDIUM: {
    tier: TIERS.MEDIUM,
    dprCap: 1.5,
    shadows: true,
    shadowMapSize: 1024,
    maxShadowCasters: 2,
    environmentIBL: true,
    textureScale: 0.75,
    antialias: true,
    warmupBudgetMs: 10
  },
  HIGH: {
    tier: TIERS.HIGH,
    dprCap: 2,
    shadows: true,
    shadowMapSize: 2048,
    maxShadowCasters: 4,
    environmentIBL: true,
    textureScale: 1,
    antialias: true,
    warmupBudgetMs: 16
  }
};

/**
 * Detect a tier from coarse, stable signals. Deliberately conservative: a wrong
 * HIGH is much worse than a wrong MEDIUM on a phone.
 *
 * @param {{userAgent?:string, deviceMemory?:number, hardwareConcurrency?:number,
 *          maxTouchPoints?:number, screenWidth?:number, devicePixelRatio?:number}} env
 * @returns {'LOW'|'MEDIUM'|'HIGH'}
 */
export function detectTier(env = {}) {
  const ua = env.userAgent || '';
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (env.maxTouchPoints || 0) > 1;
  const memory = env.deviceMemory ?? (mobile ? 4 : 8);
  const cores = env.hardwareConcurrency ?? (mobile ? 4 : 8);
  const width = env.screenWidth ?? 1920;

  if (memory <= 2 || cores <= 2) return TIERS.LOW;
  if (mobile) return width <= 400 || memory <= 4 ? TIERS.LOW : TIERS.MEDIUM;
  if (memory <= 4 || cores <= 4) return TIERS.MEDIUM;
  return TIERS.HIGH;
}

/**
 * @param {'LOW'|'MEDIUM'|'HIGH'} tier
 * @returns {QualityPolicy}
 */
export function policyForTier(tier) {
  return { ...(POLICIES[tier] || POLICIES.MEDIUM) };
}

export class QualityManager {
  /**
   * @param {{bus:import('./event-bus.js').EventBus, tier?:string, env?:object}} options
   */
  constructor({ bus, tier, env } = {}) {
    this.bus = bus;
    this.tier = tier || detectTier(env);
    this.policy = policyForTier(this.tier);
  }

  /** Explicit override — used by QA states and by an author-facing quality switch. */
  setTier(tier, { reason = 'manual' } = {}) {
    if (!POLICIES[tier] || tier === this.tier) return this.policy;
    this.tier = tier;
    this.policy = policyForTier(tier);
    this.bus?.emit('quality:tier-changed', { tier, policy: this.policy, reason });
    return this.policy;
  }
}
