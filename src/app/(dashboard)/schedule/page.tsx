'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CalendarView } from '@/components/schedule/CalendarView'
import { UnscheduledJobsList } from '@/components/schedule/UnscheduledJobsList'
import { LoadingSpinner } from '@/components/ui'
import { Briefcase, Calendar } from 'lucide-react'
import type { Appointment, Job } from '@/lib/types'

export default function SchedulePage() {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<Array<Appointment & {
    jobs: Job | null
    assigned_tech_user: {
      id: string
      full_name: string | null
      company_name: string | null
    } | null
  }>>([])
  const [unscheduledJobs, setUnscheduledJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's team
      const { data: primaryTeamId } = await supabase.rpc('get_user_primary_team')
      if (!primaryTeamId) {
        console.error('No team found')
        setLoading(false)
        return
      }

      setTeamId(primaryTeamId)

      // Fetch appointments with related data
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          jobs (*),
          assigned_tech_user:users!appointments_assigned_tech_fkey(id, full_name, company_name)
        `)
        .order('start_time', { ascending: true })

      if (appointmentsError) throw appointmentsError
      setAppointments(appointmentsData || [])

      // Fetch unscheduled jobs (pending status, no appointments)
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          *,
          appointments!left(id)
        `)
        .eq('team_id', primaryTeamId)
        .eq('status', 'pending')
        .is('appointments.id', null)
        .order('created_at', { ascending: false })

      if (jobsError) throw jobsError
      setUnscheduledJobs(jobsData || [])
    } catch (error: any) {
      console.error('Error fetching schedule data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dispatch Calendar</h1>
            <p className="text-sm text-gray-500">Schedule and manage appointments</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Unscheduled Jobs */}
          <div className="lg:col-span-1">
            <UnscheduledJobsList
              jobs={unscheduledJobs}
              onJobScheduled={fetchData}
            />
          </div>

          {/* Main Calendar View */}
          <div className="lg:col-span-3">
            <CalendarView
              appointments={appointments}
              onEventClick={(appointment) => {
                // Navigate to job details or show appointment details
                console.log('Appointment clicked:', appointment)
              }}
              onRefresh={fetchData}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

