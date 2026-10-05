/**
 * Inventory helpers for the owner money dashboard.
 *
 * Low-stock rule (documented):
 *   qty === 0           → "Out"
 *   0 < qty <= threshold → "Low"  (default threshold 10)
 *   qty > threshold     → "Ok"
 *
 * Photos live under public/inventory/*.png — the feed only sends a photoKey / name.
 */

import type { InventoryFeed, InventoryItem, StockLevel } from '../types'

export const DEFAULT_LOW_STOCK_THRESHOLD = 10

/** Normalize dashes/spaces for matching. */
export function normalizeItemName(name: string): string {
  return String(name || '')
    .toLowerCase()
    .replace(/^[—\-–]+\s*/, '')
    .replace(/[—–]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

export function slugifyItemName(name: string): string {
  return normalizeItemName(name)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Keyword → static asset under public/inventory/.
 * Order matters: more specific patterns first.
 */
const PHOTO_RULES: Array<{ test: (s: string) => boolean; file: string }> = [
  { test: (s) => /socket\s*wire/.test(s), file: 'socket_wire.png' },
  { test: (s) => /c9/.test(s) && /warm\s*white/.test(s), file: 'c9_warm_white.png' },
  { test: (s) => /c9/.test(s) && /\bblue\b/.test(s), file: 'c9_blue.png' },
  { test: (s) => /c9/.test(s) && /\bpurple\b/.test(s), file: 'c9_purple.png' },
  { test: (s) => /c9/.test(s) && /\bred\b/.test(s), file: 'c9_red.png' },
  { test: (s) => /c9/.test(s) && /\bgreen\b/.test(s), file: 'c9_green.png' },
  { test: (s) => /c9/.test(s) && /\bpink\b/.test(s), file: 'c9_pink.png' },
  { test: (s) => /c9/.test(s) && /\byellow\b/.test(s), file: 'c9_yellow.png' },
  { test: (s) => /c9/.test(s) && /\borange\b/.test(s), file: 'c9_orange.png' },
  { test: (s) => /c9/.test(s) && /\bmulti\b/.test(s), file: 'c9_multi.png' },
  { test: (s) => /stake\s*clip/.test(s) || /ground\s*stake/.test(s), file: 'stake_clips.png' },
  { test: (s) => /minleon\s*clip/.test(s), file: 'minleon_clip_v2.png' },
  {
    test: (s) => /woods|2001wd|photocell/.test(s),
    file: 'woods_2001wd_timer.png',
  },
  {
    test: (s) => /mini\s*light|5mm|balled/.test(s) && /warm/.test(s),
    file: 'mini_lights_warm_white.png',
  },
  { test: (s) => /female\s*slide/.test(s), file: 'female_slide_plug.png' },
  { test: (s) => /male\s*slide/.test(s), file: 'male_slide_plug.png' },
  { test: (s) => /minleon\s*one\s*plug|one\s*plug/.test(s), file: 'minleon_one_plug.png' },
  { test: (s) => /zip\s*cord/.test(s), file: 'zip_cord.png' },
  { test: (s) => /magnetic\s*cord/.test(s), file: 'magnetic_cord.png' },
]

/** Exact photoKey overrides (from feed slug). */
const PHOTO_KEY_FILES: Record<string, string> = {
  socket_wire: 'socket_wire.png',
  c9_bulbs_warm_white: 'c9_warm_white.png',
  c9_bulbs_blue: 'c9_blue.png',
  c9_bulbs_purple: 'c9_purple.png',
  c9_bulbs_red: 'c9_red.png',
  c9_bulbs_green: 'c9_green.png',
  c9_bulbs_pink: 'c9_pink.png',
  c9_bulbs_yellow: 'c9_yellow.png',
  c9_bulbs_orange: 'c9_orange.png',
  c9_bulbs_multi: 'c9_multi.png',
  c9_bulbs_green_transparent_faceted: 'c9_green.png',
  c9_bulbs_pink_transparent_faceted: 'c9_pink.png',
  c9_bulbs_yellow_transparent_faceted: 'c9_yellow.png',
  c9_bulbs_orange_transparent_faceted: 'c9_orange.png',
  c9_bulbs_multi_transparent_faceted: 'c9_multi.png',
  stake_clips: 'stake_clips.png',
  minleon_clip_v2: 'minleon_clip_v2.png',
  woods_2001wd_photocell_timer: 'woods_2001wd_timer.png',
  woods_2001wd_timer: 'woods_2001wd_timer.png',
  minleon_one_plug_spt1_25pk: 'minleon_one_plug.png',
  female_slide_plug_spt1_25pk: 'female_slide_plug.png',
  male_slide_plug_spt1_25pk: 'male_slide_plug.png',
  zip_cord_green_18awg_250: 'zip_cord.png',
  led_50_light_5mm_balled_warm_white_6_x30_sets: 'mini_lights_warm_white.png',
  led_c9_faceted_warm_white_25pk_x12: 'c9_warm_white.png',
  '500_c9_magnetic_cord_spt_1_12_spacing': 'magnetic_cord.png',
}

export function inventoryPhotoFile(item: Pick<InventoryItem, 'name' | 'photoKey'>): string {
  const key = (item.photoKey || slugifyItemName(item.name)).toLowerCase()
  if (PHOTO_KEY_FILES[key]) return PHOTO_KEY_FILES[key]
  const n = normalizeItemName(item.name)
  for (const rule of PHOTO_RULES) {
    if (rule.test(n) || rule.test(key.replace(/_/g, ' '))) return rule.file
  }
  return 'placeholder.png'
}

export function inventoryPhotoUrl(item: Pick<InventoryItem, 'name' | 'photoKey'>): string {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}inventory/${inventoryPhotoFile(item)}`
}

export function stockLevel(qty: number, threshold = DEFAULT_LOW_STOCK_THRESHOLD): StockLevel {
  if (!(qty > 0)) return 'out'
  if (qty <= threshold) return 'low'
  return 'ok'
}

export function stockLabel(level: StockLevel): string {
  if (level === 'out') return 'Out'
  if (level === 'low') return 'Low'
  return 'In stock'
}

/** Empty inventory when feed has none yet. */
export function emptyInventory(threshold = DEFAULT_LOW_STOCK_THRESHOLD): InventoryFeed {
  return { onHand: [], pending: [], lowStockThreshold: threshold }
}

export function normalizeInventory(raw: unknown): InventoryFeed | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const inv = raw as { onHand?: unknown; pending?: unknown; lowStockThreshold?: unknown }
  if (!Array.isArray(inv.onHand) && !Array.isArray(inv.pending)) return undefined
  const threshold =
    typeof inv.lowStockThreshold === 'number' && inv.lowStockThreshold > 0
      ? inv.lowStockThreshold
      : DEFAULT_LOW_STOCK_THRESHOLD
  return {
    onHand: Array.isArray(inv.onHand) ? inv.onHand.map((row) => normalizeItem(row)) : [],
    pending: Array.isArray(inv.pending)
      ? inv.pending.map((row) => ({ ...normalizeItem(row), status: 'pending' as const }))
      : [],
    lowStockThreshold: threshold,
  }
}

function asNullableNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function normalizeItem(row: unknown): InventoryItem {
  const r = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>
  const name = String(r.name || '').replace(/^[—\-–]+\s*/, '').trim()
  const qtyRaw = r.qty
  const qty = typeof qtyRaw === 'number' ? qtyRaw : Number(qtyRaw) || 0
  const unitCost = asNullableNumber(r.unitCost)
  const totalValue = asNullableNumber(r.totalValue)
  return {
    id: String(r.id || slugifyItemName(name) || 'item'),
    name,
    unit: String(r.unit || ''),
    qty,
    unitCost,
    totalValue,
    lastUpdated: String(r.lastUpdated || ''),
    notes: String(r.notes || ''),
    photoKey: String(r.photoKey || slugifyItemName(name)),
    status: r.status === 'pending' ? 'pending' : undefined,
  }
}
