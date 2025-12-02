import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button, LoadingSpinner } from '@/components/ui'
import { Lock, BarChart3, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { getUserSubscription } from '@/lib/subscriptions'
import { getPlanByStripePriceId, PRICING_PLANS } from '@/config/pricing'

// Mark this route as dynamic since it uses cookies for authentication
export const dynamic = 'force-dynamic'

interface UserReport {
  technicianName: string
  quotesCreated: number
  totalValue: number
}

export default async function ReportsPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/login')
  }

  // Get user's subscription
  const subscription = await getUserSubscription(user.id)
  const planId = subscription?.plan_id || null
  
  // Check if user has FLEET or ENTERPRISE plan
  const plan = planId ? getPlanByStripePriceId(planId) : null
  const hasAccess = plan && (plan.id === 'FLEET' || plan.id === 'ENTERPRISE')

  // If no access, show locked state
  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
            <p className="text-gray-600">Advanced analytics and insights</p>
          </div>

          {/* Locked State */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Blurred Chart Placeholder */}
            <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 p-12">
              <div className="absolute inset-0 backdrop-blur-sm bg-white/30"></div>
              <div className="relative flex flex-col items-center justify-center min-h-[300px]">
                {/* Mock Chart Bars */}
                <div className="flex items-end gap-4 mb-8 opacity-30">
                  <div className="w-12 h-24 bg-blue-500 rounded-t"></div>
                  <div className="w-12 h-32 bg-blue-500 rounded-t"></div>
                  <div className="w-12 h-20 bg-blue-500 rounded-t"></div>
                  <div className="w-12 h-28 bg-blue-500 rounded-t"></div>
                  <div className="w-12 h-16 bg-blue-500 rounded-t"></div>
                </div>
                {/* Lock Icon */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-white rounded-full p-4 shadow-lg">
                    <Lock className="h-8 w-8 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Lock Message */}
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Advanced Reporting</h2>
              <p className="text-gray-600 mb-6">
                Advanced Reporting is available on the Fleet Plan and above.
              </p>
              <Link href="/pricing">
                <Button className="inline-flex items-center gap-2">
                  Upgrade Now
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature Preview */}
          <div className="mt-8 bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What you'll get:</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Technician performance reports</span>
              </li>
              <li className="flex items-start gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Quote volume analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Revenue tracking by team member</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // User has access - fetch and display reports
  // Get user's primary team
  const { data: teamId, error: teamError } = await supabase.rpc('get_user_primary_team')
  if (teamError || !teamId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">No team found. Please contact support.</p>
        </div>
      </div>
    )
  }

  // Fetch all quotes for the team with user information
  const { data: quotesData, error: quotesError } = await supabase
    .from('quotes')
    .select(`
      id,
      total,
      status,
      user_id,
      users:user_id (
        id,
        full_name,
        company_name
      )
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (quotesError) {
    console.error('[Reports] Error fetching quotes:', quotesError)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">Error loading reports. Please try again later.</p>
        </div>
      </div>
    )
  }

  // Aggregate data by user
  const userReportsMap = new Map<string, UserReport>()

  if (quotesData) {
    quotesData.forEach((quote: any) => {
      const user = quote.users
      const technicianName = user?.full_name || user?.company_name || 'Unknown'
      const total = Number(quote.total) || 0

      if (userReportsMap.has(technicianName)) {
        const existing = userReportsMap.get(technicianName)!
        existing.quotesCreated += 1
        existing.totalValue += total
      } else {
        userReportsMap.set(technicianName, {
          technicianName,
          quotesCreated: 1,
          totalValue: total,
        })
      }
    })
  }

  // Convert map to array and sort by total value (descending)
  const reports: UserReport[] = Array.from(userReportsMap.values()).sort(
    (a, b) => b.totalValue - a.totalValue
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">Team performance analytics</p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No quotes found. Create some quotes to see reports.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Technician Performance</h2>
            <p className="text-sm text-gray-600 mt-1">Quote volume and total value by team member</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Technician Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotes Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {report.technicianName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.quotesCreated}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-green-600">
                        ${report.totalValue.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {reports.reduce((sum, r) => sum + r.quotesCreated, 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                    ${reports.reduce((sum, r) => sum + r.totalValue, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

