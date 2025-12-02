'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { Check, Zap, Users, Building2, ArrowRight, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getAllPlans, type PricingPlan as ConfigPricingPlan } from '@/config/pricing'
import Link from 'next/link'

// Map plan IDs to icons
const planIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  SOLO: Zap,
  CREW: Users,
  TEAM: Building2,
}

// Convert config plans to UI format
function getPlansForUI(): Array<ConfigPricingPlan & {
  icon: React.ComponentType<{ className?: string }>
  highlight?: boolean
}> {
  const plans = getAllPlans()
  console.log('[Finish Setup] Plans loaded:', plans) // Debug log
  return plans.map((plan) => ({
    ...plan,
    icon: planIcons[plan.id] || Zap,
    highlight: plan.label === 'Best Value', // Highlight CREW as "Best Value"
  }))
}

export default function FinishSetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [plans, setPlans] = useState<Array<ConfigPricingPlan & {
    icon: React.ComponentType<{ className?: string }>
    highlight?: boolean
  }>>([])

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      
      if (!user) {
        router.push('/login')
        return
      }
    }
    checkAuth()
  }, [supabase, router])

  useEffect(() => {
    // Load plans on mount
    const loadedPlans = getPlansForUI()
    setPlans(loadedPlans)
    console.log('[Finish Setup] Plans state set:', loadedPlans) // Debug log
  }, [])

  const handleCheckout = async (priceId: string, planId: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to continue')
      router.push('/login')
      return
    }

    if (!priceId) {
      toast.error('This plan is not yet available. Please contact support.')
      return
    }

    setLoading(planId)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
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
      console.error('[Finish Setup] Error creating checkout session:', error)
      toast.error(error.message || 'Failed to start checkout. Please try again.')
      setLoading(null)
    }
  }

  if (isAuthenticated === null) {
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-extrabold text-gray-900" style={{ fontWeight: 800 }}>Quotd</h1>
            </Link>
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-6xl w-full">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Activate Your Account
            </h1>
            <p className="text-lg text-gray-600">
              Choose a plan to access your dashboard. You can change this later.
            </p>
          </div>

          {/* Pricing Cards */}
          {plans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Loading plans...</p>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => {
                const Icon = plan.icon
                const isLoading = loading === plan.id

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                      plan.highlight
                        ? 'border-blue-600 scale-105'
                        : 'border-gray-200'
                    }`}
                  >
                    {/* Badge */}
                    {plan.label && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
                          plan.highlight
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
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

                      {/* Footer (for Team plan overage) */}
                      {plan.footer && (
                        <p className="text-xs text-gray-500 mb-4 text-center">
                          {plan.footer}
                        </p>
                      )}

                      {/* CTA Button */}
                      <Button
                        onClick={() => handleCheckout(plan.stripePriceId, plan.id)}
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
                            Subscribe
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              Questions? <a href="mailto:support@quotd.com" className="text-blue-600 hover:underline">Contact our team</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

