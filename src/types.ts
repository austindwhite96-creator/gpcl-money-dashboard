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
}
