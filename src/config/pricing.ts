/**
 * Single Source of Truth for Pricing Strategy
 * All pricing-related logic should reference this configuration
 */

export type PlanId = 'SOLO' | 'CREW' | 'SQUAD' | 'FLEET' | 'ENTERPRISE'

export interface PricingPlan {
  id: PlanId
  name: string
  price: number
  interval: 'month' | 'year'
  userLimit: number
  stripePriceId: string
  features: string[]
  label?: string // Optional label like "Most Popular" or "Small Teams"
  icon?: React.ComponentType<{ className?: string }> // Optional icon component
  seatPrice?: number // Price per additional seat (for Enterprise plan)
}

export const PRICING_PLANS: Record<PlanId, PricingPlan> = {
  SOLO: {
    id: 'SOLO',
    name: 'Solo',
    price: 29,
    interval: 'month',
    userLimit: 1,
    stripePriceId: '', // Will be filled in later
    features: [
      'Unlimited Quotes',
      'Client History',
      'Branded PDF',
    ],
  },
  CREW: {
    id: 'CREW',
    name: 'Crew',
    price: 79,
    interval: 'month',
    userLimit: 3,
    stripePriceId: '', // Will be filled in later
    features: [
      'Everything in Solo',
      'Up to 3 Users',
      'Team Dashboard',
    ],
    label: 'Small Teams',
  },
  SQUAD: {
    id: 'SQUAD',
    name: 'Squad',
    price: 149,
    interval: 'month',
    userLimit: 7,
    stripePriceId: '', // Will be filled in later
    features: [
      'Everything in Crew',
      'Up to 7 Users',
      'Role Management',
    ],
    label: 'Most Popular',
  },
  FLEET: {
    id: 'FLEET',
    name: 'Fleet',
    price: 249,
    interval: 'month',
    userLimit: 12,
    stripePriceId: '', // Will be filled in later
    features: [
      'Everything in Squad',
      'Up to 12 Users',
      'Priority Support',
    ],
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 299,
    interval: 'month',
    userLimit: 999, // First 12 users included, then +$25/seat
    stripePriceId: '', // Will be filled in later
    features: [
      'Unlimited Scale',
      'Dedicated Account Manager',
      'Custom Integrations',
    ],
    seatPrice: 25, // Price per additional seat beyond 12
  },
}

/**
 * Stripe Price ID for additional seats (Enterprise plan)
 * This is a separate price item that gets added to Enterprise subscriptions
 */
export const EXTRA_SEAT_PRICE_ID = 'price_YOUR_ID_HERE' // TODO: Replace with actual Stripe Price ID

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
  const planOrder: PlanId[] = ['SOLO', 'CREW', 'SQUAD', 'FLEET', 'ENTERPRISE']
  const currentIndex = planOrder.indexOf(currentPlanId)
  if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
    return null
  }
  return PRICING_PLANS[planOrder[currentIndex + 1]]
}

