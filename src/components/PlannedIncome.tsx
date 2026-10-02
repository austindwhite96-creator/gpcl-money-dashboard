import { TrendingUp } from 'lucide-react'
import { formatPay, formatPayExact } from '../lib/money'
import { formatTxnDate } from '../lib/dates'
import { computePlanned, crewCost, gpclKeeps, ownerPay } from '../lib/planned'
import type { CashDashboard } from '../types'

function Pill({ kind }: { kind: 'actual' | 'planned' }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
        kind === 'actual' ? 'bg-gpcl-100 text-gpcl-800' : 'bg-amber-100 text-amber-900'
      }`}
    >
      {kind}
    </span>
  )
}

function Row({
  label,
  value,
  bold,
  muted,
  negative,
}: {
  label: string
  value: string
  bold?: boolean
  muted?: boolean
  negative?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <p className={`text-sm ${bold ? 'font-bold text-gpcl-950' : muted ? 'text-gpcl-800/60' : 'text-gpcl-900'}`}>
        {label}
      </p>
      <p
        className={`tabular-nums ${bold ? 'text-base font-bold' : 'text-sm font-semibold'} ${
          negative ? 'text-rose-800' : muted ? 'text-gpcl-800/60' : 'text-gpcl-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export function PlannedIncome({ data }: { data: CashDashboard }) {
  const planned = data.plannedIncome
  // Older feed / snapshot without plannedIncome: show nothing, rest of the page is unaffected.
  if (!planned) return null

  const totals = computePlanned(data)
  if (!totals) {
    return planned.error ? (
      <section className="rounded-3xl border border-gpcl-100 bg-white p-5 text-sm text-gpcl-800/70 shadow-sm">
        Planned income is temporarily unavailable.
      </section>
    ) : null
  }
  const jobs = planned.jobs
  const negative = totals.projectedBottomLine < 0

  return (
    <section className="space-y-3 rounded-3xl border border-gpcl-100 bg-white p-5 shadow-sm">
      <div>
        <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.12em] text-gpcl-600">
          <TrendingUp size={16} /> Planned income
        </h2>
        <p className="mt-1 text-sm text-gpcl-800/70">
          Where we are now, and where we land once the {totals.jobCount} booked jobs are done.
        </p>
      </div>

      {/* Where we are now */}
      <div className="rounded-2xl bg-gpcl-50 p-4">
        <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-gpcl-700">
          Where we are today <Pill kind="actual" />
        </p>
        <Row label="Collected so far" value={formatPayExact(totals.collectedSoFar)} />
        <Row label="Expenses so far" value={`−${formatPayExact(totals.expensesToDate)}`} />
        <div className="mt-1 border-t border-gpcl-200 pt-1">
          <Row
            label="Net today"
            value={formatPayExact(totals.netToday)}
            bold
            negative={totals.netToday < 0}
          />
        </div>
      </div>

      {/* Bottom line */}
      <div
        className={`rounded-2xl p-4 text-white ${
          negative ? 'bg-gradient-to-br from-rose-800 to-rose-950' : 'bg-gradient-to-br from-gpcl-600 to-gpcl-900'
        }`}
      >
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/80">
          Projected bottom line
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
            PLANNED
          </span>
        </p>
        <p className="mt-1 text-4xl font-bold tracking-tight">
          {formatPayExact(totals.projectedBottomLine)}
        </p>
        <p className="mt-1 text-sm text-white/80">
          After all {totals.jobCount} booked jobs are collected and crew is paid.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
        <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-amber-900">
          How we get there <Pill kind="planned" />
        </p>
        <Row label="Collected so far (actual)" value={formatPayExact(totals.collectedSoFar)} />
        <Row label="+ Still expected from jobs" value={formatPayExact(totals.stillExpected)} />
        <Row label="= Planned total revenue" value={formatPayExact(totals.plannedRevenue)} bold />
        <Row
          label="− Planned crew pay"
          value={`−${formatPayExact(totals.crewStillToPay)}`}
        />
        <p className="-mt-0.5 pb-1 text-xs italic text-gpcl-800/60">
          Austin&apos;s pay counted as profit
          {totals.plannedToAustin > 0 ? ` (${formatPayExact(totals.plannedToAustin)} not subtracted)` : ''}
        </p>
        {totals.crewPaidSoFar > 0 ? (
          <Row
            label="(crew already paid is in expenses)"
            value={formatPayExact(totals.crewPaidSoFar)}
            muted
          />
        ) : null}
        <Row label="− Expenses to date (actual)" value={`−${formatPayExact(totals.expensesToDate)}`} />
        <div className="mt-1 border-t border-amber-200 pt-1">
          <Row
            label="= Projected bottom line"
            value={formatPayExact(totals.projectedBottomLine)}
            bold
            negative={negative}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-gpcl-800/75">
          Revenue is before sales tax. Sales tax
          {totals.salesTaxExcluded > 0 ? ` (about ${formatPayExact(totals.salesTaxExcluded)} expected)` : ''} is
          owed to the state, so it is <strong>not</strong> counted as income. No new expenses beyond
          what is already logged are assumed.
        </p>
      </div>

      {/* Per job */}
      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-gpcl-700">
          Booked jobs <Pill kind="planned" />
        </p>
        <ul className="space-y-3">
          {jobs.map((job) => {
            const keeps = gpclKeeps(job)
            const done = job.stillExpected <= 0 && job.quotedPreTax > 0
            return (
              <li
                key={`${job.customer}-${job.address}`}
                className="rounded-2xl border border-gpcl-100 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gpcl-950">{job.customer}</p>
                    <p className="text-xs text-gpcl-800/60">
                      {job.installDate ? `Install ${formatTxnDate(job.installDate)}` : 'Install date TBD'}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      done ? 'bg-gpcl-100 text-gpcl-800' : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {done
                      ? 'Collected'
                      : job.collected > 0
                        ? `Collected ${formatPay(job.collected)}`
                        : 'Not collected yet'}
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gpcl-600">
                      Quoted
                    </p>
                    <p className="text-base font-bold tabular-nums text-gpcl-900">
                      {formatPay(job.quotedPreTax)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gpcl-600">
                      Crew pay
                    </p>
                    <p className="text-base font-bold tabular-nums text-gpcl-900">
                      {crewCost(job) == null ? '—' : formatPay(crewCost(job) as number)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gpcl-600">
                      GPCL keeps
                    </p>
                    <p className="text-base font-bold tabular-nums text-gpcl-900">
                      {keeps == null ? '—' : formatPay(keeps)}
                    </p>
                    {ownerPay(job) > 0 ? (
                      <p className="text-[10px] text-gpcl-800/60">incl. Austin {formatPay(ownerPay(job))}</p>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-xs text-gpcl-800/70">
                  Still expected {formatPayExact(job.stillExpected)}
                  {job.deposit > 0 ? ` · deposit ${formatPay(job.deposit)}` : ' · no deposit'}
                  {job.salesTaxExpected > 0
                    ? ` · + ${formatPayExact(job.salesTaxExpected)} sales tax (owed to state, not income)`
                    : ''}
                  {job.jobCosts > 0 ? ` · ${formatPayExact(job.jobCosts)} job cost already in expenses` : ''}
                </p>
                {job.flags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.flags.map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900 ring-1 ring-amber-200"
                      >
                        ⚠ {f}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
        {totals.missingCrewPay > 0 ? (
          <p className="mt-2 text-xs text-rose-800">
            {totals.missingCrewPay} job(s) have no crew pay in the policy yet — counted as $0.
          </p>
        ) : null}
        <p className="mt-2 text-xs text-gpcl-800/60">
          Planned = quotes and crew pay policy, not cash. “GPCL keeps” = quoted − crew pay, before
          overhead. Austin&apos;s pay is not a cost: it stays in GPCL keeps / profit.
        </p>
      </div>
    </section>
  )
}
