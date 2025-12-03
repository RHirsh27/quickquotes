import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/BottomNav'
import Navbar from '@/components/layout/navbar'
import { DashboardWrapper } from '@/components/layout/DashboardWrapper'
import { getSubscriptionStatus } from '@/lib/trial'
import { TrialBanner } from '@/components/layout/TrialBanner'

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

    // SUBSCRIPTION & TRIAL CHECK: Check if user has access (paid subscription OR active trial)
    // For team members, check if owner has access
    try {
      let hasAccess = false
      let subscriptionStatus = null

      if (userRole === 'owner') {
        // For owners: Check their own subscription/trial
        subscriptionStatus = await getSubscriptionStatus(user.id)
        hasAccess = subscriptionStatus.hasAccess
      } else if (userRole === 'member') {
        // For members: Check if their team owner has an active subscription/trial
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
            // Check owner's subscription/trial
            subscriptionStatus = await getSubscriptionStatus(owner.user_id)
            hasAccess = subscriptionStatus.hasAccess
          }
        }
      } else {
        // No role assigned - check if user has a subscription/trial
        subscriptionStatus = await getSubscriptionStatus(user.id)
        hasAccess = subscriptionStatus.hasAccess
      }

      // If no access (no active subscription or trial), redirect to finish-setup
      if (!hasAccess) {
        redirect('/finish-setup')
      }
    } catch (error) {
      console.error('[Dashboard Layout] Error checking subscription/trial:', error)
      // On error, redirect to finish-setup to be safe
      redirect('/finish-setup')
    }

    return (
      <DashboardWrapper>
        <div className="min-h-screen bg-gray-50">
          {/* Trial Banner (if user is in trial period) */}
          <TrialBanner userId={user.id} userRole={userRole} />

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
