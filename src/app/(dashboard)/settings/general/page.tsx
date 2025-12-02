'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, LoadingButton, LoadingSpinner } from '@/components/ui'
import { Building2, DollarSign, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { updateGeneralSettings } from '@/app/actions/settings'
import { sanitizeString, sanitizeEmail, sanitizePhone } from '@/lib/utils/sanitize'
import { isValidEmail, isValidPhone, isNonNegativeNumber } from '@/lib/utils/validation'
import type { Team } from '@/lib/types'

function GeneralSettingsContent() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [team, setTeam] = useState<Team | null>(null)
  const [userRole, setUserRole] = useState<'owner' | 'member' | null>(null)
  const [formData, setFormData] = useState({
    default_tax_rate: 0,
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    default_quote_notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect members to profile
  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: teamId } = await supabase.rpc('get_user_primary_team')
      if (!teamId) return

      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single()

      if (teamMember && teamMember.role === 'member') {
        router.push('/profile')
        return
      }

      if (teamMember) {
        setUserRole(teamMember.role as 'owner' | 'member')
      }
    }
    checkAccess()
  }, [supabase, router])

  // Fetch team data
  useEffect(() => {
    async function fetchTeamData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: teamId } = await supabase.rpc('get_user_primary_team')
        if (!teamId) {
          toast.error('No team found. Please contact support.')
          setLoading(false)
          return
        }

        const { data: teamData, error } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single()

        if (error) {
          console.error('Error fetching team:', error)
          toast.error('Failed to load team settings.')
          setLoading(false)
          return
        }

        if (teamData) {
          setTeam(teamData as Team)
          setFormData({
            default_tax_rate: teamData.default_tax_rate || 0,
            company_address: teamData.company_address || '',
            company_phone: teamData.company_phone || '',
            company_email: teamData.company_email || '',
            company_website: teamData.company_website || '',
            default_quote_notes: teamData.default_quote_notes || '',
          })
        }
      } catch (error: any) {
        console.error('Error fetching team data:', error)
        toast.error('Failed to load team settings.')
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    // Validate inputs
    const newErrors: Record<string, string> = {}
    
    if (formData.company_email && !isValidEmail(formData.company_email)) {
      newErrors.company_email = 'Please enter a valid email address'
    }
    
    if (formData.company_phone && !isValidPhone(formData.company_phone)) {
      newErrors.company_phone = 'Please enter a valid phone number'
    }

    if (formData.default_tax_rate !== undefined && !isNonNegativeNumber(String(formData.default_tax_rate))) {
      newErrors.default_tax_rate = 'Tax rate must be a non-negative number'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSaving(false)
      return
    }

    try {
      // Sanitize inputs (convert null to undefined for TypeScript compatibility)
      const sanitizedData = {
        default_tax_rate: formData.default_tax_rate,
        company_address: sanitizeString(formData.company_address) || undefined,
        company_phone: formData.company_phone ? sanitizePhone(formData.company_phone) : undefined,
        company_email: formData.company_email ? sanitizeEmail(formData.company_email) : undefined,
        company_website: sanitizeString(formData.company_website) || undefined,
        default_quote_notes: sanitizeString(formData.default_quote_notes) || undefined,
      }

      const result = await updateGeneralSettings(sanitizedData)

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const isReadOnly = userRole === 'member'

  return (
    <div className="max-w-4xl">
      {/* Read-only notice */}
      {isReadOnly && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            You have read-only access. Only team owners can edit these settings.
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Business Identity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Business Identity</h2>
          </div>
          <div className="space-y-4">
            <Input
              label="Company Address"
              placeholder="123 Main St, City, State ZIP"
              value={formData.company_address}
              onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
              disabled={isReadOnly}
            />
            <Input
              label="Company Phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.company_phone}
              onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
              disabled={isReadOnly}
              error={errors.company_phone}
            />
            <Input
              label="Company Email"
              type="email"
              placeholder="contact@company.com"
              value={formData.company_email}
              onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
              disabled={isReadOnly}
              error={errors.company_email}
            />
            <Input
              label="Company Website"
              type="url"
              placeholder="https://www.company.com"
              value={formData.company_website}
              onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Section 2: Financial Defaults */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Financial Defaults</h2>
          </div>
          <div className="space-y-4">
            <Input
              label="Default Tax Rate (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="8.5"
              value={formData.default_tax_rate}
              onChange={(e) => setFormData({ ...formData, default_tax_rate: parseFloat(e.target.value) || 0 })}
              disabled={isReadOnly}
              error={errors.default_tax_rate}
            />
            <p className="text-sm text-gray-500">
              This tax rate will be pre-filled when creating new quotes.
            </p>
          </div>
        </div>

        {/* Section 3: Defaults */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Default Quote Terms</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Quote Notes / Terms & Conditions
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[120px] disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Enter default terms and conditions that will appear on all quotes..."
                value={formData.default_quote_notes}
                onChange={(e) => setFormData({ ...formData, default_quote_notes: e.target.value })}
                disabled={isReadOnly}
              />
              <p className="text-sm text-gray-500 mt-2">
                This text will be pre-filled in the notes field when creating new quotes.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {!isReadOnly && (
          <div className="flex justify-end">
            <LoadingButton
              type="submit"
              loading={saving}
              loadingText="Saving..."
              className="min-w-[150px]"
            >
              Save Changes
            </LoadingButton>
          </div>
        )}
      </form>
    </div>
  )
}

export default function GeneralSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      }
    >
      <GeneralSettingsContent />
    </Suspense>
  )
}

