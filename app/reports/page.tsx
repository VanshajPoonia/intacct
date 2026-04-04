"use client"

import { ModulePage } from "@/components/layout/module-page"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Building, 
  Calendar,
  Search,
  Star
} from "lucide-react"
import Link from "next/link"

const reportCategories = [
  {
    title: "Financial Statements",
    description: "Core financial reports",
    icon: FileText,
    reports: [
      { name: "Balance Sheet", href: "/reports/balance-sheet", starred: true },
      { name: "Income Statement", href: "/reports/income-statement", starred: true },
      { name: "Cash Flow Statement", href: "/reports/cash-flow" },
      { name: "Statement of Changes in Equity", href: "/reports/equity-changes" },
    ]
  },
  {
    title: "General Ledger",
    description: "Transaction and account reports",
    icon: BarChart3,
    reports: [
      { name: "Trial Balance", href: "/general-ledger/reports/trial-balance", starred: true },
      { name: "General Ledger Detail", href: "/general-ledger/reports/gl-detail" },
      { name: "Account Activity", href: "/general-ledger/reports/account-activity" },
      { name: "Journal Entry Register", href: "/general-ledger/reports/je-register" },
    ]
  },
  {
    title: "Accounts Payable",
    description: "Vendor and payment reports",
    icon: DollarSign,
    reports: [
      { name: "AP Aging Summary", href: "/accounts-payable/reports/aging", starred: true },
      { name: "AP Aging Detail", href: "/accounts-payable/reports/aging-detail" },
      { name: "Vendor Balance Summary", href: "/accounts-payable/reports/vendor-balance" },
      { name: "Payment History", href: "/accounts-payable/reports/payment-history" },
    ]
  },
  {
    title: "Accounts Receivable",
    description: "Customer and collections reports",
    icon: Users,
    reports: [
      { name: "AR Aging Summary", href: "/accounts-receivable/reports/aging", starred: true },
      { name: "AR Aging Detail", href: "/accounts-receivable/reports/aging-detail" },
      { name: "Customer Balance Summary", href: "/accounts-receivable/reports/customer-balance" },
      { name: "Collections Summary", href: "/accounts-receivable/reports/collections-summary" },
    ]
  },
  {
    title: "Cash Management",
    description: "Bank and cash reports",
    icon: TrendingUp,
    reports: [
      { name: "Cash Position", href: "/cash-management/reports/cash-position" },
      { name: "Bank Activity", href: "/cash-management/reports/bank-activity" },
      { name: "Cash Forecast", href: "/cash-management/reports/cash-forecast" },
      { name: "Bank Reconciliation", href: "/cash-management/reports/reconciliation" },
    ]
  },
  {
    title: "Budgets & Forecasts",
    description: "Planning and analysis reports",
    icon: PieChart,
    reports: [
      { name: "Budget vs Actual", href: "/reports/budget-vs-actual" },
      { name: "Variance Analysis", href: "/reports/variance-analysis" },
      { name: "Department Budgets", href: "/reports/department-budgets" },
      { name: "Rolling Forecast", href: "/reports/rolling-forecast" },
    ]
  },
]

export default function ReportsPage() {
  return (
    <ModulePage
      title="Reports"
      description="Access financial reports and analytics"
      breadcrumbs={[{ label: 'Reports' }]}
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search reports..." className="pl-9" />
        </div>

        {/* Starred Reports */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              Starred Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {reportCategories.flatMap(cat => 
                cat.reports.filter(r => r.starred).map(report => (
                  <Link key={report.href} href={report.href}>
                    <Button variant="outline" size="sm" className="h-8">
                      {report.name}
                    </Button>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportCategories.map((category) => {
            const Icon = category.icon
            return (
              <Card key={category.title}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">{category.title}</CardTitle>
                      <CardDescription className="text-xs">{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {category.reports.map((report) => (
                      <Link 
                        key={report.href} 
                        href={report.href}
                        className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded-md hover:bg-muted text-sm transition-colors"
                      >
                        <span>{report.name}</span>
                        {report.starred && (
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        )}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </ModulePage>
  )
}
