import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/stripe/connect
 * Creates a Stripe Connect Express account and returns onboarding URL
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user already has a Stripe Connect account
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('stripe_connect_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[Stripe Connect] Error fetching user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // If user already has a Connect account, create account link for management
    if (userProfile?.stripe_connect_id) {
      const stripe = getStripe()
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

      // Check account status to determine link type
      const account = await stripe.accounts.retrieve(userProfile.stripe_connect_id)
      
      // If account is not fully onboarded, use onboarding link
      // Otherwise, use account management link
      const linkType = account.details_submitted ? 'account_update' : 'account_onboarding'

      const accountLink = await stripe.accountLinks.create({
        account: userProfile.stripe_connect_id,
        refresh_url: `${baseUrl}/settings/payments?refresh=true`,
        return_url: `${baseUrl}/settings/payments?success=true`,
        type: linkType,
      })

      return NextResponse.json({
        url: accountLink.url,
        accountId: userProfile.stripe_connect_id,
      })
    }

    // Create new Stripe Connect Express account
    const stripe = getStripe()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

    // Get user profile data for account creation
    const { data: fullProfile } = await supabase
      .from('users')
      .select('full_name, company_name, email')
      .eq('id', user.id)
      .single()

    // Create Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Default to US, can be made configurable
      email: user.email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        userId: user.id,
      },
    })

    // Save the Connect account ID to user profile
    const { error: updateError } = await supabase
      .from('users')
      .update({ stripe_connect_id: account.id })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Stripe Connect] Error saving Connect account ID:', updateError)
      // Continue anyway - we can update it later
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/settings/payments?refresh=true`,
      return_url: `${baseUrl}/settings/payments?success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      url: accountLink.url,
      accountId: account.id,
    })
  } catch (error: any) {
    console.error('[Stripe Connect] Error creating Connect account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create Stripe Connect account' },
      { status: 500 }
    )
  }
}

