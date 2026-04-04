"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  Download, 
  Printer, 
  RefreshCw, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Building2,
  Calendar,
  Layers,
  X,
  ChevronDown,
  ChevronRight,
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
  PieChart,
  Pie,
} from "recharts"
import { getBudgetVsActual, getEntities, getDepartments, type BudgetActualData, type Department } from "@/lib/services"
import type { Entity, DashboardFilters } from "@/lib/types"
import { cn } from "@/lib/utils"

const DATE_PRESETS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_quarter', label: 'Last Quarter' },
]

const VIEW_MODES = [
  { value: 'category', label: 'By Category' },
  { value: 'department', label: 'By Department' },
  { value: 'entity', label: 'By Entity' },
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

// Mock department budget data
const mockDepartmentBudgets = [
  { id: 'd1', name: 'Operations', budget: 450000, actual: 425000, variance: 25000, variancePercent: 5.6 },
  { id: 'd2', name: 'Finance', budget: 280000, actual: 295000, variance: -15000, variancePercent: -5.4 },
  { id: 'd3', name: 'Sales', budget: 520000, actual: 485000, variance: 35000, variancePercent: 6.7 },
  { id: 'd4', name: 'Marketing', budget: 320000, actual: 375000, variance: -55000, variancePercent: -17.2 },
  { id: 'd5', name: 'Engineering', budget: 680000, actual: 645000, variance: 35000, variancePercent: 5.1 },
  { id: 'd6', name: 'HR', budget: 180000, actual: 172000, variance: 8000, variancePercent: 4.4 },
]

// Mock entity budget data
const mockEntityBudgets = [
  { id: 'e1', name: 'Acme Corporation', budget: 1250000, actual: 1180000, variance: 70000, variancePercent: 5.6 },
  { id: 'e2', name: 'Acme West', budget: 680000, actual: 725000, variance: -45000, variancePercent: -6.6 },
  { id: 'e3', name: 'Acme Europe', budget: 520000, actual: 492000, variance: 28000, variancePercent: 5.4 },
]

export default function BudgetVsActualPage() {
  // Filter state
  const [entityId, setEntityId] = useState("e4")
  const [departmentId, setDepartmentId] = useState("all")
  const [datePreset, setDatePreset] = useState("this_year")
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')
  const [groupBy, setGroupBy] = useState<'category' | 'department' | 'entity'>('category')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  
  // Data state
  const [entities, setEntities] = useState<Entity[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [data, setData] = useState<BudgetActualData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

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
    
    const [entitiesData, departmentsData, budgetData] = await Promise.all([
      getEntities(),
      getDepartments(),
      getBudgetVsActual(filters),
    ])
    
    setEntities(entitiesData)
    setDepartments(departmentsData)
    setData(budgetData)
    setLoading(false)
  }, [entityId, datePreset])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Update active filters
  useEffect(() => {
    const filters: string[] = []
    if (entityId !== 'e4') {
      const entity = entities.find(e => e.id === entityId)
      if (entity) filters.push(`Entity: ${entity.name}`)
    }
    if (departmentId !== 'all') {
      const dept = departments.find(d => d.id === departmentId)
      if (dept) filters.push(`Department: ${dept.name}`)
    }
    setActiveFilters(filters)
  }, [entityId, departmentId, entities, departments])

  const clearFilter = (filter: string) => {
    if (filter.startsWith('Entity:')) {
      setEntityId('e4')
    } else if (filter.startsWith('Department:')) {
      setDepartmentId('all')
    }
  }

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting budget vs actual as ${format}`)
  }

  const handlePrint = () => {
    window.print()
  }

  // Get display data based on groupBy
  const displayData = useMemo(() => {
    switch (groupBy) {
      case 'department':
        return mockDepartmentBudgets
      case 'entity':
        return mockEntityBudgets
      default:
        return data.map(d => ({ id: d.category, name: d.category, ...d }))
    }
  }, [groupBy, data])

  // Calculate totals
  const totals = useMemo(() => {
    return displayData.reduce(
      (acc, item) => ({
        budget: acc.budget + item.budget,
        actual: acc.actual + item.actual,
        variance: acc.variance + item.variance,
      }),
      { budget: 0, actual: 0, variance: 0 }
    )
  }, [displayData])
  
  const totalVariancePercent = totals.budget ? ((totals.actual - totals.budget) / totals.budget) * 100 : 0

  // Items with significant variances
  const alertItems = displayData.filter(item => Math.abs(item.variancePercent) > 10)

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Budget vs Actual</h1>
            <p className="text-sm text-muted-foreground">
              Compare actual performance against budget by category, department, or entity
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

        {/* Sticky Filter Bar */}
        <Card className="sticky top-0 z-10 shadow-sm">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Select value={entityId} onValueChange={setEntityId}>
                  <SelectTrigger className="w-[180px]">
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

              <Separator orientation="vertical" className="h-8" />

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={datePreset} onValueChange={setDatePreset}>
                  <SelectTrigger className="w-[150px]">
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

              <Separator orientation="vertical" className="h-8" />

              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Group by:</span>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  {VIEW_MODES.map((mode) => (
                    <Button
                      key={mode.value}
                      variant={groupBy === mode.value ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setGroupBy(mode.value as 'category' | 'department' | 'entity')}
                    >
                      {mode.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Filter Pills */}
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {activeFilters.map((filter) => (
                  <Badge key={filter} variant="secondary" className="gap-1 text-xs">
                    {filter}
                    <button 
                      onClick={() => clearFilter(filter)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => {
                    setEntityId('e4')
                    setDepartmentId('all')
                  }}
                >
                  Clear all
                </Button>
              </div>
            )}
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

        {/* View Toggle */}
        <div className="flex items-center justify-end gap-2">
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
                    key={item.id}
                    variant="outline"
                    className={cn(
                      "border-amber-300",
                      item.variancePercent > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}
                  >
                    {item.name}: {formatPercent(item.variancePercent)}
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
              <div>
                <CardTitle className="text-lg">
                  Budget vs Actual by {groupBy === 'category' ? 'Category' : groupBy === 'department' ? 'Department' : 'Entity'}
                </CardTitle>
                <CardDescription>
                  {DATE_PRESETS.find(p => p.value === datePreset)?.label} | {entities.find(e => e.id === entityId)?.name || 'All Entities'}
                </CardDescription>
              </div>
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
                      <th className="text-left p-4 font-medium text-sm">
                        {groupBy === 'category' ? 'Category' : groupBy === 'department' ? 'Department' : 'Entity'}
                      </th>
                      <th className="text-right p-4 font-medium text-sm">Budget</th>
                      <th className="text-right p-4 font-medium text-sm">Actual</th>
                      <th className="text-right p-4 font-medium text-sm">Variance</th>
                      <th className="text-right p-4 font-medium text-sm">Var %</th>
                      <th className="p-4 font-medium text-sm w-40">Progress</th>
                      <th className="text-center p-4 font-medium text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {displayData.map((item) => {
                      const progress = item.budget > 0 ? (item.actual / item.budget) * 100 : 0
                      const isOverBudget = item.actual > item.budget
                      const isExpanded = expandedRows.has(item.id)
                      
                      return (
                        <>
                          <tr 
                            key={item.id} 
                            className={cn(
                              "hover:bg-muted/30 transition-colors",
                              groupBy !== 'category' && "cursor-pointer"
                            )}
                            onClick={() => groupBy !== 'category' && toggleRow(item.id)}
                          >
                            <td className="p-4 font-medium">
                              <div className="flex items-center gap-2">
                                {groupBy !== 'category' && (
                                  isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                                )}
                                {item.name}
                              </div>
                            </td>
                            <td className="p-4 text-right font-mono">{formatCurrency(item.budget)}</td>
                            <td className="p-4 text-right font-mono">{formatCurrency(item.actual)}</td>
                            <td className={cn(
                              "p-4 text-right font-mono",
                              item.variance >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
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
                          {/* Expanded sub-rows for department/entity breakdown */}
                          {isExpanded && groupBy !== 'category' && (
                            <>
                              {data.slice(0, 4).map((subItem, idx) => (
                                <tr key={`${item.id}-${idx}`} className="bg-muted/20">
                                  <td className="p-4 pl-12 text-sm text-muted-foreground">{subItem.category}</td>
                                  <td className="p-4 text-right font-mono text-sm">{formatCurrency(Math.round(subItem.budget * (item.budget / totals.budget)))}</td>
                                  <td className="p-4 text-right font-mono text-sm">{formatCurrency(Math.round(subItem.actual * (item.actual / totals.actual)))}</td>
                                  <td className={cn(
                                    "p-4 text-right font-mono text-sm",
                                    subItem.variance >= 0 ? "text-green-600" : "text-red-600"
                                  )}>
                                    {formatCurrency(Math.round(subItem.variance * (item.variance / (totals.variance || 1))))}
                                  </td>
                                  <td className={cn(
                                    "p-4 text-right font-mono text-sm",
                                    subItem.variancePercent >= 0 ? "text-green-600" : "text-red-600"
                                  )}>
                                    {formatPercent(subItem.variancePercent)}
                                  </td>
                                  <td colSpan={2}></td>
                                </tr>
                              ))}
                            </>
                          )}
                        </>
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
                        {totals.variance >= 0 ? '+' : ''}{formatCurrency(totals.variance)}
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
              <div className="p-6">
                <Tabs defaultValue="bar">
                  <TabsList className="mb-4">
                    <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                    <TabsTrigger value="variance">Variance Chart</TabsTrigger>
                  </TabsList>
                  <TabsContent value="bar" className="h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={displayData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                        <YAxis dataKey="name" type="category" width={100} />
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
                          {displayData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.actual <= entry.budget ? '#22c55e' : '#ef4444'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  <TabsContent value="variance" className="h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={displayData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => formatPercent(v)} domain={[-30, 30]} />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip 
                          formatter={(value: number) => formatPercent(value)}
                          labelStyle={{ color: 'var(--foreground)' }}
                          contentStyle={{ 
                            backgroundColor: 'var(--card)', 
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="variancePercent" name="Variance %">
                          {displayData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.variancePercent >= 0 ? '#22c55e' : '#ef4444'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
