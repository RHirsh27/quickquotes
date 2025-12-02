import Link from 'next/link'
import { CheckCircle2, Circle, Settings, CreditCard, Users, FileText, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

interface OnboardingStep {
  id: string
  label: string
  href: string
  completed: boolean
  icon: React.ComponentType<{ className?: string }>
}

interface OnboardingChecklistProps {
  userId: string
  teamId: string | null
  userRole: 'owner' | 'member' | null
}

export async function OnboardingChecklist({ userId, teamId, userRole }: OnboardingChecklistProps) {
  // Only show for owners (members don't need to complete setup)
  if (userRole !== 'owner') {
    return null
  }

  const supabase = await createClient()

  // Initialize steps
  const steps: OnboardingStep[] = [
    {
      id: 'company',
      label: 'Set Company Name/Logo',
      href: '/settings/general',
      completed: false,
      icon: Settings,
    },
    {
      id: 'payouts',
      label: 'Connect Payouts',
      href: '/settings/payments',
      completed: false,
      icon: CreditCard,
    },
    {
      id: 'customer',
      label: 'Create First Customer',
      href: '/customers',
      completed: false,
      icon: Users,
    },
    {
      id: 'quote',
      label: 'Send First Quote',
      href: '/quotes/new',
      completed: false,
      icon: FileText,
    },
  ]

  try {
    // Step 1: Check if company name/email is set (General Settings)
    if (teamId) {
      const { data: teamData } = await supabase
        .from('teams')
        .select('name, company_email, company_phone')
        .eq('id', teamId)
        .single()

      if (teamData && (teamData.name || teamData.company_email || teamData.company_phone)) {
        steps[0].completed = true
      }
    }

    // Step 2: Check if Stripe Connect is set up
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_connect_id, payouts_enabled')
      .eq('id', userId)
      .single()

    if (userData && userData.stripe_connect_id && userData.payouts_enabled) {
      steps[1].completed = true
    }

    // Step 3: Check if at least one customer exists
    if (teamId) {
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)

      if (count && count > 0) {
        steps[2].completed = true
      }
    } else {
      // Fallback: check by user_id
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (count && count > 0) {
        steps[2].completed = true
      }
    }

    // Step 4: Check if at least one quote has been sent
    if (teamId) {
      const { count } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('status', 'sent')

      if (count && count > 0) {
        steps[3].completed = true
      }
    } else {
      // Fallback: check by user_id
      const { count } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'sent')

      if (count && count > 0) {
        steps[3].completed = true
      }
    }
  } catch (error) {
    console.error('[OnboardingChecklist] Error checking completion status:', error)
    // Continue with default (all incomplete) if there's an error
  }

  // Calculate progress
  const completedCount = steps.filter(step => step.completed).length
  const progressPercentage = (completedCount / steps.length) * 100

  // Hide checklist if 100% complete
  if (progressPercentage === 100) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6 mb-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Get Set Up</h2>
          <p className="text-sm text-gray-600">
            Complete these steps to get the most out of Quotd
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{Math.round(progressPercentage)}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <ul className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <li key={step.id}>
              <Link
                href={step.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  step.completed
                    ? 'bg-white/50 hover:bg-white/70'
                    : 'bg-white hover:bg-blue-50'
                }`}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 ${
                  step.completed ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1">
                  <span
                    className={`text-sm font-medium ${
                      step.completed
                        ? 'text-gray-500 line-through'
                        : 'text-gray-900'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Arrow */}
                {!step.completed && (
                  <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

