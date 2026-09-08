import type { Subscription } from '@shared/types'
import {
  daysUntilRenewal,
  formatCurrency,
  formatCycleLabel,
  formatRenewalDate,
  isRenewalSoon,
  tryConvertCurrency,
} from '@/lib/billing'
import type { ExchangeRates } from '@/lib/billing'

interface SubscriptionListProps {
  subscriptions: Subscription[]
  loading: boolean
  onEdit: (subscription: Subscription) => void
  onDelete: (subscription: Subscription) => void
  displayCurrency: string
  rates: ExchangeRates
}

export function SubscriptionList({
  subscriptions,
  loading,
  onEdit,
  onDelete,
  displayCurrency,
  rates,
}: SubscriptionListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        Loading subscriptions...
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 py-16 text-center">
        <p className="text-slate-300">No subscriptions found</p>
        <p className="mt-1 text-sm text-slate-500">
          Add a subscription or adjust your filters
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Renewal</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <SubscriptionRow
              key={sub.id}
              subscription={sub}
              onEdit={onEdit}
              onDelete={onDelete}
              displayCurrency={displayCurrency}
              rates={rates}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SubscriptionRow({
  subscription,
  onEdit,
  onDelete,
  displayCurrency,
  rates,
}: {
  subscription: Subscription
  onEdit: (subscription: Subscription) => void
  onDelete: (subscription: Subscription) => void
  displayCurrency: string
  rates: ExchangeRates
}) {
  const soon = isRenewalSoon(subscription.renewal_date)
  const days = daysUntilRenewal(subscription.renewal_date)
  const convertedAmount = tryConvertCurrency(
    subscription.amount,
    subscription.currency,
    displayCurrency,
    rates,
  )

  return (
    <tr className="border-b border-slate-800/80 last:border-0 hover:bg-slate-800/40">
      <td className="px-4 py-3">
        <div className="font-medium text-slate-100">{subscription.name}</div>
        {subscription.notes && (
          <div className="mt-0.5 text-xs text-slate-500">{subscription.notes}</div>
        )}
      </td>
      <td className="px-4 py-3 text-slate-300">
        {convertedAmount === null
          ? formatCurrency(subscription.amount, subscription.currency)
          : formatCurrency(convertedAmount, displayCurrency)}
        <span className="text-slate-500">
          {formatCycleLabel(subscription.billing_cycle)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
          {subscription.category}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-300">
            {formatRenewalDate(subscription.renewal_date)}
          </span>
          {soon && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
              {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(subscription)}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/10"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(subscription)}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}
