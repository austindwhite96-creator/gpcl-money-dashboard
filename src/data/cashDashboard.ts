import type { CashDashboard } from '../types'
import { normalizeInventory } from '../lib/inventory'

/** The feed said no (missing / wrong key). */
export class UnauthorizedError extends Error {
  constructor() {
    super('unauthorized')
    this.name = 'UnauthorizedError'
  }
}

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

export function normalize(data: CashDashboard): CashDashboard {
  if (!data || !Array.isArray(data.categories) || !Array.isArray(data.jobs)) {
    throw new Error('The money feed sent something unexpected. Try again in a minute.')
  }
  if (!Array.isArray(data.recentTransactions)) data.recentTransactions = []
  // plannedIncome is optional; drop it if malformed so the page still renders.
  if (data.plannedIncome && !Array.isArray(data.plannedIncome.jobs)) {
    delete data.plannedIncome
  }
  if (data.inventory) {
    const inv = normalizeInventory(data.inventory)
    if (inv) data.inventory = inv
    else delete data.inventory
  }
  return data
}

export async function loadCashDashboard(key: string): Promise<CashDashboard> {
  if (!key) throw new UnauthorizedError()
  const url = await readConfigDashboardUrl()

  let dash: CashDashboard | null = null
  let feedError: Error | null = null

  if (url) {
    const sep = url.includes('?') ? '&' : '?'
    try {
      const res = await fetch(`${url}${sep}key=${encodeURIComponent(key)}&t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        feedError = new Error('The money feed is not available right now. Try again in a minute.')
      } else {
        let body: (Partial<CashDashboard> & { error?: string }) | null = null
        try {
          body = (await res.json()) as Partial<CashDashboard> & { error?: string }
        } catch {
          feedError = new Error('The money feed sent something unexpected. Try again in a minute.')
        }
        if (body?.error === 'unauthorized') throw new UnauthorizedError()
        if (body?.error) {
          feedError = new Error('The money feed is not available right now. Try again in a minute.')
        } else if (body) {
          dash = normalize(body as CashDashboard)
        }
      }
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err
      feedError = new Error('Couldn’t reach the money feed. Check your connection and try again.')
    }
  } else {
    feedError = new Error('The money feed is not set up yet.')
  }

  if (!dash) throw feedError ?? new Error('The money feed is not available right now. Try again in a minute.')
  return dash
}
