import type { Cart } from "@/types/abandoned-cart"

export const initialCarts: Cart[] = [
  {
    id: "AC001",
    customer: {
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+1 (555) 123-4567",
    },
    cartValue: 156.99,
    items: [
      { name: "Wireless Headphones", price: 89.99, quantity: 1 },
      { name: "Phone Case", price: 24.99, quantity: 2 },
    ],
    abandonedAt: "2024-01-15T10:30:00Z",
    status: "pending",
    priority: "high",
    remarks: [
      {
        id: 1,
        type: "email",
        date: "2024-01-15T14:00:00Z",
        message: "Sent abandoned cart email with 10% discount",
        response: null,
        agent: "John Doe",
      },
      {
        id: 2,
        type: "sms",
        date: "2024-01-16T09:00:00Z",
        message: "SMS reminder sent",
        response: "Thanks, will check it out later",
        agent: "Jane Smith",
      },
    ],
    lastContacted: "2024-01-16T09:00:00Z",
    hoursSinceAbandoned: 48,
  },
  {
    id: "AC002",
    customer: {
      name: "Mike Chen",
      email: "mike.chen@email.com",
      phone: "+1 (555) 987-6543",
    },
    cartValue: 299.5,
    items: [
      { name: "Gaming Mouse", price: 79.99, quantity: 1 },
      { name: "Mechanical Keyboard", price: 149.99, quantity: 1 },
    ],
    abandonedAt: "2024-01-14T16:45:00Z",
    status: "in-progress",
    priority: "medium",
    remarks: [
      {
        id: 1,
        type: "email",
        date: "2024-01-14T18:00:00Z",
        message: "Initial remark email sent",
        response: "Interested but need to check budget",
        agent: "Sarah Wilson",
      },
    ],
    lastContacted: "2024-01-14T18:00:00Z",
    hoursSinceAbandoned: 72,
  },
  {
    id: "AC003",
    customer: {
      name: "Emily Davis",
      email: "emily.davis@email.com",
      phone: "+1 (555) 456-7890",
    },
    cartValue: 89.99,
    items: [
      { name: "Yoga Mat", price: 49.99, quantity: 1 },
      { name: "Water Bottle", price: 19.99, quantity: 2 },
    ],
    abandonedAt: "2024-01-13T11:20:00Z",
    status: "completed",
    priority: "low",
    remarks: [
      {
        id: 1,
        type: "email",
        date: "2024-01-13T15:00:00Z",
        message: "Abandoned cart recovery email",
        response: "Purchased! Thank you for the reminder",
        agent: "Mike Johnson",
      },
    ],
    lastContacted: "2024-01-13T15:00:00Z",
    hoursSinceAbandoned: 96,
  },
]
