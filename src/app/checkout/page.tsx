'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { Check, Shield, CreditCard, Clock, Sparkles } from 'lucide-react'
import { PRICING_PLANS, type PricingPlan } from '@/config/pricing'

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  // Get pre-selected plan from URL params (optional)
  const preselectedPlanId = searchParams.get('plan')

  // Verify authentication on mount
  useEffect(() => {
    async function checkAuth() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        console.error('[Checkout] Auth check failed:', error?.message || 'No user')
        router.push('/login')
        return
      }
      setIsAuthenticated(true)
      setUserEmail(user.email || '')
      console.log('[Checkout] User authenticated:', user.id)
    }
    checkAuth()
  }, [supabase, router])

  const handleCheckout = async (plan: PricingPlan) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      alert('Please wait while we verify your session...')
      return
    }

    // Validation: Check if priceId is empty or missing
    if (!plan.stripePriceId || plan.stripePriceId.trim() === '') {
      alert('Configuration Error: This plan is not yet available. Please contact support.')
      return
    }

    // Set loading state
    setLoadingPriceId(plan.stripePriceId)

    try {
      // Verify session before making request
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      if (userError || !currentUser) {
        console.error('[Checkout] User check failed:', userError?.message)
        alert('Your session has expired. Please sign in again.')
        router.push('/login')
        setLoadingPriceId(null)
        return
      }

      // Get the session to ensure it's valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('[Checkout] Session check failed:', sessionError?.message)

        // Wait a moment for cookies to be set, then try again
        await new Promise(resolve => setTimeout(resolve, 500))

        const { data: { session: retrySession } } = await supabase.auth.getSession()
        if (!retrySession) {
          alert('Please wait a moment and try again. Your session is being established...')
          setLoadingPriceId(null)
          return
        }
      }

      console.log('[Checkout] Creating checkout session for plan:', plan.name)

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ priceId: plan.stripePriceId }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          // Success: Redirect to Stripe Checkout
          console.log('[Checkout] Redirecting to Stripe Checkout')
          window.location.href = data.url
        } else {
          alert('Checkout failed. Please contact support.')
          setLoadingPriceId(null)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Checkout failed. Please contact support.'
        alert(errorMessage)
        setLoadingPriceId(null)
      }
    } catch (error: any) {
      console.error('[Checkout] Checkout error:', error)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Verifying your session...</p>
        </div>
      </div>
    )
  }

  const plans = Object.values(PRICING_PLANS)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">Quotd</h1>
                <p className="text-xs text-gray-500">Professional Quoting Platform</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleSignOut} className="text-gray-600">
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Welcome Section */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-6">
            <Check className="h-5 w-5" />
            <span className="font-semibold">Account Created Successfully!</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-2">
            Start your <span className="font-semibold text-blue-600">14-day free trial</span> now.
          </p>
          <p className="text-sm text-gray-500">
            {userEmail && `Signed in as ${userEmail}`}
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-12 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            <span>No Credit Card Charged Today</span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-12">
          {plans.map((plan) => {
            const isLoading = loadingPriceId === plan.stripePriceId
            const isDisabled = loadingPriceId !== null
            const isPreselected = preselectedPlanId === plan.id
            const isPopular = plan.label === 'Best Value'

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl border-2 p-8 transition-all hover:shadow-2xl ${
                  isPopular || isPreselected
                    ? 'border-blue-500 ring-2 ring-blue-200 scale-105'
                    : 'border-gray-200'
                }`}
              >
                {/* Popular Badge */}
                {(isPopular || isPreselected) && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      {plan.label || 'Recommended'}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1 mb-3">
                    <span className="text-5xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 text-lg">/month</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {plan.description}
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-gray-700 text-sm leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Subscribe Button */}
                <Button
                  onClick={() => handleCheckout(plan)}
                  disabled={isDisabled || !plan.stripePriceId}
                  className={`w-full py-6 text-base font-semibold ${
                    isPopular || isPreselected
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      Start Free Trial
                      <Check className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                {/* Trial Info */}
                <p className="text-center text-xs text-gray-500 mt-4">
                  Free for 14 days, then ${plan.price}/mo
                </p>
              </div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            What happens next?
          </h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <p>
                <span className="font-semibold text-gray-900">Start your 14-day trial:</span> Get instant access to all features with no credit card charge today.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <p>
                <span className="font-semibold text-gray-900">Add your payment method:</span> We'll securely store your payment info, but won't charge until after your trial ends.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <p>
                <span className="font-semibold text-gray-900">Cancel anytime:</span> No questions asked. If you cancel before day 14, you won't be charged.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Questions?{' '}
            <a
              href="mailto:support@quotd.com"
              className="text-blue-600 hover:underline font-medium"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  )
}
