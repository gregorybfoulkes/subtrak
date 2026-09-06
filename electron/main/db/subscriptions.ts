import type {
  BillingCycle,
  Subscription,
  SubscriptionFilters,
  SubscriptionInput,
} from '../../../shared/types.ts'
import { getDatabase } from './database.ts'

interface SubscriptionRow {
  id: string
  name: string
  amount: number
  currency: string
  billing_cycle: string
  category: string
  renewal_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

function mapRow(row: SubscriptionRow): Subscription {
  return {
    ...row,
    billing_cycle: row.billing_cycle as BillingCycle,
  }
}

export function listSubscriptions(filters: SubscriptionFilters = {}): Subscription[] {
  const db = getDatabase()
  const conditions: string[] = []
  const params: Record<string, string> = {}

  if (filters.search?.trim()) {
    conditions.push('(name LIKE @search OR IFNULL(notes, \'\') LIKE @search)')
    params.search = `%${filters.search.trim()}%`
  }

  if (filters.category?.trim()) {
    conditions.push('category = @category')
    params.category = filters.category.trim()
  }

  if (filters.billing_cycle) {
    conditions.push('billing_cycle = @billing_cycle')
    params.billing_cycle = filters.billing_cycle
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `SELECT * FROM subscriptions ${where} ORDER BY renewal_date ASC, name ASC`,
    )
    .all(params) as SubscriptionRow[]

  return rows.map(mapRow)
}

export function getSubscription(id: string): Subscription | null {
  const db = getDatabase()
  const row = db
    .prepare('SELECT * FROM subscriptions WHERE id = ?')
    .get(id) as SubscriptionRow | undefined

  return row ? mapRow(row) : null
}

export function createSubscription(input: SubscriptionInput): Subscription {
  const db = getDatabase()
  const now = new Date().toISOString()
  const id = crypto.randomUUID()

  db.prepare(`
    INSERT INTO subscriptions (
      id, name, amount, currency, billing_cycle, category, renewal_date, notes, created_at, updated_at
    ) VALUES (
      @id, @name, @amount, @currency, @billing_cycle, @category, @renewal_date, @notes, @created_at, @updated_at
    )
  `).run({
    id,
    name: input.name.trim(),
    amount: input.amount,
    currency: input.currency ?? 'USD',
    billing_cycle: input.billing_cycle,
    category: input.category.trim(),
    renewal_date: input.renewal_date,
    notes: input.notes?.trim() || null,
    created_at: now,
    updated_at: now,
  })

  const created = getSubscription(id)
  if (!created) throw new Error('Failed to create subscription')
  return created
}

export function updateSubscription(id: string, input: SubscriptionInput): Subscription {
  const db = getDatabase()
  const existing = getSubscription(id)
  if (!existing) throw new Error('Subscription not found')

  const now = new Date().toISOString()

  db.prepare(`
    UPDATE subscriptions SET
      name = @name,
      amount = @amount,
      currency = @currency,
      billing_cycle = @billing_cycle,
      category = @category,
      renewal_date = @renewal_date,
      notes = @notes,
      updated_at = @updated_at
    WHERE id = @id
  `).run({
    id,
    name: input.name.trim(),
    amount: input.amount,
    currency: input.currency ?? 'USD',
    billing_cycle: input.billing_cycle,
    category: input.category.trim(),
    renewal_date: input.renewal_date,
    notes: input.notes?.trim() || null,
    updated_at: now,
  })

  const updated = getSubscription(id)
  if (!updated) throw new Error('Failed to update subscription')
  return updated
}

export function deleteSubscription(id: string): void {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM subscriptions WHERE id = ?').run(id)
  if (result.changes === 0) throw new Error('Subscription not found')
}
