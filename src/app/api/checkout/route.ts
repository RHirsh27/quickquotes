import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getPlanByIdCaseInsensitive, type PlanId } from '@/config/pricing'
import { randomBytes } from 'crypto'

/**
 * POST /api/checkout
 * Creates an unauthenticated Stripe Checkout session for new signups
 * No login required - user goes straight to Stripe payment
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const planParam = searchParams.get('plan')?.toUpperCase() as PlanId | null

    console.log('[Checkout API] Creating unauthenticated session for plan:', planParam)

    // Validate plan parameter
    if (!planParam || !['SOLO', 'CREW', 'TEAM'].includes(planParam)) {
      console.error('[Checkout API] Invalid plan parameter:', planParam)
      return NextResponse.redirect(new URL('/?error=invalid_plan', request.url))
    }

    // Get plan configuration
    const plan = getPlanByIdCaseInsensitive(planParam)
    if (!plan || !plan.stripePriceId) {
      console.error('[Checkout API] Plan not found or missing Stripe Price ID:', planParam)
      return NextResponse.redirect(new URL('/?error=plan_not_available', request.url))
    }

    // Generate unique client reference ID to track this signup
    const clientReferenceId = `signup_${Date.now()}_${randomBytes(8).toString('hex')}`

    // IMPORTANT: Construct proper base URL with explicit scheme
    // Vercel/production should always use NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL

    // Hardcoded fallback for production (ensures it always works)
    if (!baseUrl) {
      baseUrl = 'https://www.quotd.app'
      console.log('[Checkout API] WARNING: Using hardcoded production URL. Add NEXT_PUBLIC_SITE_URL to Vercel env vars.')
    }

    console.log('[Checkout API] Creating Stripe session:', {
      plan: plan.name,
      priceId: plan.stripePriceId,
      clientReferenceId,
      baseUrl
    })

    // Create Stripe Checkout Session
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      payment_method_collection: 'always', // Always collect payment method for trial
      allow_promotion_codes: true, // Allow users to apply promo codes

      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],

      // Trial settings - user gets 14 days free, but MUST add payment method
      subscription_data: {
        trial_period_days: 14,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel', // Cancel if no payment method at trial end
          },
        },
        metadata: {
          plan: planParam,
          planName: plan.name,
          source: 'landing_page',
        },
      },

      // Metadata for tracking and webhook handling
      metadata: {
        type: 'new_signup',
        plan: planParam,
        planName: plan.name,
        source: 'landing_page',
      },

      // Client reference for tracking this specific signup
      client_reference_id: clientReferenceId,

      // No customer_email - let Stripe collect it
      // This ensures we don't ask twice

      // Redirects after checkout
      success_url: `${baseUrl}/api/auth/signup-callback?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?canceled=true`,

      // NOTE: Consent collection disabled until Terms of Service URL is set in Stripe Dashboard
      // To enable: Go to https://dashboard.stripe.com/settings/public
      // Add a "Terms of service URL", then uncomment the lines below:
      // consent_collection: {
      //   terms_of_service: 'required',
      // },
    })

    console.log('[Checkout API] Session created successfully:', {
      sessionId: session.id,
      url: session.url,
      clientReferenceId,
    })

    // Redirect to Stripe Checkout
    if (!session.url) {
      throw new Error('No checkout URL returned from Stripe')
    }

    return NextResponse.redirect(session.url)
  } catch (error: any) {
    console.error('[Checkout API] Error creating checkout session:', error)

    // Redirect back to home with error
    const errorUrl = new URL('/', request.url)
    errorUrl.searchParams.set('error', 'checkout_failed')
    errorUrl.searchParams.set('message', error.message || 'Failed to start checkout')

    return NextResponse.redirect(errorUrl)
  }
}
