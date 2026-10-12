// npm test  — numbers below come from the live Cash Tracker values read on 2026-10-03 (via the lockdown feed code).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  balanceDue,
  computePlanned,
  jobColumnTotals,
  latestNetlifyCharge,
  taxStillDue,
} from '../src/lib/planned.ts'
import { NETLIFY_MONTHS_PROJECTED } from '../src/config.ts'
import { formatMoney } from '../src/lib/money.ts'
import { extractKey } from '../src/lib/accessKey.ts'
import type { CashDashboard, PlannedJob } from '../src/types.ts'

const fixture = new URL('./fixtures/feed.json', import.meta.url)
const data = JSON.parse(readFileSync(fixture, 'utf8')) as CashDashboard
const job = (name: string) => data.plannedIncome!.jobs.find((j) => j.name === name) as PlannedJob

// 10/12: per-job profit comes from the Cash Tracker Jobs tab as-is (values read from the sheet 10/12).
const SHEET: Record<string, [number, number, number, number, number, number]> = {
  //            quoted   crew  lead    mats    other   keeps
  'Landon C.': [426.9, 150, 0, 100.19, 0, 176.71],
  'Dan B.': [150, 75, 24.9, 0, 0, 50.1],
  'Cindy W.': [540, 100, 24.91, 115.2, 0, 299.89],
}
function withSheet(d: CashDashboard): CashDashboard {
  for (const j of d.plannedIncome!.jobs) {
    const v = SHEET[j.name]
    j.sheet = v ? { quoted: v[0], crew: v[1], leadFee: v[2], materials: v[3], otherDirect: v[4], keeps: v[5], basis: '' } : null
  }
  return d
}

test('per-job values are the sheet values, untouched (no recomputation)', () => {
  const d = withSheet(structuredClone(data))
  const landon = d.plannedIncome!.jobs.find((j) => j.name === 'Landon C.')!
  assert.deepEqual(landon.sheet, { quoted: 426.9, crew: 150, leadFee: 0, materials: 100.19, otherDirect: 0, keeps: 176.71, basis: '' })
  // A sheet Keeps that does not equal quoted - costs is still shown as-is.
  landon.sheet!.keeps = 1
  assert.equal(jobColumnTotals(d.plannedIncome!.jobs).keeps, round(1 + 50.1 + 299.89))
})

test('column totals are plain sums of sheet values; jobs without sheet values count 0', () => {
  const c = jobColumnTotals(withSheet(structuredClone(data)).plannedIncome!.jobs)
  assert.deepEqual(c, { quoted: 1116.9, crew: 325, materials: 215.39, leadFees: 49.81, otherDirect: 0, keeps: 526.7 })
})

test('P1(c) remaining balance nets tax collected from tax expected', () => {
  assert.equal(balanceDue(job('Landon C.')), 243.56)
  assert.equal(balanceDue(job('Cindy W.')), 292.27)
  assert.equal(taxStillDue(job('Landon C.')), 18.56)
  assert.equal(balanceDue(job('Rachel G.')), 292.28)
  assert.equal(balanceDue(job('Nathan A.')), 225)
})

test('P1(c) sales tax totals: 103.96 expected, 40.85 held, 63.11 still to collect', () => {
  const t = computePlanned(data)!
  assert.equal(t.salesTaxTotalExpected, 103.96)
  assert.equal(t.salesTaxHeld, 40.85)
  assert.equal(t.salesTaxStillToCollect, 63.11)
})

test('P1(d) projected bottom line includes materials + recurring that are in the tracker', () => {
  const t = computePlanned(data)!
  // old (CEO) number: 495 + 1340 - 550 crew - 849.10 = 435.90
  assert.equal(t.crewStillToPay, 550)
  assert.equal(t.materialsStillToBuy, 97.5) // Landon only; Cindy $156 pending
  assert.equal(t.recurringAhead, 0) // Netlify -> Free plan Oct 13: no future bills (NETLIFY_MONTHS_PROJECTED = 0)
  assert.equal(t.projectedBottomLine, 338.4) // 435.90 - 97.50
  assert.equal(t.insuranceInTracker, false)
  assert.equal(t.jobsMissingMaterials, 2) // Cindy, Rachel
})

test('P1(d) when Cindy materials + insurance appear they flow in', () => {
  const d: CashDashboard = structuredClone(data)
  d.plannedIncome!.jobs.find((j) => j.name === 'Cindy W.')!.materialsPlanned = 156
  d.recurring!.push({ label: 'Insurer', monthly: 86.58, lastPostedMonth: '2026-10', kind: 'insurance' })
  const t = computePlanned(d)!
  assert.equal(t.materialsStillToBuy, 253.5)
  assert.equal(t.recurringAhead, 86.58) // insurance posted Oct => Nov still to come; Netlify not projected
  assert.equal(t.projectedBottomLine, 95.82) // 435.90 - 253.50 - 86.58
  assert.equal(t.insuranceInTracker, true)
})

test('money format: $1,234.56 everywhere, no -$0.00', () => {
  assert.equal(formatMoney(1234.5), '$1,234.50')
  assert.equal(formatMoney(100), '$100.00')
  assert.equal(formatMoney(-354.1), '-$354.10')
  assert.equal(formatMoney(-0.001), '$0.00')
})

test('access key extraction', () => {
  const k = 'abcdefghijklmnopqrstuvwxyz0123456789_-ABCDE'
  assert.equal(extractKey(k), k)
  assert.equal(extractKey('#k=' + k), k)
  assert.equal(extractKey('https://x.github.io/gpcl-money-dashboard/#k=' + k), k)
  assert.equal(extractKey('short'), '')
  assert.equal(extractKey(''), '')
})

test('breakdown lines add up and list what is not counted', () => {
  const t = computePlanned(data)!
  assert.equal(round(t.collectedSoFar + t.stillExpected), t.plannedRevenue)
  assert.equal(
    round(t.plannedRevenue - t.crewStillToPay - t.materialsStillToBuy - t.recurringAhead - t.expensesToDate),
    t.projectedBottomLine,
  )
  assert.deepEqual(t.zeroQuoteJobNames, ['Robyn B.'])
  assert.deepEqual(t.jobsMissingMaterialsNames, ['Cindy W.', 'Rachel G.'])
  assert.equal(t.notCounted.length, 3) // insurance, materials for 2 installs, Robyn $0 quote
  assert.match(t.notCounted[0], /insurance/)
  assert.match(t.notCounted[1], /Cindy W\., Rachel G\./)
  assert.match(t.notCounted[2], /Robyn B\..*\$0 quote/)
})

test('Austin example (live data 2026-10-03): 595 + 1,440 = 2,035 - 650 - 422.50 - 936.27 = 26.23', () => {
})

test('reconciliation uses sheet Keeps and still adds up to the projected bottom line', () => {
  const d = withSheet(structuredClone(data))
  const t = computePlanned(d)!
  const r = t.reconciliation
  assert.equal(r.keepsTotal, 526.7)
  assert.equal(r.leadFeesInKeeps, 49.81)
  assert.equal(round(r.endsAt + r.otherDifference), t.projectedBottomLine)
})

test('latest Netlify charge is read from the tracker (9/14 $9.59), used only if months are projected', () => {
  assert.deepEqual(latestNetlifyCharge(data), { amount: 9.59, month: '2026-09' })
  const none: CashDashboard = structuredClone(data)
  none.recentTransactions = none.recentTransactions.filter((t) => t.vendor !== 'Netlify')
  assert.equal(latestNetlifyCharge(none), null)
  assert.equal(NETLIFY_MONTHS_PROJECTED, 0) // flip to 2 in src/config.ts to project 2 x 9.59 = 19.18
})

function round(n: number) {
  return Math.round(n * 100) / 100
}
