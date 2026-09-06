import { describe, expect, it } from 'vitest'
import {
  computeTotals,
  convertCurrency,
  formatCurrency,
  toMonthlyAmount,
} from '../../src/lib/billing'

const rates = { USD: 1, EUR: 0.9, GBP: 0.8 }

describe('billing utilities', () => {
  it('converts recurring amounts to monthly values', () => {
    expect(toMonthlyAmount(12, 'weekly')).toBeCloseTo(52)
    expect(toMonthlyAmount(12, 'monthly')).toBe(12)
    expect(toMonthlyAmount(120, 'yearly')).toBe(10)
  })

  it('converts between currencies using rates relative to USD', () => {
    expect(convertCurrency(10, 'USD', 'EUR', rates)).toBeCloseTo(9)
    expect(convertCurrency(10, 'EUR', 'GBP', rates)).toBeCloseTo(8.8889, 3)
  })

  it('formats any supported ISO currency code', () => {
    expect(formatCurrency(4, 'USD')).toBe('$4.00')
    expect(formatCurrency(4, 'EUR')).toContain('4.00')
  })

  it('calculates totals in the selected display currency', () => {
    const subscriptions = [
      {
        id: '1',
        name: 'Video',
        amount: 10,
        currency: 'USD',
        billing_cycle: 'monthly' as const,
        category: 'Streaming',
        renewal_date: '2026-09-10',
        notes: null,
        created_at: '',
        updated_at: '',
      },
      {
        id: '2',
        name: 'Music',
        amount: 9,
        currency: 'EUR',
        billing_cycle: 'yearly' as const,
        category: 'Streaming',
        renewal_date: '2026-09-10',
        notes: null,
        created_at: '',
        updated_at: '',
      },
    ]

    const totals = computeTotals(subscriptions, 'GBP', rates)
    expect(totals.monthly).toBeCloseTo(10 * 0.8 + (9 / 12 / 0.9) * 0.8)
    expect(totals.yearly).toBeCloseTo(10 * 12 * 0.8 + (9 / 0.9) * 0.8)
  })
})
