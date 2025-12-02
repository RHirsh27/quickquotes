'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, LoadingButton, LoadingSpinner } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Shield, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ServicePreset } from '@/lib/types'
import { createPreset, updatePreset, deletePreset } from '@/app/actions/presets'
import { sanitizeString, sanitizeNumber } from '@/lib/utils/sanitize'
import { isPositiveNumber } from '@/lib/utils/validation'

export default function PresetsPage() {
  const supabase = createClient()
  const [presets, setPresets] = useState<ServicePreset[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'owner' | 'member' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    default_price: '',
    default_taxable: true,
  })

  // Fetch presets and user role
  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Get user's primary team
      const { data: teamId, error: teamError } = await supabase.rpc('get_user_primary_team')
      if (teamError || !teamId) {
        console.error('Error fetching team:', teamError)
        setLoading(false)
        return
      }

      // Get user's role
      const { data: teamMember, error: roleError } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single()

      if (!roleError && teamMember) {
        setUserRole(teamMember.role as 'owner' | 'member')
      }

      // Fetch presets for the team
      const { data: presetData, error: presetError } = await supabase
        .from('service_presets')
        .select('*')
        .eq('team_id', teamId)
        .order('name')

      if (presetError) {
        console.error('Error fetching presets:', presetError)
        toast.error('Failed to load presets.')
      } else {
        setPresets(presetData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase])

  const isOwner = userRole === 'owner'

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const price = parseFloat(formData.default_price)
    if (!isPositiveNumber(price)) {
      toast.error('Please enter a valid price')
      setSaving(false)
      return
    }

    const result = await createPreset(
      sanitizeString(formData.name),
      price,
      formData.default_taxable
    )

    if (result.success) {
      toast.success(result.message)
      setShowCreateForm(false)
      setFormData({ name: '', default_price: '', default_taxable: true })
      
      // Refresh presets
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: teamId } = await supabase.rpc('get_user_primary_team')
        if (teamId) {
          const { data: presetData } = await supabase
            .from('service_presets')
            .select('*')
            .eq('team_id', teamId)
            .order('name')
          if (presetData) setPresets(presetData)
        }
      }
    } else {
      toast.error(result.message)
    }

    setSaving(false)
  }

  const handleEdit = (preset: ServicePreset) => {
    setEditingId(preset.id)
    setFormData({
      name: preset.name,
      default_price: preset.default_price.toString(),
      default_taxable: preset.default_taxable,
    })
  }

  const handleUpdate = async (presetId: string) => {
    setSaving(true)

    const price = parseFloat(formData.default_price)
    if (!isPositiveNumber(price)) {
      toast.error('Please enter a valid price')
      setSaving(false)
      return
    }

    const result = await updatePreset(
      presetId,
      sanitizeString(formData.name),
      price,
      formData.default_taxable
    )

    if (result.success) {
      toast.success(result.message)
      setEditingId(null)
      setFormData({ name: '', default_price: '', default_taxable: true })
      
      // Refresh presets
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: teamId } = await supabase.rpc('get_user_primary_team')
        if (teamId) {
          const { data: presetData } = await supabase
            .from('service_presets')
            .select('*')
            .eq('team_id', teamId)
            .order('name')
          if (presetData) setPresets(presetData)
        }
      }
    } else {
      toast.error(result.message)
    }

    setSaving(false)
  }

  const handleDelete = async (presetId: string) => {
    if (!window.confirm('Are you sure you want to delete this preset? This cannot be undone.')) {
      return
    }

    setDeletingId(presetId)
    const result = await deletePreset(presetId)

    if (result.success) {
      toast.success(result.message)
      setPresets(presets.filter(p => p.id !== presetId))
    } else {
      toast.error(result.message)
    }

    setDeletingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ name: '', default_price: '', default_taxable: true })
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price Book</h1>
          <p className="text-gray-500">Manage your service presets</p>
        </div>
        {isOwner && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {showCreateForm ? 'Cancel' : 'Create New Preset'}
          </Button>
        )}
      </div>

      {!isOwner && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <Shield className="h-5 w-5 text-blue-600" />
          <p className="text-sm text-blue-800">
            <strong>Managed by Team Owner.</strong> You can view and use these presets when creating quotes, but only the team owner can edit them.
          </p>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && isOwner && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Preset</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Service Name"
              required
              placeholder="e.g., Service Call"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={saving}
            />
            <Input
              type="number"
              label="Default Price"
              required
              step="0.01"
              placeholder="0.00"
              value={formData.default_price}
              onChange={(e) => setFormData({ ...formData, default_price: e.target.value })}
              disabled={saving}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="default_taxable"
                checked={formData.default_taxable}
                onChange={(e) => setFormData({ ...formData, default_taxable: e.target.checked })}
                disabled={saving}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="default_taxable" className="text-sm text-gray-700">
                Taxable by default
              </label>
            </div>
            <div className="flex gap-2">
              <LoadingButton
                type="submit"
                loading={saving}
                loadingText="Creating..."
              >
                Create Preset
              </LoadingButton>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setFormData({ name: '', default_price: '', default_taxable: true })
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Presets List */}
      {presets.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {isOwner ? 'No presets yet. Create your first one!' : 'No presets available.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
            >
              {editingId === preset.id && isOwner ? (
                // Edit Form
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleUpdate(preset.id)
                  }}
                  className="space-y-4"
                >
                  <Input
                    label="Service Name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={saving}
                  />
                  <Input
                    type="number"
                    label="Default Price"
                    required
                    step="0.01"
                    value={formData.default_price}
                    onChange={(e) => setFormData({ ...formData, default_price: e.target.value })}
                    disabled={saving}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`taxable_${preset.id}`}
                      checked={formData.default_taxable}
                      onChange={(e) => setFormData({ ...formData, default_taxable: e.target.checked })}
                      disabled={saving}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <label htmlFor={`taxable_${preset.id}`} className="text-sm text-gray-700">
                      Taxable by default
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <LoadingButton
                      type="submit"
                      loading={saving}
                      loadingText="Saving..."
                    >
                      Save
                    </LoadingButton>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                // Display Mode
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{preset.name}</h3>
                      {!isOwner && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Managed by Team Owner
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span>${preset.default_price.toFixed(2)}</span>
                      <span className={preset.default_taxable ? 'text-green-600' : 'text-gray-400'}>
                        {preset.default_taxable ? 'Taxable' : 'Non-taxable'}
                      </span>
                    </div>
                  </div>
                  {isOwner && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => handleEdit(preset)}
                        disabled={editingId !== null}
                        className="p-2"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(preset.id)}
                        disabled={deletingId === preset.id || editingId !== null}
                        className="p-2"
                      >
                        {deletingId === preset.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-600" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

