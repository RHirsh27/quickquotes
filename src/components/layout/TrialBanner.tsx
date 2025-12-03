import { getSubscriptionStatus } from '@/lib/trial'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { Clock, Sparkles, ArrowRight } from 'lucide-react'

interface TrialBannerProps {
  userId: string
  userRole: 'owner' | 'member' | null
}

export async function TrialBanner({ userId, userRole }: TrialBannerProps) {
  // Only show banner for owners (members see owner's trial status)
  if (userRole !== 'owner') {
    return null
  }

  const subscriptionStatus = await getSubscriptionStatus(userId)

  // Don't show banner if user has paid subscription or no trial
  if (!subscriptionStatus.isTrial || subscriptionStatus.isPaid) {
    return null
  }

  const daysRemaining = subscriptionStatus.trialDaysRemaining

  // Determine banner style based on days remaining
  const isUrgent = daysRemaining <= 3
  const bannerColor = isUrgent ? 'bg-orange-600' : 'bg-blue-600'
  const iconColor = isUrgent ? 'text-orange-200' : 'text-blue-200'

  return (
    <div className={`${bannerColor} text-white py-3 px-4 sticky top-0 z-50 shadow-md`}>
      <div className="container mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {isUrgent ? (
            <Clock className={`h-5 w-5 ${iconColor} animate-pulse`} />
          ) : (
            <Sparkles className={`h-5 w-5 ${iconColor}`} />
          )}
          <div>
            <p className="text-sm font-semibold">
              {daysRemaining > 0 ? (
                <>
                  <span className="font-bold">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span> left in your trial
                </>
              ) : (
                <>Trial ends today!</>
              )}
            </p>
            <p className="text-xs opacity-90">
              {isUrgent ? 'Upgrade now to keep your data and continue using Quotd' : 'Upgrade anytime to unlock full features'}
            </p>
          </div>
        </div>

        <Link href="/finish-setup">
          <Button
            variant="outline"
            className="bg-white text-gray-900 hover:bg-gray-100 border-none text-sm h-9"
          >
            Upgrade Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
