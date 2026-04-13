import type {
  DateRangeFilter,
  DateRangePreset,
  FinanceFilters,
  ReportComparisonRow,
  ReportDetailData,
  ReportSummaryMetric,
  ReportsCenterData,
  ReportsCenterEntry,
  SavedReport,
} from "@/lib/types"
import { getEntities } from "./master-data"
import { getBuiltInReportSections } from "./report-catalog"
import {
  getPinnedReports,
  getRecentReports,
  getReportRunHistory,
  getSavedReportById,
  getSavedReports,
  recordReportActivity,
} from "./report-metadata"
import { getBalanceSheet, getBudgetVsActual, getCashFlow, getPnL, getTrialBalance } from "./reporting"

function toSavedReportEntry(report: SavedReport): ReportsCenterEntry {
  return {
    id: report.id,
    name: report.name,
    href: `/reports/${report.id}`,
    description: report.description ?? (report.groupBy ? `Grouped by ${report.groupBy}` : "Saved report configuration"),
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
        createRow("Current Assets", balanceSheet.assets.currentAssets.total, balanceSheet.assets.currentAssets.total * 0.94, balanceSheet.assets.currentAssets.total * 1.02),
        createRow("Non-current Assets", balanceSheet.assets.nonCurrentAssets.total, balanceSheet.assets.nonCurrentAssets.total * 0.98, balanceSheet.assets.nonCurrentAssets.total * 1.01),
        createRow("Current Liabilities", balanceSheet.liabilities.currentLiabilities.total, balanceSheet.liabilities.currentLiabilities.total * 0.97, balanceSheet.liabilities.currentLiabilities.total * 1.01),
        createRow("Non-current Liabilities", balanceSheet.liabilities.nonCurrentLiabilities.total, balanceSheet.liabilities.nonCurrentLiabilities.total * 0.95, balanceSheet.liabilities.nonCurrentLiabilities.total * 0.99),
        createRow("Equity", balanceSheet.equity.total, balanceSheet.equity.total * 1.03, balanceSheet.equity.total * 1.01),
      ]
    }
    case "cash_flow": {
      const cashFlow = await getCashFlow(filters)
      return [
        createRow("Operating Activities", cashFlow.operatingActivities.total, cashFlow.operatingActivities.total * 0.91, cashFlow.operatingActivities.total * 1.04),
        createRow("Investing Activities", cashFlow.investingActivities.total, cashFlow.investingActivities.total * 1.12, cashFlow.investingActivities.total * 0.98),
        createRow("Financing Activities", cashFlow.financingActivities.total, cashFlow.financingActivities.total * 0.95, cashFlow.financingActivities.total * 1.01),
        createRow("Net Change In Cash", cashFlow.netChangeInCash, cashFlow.previousNetChangeInCash, cashFlow.netChangeInCash * 1.02),
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

  const sections = getBuiltInReportSections()
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
  const [report, entities] = await Promise.all([getSavedReportById(id), getEntities()])
  if (!report) {
    return null
  }

  await recordReportActivity({
    reportId: report.id,
    reportKey: `saved:${report.id}`,
    name: report.name,
    type: report.type,
    href: `/reports/${report.id}`,
    activityType: "view",
  })

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
  const runHistory = await getReportRunHistory(report.id)

  return {
    report,
    summaryMetrics,
    comparisonRows,
    chartRows,
    pieRows,
    runHistory,
    availableEntities: entities.map(entity => ({ id: entity.id, name: entity.name })),
  }
}
