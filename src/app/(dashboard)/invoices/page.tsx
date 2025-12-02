'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, ChevronRight, FileText, DollarSign } from 'lucide-react'
import { Button, LoadingSpinner } from '@/components/ui'
import type { Invoice } from '@/lib/types'

type InvoiceWithCustomer = Invoice & {
  customers: { name: string } | null
}

export default function InvoicesPage() {
  const supabase = createClient()
  const [invoices, setInvoices] = useState<InvoiceWithCustomer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInvoices() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's primary team
      const { data: teamId } = await supabase.rpc('get_user_primary_team')
      
      let query = supabase
        .from('invoices')
        .select(`*, customers ( name )`)
        .order('created_at', { ascending: false })

      if (teamId) {
        query = query.eq('team_id', teamId)
      } else {
        // Fallback to user_id if no team found
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching invoices:', error)
      } else {
        setInvoices(data || [])
      }
      setLoading(false)
    }
    fetchInvoices()
  }, [supabase])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">PAID</span>
      case 'unpaid':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">UNPAID</span>
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">PENDING</span>
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status.toUpperCase()}</span>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">Manage and track your invoices</p>
        </div>
      </div>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices yet</h3>
          <p className="text-gray-500 mb-6">Convert a quote to an invoice to get started.</p>
          <Link href="/quotes">
            <Button>
              <ChevronRight className="mr-2 h-4 w-4" />
              View Quotes
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {invoice.invoice_number || `Invoice #${invoice.id.slice(0, 8)}`}
                      </h3>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {invoice.customers?.name || 'Unknown Customer'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(invoice.created_at).toLocaleDateString()}
                      {invoice.due_date && ` • Due ${new Date(invoice.due_date).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">
                      ${(invoice.total || 0).toFixed(2)}
                    </p>
                    {invoice.amount_paid && invoice.amount_paid > 0 && (
                      <p className="text-sm text-gray-500">
                        Paid: ${invoice.amount_paid.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

