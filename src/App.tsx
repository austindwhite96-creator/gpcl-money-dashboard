import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  House,
  Receipt,
  RefreshCw,
} from 'lucide-react'
import { loadCashDashboard } from './data/cashDashboard'
import { formatMargin, formatPay } from './lib/money'
import { formatSyncedAt, formatTxnDate } from './lib/dates'
import type { CashDashboard, CategorySpend } from './types'

export default function App() {
  const [data, setData] = useState<CashDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadCashDashboard()
      .then((dash) => {
        if (cancelled) return
        setData(dash)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Failed to load cash dashboard'
        setLoadError(message)
        setData(null)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6 text-center">
        <p className="text-4xl">🎄</p>
        <p className="mt-4 text-xl font-bold text-gpcl-900">Loading…</p>
        <p className="mt-2 text-sm text-gpcl-800/70">Fetching owner cash snapshot</p>
      </div>
    )
  }

  if (loadError || !data) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6 text-center">
        <p className="text-4xl">⚠️</p>
        <p className="mt-4 text-xl font-bold text-gpcl-900">Couldn’t load cash</p>
        <p className="mt-2 max-w-sm text-sm text-gpcl-800/80">
          {loadError ?? 'Cash dashboard file is missing or invalid.'}
        </p>
        <p className="mt-4 max-w-sm text-xs text-gpcl-800/60">
          Expected <code className="rounded bg-gpcl-100 px-1">cash-dashboard.json</code>. Tell App
          Developer “refresh the dashboard”.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-2xl bg-gpcl-700 px-5 py-3 text-sm font-bold text-white"
        >
          Try again
        </button>
      </div>
    )
  }

  return <Dashboard data={data} />
}

function Dashboard({ data }: { data: CashDashboard }) {
  const categories = useMemo(() => sortCategories(data.categories), [data.categories])
  const maxCategory = Math.max(0, ...categories.map((c) => c.total))
  const profitNegative = data.netCashProfit < 0
  const profitPositive = data.netCashProfit > 0

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="safe-top bg-gpcl-700 px-5 pb-5 pt-4 text-white">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg">
            🎄
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gpcl-200">
              Green Pastures
            </p>
            <p className="text-sm font-medium text-white/90">Owner</p>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">2026 season cash</h1>
        <p className="mt-1 text-base text-gpcl-100/90">Where are we financially?</p>
      </header>

      <main className="flex-1 space-y-4 px-4 py-4">
        <section
          className={`rounded-3xl bg-gradient-to-br p-5 text-white shadow-lg ${
            profitNegative
              ? 'from-rose-800 to-rose-950'
              : profitPositive
                ? 'from-gpcl-600 to-gpcl-900'
                : 'from-gpcl-700 to-gpcl-950'
          }`}
        >
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/75">
            Net Cash Profit
          </p>
          <p className="mt-2 text-5xl font-bold tracking-tight">
            {formatPay(data.netCashProfit)}
          </p>
          <p className="mt-3 text-sm text-white/80">
            Hard cash in minus hard cash out
            {data.cashMargin != null ? ` · margin ${formatMargin(data.cashMargin)}` : ''}
          </p>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <MetricTile
            icon={<Banknote size={18} />}
            label="Hard Revenue"
            value={formatPay(data.hardRevenue)}
          />
          <MetricTile
            icon={<Receipt size={18} />}
            label="Hard Expenses"
            value={formatPay(data.hardExpenses)}
            emphasize
          />
        </div>

        <section className="rounded-3xl border border-gpcl-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-gpcl-600">
            Spend by category
          </h2>
          <ul className="space-y-2.5">
            {categories.map((cat) => {
              const active = cat.total > 0
              const pct = maxCategory > 0 && active ? (cat.total / maxCategory) * 100 : 0
              return (
                <li
                  key={cat.name}
                  className={active ? '' : 'opacity-45'}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={`text-sm font-semibold ${active ? 'text-gpcl-950' : 'text-gpcl-800'}`}>
                      {cat.name}
                    </p>
                    <p className={`text-sm font-bold tabular-nums ${active ? 'text-gpcl-800' : 'text-gpcl-700'}`}>
                      {formatPay(cat.total)}
                    </p>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gpcl-100">
                    <div
                      className={`h-full rounded-full ${active ? 'bg-gpcl-600' : 'bg-transparent'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="rounded-3xl border border-gpcl-100 bg-white p-5 shadow-sm">
          <h2 className="mb-1 flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.12em] text-gpcl-600">
            <House size={16} /> Open jobs
          </h2>
          <p className="mb-3 text-sm text-gpcl-800/70">Quoted vs collected</p>
          {data.jobs.length === 0 ? (
            <p className="text-gpcl-800/70">No open jobs in this snapshot.</p>
          ) : (
            <ul className="space-y-4">
              {data.jobs.map((job) => {
                const collectedPct =
                  job.quotedRevenue > 0
                    ? Math.min(100, (job.revenueCollected / job.quotedRevenue) * 100)
                    : 0
                return (
                  <li key={job.quoteId} className="border-t border-gpcl-100 pt-4 first:border-t-0 first:pt-0">
                    <p className="font-semibold text-gpcl-950">{job.customer}</p>
                    <p className="text-sm text-gpcl-800/70">{job.address}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gpcl-600">
                          Quoted
                        </p>
                        <p className="text-lg font-bold text-gpcl-900">
                          {formatPay(job.quotedRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gpcl-600">
                          Collected
                        </p>
                        <p className="text-lg font-bold text-gpcl-900">
                          {formatPay(job.revenueCollected)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gpcl-100">
                      <div
                        className="h-full rounded-full bg-gpcl-600"
                        style={{ width: `${collectedPct}%` }}
                      />
                    </div>
                    {job.notes ? (
                      <p className="mt-2 text-sm text-gpcl-800/75">{job.notes}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] font-medium tracking-wide text-gpcl-800/50">
                      {job.quoteId}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-gpcl-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-gpcl-600">
            Recent cash moves
          </h2>
          {data.recentTransactions.length === 0 ? (
            <p className="text-gpcl-800/70">No cash moves yet this season.</p>
          ) : (
            <ul className="divide-y divide-gpcl-100">
              {data.recentTransactions.map((txn, i) => {
                const inflow = txn.moneyIn > 0
                return (
                  <li key={`${txn.date}-${txn.vendor}-${i}`} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-gpcl-600">
                        {formatTxnDate(txn.date)} · {txn.type}
                      </p>
                      <p className="mt-0.5 font-semibold text-gpcl-950">{txn.vendor}</p>
                      <p className="text-sm text-gpcl-800/70">{txn.description}</p>
                      <p className="text-xs text-gpcl-800/50">{txn.category}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`flex items-center justify-end gap-0.5 text-lg font-bold tabular-nums ${
                          inflow ? 'text-gpcl-700' : 'text-rose-800'
                        }`}
                      >
                        {inflow ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {formatPay(inflow ? txn.moneyIn : txn.moneyOut)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-gpcl-100 bg-warm-50 p-5">
          <p className="text-sm leading-relaxed text-gpcl-900">
            <strong>Hard</strong> = cash actually in or out. Quoted is not revenue until collected.
          </p>
          <p className="mt-2 text-sm text-gpcl-800/80">
            Source: Cash Tracker
            {data.syncedFrom ? ` (${data.syncedFrom})` : ''}.
            Synced {formatSyncedAt(data.syncedAt)}.
          </p>
          <p className="mt-3 flex items-start gap-2 text-sm text-gpcl-800/80">
            <RefreshCw size={16} className="mt-0.5 shrink-0 text-gpcl-600" />
            <span>
              To refresh this view, tell App Developer <strong>“refresh the dashboard”</strong>.
            </span>
          </p>
        </section>
      </main>

      <footer className="safe-bottom px-6 pb-8 pt-2">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-gpcl-gold" />
          <span className="text-sm font-bold tracking-[0.28em] text-gpcl-red">GPCL</span>
          <span className="h-px flex-1 bg-gpcl-gold" />
        </div>
      </footer>
    </div>
  )
}

function MetricTile({
  icon,
  label,
  value,
  emphasize,
}: {
  icon: ReactNode
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div className="rounded-3xl border border-gpcl-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5 text-gpcl-600">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${emphasize ? 'text-rose-800' : 'text-gpcl-900'}`}>
        {value}
      </p>
    </div>
  )
}

function sortCategories(categories: CategorySpend[]): CategorySpend[] {
  return [...categories].sort((a, b) => {
    const aActive = a.total > 0 ? 1 : 0
    const bActive = b.total > 0 ? 1 : 0
    if (aActive !== bActive) return bActive - aActive
    return b.total - a.total
  })
}
