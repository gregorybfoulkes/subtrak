import { useEffect, useState } from 'react'
import { BILLING_CYCLES, CATEGORIES } from '@shared/types'
import type { BillingCycle, Subscription, SubscriptionInput } from '@shared/types'

interface SubscriptionFormProps {
  open: boolean
  subscription?: Subscription | null
  onClose: () => void
  onSubmit: (input: SubscriptionInput) => Promise<void>
}

const emptyForm = (): SubscriptionInput => ({
  name: '',
  amount: 0,
  currency: 'USD',
  billing_cycle: 'monthly',
  category: 'Streaming',
  renewal_date: new Date().toISOString().slice(0, 10),
  notes: '',
})

export function SubscriptionForm({
  open,
  subscription,
  onClose,
  onSubmit,
}: SubscriptionFormProps) {
  const [form, setForm] = useState<SubscriptionInput>(emptyForm())
  const [customCategory, setCustomCategory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    if (subscription) {
      const isPreset = CATEGORIES.includes(
        subscription.category as (typeof CATEGORIES)[number],
      )
      setCustomCategory(!isPreset)
      setForm({
        name: subscription.name,
        amount: subscription.amount,
        currency: subscription.currency,
        billing_cycle: subscription.billing_cycle,
        category: subscription.category,
        renewal_date: subscription.renewal_date,
        notes: subscription.notes ?? '',
      })
    } else {
      setCustomCategory(false)
      setForm(emptyForm())
    }
    setError(null)
  }, [open, subscription])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    if (!form.amount || form.amount <= 0) {
      setError('Amount must be greater than zero')
      return
    }
    if (!form.renewal_date) {
      setError('Renewal date is required')
      return
    }

    setSaving(true)
    try {
      await onSubmit({
        ...form,
        notes: form.notes?.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save subscription')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-50">
            {subscription ? 'Edit subscription' : 'Add subscription'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <Field label="Name">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="field-input"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount || ''}
                onChange={(e) =>
                  setForm({ ...form, amount: parseFloat(e.target.value) || 0 })
                }
                className="field-input"
              />
            </Field>
            <Field label="Billing cycle">
              <select
                value={form.billing_cycle}
                onChange={(e) =>
                  setForm({
                    ...form,
                    billing_cycle: e.target.value as BillingCycle,
                  })
                }
                className="field-input"
              >
                {BILLING_CYCLES.map((cycle) => (
                  <option key={cycle} value={cycle}>
                    {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Category">
            {customCategory ? (
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="field-input"
                placeholder="Custom category"
              />
            ) : (
              <select
                value={form.category}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setCustomCategory(true)
                    setForm({ ...form, category: '' })
                  } else {
                    setForm({ ...form, category: e.target.value })
                  }
                }}
                className="field-input"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__custom__">Custom...</option>
              </select>
            )}
          </Field>

          <Field label="Renewal date">
            <input
              type="date"
              value={form.renewal_date}
              onChange={(e) => setForm({ ...form, renewal_date: e.target.value })}
              className="field-input"
            />
          </Field>

          <Field label="Notes (optional)">
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="field-input resize-none"
            />
          </Field>

          {error && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : subscription ? 'Save changes' : 'Add subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  )
}
