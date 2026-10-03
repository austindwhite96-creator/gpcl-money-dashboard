import type { ReactNode } from 'react'
import { TrendingUp } from 'lucide-react'
import { formatMargin, formatMoney } from '../lib/money'
import { dateSortKey, formatTxnDate } from '../lib/dates'
import {
  balanceDue,
  computePlanned,
  crewCost,
  gpclKeeps,
  jobColumnTotals,
  leadFee,
  marginPct,
  materialsCost,
  materialsPending,
  ownerPay,
  taxStillDue,
} from '../lib/planned'
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

function Note({ children }: { children: ReactNode }) {
  return <p className="-mt-0.5 pb-1 text-xs italic leading-snug text-gpcl-800/60">{children}</p>
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m) return ym
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
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
  const sortedJobs = [...planned.jobs].sort((a, b) =>
    dateSortKey(a.installDate).localeCompare(dateSortKey(b.installDate)),
  )
  const negative = totals.projectedBottomLine < 0
  const colTotals = jobColumnTotals(planned.jobs)
  const billsLabel = totals.recurringItems.length
    ? totals.recurringItems.map((r) => r.label).join(', ')
    : 'none'

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
          {formatMoney(totals.projectedBottomLine)}
        </p>
        <p className="mt-1 text-sm text-white/80">
          After all {totals.jobCount} booked jobs are collected and paid for: crew, materials and
          monthly bills included. Net today (collected − spent) is{' '}
          {formatMoney(totals.netToday)}.
        </p>
      </div>

      {/* The math, line by line */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
        <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-amber-900">
          The math, line by line <Pill kind="planned" />
        </p>
        <Row label="Collected so far" value={formatMoney(totals.collectedSoFar)} />
        <Row label="+ Still to come from jobs" value={formatMoney(totals.stillExpected)} />
        <div className="border-t border-amber-200">
          <Row label="= Planned revenue" value={formatMoney(totals.plannedRevenue)} bold />
        </div>
        <Row
          label="− Crew pay still to pay (not counting Austin)"
          value={`−${formatMoney(totals.crewStillToPay)}`}
        />
        <Note>
          Crew pay planned {formatMoney(totals.plannedCrewPay)} − already paid{' '}
          {formatMoney(totals.crewPaidSoFar)}. Austin&apos;s own pay{' '}
          {formatMoney(totals.plannedToAustin)} is not subtracted: it counts as profit.
        </Note>
        <Row
          label="− Planned materials still to buy"
          value={`−${formatMoney(totals.materialsStillToBuy)}`}
        />
        <Row
          label={`− Recurring bills ahead (${billsLabel})`}
          value={`−${formatMoney(totals.recurringAhead)}`}
        />
        {totals.recurringItems.length > 0 ? (
          <Note>
            {totals.recurringItems
              .map(
                (r) =>
                  `${r.label} ${formatMoney(r.monthly)}/mo × ${r.months} month${r.months === 1 ? '' : 's'}`,
              )
              .join('; ')}
            {totals.recurringThroughMonth ? ` (through ${formatMonth(totals.recurringThroughMonth)})` : ''}
          </Note>
        ) : null}
        <Row label="− Spent to date" value={`−${formatMoney(totals.expensesToDate)}`} />
        <div className="mt-1 border-t border-amber-200 pt-1">
          <Row
            label="= Projected bottom line"
            value={formatMoney(totals.projectedBottomLine)}
            bold
            negative={negative}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-gpcl-800/75">
          <strong>Not counted yet:</strong>{' '}
          {totals.notCounted.length > 0 ? `${totals.notCounted.join('; ')}.` : 'nothing known.'}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-gpcl-800/75">
          Revenue is before sales tax. Sales tax is owed to the state, so it is <strong>not</strong>{' '}
          counted as income: {formatMoney(totals.salesTaxStillToCollect)} still to collect (of{' '}
          {formatMoney(totals.salesTaxTotalExpected)} total expected on these jobs).
        </p>
      </div>

      {/* Per job */}
      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-gpcl-700">
          Job by job: what GPCL keeps <Pill kind="planned" />
        </p>
        <ul className="space-y-3">
          {sortedJobs.map((job) => {
            const keeps = gpclKeeps(job)
            const margin = marginPct(job)
            const mats = materialsCost(job)
            const fee = leadFee(job)
            const due = balanceDue(job)
            const taxDue = taxStillDue(job)
            return (
              <li key={job.id} className="rounded-2xl border border-gpcl-100 p-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gpcl-950">{job.name}</p>
                    <p className="text-xs text-gpcl-800/60">
                      {job.installDate ? `Install ${formatTxnDate(job.installDate)}` : 'Install date TBD'}
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
                <div className="mt-2 grid grid-cols-5 gap-1 text-center">
                  {[
                    ['Quoted', formatMoney(job.quotedPreTax), false],
                    ['− Crew', crewCost(job) == null ? '—' : formatMoney(crewCost(job) as number), false],
                    ['− Materials', formatMoney(mats), false],
                    ['− Lead fee', formatMoney(fee), false],
                    ['= Keeps', keeps == null ? '—' : formatMoney(keeps), true],
                  ].map(([label, value, strong]) => (
                    <div key={label as string} className={strong ? 'rounded-lg bg-gpcl-50 py-0.5' : 'py-0.5'}>
                      <p className="text-[9px] font-bold uppercase tracking-[0.04em] text-gpcl-600">
                        {label}
                      </p>
                      <p className="text-[12px] font-bold tabular-nums text-gpcl-900">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-gpcl-800/60">
                  Quoted is before sales tax.
                  {margin != null ? ` GPCL keeps ${formatMargin(margin)} of the quote.` : ''}
                  {ownerPay(job) > 0 ? ` Austin's ${formatMoney(ownerPay(job))} is not in Crew: it stays in profit.` : ''}
                </p>
                <p className="mt-1 text-xs text-gpcl-800/70">
                  {due > 0 ? (
                    <>
                      <strong>Balance due {formatMoney(due)}</strong>
                      {taxDue > 0 ? ` (includes ${formatMoney(taxDue)} sales tax)` : ''}
                    </>
                  ) : (
                    'Nothing left to collect'
                  )}
                  {job.deposit > 0 ? ` · deposit ${formatMoney(job.deposit)}` : ''}
                </p>
                {materialsPending(job) || job.flags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {materialsPending(job) ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900 ring-1 ring-amber-200">
                        ⚠ Materials not in the tracker yet - keeps may be too high
                      </span>
                    ) : null}
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
        <div className="mt-3 rounded-2xl bg-gpcl-50 p-2.5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-gpcl-700">
            All {totals.jobCount} jobs together
          </p>
          <div className="mt-1 grid grid-cols-5 gap-1 text-center">
            {[
              ['Quoted', colTotals.quoted],
              ['− Crew', colTotals.crew],
              ['− Materials', colTotals.materials],
              ['− Lead fee', colTotals.leadFees],
              ['= Keeps', colTotals.keeps],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-[9px] font-bold uppercase tracking-[0.04em] text-gpcl-600">{label}</p>
                <p className="text-[12px] font-bold tabular-nums text-gpcl-900">
                  {formatMoney(value as number)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-gpcl-800/60">
            Before overhead (ads, tools, permits, bills). Materials include ones already bought.
          </p>
        </div>
        {totals.missingCrewPay > 0 ? (
          <p className="mt-2 text-xs text-rose-800">
            {totals.missingCrewPay} job(s) have no crew pay in the policy yet — counted as $0.
          </p>
        ) : null}
        <p className="mt-2 text-xs text-gpcl-800/60">
          Planned = quotes and crew pay policy, not cash. Keeps = quoted − crew pay − materials − lead
          fee. Austin&apos;s pay is not a cost: it stays in GPCL keeps / profit.
        </p>
      </div>
    </section>
  )
}
