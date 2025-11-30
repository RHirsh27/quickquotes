'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, ChevronRight, FileText } from 'lucide-react'
import { Button, LoadingSpinner } from '@/components/ui'
import type { Quote } from '@/lib/types'

type QuoteWithCustomer = Quote & {
  customers: { name: string } | null
}

export default function QuotesHistoryPage() {
  const supabase = createClient()
  const [quotes, setQuotes] = useState<QuoteWithCustomer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuotes() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('quotes')
        .select(`*, customers ( name )`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching quotes:', error)
      } else {
        setQuotes(data || [])
      }
      setLoading(false)
    }
    fetchQuotes()
  }, [supabase])

  const getStatusBadge = (status: Quote['status']) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      accepted: 'bg-green-100 text-green-700',
      declined: 'bg-red-100 text-red-700'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quote History</h1>
          <p className="text-gray-500">View and manage all your quotes</p>
        </div>
        <Link href="/quotes/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Quote
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading quotes...</p>
            </div>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">No quotes found.</p>
            <p className="text-sm text-gray-400">Create your first quote to get started.</p>
          </div>
        ) : (
          quotes.map((quote) => (
            <Link key={quote.id} href={`/quotes/${quote.id}`}>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate">
                        {quote.customers?.name || 'Unknown Customer'}
                      </h3>
                      {getStatusBadge(quote.status)}
                    </div>
                    <p className="text-xs text-gray-500">
                      #{quote.quote_number} • {new Date(quote.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${quote.total.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">
                      {quote.status === 'draft' ? 'Draft' : 'Sent'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
