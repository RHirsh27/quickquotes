'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import SupportWidget from '@/components/SupportWidget'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold" style={{ fontWeight: 800 }}>Quotd</h2>
            <p className="text-xs text-gray-500 -mt-1">Instant Estimates</p>
          </div>
          <div className="flex items-center gap-3">
            <SupportWidget />
            <Button variant="outline" onClick={handleSignOut}>
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
