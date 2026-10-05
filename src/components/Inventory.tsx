import type { ReactNode } from 'react'
import { Package, PackageOpen } from 'lucide-react'
import { formatMoney } from '../lib/money'
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  inventoryPhotoUrl,
  stockLabel,
  stockLevel,
} from '../lib/inventory'
import type { InventoryFeed, InventoryItem, StockLevel } from '../types'

function Badge({ level }: { level: StockLevel }) {
  const styles =
    level === 'out'
      ? 'bg-rose-100 text-rose-900'
      : level === 'low'
        ? 'bg-amber-100 text-amber-900'
        : 'bg-gpcl-100 text-gpcl-800'
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${styles}`}>
      {stockLabel(level)}
    </span>
  )
}

function ItemCard({
  item,
  threshold,
  pending,
}: {
  item: InventoryItem
  threshold: number
  pending?: boolean
}) {
  const level = pending ? 'ok' : stockLevel(item.qty, threshold)
  const showStockBadge = !pending
  const costLabel =
    item.unitCost == null ? 'Unit cost TBD' : `${formatMoney(item.unitCost)} / ${item.unit || 'ea'}`
  const totalLabel = item.totalValue == null ? '—' : formatMoney(item.totalValue)

  return (
    <li className="overflow-hidden rounded-3xl border border-gpcl-100 bg-white shadow-sm">
      <div className="flex gap-3 p-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gpcl-50">
          <img
            src={inventoryPhotoUrl(item)}
            alt=""
            className="h-full w-full object-contain"
            loading="lazy"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-snug text-gpcl-950">{item.name}</p>
            {showStockBadge ? <Badge level={level} /> : null}
            {pending ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                Pending
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-lg font-bold tabular-nums text-gpcl-900">
            {item.qty.toLocaleString()}{' '}
            <span className="text-sm font-semibold text-gpcl-800/70">{item.unit}</span>
          </p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <p className="text-xs text-gpcl-800/70">{costLabel}</p>
            <p className="text-xs font-semibold tabular-nums text-gpcl-900">
              Total {totalLabel}
            </p>
          </div>
          {item.lastUpdated ? (
            <p className="mt-1 text-[11px] text-gpcl-800/50">Updated {item.lastUpdated}</p>
          ) : null}
        </div>
      </div>
    </li>
  )
}

function Section({
  title,
  subtitle,
  icon,
  items,
  threshold,
  pending,
  empty,
}: {
  title: string
  subtitle?: string
  icon: ReactNode
  items: InventoryItem[]
  threshold: number
  pending?: boolean
  empty: string
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.12em] text-gpcl-600">
          {icon}
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-sm text-gpcl-800/70">{subtitle}</p> : null}
      </div>
      {items.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-gpcl-200 bg-white/60 px-4 py-6 text-center text-sm text-gpcl-800/70">
          {empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} threshold={threshold} pending={pending} />
          ))}
        </ul>
      )}
    </section>
  )
}

export function Inventory({ data }: { data: InventoryFeed | undefined }) {
  const threshold = data?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD
  const onHand = data?.onHand ?? []
  const pending = data?.pending ?? []
  const emptyFeed = !data

  return (
    <div className="space-y-6">
      {emptyFeed ? (
        <p className="rounded-3xl border border-gpcl-100 bg-white p-5 text-sm text-gpcl-800/70 shadow-sm">
          Inventory is not in the live feed yet. Wait for the Cash Tracker feed redeploy.
        </p>
      ) : null}

      <Section
        title="On hand"
        subtitle={`Out = 0 · Low = 1–${threshold} · from Cash Tracker Inventory`}
        icon={<Package size={16} />}
        items={onHand}
        threshold={threshold}
        empty="No on-hand items yet."
      />

      <Section
        title="Pending order (not placed yet)"
        subtitle="Cart lines on the Inventory tab — not counted as stock"
        icon={<PackageOpen size={16} />}
        items={pending}
        threshold={threshold}
        pending
        empty="No pending purchase lines."
      />
    </div>
  )
}
