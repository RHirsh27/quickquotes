'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { createJobFromQuote, createServiceLocation } from '@/app/actions/jobs'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { Plus, Clock, Info } from 'lucide-react'
import type { ServiceLocation, ServicePreset } from '@/lib/types'
import { calculateJobDuration, formatDuration } from '@/lib/utils/jobDuration'

interface CreateJobModalProps {
  isOpen: boolean
  onClose: () => void
  quote: {
    id: string
    quote_number: string
    job_summary: string | null
    customer_id: string
  }
  quoteItems: Array<{
    id: string
    label: string
    description: string | null
    quantity: number
    unit_price: number
    service_preset_id?: string | null
  }>
  onSuccess: (jobId: string) => void
}

export function CreateJobModal({
  isOpen,
  onClose,
  quote,
  quoteItems,
  onSuccess
}: CreateJobModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<ServiceLocation[]>([])
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [showNewLocation, setShowNewLocation] = useState(false)
  const [servicePresets, setServicePresets] = useState<ServicePreset[]>([])
  const [loadingPresets, setLoadingPresets] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [estimatedDuration, setEstimatedDuration] = useState<number>(60)
  const [isDurationEstimated, setIsDurationEstimated] = useState(false)
  
  // New location form state
  const [newLocation, setNewLocation] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    gate_code: '',
    access_instructions: '',
    is_primary: false
  })
  const [creatingLocation, setCreatingLocation] = useState(false)

  // Fetch service presets for duration calculation
  useEffect(() => {
    if (isOpen) {
      fetchServicePresets()
    }
  }, [isOpen])

  const fetchServicePresets = async () => {
    setLoadingPresets(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's primary team
      const { data: teamId } = await supabase.rpc('get_user_primary_team')
      if (!teamId) return

      // Fetch service presets
      const { data, error } = await supabase
        .from('service_presets')
        .select('*')
        .eq('team_id', teamId)
        .order('name')

      if (error) throw error
      setServicePresets(data || [])
    } catch (error: any) {
      console.error('Error fetching service presets:', error)
    } finally {
      setLoadingPresets(false)
    }
  }

  // Initialize form with quote data and calculate duration
  useEffect(() => {
    if (isOpen && quote && quoteItems.length > 0 && servicePresets.length > 0) {
      // Pre-fill title from quote number
      setTitle(`Job for Quote #${quote.quote_number}`)
      
      // Pre-fill description from quote items
      const itemsSummary = quoteItems
        .map(item => `${item.quantity}x ${item.label}${item.description ? ` - ${item.description}` : ''}`)
        .join('\n')
      const fullDescription = quote.job_summary 
        ? `${quote.job_summary}\n\nLine Items:\n${itemsSummary}`
        : `Line Items:\n${itemsSummary}`
      setDescription(fullDescription)

      // Calculate smart duration
      const durationResult = calculateJobDuration(quoteItems as any, servicePresets)
      setEstimatedDuration(durationResult.totalMinutes)
      setIsDurationEstimated(true)
    } else if (isOpen && quote) {
      // Fallback if no items or presets
      setTitle(`Job for Quote #${quote.quote_number}`)
      setEstimatedDuration(60)
      setIsDurationEstimated(false)
    }
  }, [isOpen, quote, quoteItems, servicePresets])

  // Fetch service locations for this customer
  useEffect(() => {
    if (isOpen && quote?.customer_id) {
      fetchLocations()
    }
  }, [isOpen, quote?.customer_id])

  const fetchLocations = async () => {
    setLoadingLocations(true)
    try {
      const { data, error } = await supabase
        .from('service_locations')
        .select('*')
        .eq('customer_id', quote.customer_id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setLocations(data || [])
      
      // Auto-select primary location if available
      const primaryLocation = data?.find(loc => loc.is_primary)
      if (primaryLocation) {
        setSelectedLocationId(primaryLocation.id)
      } else if (data && data.length > 0) {
        setSelectedLocationId(data[0].id)
      }
    } catch (error: any) {
      console.error('Error fetching locations:', error)
      toast.error('Failed to load service locations')
    } finally {
      setLoadingLocations(false)
    }
  }

  const handleCreateLocation = async () => {
    if (!newLocation.address_line_1 || !newLocation.city || !newLocation.state || !newLocation.postal_code) {
      toast.error('Please fill in all required address fields')
      return
    }

    setCreatingLocation(true)
    try {
      const result = await createServiceLocation(quote.customer_id, {
        address_line_1: newLocation.address_line_1,
        address_line_2: newLocation.address_line_2 || null,
        city: newLocation.city,
        state: newLocation.state,
        postal_code: newLocation.postal_code,
        gate_code: newLocation.gate_code || null,
        access_instructions: newLocation.access_instructions || null,
        is_primary: newLocation.is_primary
      })

      if (result.success && result.locationId) {
        toast.success('Service location created!')
        setShowNewLocation(false)
        setNewLocation({
          address_line_1: '',
          address_line_2: '',
          city: '',
          state: '',
          postal_code: '',
          gate_code: '',
          access_instructions: '',
          is_primary: false
        })
        // Refresh locations and select the new one
        await fetchLocations()
        setSelectedLocationId(result.locationId)
      } else {
        toast.error(result.message || 'Failed to create location')
      }
    } catch (error: any) {
      console.error('Error creating location:', error)
      toast.error('Failed to create service location')
    } finally {
      setCreatingLocation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Job title is required')
      return
    }

    setLoading(true)
    try {
      const result = await createJobFromQuote(quote.id, {
        title: title.trim(),
        description: description.trim() || null,
        service_location_id: selectedLocationId || null,
        estimated_duration_minutes: estimatedDuration || null
      })

      if (result.success && result.jobId) {
        toast.success(result.message)
        onSuccess(result.jobId)
        onClose()
      } else {
        toast.error(result.message || 'Failed to create job')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Error creating job:', error)
      toast.error('Failed to create job')
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Job from Quote"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Job Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter job title"
            required
          />
        </div>

        {/* Service Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Service Location
          </label>
          {loadingLocations ? (
            <div className="text-sm text-gray-500">Loading locations...</div>
          ) : (
            <>
              <select
                id="location"
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={showNewLocation}
              >
                <option value="">No location selected</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.address_line_1}, {location.city}, {location.state} {location.postal_code}
                    {location.is_primary && ' (Primary)'}
                  </option>
                ))}
              </select>

              {!showNewLocation ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNewLocation(true)}
                  className="mt-2 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New Location
                </Button>
              ) : (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
                  <h4 className="font-medium text-gray-900">New Service Location</h4>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={newLocation.address_line_1}
                      onChange={(e) => setNewLocation({ ...newLocation, address_line_1: e.target.value })}
                      placeholder="123 Main St"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Address Line 2
                    </label>
                    <Input
                      value={newLocation.address_line_2}
                      onChange={(e) => setNewLocation({ ...newLocation, address_line_2: e.target.value })}
                      placeholder="Apt, Suite, etc."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={newLocation.city}
                        onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={newLocation.state}
                        onChange={(e) => setNewLocation({ ...newLocation, state: e.target.value })}
                        placeholder="State"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      ZIP Code <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={newLocation.postal_code}
                      onChange={(e) => setNewLocation({ ...newLocation, postal_code: e.target.value })}
                      placeholder="12345"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Gate Code
                    </label>
                    <Input
                      value={newLocation.gate_code}
                      onChange={(e) => setNewLocation({ ...newLocation, gate_code: e.target.value })}
                      placeholder="1234"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Access Instructions
                    </label>
                    <textarea
                      value={newLocation.access_instructions}
                      onChange={(e) => setNewLocation({ ...newLocation, access_instructions: e.target.value })}
                      placeholder="Additional access instructions..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_primary"
                      checked={newLocation.is_primary}
                      onChange={(e) => setNewLocation({ ...newLocation, is_primary: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_primary" className="ml-2 text-sm text-gray-700">
                      Set as primary location
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <LoadingButton
                      type="button"
                      onClick={handleCreateLocation}
                      loading={creatingLocation}
                      loadingText="Creating..."
                      className="flex-1"
                    >
                      Create Location
                    </LoadingButton>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowNewLocation(false)
                        setNewLocation({
                          address_line_1: '',
                          address_line_2: '',
                          city: '',
                          state: '',
                          postal_code: '',
                          gate_code: '',
                          access_instructions: '',
                          is_primary: false
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Estimated Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Duration (minutes)
          </label>
          <div className="space-y-2">
            <Input
              id="duration"
              type="number"
              min="1"
              value={estimatedDuration}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0
                setEstimatedDuration(value)
                setIsDurationEstimated(false) // User manually changed it
              }}
              placeholder="60"
              required
            />
            {isDurationEstimated && (
              <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                <Info className="h-4 w-4" />
                <span>
                  Estimated based on line items ({formatDuration(estimatedDuration)})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Job description..."
            rows={6}
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
            Create Job
          </LoadingButton>
        </div>
      </form>
    </Modal>
  )
}

