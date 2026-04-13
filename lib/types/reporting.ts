import type { DateRangeFilter } from './common'
import type { AccountType } from './accounting'
import type { RoleId } from './identity'

export interface ReportFilter {
  startDate?: Date
  endDate?: Date
  entityIds?: string[]
  accountIds?: string[]
  departmentIds?: string[]
  locationIds?: string[]
  vendorIds?: string[]
  customerIds?: string[]
  projectIds?: string[]
  employeeIds?: string[]
  status?: string[]
}

export interface FinanceFilters {
  entityId?: string
  entityIds?: string[]
  departmentId?: string
  departmentIds?: string[]
  locationId?: string
  locationIds?: string[]
  projectId?: string
  projectIds?: string[]
  customerId?: string
  vendorId?: string
  employeeId?: string
  status?: string[]
  dateRange: DateRangeFilter
}

export type DashboardFilters = FinanceFilters

export interface DashboardMetric {
  id: string
  label: string
  value: number
  previousValue?: number
  change?: number
  changeType?: 'positive' | 'negative' | 'neutral'
  format: 'currency' | 'number' | 'percentage'
  currency?: string
}

export interface DashboardMetricsResponse {
  totalRevenue: DashboardMetric
  totalExpenses: DashboardMetric
  netIncome: DashboardMetric
  cashBalance: DashboardMetric
  arOutstanding: DashboardMetric
  apOutstanding: DashboardMetric
  budgetVariance: DashboardMetric
  pendingApprovals: DashboardMetric
}

export interface RevenueByChannelData {
  channel: string
  direct: number
  partner: number
  online: number
}

export interface RevenueTrendData {
  year: number
  data: { month: string; value: number }[]
}

export interface DepartmentExpenseData {
  department: string
  salary: number
  benefits: number
  travel: number
  supplies: number
}

export interface CashWeeklyData {
  week: string
  opening: number
  inflow: number
  outflow: number
  closing: number
}

export interface ContractExpenseData {
  rep: string
  value: number
  color: string
}

export interface AgingData {
  bucket: string
  amount: number
  count: number
}

export interface BudgetActualData {
  category: string
  budget: number
  actual: number
  variance: number
  variancePercent: number
}

export interface BudgetTarget {
  category: string
  entityId: string
  departmentId?: string
  projectId?: string
  budget: number
  actual: number
}

export interface EntityPerformanceData {
  entityId: string
  entityName: string
  revenue: number
  expenses: number
  netIncome: number
  cashBalance: number
}

export interface AIInsight {
  id: string
  type: 'anomaly' | 'duplicate' | 'missing_receipt' | 'budget_variance' | 'recommendation'
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  relatedIds?: string[]
  actionLabel?: string
  actionHref?: string
  createdAt: Date
}

export interface TrialBalanceRow {
  accountId: string
  accountNumber: string
  accountName: string
  accountType: AccountType
  openingDebit: number
  openingCredit: number
  periodDebit: number
  periodCredit: number
  closingDebit: number
  closingCredit: number
}

export interface StatementLine {
  name: string
  amount: number
  previousAmount?: number
}

export interface PnLSection {
  lines: StatementLine[]
  total: number
  previousTotal: number
}

export interface PnLData {
  revenue: PnLSection
  costOfGoodsSold: PnLSection
  grossProfit: number
  previousGrossProfit: number
  operatingExpenses: PnLSection
  operatingIncome: number
  previousOperatingIncome: number
  otherIncome: {
    interestIncome: number
    interestExpense: number
    other: number
    total: number
  }
  incomeBeforeTax: number
  previousIncomeBeforeTax: number
  incomeTaxExpense: number
  netIncome: number
  previousNetIncome: number
}

export type IncomeStatementData = PnLData

export interface BalanceSheetBucket {
  [key: string]: number
  total: number
}

export interface BalanceSheetData {
  assets: {
    currentAssets: BalanceSheetBucket
    nonCurrentAssets: BalanceSheetBucket
    total: number
  }
  liabilities: {
    currentLiabilities: BalanceSheetBucket
    nonCurrentLiabilities: BalanceSheetBucket
    total: number
  }
  equity: BalanceSheetBucket
}

export interface CashFlowData {
  operatingActivities: {
    netIncome: number
    adjustments: { name: string; amount: number }[]
    changesInWorkingCapital: { name: string; amount: number }[]
    total: number
  }
  investingActivities: {
    items: { name: string; amount: number }[]
    total: number
  }
  financingActivities: {
    items: { name: string; amount: number }[]
    total: number
  }
  netChangeInCash: number
  beginningCash: number
  endingCash: number
  previousNetChangeInCash: number
}

export interface ConsolidationAdjustment {
  label: string
  amount: number
}

export interface ConsolidatedFinancials {
  entitiesIncluded: string[]
  eliminations: ConsolidationAdjustment[]
  pnl: PnLData
  balanceSheet: BalanceSheetData
  cashFlow: CashFlowData
}

export interface SearchResult {
  id: string
  type: 'entity' | 'account' | 'vendor' | 'customer' | 'bill' | 'invoice' | 'journal_entry'
  label: string
  sublabel?: string
  href: string
  entityId?: string
  score: number
}

export interface SearchResultsByType {
  entities: SearchResult[]
  accounts: SearchResult[]
  vendors: SearchResult[]
  customers: SearchResult[]
  bills: SearchResult[]
  invoices: SearchResult[]
  journalEntries: SearchResult[]
}

export interface SavedView {
  id: string
  name: string
  module: string
  filters: Record<string, unknown>
  columns?: string[]
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  isDefault: boolean
  roleScope?: RoleId[]
  createdBy: string
  createdAt: Date
  updatedAt?: Date
}

export type SavedReportType =
  | 'balance_sheet'
  | 'income_statement'
  | 'cash_flow'
  | 'budget_vs_actual'
  | 'trial_balance'
  | 'custom'

export interface SavedReport {
  id: string
  name: string
  type: SavedReportType
  description?: string
  category?: string
  filters: Partial<DashboardFilters>
  columns: string[]
  groupBy?: string
  sortBy?: string
  createdBy: string
  createdAt: Date
  lastRunAt?: Date
  isFavorite: boolean
}

export interface RecentReport {
  id: string
  name: string
  type: string
  href: string
  viewedAt: Date
}

export interface PinnedReport {
  id: string
  name: string
  type: string
  href: string
  lastRunAt?: Date
  isPinned: boolean
}

export interface ReportsCenterEntry {
  id: string
  name: string
  href: string
  description: string
  starred?: boolean
  source: 'builtin' | 'saved'
}

export interface ReportsCenterSection {
  id: 'financial' | 'general-ledger' | 'accounts-payable' | 'accounts-receivable' | 'cash-management' | 'planning'
  title: string
  description: string
  reports: ReportsCenterEntry[]
}

export interface ReportsCenterData {
  sections: ReportsCenterSection[]
  savedReports: SavedReport[]
  recentReports: RecentReport[]
  pinnedReports: PinnedReport[]
  favoriteEntries: ReportsCenterEntry[]
}

export interface ReportSummaryMetric {
  id: string
  label: string
  value: string
  detail: string
  tone: 'neutral' | 'positive' | 'warning' | 'critical'
}

export interface ReportComparisonRow {
  category: string
  current: number
  previous: number
  budget: number
  variance: number
}

export interface ReportRunHistoryItem {
  id: string
  date: Date
  user: string
  duration: string
}

export interface ReportDetailData {
  report: SavedReport
  summaryMetrics: ReportSummaryMetric[]
  comparisonRows: ReportComparisonRow[]
  chartRows: Array<{ name: string; current: number; previous: number; budget: number }>
  pieRows: Array<{ name: string; value: number }>
  runHistory: ReportRunHistoryItem[]
  availableEntities: Array<{ id: string; name: string }>
}
