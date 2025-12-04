import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { sendPaymentReceivedEmail, sendInvoiceReceiptEmail } from '@/lib/emails'
import { convertTrialToPaid } from '@/lib/trial'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

/**
 * Activate user's SaaS subscription in the subscriptions table
 */
async function activateSubscription(
  supabase: Awaited<ReturnType<typeof createClient>>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId

  if (!userId) {
    console.error('[Webhook] No userId in checkout session metadata')
    throw new Error('No userId in checkout session metadata')
  }

  if (!session.subscription) {
    console.error('[Webhook] No subscription ID in checkout session')
    throw new Error('No subscription ID in checkout session')
  }

  // Get subscription details from Stripe
  const stripe = getStripe()
  const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(
    session.subscription as string,
    { expand: ['items.data.price.product'] }
  ) as Stripe.Subscription

  // Update subscription record and convert trial to paid if applicable
  const { error: upsertError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status: subscription.status as string,
      plan_id: subscription.items.data[0]?.price.id || null,
      current_period_end: (subscription as any).current_period_end
        ? new Date((subscription as any).current_period_end * 1000).toISOString()
        : null,
      is_trial: false, // Convert trial to paid
      trial_ends_at: null, // Clear trial end date
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: false,
    })

  if (upsertError) {
    console.error('[Webhook] Error upserting subscription:', upsertError)
    throw upsertError
  }

  console.log(`[Webhook] Subscription activated for user ${userId} (trial converted to paid if applicable)`)
}

/**
 * Update invoice status to 'paid' in the invoices table and send emails
 */
async function updateInvoicePayment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  session: Stripe.Checkout.Session
) {
  // Get invoice ID from metadata (set in create-payment route)
  const invoiceId = session.metadata?.invoiceId

  if (!invoiceId) {
    console.error('[Webhook] No invoiceId in checkout session metadata')
    throw new Error('No invoiceId in checkout session metadata')
  }

  // Fetch invoice details with related data
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      customers:customer_id (name, email),
      teams:team_id (name, company_email, company_phone),
      users:user_id (email, company_name, full_name)
    `)
    .eq('id', invoiceId)
    .single()

  if (invoiceError || !invoice) {
    console.error('[Webhook] Error fetching invoice:', invoiceError)
    throw invoiceError || new Error('Invoice not found')
  }

  // Get payment amount from session (in cents)
  const amountPaid = session.amount_total || invoice.total ? Math.round((invoice.total || 0) * 100) : 0

  // Update invoice status to 'paid' and set paid_at timestamp and amount_paid
  const { error: updateError } = await supabase
    .from('invoices')
    .update({ 
      status: 'paid',
      paid_at: new Date().toISOString(),
      amount_paid: amountPaid / 100, // Convert cents to dollars for storage
    })
    .eq('id', invoiceId)

  if (updateError) {
    console.error('[Webhook] Error updating invoice status:', updateError)
    throw updateError
  }

  console.log(`[Webhook] Invoice ${invoiceId} marked as paid`)

  // Send emails (non-blocking - don't fail webhook if email fails)
  try {
    // Get team owner email (user who created the invoice)
    const invoiceUser = invoice.users as any
    const teamOwnerEmail = invoiceUser?.email

    // Get customer email
    const customer = invoice.customers as any
    const customerEmail = invoice.customer_email || customer?.email

    // Get company info
    const team = invoice.teams as any
    const companyName = team?.name || invoiceUser?.company_name || invoiceUser?.full_name || 'Quotd'
    const companyEmail = team?.company_email || invoiceUser?.email
    const companyPhone = team?.company_phone

    // Send payment received email to team owner
    if (teamOwnerEmail && amountPaid > 0) {
      await sendPaymentReceivedEmail({
        to: teamOwnerEmail,
        amount: amountPaid,
        invoiceNumber: invoice.invoice_number || invoiceId.slice(0, 8),
        customerName: customer?.name || invoice.customer_name || 'Customer',
        companyName,
      })
    }

    // Send receipt email to customer
    if (customerEmail && amountPaid > 0) {
      await sendInvoiceReceiptEmail({
        to: customerEmail,
        invoiceNumber: invoice.invoice_number || invoiceId.slice(0, 8),
        amount: amountPaid,
        companyName,
        companyEmail,
        companyPhone,
        paymentDate: new Date().toISOString(),
      })
    }
  } catch (emailError: any) {
    // Log email errors but don't fail the webhook
    console.error('[Webhook] Error sending emails:', emailError)
  }
}

export async function POST(req: NextRequest) {
  // Get the raw body as text (required for webhook signature verification)
  const rawBody = await req.text()
  
  // Get the signature from the stripe-signature header
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('[Webhook] No Stripe signature found in headers')
    return NextResponse.json({ error: 'No Stripe signature' }, { status: 400 })
  }

  // Verify the webhook signature
  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: any) {
    console.error(`[Webhook] Signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadataType = session.metadata?.type

        if (metadataType === 'subscription') {
          // Activate the user's SaaS plan in the subscriptions table
          await activateSubscription(supabase, session)
        } else if (metadataType === 'invoice_payment') {
          // This is a "Connect" payment - update the invoices table status to 'paid'
          await updateInvoicePayment(supabase, session)
        } else {
          console.warn(`[Webhook] Unhandled metadata.type: ${metadataType} in checkout.session.completed`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        // If no userId in metadata, try to get it from existing subscription record
        if (!userId) {
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          if (!existingSub) {
            console.error('[Webhook] No userId found for subscription update')
            break
          }
        }

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status as string,
            plan_id: subscription.items.data[0]?.price.id || null,
            current_period_end: (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : null,
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('[Webhook] Error updating subscription:', updateError)
          throw updateError
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            current_period_end: (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : null,
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('[Webhook] Error canceling subscription:', updateError)
          throw updateError
        }
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account

        // Find team by stripe_account_id
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('id')
          .eq('stripe_account_id', account.id)
          .single()

        if (teamError || !teamData) {
          console.error('[Webhook] No team found for Stripe Connect account:', account.id)
          break
        }

        // Determine account status based on Stripe account state
        let accountStatus = 'pending'
        if (account.charges_enabled && account.details_submitted) {
          accountStatus = 'active'
        } else if (account.requirements?.disabled_reason) {
          accountStatus = 'restricted'
        }

        // Update team's Connect account status
        const { error: updateError } = await supabase
          .from('teams')
          .update({
            stripe_account_status: accountStatus,
          })
          .eq('stripe_account_id', account.id)

        if (updateError) {
          console.error('[Webhook] Error updating Stripe account status:', updateError)
          throw updateError
        }

        console.log(`[Webhook] Updated Connect account status for ${account.id}: ${accountStatus} (charges: ${account.charges_enabled}, payouts: ${account.payouts_enabled})`)
        break
      }

      default:
        console.warn(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('[Webhook] Error handling webhook event:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
