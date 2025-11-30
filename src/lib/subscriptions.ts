import { createClient } from './supabase/server'
import type { Subscription } from './types'
import { getSubscriptionLimits } from './subscriptions-client'

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

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Error fetching user subscription:', error)
    return null
  }

  return data as Subscription | null
}

// Re-export getSubscriptionLimits for server-side use
export { getSubscriptionLimits }

/**
 * Check if user can add more team members (server-side)
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

/**
 * Client-side helper to check if user can add more team members.
 * This is a simplified version that doesn't do the actual check,
 * but can be used for UI state management.
 */
export async function canAddTeamMemberClient(
  userId: string,
  teamId: string
): Promise<{ allowed: boolean; reason?: string; currentCount: number; maxUsers: number }> {
  // This would typically call an API route, but for simplicity,
  // we'll just return a placeholder that the UI can use
  // The actual check should be done server-side in the inviteTeamMember action
  return {
    allowed: true, // Will be validated server-side
    currentCount: 0,
    maxUsers: 999,
  }
}
