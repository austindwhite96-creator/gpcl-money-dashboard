// npm test  — numbers below come from the live Cash Tracker values read on 2026-10-03 (via the lockdown feed code).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  balanceDue,
  computePlanned,
  crewCost,
  gpclKeeps,
  marginPct,
  materialsPending,
  taxStillDue,
} from '../src/lib/planned.ts'
import { formatMoney } from '../src/lib/money.ts'
import { extractKey } from '../src/lib/accessKey.ts'
import type { CashDashboard, PlannedJob } from '../src/types.ts'

const fixture = new URL('./fixtures/feed.json', import.meta.url)
const data = JSON.parse(readFileSync(fixture, 'utf8')) as CashDashboard
const job = (name: string) => data.plannedIncome!.jobs.find((j) => j.name === name) as PlannedJob

test('P1(b) GPCL keeps per job (Austin pay excluded from cost)', () => {
  assert.equal(gpclKeeps(job('Landon C.')), 202.5)
  assert.equal(marginPct(job('Landon C.')), 0.45)
  assert.equal(gpclKeeps(job('Dan B.')), 50.09)
  assert.equal(gpclKeeps(job('Nathan A.')), 100)
  assert.equal(gpclKeeps(job('Mikayla B.')), 100) // Austin's $100 stays in profit
  assert.equal(crewCost(job('Mikayla B.')), 0)
})

test('P1(b) Cindy: materials not in tracker yet => flagged, and 284/259.09 once $156 arrives', () => {
  const cindy = job('Cindy W.')
  assert.equal(materialsPending(cindy), true)
  assert.equal(gpclKeeps(cindy), 415.09) // no materials known yet; page warns it is too high
  const withMaterials = { ...cindy, materialsPlanned: 156 }
  assert.equal(gpclKeeps(withMaterials), 259.09) // 540 - 100 - 156 - 24.91
  assert.equal(gpclKeeps({ ...withMaterials, otherDirect: 0 }), 284)
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
  assert.equal(t.recurringAhead, 18) // Netlify $9 x Oct + Nov
  assert.equal(t.projectedBottomLine, 320.4) // 435.90 - 97.50 - 18
  assert.equal(t.insuranceInTracker, false)
  assert.equal(t.jobsMissingMaterials, 2) // Cindy, Rachel
})

test('P1(d) when Cindy materials + insurance appear they flow in', () => {
  const d: CashDashboard = structuredClone(data)
  d.plannedIncome!.jobs.find((j) => j.name === 'Cindy W.')!.materialsPlanned = 156
  d.recurring!.push({ label: 'Insurer', monthly: 86.58, lastPostedMonth: '2026-10', kind: 'insurance' })
  const t = computePlanned(d)!
  assert.equal(t.materialsStillToBuy, 253.5)
  assert.equal(t.recurringAhead, 18 + 86.58) // insurance posted Oct => Nov still to come
  assert.equal(t.projectedBottomLine, 77.82) // 435.90 - 253.50 - 104.58
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
