import { createClient } from './supabase/server'
import type { Subscription } from './types'

/**
 * Get the active subscription for a user
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return data as Subscription
}

/**
 * Get subscription limits based on plan ID
 */
export function getSubscriptionLimits(planId: string | null): { maxUsers: number; planName: string } {
  // Default to free tier if no plan
  if (!planId) {
    return { maxUsers: 1, planName: 'Free' }
  }

  // Map Stripe Price IDs to limits
  // TODO: Replace these with your actual Stripe Price IDs
  const planLimits: Record<string, { maxUsers: number; planName: string }> = {
    // Solo Professional - 1 user (the owner)
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO || 'price_solo']: {
      maxUsers: 1,
      planName: 'Solo Professional',
    },
    // Small Team - 3 users total
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM || 'price_team']: {
      maxUsers: 3,
      planName: 'Small Team',
    },
    // Business - Unlimited (999 is effectively unlimited)
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS || 'price_business']: {
      maxUsers: 999,
      planName: 'Business',
    },
  }

  return planLimits[planId] || { maxUsers: 1, planName: 'Free' }
}

/**
 * Check if user can add more team members
 */
export async function canAddTeamMember(
  userId: string,
  teamId: string
): Promise<{ allowed: boolean; reason?: string; currentCount: number; maxUsers: number }> {
  const supabase = await createClient()

  // Get user's subscription
  const subscription = await getUserSubscription(userId)
  const limits = getSubscriptionLimits(subscription?.plan_id || null)

  // Count current team members
  const { count, error } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId)

  if (error) {
    console.error('Error counting team members:', error)
    return {
      allowed: false,
      reason: 'Error checking team limits',
      currentCount: 0,
      maxUsers: limits.maxUsers,
    }
  }

  const currentCount = count || 0

  if (currentCount >= limits.maxUsers) {
    return {
      allowed: false,
      reason: `You have reached the limit of ${limits.maxUsers} user${limits.maxUsers === 1 ? '' : 's'} for your ${limits.planName} plan. Upgrade to add more seats.`,
      currentCount,
      maxUsers: limits.maxUsers,
    }
  }

  return {
    allowed: true,
    currentCount,
    maxUsers: limits.maxUsers,
  }
}

