'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button, Input } from '@/components/ui'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { SlotInfo } from 'react-big-calendar'
import { createAppointment } from '@/app/actions/appointments'
import { checkTravelTimeConflicts } from '@/app/actions/travelTime'
import type { Job, User } from '@/lib/types'
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react'

interface CreateAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  selectedSlot: SlotInfo
  preselectedJobId?: string
  onSuccess: () => void
}

export function CreateAppointmentModal({
  isOpen,
  onClose,
  selectedSlot,
  preselectedJobId,
  onSuccess
}: CreateAppointmentModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [techs, setTechs] = useState<Array<{ id: string; name: string }>>([])
  const [loadingData, setLoadingData] = useState(true)

  // Form state
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [selectedTechId, setSelectedTechId] = useState<string>('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [status, setStatus] = useState<'confirmed' | 'tentative'>('tentative')
  const [notes, setNotes] = useState('')
  const [travelTimeWarnings, setTravelTimeWarnings] = useState<Array<{
    type: 'conflict' | 'tight' | 'ok'
    message: string
  }>>([])
  const [checkingTravelTime, setCheckingTravelTime] = useState(false)

  // Initialize times from selected slot
  useEffect(() => {
    if (isOpen && selectedSlot) {
      const start = new Date(selectedSlot.start)
      const end = new Date(selectedSlot.end || start.getTime() + 60 * 60 * 1000) // Default 1 hour

      // Format for datetime-local input (YYYY-MM-DDTHH:mm)
      const formatDateTime = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }

      setStartTime(formatDateTime(start))
      setEndTime(formatDateTime(end))
    }
  }, [isOpen, selectedSlot])

  // Set preselected job if provided
  useEffect(() => {
    if (isOpen && preselectedJobId) {
      setSelectedJobId(preselectedJobId)
    }
  }, [isOpen, preselectedJobId])

  // Fetch jobs and techs
  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's team
      const { data: teamId } = await supabase.rpc('get_user_primary_team')
      if (!teamId) {
        toast.error('No team found')
        return
      }

      // Fetch unscheduled jobs (pending status, no appointments)
      // If preselectedJobId is provided, we'll include that job too
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          *,
          appointments!left(id)
        `)
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .is('appointments.id', null)
        .order('created_at', { ascending: false })

      // If preselectedJobId is provided and not in the list, fetch it separately
      if (preselectedJobId && !jobsData?.find(j => j.id === preselectedJobId)) {
        const { data: preselectedJob } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', preselectedJobId)
          .single()
        
        if (preselectedJob) {
          jobsData?.unshift(preselectedJob)
        }
      }

      if (jobsError) throw jobsError
      setJobs(jobsData || [])

      // Fetch team members (techs)
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select(`
          user_id,
          users!inner(id, full_name, company_name)
        `)
        .eq('team_id', teamId)

      if (membersError) throw membersError

      const techsList = (membersData || []).map((member: any) => ({
        id: member.user_id,
        name: member.users?.full_name || member.users?.company_name || 'Unknown'
      }))
      setTechs(techsList)
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load jobs and technicians')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedJobId) {
      toast.error('Please select a job')
      return
    }

    if (!selectedTechId) {
      toast.error('Please select a technician')
      return
    }

    if (!startTime || !endTime) {
      toast.error('Please set start and end times')
      return
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (end <= start) {
      toast.error('End time must be after start time')
      return
    }

    setLoading(true)
    try {
      const result = await createAppointment({
        jobId: selectedJobId,
        techId: selectedTechId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status,
        notes: notes.trim() || null
      })

      if (result.success) {
        toast.success('Appointment created successfully!')
        onSuccess()
      } else {
        toast.error(result.message || 'Failed to create appointment')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Error creating appointment:', error)
      toast.error('Failed to create appointment')
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Appointment"
      size="md"
    >
      {loadingData ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Job Selection */}
          <div>
            <label htmlFor="job" className="block text-sm font-medium text-gray-700 mb-2">
              Job <span className="text-red-500">*</span>
            </label>
            <select
              id="job"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a job...</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} {job.customer_id ? `(Customer: ${job.customer_id})` : ''}
                </option>
              ))}
            </select>
            {jobs.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">No unscheduled jobs available</p>
            )}
          </div>

          {/* Technician Selection */}
          <div>
            <label htmlFor="tech" className="block text-sm font-medium text-gray-700 mb-2">
              Technician <span className="text-red-500">*</span>
            </label>
            <select
              id="tech"
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a technician...</option>
              {techs.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                End Time <span className="text-red-500">*</span>
              </label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Travel Time Warnings */}
          {checkingTravelTime && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4 animate-spin" />
              <span>Checking travel time...</span>
            </div>
          )}
          {!checkingTravelTime && travelTimeWarnings.length > 0 && (
            <div className="space-y-2">
              {travelTimeWarnings.map((warning, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                    warning.type === 'conflict'
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : warning.type === 'tight'
                      ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                      : 'bg-green-50 border border-green-200 text-green-800'
                  }`}
                >
                  {warning.type === 'conflict' && (
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  )}
                  {warning.type === 'tight' && (
                    <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  )}
                  {warning.type === 'ok' && (
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="flex-1 font-medium">{warning.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'confirmed' | 'tentative')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="tentative">Tentative</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Creating..."
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Appointment
            </LoadingButton>
          </div>
        </form>
      )}
    </Modal>
  )
}

