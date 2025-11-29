import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'

export default async function Dashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch user profile from users table
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const companyName = profile?.company_name || 'User'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Message */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {companyName}
        </h1>
      </div>

      {/* Create New Quote Button */}
      <div className="mb-8">
        <Link href="/quotes/new">
          <Button className="w-full md:w-auto h-16 text-lg">
            <Plus className="mr-2 h-6 w-6" />
            Create New Quote
          </Button>
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Total Quotes</p>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Active Quotes</p>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600">$0</p>
        </div>
      </div>
    </div>
  )
}
