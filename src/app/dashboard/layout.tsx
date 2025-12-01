import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/navbar'
import PaymentSuccessHandler from '@/components/PaymentSuccessHandler'

// Mark this route as dynamic since it uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check environment variables first
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('[Dashboard Layout] Missing Supabase environment variables')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'MISSING')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'MISSING')
    redirect('/login')
  }

  let supabase
  try {
    supabase = await createClient()
  } catch (error) {
    console.error('[Dashboard Layout] Error creating Supabase client:', error)
    console.error('[Dashboard Layout] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    redirect('/login')
  }
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[Dashboard Layout] Error fetching user:', authError)
      console.error('[Dashboard Layout] Auth error details:', {
        message: authError.message,
        status: authError.status,
      })
      redirect('/login')
    }
    
    if (!user) {
      console.warn('[Dashboard Layout] No user found, redirecting to login')
      redirect('/login')
    }

    return (
      <div className="min-h-screen">
        <Navbar />
        <PaymentSuccessHandler />
        <main>{children}</main>
      </div>
    )
  } catch (error) {
    console.error('[Dashboard Layout] Unexpected error:', error)
    console.error('[Dashboard Layout] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
    })
    redirect('/login')
  }
}

