"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Download, 
  Printer, 
  RefreshCw, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
} from "recharts"
import { getBudgetVsActual, getEntities, type BudgetActualData } from "@/lib/services"
import type { Entity, DashboardFilters } from "@/lib/types"
import { cn } from "@/lib/utils"

const DATE_PRESETS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_quarter', label: 'Last Quarter' },
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export default function BudgetVsActualPage() {
  // Filter state
  const [entityId, setEntityId] = useState("e4")
  const [datePreset, setDatePreset] = useState("this_year")
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')
  
  // Data state
  const [entities, setEntities] = useState<Entity[]>([])
  const [data, setData] = useState<BudgetActualData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    const filters: DashboardFilters = {
      entityId,
      dateRange: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        preset: datePreset as DashboardFilters['dateRange']['preset'],
      },
    }
    
    const [entitiesData, budgetData] = await Promise.all([
      getEntities(),
      getBudgetVsActual(filters),
    ])
    
    setEntities(entitiesData)
    setData(budgetData)
    setLoading(false)
  }, [entityId, datePreset])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting budget vs actual as ${format}`)
  }

  const handlePrint = () => {
    window.print()
  }

  // Calculate totals
  const totals = data.reduce(
    (acc, item) => ({
      budget: acc.budget + item.budget,
      actual: acc.actual + item.actual,
      variance: acc.variance + item.variance,
    }),
    { budget: 0, actual: 0, variance: 0 }
  )
  const totalVariancePercent = totals.budget ? ((totals.actual - totals.budget) / totals.budget) * 100 : 0

  // Items with significant variances
  const alertItems = data.filter(item => Math.abs(item.variancePercent) > 10)

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Budget vs Actual</h1>
            <p className="text-sm text-muted-foreground">
              Compare actual performance against budget
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchData()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Select defaultValue="pdf" onValueChange={(v) => handleExport(v as 'pdf' | 'excel' | 'csv')}>
              <SelectTrigger className="w-[130px]">
                <Download className="h-4 w-4 mr-2" />
                <span>Export</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">Export PDF</SelectItem>
                <SelectItem value="excel">Export Excel</SelectItem>
                <SelectItem value="csv">Export CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Entity:</span>
                  <Select value={entityId} onValueChange={setEntityId}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Period:</span>
                  <Select value={datePreset} onValueChange={setDatePreset}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_PRESETS.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === 'chart' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('chart')}
                >
                  Chart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Budget</div>
              {loading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(totals.budget)}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Actual</div>
              {loading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(totals.actual)}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Variance</div>
              {loading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <div className={cn(
                  "text-2xl font-bold",
                  totals.variance >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(totals.variance)}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Variance %</div>
              {loading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <div className={cn(
                  "text-2xl font-bold flex items-center gap-2",
                  totalVariancePercent >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {totalVariancePercent >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  {formatPercent(totalVariancePercent)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {!loading && alertItems.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                Variance Alerts ({alertItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {alertItems.map((item) => (
                  <Badge
                    key={item.category}
                    variant="outline"
                    className={cn(
                      "border-amber-300",
                      item.variancePercent > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}
                  >
                    {item.category}: {formatPercent(item.variancePercent)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Content */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Budget vs Actual Analysis
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {DATE_PRESETS.find(p => p.value === datePreset)?.label}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium text-sm">Category</th>
                      <th className="text-right p-4 font-medium text-sm">Budget</th>
                      <th className="text-right p-4 font-medium text-sm">Actual</th>
                      <th className="text-right p-4 font-medium text-sm">Variance</th>
                      <th className="text-right p-4 font-medium text-sm">Variance %</th>
                      <th className="p-4 font-medium text-sm w-40">Progress</th>
                      <th className="text-center p-4 font-medium text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.map((item) => {
                      const progress = item.budget > 0 ? (item.actual / item.budget) * 100 : 0
                      const isOverBudget = item.actual > item.budget
                      
                      return (
                        <tr key={item.category} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium">{item.category}</td>
                          <td className="p-4 text-right font-mono">{formatCurrency(item.budget)}</td>
                          <td className="p-4 text-right font-mono">{formatCurrency(item.actual)}</td>
                          <td className={cn(
                            "p-4 text-right font-mono",
                            item.variance >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {formatCurrency(item.variance)}
                          </td>
                          <td className={cn(
                            "p-4 text-right font-mono",
                            item.variancePercent >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {formatPercent(item.variancePercent)}
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <Progress 
                                value={Math.min(progress, 100)} 
                                className={cn(
                                  "h-2",
                                  isOverBudget ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"
                                )}
                              />
                              <span className="text-xs text-muted-foreground">
                                {progress.toFixed(0)}% of budget
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {isOverBudget ? (
                              <Badge variant="destructive" className="text-xs">
                                Over Budget
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                On Track
                              </Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50 font-semibold">
                      <td className="p-4">Total</td>
                      <td className="p-4 text-right font-mono">{formatCurrency(totals.budget)}</td>
                      <td className="p-4 text-right font-mono">{formatCurrency(totals.actual)}</td>
                      <td className={cn(
                        "p-4 text-right font-mono",
                        totals.variance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrency(totals.variance)}
                      </td>
                      <td className={cn(
                        "p-4 text-right font-mono",
                        totalVariancePercent >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatPercent(totalVariancePercent)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-6 h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis dataKey="category" type="category" width={100} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: 'var(--foreground)' }}
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="budget" name="Budget" fill="hsl(var(--muted-foreground))" />
                    <Bar dataKey="actual" name="Actual">
                      {data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.actual <= entry.budget ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
