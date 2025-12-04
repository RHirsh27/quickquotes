'use server'

import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

/**
 * Create a Stripe Connect Express account for a team
 */
export async function createConnectAccount() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Get user's team (must be owner)
    const { data: teamMember, error: tmError } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id)
      .single()

    if (tmError || !teamMember || teamMember.role !== 'owner') {
      return { error: 'Only team owners can connect Stripe' }
    }

    // Check if team already has a Stripe account
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('stripe_account_id')
      .eq('id', teamMember.team_id)
      .single()

    if (teamError) {
      return { error: 'Failed to fetch team data' }
    }

    if (team.stripe_account_id) {
      return { accountId: team.stripe_account_id, exists: true }
    }

    // Create Stripe Connect account using controller properties (API version 2025-11-17.clover)
    // Documentation: https://docs.stripe.com/connect/authentication
    const stripe = getStripe()
    const account = await stripe.accounts.create({
      // IMPORTANT: Use controller properties instead of deprecated "type" property
      controller: {
        // Platform controls fee collection - connected account pays Stripe fees
        fees: {
          payer: 'account' as const
        },
        // Stripe handles payment disputes and losses (not platform)
        losses: {
          payments: 'stripe' as const
        },
        // Connected account gets full access to Stripe dashboard
        stripe_dashboard: {
          type: 'full' as const
        }
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual', // Default, user can change in onboarding
    })

    console.log('[Stripe Connect] Created account:', account.id)

    // Save account ID to team
    const { error: updateError } = await supabase
      .from('teams')
      .update({
        stripe_account_id: account.id,
        stripe_account_status: 'pending' // Will be updated by webhook
      })
      .eq('id', teamMember.team_id)

    if (updateError) {
      console.error('[Stripe Connect] Failed to save account ID:', updateError)
      return { error: 'Failed to save Stripe account' }
    }

    return { accountId: account.id, exists: false }
  } catch (error: any) {
    console.error('[Stripe Connect] Error creating account:', error)
    return { error: error.message || 'Failed to create Stripe account' }
  }
}

/**
 * Create an onboarding link for Stripe Connect
 */
export async function createConnectOnboardingLink(accountId: string) {
  try {
    const stripe = getStripe()

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL

    if (!baseUrl) {
      throw new Error('Missing site URL configuration')
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/settings/payments?connect=refresh`,
      return_url: `${baseUrl}/settings/payments?connect=success`,
      type: 'account_onboarding',
    })

    console.log('[Stripe Connect] Created onboarding link for:', accountId)

    return { url: accountLink.url }
  } catch (error: any) {
    console.error('[Stripe Connect] Error creating onboarding link:', error)
    return { error: error.message || 'Failed to create onboarding link' }
  }
}

/**
 * Get the current status of a Stripe Connect account
 */
export async function getConnectAccountStatus(accountId: string) {
  try {
    const stripe = getStripe()
    const account = await stripe.accounts.retrieve(accountId)

    return {
      charges_enabled: account.charges_enabled || false,
      details_submitted: account.details_submitted || false,
      payouts_enabled: account.payouts_enabled || false,
      email: account.email,
      country: account.country,
    }
  } catch (error: any) {
    console.error('[Stripe Connect] Error fetching account status:', error)
    return { error: error.message || 'Failed to fetch account status' }
  }
}

/**
 * Create a login link for managing Stripe Express dashboard
 */
export async function createConnectLoginLink(accountId: string) {
  try {
    const stripe = getStripe()
    const loginLink = await stripe.accounts.createLoginLink(accountId)

    console.log('[Stripe Connect] Created login link for:', accountId)

    return { url: loginLink.url }
  } catch (error: any) {
    console.error('[Stripe Connect] Error creating login link:', error)
    return { error: error.message || 'Failed to create login link' }
  }
}

/**
 * Get team's Stripe Connect account ID
 */
export async function getTeamConnectAccount() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Get user's team
    const { data: teamMember, error: tmError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()

    if (tmError || !teamMember) {
      return { error: 'Team not found' }
    }

    // Get team's Stripe account
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('stripe_account_id, stripe_account_status')
      .eq('id', teamMember.team_id)
      .single()

    if (teamError) {
      return { error: 'Failed to fetch team data' }
    }

    return {
      accountId: team.stripe_account_id,
      status: team.stripe_account_status,
    }
  } catch (error: any) {
    console.error('[Stripe Connect] Error getting team account:', error)
    return { error: error.message || 'Failed to get team account' }
  }
}

/**
 * Create a product on the connected account
 * Uses Stripe-Account header to create products on behalf of connected account
 */
export async function createConnectProduct(data: {
  name: string
  description: string
  priceInCents: number
  currency?: string
}) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Get user's team (must be owner)
    const { data: teamMember, error: tmError } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id)
      .single()

    if (tmError || !teamMember || teamMember.role !== 'owner') {
      return { error: 'Only team owners can create products' }
    }

    // Get team's Stripe Connect account
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('stripe_account_id, stripe_account_status')
      .eq('id', teamMember.team_id)
      .single()

    if (teamError) {
      return { error: 'Failed to fetch team data' }
    }

    if (!team.stripe_account_id) {
      return { error: 'No Stripe Connect account found. Please complete onboarding first.' }
    }

    // Validate product data
    if (!data.name || data.name.trim().length === 0) {
      return { error: 'Product name is required' }
    }

    if (!data.priceInCents || data.priceInCents <= 0) {
      return { error: 'Price must be greater than 0' }
    }

    // Create product on connected account using Stripe-Account header
    // Documentation: https://docs.stripe.com/connect/authentication
    const stripe = getStripe()
    const product = await stripe.products.create({
      name: data.name,
      description: data.description || undefined,
      default_price_data: {
        unit_amount: data.priceInCents,
        currency: data.currency || 'usd',
      },
    }, {
      // IMPORTANT: Use stripeAccount to set Stripe-Account header
      // This creates the product on the connected account, not the platform
      stripeAccount: team.stripe_account_id,
    })

    console.log('[Stripe Connect] Created product:', product.id, 'on account:', team.stripe_account_id)

    return {
      productId: product.id,
      priceId: product.default_price as string,
      name: product.name,
    }
  } catch (error: any) {
    console.error('[Stripe Connect] Error creating product:', error)
    return { error: error.message || 'Failed to create product' }
  }
}

/**
 * List products for the connected account
 */
export async function listConnectProducts() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Get user's team
    const { data: teamMember, error: tmError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()

    if (tmError || !teamMember) {
      return { error: 'Team not found' }
    }

    // Get team's Stripe Connect account
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('stripe_account_id')
      .eq('id', teamMember.team_id)
      .single()

    if (teamError) {
      return { error: 'Failed to fetch team data' }
    }

    if (!team.stripe_account_id) {
      return { products: [] }
    }

    // List products from connected account using Stripe-Account header
    const stripe = getStripe()
    const products = await stripe.products.list({
      limit: 100,
      active: true,
      expand: ['data.default_price'],
    }, {
      // Use stripeAccount to query the connected account's products
      stripeAccount: team.stripe_account_id,
    })

    return {
      products: products.data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        defaultPrice: p.default_price,
      }))
    }
  } catch (error: any) {
    console.error('[Stripe Connect] Error listing products:', error)
    return { error: error.message || 'Failed to list products' }
  }
}
