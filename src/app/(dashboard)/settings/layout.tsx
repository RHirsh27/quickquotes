'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Settings, Users, CreditCard, Building2, Receipt } from 'lucide-react'
import { Button } from '@/components/ui'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [userRole, setUserRole] = useState<'owner' | 'member' | null>(null)

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: teamId } = await supabase.rpc('get_user_primary_team')
      if (!teamId) return

      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single()

      if (teamMember) {
        setUserRole(teamMember.role as 'owner' | 'member')
      }
    }
    checkRole()
  }, [supabase])

  const isActive = (path: string) => pathname === path

  const settingsTabs = [
    { href: '/settings/general', label: 'General', icon: Building2, ownerOnly: true },
    { href: '/settings/team', label: 'Team', icon: Users, ownerOnly: true },
    { href: '/settings/billing', label: 'Billing', icon: Receipt, ownerOnly: true },
    { href: '/settings/payments', label: 'Payments', icon: CreditCard, ownerOnly: true },
  ].filter(tab => !tab.ownerOnly || userRole === 'owner')

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and team settings</p>
      </div>

      {/* Settings Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8" aria-label="Settings">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive(tab.href)
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Settings Content */}
      {children}
    </div>
  )
}

