'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, User, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { Customer, ServicePreset, QuoteLineItem } from '@/lib/types'

// Line Item type for UI state (temporary ID)
type LineItemState = {
  id: string // temporary UI id
  label: string
  description: string
  quantity: number
  unit_price: number
  taxable: boolean
}

export default function NewQuotePage() {
  const router = useRouter()
  const supabase = createClient()

  // --- STATE ---
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [presets, setPresets] = useState<ServicePreset[]>([])
  
  // Form State
  const [mode, setMode] = useState<'select_customer' | 'new_customer'>('select_customer')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [newCustomer, setNewCustomer] = useState({ 
    name: '', 
    phone: '', 
    email: '',
    address_line_1: '',
    city: '',
    state: '',
    postal_code: ''
  })
  
  const [items, setItems] = useState<LineItemState[]>([])
  const [taxRate, setTaxRate] = useState(0) // Tax rate percentage

  // --- DATA FETCHING ---
  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch customers for this user
      const { data: custData } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
      
      // Fetch service presets for this user
      const { data: presetData } = await supabase
        .from('service_presets')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
      
      if (custData) setCustomers(custData)
      if (presetData) setPresets(presetData)
    }
    fetchData()
  }, [supabase])

  // --- CALCULATIONS ---
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  
  const taxAmount = items.reduce((sum, item) => {
    if (item.taxable) {
      return sum + (item.quantity * item.unit_price * (taxRate / 100))
    }
    return sum
  }, 0)
  
  const total = subtotal + taxAmount

  // --- HANDLERS ---

  const handleAddPreset = (preset: ServicePreset) => {
    const newItem: LineItemState = {
      id: Math.random().toString(36).substr(2, 9),
      label: preset.name,
      description: '',
      quantity: 1,
      unit_price: preset.default_price,
      taxable: preset.default_taxable
    }
    setItems([...items, newItem])
  }

  const handleAddCustomItem = () => {
    const newItem: LineItemState = {
      id: Math.random().toString(36).substr(2, 9),
      label: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      taxable: true
    }
    setItems([...items, newItem])
  }

  const handleUpdateItem = (id: string, field: keyof LineItemState, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleSave = async (status: 'draft' | 'sent') => {
    // Validation
    if (mode === 'select_customer' && !selectedCustomerId) {
      alert('Please select a customer')
      return
    }
    if (mode === 'new_customer' && !newCustomer.name.trim()) {
      alert('Customer name is required')
      return
    }
    if (items.length === 0) {
      alert('Add at least one item')
      return
    }

    // Validate line items have required data
    for (const item of items) {
      if (!item.label.trim()) {
        alert('All line items must have a label/description')
        return
      }
      if (item.quantity <= 0) {
        alert('All line items must have a quantity greater than 0')
        return
      }
      if (item.unit_price < 0) {
        alert('All line items must have a valid price')
        return
      }
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in')
        setLoading(false)
        return
      }

      // 1. Handle Customer (Get ID or Create New)
      let finalCustomerId = selectedCustomerId
      
      // Validate customer ID is a valid UUID format
      if (mode === 'select_customer' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedCustomerId)) {
        throw new Error('Invalid customer ID format')
      }

      if (mode === 'new_customer') {
        const { data: newCust, error: custError } = await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            name: newCustomer.name.trim(),
            phone: newCustomer.phone || null,
            email: newCustomer.email || null,
            address_line_1: newCustomer.address_line_1 || null,
            city: newCustomer.city || null,
            state: newCustomer.state || null,
            postal_code: newCustomer.postal_code || null
          })
          .select()
          .single()
        
        if (custError) throw custError
        finalCustomerId = newCust.id
      }

      // 2. Create Quote
      const quoteNumber = `Q-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      
      // Validate all numeric values are valid numbers
      const quoteData = {
        user_id: user.id,
        customer_id: finalCustomerId,
        quote_number: quoteNumber,
        status: status,
        subtotal: Number(subtotal) || 0,
        tax_amount: Number(taxAmount) || 0,
        tax_rate: Number(taxRate) || 0,
        total: Number(total) || 0,
        notes: null
      }
      
      console.log('Creating quote with data:', quoteData)
      
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert(quoteData)
        .select()
        .single()

      if (quoteError) throw quoteError

      // 3. Create Line Items
      const lineItemsData: Omit<QuoteLineItem, 'id'>[] = items.map((item, index) => ({
        quote_id: quote.id,
        label: item.label.trim() || 'Service',
        description: item.description.trim() || null,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        taxable: Boolean(item.taxable),
        position: Number(index) || 0
      }))

      console.log('Creating line items:', lineItemsData)

      const { error: linesError } = await supabase
        .from('quote_line_items')
        .insert(lineItemsData)

      if (linesError) throw linesError

      // Success! Redirect to dashboard
      router.push('/dashboard')
      
    } catch (error: any) {
      console.error('Error saving quote:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      alert(`Error saving quote: ${error.message || 'Unknown error'}\n\nCheck console for details.`)
    } finally {
      setLoading(false)
    }
  }

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-32">
      {/* Top Bar */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center gap-2 sticky top-0 z-10">
        <Link href="/dashboard">
          <Button variant="ghost" className="p-2">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold">New Quote</h1>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto w-full">
        
        {/* 1. CUSTOMER SECTION */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <User className="h-4 w-4" /> Customer
            </h2>
            <button 
              onClick={() => setMode(mode === 'select_customer' ? 'new_customer' : 'select_customer')}
              className="text-sm text-blue-600 font-medium hover:underline"
              type="button"
            >
              {mode === 'select_customer' ? '+ Create New' : 'Select Existing'}
            </button>
          </div>

          {mode === 'select_customer' ? (
            <select 
              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">-- Select Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="space-y-3">
              <Input
                label="Full Name *"
                placeholder="Customer name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                required
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="Phone number"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
              />
              <Input
                label="Email"
                type="email"
                placeholder="Email address"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
              />
              <Input
                label="Address"
                placeholder="Street address"
                value={newCustomer.address_line_1}
                onChange={(e) => setNewCustomer({...newCustomer, address_line_1: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="City"
                  placeholder="City"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
                />
                <Input
                  label="State"
                  placeholder="State"
                  value={newCustomer.state}
                  onChange={(e) => setNewCustomer({...newCustomer, state: e.target.value})}
                />
              </div>
              <Input
                label="Postal Code"
                placeholder="ZIP code"
                value={newCustomer.postal_code}
                onChange={(e) => setNewCustomer({...newCustomer, postal_code: e.target.value})}
              />
            </div>
          )}
        </div>

        {/* 2. LINE ITEMS SECTION */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800 px-1">Line Items</h2>
          
          {/* Preset Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleAddPreset(preset)}
                className="flex-shrink-0 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100 whitespace-nowrap hover:bg-blue-100 transition-colors"
                type="button"
              >
                <Plus className="inline h-3 w-3 mr-1" />
                {preset.name} (${preset.default_price})
              </button>
            ))}
            <button 
              onClick={handleAddCustomItem}
              className="flex-shrink-0 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 hover:bg-gray-200 transition-colors"
              type="button"
            >
              <Plus className="inline h-3 w-3 mr-1" />
              Custom Item
            </button>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
                No items yet. Add a preset or custom item to get started.
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <input
                      placeholder="Service Name"
                      className="font-medium text-gray-900 w-full border-none p-0 focus:ring-0 placeholder:text-gray-400 bg-transparent"
                      value={item.label}
                      onChange={(e) => handleUpdateItem(item.id, 'label', e.target.value)}
                    />
                    <button 
                      onClick={() => handleRemoveItem(item.id)} 
                      className="text-gray-400 hover:text-red-500 ml-2 transition-colors"
                      type="button"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <textarea
                    placeholder="Description (optional)"
                    className="w-full text-sm text-gray-600 border-none p-0 mb-3 focus:ring-0 resize-none bg-transparent"
                    rows={2}
                    value={item.description}
                    onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                  />

                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 block mb-1">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                        value={item.unit_price || ''}
                        onChange={(e) => handleUpdateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-xs text-gray-500 block mb-1">Qty</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                        value={item.quantity || ''}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={item.taxable}
                        onChange={(e) => handleUpdateItem(item.id, 'taxable', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      Taxable
                    </label>
                    <span className="font-semibold text-gray-900">
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. TOTALS SECTION */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600 items-center">
            <div className="flex items-center gap-2">
              <span>Tax Rate (%)</span>
              <input 
                type="number" 
                step="0.01"
                min="0"
                className="w-20 p-1.5 bg-gray-50 border border-gray-200 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={taxRate || ''}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </div>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

      </div>

      {/* STICKY FOOTER ACTIONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex gap-3 z-20">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => handleSave('draft')}
          disabled={loading}
        >
          Save Draft
        </Button>
        <Button 
          className="flex-1"
          onClick={() => handleSave('sent')}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Finish & Send'}
        </Button>
      </div>

    </div>
  )
}
