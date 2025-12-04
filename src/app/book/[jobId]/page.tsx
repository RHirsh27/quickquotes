'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAvailableSlots, reserveSlot, confirmAppointment } from '@/app/actions/scheduling'
import { Calendar, Clock, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

type BookingStep = 'date' | 'time' | 'confirm' | 'success'

interface JobData {
  id: string
  title: string
  description: string | null
  team_id: string
  teams: {
    name: string
    company_phone: string | null
  } | null
}

export default function BookingPage() {
  const { jobId } = useParams()
  const supabase = createClient()
  
  const [step, setStep] = useState<BookingStep>('date')
  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState<JobData | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<Array<{ startTime: string; endTime: string }>>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null)
  const [reserving, setReserving] = useState(false)
  const [appointmentId, setAppointmentId] = useState<string | null>(null)

  // Fetch job and team data
  useEffect(() => {
    async function fetchJobData() {
      if (!jobId || typeof jobId !== 'string') return

      try {
        const { data, error } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            description,
            team_id,
            teams (
              name,
              company_phone
            )
          `)
          .eq('id', jobId)
          .single()

        if (error) throw error
        if (!data) {
          toast.error('Job not found')
          return
        }

        setJob(data as JobData)
      } catch (error: any) {
        console.error('Error fetching job:', error)
        toast.error('Failed to load booking information')
      } finally {
        setLoading(false)
      }
    }

    fetchJobData()
  }, [jobId, supabase])

  // Fetch available slots when date is selected
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDate || !job) return

      setLoadingSlots(true)
      try {
        const date = new Date(selectedDate)
        // Default duration: 1 hour (60 minutes)
        const durationMinutes = 60

        const result = await getAvailableSlots(date, durationMinutes, job.team_id)

        if (result.success && result.slots) {
          setAvailableSlots(result.slots)
          setStep('time')
        } else {
          toast.error(result.message || 'Failed to load available times')
        }
      } catch (error: any) {
        console.error('Error fetching slots:', error)
        toast.error('Failed to load available times')
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchSlots()
  }, [selectedDate, job])

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
  }

  const handleTimeSelect = (slot: { startTime: string; endTime: string }) => {
    setSelectedSlot(slot)
    setStep('confirm')
  }

  const handleConfirm = async () => {
    if (!selectedSlot || !jobId || typeof jobId !== 'string') return

    setReserving(true)
    try {
      // First, reserve the slot (creates tentative appointment)
      const reserveResult = await reserveSlot(
        jobId,
        selectedSlot.startTime,
        selectedSlot.endTime
      )

      if (!reserveResult.success || !reserveResult.appointmentId) {
        toast.error(reserveResult.message || 'Failed to reserve time slot')
        setReserving(false)
        return
      }

      setAppointmentId(reserveResult.appointmentId)

      // Immediately confirm the appointment
      const confirmResult = await confirmAppointment(reserveResult.appointmentId)

      if (confirmResult.success) {
        setStep('success')
        toast.success('Appointment booked successfully!')
      } else {
        toast.error(confirmResult.message || 'Failed to confirm appointment')
        setReserving(false)
      }
    } catch (error: any) {
      console.error('Error booking appointment:', error)
      toast.error('Failed to book appointment')
      setReserving(false)
    }
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]
  // Get maximum date (90 days from now)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 90)
  const maxDateString = maxDate.toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading booking information...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
          <p className="text-gray-600">The booking link you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {job.teams?.name || 'Service Company'}
            </h1>
            <p className="text-lg text-gray-600">{job.title}</p>
            {job.teams?.company_phone && (
              <p className="text-sm text-gray-500 mt-2">
                📞 {job.teams.company_phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 1: Date Selection */}
        {step === 'date' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Select a Date</h2>
                <p className="text-sm text-gray-500">Choose when you'd like to schedule</p>
              </div>
            </div>

            <div className="space-y-4">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Appointment Date
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => handleDateSelect(e.target.value)}
                min={today}
                max={maxDateString}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
              <p className="text-xs text-gray-500">
                Available dates: Today through {new Date(maxDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Time Selection */}
        {step === 'time' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Select a Time</h2>
                  <p className="text-sm text-gray-500">
                    {selectedDate && formatDate(selectedDate)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStep('date')
                  setSelectedDate('')
                  setAvailableSlots([])
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Change Date
              </button>
            </div>

            {loadingSlots ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading available times...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">No available times</p>
                <p className="text-sm text-gray-500 mb-4">
                  This date is fully booked. Please select another date.
                </p>
                <button
                  onClick={() => {
                    setStep('date')
                    setSelectedDate('')
                    setAvailableSlots([])
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  ← Select Different Date
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => handleTimeSelect(slot)}
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center font-medium text-gray-900 hover:text-blue-700"
                    >
                      {formatTime(slot.startTime)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && selectedSlot && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Confirm Appointment</h2>
                <p className="text-sm text-gray-500">Review your booking details</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Service</p>
                  <p className="font-semibold text-gray-900">{job.title}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="font-semibold text-gray-900">
                  {selectedDate && formatDate(selectedDate)}
                </p>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500 mb-1">Time</p>
                <p className="font-semibold text-gray-900">
                  {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                </p>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500 mb-1">Duration</p>
                <p className="font-semibold text-gray-900">1 hour</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setStep('time')
                  setSelectedSlot(null)
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={reserving}
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={reserving}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {reserving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 text-center">
            <div className="mb-6">
              <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-600">
                Your appointment has been successfully scheduled.
              </p>
            </div>

            {selectedSlot && selectedDate && (
              <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="font-semibold text-gray-900">{job.title}</p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(selectedDate)} at {formatTime(selectedSlot.startTime)}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                You'll receive a confirmation email shortly with all the details.
              </p>
              {job.teams?.company_phone && (
                <p className="text-sm text-gray-600">
                  Questions? Call us at{' '}
                  <a href={`tel:${job.teams.company_phone}`} className="text-blue-600 font-medium hover:underline">
                    {job.teams.company_phone}
                  </a>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

