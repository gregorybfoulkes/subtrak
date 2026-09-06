import { BILLING_CYCLES, CATEGORIES } from '@shared/types'
import type { BillingCycle } from '@shared/types'

interface FilterBarProps {
  category: string
  billingCycle: string
  onCategoryChange: (value: string) => void
  onBillingCycleChange: (value: string) => void
}

export function FilterBar({
  category,
  billingCycle,
  onCategoryChange,
  onBillingCycleChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-slate-500">Filters:</span>
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      >
        <option value="">All categories</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <select
        value={billingCycle}
        onChange={(e) => onBillingCycleChange(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      >
        <option value="">All cycles</option>
        {BILLING_CYCLES.map((cycle) => (
          <option key={cycle} value={cycle}>
            {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
          </option>
        ))}
      </select>
    </div>
  )
}

export type { BillingCycle }
