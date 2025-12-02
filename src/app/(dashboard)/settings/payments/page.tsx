'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, LoadingSpinner } from '@/components/ui'
import { CreditCard, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import type { User } from '@/lib/types'

function PaymentsSettingsContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboarding, setOnboarding] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Redirect members to profile (owners only)
  useEffect(() => {
    async function checkAccess() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: teamId } = await supabase.rpc('get_user_primary_team')
      if (!teamId) return

      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', authUser.id)
        .single()

      if (teamMember && teamMember.role === 'member') {
        // Redirect members to profile
        router.push('/profile')
        return
      }
    }
    checkAccess()
  }, [supabase, router])

  // Check for success/refresh params from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success')
    const refresh = searchParams.get('refresh')

    if (success === 'true') {
      toast.success('Stripe Connect account setup completed!')
      // Refresh user data
      fetchUserProfile()
      // Clean URL
      router.replace('/settings/payments')
    } else if (refresh === 'true') {
      toast('Please complete your account setup', { icon: 'ℹ️' })
      // Clean URL
      router.replace('/settings/payments')
    }
  }, [searchParams, router])

  const fetchUserProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        toast.error('Failed to load profile')
        return
      }

      setUser(userData as User)
    } catch (error: any) {
      console.error('Error fetching user profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [supabase])

  const handleSetupPayouts = async () => {
    setOnboarding(true)
    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start onboarding')
      }

      // Redirect to Stripe onboarding
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No onboarding URL received')
      }
    } catch (error: any) {
      console.error('Error setting up payouts:', error)
      toast.error(error.message || 'Failed to start payout setup')
      setOnboarding(false)
    }
  }

  const handleManageAccount = async () => {
    if (!user?.stripe_connect_id) {
      toast.error('No Stripe Connect account found')
      return
    }

    setOnboarding(true)
    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open account management')
      }

      // Redirect to Stripe account management
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No account URL received')
      }
    } catch (error: any) {
      console.error('Error opening account management:', error)
      toast.error(error.message || 'Failed to open account management')
      setOnboarding(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const hasStripeConnect = !!user?.stripe_connect_id
  const payoutsEnabled = user?.payouts_enabled || false

  return (
    <div className="max-w-2xl">

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Payout Settings</h2>

              {hasStripeConnect ? (
                <div className="space-y-4">
                  {payoutsEnabled ? (
                    <>
                      <p className="text-gray-600 mb-2">
                        Payouts are active.
                      </p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Connected
                      </span>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-2">
                        Account connected, but payouts not yet enabled. Complete your onboarding to enable payouts.
                      </p>
                    </>
                  )}
                  <Button
                    onClick={handleManageAccount}
                    disabled={onboarding}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    {onboarding ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Opening...
                      </>
                    ) : (
                      <>
                        View Payout Dashboard
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Connect a bank account to receive payments from invoices.
                  </p>
                  <Button
                    onClick={handleSetupPayouts}
                    disabled={onboarding}
                    className="w-full sm:w-auto"
                  >
                    {onboarding ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Starting...
                      </>
                    ) : (
                      <>
                        Setup Payouts
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Connect your Stripe account to receive payments</li>
            <li>Complete the onboarding process (takes about 5 minutes)</li>
            <li>Start accepting payments and receiving payouts</li>
            <li>Manage your account settings anytime</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function PaymentsSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      }
    >
      <PaymentsSettingsContent />
    </Suspense>
  )
}

