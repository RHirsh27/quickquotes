import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { APPLICATION_FEE_PERCENT } from '@/config/pricing'

/**
 * POST /api/stripe/create-payment
 * Creates a Stripe Checkout Session for invoice payment with Connect
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json()
    const { invoiceId } = body

    if (!invoiceId || typeof invoiceId !== 'string') {
      return NextResponse.json(
        { error: 'invoiceId is required' },
        { status: 400 }
      )
    }

    // Get Supabase client (no auth required for public invoice lookup)
    const supabase = await createClient()

    // Fetch invoice details with team's Connect account
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        users:user_id (company_name, full_name),
        teams:team_id (stripe_account_id, stripe_account_status)
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      console.error('[Create Payment] Error fetching invoice:', invoiceError)
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'This invoice has already been paid' },
        { status: 400 }
      )
    }

    // Get amount (in cents)
    // Handle both quote-converted invoices (total in dollars) and Stripe Connect invoices (amount in cents)
    let amount: number
    if (invoice.total) {
      // Quote-converted invoice: total is in dollars, convert to cents
      amount = Math.round(invoice.total * 100)
    } else if (invoice.amount) {
      // Stripe Connect invoice: amount is already in cents
      amount = invoice.amount
    } else {
      return NextResponse.json(
        { error: 'Invalid invoice amount' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid invoice amount' },
        { status: 400 }
      )
    }

    // Get team's Stripe Connect account
    const team = invoice.teams as any
    const stripeAccountId = team?.stripe_account_id
    const accountStatus = team?.stripe_account_status

    // Verify team has completed Stripe Connect onboarding
    if (!stripeAccountId) {
      return NextResponse.json(
        { error: 'Service provider has not connected their Stripe account yet. Please ask them to complete Stripe onboarding in Settings > Payments.' },
        { status: 400 }
      )
    }

    // Verify account is ready to accept payments (charges_enabled)
    if (accountStatus !== 'active') {
      // Get live status from Stripe to be sure
      const stripe = getStripe()
      const account = await stripe.accounts.retrieve(stripeAccountId)

      if (!account.charges_enabled) {
        return NextResponse.json(
          { error: 'Service provider has not completed Stripe onboarding yet. Please ask them to finish setup in Settings > Payments.' },
          { status: 400 }
        )
      }

      // Update status in database if it's now active
      if (account.charges_enabled && account.details_submitted) {
        await supabase
          .from('teams')
          .update({ stripe_account_status: 'active' })
          .eq('id', invoice.team_id)
      }
    }

    // Calculate application fee using centralized constant
    const applicationFeeAmount = Math.round(amount * APPLICATION_FEE_PERCENT)

    // Create Stripe Checkout Session
    const stripe = getStripe()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: invoice.currency || 'usd',
            product_data: {
              name: invoice.description || 'Service Invoice',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: stripeAccountId,
        },
        metadata: {
          type: 'invoice_payment',
          invoiceId: invoiceId,
        },
      },
      metadata: {
        type: 'invoice_payment',
        invoiceId: invoiceId,
      },
      success_url: `${baseUrl}/pay/${invoiceId}?success=true`,
      cancel_url: `${baseUrl}/pay/${invoiceId}?canceled=true`,
      customer_email: invoice.customer_email || undefined,
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error('[Create Payment] Error creating payment session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment session' },
      { status: 500 }
    )
  }
}

