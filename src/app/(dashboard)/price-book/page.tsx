'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, LoadingButton, LoadingSpinner } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, X, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ServicePreset } from '@/lib/types'
import { createPreset, updatePreset, deletePreset } from '@/app/actions/presets'
import { sanitizeString, sanitizeNumber } from '@/lib/utils/sanitize'
import { isPositiveNumber } from '@/lib/utils/validation'

export default function PriceBookPage() {
  const supabase = createClient()
  const [presets, setPresets] = useState<ServicePreset[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'owner' | 'member' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
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
        toast.error('Failed to load price book.')
      } else {
        setPresets(presetData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase])

  const isOwner = userRole === 'owner'

  const resetForm = () => {
    setFormData({ name: '', default_price: '', default_taxable: true })
    setEditingId(null)
    setShowAddModal(false)
  }

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
      resetForm()
      
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
    setShowAddModal(true)
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
      resetForm()
      
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
    if (!window.confirm('Are you sure you want to delete this item? This cannot be undone.')) {
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Price Book</h1>
            <p className="text-sm text-gray-500">Manage your service presets and pricing</p>
          </div>
        </div>
        {isOwner && (
          <Button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Taxable?
                </th>
                {isOwner && (
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {presets.length === 0 ? (
                <tr>
                  <td colSpan={isOwner ? 4 : 3} className="px-6 py-12 text-center text-gray-500">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p>No items in price book yet.</p>
                    {isOwner && (
                      <p className="text-sm mt-2">Click "Add Item" to create your first preset.</p>
                    )}
                  </td>
                </tr>
              ) : (
                presets.map((preset) => (
                  <tr key={preset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{preset.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${preset.default_price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          preset.default_taxable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {preset.default_taxable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    {isOwner && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => handleEdit(preset)}
                            disabled={editingId !== null || deletingId !== null}
                            className="p-2 h-8 w-8"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleDelete(preset.id)}
                            disabled={deletingId === preset.id || editingId !== null}
                            className="p-2 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete"
                          >
                            {deletingId === preset.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && isOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Item' : 'Add New Item'}
              </h2>
              <Button
                variant="ghost"
                onClick={resetForm}
                className="p-2 h-8 w-8"
                disabled={saving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (editingId) {
                  handleUpdate(editingId)
                } else {
                  handleCreate(e)
                }
              }}
              className="space-y-4"
            >
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
              <div className="flex gap-2 pt-4">
                <LoadingButton
                  type="submit"
                  loading={saving}
                  loadingText={editingId ? 'Saving...' : 'Creating...'}
                  className="flex-1"
                >
                  {editingId ? 'Save Changes' : 'Create Item'}
                </LoadingButton>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

