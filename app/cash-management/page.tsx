"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  getCashPosition, 
  getBankAccounts, 
  getTransfers,
  getEntities,
} from "@/lib/services"
import type { CashPositionData, BankAccount, Transfer, Entity, DashboardFilters } from "@/lib/types"
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp,
  Building2,
  ArrowRightLeft,
  RefreshCw,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
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
  Legend,
} from "recharts"

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatCurrencyCompact(value: number) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value}`
}

export default function CashDashboardPage() {
  // Filter state
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string>("e4")
  
  // Data state
  const [cashPosition, setCashPosition] = useState<CashPositionData | null>(null)
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [recentTransfers, setRecentTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)

  const filters: DashboardFilters = {
    entityId: selectedEntity,
    dateRange: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(),
      preset: 'this_month',
    },
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [positionData, accountsData, transfersData] = await Promise.all([
        getCashPosition(filters),
        getBankAccounts(),
        getTransfers(filters, undefined, undefined, undefined, 1, 5),
      ])
      setCashPosition(positionData)
      setAccounts(accountsData)
      setRecentTransfers(transfersData.data)
    } finally {
      setLoading(false)
    }
  }, [selectedEntity])

  useEffect(() => {
    getEntities().then(setEntities)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Cash Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor cash position, transfers, and forecasts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cash</p>
                    {loading ? (
                      <Skeleton className="h-8 w-28 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {formatCurrency(cashPosition?.totalCash || 0)}
                      </p>
                    )}
                  </div>
                  <div className="h-10 w-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Inflows</p>
                    {loading ? (
                      <Skeleton className="h-8 w-28 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        +{formatCurrency(cashPosition?.pendingInflows || 0)}
                      </p>
                    )}
                  </div>
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Outflows</p>
                    {loading ? (
                      <Skeleton className="h-8 w-28 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-red-600 mt-1">
                        -{formatCurrency(cashPosition?.pendingOutflows || 0)}
                      </p>
                    )}
                  </div>
                  <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <ArrowDownRight className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">7-Day Projected</p>
                    {loading ? (
                      <Skeleton className="h-8 w-28 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {formatCurrency(cashPosition?.projectedBalance || 0)}
                      </p>
                    )}
                  </div>
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Flow Forecast */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">7-Day Cash Flow Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[280px] w-full" />
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashPosition?.dailyForecast || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => format(new Date(value), 'MMM d')}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatCurrencyCompact(value)}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                        />
                        <Area
                          type="monotone"
                          dataKey="closing"
                          stroke="hsl(var(--accent))"
                          fill="hsl(var(--accent))"
                          fillOpacity={0.2}
                          name="Closing Balance"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Inflows/Outflows */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Daily Cash Movement</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[280px] w-full" />
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cashPosition?.dailyForecast || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => format(new Date(value), 'MMM d')}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatCurrencyCompact(value)}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                        />
                        <Legend />
                        <Bar dataKey="inflows" fill="#22c55e" name="Inflows" />
                        <Bar dataKey="outflows" fill="#ef4444" name="Outflows" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Account Breakdown & Recent Transfers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Account Balances</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/cash-management/accounts">View All</a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cashPosition?.accountBreakdown.map((account) => (
                      <div 
                        key={account.accountId}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-accent/10 rounded-lg flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{account.accountName}</p>
                            <p className="text-xs text-muted-foreground">
                              Available: {formatCurrency(account.available)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold">{formatCurrency(account.balance)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transfers */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Recent Transfers</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/cash-management/transfers">View All</a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentTransfers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowRightLeft className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent transfers</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTransfers.map((transfer) => (
                      <div 
                        key={transfer.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-9 w-9 rounded-lg flex items-center justify-center",
                            transfer.status === 'completed' ? "bg-green-100" :
                            transfer.status === 'processing' ? "bg-yellow-100" :
                            "bg-muted"
                          )}>
                            <ArrowRightLeft className={cn(
                              "h-4 w-4",
                              transfer.status === 'completed' ? "text-green-600" :
                              transfer.status === 'processing' ? "text-yellow-600" :
                              "text-muted-foreground"
                            )} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{transfer.number}</p>
                            <p className="text-xs text-muted-foreground">
                              {transfer.fromAccountName} → {transfer.toAccountName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(transfer.amount)}</p>
                          <p className="text-xs text-muted-foreground capitalize">{transfer.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
