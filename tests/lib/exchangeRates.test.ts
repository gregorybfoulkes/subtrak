import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchExchangeRates,
  getCachedExchangeRates,
  isExchangeRateCacheFresh,
  loadExchangeRates,
} from '../../src/lib/exchangeRates'

const cache = new Map<string, string>()

const localStorageMock: Storage = {
  get length() {
    return cache.size
  },
  clear: () => cache.clear(),
  getItem: (key) => cache.get(key) ?? null,
  key: (index) => Array.from(cache.keys())[index] ?? null,
  removeItem: (key) => cache.delete(key),
  setItem: (key, value) => cache.set(key, value),
}

describe('exchange-rate service', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock)
    cache.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('fetches rates, adds USD as the base rate, and persists the snapshot', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            time_last_update_unix: 1_757_200_000,
            rates: { EUR: 0.9, GBP: 0.8 },
          }),
          { status: 200 },
        ),
      ),
    )

    const snapshot = await fetchExchangeRates()

    expect(snapshot.rates).toEqual({ USD: 1, EUR: 0.9, GBP: 0.8 })
    expect(getCachedExchangeRates()).toEqual(snapshot)
  })

  it('loads fresh persisted rates without making a network request', async () => {
    vi.setSystemTime(new Date('2026-09-07T12:00:00.000Z'))
    localStorageMock.setItem(
      'subtrak.exchange-rates.usd',
      JSON.stringify({
        rates: { USD: 1, EUR: 0.9 },
        fetchedAt: '2026-09-07T11:55:00.000Z',
      }),
    )
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const snapshot = await loadExchangeRates()

    expect(snapshot.rates.EUR).toBe(0.9)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refreshes stale rates and falls back to stale rates when offline', async () => {
    vi.setSystemTime(new Date('2026-09-07T12:00:00.000Z'))
    const staleSnapshot = {
      rates: { USD: 1, EUR: 0.9 },
      fetchedAt: '2026-09-07T11:00:00.000Z',
    }
    localStorageMock.setItem(
      'subtrak.exchange-rates.usd',
      JSON.stringify(staleSnapshot),
    )
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    const snapshot = await loadExchangeRates()

    expect(snapshot).toEqual(staleSnapshot)
    expect(isExchangeRateCacheFresh(snapshot)).toBe(false)
  })

  it('throws when no cached rates exist and the service is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    await expect(loadExchangeRates()).rejects.toThrow('offline')
  })
})