import type { ReportsCenterEntry, ReportsCenterSection } from "@/lib/types"

function createBuiltinEntry(
  id: string,
  name: string,
  href: string,
  description: string,
  starred = false
): ReportsCenterEntry {
  return { id, name, href, description, starred, source: "builtin" }
}

export const builtInReportSections: ReportsCenterSection[] = [
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

const builtInEntryMap = new Map(
  builtInReportSections.flatMap(section => section.reports).map(entry => [entry.id, entry] as const)
)

export function getBuiltInReportSections() {
  return builtInReportSections.map(section => ({
    ...section,
    reports: section.reports.map(report => ({ ...report })),
  }))
}

export function getBuiltInReportEntry(reportId: string) {
  const entry = builtInEntryMap.get(reportId)
  return entry ? { ...entry } : null
}
