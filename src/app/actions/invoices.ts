'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ConvertQuoteResult {
  success: boolean
  message: string
  invoiceId?: string
}

export interface MarkPaidResult {
  success: boolean
  message: string
}

export interface PaymentLinkResult {
  success: boolean
  message: string
  paymentLink?: string
}

/**
 * Convert a quote to an invoice
 * Fetches the quote and line items, creates an invoice, duplicates line items,
 * and updates the quote status to 'accepted'
 */
export async function convertQuoteToInvoice(quoteId: string): Promise<ConvertQuoteResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to convert quotes to invoices.'
      }
    }

    // Get user's primary team
    const { data: primaryTeamId, error: teamError } = await supabase.rpc('get_user_primary_team')
    if (teamError || !primaryTeamId) {
      return {
        success: false,
        message: 'No team found. Please contact support.'
      }
    }

    // Fetch the quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .eq('team_id', primaryTeamId)
      .single()

    if (quoteError || !quote) {
      return {
        success: false,
        message: 'Quote not found or access denied.'
      }
    }

    // Check if quote is already converted
    if (quote.status === 'accepted') {
      // Check if invoice already exists
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('quote_id', quoteId)
        .maybeSingle()

      if (existingInvoice) {
        return {
          success: false,
          message: 'This quote has already been converted to an invoice.',
          invoiceId: existingInvoice.id
        }
      }
    }

    // Fetch quote line items
    const { data: lineItems, error: itemsError } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('quote_id', quoteId)
      .order('position')

    if (itemsError) {
      return {
        success: false,
        message: 'Failed to fetch quote line items.'
      }
    }

    // Generate invoice number
    const currentYear = new Date().getFullYear()
    const invoiceNumber = `INV-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`

    // Calculate due date (30 days from now by default)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        team_id: primaryTeamId,
        user_id: user.id,
        customer_id: quote.customer_id,
        quote_id: quoteId,
        invoice_number: invoiceNumber,
        status: 'unpaid',
        total: quote.total,
        amount_paid: 0,
        due_date: dueDate.toISOString(),
        stripe_payment_intent_id: null,
        // Preserve Stripe Connect fields as null for quote-converted invoices
        stripe_invoice_id: null,
        amount: null, // Will use 'total' instead
        currency: 'usd',
        description: quote.job_summary || `Invoice for Quote #${quote.quote_number}`,
        job_summary: quote.job_summary,
        customer_email: null,
        customer_name: null,
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      console.error('Error creating invoice:', invoiceError)
      return {
        success: false,
        message: invoiceError?.message || 'Failed to create invoice.'
      }
    }

    // Duplicate line items to invoice_items table
    if (lineItems && lineItems.length > 0) {
      const invoiceItems = lineItems.map((item, index) => ({
        invoice_id: invoice.id,
        label: item.label,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        taxable: item.taxable,
        position: index,
      }))

      const { error: itemsInsertError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems)

      if (itemsInsertError) {
        console.error('Error creating invoice items:', itemsInsertError)
        // Don't fail the whole operation, but log the error
        // Invoice is created, items can be added manually if needed
      }
    }

    // Update quote status to 'accepted'
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ status: 'accepted' })
      .eq('id', quoteId)

    if (updateError) {
      console.error('Error updating quote status:', updateError)
      // Invoice is created, but quote status update failed
      // This is not critical, but should be logged
    }

    revalidatePath(`/quotes/${quoteId}`)
    revalidatePath('/invoices')

    return {
      success: true,
      message: 'Quote converted to invoice successfully!',
      invoiceId: invoice.id
    }
  } catch (error: any) {
    console.error('Error converting quote to invoice:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}

/**
 * Mark an invoice as paid manually (cash/check)
 */
export async function markInvoicePaid(invoiceId: string): Promise<MarkPaidResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to update invoices.'
      }
    }

    // Get user's primary team
    const { data: primaryTeamId, error: teamError } = await supabase.rpc('get_user_primary_team')
    if (teamError || !primaryTeamId) {
      return {
        success: false,
        message: 'No team found. Please contact support.'
      }
    }

    // Fetch the invoice to verify access and get total
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('team_id', primaryTeamId)
      .single()

    if (invoiceError || !invoice) {
      return {
        success: false,
        message: 'Invoice not found or access denied.'
      }
    }

    // Update invoice status to 'paid' and set amount_paid to total
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        amount_paid: invoice.total || 0,
        paid_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    if (updateError) {
      console.error('Error updating invoice:', updateError)
      return {
        success: false,
        message: updateError.message || 'Failed to update invoice.'
      }
    }

    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath('/invoices')

    return {
      success: true,
      message: 'Invoice marked as paid successfully!'
    }
  } catch (error: any) {
    console.error('Error marking invoice as paid:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}

/**
 * Generate a payment link for an invoice
 * Returns the public payment URL
 */
export async function generatePaymentLink(invoiceId: string): Promise<PaymentLinkResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to generate payment links.'
      }
    }

    // Get user's primary team
    const { data: primaryTeamId, error: teamError } = await supabase.rpc('get_user_primary_team')
    if (teamError || !primaryTeamId) {
      return {
        success: false,
        message: 'No team found. Please contact support.'
      }
    }

    // Fetch the invoice to verify access
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('team_id', primaryTeamId)
      .single()

    if (invoiceError || !invoice) {
      return {
        success: false,
        message: 'Invoice not found or access denied.'
      }
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return {
        success: false,
        message: 'This invoice has already been paid.'
      }
    }

    // Generate payment link
    // Use NEXT_PUBLIC_APP_URL if available, otherwise construct from request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quotd.app'
    const paymentLink = `${baseUrl}/pay/${invoiceId}`

    revalidatePath(`/invoices/${invoiceId}`)

    return {
      success: true,
      message: 'Payment link generated successfully!',
      paymentLink
    }
  } catch (error: any) {
    console.error('Error generating payment link:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}

