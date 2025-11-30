'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, LoadingButton, LoadingSpinner } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { Save, Building2 } from 'lucide-react'
import { sanitizeString, sanitizePhone, sanitizeEmail } from '@/lib/utils/sanitize'
import { isValidEmail, isValidPhone } from '@/lib/utils/validation'

export default function ProfilePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    phone: '',
    address_line_1: '',
    city: '',
    state: '',
    postal_code: ''
  })

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          company_name: data.company_name || '',
          phone: data.phone || '',
          address_line_1: data.address_line_1 || '',
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postal_code || ''
        })
      }
      setInitialLoading(false)
    }
    getProfile()
  }, [supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setErrors({})

    // Validate inputs
    const newErrors: Record<string, string> = {}
    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in' })
      setLoading(false)
      return
    }

    // Sanitize inputs
    const sanitizedData = {
      full_name: sanitizeString(formData.full_name) || null,
      company_name: sanitizeString(formData.company_name) || null,
      phone: formData.phone ? sanitizePhone(formData.phone) : null,
      address_line_1: sanitizeString(formData.address_line_1) || null,
      city: sanitizeString(formData.city) || null,
      state: sanitizeString(formData.state) || null,
      postal_code: sanitizeString(formData.postal_code) || null
    }

    const { error } = await supabase
      .from('users')
      .update(sanitizedData)
      .eq('id', user.id)

    if (error) {
      console.error('Profile update error:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      setMessage({ type: 'error', text: 'Error updating profile: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    }
    setLoading(false)
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Business Settings</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Company Details</h2>
            <p className="text-sm text-gray-500">This information appears on your PDF quotes.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Company / Business Name"
            placeholder="e.g. Joe's Plumbing"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          />

          <Input
            label="Your Name"
            placeholder="Your full name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />

          <Input
            label="Business Phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label="Business Address"
            placeholder="123 Main St"
            value={formData.address_line_1}
            onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <Input
              label="Zip Code"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              message.type === 'error' 
                ? 'bg-red-50 text-red-700' 
                : 'bg-green-50 text-green-700'
            }`}>
              {message.text}
            </div>
          )}
          
              <LoadingButton
                type="submit"
                className="w-full"
                loading={loading}
                loadingText="Saving..."
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </LoadingButton>
        </form>
      </div>
    </div>
  )
}
