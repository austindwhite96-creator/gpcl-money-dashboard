import type { CashDashboard } from '../types'

export async function loadCashDashboard(): Promise<CashDashboard> {
  const res = await fetch('/cash-dashboard.json')
  if (!res.ok) {
    throw new Error(`Failed to load cash dashboard (${res.status})`)
  }
  const data = (await res.json()) as CashDashboard
  if (!Array.isArray(data.categories) || !Array.isArray(data.jobs)) {
    throw new Error('Cash dashboard file is missing categories or jobs')
  }
  return data
}
