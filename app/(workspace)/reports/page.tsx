"use client"

import { useState, useEffect, useCallback } from "react"
import { ModulePage } from "@/components/layout/module-page"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  DollarSign, 
  Users,
  Search,
  Star,
  Plus,
  Wrench,
  Clock,
  Pin,
  Play,
  Calendar,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSavedReports, getRecentReports, getPinnedReports, toggleReportPin, toggleReportFavorite, type SavedReport, type RecentReport } from "@/lib/services"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const reportCategories = [
  {
    title: "Financial Statements",
    description: "Core financial reports",
    icon: FileText,
    color: "bg-blue-500/10 text-blue-600",
    reports: [
      { name: "Balance Sheet", href: "/reports/balance-sheet", starred: true, description: "Assets, liabilities, and equity" },
      { name: "Income Statement", href: "/reports/income-statement", starred: true, description: "Revenue and expenses" },
      { name: "Cash Flow Statement", href: "/reports/cash-flow", description: "Cash inflows and outflows" },
      { name: "Statement of Changes in Equity", href: "/reports/equity-changes", description: "Equity movements" },
    ]
  },
  {
    title: "General Ledger",
    description: "Transaction and account reports",
    icon: BarChart3,
    color: "bg-emerald-500/10 text-emerald-600",
    reports: [
      { name: "Trial Balance", href: "/general-ledger/reports/trial-balance", starred: true, description: "Account balances summary" },
      { name: "General Ledger Detail", href: "/general-ledger/reports/gl-detail", description: "Detailed transactions" },
      { name: "Account Activity", href: "/general-ledger/reports/account-activity", description: "Account movements" },
      { name: "Journal Entry Register", href: "/general-ledger/reports/je-register", description: "All journal entries" },
    ]
  },
  {
    title: "Accounts Payable",
    description: "Vendor and payment reports",
    icon: DollarSign,
    color: "bg-purple-500/10 text-purple-600",
    reports: [
      { name: "AP Aging Summary", href: "/accounts-payable/reports/aging", starred: true, description: "Payables by age" },
      { name: "AP Aging Detail", href: "/accounts-payable/reports/aging-detail", description: "Detailed aging" },
      { name: "Vendor Balance Summary", href: "/accounts-payable/reports/vendor-balance", description: "By vendor" },
      { name: "Payment History", href: "/accounts-payable/reports/payment-history", description: "Payment records" },
    ]
  },
  {
    title: "Accounts Receivable",
    description: "Customer and collections reports",
    icon: Users,
    color: "bg-amber-500/10 text-amber-600",
    reports: [
      { name: "AR Aging Summary", href: "/accounts-receivable/reports/aging", starred: true, description: "Receivables by age" },
      { name: "AR Aging Detail", href: "/accounts-receivable/reports/aging-detail", description: "Detailed aging" },
      { name: "Customer Balance Summary", href: "/accounts-receivable/reports/customer-balance", description: "By customer" },
      { name: "Collections Summary", href: "/accounts-receivable/reports/collections-summary", description: "Collection status" },
    ]
  },
  {
    title: "Cash Management",
    description: "Bank and cash reports",
    icon: TrendingUp,
    color: "bg-cyan-500/10 text-cyan-600",
    reports: [
      { name: "Cash Position", href: "/cash-management/reports/cash-position", description: "Current cash status" },
      { name: "Bank Activity", href: "/cash-management/reports/bank-activity", description: "Bank transactions" },
      { name: "Cash Forecast", href: "/cash-management/reports/cash-forecast", description: "Projected cash flow" },
      { name: "Bank Reconciliation", href: "/cash-management/reports/reconciliation", description: "Reconciliation status" },
    ]
  },
  {
    title: "Budgets & Forecasts",
    description: "Planning and analysis reports",
    icon: PieChart,
    color: "bg-rose-500/10 text-rose-600",
    reports: [
      { name: "Budget vs Actual", href: "/reports/budget-vs-actual", starred: true, description: "Variance analysis" },
      { name: "Variance Analysis", href: "/reports/variance-analysis", description: "Detailed variances" },
      { name: "Department Budgets", href: "/reports/department-budgets", description: "By department" },
      { name: "Rolling Forecast", href: "/reports/rolling-forecast", description: "Updated projections" },
    ]
  },
]

interface PinnedReport {
  id: string
  name: string
  type: string
  href: string
  lastRunAt?: Date
}

export default function ReportsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])
  const [pinnedReports, setPinnedReports] = useState<PinnedReport[]>([])
  const [activeTab, setActiveTab] = useState("all")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [saved, recent, pinned] = await Promise.all([
        getSavedReports(),
        getRecentReports(),
        getPinnedReports(),
      ])
      setSavedReports(saved)
      setRecentReports(recent)
      setPinnedReports(pinned)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleToggleFavorite = async (id: string) => {
    await toggleReportFavorite(id)
    fetchData()
  }

  const handleTogglePin = async (id: string) => {
    await toggleReportPin(id)
    fetchData()
  }

  const filteredCategories = reportCategories.map(cat => ({
    ...cat,
    reports: cat.reports.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.reports.length > 0)

  const favoriteReports = savedReports.filter(r => r.isFavorite)
  const starredBuiltIn = reportCategories.flatMap(cat => 
    cat.reports.filter(r => r.starred)
  )

  return (
    <ModulePage
      title="Reports"
      description="Access financial reports and analytics"
      breadcrumbs={[{ label: 'Reports' }]}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search reports..." 
              className="pl-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/reports/builder">
              <Button variant="outline">
                <Wrench className="h-4 w-4 mr-2" />
                Report Builder
              </Button>
            </Link>
            <Link href="/reports/builder">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Access Row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Pinned Reports */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Pin className="h-4 w-4 text-blue-500" />
                Pinned Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))
              ) : pinnedReports.length > 0 ? (
                pinnedReports.slice(0, 4).map((report) => (
                  <Link
                    key={report.id}
                    href={report.href}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{report.name}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pinned reports
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recently Viewed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))
              ) : recentReports.length > 0 ? (
                recentReports.slice(0, 4).map((report) => (
                  <Link
                    key={report.id}
                    href={report.href}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div>
                      <span className="text-sm font-medium">{report.name}</span>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(report.viewedAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent reports
                </p>
              )}
            </CardContent>
          </Card>

          {/* Favorites */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                Favorites
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))
              ) : favoriteReports.length > 0 || starredBuiltIn.length > 0 ? (
                <>
                  {starredBuiltIn.slice(0, 2).map((report) => (
                    <Link
                      key={report.href}
                      href={report.href}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{report.name}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                  {favoriteReports.slice(0, 2).map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors group cursor-pointer"
                      onClick={() => {
                        const path = report.type === 'income_statement' ? '/reports/income-statement' :
                          report.type === 'balance_sheet' ? '/reports/balance-sheet' :
                          report.type === 'cash_flow' ? '/reports/cash-flow' :
                          report.type === 'budget_vs_actual' ? '/reports/budget-vs-actual' :
                          '/general-ledger/reports/trial-balance'
                        router.push(path)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{report.name}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No favorite reports
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Categories with Tabs */}
        <Card>
          <CardHeader className="pb-0 border-b">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-transparent h-auto p-0 gap-4">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
                >
                  All Reports
                </TabsTrigger>
                <TabsTrigger 
                  value="financial" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
                >
                  Financial Statements
                </TabsTrigger>
                <TabsTrigger 
                  value="operational" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
                >
                  Operational
                </TabsTrigger>
                <TabsTrigger 
                  value="custom" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
                >
                  Custom Reports
                  {savedReports.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">{savedReports.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-6">
            {activeTab === "all" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(searchQuery ? filteredCategories : reportCategories).map((category) => {
                  const Icon = category.icon
                  return (
                    <Card key={category.title} className="border shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", category.color)}>
                            <Icon className="h-4 w-4" />
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
                              className="flex items-center justify-between py-2 px-2 -mx-2 rounded-md hover:bg-muted text-sm transition-colors group"
                            >
                              <div>
                                <span className="font-medium">{report.name}</span>
                                {report.description && (
                                  <p className="text-xs text-muted-foreground">{report.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {report.starred && (
                                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                )}
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {activeTab === "financial" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportCategories.filter(c => c.title === "Financial Statements" || c.title === "General Ledger").map((category) => {
                  const Icon = category.icon
                  return (
                    <Card key={category.title} className="border shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", category.color)}>
                            <Icon className="h-4 w-4" />
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
                              className="flex items-center justify-between py-2 px-2 -mx-2 rounded-md hover:bg-muted text-sm transition-colors group"
                            >
                              <div>
                                <span className="font-medium">{report.name}</span>
                                {report.description && (
                                  <p className="text-xs text-muted-foreground">{report.description}</p>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {activeTab === "operational" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportCategories.filter(c => 
                  c.title === "Accounts Payable" || 
                  c.title === "Accounts Receivable" || 
                  c.title === "Cash Management" ||
                  c.title === "Budgets & Forecasts"
                ).map((category) => {
                  const Icon = category.icon
                  return (
                    <Card key={category.title} className="border shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", category.color)}>
                            <Icon className="h-4 w-4" />
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
                              className="flex items-center justify-between py-2 px-2 -mx-2 rounded-md hover:bg-muted text-sm transition-colors group"
                            >
                              <div>
                                <span className="font-medium">{report.name}</span>
                                {report.description && (
                                  <p className="text-xs text-muted-foreground">{report.description}</p>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {activeTab === "custom" && (
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))
                ) : savedReports.length > 0 ? (
                  <div className="divide-y border rounded-lg">
                    {savedReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-muted">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {report.name}
                              {report.isFavorite && (
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Badge variant="outline" className="text-xs capitalize">
                                {report.type.replace('_', ' ')}
                              </Badge>
                              <span>Created {format(new Date(report.createdAt), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFavorite(report.id)}
                          >
                            <Star className={cn(
                              "h-4 w-4",
                              report.isFavorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                            )} />
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              const path = report.type === 'income_statement' ? '/reports/income-statement' :
                                report.type === 'balance_sheet' ? '/reports/balance-sheet' :
                                report.type === 'cash_flow' ? '/reports/cash-flow' :
                                report.type === 'budget_vs_actual' ? '/reports/budget-vs-actual' :
                                '/general-ledger/reports/trial-balance'
                              router.push(path)
                            }}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Run
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No custom reports yet</p>
                    <p className="text-sm">Create your first report using the Report Builder</p>
                    <Link href="/reports/builder">
                      <Button className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Report
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModulePage>
  )
}
