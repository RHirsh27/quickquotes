import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Button, LoadingSpinner } from '@/components/ui'
import { CreditCard, CheckCircle, AlertCircle, User, DollarSign } from 'lucide-react'
import Link from 'next/link'
import PayInvoiceClient from './PayInvoiceClient'

// Mark as dynamic since we're fetching data
export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    invoiceId: string
  }
  searchParams: {
    success?: string
    canceled?: string
  }
}

export default async function PayInvoicePage({ params, searchParams }: PageProps) {
  const { invoiceId } = params
  const { success, canceled } = searchParams

  // Create Supabase client (public access, no auth required)
  const supabase = await createClient()

  // Fetch invoice with user details
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      users:user_id (
        id,
        full_name,
        company_name,
        stripe_connect_id
      )
    `)
    .eq('id', invoiceId)
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Already Paid</h1>
            <p className="text-gray-600 mb-6">
              This invoice has already been paid. Thank you!
            </p>
            <Link href="/">
              <Button variant="outline">Return to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const techUser = invoice.users as any
  const techName = techUser?.company_name || techUser?.full_name || 'Service Provider'
  const amount = invoice.amount || 0
  const amountInDollars = (amount / 100).toFixed(2)
  const currency = invoice.currency || 'usd'

  // Show success message if payment was successful
  if (success === 'true') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your payment has been processed successfully. Thank you!
            </p>
            <Link href="/">
              <Button variant="outline">Return to Home</Button>
            </Link>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Canceled</h1>
            <p className="text-gray-600 mb-6">
              Your payment was canceled. You can try again below.
            </p>
            <PayInvoiceClient invoiceId={invoiceId} />
          </div>
        </div>
      </div>
    )
  }

  // Check if tech has Stripe Connect set up
  if (!techUser?.stripe_connect_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Available</h1>
            <p className="text-gray-600 mb-6">
              The service provider has not set up payment processing yet. Please contact them directly.
            </p>
            <Link href="/">
              <Button variant="outline">Return to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pay Invoice</h1>
            <p className="text-gray-600">Complete your payment securely</p>
          </div>

          {/* Invoice Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Service Provider</p>
                  <p className="font-semibold text-gray-900">{techName}</p>
                </div>
              </div>

              {invoice.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-900">{invoice.description}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <DollarSign className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${amountInDollars} {currency.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <PayInvoiceClient invoiceId={invoiceId} />

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              <CreditCard className="inline h-3 w-3 mr-1" />
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

