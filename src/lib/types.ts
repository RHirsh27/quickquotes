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
