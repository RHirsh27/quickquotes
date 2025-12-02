'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HelpCircle, Zap, Mail } from 'lucide-react'
import { getPlanByStripePriceId } from '@/config/pricing'

interface SupportWidgetProps {
  variant?: 'button' | 'link'
  className?: string
}

export default function SupportWidget({ variant = 'link', className = '' }: SupportWidgetProps) {
  const supabase = createClient()
  const [planId, setPlanId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Fetch user profile for company name
      const { data: profile } = await supabase
        .from('users')
        .select('company_name')
        .eq('id', user.id)
        .single()

      if (profile?.company_name) {
        setCompanyName(profile.company_name)
      }

      // Fetch subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_id')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (subscription?.plan_id) {
        setPlanId(subscription.plan_id)
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase])

  if (loading) {
    return null // Don't show anything while loading
  }

  const plan = planId ? getPlanByStripePriceId(planId) : null
  const isPriority = plan && (plan.id === 'FLEET' || plan.id === 'ENTERPRISE')

  const handleSupportClick = () => {
    if (isPriority) {
      // Priority Support - mailto with pre-filled subject
      const subject = encodeURIComponent(`Priority Request: ${companyName || 'Support Request'}`)
      const mailtoLink = `mailto:vip-support@quotd.com?subject=${subject}`
      window.location.href = mailtoLink
    } else {
      // Regular Support
      const mailtoLink = 'mailto:support@quotd.com'
      window.location.href = mailtoLink
    }
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleSupportClick}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isPriority
            ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
        } ${className}`}
      >
        {isPriority ? (
          <>
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Priority Support</span>
          </>
        ) : (
          <>
            <HelpCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Help Center</span>
          </>
        )}
      </button>
    )
  }

  // Link variant (default)
  return (
    <button
      onClick={handleSupportClick}
      className={`inline-flex items-center gap-2 text-sm transition-colors ${
        isPriority
          ? 'text-yellow-600 hover:text-yellow-700'
          : 'text-gray-600 hover:text-gray-900'
      } ${className}`}
    >
      {isPriority ? (
        <>
          <Zap className="h-4 w-4" />
          <span>Priority Support</span>
        </>
      ) : (
        <>
          <HelpCircle className="h-4 w-4" />
          <span>Help Center</span>
        </>
      )}
    </button>
  )
}

