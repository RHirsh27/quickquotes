'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { Trash2, Plus, UserPlus, User, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

// Types
type LineItem = {
  id: string // temporary UI id
  label: string
  description: string
  quantity: number
  unit_price: number
  taxable: boolean
}

type Customer = {
  id: string
  name: string
  phone: string | null
}

type Preset = {
  id: string
  name: string
  default_price: number
  description: string | null
}

export default function NewQuotePage() {
  const router = useRouter()
  const supabase = createClient()

  // --- STATE ---
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  
  // Form State
  const [mode, setMode] = useState<'select_customer' | 'new_customer'>('select_customer')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' })
  
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', label: 'Labor', description: '', quantity: 1, unit_price: 0, taxable: false }
  ])
  const [taxRate, setTaxRate] = useState(0) // Default 0%, user can change

  // --- DATA FETCHING ---
  useEffect(() => {
    async function fetchData() {
      const { data: custData } = await supabase.from('customers').select('id, name, phone').order('name')
      const { data: presetData } = await supabase.from('service_presets').select('*').order('name')
      
      if (custData) setCustomers(custData)
      if (presetData) setPresets(presetData)
    }
    fetchData()
  }, [])

  // --- CALCULATIONS ---
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const taxAmount = items.reduce((sum, item) => {
    return item.taxable ? sum + (item.quantity * item.unit_price * (taxRate / 100)) : sum
  }, 0)
  const total = subtotal + taxAmount

  // --- HANDLERS ---

  const handleAddItem = (preset?: Preset) => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      label: preset ? preset.name : '',
      description: preset?.description || '',
      quantity: 1,
      unit_price: preset ? preset.default_price : 0,
      taxable: true
    }
    setItems([...items, newItem])
  }

  const handleUpdateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!selectedCustomerId && mode === 'select_customer') {
      alert('Please select a customer')
      return
    }
    if (mode === 'new_customer' && !newCustomer.name) {
      alert('Customer name is required')
      return
    }
    if (items.length === 0) {
      alert('Add at least one item')
      return
    }

    setLoading(true)

    try {
      // 1. Handle Customer (Get ID or Create New)
      let finalCustomerId = selectedCustomerId

      if (mode === 'new_customer') {
        const { data: user } = await supabase.auth.getUser()
        const { data: newCust, error: custError } = await supabase
          .from('customers')
          .insert({
            user_id: user.user!.id,
            name: newCustomer.name,
            phone: newCustomer.phone,
            email: newCustomer.email
          })
          .select()
          .single()
        
        if (custError) throw custError
        finalCustomerId = newCust.id
      }

      // 2. Create Quote
      const { data: user } = await supabase.auth.getUser()
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          user_id: user.user!.id,
          customer_id: finalCustomerId,
          status: status,
          subtotal,
          tax_amount: taxAmount,
          total,
          tax_rate: taxRate,
          // Generate a simple quote number (Date + Random)
          quote_number: `Q-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        })
        .select()
        .single()

      if (quoteError) throw quoteError

      // 3. Create Line Items
      const lineItemsData = items.map((item, index) => ({
        quote_id: quote.id,
        label: item.label || 'Service',
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        taxable: item.taxable,
        position: index
      }))

      const { error: linesError } = await supabase
        .from('quote_line_items')
        .insert(lineItemsData)

      if (linesError) throw linesError

      // Success!
      router.push('/dashboard')
      
    } catch (error: any) {
      console.error('Error saving quote:', error)
      alert('Error saving quote: ' + error.message)
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
          <Button variant="ghost" className="p-2"><ChevronLeft className="h-6 w-6" /></Button>
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
            >
              {mode === 'select_customer' ? '+ Create New' : 'Select Existing'}
            </button>
          </div>

          {mode === 'select_customer' ? (
            <select 
              className="w-full p-3 bg-white border border-gray-300 rounded-lg"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">-- Select Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
              ))}
            </select>
          ) : (
            <div className="space-y-3">
              <input 
                placeholder="Full Name *" 
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
              />
              <input 
                placeholder="Phone (optional)" 
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
              />
              <input 
                placeholder="Email (optional)" 
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
              />
            </div>
          )}
        </div>

        {/* 2. LINE ITEMS SECTION */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800 px-1">Line Items</h2>
          
          {/* Preset Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {presets.map(p => (
              <button
                key={p.id}
                onClick={() => handleAddItem(p)}
                className="flex-shrink-0 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100 whitespace-nowrap"
              >
                + {p.name} (${p.default_price})
              </button>
            ))}
            <button 
              onClick={() => handleAddItem()}
              className="flex-shrink-0 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200"
            >
              + Custom Item
            </button>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <input
                    placeholder="Service Name"
                    className="font-medium text-gray-900 w-full border-none p-0 focus:ring-0 placeholder:text-gray-400"
                    value={item.label}
                    onChange={(e) => handleUpdateItem(item.id, 'label', e.target.value)}
                  />
                  <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500 ml-2">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                
                <textarea
                  placeholder="Description (optional)"
                  className="w-full text-sm text-gray-600 border-none p-0 mb-3 focus:ring-0 resize-none"
                  rows={1}
                  value={item.description}
                  onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                />

                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Price ($)</label>
                    <input
                      type="number"
                      className="w-full p-2 bg-gray-50 rounded-lg border-transparent focus:bg-white focus:border-blue-500 text-right"
                      value={item.unit_price}
                      onChange={(e) => handleUpdateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-xs text-gray-500">Qty</label>
                    <input
                      type="number"
                      className="w-full p-2 bg-gray-50 rounded-lg border-transparent focus:bg-white focus:border-blue-500 text-center"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                  <label className="flex items-center gap-2 text-sm text-gray-500">
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
            ))}
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
                className="w-16 p-1 bg-gray-50 border rounded text-right text-sm"
                value={taxRate}
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex gap-3 z-20 md:pl-64">
         {/* md:pl-64 assumes sidebar eventually, remove if no sidebar */}
        <Button 
          variant="secondary" 
          className="flex-1"
          onClick={() => handleSave('draft')}
          disabled={loading}
        >
          Save Draft
        </Button>
        <Button 
          variant="primary" 
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

