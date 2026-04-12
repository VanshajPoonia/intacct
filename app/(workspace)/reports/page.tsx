"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BarChart3, DollarSign, FileText, PieChart, Plus, Search, Star, TrendingUp, Wrench, Clock, Pin, ChevronRight, WalletCards } from "lucide-react"
import { ModulePage } from "@/components/layout/module-page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getReportsCenterData, type ReportsCenterData, type ReportsCenterSection } from "@/lib/services"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

const sectionUi = {
  financial: { icon: FileText, color: "bg-blue-500/10 text-blue-600" },
  "general-ledger": { icon: BarChart3, color: "bg-emerald-500/10 text-emerald-600" },
  "accounts-payable": { icon: DollarSign, color: "bg-purple-500/10 text-purple-600" },
  "accounts-receivable": { icon: WalletCards, color: "bg-amber-500/10 text-amber-600" },
  "cash-management": { icon: TrendingUp, color: "bg-cyan-500/10 text-cyan-600" },
  planning: { icon: PieChart, color: "bg-rose-500/10 text-rose-600" },
} as const

function filterSections(sections: ReportsCenterSection[], searchQuery: string) {
  if (!searchQuery.trim()) {
    return sections
  }

  const query = searchQuery.toLowerCase()
  return sections
    .map(section => ({
      ...section,
      reports: section.reports.filter(report =>
        [report.name, report.description].join(" ").toLowerCase().includes(query)
      ),
    }))
    .filter(section => section.reports.length > 0)
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsCenterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    let cancelled = false

    async function loadReportsCenter() {
      setLoading(true)
      const result = await getReportsCenterData()
      if (!cancelled) {
        setData(result)
        setLoading(false)
      }
    }

    void loadReportsCenter()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredSections = useMemo(
    () => filterSections(data?.sections ?? [], searchQuery),
    [data?.sections, searchQuery]
  )

  const visibleSections = useMemo(() => {
    switch (activeTab) {
      case "financial":
        return filteredSections.filter(section => section.id === "financial" || section.id === "general-ledger")
      case "operational":
        return filteredSections.filter(section =>
          ["accounts-payable", "accounts-receivable", "cash-management", "planning"].includes(section.id)
        )
      default:
        return filteredSections
    }
  }, [activeTab, filteredSections])

  const savedReports = data?.savedReports ?? []
  const favoriteEntries = data?.favoriteEntries ?? []
  const pinnedReports = data?.pinnedReports ?? []
  const recentReports = data?.recentReports ?? []

  return (
    <ModulePage
      title="Reports"
      description="Browse financial statements, operational analysis, and saved report outputs."
      breadcrumbs={[{ label: "Reports" }]}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reports, workspaces, and saved views…"
              className="pl-9"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/reports/builder">
                <Wrench className="mr-2 h-4 w-4" />
                Report Builder
              </Link>
            </Button>
            <Button asChild>
              <Link href="/reports/builder">
                <Plus className="mr-2 h-4 w-4" />
                New Report
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Pin className="h-4 w-4 text-blue-500" />
                Pinned Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)
              ) : pinnedReports.length ? (
                pinnedReports.map(report => (
                  <Link
                    key={report.id}
                    href={report.href}
                    className="group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted"
                  >
                    <div>
                      <div className="text-sm font-medium">{report.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Last run {report.lastRunAt ? formatDate(report.lastRunAt) : "recently"}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">No pinned reports yet.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recently Viewed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)
              ) : recentReports.length ? (
                recentReports.map(report => (
                  <Link
                    key={report.id}
                    href={report.href}
                    className="group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted"
                  >
                    <div>
                      <div className="text-sm font-medium">{report.name}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(report.viewedAt)}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">No recent report activity.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                Favorites
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)
              ) : favoriteEntries.length ? (
                favoriteEntries.slice(0, 6).map(entry => (
                  <Link
                    key={entry.id}
                    href={entry.href}
                    className="group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted"
                  >
                    <div>
                      <div className="text-sm font-medium">{entry.name}</div>
                      <div className="text-xs text-muted-foreground">{entry.description}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">No favorites yet.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="border-b pb-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto gap-4 bg-transparent p-0">
                {[
                  { id: "all", label: "All Reports" },
                  { id: "financial", label: "Financial" },
                  { id: "operational", label: "Operational" },
                  { id: "custom", label: "Saved Reports", count: savedReports.length },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="rounded-none border-b-2 border-transparent pb-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    {tab.label}
                    {tab.count !== undefined ? <Badge variant="secondary" className="ml-2 text-xs">{tab.count}</Badge> : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-6">
            {activeTab === "custom" ? (
              loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
                  ))}
                </div>
              ) : savedReports.length ? (
                <div className="divide-y overflow-hidden rounded-lg border">
                  {savedReports.map(report => (
                    <div key={report.id} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30">
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          {report.name}
                          {report.isFavorite ? <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> : null}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="capitalize">
                            {report.type.replace(/_/g, " ")}
                          </Badge>
                          <span>Created {formatDate(report.createdAt)}</span>
                          {report.lastRunAt ? <span>Last run {formatDate(report.lastRunAt)}</span> : null}
                        </div>
                      </div>
                      <Button asChild>
                        <Link href={`/reports/${report.id}`}>Open Report</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-4 h-12 w-12 opacity-30" />
                  <p className="font-medium text-foreground">No saved reports yet</p>
                  <p className="text-sm">Create one in the report builder to add it here.</p>
                  <Button asChild className="mt-4">
                    <Link href="/reports/builder">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Report
                    </Link>
                  </Button>
                </div>
              )
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleSections.map(section => {
                  const ui = sectionUi[section.id]
                  const Icon = ui.icon

                  return (
                    <Card key={section.id} className="border shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex items-start gap-3">
                          <div className={cn("rounded-lg p-2", ui.color)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
                            <CardDescription className="text-xs">{section.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        {section.reports.map(report => (
                          <Link
                            key={report.id}
                            href={report.href}
                            className="group flex items-center justify-between rounded-md px-2 py-2 -mx-2 text-sm transition-colors hover:bg-muted"
                          >
                            <div>
                              <div className="font-medium">{report.name}</div>
                              <div className="text-xs text-muted-foreground">{report.description}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              {report.starred ? <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> : null}
                              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                          </Link>
                        ))}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModulePage>
  )
}
