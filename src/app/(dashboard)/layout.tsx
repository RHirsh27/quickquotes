import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/BottomNav'
import Navbar from '@/components/layout/navbar'
import { DashboardWrapper } from '@/components/layout/DashboardWrapper'

// Mark this route as dynamic since it uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      redirect('/login')
    }

    // Fetch user's role for RBAC
    let userRole: 'owner' | 'member' | null = null
    try {
      const { data: teamMember, error: roleError } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      
      if (!roleError && teamMember) {
        userRole = teamMember.role as 'owner' | 'member'
      }
    } catch (error) {
      console.error('[Dashboard Layout] Error fetching user role:', error)
      // Continue without role - will default to showing all items
    }

    // STRICT PAYWALL: Check subscription status for ALL users (owners and members)
    // Only owners can have subscriptions, but members need to be on a team with an active subscription
    try {
      let hasActiveSubscription = false

      if (userRole === 'owner') {
        // For owners: Check their own subscription
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .limit(1)
          .maybeSingle()

        if (!subError && subscription) {
          hasActiveSubscription = true
        }
      } else if (userRole === 'member') {
        // For members: Check if their team owner has an active subscription
        const { data: teamMember, error: tmError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (!tmError && teamMember) {
          // Find the owner of this team
          const { data: owner, error: ownerError } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamMember.team_id)
            .eq('role', 'owner')
            .limit(1)
            .maybeSingle()

          if (!ownerError && owner) {
            // Check owner's subscription
            const { data: subscription, error: subError } = await supabase
              .from('subscriptions')
              .select('status')
              .eq('user_id', owner.user_id)
              .in('status', ['active', 'trialing'])
              .limit(1)
              .maybeSingle()

            if (!subError && subscription) {
              hasActiveSubscription = true
            }
          }
        }
      } else {
        // No role assigned - check if user has a subscription (might be a new user)
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .limit(1)
          .maybeSingle()

        if (!subError && subscription) {
          hasActiveSubscription = true
        }
      }

      // If no active subscription found, redirect to finish-setup
      // Exception: Don't redirect if already on /finish-setup or API routes
      if (!hasActiveSubscription) {
        redirect('/finish-setup')
      }
    } catch (error) {
      console.error('[Dashboard Layout] Error checking subscription:', error)
      // On error, redirect to finish-setup to be safe (strict paywall)
      redirect('/finish-setup')
    }

    return (
      <DashboardWrapper>
        <div className="min-h-screen bg-gray-50">
          {/* Desktop Header (Hidden on mobile) */}
          <div className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-extrabold text-gray-800" style={{ fontWeight: 800 }}>Quotd</h1>
              <p className="text-xs text-gray-500 -mt-1">Instant Estimates</p>
            </div>
            <Navbar />
          </div>

          {/* Mobile Header (Visible on mobile) */}
          <div className="md:hidden">
            <Navbar />
          </div>

          {/* Main Content */}
          <main className="pb-24 md:pb-8">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <BottomNav userRole={userRole} />
        </div>
      </DashboardWrapper>
    )
  } catch (error) {
    console.error('Error in dashboard layout:', error)
    redirect('/login')
  }
}
