/**
 * Single Source of Truth for Pricing Strategy
 * All pricing-related logic should reference this configuration
 */

export type PlanId = 'SOLO' | 'CREW' | 'TEAM'

export interface PricingPlan {
  id: PlanId
  name: string
  price: number
  interval: 'month' | 'year'
  userLimit: number
  stripePriceId: string
  description: string
  features: string[]
  label?: string // Optional label like "Best Value"
  footer?: string // Optional footer text like "+ $25/seat after 10 users"
  seatPrice?: number // Price per additional seat (for Team plan overage)
}

export const EXTRA_SEAT_PRICE_ID = ""; // I will fill this in

export const APPLICATION_FEE_PERCENT = 0.01; // 1%

export const PRICING_PLANS: Record<PlanId, PricingPlan> = {
  SOLO: {
    id: 'SOLO',
    name: "Solo",
    price: 29,
    interval: "month",
    userLimit: 1,
    stripePriceId: "",
    description: "For the owner-operator.",
    features: ["Unlimited Quotes", "Branded PDF", "Client History", "Accept Credit Cards"]
  },
  CREW: {
    id: 'CREW',
    name: "Crew",
    price: 99,
    interval: "month",
    userLimit: 5,
    stripePriceId: "",
    description: "For small crews (up to 5).",
    features: ["Everything in Solo", "Up to 5 Users", "Shared Price Book", "Team Dashboard"],
    label: "Best Value"
  },
  TEAM: {
    id: 'TEAM',
    name: "Team",
    price: 199,
    interval: "month",
    userLimit: 10,
    stripePriceId: "",
    description: "For growing businesses.",
    features: ["Everything in Crew", "Up to 10 Users", "Role Permissions", "Priority Support"],
    footer: "+ $25/seat after 10 users",
    seatPrice: 25
  }
} as const

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
  const planOrder: PlanId[] = ['SOLO', 'CREW', 'TEAM']
  const currentIndex = planOrder.indexOf(currentPlanId)
  if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
    return null
  }
  return PRICING_PLANS[planOrder[currentIndex + 1]]
}

