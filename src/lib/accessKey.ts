/**
 * Access key handling. The key is NEVER in the public bundle or the repo.
 * Austin opens a personal link  …/gpcl-money-dashboard/#k=<token>  once; we save the token in
 * localStorage, remove it from the address bar, and send it with feed requests.
 */
const STORAGE_KEY = 'gpcl-money-access-key'
let memoryKey: string | null = null

/** Accepts a bare token, "k=token", "#k=token" or a whole personal link. */
export function extractKey(input: string): string {
  const raw = (input || '').trim()
  if (!raw) return ''
  const hashIdx = raw.indexOf('#')
  const candidate = hashIdx >= 0 ? raw.slice(hashIdx + 1) : raw
  const m = /(?:^|[&?#])k=([^&\s]+)/.exec(candidate)
  const token = m ? decodeURIComponent(m[1]) : raw.replace(/^#/, '')
  return /^[A-Za-z0-9_\-.~]{16,}$/.test(token) ? token : ''
}

export function getStoredKey(): string {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (v) return v
  } catch {
    /* storage blocked (private mode): fall through to memory */
  }
  return memoryKey ?? ''
}

export function saveKey(token: string): void {
  memoryKey = token
  try {
    window.localStorage.setItem(STORAGE_KEY, token)
  } catch {
    /* ignore */
  }
}

export function clearKey(): void {
  memoryKey = null
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** If the URL carries #k=…, save it and scrub it from the address bar / history. Returns true if found. */
export function captureKeyFromUrl(): boolean {
  const token = extractKey(window.location.hash)
  if (!/(^#|&)k=/.test(window.location.hash)) return false
  if (token) saveKey(token)
  try {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  } catch {
    /* ignore */
  }
  return !!token
}
