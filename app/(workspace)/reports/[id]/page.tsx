"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, Download, Filter, Mail, Play, Printer, RefreshCw, Share2, Star, StarOff } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts"
import { ModulePage } from "@/components/layout/module-page"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { getReportDetailData, toggleReportFavorite, type ReportDetailData } from "@/lib/services"
import { formatCurrency, formatDate } from "@/lib/utils"

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

const toneClasses = {
  neutral: "text-muted-foreground",
  positive: "text-emerald-600",
  warning: "text-amber-600",
  critical: "text-red-600",
} as const

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<ReportDetailData | null>(null)
  const [datePreset, setDatePreset] = useState<"this_month" | "this_quarter" | "this_year" | "last_month" | "last_quarter" | "last_year">("this_year")
  const [entityId, setEntityId] = useState("all")

  useEffect(() => {
    let cancelled = false

    async function loadDetail() {
      setLoading(true)
      const result = await getReportDetailData(id, {
        entityId,
        datePreset,
      })

      if (!cancelled) {
        setDetail(result)
        setLoading(false)
      }
    }

    void loadDetail()

    return () => {
      cancelled = true
    }
  }, [datePreset, entityId, id])

  async function handleToggleFavorite() {
    if (!detail) {
      return
    }

    await toggleReportFavorite(detail.report.id)
    const refreshed = await getReportDetailData(id, { entityId, datePreset })
    setDetail(refreshed)
  }

  const chartConfig: ChartConfig = {
    current: { label: "Current", color: CHART_COLORS[0] },
    previous: { label: "Previous", color: CHART_COLORS[1] },
    budget: { label: "Budget", color: CHART_COLORS[2] },
  }

  const pieRows = useMemo(
    () =>
      (detail?.pieRows ?? []).map((row, index) => ({
        ...row,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      })),
    [detail?.pieRows]
  )

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-[420px] w-full" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Report not found</AlertTitle>
          <AlertDescription>The saved report you requested could not be loaded from the database.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { report, summaryMetrics, comparisonRows, chartRows, availableEntities, runHistory } = detail

  return (
    <ModulePage
      title={report.name}
      description={`Saved ${report.type.replace(/_/g, " ")} output with drill-down friendly mock data.`}
      breadcrumbs={[
        { label: "Reports", href: "/reports" },
        { label: report.name },
      ]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleToggleFavorite}>
            {report.isFavorite ? <Star className="mr-2 h-4 w-4 fill-amber-500 text-amber-500" /> : <StarOff className="mr-2 h-4 w-4" />}
            {report.isFavorite ? "Favorited" : "Favorite"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col gap-4 p-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="capitalize">
                {report.type.replace(/_/g, " ")}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Created {formatDate(report.createdAt)}
              </span>
              {report.lastRunAt ? (
                <span className="text-sm text-muted-foreground">Last run {formatDate(report.lastRunAt)}</span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={datePreset} onValueChange={value => setDatePreset(value as typeof datePreset)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="this_quarter">This Quarter</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_quarter">Last Quarter</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {availableEntities.map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm">
                <Play className="mr-2 h-4 w-4" />
                Run Report
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryMetrics.map(metric => (
            <Card key={metric.id}>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">{metric.label}</div>
                <div className="mt-2 text-2xl font-semibold">{metric.value}</div>
                <div className={`mt-1 text-xs ${toneClasses[metric.tone]}`}>{metric.detail}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="table" className="space-y-4">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            <TabsTrigger value="line">Trend</TabsTrigger>
            <TabsTrigger value="pie">Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Report Data</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Previous</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right">Var %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonRows.map((row, index) => {
                      const variancePercent = row.budget === 0 ? 0 : (row.variance / row.budget) * 100
                      return (
                        <TableRow key={row.category} className={index === comparisonRows.length - 1 ? "bg-muted/40 font-semibold" : ""}>
                          <TableCell className="font-medium">{row.category}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.current)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.previous)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.budget)}</TableCell>
                          <TableCell className={`text-right ${row.variance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {row.variance >= 0 ? "+" : ""}
                            {formatCurrency(row.variance)}
                          </TableCell>
                          <TableCell className={`text-right ${variancePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {variancePercent >= 0 ? "+" : ""}
                            {variancePercent.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bar">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comparison Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                  <BarChart data={chartRows} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={value => `$${Math.round(Number(value) / 1000)}k`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="current" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="previous" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="budget" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="line">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                  <LineChart data={chartRows} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={value => `$${Math.round(Number(value) / 1000)}k`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="current" stroke={CHART_COLORS[0]} strokeWidth={2} dot />
                    <Line type="monotone" dataKey="previous" stroke={CHART_COLORS[1]} strokeWidth={2} dot />
                    <Line type="monotone" dataKey="budget" stroke={CHART_COLORS[2]} strokeWidth={2} dot strokeDasharray="5 5" />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pie">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                  <PieChart accessibilityLayer>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={pieRows}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      innerRadius={80}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieRows.map(row => (
                        <Cell key={row.name} fill={row.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Report Type</span>
                <span className="capitalize">{report.type.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created By</span>
                <span>{report.createdBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created Date</span>
                <span>{formatDate(report.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Run</span>
                <span>{report.lastRunAt ? formatDate(report.lastRunAt) : "Never"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Columns</span>
                <span>{report.columns.length} selected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grouping</span>
                <span className="capitalize">{report.groupBy || "None"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Run History</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Mail className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {runHistory.map(run => (
                <div key={run.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(run.date)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{run.user}</span>
                    <Badge variant="outline">{run.duration}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </ModulePage>
  )
}
