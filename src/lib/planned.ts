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

export function gpclKeeps(job: PlannedJob): number | null {
  if (job.crewPay == null) return null
  return round2(job.quotedPreTax - job.crewPay)
}

/**
 * Projected bottom line = actual collected + still-expected (pre-tax) - crew pay not yet paid
 * - expenses to date. Sales tax is a liability and is never included.
 * Crew already paid shows up in hard expenses (Subcontract Labor), so it is subtracted from the
 * planned crew pay to avoid counting it twice.
 */
export function computePlanned(data: CashDashboard): PlannedTotals | null {
  const jobs = data.plannedIncome?.jobs
  if (!Array.isArray(jobs) || jobs.length === 0) return null

  const stillExpected = round2(jobs.reduce((s, j) => s + (j.stillExpected || 0), 0))
  const plannedCrewPay = round2(jobs.reduce((s, j) => s + (j.crewPay ?? 0), 0))
  const plannedToAustin = round2(
    jobs.reduce(
      (s, j) =>
        s +
        (j.crewPayees ?? [])
          .filter((p) => p.name.toLowerCase() === 'austin')
          .reduce((a, p) => a + p.amount, 0),
      0,
    ),
  )
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
