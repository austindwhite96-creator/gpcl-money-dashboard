/**
 * Job display name: first name + last initial, with any " – suffix" / " - suffix" kept in parentheses.
 * "Sheryl Jones – Blue Top" -> "Sheryl J (Blue Top)". Already-short names ("Jennifer W.") pass through.
 */
export function shortJobName(raw: string): string {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  if (/^\S+ [A-Za-z]\.? \([^)]+\)$/.test(s)) return s // already short with suffix
  const m = /^(.*?)\s+[-–—]\s+(.+)$/.exec(s)
  const base = (m ? m[1] : s).replace(/\s*\([^)]*\)/g, '').trim()
  const suffix = m ? m[2].trim() : ''
  const parts = base.split(/\s+/)
  let short = base
  if (parts.length >= 2 && !/^[A-Za-z]\.?$/.test(parts[parts.length - 1])) {
    short = `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}`
    if (!suffix) short += '.'
  } else if (suffix) {
    short = short.replace(/\.$/, '')
  }
  return suffix ? `${short} (${suffix})` : short
}
