import { useEffect, useState } from 'react'
import type { ExchangeRates } from '@/lib/billing'
import {
  getCachedExchangeRates,
  isExchangeRateCacheFresh,
  loadExchangeRates,
} from '@/lib/exchangeRates'

const DISPLAY_CURRENCY_KEY = 'subtrak.display-currency'
const REFRESH_INTERVAL_MS = 15 * 60 * 1000

function getInitialCurrency(): string {
  return localStorage.getItem(DISPLAY_CURRENCY_KEY) ?? 'USD'
}

export function useExchangeRates() {
  const [displayCurrency, setDisplayCurrencyState] = useState(getInitialCurrency)
  const [rates, setRates] = useState<ExchangeRates>(
    () => getCachedExchangeRates()?.rates ?? { USD: 1 },
  )
  const [fetchedAt, setFetchedAt] = useState<string | null>(
    () => getCachedExchangeRates()?.fetchedAt ?? null,
  )
  const [loading, setLoading] = useState(() => !getCachedExchangeRates())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const refresh = async () => {
      if (active) setLoading(true)
      try {
        const snapshot = await loadExchangeRates()
        if (!active) return
        setRates(snapshot.rates)
        setFetchedAt(snapshot.fetchedAt)
        setError(null)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load exchange rates')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    if (!getCachedExchangeRates() || !isExchangeRateCacheFresh(getCachedExchangeRates()!)) {
      refresh()
    } else {
      setLoading(false)
    }

    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  const setDisplayCurrency = (currency: string) => {
    setDisplayCurrencyState(currency)
    localStorage.setItem(DISPLAY_CURRENCY_KEY, currency)
  }

  return { displayCurrency, setDisplayCurrency, rates, fetchedAt, loading, error }
}
