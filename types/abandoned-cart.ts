export interface Customer {
  id: string
  name: string
  email: string
  phone: string
}

export interface CartItem {
  id: string
  name: string
  quantity: number
  price: number
}

export interface Remark {
  id: number
  cart_id: string
  type: string
  message: string
  response?: string | null
  agent?: string
  date?: string
  status?: string // <-- add status for system remarks
  priority?: string // <-- add priority for system remarks
}

export interface Cart {
  id: string
  customer: Customer
  items: CartItem[]
  cartValue: number
  abandonedAt: string
  lastContacted: string
  status: "pending" | "in-progress" | "completed" | "failed"
  priority: "high" | "medium" | "low"
  remarks: Remark[]
  hoursSinceAbandoned: number
}
