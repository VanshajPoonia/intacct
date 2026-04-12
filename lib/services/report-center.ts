import type { DateRangeFilter, DateRangePreset, FinanceFilters } from "@/lib/types"
import { getEntities } from "./master-data"
import { getPinnedReports, getRecentReports, getSavedReports, type SavedReport } from "./legacy"
import { getBalanceSheet, getBudgetVsActual, getCashFlow, getPnL, getTrialBalance } from "./reporting"

export interface ReportsCenterEntry {
  id: string
  name: string
  href: string
  description: string
  starred?: boolean
  source: "builtin" | "saved"
}

export interface ReportsCenterSection {
  id: "financial" | "general-ledger" | "accounts-payable" | "accounts-receivable" | "cash-management" | "planning"
  title: string
  description: string
  reports: ReportsCenterEntry[]
}

export interface ReportsCenterData {
  sections: ReportsCenterSection[]
  savedReports: SavedReport[]
  recentReports: Awaited<ReturnType<typeof getRecentReports>>
  pinnedReports: Awaited<ReturnType<typeof getPinnedReports>>
  favoriteEntries: ReportsCenterEntry[]
}

export interface ReportSummaryMetric {
  id: string
  label: string
  value: string
  detail: string
  tone: "neutral" | "positive" | "warning" | "critical"
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

function createBuiltinEntry(
  id: string,
  name: string,
  href: string,
  description: string,
  starred: boolean = false
): ReportsCenterEntry {
  return { id, name, href, description, starred, source: "builtin" }
}

function toSavedReportEntry(report: SavedReport): ReportsCenterEntry {
  return {
    id: report.id,
    name: report.name,
    href: `/reports/${report.id}`,
    description: report.groupBy ? `Grouped by ${report.groupBy}` : "Saved report configuration",
    starred: report.isFavorite,
    source: "saved",
  }
}

function uniqueEntries(entries: ReportsCenterEntry[]) {
  const seen = new Set<string>()
  return entries.filter(entry => {
    if (seen.has(entry.href)) {
      return false
    }
    seen.add(entry.href)
    return true
  })
}

function buildDateRangeFromPreset(preset: DateRangePreset | null | undefined): DateRangeFilter {
  const now = new Date()
  const endDate = new Date(now)

  switch (preset) {
    case "this_month":
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate,
        preset,
      }
    case "last_month":
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0),
        preset,
      }
    case "this_quarter": {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
      return {
        startDate: new Date(now.getFullYear(), quarterStartMonth, 1),
        endDate,
        preset,
      }
    }
    case "last_quarter": {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3 - 3
      const year = quarterStartMonth < 0 ? now.getFullYear() - 1 : now.getFullYear()
      const month = quarterStartMonth < 0 ? quarterStartMonth + 12 : quarterStartMonth
      return {
        startDate: new Date(year, month, 1),
        endDate: new Date(year, month + 3, 0),
        preset,
      }
    }
    case "last_year":
      return {
        startDate: new Date(now.getFullYear() - 1, 0, 1),
        endDate: new Date(now.getFullYear() - 1, 11, 31),
        preset,
      }
    case "ytd":
    case "this_year":
    default:
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate,
        preset: preset ?? "this_year",
      }
  }
}

function mergeReportFilters(report: SavedReport, entityId?: string, datePreset?: DateRangePreset): FinanceFilters {
  return {
    entityId: entityId && entityId !== "all" ? entityId : report.filters.entityId ?? "e4",
    dateRange: datePreset
      ? buildDateRangeFromPreset(datePreset)
      : report.filters.dateRange ?? buildDateRangeFromPreset("this_year"),
    departmentId: report.filters.departmentId,
    projectId: report.filters.projectId,
    customerId: report.filters.customerId,
    vendorId: report.filters.vendorId,
  }
}

function createRow(category: string, current: number, previous: number, budget: number): ReportComparisonRow {
  return {
    category,
    current,
    previous,
    budget,
    variance: current - budget,
  }
}

function buildRunHistory(report: SavedReport): ReportRunHistoryItem[] {
  const lastRun = report.lastRunAt ?? new Date()
  return [
    { id: `${report.id}-run-1`, date: lastRun, user: report.createdBy, duration: "2.1s" },
    { id: `${report.id}-run-2`, date: new Date(lastRun.getTime() - 24 * 60 * 60 * 1000), user: "Michael Johnson", duration: "1.9s" },
    { id: `${report.id}-run-3`, date: new Date(lastRun.getTime() - 48 * 60 * 60 * 1000), user: report.createdBy, duration: "2.4s" },
  ]
}

function buildDetailMetrics(
  report: SavedReport,
  rows: ReportComparisonRow[]
): ReportSummaryMetric[] {
  const primaryRows = rows.slice(0, 4)
  const toneForVariance = (value: number): ReportSummaryMetric["tone"] =>
    value > 0 ? "positive" : value < 0 ? "critical" : "neutral"

  if (report.type === "budget_vs_actual") {
    const budgetTotal = rows.reduce((sum, row) => sum + row.budget, 0)
    const actualTotal = rows.reduce((sum, row) => sum + row.current, 0)
    const variance = actualTotal - budgetTotal
    const variancePercent = budgetTotal === 0 ? 0 : (variance / budgetTotal) * 100

    return [
      { id: "budget", label: "Budget", value: `$${Math.round(budgetTotal).toLocaleString()}`, detail: "Plan in scope", tone: "neutral" },
      { id: "actual", label: "Actual", value: `$${Math.round(actualTotal).toLocaleString()}`, detail: "Recorded activity", tone: "warning" },
      { id: "variance", label: "Variance", value: `${variance >= 0 ? "+" : ""}$${Math.round(variance).toLocaleString()}`, detail: "Actual vs budget", tone: toneForVariance(-variance) },
      { id: "variance-pct", label: "Variance %", value: `${variancePercent.toFixed(1)}%`, detail: "Budget overrun rate", tone: toneForVariance(-variancePercent) },
    ]
  }

  return primaryRows.map(row => ({
    id: row.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label: row.category,
    value: `$${Math.round(row.current).toLocaleString()}`,
    detail: `${row.variance >= 0 ? "+" : ""}$${Math.round(row.variance).toLocaleString()} vs budget`,
    tone: toneForVariance(row.variance),
  }))
}

async function buildRowsForReport(report: SavedReport, filters: FinanceFilters): Promise<ReportComparisonRow[]> {
  switch (report.type) {
    case "income_statement": {
      const statement = await getPnL(filters)
      return [
        createRow("Revenue", statement.revenue.total, statement.revenue.previousTotal, statement.revenue.total * 1.04),
        createRow("Cost of Goods Sold", statement.costOfGoodsSold.total, statement.costOfGoodsSold.previousTotal, statement.costOfGoodsSold.total * 1.03),
        createRow("Gross Profit", statement.grossProfit, statement.previousGrossProfit, statement.grossProfit * 1.05),
        createRow("Operating Expenses", statement.operatingExpenses.total, statement.operatingExpenses.previousTotal, statement.operatingExpenses.total * 0.97),
        createRow("Operating Income", statement.operatingIncome, statement.previousOperatingIncome, statement.operatingIncome * 1.02),
        createRow("Net Income", statement.netIncome, statement.previousNetIncome, statement.netIncome * 1.01),
      ]
    }
    case "balance_sheet": {
      const balanceSheet = await getBalanceSheet(filters)
      return [
        createRow("Current Assets", balanceSheet.assets.currentAssets.total, balanceSheet.assets.currentAssets.total * 0.95, balanceSheet.assets.currentAssets.total * 1.02),
        createRow("Non-current Assets", balanceSheet.assets.nonCurrentAssets.total, balanceSheet.assets.nonCurrentAssets.total * 0.94, balanceSheet.assets.nonCurrentAssets.total * 1.01),
        createRow("Current Liabilities", balanceSheet.liabilities.currentLiabilities.total, balanceSheet.liabilities.currentLiabilities.total * 0.96, balanceSheet.liabilities.currentLiabilities.total * 0.99),
        createRow("Non-current Liabilities", balanceSheet.liabilities.nonCurrentLiabilities.total, balanceSheet.liabilities.nonCurrentLiabilities.total * 0.97, balanceSheet.liabilities.nonCurrentLiabilities.total * 0.98),
        createRow("Equity", balanceSheet.equity.total, balanceSheet.equity.total * 0.95, balanceSheet.equity.total * 1.02),
      ]
    }
    case "cash_flow": {
      const cashFlow = await getCashFlow(filters)
      return [
        createRow("Operating Activities", cashFlow.operatingActivities.total, cashFlow.operatingActivities.total * 0.93, cashFlow.operatingActivities.total * 1.05),
        createRow("Investing Activities", cashFlow.investingActivities.total, cashFlow.investingActivities.total * 0.91, cashFlow.investingActivities.total * 0.98),
        createRow("Financing Activities", cashFlow.financingActivities.total, cashFlow.financingActivities.total * 0.94, cashFlow.financingActivities.total * 1.01),
        createRow("Net Change in Cash", cashFlow.netChangeInCash, cashFlow.netChangeInCash * 0.95, cashFlow.netChangeInCash * 1.02),
        createRow("Beginning Cash", cashFlow.beginningCash, cashFlow.beginningCash * 0.97, cashFlow.beginningCash),
        createRow("Ending Cash", cashFlow.endingCash, cashFlow.endingCash * 0.96, cashFlow.endingCash * 1.03),
      ]
    }
    case "budget_vs_actual": {
      const budgetRows = await getBudgetVsActual(filters)
      return budgetRows.map(row =>
        createRow(
          row.category,
          row.actual,
          row.actual - row.variance * 0.35,
          row.budget
        )
      )
    }
    case "trial_balance": {
      const trialBalance = await getTrialBalance(filters)
      return trialBalance.slice(0, 8).map(row =>
        createRow(
          row.accountName,
          row.closingDebit || row.closingCredit,
          row.openingDebit || row.openingCredit,
          (row.closingDebit || row.closingCredit) * 1.01
        )
      )
    }
    case "custom":
    default: {
      const statement = await getPnL(filters)
      return [
        createRow("Revenue", statement.revenue.total, statement.revenue.previousTotal, statement.revenue.total * 1.03),
        createRow("Gross Profit", statement.grossProfit, statement.previousGrossProfit, statement.grossProfit * 1.04),
        createRow("Operating Income", statement.operatingIncome, statement.previousOperatingIncome, statement.operatingIncome * 1.02),
        createRow("Net Income", statement.netIncome, statement.previousNetIncome, statement.netIncome * 1.01),
      ]
    }
  }
}

export async function getReportsCenterData(): Promise<ReportsCenterData> {
  const [savedReports, recentReports, pinnedReports] = await Promise.all([
    getSavedReports(),
    getRecentReports(),
    getPinnedReports(),
  ])

  const sections: ReportsCenterSection[] = [
    {
      id: "financial",
      title: "Financial Statements",
      description: "Core statement reporting and executive readouts",
      reports: [
        createBuiltinEntry("balance-sheet", "Balance Sheet", "/reports/balance-sheet", "Assets, liabilities, and equity by entity", true),
        createBuiltinEntry("income-statement", "Income Statement", "/reports/income-statement", "Revenue, expenses, and margin performance", true),
        createBuiltinEntry("cash-flow", "Cash Flow Statement", "/reports/cash-flow", "Operating, investing, and financing movement"),
        createBuiltinEntry("budget-vs-actual", "Budget vs Actual", "/reports/budget-vs-actual", "Variance review for planning and close", true),
      ],
    },
    {
      id: "general-ledger",
      title: "General Ledger",
      description: "Period validation and account-level review",
      reports: [
        createBuiltinEntry("trial-balance", "Trial Balance", "/general-ledger/reports/trial-balance", "Validate account balances before close", true),
        createBuiltinEntry("journal-workspace", "Journal Workspace", "/general-ledger/journal-entries", "Drill into journal activity and posting states"),
        createBuiltinEntry("chart-workspace", "Chart of Accounts", "/general-ledger/chart-of-accounts", "Inspect account setup and drill-downs"),
      ],
    },
    {
      id: "accounts-payable",
      title: "Accounts Payable",
      description: "Vendor liability and payment readiness views",
      reports: [
        createBuiltinEntry("ap-aging", "AP Aging", "/accounts-payable/aging", "Outstanding vendor obligations by aging bucket", true),
        createBuiltinEntry("payment-queue", "Payment Queue", "/accounts-payable/payments", "Scheduled, pending, and released payments"),
        createBuiltinEntry("vendor-master", "Vendor Master Review", "/accounts-payable/vendors", "Vendor balance and master data exceptions"),
      ],
    },
    {
      id: "accounts-receivable",
      title: "Accounts Receivable",
      description: "Collections, customer balance, and receipt application",
      reports: [
        createBuiltinEntry("ar-aging", "AR Aging", "/accounts-receivable/aging", "Outstanding receivables by aging bucket", true),
        createBuiltinEntry("collections", "Collections Queue", "/accounts-receivable/collections", "Collections priority and follow-up tasks"),
        createBuiltinEntry("receipts", "Receipts Application", "/accounts-receivable/receipts", "Receipt matching and unapplied cash review"),
      ],
    },
    {
      id: "cash-management",
      title: "Cash Management",
      description: "Liquidity, bank activity, and reconciliation",
      reports: [
        createBuiltinEntry("cash-overview", "Cash Position", "/cash-management", "Bank balances and current liquidity"),
        createBuiltinEntry("bank-transactions", "Bank Transactions", "/cash-management/transactions", "Cash movement and matching candidates"),
        createBuiltinEntry("reconciliation", "Reconciliation Workspace", "/cash-management/reconciliation", "Exception review for unreconciled activity"),
      ],
    },
    {
      id: "planning",
      title: "Budgets & Forecasting",
      description: "Planning, forecast, and variance review",
      reports: [
        createBuiltinEntry("planning-hub", "Planning Workspace", "/budgets-forecasting", "Budget versions, scenarios, and submission queue"),
        createBuiltinEntry("variance-review", "Variance Review", "/reports/budget-vs-actual", "Current plan variance across dimensions"),
        createBuiltinEntry("dashboard-customization", "Dashboard Library", "/dashboards", "Executive and operator dashboard outputs"),
      ],
    },
  ]

  const savedEntries = savedReports.map(toSavedReportEntry)
  const favoriteEntries = uniqueEntries([
    ...sections.flatMap(section => section.reports.filter(report => report.starred)),
    ...savedEntries.filter(report => report.starred),
  ])

  return {
    sections,
    savedReports,
    recentReports,
    pinnedReports,
    favoriteEntries,
  }
}

export async function getReportDetailData(
  id: string,
  options?: { entityId?: string; datePreset?: DateRangePreset }
): Promise<ReportDetailData | null> {
  const [savedReports, entities] = await Promise.all([getSavedReports(), getEntities()])
  const report = savedReports.find(item => item.id === id)

  if (!report) {
    return null
  }

  const filters = mergeReportFilters(report, options?.entityId, options?.datePreset)
  const comparisonRows = await buildRowsForReport(report, filters)
  const summaryMetrics = buildDetailMetrics(report, comparisonRows)
  const chartRows = comparisonRows.map(row => ({
    name: row.category,
    current: row.current,
    previous: row.previous,
    budget: row.budget,
  }))
  const pieRows = comparisonRows
    .map(row => ({ name: row.category, value: Math.abs(row.current) }))
    .filter(row => row.value > 0)
    .slice(0, 5)

  return {
    report,
    summaryMetrics,
    comparisonRows,
    chartRows,
    pieRows,
    runHistory: buildRunHistory(report),
    availableEntities: entities.map(entity => ({ id: entity.id, name: entity.name })),
  }
}
