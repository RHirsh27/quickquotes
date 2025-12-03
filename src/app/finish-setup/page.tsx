'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { Check } from 'lucide-react'
import { PRICING_PLANS } from '@/config/pricing'

export default function FinishSetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // Verify authentication on mount
  useEffect(() => {
    async function checkAuth() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        console.error('[Finish Setup] Auth check failed:', error?.message || 'No user')
        router.push('/login')
        return
      }
      setIsAuthenticated(true)
      console.log('[Finish Setup] User authenticated:', user.id)
    }
    checkAuth()
  }, [supabase, router])

  // Debugging helper: Log plans to ensure config is loaded
  useEffect(() => {
    console.log('Plans Loaded:', PRICING_PLANS)
  }, [])

  const handleCheckout = async (priceId: string) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      alert('Please wait while we verify your session...')
      return
    }

    // Validation: Check if priceId is empty or missing
    if (!priceId || priceId.trim() === '') {
      alert('Configuration Error: Missing Stripe Price ID. Please contact support.')
      return
    }

    // Set loading state
    setLoadingPriceId(priceId)

    try {
      // Verify and refresh session before making request
      // First, try to get the user (this refreshes the session)
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      if (userError || !currentUser) {
        console.error('[Finish Setup] User check failed:', userError?.message)
        alert('Your session has expired. Please sign in again.')
        router.push('/login')
        setLoadingPriceId(null)
        return
      }
      
      // Then get the session to ensure it's valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('[Finish Setup] Session check failed:', sessionError?.message)
        console.log('[Finish Setup] Attempting to refresh session...')
        
        // Wait a moment for cookies to be set, then try again
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const { data: { session: retrySession } } = await supabase.auth.getSession()
        if (!retrySession) {
          alert('Please wait a moment and try again. Your session is being established...')
          setLoadingPriceId(null)
          return
        }
      }
      
      console.log('[Finish Setup] Session verified, proceeding with checkout:', {
        userId: currentUser.id,
        hasSession: !!session,
        accessToken: session?.access_token ? 'present' : 'missing'
      })

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ priceId }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          // Success: Redirect to Stripe Checkout
          window.location.href = data.url
        } else {
          // No URL returned
          alert('Checkout failed. Please contact support.')
          setLoadingPriceId(null)
        }
      } else {
        // Response not OK - get error message
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Checkout failed. Please contact support.'
        alert(errorMessage)
        setLoadingPriceId(null)
      }
    } catch (error: any) {
      // Network error or other exception
      console.error('[Finish Setup] Checkout error:', error)
      alert(error.message || 'Checkout failed. Please contact support.')
      setLoadingPriceId(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Verifying your session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Sign Out button */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-gray-900" style={{ fontWeight: 800 }}>
              Quotd
            </h1>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Select Your Plan
          </h1>
          <p className="text-lg text-gray-600">
            Start your 14-day free trial. Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards Grid - Responsive (1 col mobile, 3 cols desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.values(PRICING_PLANS).map((plan) => {
            const isLoading = loadingPriceId === plan.stripePriceId
            const isDisabled = loadingPriceId !== null

            return (
              <div
                key={plan.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow"
              >
                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600">/mo</span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Subscribe Button */}
                <Button
                  onClick={() => handleCheckout(plan.stripePriceId)}
                  disabled={isDisabled}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Questions?{' '}
            <a
              href="mailto:support@quotd.com"
              className="text-blue-600 hover:underline"
            >
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
