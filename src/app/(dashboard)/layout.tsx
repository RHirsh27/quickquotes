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
    return (
      <DashboardWrapper>
        <div className="min-h-screen bg-gray-50">
          {/* Desktop Header (Hidden on mobile) */}
          <div className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b sticky top-0 z-10">
            <h1 className="text-xl font-bold text-gray-800">QuickQuotes</h1>
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
          <BottomNav />
        </div>
      </DashboardWrapper>
    )
  } catch (error) {
    console.error('Error in dashboard layout:', error)
    redirect('/login')
  }
}
