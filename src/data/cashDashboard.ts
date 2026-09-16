import type { CashDashboard } from '../types'

const LOCAL_DASHBOARD = 'cash-dashboard.json'

async function readConfigDashboardUrl(): Promise<string | null> {
  try {
    const base = import.meta.env.BASE_URL
    const res = await fetch(`${base}config.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const cfg = (await res.json()) as { dashboardUrl?: string }
    const url = (cfg.dashboardUrl || '').trim()
    if (!url || url.includes('PLACEHOLDER') || url.includes('YOUR_')) return null
    return url
  } catch {
    return null
  }
}

async function fetchDashboard(url: string): Promise<CashDashboard> {
  const bust = url.includes('?') ? `&t=${Date.now()}` : `?t=${Date.now()}`
  const res = await fetch(`${url}${bust}`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Failed to load cash dashboard (${res.status}) from ${url}`)
  }
  return (await res.json()) as CashDashboard
}

function normalize(data: CashDashboard): CashDashboard {
  if (!Array.isArray(data.categories) || !Array.isArray(data.jobs)) {
    throw new Error('Cash dashboard file is missing categories or jobs')
  }
  return data
}

export async function loadCashDashboard(): Promise<CashDashboard> {
  const liveUrl = await readConfigDashboardUrl()
  if (liveUrl) {
    try {
      return normalize(await fetchDashboard(liveUrl))
    } catch (err) {
      console.warn('[gpcl] Live dashboard fetch failed; using local snapshot.', err)
    }
  }
  const localUrl = `${import.meta.env.BASE_URL}${LOCAL_DASHBOARD}`
  return normalize(await fetchDashboard(localUrl))
}
