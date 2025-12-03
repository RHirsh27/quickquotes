'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, LoadingSpinner } from '@/components/ui'
import { 
  Receipt, 
  Check, 
  ExternalLink, 
  Users, 
  Calendar, 
  AlertTriangle,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getSubscriptionInfo, createBillingPortalSession, createUpgradeSession, type SubscriptionInfo } from '@/app/actions/billing'
import { PRICING_PLANS, type PlanId, getAllPlans } from '@/config/pricing'

function BillingSettingsContent() {
  const [loading, setLoading] = useState(true)
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Check for success/canceled params from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      toast.success('Subscription updated successfully!')
      router.replace('/settings/billing')
      fetchSubscriptionInfo()
    } else if (canceled === 'true') {
      toast('Subscription update canceled', { icon: 'ℹ️' })
      router.replace('/settings/billing')
    }
  }, [searchParams, router])

  // Redirect members to profile (owners only)
  useEffect(() => {
    async function checkAccess() {
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

      if (teamMember && teamMember.role === 'member') {
        router.push('/profile')
        return
      }
    }
    checkAccess()
  }, [supabase, router])

  const fetchSubscriptionInfo = async () => {
    setLoading(true)
    try {
      const result = await getSubscriptionInfo()
      if (result.success && result.data) {
        setSubscriptionInfo(result.data)
      } else {
        toast.error(result.message || 'Failed to load subscription info')
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error)
      toast.error('Failed to load subscription information')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptionInfo()
  }, [])

  const handleManageBilling = async () => {
    setActionLoading('manage')
    try {
      const result = await createBillingPortalSession()
      if (result.success && result.url) {
        window.location.href = result.url
      } else {
        toast.error(result.message || 'Failed to open billing portal')
        setActionLoading(null)
      }
    } catch (error: any) {
      console.error('Error opening billing portal:', error)
      toast.error('Failed to open billing portal')
      setActionLoading(null)
    }
  }

  const handlePlanAction = async (planId: PlanId) => {
    const plan = PRICING_PLANS[planId]
    setActionLoading(planId)
    
    try {
      const result = await createUpgradeSession(plan.stripePriceId)
      if (result.success && result.url) {
        window.location.href = result.url
      } else {
        toast.error(result.message || 'Failed to start upgrade process')
        setActionLoading(null)
      }
    } catch (error: any) {
      console.error('Error creating upgrade session:', error)
      toast.error('Failed to start upgrade process')
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'trialing':
        return 'bg-blue-100 text-blue-700'
      case 'past_due':
        return 'bg-red-100 text-red-700'
      case 'canceled':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string | null, isTrial: boolean) => {
    if (isTrial || status === 'trialing') return 'Trialing'
    switch (status) {
      case 'active':
        return 'Active'
      case 'past_due':
        return 'Past Due'
      case 'canceled':
        return 'Canceled'
      case 'incomplete':
        return 'Incomplete'
      case 'unpaid':
        return 'Unpaid'
      case 'paused':
        return 'Paused'
      default:
        return 'No Plan'
    }
  }

  const getPlanOrderIndex = (planId: PlanId | null): number => {
    const order: PlanId[] = ['SOLO', 'CREW', 'TEAM']
    return planId ? order.indexOf(planId) : -1
  }

  const getPlanButtonAction = (planId: PlanId): { label: string; variant: 'primary' | 'outline'; icon: React.ReactNode } => {
    const currentIndex = getPlanOrderIndex(subscriptionInfo?.planId || null)
    const targetIndex = getPlanOrderIndex(planId)

    if (subscriptionInfo?.planId === planId) {
      return { label: 'Current Plan', variant: 'outline', icon: <Check className="h-4 w-4" /> }
    }
    
    if (targetIndex > currentIndex) {
      return { label: 'Upgrade', variant: 'primary', icon: <ArrowUpRight className="h-4 w-4" /> }
    }
    
    return { label: 'Downgrade', variant: 'outline', icon: <ArrowDownRight className="h-4 w-4" /> }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const plans = getAllPlans()

  return (
    <div className="max-w-4xl space-y-6">
      {/* Current Subscription Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Receipt className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Current Subscription</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Plan */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Plan</p>
                <p className="text-lg font-semibold text-gray-900">
                  {subscriptionInfo?.planName || 'No Plan'}
                  {subscriptionInfo?.planId && (
                    <span className="ml-2 text-gray-500 font-normal">
                      ${PRICING_PLANS[subscriptionInfo.planId]?.price}/mo
                    </span>
                  )}
                </p>
              </div>

              {/* Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(subscriptionInfo?.status || null)}`}>
                  {getStatusLabel(subscriptionInfo?.status || null, subscriptionInfo?.isTrial || false)}
                </span>
              </div>

              {/* Trial End / Period End */}
              {subscriptionInfo?.isTrial && subscriptionInfo?.trialEndsAt && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Trial Ends
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(subscriptionInfo.trialEndsAt)}
                  </p>
                </div>
              )}

              {!subscriptionInfo?.isTrial && subscriptionInfo?.currentPeriodEnd && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Next Billing Date
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(subscriptionInfo.currentPeriodEnd)}
                  </p>
                </div>
              )}

              {/* Team Members */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Team Members
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {subscriptionInfo?.teamMemberCount || 1} / {subscriptionInfo?.teamMemberLimit === 10 && subscriptionInfo?.planId === 'TEAM' 
                    ? '10+' 
                    : subscriptionInfo?.teamMemberLimit || 1}
                </p>
                {subscriptionInfo?.teamMemberCount && subscriptionInfo?.teamMemberLimit && 
                 subscriptionInfo.teamMemberCount >= subscriptionInfo.teamMemberLimit && 
                 subscriptionInfo.planId !== 'TEAM' && (
                  <p className="text-xs text-amber-600 mt-1">
                    At limit — upgrade to add more
                  </p>
                )}
              </div>
            </div>

            {/* Past Due Warning */}
            {subscriptionInfo?.status === 'past_due' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700">Payment Past Due</p>
                  <p className="text-sm text-red-600 mt-1">
                    Your subscription payment is overdue. Please update your payment method to avoid service interruption.
                  </p>
                </div>
              </div>
            )}

            {/* Trial Ending Soon Warning */}
            {subscriptionInfo?.isTrial && subscriptionInfo?.trialEndsAt && (
              (() => {
                const daysLeft = Math.ceil((new Date(subscriptionInfo.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                if (daysLeft <= 3 && daysLeft > 0) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                      <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-700">Trial Ending Soon</p>
                        <p className="text-sm text-amber-600 mt-1">
                          Your trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. Add a payment method to continue using Quotd.
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              })()
            )}

            {/* Manage Billing Button */}
            {subscriptionInfo?.stripeCustomerId && (
              <Button
                onClick={handleManageBilling}
                disabled={actionLoading === 'manage'}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {actionLoading === 'manage' ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Opening...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Billing
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Available Plans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = subscriptionInfo?.planId === plan.id
            const buttonAction = getPlanButtonAction(plan.id)
            
            return (
              <div 
                key={plan.id}
                className={`relative rounded-xl border-2 p-6 transition-all ${
                  isCurrentPlan 
                    ? 'border-blue-500 bg-blue-50/50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Best Value Label */}
                {plan.label && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {plan.label}
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Current
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500">/mo</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.footer && (
                  <p className="text-xs text-gray-500 text-center mb-4">{plan.footer}</p>
                )}

                <Button
                  onClick={() => handlePlanAction(plan.id)}
                  disabled={isCurrentPlan || actionLoading !== null}
                  variant={buttonAction.variant}
                  className="w-full"
                >
                  {actionLoading === plan.id ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {buttonAction.icon}
                      <span className="ml-2">{buttonAction.label}</span>
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Subscription Management</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Upgrades take effect immediately with prorated billing</li>
          <li>Downgrades take effect at the end of your current billing period</li>
          <li>Cancel anytime — your access continues until the end of the billing period</li>
          <li>All plans include a 14-day free trial for new subscriptions</li>
        </ul>
      </div>
    </div>
  )
}

export default function BillingSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <BillingSettingsContent />
    </Suspense>
  )
}
