'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { ChevronLeft, Download, Share2, Printer, Mail, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { QuotePDF } from '@/components/quotes/QuotePDF'
import dynamic from 'next/dynamic'

// Dynamically import PDF to avoid server-side errors
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span className="text-sm text-gray-400">Loading PDF...</span> }
)

export default function QuoteDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [quote, setQuote] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [customer, setCustomer] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuoteData() {
      // 1. Get Quote
      const { data: quoteData, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error || !quoteData) {
        console.error('Error fetching quote:', error)
        // Don't redirect immediately so you can see the error in console if needed
        return
      }
      setQuote(quoteData)

      // 2. Get Items
      const { data: itemsData } = await supabase
        .from('quote_line_items')
        .select('*')
        .eq('quote_id', id)
        .order('position')
      setItems(itemsData || [])

      // 3. Get Customer
      const { data: custData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', quoteData.customer_id)
        .single()
      setCustomer(custData)

      // 4. Get User Profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', quoteData.user_id)
        .single()
      setProfile(userData)

      setLoading(false)
    }

    if (id) fetchQuoteData()
  }, [id])

  // --- ACTIONS ---

  const handleShare = async () => {
    const shareData = {
      title: `Quote #${quote.quote_number}`,
      text: `Here is the estimate from ${profile?.company_name || 'us'}.`,
      url: window.location.href, // Sharing the link to this page (or your public PDF link if you build that later)
    }

    // Use native mobile share if available
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEmail = () => {
    const subject = `Quote #${quote.quote_number} from ${profile?.company_name || 'My Business'}`
    const body = `Hi ${customer.name},%0D%0A%0D%0AHere is the quote we discussed. You can view the details here:%0D%0A${window.location.href}%0D%0A%0D%0AThank you!`
    window.location.href = `mailto:${customer.email || ''}?subject=${subject}&body=${body}`
  }

  const handleSMS = () => {
    const body = `Hi ${customer.name}, here is your quote: ${window.location.href}`
    window.location.href = `sms:${customer.phone || ''}?&body=${body}`
  }

  if (loading) return <div className="p-8 text-center">Loading quote details...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20 print:bg-white print:pb-0">
      
      {/* Top Nav - Hide when printing */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center gap-2 sticky top-0 z-10 print:hidden">
        <Link href="/dashboard">
          <Button variant="ghost" className="p-2"><ChevronLeft className="h-6 w-6" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Quote #{quote.quote_number}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleShare} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        
        {/* Action Buttons - Hide when printing */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
          {/* PDF Download */}
          <PDFDownloadLink
            document={<QuotePDF quote={quote} items={items} customer={customer} userProfile={profile} />}
            fileName={`Quote-${quote.quote_number}.pdf`}
            className="w-full"
          >
            {/* @ts-ignore */}
            {({ loading }) => (
              <Button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                <Download className="mr-2 h-4 w-4" /> PDF
              </Button>
            )}
          </PDFDownloadLink>

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
        </div>

        {/* Quote View - This is what gets printed */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
          
          {/* Print Header */}
          <div className="flex justify-between items-start mb-8 border-b pb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile?.company_name}</h2>
              <p className="text-gray-500">{profile?.phone}</p>
              <p className="text-gray-500">{profile?.email}</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold text-blue-600">QUOTE</h3>
              <p className="text-gray-600">#{quote.quote_number}</p>
              <p className="text-sm text-gray-400">{new Date(quote.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Customer */}
          <div className="mb-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
            <p className="font-bold text-lg">{customer.name}</p>
            {customer.address_line_1 && <p className="text-gray-600">{customer.address_line_1}</p>}
            {customer.city && <p className="text-gray-600">{customer.city}, {customer.state} {customer.postal_code}</p>}
            <p className="text-gray-600">{customer.phone}</p>
          </div>

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
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pr-2">
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </td>
                  <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">${item.unit_price.toFixed(2)}</td>
                  <td className="py-3 text-right font-medium text-gray-900">${(item.quantity * item.unit_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex flex-col items-end space-y-2 pt-4 border-t border-gray-100">
            <div className="flex justify-between w-48 text-gray-600">
              <span>Subtotal</span>
              <span>${quote.subtotal.toFixed(2)}</span>
            </div>
            {quote.tax_amount > 0 && (
              <div className="flex justify-between w-48 text-gray-600">
                <span>Tax ({quote.tax_rate}%)</span>
                <span>${quote.tax_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between w-48 text-xl font-bold text-gray-900 pt-2 border-t">
              <span>Total</span>
              <span>${quote.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="mt-12 bg-gray-50 p-4 rounded-lg print:bg-transparent print:p-0 print:mt-8">
              <p className="text-sm font-bold text-gray-700 mb-1">Notes / Terms</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
