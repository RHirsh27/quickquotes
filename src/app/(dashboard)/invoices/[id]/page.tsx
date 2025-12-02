'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { ChevronLeft, Download, Share2, Printer, Mail, MessageCircle, DollarSign, Copy, X } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { markInvoicePaid, generatePaymentLink } from '@/app/actions/invoices'
import { LoadingButton } from '@/components/ui/LoadingButton'

export default function InvoiceDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [invoice, setInvoice] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [customer, setCustomer] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentLink, setPaymentLink] = useState<string | null>(null)
  const [markingPaid, setMarkingPaid] = useState(false)

  useEffect(() => {
    async function fetchInvoiceData() {
      // 1. Get Invoice
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error || !invoiceData) {
        console.error('Error fetching invoice:', error)
        toast.error('Invoice not found')
        router.push('/dashboard')
        return
      }
      setInvoice(invoiceData)

      // 2. Get Items
      const { data: itemsData } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('position')
      setItems(itemsData || [])

      // 3. Get Customer
      if (invoiceData.customer_id) {
        const { data: custData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', invoiceData.customer_id)
          .single()
        setCustomer(custData)
      }

      // 4. Get User Profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', invoiceData.user_id)
        .single()
      setProfile(userData)

      setInitialLoading(false)
      setLoading(false)
    }

    if (id) fetchInvoiceData()
  }, [id, router, supabase])

  // --- ACTIONS ---

  const handleShare = async () => {
    const shareData = {
      title: `Invoice #${invoice.invoice_number}`,
      text: `Invoice from ${profile?.company_name || 'us'}.`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEmail = () => {
    const subject = `Invoice #${invoice.invoice_number} from ${profile?.company_name || 'My Business'}`
    const body = `Hi ${customer?.name || 'Customer'},%0D%0A%0D%0AHere is your invoice. You can view the details here:%0D%0A${window.location.href}%0D%0A%0D%0AThank you!`
    window.location.href = `mailto:${customer?.email || ''}?subject=${subject}&body=${body}`
  }

  const handleSMS = () => {
    const body = `Hi ${customer?.name || 'Customer'}, here is your invoice: ${window.location.href}`
    window.location.href = `sms:${customer?.phone || ''}?&body=${body}`
  }

  const handleMarkPaidManually = async () => {
    if (!invoice) return

    const confirmed = window.confirm(
      `Mark invoice #${invoice.invoice_number} as paid? This will update the invoice status to "Paid".`
    )

    if (!confirmed) return

    setMarkingPaid(true)

    try {
      const result = await markInvoicePaid(invoice.id)

      if (result.success) {
        toast.success(result.message)
        setShowPaymentModal(false)
        // Refresh invoice data
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', id)
          .single()
        if (invoiceData) {
          setInvoice(invoiceData)
        }
      } else {
        toast.error(result.message || 'Failed to mark invoice as paid')
      }
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error)
      toast.error(`Failed to mark invoice as paid: ${error.message || 'Unknown error'}`)
    } finally {
      setMarkingPaid(false)
    }
  }

  const handleGeneratePaymentLink = async () => {
    if (!invoice) return

    try {
      const result = await generatePaymentLink(invoice.id)

      if (result.success && result.paymentLink) {
        setPaymentLink(result.paymentLink)
        toast.success('Payment link generated!')
      } else {
        toast.error(result.message || 'Failed to generate payment link')
      }
    } catch (error: any) {
      console.error('Error generating payment link:', error)
      toast.error(`Failed to generate payment link: ${error.message || 'Unknown error'}`)
    }
  }

  const handleCopyLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink)
      toast.success('Payment link copied to clipboard!')
    }
  }

  const handleTextLinkToCustomer = () => {
    if (paymentLink && customer?.phone) {
      const body = `Hi ${customer.name}, please pay your invoice here: ${paymentLink}`
      window.location.href = `sms:${customer.phone}?&body=${body}`
    } else {
      toast.error('Customer phone number not available')
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return null
  }

  const isPaid = invoice.status === 'paid'
  const isUnpaid = invoice.status === 'unpaid'

  // Calculate totals from items if invoice.total is not available
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  // Use total if available (quote-converted invoices), otherwise use amount (Stripe Connect invoices), otherwise use subtotal
  const total = invoice.total || (invoice.amount ? invoice.amount / 100 : subtotal) // amount is in cents for Stripe
  const amountPaid = invoice.amount_paid || 0
  const balance = total - amountPaid

  return (
    <div className="min-h-screen bg-gray-50 pb-20 print:bg-white print:pb-0">
      
      {/* Top Nav - Hide when printing */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center gap-2 sticky top-0 z-10 print:hidden">
        <Link href="/dashboard">
          <Button variant="ghost" className="p-2"><ChevronLeft className="h-6 w-6" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Invoice #{invoice.invoice_number}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleShare} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        
        {/* Action Buttons - Hide when printing */}
        <div className="space-y-3 print:hidden">
          {/* Collect Payment Button - Only show if unpaid */}
          {isUnpaid && (
            <Button
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Collect Payment
            </Button>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Print */}
            <Button variant="outline" onClick={handlePrint} className="w-full">
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>

            {/* Email */}
            <Button variant="outline" onClick={handleEmail} className="w-full">
              <Mail className="mr-2 h-4 w-4" /> Email
            </Button>

            {/* Text */}
            <Button variant="outline" onClick={handleSMS} className="w-full">
              <MessageCircle className="mr-2 h-4 w-4" /> Text
            </Button>

            {/* Share */}
            <Button variant="outline" onClick={handleShare} className="w-full">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          </div>
        </div>

        {/* Invoice View - This is what gets printed */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
          
          {/* Print Header */}
          <div className="flex justify-between items-start mb-8 border-b pb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile?.company_name}</h2>
              <p className="text-gray-500">{profile?.phone}</p>
              <p className="text-gray-500">{profile?.email}</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold text-blue-600">INVOICE</h3>
              <p className="text-gray-600">#{invoice.invoice_number}</p>
              <p className="text-sm text-gray-400">{new Date(invoice.created_at).toLocaleDateString()}</p>
              {/* Status Badge */}
              <div className="mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isPaid 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {isPaid ? 'PAID' : 'UNPAID'}
                </span>
              </div>
            </div>
          </div>

          {/* Customer */}
          {customer && (
            <div className="mb-8">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
              <p className="font-bold text-lg">{customer.name}</p>
              {customer.address_line_1 && <p className="text-gray-600">{customer.address_line_1}</p>}
              {customer.city && <p className="text-gray-600">{customer.city}, {customer.state} {customer.postal_code}</p>}
              {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
              {customer.email && <p className="text-gray-600">{customer.email}</p>}
            </div>
          )}

          {/* Job Summary */}
          {invoice.job_summary && (
            <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Scope of Work</p>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.job_summary}</p>
            </div>
          )}

          {/* Items Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-100 text-left">
                <th className="py-2 text-sm font-bold text-gray-500 w-1/2">Description</th>
                <th className="py-2 text-sm font-bold text-gray-500 text-center">Qty</th>
                <th className="py-2 text-sm font-bold text-gray-500 text-right">Rate</th>
                <th className="py-2 text-sm font-bold text-gray-500 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-2">
                      <p className="font-medium text-gray-900">{item.label}</p>
                      {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                    </td>
                    <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-600">${item.unit_price.toFixed(2)}</td>
                    <td className="py-3 text-right font-medium text-gray-900">${(item.quantity * item.unit_price).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No line items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex flex-col items-end space-y-2 pt-4 border-t border-gray-100">
            <div className="flex justify-between w-48 text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-48 text-xl font-bold text-gray-900 pt-2 border-t">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {amountPaid > 0 && (
              <>
                <div className="flex justify-between w-48 text-gray-600 pt-2">
                  <span>Amount Paid</span>
                  <span>${amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-48 text-lg font-semibold text-red-600 pt-2 border-t">
                  <span>Balance Due</span>
                  <span>${balance.toFixed(2)}</span>
                </div>
              </>
            )}
            {invoice.due_date && (
              <div className="flex justify-between w-48 text-sm text-gray-500 pt-2">
                <span>Due Date</span>
                <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {invoice.description && (
            <div className="mt-12 bg-gray-50 p-4 rounded-lg print:bg-transparent print:p-0 print:mt-8">
              <p className="text-sm font-bold text-gray-700 mb-1">Notes / Terms</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Collect Payment</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setPaymentLink(null)
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!paymentLink ? (
              <div className="space-y-3">
                <p className="text-gray-600 mb-4">Choose how you want to collect payment:</p>
                
                <Button
                  onClick={handleMarkPaidManually}
                  disabled={markingPaid}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {markingPaid ? 'Marking as Paid...' : 'Mark Paid Manually (Cash/Check)'}
                </Button>

                <Button
                  onClick={handleGeneratePaymentLink}
                  variant="outline"
                  className="w-full"
                >
                  Generate Online Payment Link (Stripe)
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Payment Link:</p>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="text"
                      readOnly
                      value={paymentLink}
                      className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                      title="Copy link"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button
                    onClick={handleTextLinkToCustomer}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={!customer?.phone}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Text to Customer
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentLink(null)
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

