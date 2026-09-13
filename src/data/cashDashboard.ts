import type { CashDashboard } from '../types'

export async function loadCashDashboard(): Promise<CashDashboard> {
  const url = `${import.meta.env.BASE_URL}cash-dashboard.json`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to load cash dashboard (${res.status})`)
  }
  const data = (await res.json()) as CashDashboard
  if (!Array.isArray(data.categories) || !Array.isArray(data.jobs)) {
    throw new Error('Cash dashboard file is missing categories or jobs')
  }
  return data
}
