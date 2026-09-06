import { useMemo, useState } from 'react'
import type { BillingCycle, Subscription, SubscriptionInput } from '@shared/types'
import { Dashboard } from '@/components/Dashboard'
import { FilterBar } from '@/components/FilterBar'
import { SearchBar } from '@/components/SearchBar'
import { SubscriptionForm } from '@/components/SubscriptionForm'
import { SubscriptionList } from '@/components/SubscriptionList'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { computeTotals } from '@/lib/billing'

export default function App() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [billingCycle, setBillingCycle] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)

  const filters = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      billing_cycle: (billingCycle || undefined) as BillingCycle | undefined,
    }),
    [search, category, billingCycle],
  )

  const { subscriptions, loading, error, create, update, remove } =
    useSubscriptions(filters)

  const totals = useMemo(() => computeTotals(subscriptions), [subscriptions])

  const handleSubmit = async (input: SubscriptionInput) => {
    if (editing) {
      await update(editing.id, input)
    } else {
      await create(input)
    }
  }

  const handleEdit = (subscription: Subscription) => {
    setEditing(subscription)
    setFormOpen(true)
  }

  const handleDelete = async (subscription: Subscription) => {
    const confirmed = window.confirm(
      `Delete "${subscription.name}"? This cannot be undone.`,
    )
    if (confirmed) {
      await remove(subscription.id)
    }
  }

  const openAddForm = () => {
    setEditing(null)
    setFormOpen(true)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50">Subtrak</h1>
        <div className="flex flex-1 flex-wrap items-center gap-3 sm:justify-end">
          <SearchBar value={search} onChange={setSearch} />
          <button
            type="button"
            onClick={openAddForm}
            className="shrink-0 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            + Add Sub
          </button>
        </div>
      </header>

      <Dashboard
        monthlyTotal={totals.monthly}
        yearlyTotal={totals.yearly}
        count={totals.count}
      />

      <FilterBar
        category={category}
        billingCycle={billingCycle}
        onCategoryChange={setCategory}
        onBillingCycleChange={setBillingCycle}
      />

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <SubscriptionList
        subscriptions={subscriptions}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <SubscriptionForm
        open={formOpen}
        subscription={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
