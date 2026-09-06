import type { BillingCycle, Subscription } from '@shared/types'

export type ExchangeRates = Record<string, number>

export function getSupportedCurrencies(): string[] {
  return typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('currency')
    : ['USD']
}

export function isCurrencyCode(value: string): boolean {
  return getSupportedCurrencies().includes(value.toUpperCase())
}

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

export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  const normalizedCurrency = currency.toUpperCase()

  if (!isCurrencyCode(normalizedCurrency)) {
    throw new RangeError(`Unsupported currency code: ${currency}`)
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates,
): number {
  const from = fromCurrency.toUpperCase()
  const to = toCurrency.toUpperCase()

  if (from === to) return amount

  const fromRate = rates[from]
  const toRate = rates[to]
  if (!fromRate || !toRate) {
    throw new Error(`Exchange rate unavailable for ${from} to ${to}`)
  }

  return (amount / fromRate) * toRate
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

export function computeTotals(
  subscriptions: Subscription[],
  displayCurrency = 'USD',
  rates: ExchangeRates = { USD: 1 },
) {
  const monthly = subscriptions.reduce(
    (sum, sub) =>
      sum +
      convertCurrency(
        toMonthlyAmount(sub.amount, sub.billing_cycle),
        sub.currency,
        displayCurrency,
        rates,
      ),
    0,
  )
  const yearly = subscriptions.reduce(
    (sum, sub) =>
      sum +
      convertCurrency(
        toYearlyAmount(sub.amount, sub.billing_cycle),
        sub.currency,
        displayCurrency,
        rates,
      ),
    0,
  )

  return { monthly, yearly, count: subscriptions.length }
}
