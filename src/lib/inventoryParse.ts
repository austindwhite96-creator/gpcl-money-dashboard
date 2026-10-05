/**
 * Pure inventory-sheet parser (mirrors Apps Script readInventory_).
 * Rows are [Item, Unit, Qty on hand, Unit cost, Total value, Last updated, Notes].
 *
 * Skips: blank rows, section headers (Rules, Pending purchase…), rule body rows,
 * and any row without a Unit (e.g. "Sheryl Jones materials order").
 * Pending section items are NOT treated as on-hand stock.
 */

export const LOW_STOCK_THRESHOLD = 10

export type ParsedInventoryItem = {
  id: string
  name: string
  unit: string
  qty: number
  unitCost: number | null
  totalValue: number | null
  lastUpdated: string
  notes: string
  photoKey: string
  status?: 'pending'
}

export type ParsedInventory = {
  onHand: ParsedInventoryItem[]
  pending: ParsedInventoryItem[]
  lowStockThreshold: number
}

export type SheetCell = string | number | boolean | null | undefined | Date

function cellStr(v: SheetCell): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) {
    return v.toISOString().slice(0, 10)
  }
  return String(v).trim()
}

function blankNum(v: SheetCell): number | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const s = String(v).replace(/[$,]/g, '').trim()
  if (!s || /^n\/?a$/i.test(s)) return null
  const n = parseFloat(s)
  return Number.isNaN(n) ? null : n
}

function numQty(v: SheetCell): number {
  const n = blankNum(v)
  return n == null ? 0 : n
}

function formatDate(v: SheetCell): string {
  if (v === null || v === undefined || v === '') return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  const s = String(v).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  return s
}

export function photoKeyFromName(name: string): string {
  return String(name || '')
    .toLowerCase()
    .replace(/^[—\-–]+\s*/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export function cleanItemName(name: string): string {
  return String(name || '')
    .replace(/^[—\-–]+\s*/, '')
    .trim()
}

/**
 * Parse Inventory tab values (including header row at index 0).
 */
export function parseInventorySheet(values: SheetCell[][]): ParsedInventory {
  const onHand: ParsedInventoryItem[] = []
  const pending: ParsedInventoryItem[] = []
  if (!values || values.length < 2) {
    return { onHand, pending, lowStockThreshold: LOW_STOCK_THRESHOLD }
  }

  let section: 'onHand' | 'rules' | 'pending' = 'onHand'

  for (let r = 1; r < values.length; r++) {
    const row = values[r] || []
    const rawItem = cellStr(row[0])
    if (!rawItem) continue

    if (/^Rules$/i.test(rawItem)) {
      section = 'rules'
      continue
    }
    if (/^Pending purchase/i.test(rawItem)) {
      section = 'pending'
      continue
    }
    if (/^Item$/i.test(rawItem)) continue
    if (section === 'rules') continue

    const unit = cellStr(row[1])
    // Real product rows always have a Unit. Section blurbs / cart headers do not.
    if (!unit) continue

    const name = cleanItemName(rawItem)
    if (!name) continue

    const item: ParsedInventoryItem = {
      id: `${section === 'pending' ? 'inv-pending' : 'inv-oh'}-${r}`,
      name,
      unit,
      qty: numQty(row[2]),
      unitCost: blankNum(row[3]),
      totalValue: blankNum(row[4]),
      lastUpdated: formatDate(row[5]),
      notes: cellStr(row[6]),
      photoKey: photoKeyFromName(name),
    }
    if (section === 'pending') {
      item.status = 'pending'
      pending.push(item)
    } else {
      onHand.push(item)
    }
  }

  return { onHand, pending, lowStockThreshold: LOW_STOCK_THRESHOLD }
}

export function stockFlag(qty: number, threshold = LOW_STOCK_THRESHOLD): 'out' | 'low' | 'ok' {
  if (!(qty > 0)) return 'out'
  if (qty <= threshold) return 'low'
  return 'ok'
}
