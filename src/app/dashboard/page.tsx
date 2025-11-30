import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button, LoadingSpinner } from '@/components/ui'
import { Plus } from 'lucide-react'

// Mark this route as dynamic since it uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch user profile from users table (handle errors gracefully)
  let companyName = 'User'
  let totalQuotes = 0
  let activeQuotes = 0
  let totalRevenue = 0
  let recentQuotes: any[] = []

  try {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (!profileError && profile) {
      companyName = profile.company_name || 'User'
    } else {
      console.error('Error fetching profile:', profileError)
    }

    // Get user's primary team
    let teamId: string | null = null
    try {
      // Call the RPC function to get primary team
      const { data: primaryTeamId, error: teamError } = await supabase.rpc('get_user_primary_team')
      if (!teamError && primaryTeamId) {
        teamId = primaryTeamId
      } else {
        console.error('Error fetching primary team:', teamError)
        // Fallback: try to get team from team_members
        const { data: teamMemberData } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .eq('role', 'owner')
          .limit(1)
          .single()
        if (teamMemberData) {
          teamId = teamMemberData.team_id
        }
      }
    } catch (error) {
      console.error('Error getting team ID:', error)
    }

    // Fetch stats - use team_id if available, otherwise fallback to user_id
    const quotesQuery = supabase
      .from('quotes')
      .select('id, status, total, created_at, quote_number, customers(name)')
      .order('created_at', { ascending: false })
    
    if (teamId) {
      quotesQuery.eq('team_id', teamId)
    } else {
      // Fallback to user_id if no team found
      quotesQuery.eq('user_id', user.id)
    }
    
    const { data: quotesData, error: quotesError } = await quotesQuery

    if (!quotesError && quotesData) {
      totalQuotes = quotesData.length
      activeQuotes = quotesData.filter(q => q.status === 'sent' || q.status === 'draft').length
      totalRevenue = quotesData
        .filter(q => q.status === 'accepted')
        .reduce((sum, q) => sum + (q.total || 0), 0)
      recentQuotes = quotesData.slice(0, 5)
    } else {
      console.error('Error fetching quotes for dashboard stats:', quotesError)
    }

  } catch (error) {
    // Table might not exist yet - that's okay, use default
    console.log('Dashboard data fetching error:', error)
  }

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
          <p className="text-3xl font-bold text-gray-900">{totalQuotes}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Active Quotes</p>
          <p className="text-3xl font-bold text-gray-900">{activeQuotes}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Recent Quotes */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Quotes</h2>
        {recentQuotes.length === 0 ? (
          <p className="text-gray-500">No recent quotes. Create one to get started!</p>
        ) : (
          <ul className="space-y-3">
            {recentQuotes.map((quote) => (
              <li key={quote.id}>
                <Link href={`/quotes/${quote.id}`} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">#{quote.quote_number} - {quote.customers?.name || 'Unknown Customer'}</p>
                    <p className="text-sm text-gray-500">{new Date(quote.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="font-bold text-gray-900">${quote.total.toFixed(2)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

