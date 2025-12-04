'use client'

import { useState } from 'react'
import { Briefcase, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui'
import { CreateAppointmentModal } from './CreateAppointmentModal'
import type { Job } from '@/lib/types'
import type { SlotInfo } from 'react-big-calendar'

interface UnscheduledJobsListProps {
  jobs: Job[]
  onJobScheduled: () => void
}

export function UnscheduledJobsList({ jobs, onJobScheduled }: UnscheduledJobsListProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleJobClick = (job: Job) => {
    setSelectedJob(job)
    // Create a default slot for "now" + 1 hour
    const now = new Date()
    const defaultSlot: SlotInfo = {
      start: now,
      end: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
      action: 'select'
    }
    setShowCreateModal(true)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="h-5 w-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Unscheduled Jobs</h2>
        </div>
        <p className="text-sm text-gray-500">
          {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} pending
        </p>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No unscheduled jobs</p>
            <p className="text-xs text-gray-400 mt-1">All jobs are scheduled</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer bg-white"
              onClick={() => handleJobClick(job)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                  {job.title}
                </h3>
              </div>
              {job.description && (
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {job.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {job.priority && (
                  <span className={`px-2 py-0.5 rounded ${
                    job.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    job.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    job.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {job.priority}
                  </span>
                )}
                {job.estimated_duration_minutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{job.estimated_duration_minutes}m</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                className="w-full mt-2 text-xs py-1.5"
                onClick={(e) => {
                  e.stopPropagation()
                  handleJobClick(job)
                }}
              >
                Schedule
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Create Appointment Modal */}
      {selectedJob && (
        <CreateAppointmentModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setSelectedJob(null)
          }}
          selectedSlot={{
            start: new Date(),
            end: new Date(Date.now() + 60 * 60 * 1000),
            action: 'select'
          }}
          preselectedJobId={selectedJob.id}
          onSuccess={() => {
            onJobScheduled()
            setShowCreateModal(false)
            setSelectedJob(null)
          }}
        />
      )}
    </div>
  )
}

