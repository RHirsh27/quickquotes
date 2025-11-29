'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, ChevronRight, FileText } from 'lucide-react'
import { Button } from '@/components/ui'

export default function QuotesHistoryPage() {
  const supabase = createClient()
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuotes() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('quotes')
        .select(`*, customers ( name )`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      setQuotes(data || [])
      setLoading(false)
    }
    fetchQuotes()
  }, [supabase])

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quote History</h1>
        <Link href="/quotes/new">
          <Button variant="primary" className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl text-gray-500">No quotes found.</div>
        ) : (
          quotes.map((q) => (
            <Link key={q.id} href={`/quotes/${q.id}`}>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${q.status === 'sent' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{q.customers?.name}</h3>
                    <p className="text-xs text-gray-500">#{q.quote_number} • {new Date(q.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${q.total.toFixed(2)}</p>
                  <p className="text-xs uppercase font-bold text-gray-400">{q.status}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

