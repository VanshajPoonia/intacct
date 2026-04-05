"use client"

import { use, useMemo, useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Download, Edit, FileText, Filter, Mail, MoreHorizontal, Play, Printer, RefreshCw, Share2, Star, StarOff, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Pie, PieChart, Cell } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { getSavedReports, toggleReportFavorite, formatCurrency, formatDate } from "@/lib/services"
import type { SavedReport } from "@/lib/services"

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<SavedReport | null>(null)
  const [dateRange, setDateRange] = useState("this_year")
  const [entity, setEntity] = useState("all")

  const fetchReport = useCallback(async () => {
    setLoading(true)
    const reports = await getSavedReports()
    const found = reports.find(r => r.id === id) || reports[0]
    setReport(found)
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleToggleFavorite = async () => {
    if (!report) return
    await toggleReportFavorite(report.id)
    fetchReport()
  }

  // Generate mock report data
  const reportData = useMemo(() => {
    if (!report) return []
    return [
      { category: "Revenue", current: 1250000, previous: 1150000, budget: 1300000, variance: 100000 },
      { category: "Cost of Goods Sold", current: 625000, previous: 575000, budget: 650000, variance: -50000 },
      { category: "Gross Profit", current: 625000, previous: 575000, budget: 650000, variance: 50000 },
      { category: "Operating Expenses", current: 375000, previous: 350000, budget: 400000, variance: 25000 },
      { category: "Operating Income", current: 250000, previous: 225000, budget: 250000, variance: 25000 },
      { category: "Other Income", current: 15000, previous: 12000, budget: 10000, variance: 3000 },
      { category: "Net Income", current: 265000, previous: 237000, budget: 260000, variance: 28000 },
    ]
  }, [report])

  const chartData = useMemo(() => 
    reportData.map(d => ({
      name: d.category,
      current: d.current,
      previous: d.previous,
      budget: d.budget,
    })),
    [reportData]
  )

  const pieData = useMemo(() => [
    { name: "Revenue", value: 1250000, fill: CHART_COLORS[0] },
    { name: "COGS", value: 625000, fill: CHART_COLORS[1] },
    { name: "OpEx", value: 375000, fill: CHART_COLORS[2] },
    { name: "Net Income", value: 265000, fill: CHART_COLORS[3] },
  ], [])

  const chartConfig: ChartConfig = {
    current: { label: "Current", color: CHART_COLORS[0] },
    previous: { label: "Previous", color: CHART_COLORS[1] },
    budget: { label: "Budget", color: CHART_COLORS[2] },
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-96" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium">Report not found</h2>
          <p className="text-muted-foreground">The report you&apos;re looking for doesn&apos;t exist.</p>
          <Button asChild className="mt-4">
            <Link href="/reports">Back to Reports</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/reports">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{report.name}</h1>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleToggleFavorite}
                >
                  {report.isFavorite ? (
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  ) : (
                    <StarOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="capitalize">{report.type.replace("_", " ")}</span>
                {" "}&middot; Last run {report.lastRunAt ? formatDate(report.lastRunAt) : "never"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-36">
                <Calendar className="mr-2 h-4 w-4" />
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
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="acme">Acme Corp</SelectItem>
                <SelectItem value="subsidiary">Subsidiary Inc</SelectItem>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Report
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Mail className="mr-2 h-4 w-4" />
                  Schedule Delivery
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(1250000)}</p>
                <p className="text-xs text-green-600 mt-1">+8.7% from prior period</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Gross Profit</p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(625000)}</p>
                <p className="text-xs text-green-600 mt-1">+8.7% from prior period</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Net Income</p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(265000)}</p>
                <p className="text-xs text-green-600 mt-1">+11.8% from prior period</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold mt-2">21.2%</p>
                <p className="text-xs text-green-600 mt-1">+0.6% from prior period</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
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
                        <TableHead className="text-right">Current Period</TableHead>
                        <TableHead className="text-right">Previous Period</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                        <TableHead className="text-right">Var %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((row, i) => (
                        <TableRow key={row.category} className={i === reportData.length - 1 ? "font-semibold bg-muted/50" : ""}>
                          <TableCell className="font-medium">{row.category}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.current)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.previous)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.budget)}</TableCell>
                          <TableCell className={`text-right ${row.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {row.variance >= 0 ? "+" : ""}{formatCurrency(row.variance)}
                          </TableCell>
                          <TableCell className={`text-right ${row.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {row.variance >= 0 ? "+" : ""}{((row.variance / row.previous) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
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
                    <BarChart data={chartData} accessibilityLayer>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={8}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
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
                    <LineChart data={chartData} accessibilityLayer>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={8}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
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
                  <CardTitle className="text-base">Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[400px] w-full">
                    <PieChart accessibilityLayer>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        innerRadius={80}
                        paddingAngle={2}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Report Info */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Report Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Report Type</span>
                  <span className="capitalize">{report.type.replace("_", " ")}</span>
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
                  <span className="text-muted-foreground">Last Modified</span>
                  <span>{formatDate(report.updatedAt)}</span>
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
              <CardHeader>
                <CardTitle className="text-base">Run History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: new Date(), user: "Sarah Chen", duration: "2.3s" },
                    { date: new Date(Date.now() - 86400000), user: "Mike Wilson", duration: "1.8s" },
                    { date: new Date(Date.now() - 172800000), user: "Sarah Chen", duration: "2.1s" },
                  ].map((run, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(run.date.toISOString())}</span>
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span>{run.user}</span>
                        <Badge variant="outline">{run.duration}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
