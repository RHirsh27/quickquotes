'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui'
import { CreditCard, CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getTeamConnectAccount,
  createConnectAccount,
  createConnectOnboardingLink,
  getConnectAccountStatus,
  createConnectLoginLink,
} from '@/app/actions/stripe-connect'

function PaymentsSettingsContent() {
  const [loading, setLoading] = useState(true)
  const [connectLoading, setConnectLoading] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [accountStatus, setAccountStatus] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for success/refresh params from Stripe redirect
  useEffect(() => {
    const connectParam = searchParams.get('connect')

    if (connectParam === 'success') {
      toast.success('Stripe Connect setup completed!')
      loadAccountData()
      // Clean URL
      router.replace('/settings/payments')
    } else if (connectParam === 'refresh') {
      toast('Please complete your account setup', { icon: 'ℹ️' })
      loadAccountData()
      // Clean URL
      router.replace('/settings/payments')
    }
  }, [searchParams, router])

  const loadAccountData = async () => {
    setLoading(true)
    try {
      // Get team's Connect account
      const result = await getTeamConnectAccount()

      if (result.error) {
        console.error('Error loading account:', result.error)
        return
      }

      if (result.accountId) {
        setAccountId(result.accountId)

        // Fetch account status from Stripe
        const statusResult = await getConnectAccountStatus(result.accountId)
        if (!statusResult.error) {
          setAccountStatus(statusResult)
        }
      }
    } catch (error: any) {
      console.error('Error loading account data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccountData()
  }, [])

  const handleConnectStripe = async () => {
    setConnectLoading(true)
    try {
      // Create or get existing account
      const accountResult = await createConnectAccount()

      if (accountResult.error) {
        throw new Error(accountResult.error)
      }

      if (!accountResult.accountId) {
        throw new Error('No account ID returned')
      }

      // Create onboarding link
      const linkResult = await createConnectOnboardingLink(accountResult.accountId)

      if (linkResult.error) {
        throw new Error(linkResult.error)
      }

      if (!linkResult.url) {
        throw new Error('No onboarding URL returned')
      }

      // Redirect to Stripe onboarding
      window.location.href = linkResult.url
    } catch (error: any) {
      console.error('Error connecting Stripe:', error)
      toast.error(error.message || 'Failed to start Stripe setup')
      setConnectLoading(false)
    }
  }

  const handleManageAccount = async () => {
    if (!accountId) {
      toast.error('No Stripe Connect account found')
      return
    }

    setConnectLoading(true)
    try {
      const result = await createConnectLoginLink(accountId)

      if (result.error) {
        throw new Error(result.error)
      }

      if (!result.url) {
        throw new Error('No login URL returned')
      }

      // Redirect to Stripe Express dashboard
      window.location.href = result.url
    } catch (error: any) {
      console.error('Error opening Stripe dashboard:', error)
      toast.error(error.message || 'Failed to open Stripe dashboard')
      setConnectLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const isFullyOnboarded = accountStatus?.charges_enabled && accountStatus?.details_submitted
  const hasPartialSetup = accountId && !isFullyOnboarded

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
        <p className="text-gray-600 mt-1">
          Connect your Stripe account to accept payments from customers
        </p>
      </div>

      {/* Stripe Connect Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Stripe Connect
            </h2>

            {!accountId ? (
              // Not connected
              <>
                <p className="text-gray-600 mb-4">
                  Connect your Stripe account to start accepting payments from your customers.
                  Stripe handles all payment processing securely.
                </p>
                <Button
                  onClick={handleConnectStripe}
                  disabled={connectLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {connectLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Stripe Account'
                  )}
                </Button>
              </>
            ) : isFullyOnboarded ? (
              // Fully connected and verified
              <>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 font-medium">
                    Stripe Connected - Ready to Accept Payments
                  </span>
                </div>

                {accountStatus && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          Charges
                        </p>
                        <div className="flex items-center gap-1">
                          {accountStatus.charges_enabled ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">Enabled</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-700">Disabled</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          Payouts
                        </p>
                        <div className="flex items-center gap-1">
                          {accountStatus.payouts_enabled ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">Enabled</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-700">Pending</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {accountStatus.email && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Account Email</p>
                        <p className="text-sm font-medium text-gray-900">{accountStatus.email}</p>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleManageAccount}
                  disabled={connectLoading}
                  variant="outline"
                >
                  {connectLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Manage Stripe Account
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </>
            ) : (
              // Partially connected (needs to complete onboarding)
              <>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <span className="text-orange-700 font-medium">
                    Setup Incomplete
                  </span>
                </div>

                <p className="text-gray-600 mb-4">
                  Your Stripe account setup is not complete. Please finish the onboarding
                  process to start accepting payments.
                </p>

                <div className="flex gap-3">
                  <Button
                    onClick={handleConnectStripe}
                    disabled={connectLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {connectLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Complete Setup'
                    )}
                  </Button>

                  <Button
                    onClick={handleManageAccount}
                    disabled={connectLoading}
                    variant="outline"
                  >
                    Manage Account
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          About Stripe Connect
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Securely accept credit card payments from your customers</li>
          <li>• Payments are deposited directly to your bank account</li>
          <li>• Industry-standard security and fraud protection</li>
          <li>• View detailed transaction history in your Stripe dashboard</li>
        </ul>
      </div>
    </div>
  )
}

export default function PaymentsSettings() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <PaymentsSettingsContent />
    </Suspense>
  )
}
