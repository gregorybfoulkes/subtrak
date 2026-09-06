import type { ExchangeRates } from '@/lib/billing'

const RATES_URL = 'https://open.er-api.com/v6/latest/USD'
const CACHE_KEY = 'subtrak.exchange-rates.usd'
const CACHE_TTL_MS = 15 * 60 * 1000

interface CachedRates {
  rates: ExchangeRates
  fetchedAt: string
}

export interface ExchangeRateSnapshot {
  rates: ExchangeRates
  fetchedAt: string
}

function readCache(): ExchangeRateSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null

    const cached = JSON.parse(raw) as CachedRates
    if (!cached.rates || !cached.fetchedAt) return null
    return cached
  } catch {
    return null
  }
}

function writeCache(snapshot: ExchangeRateSnapshot): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot))
}

export function getCachedExchangeRates(): ExchangeRateSnapshot | null {
  return readCache()
}

export function isExchangeRateCacheFresh(snapshot: ExchangeRateSnapshot): boolean {
  return Date.now() - new Date(snapshot.fetchedAt).getTime() < CACHE_TTL_MS
}

export async function fetchExchangeRates(): Promise<ExchangeRateSnapshot> {
  const response = await fetch(RATES_URL)
  if (!response.ok) {
    throw new Error(`Exchange-rate service returned ${response.status}`)
  }

  const payload = (await response.json()) as {
    time_last_update_unix?: number
    rates?: Record<string, number>
  }
  if (!payload.rates) throw new Error('Exchange-rate service returned no rates')

  const snapshot = {
    rates: { USD: 1, ...payload.rates },
    fetchedAt: payload.time_last_update_unix
      ? new Date(payload.time_last_update_unix * 1000).toISOString()
      : new Date().toISOString(),
  }
  writeCache(snapshot)
  return snapshot
}

export async function loadExchangeRates(): Promise<ExchangeRateSnapshot> {
  const cached = readCache()
  if (cached && isExchangeRateCacheFresh(cached)) return cached

  try {
    return await fetchExchangeRates()
  } catch (error) {
    if (cached) return cached
    throw error
  }
}
