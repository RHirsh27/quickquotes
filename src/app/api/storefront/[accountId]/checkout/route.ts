import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

/**
 * POST /api/storefront/[accountId]/checkout
 * Create a checkout session for a connected account's product
 *
 * This uses Direct Charges with application fees to monetize the transaction
 * Documentation: https://docs.stripe.com/connect/direct-charges
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params
    const body = await request.json()
    const { priceId, quantity = 1 } = body

    // Validate inputs
    if (!accountId || !accountId.startsWith('acct_')) {
      return NextResponse.json(
        { error: 'Invalid account identifier' },
        { status: 400 }
      )
    }

    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      )
    }

    // Get the price details to calculate application fee
    const stripe = getStripe()

    // Fetch price from connected account
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product'],
      // Use Stripe-Account header to fetch from connected account
      stripeAccount: accountId,
    } as any)

    if (!price || !price.unit_amount) {
      return NextResponse.json(
        { error: 'Invalid price' },
        { status: 400 }
      )
    }

    // Calculate application fee (1% of total)
    // IMPORTANT: Application fee is taken from the total payment
    // Example: $100 sale = $1 goes to platform, $99 goes to connected account
    const totalAmount = price.unit_amount * quantity
    const applicationFeeAmount = Math.round(totalAmount * 0.01) // 1% platform fee

    console.log('[Storefront Checkout] Creating session:', {
      accountId,
      priceId,
      quantity,
      totalAmount,
      applicationFeeAmount,
    })

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    // Create checkout session with Direct Charge
    // Documentation: https://docs.stripe.com/connect/direct-charges
    const session = await stripe.checkout.sessions.create({
      // Line items (what the customer is purchasing)
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      mode: 'payment',

      // Payment intent data for Direct Charge with application fee
      payment_intent_data: {
        // Application fee that goes to the platform
        application_fee_amount: applicationFeeAmount,

        // Metadata for tracking
        metadata: {
          type: 'storefront_purchase',
          connected_account: accountId,
        },
      },

      // Success and cancel URLs
      success_url: `${baseUrl}/storefront/${accountId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/storefront/${accountId}`,

      // Metadata for the session
      metadata: {
        type: 'storefront_purchase',
        connected_account: accountId,
      },
    }, {
      // CRITICAL: Use stripeAccount to create the checkout on the connected account
      // This ensures the payment goes to the connected account (minus application fee)
      stripeAccount: accountId,
    })

    console.log('[Storefront Checkout] Session created:', {
      sessionId: session.id,
      url: session.url,
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('[Storefront Checkout] Error:', error)

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: error.message || 'Invalid request to Stripe' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
