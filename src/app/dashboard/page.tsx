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

  // Initialize defaults - all values start at safe defaults
  let companyName = 'My Company'
  let userRole: 'owner' | 'member' | null = null
  let totalQuotes = 0
  let activeQuotes = 0
  let totalRevenue = 0
  let myQuotes = 0 // For members: quotes created by this user only
  let myActiveQuotes = 0 // For members: active quotes created by this user only
  let recentQuotes: any[] = []

  try {
    // Fetch user profile - handle null gracefully
    let profile: any = null
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle() // Use maybeSingle() to handle missing profiles gracefully
      
      if (profileError) {
        // Log non-PGRST116 errors (PGRST116 means no rows found, which is okay)
        if (profileError.code !== 'PGRST116') {
          console.error('[Dashboard] Error fetching user profile:', profileError)
          console.error('[Dashboard] Profile error details:', {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint,
          })
        }
      } else {
        profile = profileData
      }
    } catch (error) {
      console.error('[Dashboard] Exception fetching profile:', error)
      // Continue with defaults
    }

    // Set company name with safe defaults
    if (profile) {
      companyName = profile.company_name || profile.full_name || 'My Company'
    } else {
      // No profile found - use default
      companyName = 'My Company'
    }

    // Get user's primary team and role - handle missing team gracefully
    let teamId: string | null = null
    try {
      // Try RPC function first (if it exists)
      try {
        const { data: primaryTeamId, error: teamError } = await supabase.rpc('get_user_primary_team')
        
        if (teamError) {
          // RPC function might not exist or failed - try direct query fallback
          // PGRST428 means function doesn't exist, which is okay
          if (teamError.code !== 'PGRST428') {
            console.warn('[Dashboard] RPC failed, trying direct query:', teamError.message)
          }
        } else if (primaryTeamId) {
          teamId = primaryTeamId
          console.log('[Dashboard] Found primary team via RPC:', teamId)
          
          // Fetch user's role
          const { data: teamMember, error: roleError } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', primaryTeamId)
            .eq('user_id', user.id)
            .maybeSingle() // Use maybeSingle() for graceful handling
          
          if (!roleError && teamMember) {
            userRole = teamMember.role as 'owner' | 'member'
            console.log('[Dashboard] User role:', userRole)
          }
        }
      } catch (rpcError) {
        // RPC function might not exist - fall through to direct query
        console.warn('[Dashboard] RPC call failed, using direct query fallback:', rpcError instanceof Error ? rpcError.message : 'Unknown error')
      }
      
      // Fallback: Direct query if RPC didn't work or returned no team
      if (!teamId) {
        const { data: teamMemberData, error: teamMemberError } = await supabase
          .from('team_members')
          .select('team_id, role')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle() // Use maybeSingle() instead of single() to handle no rows gracefully
        
        if (!teamMemberError && teamMemberData) {
          teamId = teamMemberData.team_id
          userRole = teamMemberData.role as 'owner' | 'member'
          console.log('[Dashboard] Found team via direct query:', teamId, 'Role:', userRole)
        } else if (teamMemberError && teamMemberError.code !== 'PGRST116') {
          // PGRST116 means no rows found - this is okay for new users
          console.warn('[Dashboard] No team found for user (this is okay for new users):', teamMemberError.message)
        } else {
          // No team found - this is okay, user might be new
          console.log('[Dashboard] No team found for user (will show empty stats):', user.id)
        }
      }
    } catch (error) {
      console.error('[Dashboard] Exception getting team ID:', error)
      console.error('[Dashboard] Team ID exception details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      // Continue without team - will show empty stats
    }

    // Fetch stats - different logic for owners vs members
    // Handle missing team gracefully - show empty stats instead of crashing
    try {
      if (userRole === 'member') {
        // Members: Only show their own quotes
        const { data: quotesData, error: quotesError } = await supabase
          .from('quotes')
          .select('id, status, total, created_at, quote_number, customers(name)')
          .eq('user_id', user.id) // Only quotes created by this user
          .order('created_at', { ascending: false })

        if (quotesError) {
          console.error('[Dashboard] Error fetching member quotes:', quotesError)
          // Stats remain at 0 (default)
        } else if (quotesData && Array.isArray(quotesData)) {
          myQuotes = quotesData.length || 0
          myActiveQuotes = quotesData.filter(q => q && (q.status === 'sent' || q.status === 'draft')).length || 0
          recentQuotes = (quotesData.slice(0, 5) || []).map(q => ({
            id: q?.id || '',
            quote_number: q?.quote_number || '',
            status: q?.status || 'draft',
            total: Number(q?.total) || 0,
            created_at: q?.created_at || new Date().toISOString(),
            customers: q?.customers || null,
          }))
        }
      } else {
        // Owners: Show team-wide stats (or user-only if no team)
        let quotesQuery = supabase
          .from('quotes')
          .select('id, status, total, created_at, quote_number, customers(name)')
          .order('created_at', { ascending: false })
        
        if (teamId) {
          // Use team_id if available
          quotesQuery = quotesQuery.eq('team_id', teamId)
        } else {
          // Fallback to user_id if no team found (edge case)
          quotesQuery = quotesQuery.eq('user_id', user.id)
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
          // Stats remain at 0 (default)
        } else if (quotesData && Array.isArray(quotesData)) {
          totalQuotes = quotesData.length || 0
          activeQuotes = quotesData.filter(q => q && (q.status === 'sent' || q.status === 'draft')).length || 0
          totalRevenue = quotesData
            .filter(q => q && q.status === 'accepted')
            .reduce((sum, q) => {
              const total = Number(q?.total) || 0
              return sum + total
            }, 0)
          recentQuotes = (quotesData.slice(0, 5) || []).map(q => ({
            id: q?.id || '',
            quote_number: q?.quote_number || '',
            status: q?.status || 'draft',
            total: Number(q?.total) || 0,
            created_at: q?.created_at || new Date().toISOString(),
            customers: q?.customers || null,
          }))
          console.log('[Dashboard] Successfully fetched quotes:', {
            total: totalQuotes,
            active: activeQuotes,
            revenue: totalRevenue,
            recent: recentQuotes.length,
          })
        } else {
          // No quotes data - this is okay, show empty state
          console.log('[Dashboard] No quotes found (user may be new)')
        }
      }
    } catch (error) {
      console.error('[Dashboard] Exception fetching quotes:', error)
      console.error('[Dashboard] Quotes exception details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      // Stats remain at 0 (default) - page will render with empty state
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
          Welcome back, {companyName || 'My Company'}
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
      {userRole === 'member' ? (
        // Member view: My Performance
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">My Quotes</p>
            <p className="text-3xl font-bold text-gray-900">{myQuotes}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">My Active Quotes</p>
            <p className="text-3xl font-bold text-gray-900">{myActiveQuotes}</p>
          </div>
        </div>
      ) : (
        // Owner view: Team Totals
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
      )}

      {/* Recent Quotes */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Quotes</h2>
        {recentQuotes.length === 0 ? (
          <p className="text-gray-500">No recent quotes. Create one to get started!</p>
        ) : (
          <ul className="space-y-3">
            {recentQuotes.map((quote) => {
              if (!quote || !quote.id) return null
              return (
                <li key={quote.id}>
                  <Link href={`/quotes/${quote.id}`} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">
                        #{quote.quote_number || 'N/A'} - {quote.customers?.name || 'Unknown Customer'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {quote.created_at ? new Date(quote.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900">${(quote.total || 0).toFixed(2)}</p>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

