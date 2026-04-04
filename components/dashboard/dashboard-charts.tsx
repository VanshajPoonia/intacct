"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Expand, BarChart3, Table2 } from "lucide-react"
import type {
  RevenueByChannelData,
  DepartmentExpenseData,
  CashWeeklyData,
  ContractExpenseData,
  AgingData,
  BudgetActualData,
  EntityPerformanceData,
} from "@/lib/types"

interface DashboardChartsProps {
  revenueByChannel: RevenueByChannelData[]
  departmentExpenses: DepartmentExpenseData[]
  cashWeekly: CashWeeklyData[]
  contractExpenses: ContractExpenseData[]
  apAging: AgingData[]
  arAging: AgingData[]
  budgetVsActual: BudgetActualData[]
  entityPerformance: EntityPerformanceData[]
  loading: boolean
  isConsolidated: boolean
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value}`
}

const formatCurrencyFull = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  )
}

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  onExpand?: () => void
  viewMode?: 'chart' | 'table'
  onViewModeChange?: (mode: 'chart' | 'table') => void
  tableContent?: React.ReactNode
}

function ChartCard({ 
  title, 
  description, 
  children, 
  onExpand,
  viewMode = 'chart',
  onViewModeChange,
  tableContent 
}: ChartCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onViewModeChange && (
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 w-7 p-0 rounded-r-none ${viewMode === 'chart' ? 'bg-muted' : ''}`}
                onClick={() => onViewModeChange('chart')}
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 w-7 p-0 rounded-l-none ${viewMode === 'table' ? 'bg-muted' : ''}`}
                onClick={() => onViewModeChange('table')}
              >
                <Table2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {onExpand && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onExpand}>
              <Expand className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {viewMode === 'chart' ? children : tableContent}
      </CardContent>
    </Card>
  )
}

export function DashboardCharts({
  revenueByChannel,
  departmentExpenses,
  cashWeekly,
  contractExpenses,
  apAging,
  arAging,
  budgetVsActual,
  entityPerformance,
  loading,
  isConsolidated,
}: DashboardChartsProps) {
  const [expandedChart, setExpandedChart] = useState<string | null>(null)
  const [viewModes, setViewModes] = useState<Record<string, 'chart' | 'table'>>({})

  const toggleViewMode = (chartId: string) => {
    setViewModes(prev => ({
      ...prev,
      [chartId]: prev[chartId] === 'table' ? 'chart' : 'table'
    }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartSkeleton height={200} />
          <ChartSkeleton height={200} />
          <ChartSkeleton height={200} />
        </div>
      </div>
    )
  }

  const apTotal = apAging.reduce((sum, a) => sum + a.amount, 0)
  const arTotal = arAging.reduce((sum, a) => sum + a.amount, 0)

  return (
    <>
      <div className="space-y-4">
        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue by Channel - Stacked Bar */}
          <ChartCard
            title="Revenue by Channel"
            description="Monthly breakdown by sales channel"
            onExpand={() => setExpandedChart('revenue-channel')}
            viewMode={viewModes['revenue-channel'] || 'chart'}
            onViewModeChange={() => toggleViewMode('revenue-channel')}
            tableContent={
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Month</th>
                      <th className="text-right py-2 font-medium">Direct</th>
                      <th className="text-right py-2 font-medium">Partner</th>
                      <th className="text-right py-2 font-medium">Online</th>
                      <th className="text-right py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueByChannel.map((row) => (
                      <tr key={row.channel} className="border-b last:border-0">
                        <td className="py-2">{row.channel}</td>
                        <td className="text-right py-2 tabular-nums">{formatCurrency(row.direct)}</td>
                        <td className="text-right py-2 tabular-nums">{formatCurrency(row.partner)}</td>
                        <td className="text-right py-2 tabular-nums">{formatCurrency(row.online)}</td>
                        <td className="text-right py-2 tabular-nums font-medium">
                          {formatCurrency(row.direct + row.partner + row.online)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByChannel} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="channel" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={formatCurrency} />
                <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
                <Legend />
                <Bar dataKey="direct" stackId="a" fill={COLORS[0]} name="Direct" radius={[0, 0, 0, 0]} />
                <Bar dataKey="partner" stackId="a" fill={COLORS[1]} name="Partner" radius={[0, 0, 0, 0]} />
                <Bar dataKey="online" stackId="a" fill={COLORS[2]} name="Online" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Cash Flow Weekly - Line Chart */}
          <ChartCard
            title="Weekly Cash Flow"
            description="Cash position over the past 6 weeks"
            onExpand={() => setExpandedChart('cash-weekly')}
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={cashWeekly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={formatCurrency} />
                <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
                <Legend />
                <Line type="monotone" dataKey="closing" stroke={COLORS[0]} strokeWidth={2} name="Closing Balance" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="inflow" stroke={COLORS[2]} strokeWidth={2} name="Inflows" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="outflow" stroke={COLORS[3]} strokeWidth={2} name="Outflows" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Department Expenses & Contract Expenses Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Salary by Department - Bar Chart */}
          <ChartCard
            title="Expenses by Department"
            description="Breakdown by expense category"
            onExpand={() => setExpandedChart('dept-expenses')}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={departmentExpenses} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={formatCurrency} />
                <YAxis type="category" dataKey="department" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={80} />
                <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
                <Legend />
                <Bar dataKey="salary" stackId="a" fill={COLORS[0]} name="Salary" />
                <Bar dataKey="benefits" stackId="a" fill={COLORS[1]} name="Benefits" />
                <Bar dataKey="travel" stackId="a" fill={COLORS[2]} name="Travel" />
                <Bar dataKey="supplies" stackId="a" fill={COLORS[3]} name="Supplies" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Contract Expenses by Rep - Donut */}
          <ChartCard
            title="Contract Expenses by Rep"
            description="Distribution across sales representatives"
            onExpand={() => setExpandedChart('contract-expenses')}
          >
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={contractExpenses}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="rep"
                >
                  {contractExpenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="middle" align="right" layout="vertical" />
                <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Aging & Budget Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* AP Aging */}
          <ChartCard title="AP Aging" description={`Total: ${formatCurrencyFull(apTotal)}`}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={apAging}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="amount"
                  nameKey="bucket"
                >
                  {apAging.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs">{value}</span>} />
                <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* AR Aging */}
          <ChartCard title="AR Aging" description={`Total: ${formatCurrencyFull(arTotal)}`}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={arAging}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="amount"
                  nameKey="bucket"
                >
                  {arAging.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs">{value}</span>} />
                <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Budget vs Actual */}
          <ChartCard 
            title="Budget vs Actual" 
            description="YTD performance"
            viewMode={viewModes['budget'] || 'chart'}
            onViewModeChange={() => toggleViewMode('budget')}
            tableContent={
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Category</th>
                      <th className="text-right py-2 font-medium">Budget</th>
                      <th className="text-right py-2 font-medium">Actual</th>
                      <th className="text-right py-2 font-medium">Var %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetVsActual.map((row) => (
                      <tr key={row.category} className="border-b last:border-0">
                        <td className="py-2">{row.category}</td>
                        <td className="text-right py-2 tabular-nums">{formatCurrency(row.budget)}</td>
                        <td className="text-right py-2 tabular-nums">{formatCurrency(row.actual)}</td>
                        <td className={`text-right py-2 tabular-nums ${row.variancePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.variancePercent >= 0 ? '+' : ''}{row.variancePercent.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={budgetVsActual} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={formatCurrency} />
                <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
                <Bar dataKey="budget" fill={COLORS[1]} name="Budget" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill={COLORS[0]} name="Actual" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Entity Performance (only in consolidated view) */}
        {isConsolidated && entityPerformance.length > 1 && (
          <ChartCard
            title="Entity Performance Snapshot"
            description="Comparison across subsidiaries"
            viewMode={viewModes['entity'] || 'chart'}
            onViewModeChange={() => toggleViewMode('entity')}
            tableContent={
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Entity</th>
                      <th className="text-right py-2 font-medium">Revenue</th>
                      <th className="text-right py-2 font-medium">Expenses</th>
                      <th className="text-right py-2 font-medium">Net Income</th>
                      <th className="text-right py-2 font-medium">Cash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entityPerformance.map((row) => (
                      <tr key={row.entityId} className="border-b last:border-0">
                        <td className="py-2 font-medium">{row.entityName}</td>
                        <td className="text-right py-2 tabular-nums">{formatCurrency(row.revenue)}</td>
                        <td className="text-right py-2 tabular-nums">{formatCurrency(row.expenses)}</td>
                        <td className="text-right py-2 tabular-nums text-emerald-600">{formatCurrency(row.netIncome)}</td>
                        <td className="text-right py-2 tabular-nums">{formatCurrency(row.cashBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={entityPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="entityName" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={formatCurrency} />
                <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
                <Legend />
                <Bar dataKey="revenue" fill={COLORS[0]} name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill={COLORS[1]} name="Expenses" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netIncome" fill={COLORS[2]} name="Net Income" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Expanded Chart Modal */}
      <Dialog open={!!expandedChart} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {expandedChart === 'revenue-channel' && 'Revenue by Channel'}
              {expandedChart === 'cash-weekly' && 'Weekly Cash Flow'}
              {expandedChart === 'dept-expenses' && 'Expenses by Department'}
              {expandedChart === 'contract-expenses' && 'Contract Expenses by Rep'}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[500px]">
            {expandedChart === 'revenue-channel' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByChannel} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="channel" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
                  <Legend />
                  <Bar dataKey="direct" stackId="a" fill={COLORS[0]} name="Direct" />
                  <Bar dataKey="partner" stackId="a" fill={COLORS[1]} name="Partner" />
                  <Bar dataKey="online" stackId="a" fill={COLORS[2]} name="Online" />
                </BarChart>
              </ResponsiveContainer>
            )}
            {expandedChart === 'cash-weekly' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashWeekly} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="closing" stroke={COLORS[0]} strokeWidth={2} name="Closing Balance" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="inflow" stroke={COLORS[2]} strokeWidth={2} name="Inflows" />
                  <Line type="monotone" dataKey="outflow" stroke={COLORS[3]} strokeWidth={2} name="Outflows" />
                </LineChart>
              </ResponsiveContainer>
            )}
            {expandedChart === 'dept-expenses' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentExpenses} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={formatCurrency} />
                  <YAxis type="category" dataKey="department" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={100} />
                  <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
                  <Legend />
                  <Bar dataKey="salary" stackId="a" fill={COLORS[0]} name="Salary" />
                  <Bar dataKey="benefits" stackId="a" fill={COLORS[1]} name="Benefits" />
                  <Bar dataKey="travel" stackId="a" fill={COLORS[2]} name="Travel" />
                  <Bar dataKey="supplies" stackId="a" fill={COLORS[3]} name="Supplies" />
                </BarChart>
              </ResponsiveContainer>
            )}
            {expandedChart === 'contract-expenses' && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contractExpenses}
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={180}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="rep"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {contractExpenses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
