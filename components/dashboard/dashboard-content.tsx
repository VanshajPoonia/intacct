"use client"

import { MetricCard } from "@/components/finance/metric-card"
import { ChartCard } from "@/components/charts/chart-card"
import { SectionHeader } from "@/components/finance/section-header"
import { StatusBadge } from "@/components/finance/status-badge"
import { DataTable, type Column } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  dashboardMetrics, 
  revenueChartData, 
  cashFlowChartData, 
  apAgingData,
  arAgingData,
  approvalItems,
  transactions,
  invoices,
  bills 
} from "@/lib/mock-data"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import type { ApprovalItem, Transaction } from "@/lib/types"

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const approvalColumns: Column<ApprovalItem>[] = [
  {
    key: 'documentNumber',
    header: 'Document',
    cell: (item) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{item.documentNumber}</span>
        <span className="text-xs text-muted-foreground capitalize">{item.type.replace('_', ' ')}</span>
      </div>
    )
  },
  {
    key: 'description',
    header: 'Description',
    cell: (item) => (
      <span className="text-sm text-muted-foreground truncate block max-w-[200px]">
        {item.description}
      </span>
    )
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    cell: (item) => (
      <span className="font-medium tabular-nums">{formatCurrency(item.amount)}</span>
    )
  },
  {
    key: 'status',
    header: 'Status',
    cell: (item) => <StatusBadge status={item.status} />
  }
]

const transactionColumns: Column<Transaction>[] = [
  {
    key: 'date',
    header: 'Date',
    cell: (item) => (
      <span className="text-sm tabular-nums">{format(item.date, 'MMM d')}</span>
    )
  },
  {
    key: 'description',
    header: 'Description',
    cell: (item) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{item.description}</span>
        <span className="text-xs text-muted-foreground">{item.accountName}</span>
      </div>
    )
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    cell: (item) => (
      <span className={`font-medium tabular-nums ${item.type === 'credit' ? 'text-emerald-600' : ''}`}>
        {item.type === 'credit' ? '+' : '-'}{formatCurrency(item.amount)}
      </span>
    )
  },
  {
    key: 'status',
    header: 'Status',
    cell: (item) => <StatusBadge status={item.status} />
  }
]

export function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Financial overview for March 2024</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Expenses Chart */}
        <ChartCard 
          title="Revenue vs Expenses" 
          description="Monthly comparison (YTD)"
          actions={[
            { label: 'View Details', onClick: () => {} },
            { label: 'Export Data', onClick: () => {} }
          ]}
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => `$${value / 1000}k`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--chart-1))" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                strokeWidth={2}
                name="Revenue"
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                stroke="hsl(var(--chart-2))" 
                fillOpacity={1} 
                fill="url(#colorExpenses)" 
                strokeWidth={2}
                name="Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Cash Flow Chart */}
        <ChartCard 
          title="Cash Flow" 
          description="Inflows and outflows (6 months)"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cashFlowChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => `$${value / 1000}k`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="inflow" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Inflow" />
              <Bar dataKey="outflow" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Outflow" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Aging Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AP Aging */}
        <ChartCard title="Accounts Payable Aging" description="Total: $161,800">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={apAgingData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {apAgingData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend 
                verticalAlign="middle" 
                align="right" 
                layout="vertical"
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* AR Aging */}
        <ChartCard title="Accounts Receivable Aging" description="Total: $537,500">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={arAgingData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {arAgingData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend 
                verticalAlign="middle" 
                align="right" 
                layout="vertical"
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Approvals */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Pending Approvals</CardTitle>
              <Link href="/approvals">
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <DataTable 
              columns={approvalColumns} 
              data={approvalItems.filter(a => a.status === 'pending').slice(0, 4)} 
              compact
              emptyMessage="No pending approvals"
            />
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
              <Link href="/cash-management/transactions">
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <DataTable 
              columns={transactionColumns} 
              data={transactions.slice(0, 4)} 
              compact
              emptyMessage="No recent transactions"
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <SectionHeader title="Outstanding Invoices" />
            <div className="mt-3 space-y-2">
              {invoices.filter(i => i.status !== 'paid').slice(0, 3).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{invoice.customerName}</span>
                    <span className="text-xs text-muted-foreground">{invoice.number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium tabular-nums">{formatCurrency(invoice.amount)}</span>
                    <StatusBadge status={invoice.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <SectionHeader title="Upcoming Payments" />
            <div className="mt-3 space-y-2">
              {bills.filter(b => b.status !== 'paid').slice(0, 3).map((bill) => (
                <div key={bill.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{bill.vendorName}</span>
                    <span className="text-xs text-muted-foreground">Due {format(bill.dueDate, 'MMM d')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium tabular-nums">{formatCurrency(bill.amount)}</span>
                    <StatusBadge status={bill.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <SectionHeader title="Quick Actions" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start h-9">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Invoice
              </Button>
              <Button variant="outline" size="sm" className="justify-start h-9">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Bill
              </Button>
              <Button variant="outline" size="sm" className="justify-start h-9">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Journal Entry
              </Button>
              <Button variant="outline" size="sm" className="justify-start h-9">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Transfer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
