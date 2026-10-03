import type { CashDashboard, PlannedJob } from '../types'

export interface PlannedTotals {
  /** ACTUAL */
  collectedSoFar: number
  expensesToDate: number
  netToday: number
  /** PLANNED */
  stillExpected: number
  plannedRevenue: number
  plannedCrewPay: number
  crewPaidSoFar: number
  crewStillToPay: number
  plannedToAustin: number
  /** Materials planned for jobs but not bought yet (bought ones are already in expenses). */
  materialsStillToBuy: number
  /** Monthly costs (Netlify, insurance…) for months after the last one posted, through the last install month. */
  recurringAhead: number
  recurringThroughMonth: string
  recurringItems: { label: string; monthly: number; months: number; amount: number }[]
  insuranceInTracker: boolean
  /** Booked taxable installs whose materials are not in the tracker yet (so they are not counted). */
  jobsMissingMaterials: number
  jobsMissingMaterialsNames: string[]
  /** Booked jobs with no quoted amount ($0 quote): they add no revenue yet. */
  zeroQuoteJobNames: string[]
  /** Plain-English list of what is NOT counted in the projection yet. */
  notCounted: string[]
  projectedBottomLine: number
  /** Sales tax: liability, never income. */
  salesTaxTotalExpected: number
  salesTaxStillToCollect: number
  salesTaxHeld: number
  jobCount: number
  missingCrewPay: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Pay assigned to Austin (owner) on a job. His income is profit, not a cost. */
export function ownerPay(job: PlannedJob): number {
  return round2(job.ownerPay || 0)
}

/** Crew pay that is a real cost: planned pay EXCLUDING Austin. null when no policy row. */
export function crewCost(job: PlannedJob): number | null {
  if (job.crewPay == null) return null
  return round2(Math.max(0, job.crewPay - ownerPay(job)))
}

/** Materials cost for a job: whichever is bigger of what is planned and what is already bought. */
export function materialsCost(job: PlannedJob): number {
  return round2(Math.max(job.materialsPlanned || 0, job.materialsBought || 0))
}

/** Thumbtack lead fee / other direct job cost already logged against this job. */
export function leadFee(job: PlannedJob): number {
  return round2(job.otherDirect || 0)
}

/** True when GPCL sells the lights (taxable install) but no materials are in the tracker yet. */
export function materialsPending(job: PlannedJob): boolean {
  return job.taxable && job.quotedPreTax > 0 && materialsCost(job) === 0
}

/**
 * GPCL keeps (profit) = quoted pre-tax − crew pay (EXCLUDING Austin: his pay stays in profit)
 * − materials − lead fee. null when there is no crew pay row for the job.
 */
export function gpclKeeps(job: PlannedJob): number | null {
  const cost = crewCost(job)
  if (cost == null) return null
  return round2(job.quotedPreTax - cost - materialsCost(job) - leadFee(job))
}

/** Margin as a fraction of quoted revenue; null when nothing was quoted. */
export function marginPct(job: PlannedJob): number | null {
  const keeps = gpclKeeps(job)
  if (keeps == null || !(job.quotedPreTax > 0)) return null
  return keeps / job.quotedPreTax
}

/** Sales tax on this job that has not been collected yet. */
export function taxStillDue(job: PlannedJob): number {
  return round2(Math.max(0, (job.salesTaxExpected || 0) - (job.salesTaxCollected || 0)))
}

/** What the customer still owes: unpaid pre-tax amount + unpaid sales tax. */
export function balanceDue(job: PlannedJob): number {
  return round2((job.stillExpected || 0) + taxStillDue(job))
}

export interface JobColumnTotals {
  quoted: number
  crew: number
  materials: number
  leadFees: number
  keeps: number
}

/** Column totals for the per-job table (jobs with no crew pay row count as $0 crew and are left out of keeps). */
export function jobColumnTotals(jobs: PlannedJob[]): JobColumnTotals {
  return {
    quoted: round2(jobs.reduce((s, j) => s + (j.quotedPreTax || 0), 0)),
    crew: round2(jobs.reduce((s, j) => s + (crewCost(j) ?? 0), 0)),
    materials: round2(jobs.reduce((s, j) => s + materialsCost(j), 0)),
    leadFees: round2(jobs.reduce((s, j) => s + leadFee(j), 0)),
    keeps: round2(jobs.reduce((s, j) => s + (gpclKeeps(j) ?? 0), 0)),
  }
}

function monthIndex(ym: string): number | null {
  const m = /^(\d{4})-(\d{2})/.exec(ym || '')
  return m ? Number(m[1]) * 12 + Number(m[2]) - 1 : null
}

/**
 * Projected bottom line = actual collected + still-expected (pre-tax)
 *   − crew pay not yet paid (EXCLUDING Austin, whose pay counts as profit)
 *   − planned materials not yet bought
 *   − recurring monthly costs still to come (through the month of the last booked job)
 *   − expenses to date.
 * Sales tax is a liability and is never included. Anything not in the Cash Tracker yet
 * (e.g. materials Bookkeeper has not added, insurance) is NOT guessed; the page says so.
 */
export function computePlanned(data: CashDashboard): PlannedTotals | null {
  const jobs = data.plannedIncome?.jobs
  if (!Array.isArray(jobs) || jobs.length === 0) return null

  const stillExpected = round2(jobs.reduce((s, j) => s + (j.stillExpected || 0), 0))
  const plannedCrewPay = round2(jobs.reduce((s, j) => s + (crewCost(j) ?? 0), 0))
  const plannedToAustin = round2(jobs.reduce((s, j) => s + ownerPay(j), 0))
  const crewPaidSoFar = data.categories.find((c) => /subcontract/i.test(c.name))?.total ?? 0
  const crewStillToPay = round2(Math.max(0, plannedCrewPay - crewPaidSoFar))
  const plannedRevenue = round2(data.hardRevenue + stillExpected)

  const materialsStillToBuy = round2(
    jobs.reduce((s, j) => s + Math.max(0, (j.materialsPlanned || 0) - (j.materialsBought || 0)), 0),
  )

  const lastInstall = jobs
    .map((j) => j.installDate)
    .filter((d) => /^\d{4}-\d{2}/.test(d))
    .sort()
    .pop()
  const endIdx = monthIndex(lastInstall ?? '')
  const recurringItems = (data.recurring ?? []).map((r) => {
    const last = monthIndex(r.lastPostedMonth)
    const months = endIdx != null && last != null ? Math.max(0, endIdx - last) : 0
    return { label: r.label, monthly: r.monthly, months, amount: round2(r.monthly * months) }
  })
  const recurringAhead = round2(recurringItems.reduce((s, r) => s + r.amount, 0))

  const projectedBottomLine = round2(
    plannedRevenue - crewStillToPay - materialsStillToBuy - recurringAhead - data.hardExpenses,
  )

  const insuranceInTracker = (data.recurring ?? []).some((r) => r.kind === 'insurance')
  const missingMaterialsJobs = jobs.filter(materialsPending)
  const zeroQuoteJobNames = jobs.filter((j) => !(j.quotedPreTax > 0)).map((j) => j.name)
  const notCounted: string[] = []
  if (!insuranceInTracker) notCounted.push('insurance (no recurring entry in the tracker)')
  if (missingMaterialsJobs.length > 0)
    notCounted.push(
      `materials for ${missingMaterialsJobs.length} taxable install${missingMaterialsJobs.length === 1 ? '' : 's'} (${missingMaterialsJobs.map((j) => j.name).join(', ')})`,
    )
  for (const name of zeroQuoteJobNames) notCounted.push(`${name} has a $0 quote (adds no revenue)`)

  const salesTaxTotalExpected = round2(jobs.reduce((s, j) => s + (j.salesTaxExpected || 0), 0))
  const salesTaxStillToCollect = round2(jobs.reduce((s, j) => s + taxStillDue(j), 0))

  return {
    collectedSoFar: data.hardRevenue,
    expensesToDate: data.hardExpenses,
    netToday: data.netCashProfit,
    stillExpected,
    plannedRevenue,
    plannedCrewPay,
    crewPaidSoFar,
    crewStillToPay,
    plannedToAustin,
    materialsStillToBuy,
    recurringAhead,
    recurringThroughMonth: lastInstall ? lastInstall.slice(0, 7) : '',
    recurringItems,
    insuranceInTracker,
    jobsMissingMaterials: missingMaterialsJobs.length,
    jobsMissingMaterialsNames: missingMaterialsJobs.map((j) => j.name),
    zeroQuoteJobNames,
    notCounted,
    projectedBottomLine,
    salesTaxTotalExpected,
    salesTaxStillToCollect,
    salesTaxHeld: data.salesTaxHeld ?? 0,
    jobCount: jobs.length,
    missingCrewPay: jobs.filter((j) => j.crewPay == null).length,
  }
}
