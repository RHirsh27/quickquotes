'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { Check, Zap, Users, Building2, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getAllPlans, type PricingPlan as ConfigPricingPlan } from '@/config/pricing'

// Map plan IDs to icons
const planIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  SOLO: Zap,
  TEAM: Users,
  BUSINESS: Building2,
}

// Map plan IDs to descriptions
const planDescriptions: Record<string, string> = {
  SOLO: 'For the independent owner-operator.',
  TEAM: 'For growing crews (Up to 3 Users).',
  BUSINESS: 'For scaling companies (Unlimited).',
}

// Map plan IDs to CTA text
const planCTAs: Record<string, string> = {
  SOLO: 'Start Solo',
  TEAM: 'Upgrade to Team',
  BUSINESS: 'Go Unlimited',
}

// Convert config plans to UI format
function getPlansForUI(): Array<ConfigPricingPlan & {
  icon: React.ComponentType<{ className?: string }>
  description: string
  cta: string
  highlight?: boolean
}> {
  return getAllPlans().map((plan) => ({
    ...plan,
    icon: planIcons[plan.id] || Zap,
    description: planDescriptions[plan.id] || '',
    cta: planCTAs[plan.id] || 'Get Started',
    highlight: plan.label === 'Most Popular',
  }))
}

export default function PricingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
  }, [supabase])

  const handleSubscribe = async (plan: ConfigPricingPlan & {
    icon: React.ComponentType<{ className?: string }>
    description: string
    cta: string
    highlight?: boolean
  }) => {
    if (isAuthenticated === null) {
      // Still checking auth status
      return
    }

    if (!isAuthenticated) {
      // Redirect to signup
      router.push('/login')
      return
    }

    // Validate that Stripe Price ID is set
    if (!plan.stripePriceId) {
      toast.error('This plan is not yet available. Please contact support.')
      return
    }

    // User is authenticated - create checkout session
    setLoading(plan.id)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error)
      toast.error(error.message || 'Failed to start checkout. Please try again.')
      setLoading(null)
    }
  }

  if (isAuthenticated === null) {
    // Show loading state while checking auth
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900" style={{ fontWeight: 800 }}>Quotd</h1>
              <p className="text-xs text-gray-500 -mt-1">Instant Estimates</p>
            </div>
            {isAuthenticated ? (
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            ) : (
              <Button variant="outline" onClick={() => router.push('/login')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Invest in Your Business Efficiency
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Simple, powerful tools for tradespeople who value their time.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {getPlansForUI().map((plan) => {
            const Icon = plan.icon
            const isLoading = loading === plan.id

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                  plan.highlight
                    ? 'border-blue-600 scale-105 md:scale-110'
                    : 'border-gray-200'
                }`}
              >
                {/* Most Popular Badge */}
                {plan.highlight && plan.label && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      {plan.label}
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${
                      plan.highlight ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        plan.highlight ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {plan.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-gray-600">/{plan.interval}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isLoading || !plan.stripePriceId}
                    className={`w-full ${
                      plan.highlight
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : ''
                    }`}
                    variant={plan.highlight ? 'primary' : 'outline'}
                  >
                    {isLoading ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center max-w-2xl mx-auto">
          <p className="text-gray-600 mb-4">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
          <p className="text-sm text-gray-500">
            Questions? <a href="mailto:support@quotd.com" className="text-blue-600 hover:underline">Contact our team</a>
          </p>
        </div>
      </div>
    </div>
  )
}

