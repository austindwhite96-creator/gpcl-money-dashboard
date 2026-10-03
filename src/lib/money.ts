const fmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** The one money format used everywhere: $1,234.56 (always two decimals). */
export function formatMoney(amount: number): string {
  return fmt.format(Math.round(amount * 100) / 100 + 0) // +0 turns -0 into 0
}

export function formatMargin(margin: number | null): string {
  if (margin == null || Number.isNaN(margin)) return '—'
  return `${(margin * 100).toFixed(0)}%`
}
