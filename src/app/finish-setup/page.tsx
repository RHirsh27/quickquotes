'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { Check } from 'lucide-react'
import { PRICING_PLANS } from '@/config/pricing'

export default function FinishSetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null)

  const handleCheckout = async (priceId: string) => {
    // Set loading state
    setLoadingPriceId(priceId)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        // Response not OK
        const errorData = await response.json().catch(() => ({}))
        alert('Checkout failed. Please contact support.')
        setLoadingPriceId(null)
      }
    } catch (error) {
      // Network error or other exception
      console.error('[Finish Setup] Checkout error:', error)
      alert('Checkout failed. Please contact support.')
      setLoadingPriceId(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Log Out button */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-gray-900" style={{ fontWeight: 800 }}>
              Quotd
            </h1>
            <Button variant="ghost" onClick={handleSignOut}>
              Log Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-6xl w-full">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Select Your Plan
            </h1>
            <p className="text-lg text-gray-600">
              You're one step away from your dashboard.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.values(PRICING_PLANS).map((plan) => {
              // Skip plans without stripePriceId
              if (!plan.stripePriceId) {
                return null
              }

              const isLoading = loadingPriceId === plan.stripePriceId
              const isDisabled = loadingPriceId !== null

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                    plan.label === 'Best Value'
                      ? 'border-blue-600 scale-105'
                      : 'border-gray-200'
                  }`}
                >
                  {/* Badge */}
                  {plan.label && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span
                        className={`px-4 py-1 rounded-full text-sm font-semibold ${
                          plan.label === 'Best Value'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {plan.label}
                      </span>
                    </div>
                  )}

                  <div className="p-8">
                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                          ${plan.price}
                        </span>
                        <span className="text-gray-600">/{plan.interval}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 mb-6">{plan.description}</p>

                    {/* Feature List */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Footer (for Team plan overage) */}
                    {plan.footer && (
                      <p className="text-xs text-gray-500 mb-4 text-center">
                        {plan.footer}
                      </p>
                    )}

                    {/* Subscribe Button */}
                    <Button
                      onClick={() => handleCheckout(plan.stripePriceId)}
                      disabled={isDisabled}
                      className={`w-full ${
                        plan.label === 'Best Value'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : ''
                      }`}
                      variant={plan.label === 'Best Value' ? 'primary' : 'outline'}
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
    </div>
  )
}
