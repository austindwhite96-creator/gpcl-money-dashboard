import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseInventorySheet,
  photoKeyFromName,
  stockFlag,
  cleanItemName,
} from '../src/lib/inventoryParse.ts'
import {
  inventoryPhotoFile,
  normalizeInventory,
  stockLevel,
  slugifyItemName,
} from '../src/lib/inventory.ts'

/** Snapshot of the Cash Tracker Inventory tab (2026-10-05). */
const SHEET: (string | number | null)[][] = [
  ['Item', 'Unit', 'Qty on hand', 'Unit cost', 'Total value', 'Last updated', 'Notes'],
  ['Socket wire', 'LF', 270, null, null, '2026-10-05', '2025 leftovers. Unit cost TBD.'],
  ['C9 bulbs — warm white', 'ea', 0, null, null, '2026-10-05', 'On hand = 0.'],
  ['C9 bulbs — blue', 'ea', 29, null, null, '2026-10-05', ''],
  ['C9 bulbs — purple', 'ea', 30, null, null, '2026-10-05', ''],
  ['Stake clips', 'ea', 27, null, null, '2026-10-05', ''],
  [null, null, null, null, null, null, null],
  ['Rules', null, null, null, null, null, null],
  ['Purchases add stock', null, null, null, null, null, 'When a materials purchase posts…'],
  ['Jobs charged only for what they use', null, null, null, null, null, '…'],
  [null, null, null, null, null, null, null],
  ['Pending purchase (NOT placed — do not post as expense)', null, null, null, null, null, null],
  ['Sheryl Jones materials order', null, null, null, null, null, 'Cart subtotal $1,322.75.'],
  ['— Woods 2001WD photocell timer', 'ea', 1, 15.25, 15.25, null, 'Pending'],
  ['— Minleon one plug SPT1 25pk', 'pk', 1, 16.25, 16.25, null, 'Pending'],
  ['— Female slide plug SPT1 25pk', 'pk', 1, 16.25, 16.25, null, 'Pending'],
  ['— Male slide plug SPT1 25pk', 'pk', 1, 16.25, 16.25, null, 'Pending'],
  ['— Zip cord green 18AWG 250\'', 'spool', 1, 48.75, 48.75, null, 'Pending'],
  ['— LED 50-light 5mm balled warm white 6" (x30 sets)', 'set', 30, 11.25, 337.5, null, 'Pending'],
  ['— LED C9 faceted warm white 25pk (x12)', 'pk', 12, 17.75, 213, null, 'Pending'],
  ['— 500\' C9 magnetic cord SPT-1 12" spacing', 'LF', 500, 1.32, 659.5, null, 'Pending'],
]

test('parseInventorySheet: 5 on-hand, 8 pending; skips Rules and Sheryl header', () => {
  const inv = parseInventorySheet(SHEET)
  assert.equal(inv.onHand.length, 5)
  assert.equal(inv.pending.length, 8)
  assert.equal(inv.lowStockThreshold, 10)
  assert.deepEqual(
    inv.onHand.map((i) => i.name),
    [
      'Socket wire',
      'C9 bulbs — warm white',
      'C9 bulbs — blue',
      'C9 bulbs — purple',
      'Stake clips',
    ],
  )
  assert.ok(inv.pending.every((i) => i.status === 'pending'))
  assert.ok(!inv.onHand.some((i) => /Sheryl|Rules|Pending purchase/i.test(i.name)))
  assert.ok(!inv.pending.some((i) => /Sheryl|Rules|Pending purchase/i.test(i.name)))
})

test('parseInventorySheet: blank unit costs stay null; pending costs parse', () => {
  const inv = parseInventorySheet(SHEET)
  assert.equal(inv.onHand[0].unitCost, null)
  assert.equal(inv.onHand[0].qty, 270)
  assert.equal(inv.pending[0].name, 'Woods 2001WD photocell timer')
  assert.equal(inv.pending[0].unitCost, 15.25)
  assert.equal(inv.pending[7].totalValue, 659.5)
})

test('pending is never treated as on-hand stock', () => {
  const inv = parseInventorySheet(SHEET)
  const pendingNames = new Set(inv.pending.map((i) => i.name))
  for (const row of inv.onHand) {
    assert.equal(row.status, undefined)
    assert.ok(!pendingNames.has(row.name))
  }
})

test('stock flags: 0=out, 1-10=low, >10=ok', () => {
  assert.equal(stockFlag(0), 'out')
  assert.equal(stockLevel(0), 'out')
  assert.equal(stockFlag(1), 'low')
  assert.equal(stockFlag(10), 'low')
  assert.equal(stockFlag(11), 'ok')
  assert.equal(stockFlag(270), 'ok')
  assert.equal(stockLevel(29), 'ok')
})

test('photo mapping covers on-hand + pending product names', () => {
  const cases: Array<[string, string]> = [
    ['Socket wire', 'socket_wire.png'],
    ['C9 bulbs — warm white', 'c9_warm_white.png'],
    ['C9 bulbs — blue', 'c9_blue.png'],
    ['C9 bulbs — purple', 'c9_purple.png'],
    ['Stake clips', 'stake_clips.png'],
    ['Woods 2001WD photocell timer', 'woods_2001wd_timer.png'],
    ['Minleon one plug SPT1 25pk', 'minleon_one_plug.png'],
    ['Female slide plug SPT1 25pk', 'female_slide_plug.png'],
    ['Male slide plug SPT1 25pk', 'male_slide_plug.png'],
    ['Zip cord green 18AWG 250\'', 'zip_cord.png'],
    ['LED 50-light 5mm balled warm white 6" (x30 sets)', 'mini_lights_warm_white.png'],
    ['LED C9 faceted warm white 25pk (x12)', 'c9_warm_white.png'],
    ['500\' C9 magnetic cord SPT-1 12" spacing', 'magnetic_cord.png'],
    ['Minleon Clip V2+ 100PK', 'minleon_clip_v2.png'],
    ['C9 bulbs — red', 'c9_red.png'],
    ['Brand new mystery part', 'placeholder.png'],
  ]
  for (const [name, file] of cases) {
    assert.equal(
      inventoryPhotoFile({ name, photoKey: photoKeyFromName(cleanItemName(name)) }),
      file,
      name,
    )
  }
})

test('normalizeInventory tolerates missing arrays and strips em-dash', () => {
  const inv = normalizeInventory({
    onHand: [{ id: '1', name: '— Timer', unit: 'ea', qty: 1, unitCost: '', totalValue: '', photoKey: 'timer' }],
    pending: [],
  })
  assert.ok(inv)
  assert.equal(inv!.onHand[0].name, 'Timer')
  assert.equal(inv!.onHand[0].unitCost, null)
  assert.equal(slugifyItemName('C9 bulbs — blue'), 'c9_bulbs_blue')
})
