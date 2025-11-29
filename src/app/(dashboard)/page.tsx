'use client'

import Link from 'next/link'
import { Plus, History, Users, Settings, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [recentQuotes, setRecentQuotes] = useState<any[]>([])
  const [stats, setStats] = useState({ count: 0, revenue: 0 })
  const supabase = createClient()

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Get Profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      // 2. Get Recent Quotes (Limit 5)
      // We also join the customer name for display
      const { data: quotes } = await supabase
        .from('quotes')
        .select(`
          *,
          customers ( name )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      
      setRecentQuotes(quotes || [])

      // 3. Get Stats (Simple aggregation)
      // Note: In a large app, use database functions for sum, but this is fine for MVP
      const { data: allQuotes } = await supabase
        .from('quotes')
        .select('total')
        .eq('user_id', user.id)
      
      const totalRev = allQuotes?.reduce((sum, q) => sum + (q.total || 0), 0) || 0
      setStats({
        count: allQuotes?.length || 0,
        revenue: totalRev
      })
    }
    getData()
  }, [supabase])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile?.company_name || 'My Dashboard'}
          </h1>
          <p className="text-gray-500">Overview</p>
        </div>
      </div>

      {/* Primary Action */}
      <Link href="/quotes/new" className="w-full">
        <Button className="w-full h-16 text-lg shadow-md bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-6 w-6" /> Create New Quote
        </Button>
      </Link>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Quotes Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Revenue (Est)</p>
          <p className="text-2xl font-bold text-green-600">${stats.revenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-3 gap-4 mt-2">
        <Link href="/quotes" className="flex flex-col items-center justify-center rounded-xl bg-white p-4 shadow-sm border border-gray-100 active:bg-gray-50">
          <History className="h-6 w-6 text-gray-600 mb-2" />
          <span className="text-xs font-medium text-gray-700">History</span>
        </Link>
        <Link href="/customers" className="flex flex-col items-center justify-center rounded-xl bg-white p-4 shadow-sm border border-gray-100 active:bg-gray-50">
          <Users className="h-6 w-6 text-gray-600 mb-2" />
          <span className="text-xs font-medium text-gray-700">Customers</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center justify-center rounded-xl bg-white p-4 shadow-sm border border-gray-100 active:bg-gray-50">
          <Settings className="h-6 w-6 text-gray-600 mb-2" />
          <span className="text-xs font-medium text-gray-700">Settings</span>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="mt-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Recent Quotes</h2>
        <div className="space-y-3">
          {recentQuotes.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm border border-gray-100">
              No quotes yet.
            </div>
          ) : (
            recentQuotes.map((q) => (
              <Link key={q.id} href={`/quotes/${q.id}`}>
                <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100 active:bg-gray-50">
                  <div>
                    <p className="font-bold text-gray-900">{q.customers?.name}</p>
                    <p className="text-xs text-gray-500">{new Date(q.created_at).toLocaleDateString()} • {q.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">${q.total.toFixed(2)}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

