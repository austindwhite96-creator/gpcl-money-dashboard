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
  projectedBottomLine: number
  salesTaxExcluded: number
  jobCount: number
  missingCrewPay: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

const isOwner = (name: string) => /^austin\b/i.test(name.trim())

/** Pay assigned to Austin (owner) on a job. His income is profit, not a cost. */
export function ownerPay(job: PlannedJob): number {
  return round2(
    (job.crewPayees ?? []).filter((p) => isOwner(p.name)).reduce((a, p) => a + p.amount, 0),
  )
}

/** Crew pay that is a real cost: planned pay EXCLUDING Austin. null when no policy row. */
export function crewCost(job: PlannedJob): number | null {
  if (job.crewPay == null) return null
  return round2(Math.max(0, job.crewPay - ownerPay(job)))
}

/** GPCL keeps (profit) = quoted pre-tax - crew pay excluding Austin (his pay stays in profit). */
export function gpclKeeps(job: PlannedJob): number | null {
  const cost = crewCost(job)
  if (cost == null) return null
  return round2(job.quotedPreTax - cost)
}

/**
 * Projected bottom line = actual collected + still-expected (pre-tax) - crew pay not yet paid
 * (EXCLUDING Austin, whose pay counts as profit) - expenses to date. Sales tax is a liability and is never included.
 * Crew already paid shows up in hard expenses (Subcontract Labor), so it is subtracted from the
 * planned crew pay to avoid counting it twice.
 */
export function computePlanned(data: CashDashboard): PlannedTotals | null {
  const jobs = data.plannedIncome?.jobs
  if (!Array.isArray(jobs) || jobs.length === 0) return null

  const stillExpected = round2(jobs.reduce((s, j) => s + (j.stillExpected || 0), 0))
  // Austin (owner) pay is profit, not a cost: planned crew pay excludes it.
  const plannedCrewPay = round2(jobs.reduce((s, j) => s + (crewCost(j) ?? 0), 0))
  const plannedToAustin = round2(jobs.reduce((s, j) => s + ownerPay(j), 0))
  const crewPaidSoFar = data.categories.find((c) => /subcontract/i.test(c.name))?.total ?? 0
  const crewStillToPay = round2(Math.max(0, plannedCrewPay - crewPaidSoFar))
  const plannedRevenue = round2(data.hardRevenue + stillExpected)
  const projectedBottomLine = round2(
    plannedRevenue - crewStillToPay - data.hardExpenses,
  )

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
    projectedBottomLine,
    salesTaxExcluded: round2(jobs.reduce((s, j) => s + (j.salesTaxExpected || 0), 0)),
    jobCount: jobs.length,
    missingCrewPay: jobs.filter((j) => j.crewPay == null).length,
  }
}
