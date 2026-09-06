import { formatCurrency } from '@/lib/billing'

interface DashboardProps {
  monthlyTotal: number
  yearlyTotal: number
  count: number
}

export function Dashboard({ monthlyTotal, yearlyTotal, count }: DashboardProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Monthly spend" value={formatCurrency(monthlyTotal)} accent="sky" />
      <StatCard label="Yearly spend" value={formatCurrency(yearlyTotal)} accent="violet" />
      <StatCard
        label="Subscriptions"
        value={String(count)}
        accent="emerald"
        suffix={count === 1 ? 'active' : 'active'}
      />
    </section>
  )
}

function StatCard({
  label,
  value,
  accent,
  suffix,
}: {
  label: string
  value: string
  accent: 'sky' | 'violet' | 'emerald'
  suffix?: string
}) {
  const accentClasses = {
    sky: 'from-sky-500/20 to-sky-500/5 border-sky-500/30',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/30',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
  }

  return (
    <div
      className={`rounded-xl border bg-gradient-to-br p-5 ${accentClasses[accent]}`}
    >
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
        {value}
      </p>
      {suffix && <p className="mt-1 text-xs text-slate-500">{suffix}</p>}
    </div>
  )
}
