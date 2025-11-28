'use client'

import Link from 'next/link'
import { Plus, History, Users, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    }
    getUser()
  }, [])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile?.company_name || 'My Dashboard'}
          </h1>
          <p className="text-gray-500">Let's get to work.</p>
        </div>
      </div>

      {/* Primary Action - The "Money Button" */}
      <Link href="/quotes/new" className="w-full">
        <Button className="w-full h-16 text-lg shadow-md bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-6 w-6" /> Create New Quote
        </Button>
      </Link>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Quotes this month</p>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Revenue (Est)</p>
          <p className="text-2xl font-bold text-green-600">$0</p>
        </div>
      </div>

      {/* Navigation Grid (Mobile Friendly) */}
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

      {/* Recent Activity Placeholder */}
      <div className="mt-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Recent Quotes</h2>
        <div className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm border border-gray-100">
          No quotes yet. Tap the blue button to start!
        </div>
      </div>
    </div>
  )
}

