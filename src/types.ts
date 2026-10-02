export interface CategorySpend {
  name: string
  total: number
}

export interface OpenJob {
  address: string
  customer: string
  quoteId: string
  quotedRevenue: number
  revenueCollected: number
  hardProfit: number
  notes: string
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

export interface CrewPayee {
  name: string
  amount: number
}

export interface PlannedJob {
  customer: string
  address: string
  quoteId: string
  installDate: string
  /** Quoted revenue BEFORE sales tax. */
  quotedPreTax: number
  /** Pre-tax revenue actually collected so far. */
  collected: number
  stillExpected: number
  deposit: number
  taxTreatment: string
  /** Expected sales tax: a liability owed to the state, never revenue. */
  salesTaxExpected: number
  salesTaxCollected: number
  jobCosts: number
  /** Planned crew pay per Crew Pay Policy; null when the policy has no row for this job. */
  crewPay: number | null
  crewPayees: CrewPayee[]
  crewPayText: string
  flags: string[]
}

export interface PlannedIncomeFeed {
  jobs: PlannedJob[]
  salesTaxRate?: number
  source?: string
  error?: string
}

export interface CashDashboard {
  syncedFrom: string
  sheetId: string
  syncedAt: string
  hardRevenue: number
  hardExpenses: number
  netCashProfit: number
  cashMargin: number | null
  receiptsNeeded: number
  categories: CategorySpend[]
  jobs: OpenJob[]
  recentTransactions: CashTransaction[]
  /** Optional: older feeds/snapshots do not have it. */
  plannedIncome?: PlannedIncomeFeed
}
