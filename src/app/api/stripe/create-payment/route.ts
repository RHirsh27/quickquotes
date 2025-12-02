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

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, users:user_id (stripe_connect_id, company_name, full_name)')
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
    const amount = invoice.amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid invoice amount' },
        { status: 400 }
      )
    }

    // Get tech's Stripe Connect ID
    const techUser = invoice.users as any
    const techStripeConnectId = techUser?.stripe_connect_id

    if (!techStripeConnectId) {
      return NextResponse.json(
        { error: 'Service provider has not set up payment processing yet' },
        { status: 400 }
      )
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
          destination: techStripeConnectId,
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

