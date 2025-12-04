'use client'

import { useState, useMemo, useCallback } from 'react'
import { Calendar, momentLocalizer, View, type SlotInfo } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Button } from '@/components/ui'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { Appointment, Job } from '@/lib/types'
import { CreateAppointmentModal } from './CreateAppointmentModal'

const localizer = momentLocalizer(moment)

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    appointmentId: string
    jobId: string
    jobTitle: string
    techId: string
    techName: string
    status: string
  }
}

interface CalendarViewProps {
  appointments: Array<Appointment & {
    jobs: Job | null
    assigned_tech_user: {
      id: string
      full_name: string | null
      company_name: string | null
    } | null
  }>
  onEventClick?: (appointment: Appointment) => void
  onSlotSelect?: (slotInfo: SlotInfo) => void
  onRefresh?: () => void
}

export function CalendarView({
  appointments,
  onEventClick,
  onSlotSelect,
  onRefresh
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<View>('week')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null)

  // Convert appointments to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return appointments.map((appointment) => {
      const start = new Date(appointment.start_time)
      const end = new Date(appointment.end_time)
      const techName = appointment.assigned_tech_user?.full_name || 
                       appointment.assigned_tech_user?.company_name || 
                       'Unassigned'
      const jobTitle = appointment.jobs?.title || 'No Job'

      return {
        id: appointment.id,
        title: `${jobTitle} - ${techName}`,
        start,
        end,
        resource: {
          appointmentId: appointment.id,
          jobId: appointment.job_id,
          jobTitle,
          techId: appointment.assigned_tech,
          techName,
          status: appointment.status
        }
      }
    })
  }, [appointments])

  // Get event style based on status
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const status = event.resource.status
    let backgroundColor = '#3b82f6' // default blue
    let borderColor = '#2563eb'

    switch (status) {
      case 'confirmed':
        backgroundColor = '#10b981' // green
        borderColor = '#059669'
        break
      case 'tentative':
        backgroundColor = '#f59e0b' // amber
        borderColor = '#d97706'
        break
      case 'completed':
        backgroundColor = '#6b7280' // gray
        borderColor = '#4b5563'
        break
      case 'canceled':
        backgroundColor = '#ef4444' // red
        borderColor = '#dc2626'
        break
      case 'no_show':
        backgroundColor = '#991b1b' // dark red
        borderColor = '#7f1d1d'
        break
      default:
        backgroundColor = '#3b82f6'
        borderColor = '#2563eb'
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderRadius: '4px',
        color: 'white',
        padding: '2px 4px',
        fontSize: '12px'
      }
    }
  }, [])

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo)
    setShowCreateModal(true)
    if (onSlotSelect) {
      onSlotSelect(slotInfo)
    }
  }, [onSlotSelect])

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    const appointment = appointments.find(a => a.id === event.resource.appointmentId)
    if (appointment && onEventClick) {
      onEventClick(appointment)
    }
  }, [appointments, onEventClick])

  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate)
  }, [])

  const handleViewChange = useCallback((newView: View) => {
    setView(newView)
  }, [])

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Calendar Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => handleNavigate(moment(currentDate).subtract(1, view === 'week' ? 'week' : 'day').toDate())}
            className="p-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleNavigate(new Date())}
            className="px-4"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleNavigate(moment(currentDate).add(1, view === 'week' ? 'week' : 'day').toDate())}
            className="p-2"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <h2 className="ml-4 text-lg font-semibold text-gray-900">
            {moment(currentDate).format(view === 'week' ? 'MMMM YYYY' : 'MMMM D, YYYY')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'day' ? 'primary' : 'ghost'}
            onClick={() => handleViewChange('day')}
            className="text-sm"
          >
            Day
          </Button>
          <Button
            variant={view === 'week' ? 'primary' : 'ghost'}
            onClick={() => handleViewChange('week')}
            className="text-sm"
          >
            Week
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-auto p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', minHeight: '600px' }}
          view={view}
          date={currentDate}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          eventPropGetter={eventStyleGetter}
          defaultView="week"
          views={['day', 'week']}
          step={60}
          timeslots={1}
          min={new Date(2024, 0, 1, 6, 0)} // 6 AM
          max={new Date(2024, 0, 1, 20, 0)} // 8 PM
        />
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-medium text-gray-700">Status:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-gray-600">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500"></div>
            <span className="text-gray-600">Tentative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-gray-600">Default</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500"></div>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-gray-600">Canceled</span>
          </div>
        </div>
      </div>

      {/* Create Appointment Modal */}
      {selectedSlot && (
        <CreateAppointmentModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setSelectedSlot(null)
          }}
          selectedSlot={selectedSlot}
          onSuccess={() => {
            if (onRefresh) onRefresh()
            setShowCreateModal(false)
            setSelectedSlot(null)
          }}
        />
      )}
    </div>
  )
}

