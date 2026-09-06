export type BillingCycle = 'weekly' | 'monthly' | 'yearly'

export const BILLING_CYCLES: BillingCycle[] = ['weekly', 'monthly', 'yearly']

export const CATEGORIES = [
  'Streaming',
  'Software',
  'Gaming',
  'Utilities',
  'Fitness',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number] | string

export interface Subscription {
  id: string
  name: string
  amount: number
  currency: string
  billing_cycle: BillingCycle
  category: string
  renewal_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionInput {
  name: string
  amount: number
  currency?: string
  billing_cycle: BillingCycle
  category: string
  renewal_date: string
  notes?: string | null
}

export interface SubscriptionFilters {
  search?: string
  category?: string
  billing_cycle?: BillingCycle
}

export interface SubtrakApi {
  subscriptions: {
    list: (filters?: SubscriptionFilters) => Promise<Subscription[]>
    get: (id: string) => Promise<Subscription | null>
    create: (input: SubscriptionInput) => Promise<Subscription>
    update: (id: string, input: SubscriptionInput) => Promise<Subscription>
    delete: (id: string) => Promise<void>
  }
}

declare global {
  interface Window {
    subtrak: SubtrakApi
  }
}

export {}
