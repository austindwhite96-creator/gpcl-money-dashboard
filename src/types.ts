export interface CategorySpend {
  name: string
  total: number
}

/** Open-job card. Privacy: first name + last initial, date and a short status only. */
export interface OpenJob {
  /** Opaque unique id (never a quote ID, never contact info). */
  id: string
  name: string
  /** yyyy-mm-dd or '' when the date is not known. */
  jobDate: string
  /** e.g. Booked, Awaiting deposit, Deposit paid, Paid in full, Free job. */
  status: string
  quotedRevenue: number
  revenueCollected: number
}

export interface CashTransaction {
  date: string
  type: 'Expense' | 'Revenue' | string
  vendor: string
  category: string
  description: string
  moneyIn: number
  moneyOut: number
}

export interface PlannedJob {
  id: string
  name: string
  installDate: string
  status: string
  /** Quoted revenue BEFORE sales tax. */
  quotedPreTax: number
  /** Pre-tax revenue actually collected so far. */
  collected: number
  stillExpected: number
  deposit: number
  taxable: boolean
  /** Expected sales tax: a liability owed to the state, never revenue. */
  salesTaxExpected: number
  salesTaxCollected: number
  /** Materials Bookkeeper expects to buy (0 = not in the tracker yet). */
  materialsPlanned: number
  /** Materials already bought (Jobs "Direct Materials"). */
  materialsBought: number
  /** Other direct job costs already logged, i.e. the Thumbtack lead fee. */
  otherDirect: number
  /** Planned crew pay incl. Austin; null when the policy has no row for this job. */
  crewPay: number | null
  /** The part of crewPay that is Austin's own pay (counts as profit). */
  ownerPay: number
  flags: string[]
}

export interface PlannedIncomeFeed {
  jobs: PlannedJob[]
  salesTaxRate?: number
  source?: string
  error?: string
}

export interface RecurringCost {
  label: string
  monthly: number
  /** yyyy-mm of the latest month already posted as an expense. */
  lastPostedMonth: string
  kind: 'insurance' | 'other'
}

export interface CashDashboard {
  syncedFrom: string
  syncedAt: string
  hardRevenue: number
  hardExpenses: number
  netCashProfit: number
  cashMargin: number | null
  receiptsNeeded: number
  /** Sales tax collected and not yet paid to the state. */
  salesTaxHeld?: number
  categories: CategorySpend[]
  jobs: OpenJob[]
  recentTransactions: CashTransaction[]
  recurring?: RecurringCost[]
  plannedIncome?: PlannedIncomeFeed
}
