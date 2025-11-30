import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button, LoadingSpinner } from '@/components/ui'
import { Plus } from 'lucide-react'

// Mark this route as dynamic since it uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  // Check environment variables first
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('[Dashboard] Missing Supabase environment variables')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'MISSING')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'MISSING')
    throw new Error('Missing required Supabase environment variables')
  }

  let supabase
  try {
    supabase = await createClient()
  } catch (error) {
    console.error('[Dashboard] Error creating Supabase client:', error)
    console.error('[Dashboard] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw new Error('Failed to initialize database client')
  }
  
  let user
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[Dashboard] Error fetching user:', authError)
      console.error('[Dashboard] Auth error details:', {
        message: authError.message,
        status: authError.status,
      })
      redirect('/login')
    }
    
    user = authData.user
    
    if (!user) {
      console.warn('[Dashboard] No user found, redirecting to login')
      redirect('/login')
    }
  } catch (error) {
    console.error('[Dashboard] Error in auth check:', error)
    console.error('[Dashboard] Auth check error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    redirect('/login')
  }

  // Fetch user profile from users table (handle errors gracefully)
  let companyName = 'User'
  let totalQuotes = 0
  let activeQuotes = 0
  let totalRevenue = 0
  let recentQuotes: any[] = []

  try {
    // Fetch user profile
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('[Dashboard] Error fetching user profile:', profileError)
        console.error('[Dashboard] Profile error details:', {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
        })
      } else if (profile) {
        companyName = profile.company_name || profile.full_name || 'User'
      } else {
        console.warn('[Dashboard] No profile found for user:', user.id)
      }
    } catch (error) {
      console.error('[Dashboard] Exception fetching profile:', error)
      console.error('[Dashboard] Profile exception details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
    }

    // Get user's primary team
    let teamId: string | null = null
    try {
      // Call the RPC function to get primary team
      const { data: primaryTeamId, error: teamError } = await supabase.rpc('get_user_primary_team')
      
      if (teamError) {
        console.error('[Dashboard] Error fetching primary team via RPC:', teamError)
        console.error('[Dashboard] Team RPC error details:', {
          message: teamError.message,
          code: teamError.code,
          details: teamError.details,
          hint: teamError.hint,
        })
        
        // Fallback: try to get team from team_members
        try {
          const { data: teamMemberData, error: teamMemberError } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)
            .eq('role', 'owner')
            .limit(1)
            .single()
          
          if (teamMemberError) {
            console.error('[Dashboard] Error fetching team member (fallback):', teamMemberError)
          } else if (teamMemberData) {
            teamId = teamMemberData.team_id
            console.log('[Dashboard] Found team via fallback method:', teamId)
          }
        } catch (fallbackError) {
          console.error('[Dashboard] Exception in team member fallback:', fallbackError)
        }
      } else if (primaryTeamId) {
        teamId = primaryTeamId
        console.log('[Dashboard] Found primary team via RPC:', teamId)
      } else {
        console.warn('[Dashboard] No primary team found for user:', user.id)
      }
    } catch (error) {
      console.error('[Dashboard] Exception getting team ID:', error)
      console.error('[Dashboard] Team ID exception details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
    }

    // Fetch stats - use team_id if available, otherwise fallback to user_id
    try {
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

      if (quotesError) {
        console.error('[Dashboard] Error fetching quotes:', quotesError)
        console.error('[Dashboard] Quotes error details:', {
          message: quotesError.message,
          code: quotesError.code,
          details: quotesError.details,
          hint: quotesError.hint,
        })
      } else if (quotesData) {
        totalQuotes = quotesData.length
        activeQuotes = quotesData.filter(q => q.status === 'sent' || q.status === 'draft').length
        totalRevenue = quotesData
          .filter(q => q.status === 'accepted')
          .reduce((sum, q) => sum + (Number(q.total) || 0), 0)
        recentQuotes = quotesData.slice(0, 5).map(q => ({
          ...q,
          total: Number(q.total) || 0,
        }))
        console.log('[Dashboard] Successfully fetched quotes:', {
          total: totalQuotes,
          active: activeQuotes,
          revenue: totalRevenue,
          recent: recentQuotes.length,
        })
      } else {
        console.warn('[Dashboard] No quotes data returned (null or undefined)')
      }
    } catch (error) {
      console.error('[Dashboard] Exception fetching quotes:', error)
      console.error('[Dashboard] Quotes exception details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
    }

  } catch (error) {
    // Catch-all for any unexpected errors
    console.error('[Dashboard] Unexpected error in data fetching:', error)
    console.error('[Dashboard] Unexpected error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
    })
    // Don't throw - allow page to render with default values
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

