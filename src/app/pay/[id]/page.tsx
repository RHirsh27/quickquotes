import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PayInvoiceClient from './PayInvoiceClient'

// Mark as dynamic since we're fetching data
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    success?: string
    canceled?: string
  }>
}

export default async function PayInvoicePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { success, canceled } = await searchParams

  // Create Supabase client (public access, no auth required)
  const supabase = await createClient()

  // Fetch invoice with user details and customer info
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      users:user_id (
        id,
        full_name,
        company_name,
        stripe_connect_id
      ),
      customers:customer_id (
        name,
        email,
        phone
      )
    `)
    .eq('id', id)
    .single()

  if (invoiceError || !invoice) {
    console.error('[Pay Invoice] Error fetching invoice:', invoiceError)
    notFound()
  }

  // Check if invoice is already paid
  if (invoice.status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Already Paid</h1>
            <p className="text-gray-600 mb-6">
              This invoice has already been paid. Thank you!
            </p>
          </div>
        </div>
      </div>
    )
  }

  const techUser = invoice.users as any
  const techName = techUser?.company_name || techUser?.full_name || 'Service Provider'
  
  // Handle both quote-converted invoices (total in dollars) and Stripe Connect invoices (amount in cents)
  const invoiceTotal = invoice.total || (invoice.amount ? invoice.amount / 100 : 0)
  const amountInDollars = invoiceTotal.toFixed(2)
  const currency = invoice.currency || 'usd'

  // Show success message if payment was successful
  if (success === 'true') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your payment has been processed successfully. Thank you!
            </p>
            {invoice.invoice_number && (
              <p className="text-sm text-gray-500 mb-4">
                Invoice #{invoice.invoice_number}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show canceled message if payment was canceled
  if (canceled === 'true') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Canceled</h1>
            <p className="text-gray-600 mb-6">
              Your payment was canceled. You can try again below.
            </p>
            <PayInvoiceClient invoiceId={id} invoiceTotal={invoiceTotal} />
          </div>
        </div>
      </div>
    )
  }

  // Check if tech has Stripe Connect set up (only required for Stripe Connect invoices)
  // For quote-converted invoices, we'll handle payment differently
  const isQuoteConvertedInvoice = invoice.quote_id !== null
  const needsStripeConnect = !isQuoteConvertedInvoice && !techUser?.stripe_connect_id

  if (needsStripeConnect) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Available</h1>
            <p className="text-gray-600 mb-6">
              The service provider has not set up payment processing yet. Please contact them directly.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Invoice from {techName}
          </h1>
          {invoice.invoice_number && (
            <p className="text-gray-600">Invoice #{invoice.invoice_number}</p>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 md:p-10">
          {/* Total Due - Big Text */}
          <div className="text-center mb-8 pb-8 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Total Due
            </p>
            <p className="text-5xl font-bold text-gray-900">
              ${amountInDollars}
            </p>
            {invoice.due_date && (
              <p className="text-sm text-gray-500 mt-2">
                Due {new Date(invoice.due_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            )}
          </div>

          {/* Invoice Details */}
          <div className="space-y-4 mb-8">
            {invoice.job_summary && (
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Description
                </p>
                <p className="text-gray-900 whitespace-pre-wrap">{invoice.job_summary}</p>
              </div>
            )}
            
            {invoice.description && !invoice.job_summary && (
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Description
                </p>
                <p className="text-gray-900">{invoice.description}</p>
              </div>
            )}

            {invoice.customers && (
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Bill To
                </p>
                <p className="text-gray-900 font-medium">
                  {(invoice.customers as any).name}
                </p>
              </div>
            )}
          </div>

          {/* Pay Now Button */}
          <PayInvoiceClient invoiceId={id} invoiceTotal={invoiceTotal} />

          {/* Security Notice */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure payment powered by Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

