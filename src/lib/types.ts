// Database types will be generated from Supabase
// This file is a placeholder for TypeScript types

export interface Quote {
  id: string
  customer_id: string
  job_description: string
  total_amount: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name?: string
  created_at: string
}

