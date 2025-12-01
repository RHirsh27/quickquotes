// TypeScript interfaces for database tables

export interface User {
  id: string // uuid, PK, references auth.users
  full_name: string | null
  company_name: string | null // Appears on PDF header
  phone: string | null
  address_line_1: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  stripe_connect_id: string | null // Stripe Connect Account ID for payouts
  created_at: string
}

export interface Team {
  id: string // uuid, PK
  name: string
  created_at: string
}

export interface TeamMember {
  id: string // uuid, PK
  team_id: string // uuid, FK -> teams.id
  user_id: string // uuid, FK -> users.id
  role: 'owner' | 'member'
  created_at: string
}

export interface Customer {
  id: string // uuid, PK
  user_id: string // uuid, FK -> users.id (kept for backwards compatibility, but team_id is primary)
  team_id: string // uuid, FK -> teams.id
  name: string
  phone: string | null
  email: string | null
  address_line_1: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  created_at: string
}

export interface ServicePreset {
  id: string // uuid, PK
  user_id: string // uuid, FK -> users.id (kept for backwards compatibility, but team_id is primary)
  team_id: string // uuid, FK -> teams.id
  name: string // e.g., "Service Call"
  default_price: number // numeric
  default_taxable: boolean
}

export interface Quote {
  id: string // uuid, PK
  user_id: string // uuid, FK -> users.id (kept for backwards compatibility, but team_id is primary)
  team_id: string // uuid, FK -> teams.id
  customer_id: string // uuid, FK -> customers.id
  quote_number: string // e.g., "Q-2024-1001"
  status: 'draft' | 'sent' | 'accepted' | 'declined'
  subtotal: number // numeric
  tax_amount: number // numeric
  tax_rate: number // numeric - Percentage
  total: number // numeric
  notes: string | null // Terms/Notes for the PDF footer
  created_at: string
}

export interface QuoteLineItem {
  id: string // uuid, PK
  quote_id: string // uuid, FK -> quotes.id
  label: string // Service name
  description: string | null
  quantity: number // numeric
  unit_price: number // numeric
  taxable: boolean
  position: number // int - For ordering on PDF
}
export interface Subscription {
  id: string // uuid, PK
  user_id: string // uuid, FK -> users.id
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused'
  plan_id: string | null // Stripe Price ID
  current_period_end: string | null // timestamp
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string // uuid, PK
  user_id: string // uuid, FK -> users.id
  stripe_invoice_id: string // Stripe Invoice ID (unique)
  status: 'pending' | 'paid' | 'failed' | 'void' | 'uncollectible'
  amount: number | null // Amount in cents
  currency: string | null // Currency code (e.g., 'usd')
  description: string | null
  customer_email: string | null
  customer_name: string | null
  created_at: string
  updated_at: string
  paid_at: string | null // When the invoice was marked as paid
}
