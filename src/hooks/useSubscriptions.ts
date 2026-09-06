import { useCallback, useEffect, useState } from 'react'
import type {
  Subscription,
  SubscriptionFilters,
  SubscriptionInput,
} from '@shared/types'

export function useSubscriptions(filters: SubscriptionFilters) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await window.subtrak.subscriptions.list(filters)
      setSubscriptions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }, [filters.search, filters.category, filters.billing_cycle])

  useEffect(() => {
    refresh()
  }, [refresh])

  const create = async (input: SubscriptionInput) => {
    await window.subtrak.subscriptions.create(input)
    await refresh()
  }

  const update = async (id: string, input: SubscriptionInput) => {
    await window.subtrak.subscriptions.update(id, input)
    await refresh()
  }

  const remove = async (id: string) => {
    await window.subtrak.subscriptions.delete(id)
    await refresh()
  }

  return {
    subscriptions,
    loading,
    error,
    create,
    update,
    remove,
    refresh,
  }
}
