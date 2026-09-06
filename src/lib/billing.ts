import type { BillingCycle, Subscription } from '@shared/types'

export function toMonthlyAmount(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return amount * (52 / 12)
    case 'monthly':
      return amount
    case 'yearly':
      return amount / 12
  }
}

export function toYearlyAmount(amount: number, cycle: BillingCycle): number {
  return toMonthlyAmount(amount, cycle) * 12
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCycleLabel(cycle: BillingCycle): string {
  switch (cycle) {
    case 'weekly':
      return '/wk'
    case 'monthly':
      return '/mo'
    case 'yearly':
      return '/yr'
  }
}

export function formatRenewalDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(isoDate))
}

export function daysUntilRenewal(isoDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const renewal = new Date(isoDate)
  renewal.setHours(0, 0, 0, 0)
  const diffMs = renewal.getTime() - today.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function isRenewalSoon(isoDate: string, withinDays = 7): boolean {
  const days = daysUntilRenewal(isoDate)
  return days >= 0 && days <= withinDays
}

export function computeTotals(subscriptions: Subscription[]) {
  const monthly = subscriptions.reduce(
    (sum, sub) => sum + toMonthlyAmount(sub.amount, sub.billing_cycle),
    0,
  )
  const yearly = subscriptions.reduce(
    (sum, sub) => sum + toYearlyAmount(sub.amount, sub.billing_cycle),
    0,
  )

  return { monthly, yearly, count: subscriptions.length }
}
