export interface Profile {
  id: string
  full_name: string | null
  role: 'admin' | 'collector'
  created_at: string
}

export interface Payment {
  id: string
  transaction_id: string
  amount: number
  customer_name: string | null
  customer_phone: string | null
  description: string | null
  reference: string | null
  status: 'paid' | 'voided'
  created_by: string
  created_at: string
  updated_at: string
  profiles?: Profile  // joined for display
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  metadata: any
  created_at: string
}