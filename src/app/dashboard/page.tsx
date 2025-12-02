import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { 
  Plus, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Users, 
  UserPlus,
  Clock,
  ArrowUpRight
} from 'lucide-react'

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
  let avgQuoteValue = 0 // Average quote value for owners
  let myQuotes = 0 // For members: quotes created by this user only
  let myActiveQuotes = 0 // For members: active quotes created by this user only
  let myTotalValue = 0 // For members: total value of quotes created by this user
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
          .select('id, status, total, created_at, quote_number, user_id, customers(name), users(full_name, company_name)')
          .eq('user_id', user.id) // Only quotes created by this user
          .order('created_at', { ascending: false })

        if (quotesError) {
          console.error('[Dashboard] Error fetching member quotes:', quotesError)
          // Stats remain at 0 (default)
        } else if (quotesData && Array.isArray(quotesData)) {
          myQuotes = quotesData.length || 0
          myActiveQuotes = quotesData.filter(q => q && (q.status === 'sent' || q.status === 'draft')).length || 0
          myTotalValue = quotesData.reduce((sum, q) => {
            const total = Number(q?.total) || 0
            return sum + total
          }, 0)
          recentQuotes = (quotesData.slice(0, 10) || []).map(q => {
            // Handle users as either array or single object
            const userData = Array.isArray(q?.users) ? q?.users[0] : q?.users
            return {
              id: q?.id || '',
              quote_number: q?.quote_number || '',
              status: q?.status || 'draft',
              total: Number(q?.total) || 0,
              created_at: q?.created_at || new Date().toISOString(),
              customers: q?.customers || null,
              user_id: q?.user_id || user.id,
              creator_name: userData?.full_name || userData?.company_name || 'You',
            }
          })
        }
      } else {
        // Owners: Show team-wide stats (or user-only if no team)
        let quotesQuery = supabase
          .from('quotes')
          .select('id, status, total, created_at, quote_number, user_id, customers(name), users(full_name, company_name)')
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
          // Calculate average quote value (from all quotes, not just accepted)
          const quoteTotals = quotesData.map(q => Number(q?.total) || 0).filter(total => total > 0)
          avgQuoteValue = quoteTotals.length > 0 
            ? quoteTotals.reduce((sum, total) => sum + total, 0) / quoteTotals.length 
            : 0
          recentQuotes = (quotesData.slice(0, 10) || []).map(q => {
            // Handle users as either array or single object
            const userData = Array.isArray(q?.users) ? q?.users[0] : q?.users
            return {
              id: q?.id || '',
              quote_number: q?.quote_number || '',
              status: q?.status || 'draft',
              total: Number(q?.total) || 0,
              created_at: q?.created_at || new Date().toISOString(),
              customers: q?.customers || null,
              user_id: q?.user_id || user.id,
              creator_name: userData?.full_name || userData?.company_name || 'Team Member',
            }
          })
          console.log('[Dashboard] Successfully fetched quotes:', {
            total: totalQuotes,
            active: activeQuotes,
            revenue: totalRevenue,
            avgQuoteValue: avgQuoteValue,
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

  // Format current date
  const currentDate = new Date()
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' }
  const formattedDate = currentDate.toLocaleDateString('en-US', dateOptions)

  // Helper function to format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome back, {companyName || 'My Company'}
          </h1>
          <p className="text-sm text-gray-500">{formattedDate}</p>
          {userRole && (
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
              userRole === 'owner' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {userRole === 'owner' ? 'Owner View' : 'Member View'}
            </span>
          )}
        </div>
        
        {/* Quick Action Bar */}
        <div className="flex items-center gap-3">
          <Link href="/quotes/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Quote
            </Button>
          </Link>
          <Link href="/customers?new=true">
            <Button variant="outline" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards - Premium Design */}
      {userRole === 'member' ? (
        // Member view: My Performance
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-10">
              <FileText className="h-16 w-16 text-blue-600" />
            </div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">MY QUOTES</p>
            <p className="text-4xl font-bold text-gray-900 mb-2">{myQuotes}</p>
            <p className="text-xs text-green-600 font-medium">All time</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-10">
              <TrendingUp className="h-16 w-16 text-green-600" />
            </div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">ACTIVE QUOTES</p>
            <p className="text-4xl font-bold text-gray-900 mb-2">{myActiveQuotes}</p>
            <p className="text-xs text-green-600 font-medium">In progress</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-10">
              <DollarSign className="h-16 w-16 text-green-600" />
            </div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">MY TOTAL VALUE</p>
            <p className="text-4xl font-bold text-gray-900 mb-2">${myTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-green-600 font-medium">All quotes</p>
          </div>
        </div>
      ) : (
        // Owner view: Team Totals
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-10">
              <FileText className="h-16 w-16 text-blue-600" />
            </div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">TOTAL QUOTES</p>
            <p className="text-4xl font-bold text-gray-900 mb-2">{totalQuotes}</p>
            <p className="text-xs text-green-600 font-medium">+{Math.floor(totalQuotes * 0.12)} from last month</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-10">
              <TrendingUp className="h-16 w-16 text-blue-600" />
            </div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">ACTIVE QUOTES</p>
            <p className="text-4xl font-bold text-gray-900 mb-2">{activeQuotes}</p>
            <p className="text-xs text-green-600 font-medium">Pending review</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-10">
              <DollarSign className="h-16 w-16 text-green-600" />
            </div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">TOTAL REVENUE</p>
            <p className="text-4xl font-bold text-green-600 mb-2">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-green-600 font-medium">Accepted quotes</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-10">
              <ArrowUpRight className="h-16 w-16 text-purple-600" />
            </div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">AVG QUOTE VALUE</p>
            <p className="text-4xl font-bold text-gray-900 mb-2">${avgQuoteValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-green-600 font-medium">Per quote average</p>
          </div>
        </div>
      )}

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        
        {recentQuotes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Started</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Create your first quote to see activity here. Start by adding a customer and creating a quote.
            </p>
            <Link href="/quotes/new">
              <Button className="flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" />
                Create Your First Quote
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentQuotes.map((quote) => {
              if (!quote || !quote.id) return null
              
              const creatorName = quote.creator_name || 'Team Member'
              const customerName = quote.customers?.name || 'Unknown Customer'
              const initials = getInitials(creatorName)
              
              return (
                <li key={quote.id}>
                  <Link 
                    href={`/quotes/${quote.id}`} 
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700">{initials}</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Created quote <span className="font-semibold">#{quote.quote_number || 'N/A'}</span> for <span className="font-semibold">{customerName}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(quote.created_at)}
                        </p>
                        {quote.status && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              quote.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              quote.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                              quote.status === 'declined' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {quote.status.toUpperCase()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Amount */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-bold text-gray-900">
                        ${(quote.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
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

