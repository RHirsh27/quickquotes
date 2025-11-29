'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { ChevronLeft, Download, Send } from 'lucide-react'
import Link from 'next/link'
import { QuotePDF } from '@/components/quotes/QuotePDF'
import dynamic from 'next/dynamic'

// Dynamically import PDFDownloadLink to avoid SSR issues
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <p>Loading PDF...</p> }
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
        router.push('/dashboard')
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

      // 4. Get User Profile (for PDF header)
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

  if (loading) return <div className="p-8 text-center">Loading quote...</div>

  if (!quote || !customer || !profile) {
    return <div className="p-8 text-center">Quote not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navbar */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center gap-2 sticky top-0 z-10">
        <Link href="/dashboard">
          <Button variant="ghost" className="p-2"><ChevronLeft className="h-6 w-6" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Quote #{quote.quote_number}</h1>
          <p className="text-xs text-gray-500">{customer?.name}</p>
        </div>
        <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">
          {quote.status}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        
        {/* Actions Card */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-900">Actions</h2>
          
          <div className="flex gap-3">
            {/* The PDF Download Button */}
            <div className="flex-1">
              <PDFDownloadLink
                document={
                  <QuotePDF 
                    quote={quote} 
                    items={items} 
                    customer={customer} 
                    userProfile={profile} 
                  />
                }
                fileName={`Quote-${quote.quote_number}.pdf`}
              >
                {/* @ts-ignore - react-pdf types can be finicky with children render props */}
                {({ blob, url, loading: pdfLoading, error }) => (
                  <Button disabled={pdfLoading} variant="primary" className="w-full">
                    <Download className="mr-2 h-4 w-4" /> 
                    {pdfLoading ? 'Generating...' : 'Download PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>

            {/* Simulated Email Button */}
            <Button variant="outline" className="flex-1" onClick={() => alert("In MVP v2, this will open the native email client!")}>
              <Send className="mr-2 h-4 w-4" /> Email
            </Button>
          </div>
        </div>

        {/* Quote Preview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="border-b pb-4">
            <p className="text-sm text-gray-500">Bill To</p>
            <p className="font-semibold">{customer.name}</p>
            {customer.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
            {customer.email && <p className="text-sm text-gray-600">{customer.email}</p>}
          </div>

          <div>
            {items.map((item) => (
              <div key={item.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.quantity} x ${item.unit_price}</p>
                </div>
                <p className="font-medium">${(item.quantity * item.unit_price).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-between items-center text-xl font-bold">
            <span>Total</span>
            <span>${quote.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

