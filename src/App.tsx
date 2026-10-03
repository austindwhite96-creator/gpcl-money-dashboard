import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Landmark,
  House,
  Receipt,
} from 'lucide-react'
import { loadCashDashboard, UnauthorizedError } from './data/cashDashboard'
import { captureKeyFromUrl, clearKey, extractKey, getStoredKey, saveKey } from './lib/accessKey'
import { formatMargin, formatMoney } from './lib/money'
import { dateSortKey, formatSyncedAt, formatTxnDate } from './lib/dates'
import { PlannedIncome } from './components/PlannedIncome'
import type { CashDashboard, CategorySpend } from './types'

type Phase =
  | { kind: 'loading' }
  | { kind: 'needKey'; message?: string }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: CashDashboard }

export default function App() {
  const [phase, setPhase] = useState<Phase>(() =>
    getStoredKey() ? { kind: 'loading' } : { kind: 'needKey' },
  )
  const [attempt, setAttempt] = useState(0)
  const retry = () => {
    setPhase({ kind: 'loading' })
    setAttempt((n) => n + 1)
  }

  // A personal link opened while the page is already open (#k=…) is saved and scrubbed too.
  useEffect(() => {
    const onHash = () => {
      if (captureKeyFromUrl()) {
        setPhase({ kind: 'loading' })
        setAttempt((n) => n + 1)
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    let cancelled = false
    const key = getStoredKey()
    if (!key) return
    loadCashDashboard(key)
      .then((dash) => {
        if (!cancelled) setPhase({ kind: 'ready', data: dash })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof UnauthorizedError) {
          clearKey()
          setPhase({ kind: 'needKey', message: 'That key did not work. Check it and try again.' })
          return
        }
        const message = err instanceof Error ? err.message : 'Couldn’t load the money page.'
        setPhase({ kind: 'error', message })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  if (phase.kind === 'loading') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6 text-center">
        <p className="text-4xl">🎄</p>
        <p className="mt-4 text-xl font-bold text-gpcl-900">Loading…</p>
      </div>
    )
  }

  if (phase.kind === 'needKey') {
    return (
      <AccessPrompt
        message={phase.message}
        onSubmit={(raw) => {
          const token = extractKey(raw)
          if (!token) return 'That does not look like an access key.'
          saveKey(token)
          retry()
          return null
        }}
      />
    )
  }

  if (phase.kind === 'error') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6 text-center">
        <p className="text-4xl">⚠️</p>
        <p className="mt-4 text-xl font-bold text-gpcl-900">Couldn’t load cash</p>
        <p className="mt-2 max-w-sm text-sm text-gpcl-800/80">{phase.message}</p>
        <button
          type="button"
          onClick={retry}
          className="mt-6 rounded-2xl bg-gpcl-700 px-5 py-3 text-sm font-bold text-white"
        >
          Try again
        </button>
      </div>
    )
  }

  return <Dashboard data={phase.data} />
}

function AccessPrompt({
  message,
  onSubmit,
}: {
  message?: string
  onSubmit: (raw: string) => string | null
}) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(message ?? null)
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6 text-center">
      <p className="text-4xl">🔒</p>
      <h1 className="mt-4 text-2xl font-bold text-gpcl-900">Enter access key</h1>
      <p className="mt-2 max-w-sm text-sm text-gpcl-800/80">
        This page is private. Paste your access key (or your personal link) to open it.
      </p>
      <form
        className="mt-6 flex w-full max-w-sm flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          setError(onSubmit(value))
        }}
      >
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Access key"
          placeholder="Access key"
          className="w-full rounded-2xl border border-gpcl-200 bg-white px-4 py-3 text-base text-gpcl-950 outline-none focus:border-gpcl-600"
        />
        {error ? <p className="text-sm text-rose-800">{error}</p> : null}
        <button
          type="submit"
          className="rounded-2xl bg-gpcl-700 px-5 py-3 text-sm font-bold text-white"
        >
          Open
        </button>
      </form>
    </div>
  )
}

function Dashboard({ data }: { data: CashDashboard }) {
  const categories = useMemo(() => sortCategories(data.categories), [data.categories])
  const openJobs = useMemo(
    () => [...data.jobs].sort((a, b) => dateSortKey(a.jobDate).localeCompare(dateSortKey(b.jobDate))),
    [data.jobs],
  )
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
            {formatMoney(data.netCashProfit)}
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
            value={formatMoney(data.hardRevenue)}
          />
          <MetricTile
            icon={<Receipt size={18} />}
            label="Hard Expenses"
            value={formatMoney(data.hardExpenses)}
            emphasize
          />
        </div>

        {data.salesTaxHeld != null ? (
          <div className="rounded-3xl border border-gpcl-100 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-1.5 text-gpcl-600">
              <Landmark size={18} />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
                Held for the state
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight text-gpcl-900">
              {formatMoney(data.salesTaxHeld)}
            </p>
            <p className="mt-1 text-xs text-gpcl-800/70">
              Sales tax collected from customers that we owe the state. It is not our money and not
              counted in profit.
            </p>
          </div>
        ) : null}

        <PlannedIncome data={data} />

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
                      {formatMoney(cat.total)}
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
            <p className="text-gpcl-800/70">No open jobs right now.</p>
          ) : (
            <ul className="space-y-4">
              {openJobs.map((job) => {
                const collectedPct =
                  job.quotedRevenue > 0
                    ? Math.min(100, (job.revenueCollected / job.quotedRevenue) * 100)
                    : 0
                return (
                  <li key={job.id} className="border-t border-gpcl-100 pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gpcl-950">{job.name}</p>
                        <p className="text-sm text-gpcl-800/70">
                          {job.jobDate ? formatTxnDate(job.jobDate) : 'Date TBD'}
                        </p>
                      </div>
                      <p
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          job.status === 'Paid in full'
                            ? 'bg-gpcl-100 text-gpcl-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {job.status}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gpcl-600">
                          Quoted
                        </p>
                        <p className="text-lg font-bold text-gpcl-900">
                          {formatMoney(job.quotedRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gpcl-600">
                          Collected
                        </p>
                        <p className="text-lg font-bold text-gpcl-900">
                          {formatMoney(job.revenueCollected)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gpcl-100">
                      <div
                        className="h-full rounded-full bg-gpcl-600"
                        style={{ width: `${collectedPct}%` }}
                      />
                    </div>
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
                        {formatMoney(inflow ? txn.moneyIn : txn.moneyOut)}
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
            <strong>Hard</strong> = cash actually in or out. Quoted is not revenue until collected. <strong>Planned</strong> = what we expect once booked jobs are done.
          </p>
          <p className="mt-2 text-sm text-gpcl-800/80">
            Source: Cash Tracker. Updated {formatSyncedAt(data.syncedAt)}.
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
