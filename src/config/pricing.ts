/**
 * Single Source of Truth for Pricing Strategy
 * All pricing-related logic should reference this configuration
 */

export type PlanId = 'SOLO' | 'TEAM' | 'BUSINESS'

export interface PricingPlan {
  id: PlanId
  name: string
  price: number
  interval: 'month' | 'year'
  userLimit: number
  stripePriceId: string
  features: string[]
  label?: string // Optional label like "Most Popular"
}

export const PRICING_PLANS: Record<PlanId, PricingPlan> = {
  SOLO: {
    id: 'SOLO',
    name: 'Solo Professional',
    price: 29,
    interval: 'month',
    userLimit: 1,
    stripePriceId: '', // Will be filled in later
    features: [
      'Unlimited Quotes',
      'PDF Exports',
      'Client History',
      'Branded Invoices',
    ],
  },
  TEAM: {
    id: 'TEAM',
    name: 'Small Team',
    price: 79,
    interval: 'month',
    userLimit: 3,
    stripePriceId: '', // Will be filled in later
    features: [
      'Everything in Solo',
      'Up to 3 Users',
      'Shared Price Book',
      'Team Dashboard',
    ],
    label: 'Most Popular',
  },
  BUSINESS: {
    id: 'BUSINESS',
    name: 'Business Unlimited',
    price: 149,
    interval: 'month',
    userLimit: 999,
    stripePriceId: '', // Will be filled in later
    features: [
      'Unlimited Users',
      'Priority Support',
      'Dedicated Account Manager',
      'API Access',
    ],
  },
}

/**
 * Get a plan by its ID
 */
export function getPlanById(planId: PlanId): PricingPlan {
  return PRICING_PLANS[planId]
}

/**
 * Get a plan by its Stripe Price ID
 */
export function getPlanByStripePriceId(stripePriceId: string): PricingPlan | null {
  const plan = Object.values(PRICING_PLANS).find(
    (p) => p.stripePriceId === stripePriceId
  )
  return plan || null
}

/**
 * Get all plans as an array
 */
export function getAllPlans(): PricingPlan[] {
  return Object.values(PRICING_PLANS)
}

/**
 * Get the next plan (for upgrade suggestions)
 */
export function getNextPlan(currentPlanId: PlanId): PricingPlan | null {
  const planOrder: PlanId[] = ['SOLO', 'TEAM', 'BUSINESS']
  const currentIndex = planOrder.indexOf(currentPlanId)
  if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
    return null
  }
  return PRICING_PLANS[planOrder[currentIndex + 1]]
}

