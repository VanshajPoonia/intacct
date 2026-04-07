"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Download, 
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AppShell } from "@/components/layout/app-shell"
import type { Entity, DashboardFilters, AgingData } from "@/lib/types"
import { 
  getARAging, 
  getEntities,
  getCustomers,
} from "@/lib/services"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface CustomerAgingData {
  customerId: string
  customerName: string
  current: number
  days1to30: number
  days31to60: number
  days61to90: number
  over90: number
  total: number
}

export default function ARAgingPage() {
  // Data state
  const [agingData, setAgingData] = useState<AgingData[]>([])
  const [customerAging, setCustomerAging] = useState<CustomerAgingData[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [entityId, setEntityId] = useState("e4")
  const [asOfDate, setAsOfDate] = useState("today")

  // Build filters
  const filters: DashboardFilters = {
    entityId,
    dateRange: {
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      preset: 'this_year'
    }
  }

  // Generate mock customer aging data
  const generateCustomerAging = useCallback((): CustomerAgingData[] => {
    const multiplier = entityId === 'e4' ? 1 : entityId === 'e1' ? 0.6 : 0.2
    return [
      {
        customerId: 'c1',
        customerName: 'Globex Corporation',
        current: Math.round(45000 * multiplier),
        days1to30: Math.round(22000 * multiplier),
        days31to60: Math.round(8500 * multiplier),
        days61to90: Math.round(3200 * multiplier),
        over90: Math.round(1500 * multiplier),
        total: Math.round(80200 * multiplier),
      },
      {
        customerId: 'c2',
        customerName: 'Initech Industries',
        current: Math.round(32000 * multiplier),
        days1to30: Math.round(15000 * multiplier),
        days31to60: Math.round(5500 * multiplier),
        days61to90: 0,
        over90: 0,
        total: Math.round(52500 * multiplier),
      },
      {
        customerId: 'c3',
        customerName: 'Umbrella Corp',
        current: Math.round(28000 * multiplier),
        days1to30: Math.round(12000 * multiplier),
        days31to60: Math.round(9000 * multiplier),
        days61to90: Math.round(6500 * multiplier),
        over90: Math.round(4200 * multiplier),
        total: Math.round(59700 * multiplier),
      },
      {
        customerId: 'c4',
        customerName: 'Wayne Enterprises',
        current: Math.round(55000 * multiplier),
        days1to30: Math.round(8000 * multiplier),
        days31to60: 0,
        days61to90: 0,
        over90: 0,
        total: Math.round(63000 * multiplier),
      },
      {
        customerId: 'c5',
        customerName: 'Stark Industries',
        current: Math.round(72000 * multiplier),
        days1to30: Math.round(18000 * multiplier),
        days31to60: Math.round(4000 * multiplier),
        days61to90: Math.round(2000 * multiplier),
        over90: 0,
        total: Math.round(96000 * multiplier),
      },
    ]
  }, [entityId])

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    const [aging, entitiesData] = await Promise.all([
      getARAging(filters),
      getEntities(),
    ])
    setAgingData(aging)
    setEntities(entitiesData)
    setCustomerAging(generateCustomerAging())
    setLoading(false)
  }, [entityId, generateCustomerAging])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculate totals
  const totals = {
    current: customerAging.reduce((sum, c) => sum + c.current, 0),
    days1to30: customerAging.reduce((sum, c) => sum + c.days1to30, 0),
    days31to60: customerAging.reduce((sum, c) => sum + c.days31to60, 0),
    days61to90: customerAging.reduce((sum, c) => sum + c.days61to90, 0),
    over90: customerAging.reduce((sum, c) => sum + c.over90, 0),
    total: customerAging.reduce((sum, c) => sum + c.total, 0),
  }

  const pastDueAmount = totals.days1to30 + totals.days31to60 + totals.days61to90 + totals.over90
  const pastDuePercent = totals.total > 0 ? (pastDueAmount / totals.total) * 100 : 0

  // Chart colors
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">AR Aging Analysis</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Accounts receivable aging by customer
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={asOfDate} onValueChange={setAsOfDate}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">As of Today</SelectItem>
                <SelectItem value="month_end">Month End</SelectItem>
                <SelectItem value="quarter_end">Quarter End</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
          </div>
        </div>

        {/* Entity Filter */}
        <div className="flex items-center gap-3">
          <Select value={entityId} onValueChange={setEntityId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="e4">All Entities</SelectItem>
              {entities.filter(e => e.id !== 'e4').map(entity => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total AR Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <>
                  <div className="text-2xl font-semibold">{formatCurrency(totals.total)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Users className="h-3 w-3 inline mr-1" />
                    {customerAging.length} customers
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <>
                  <div className="text-2xl font-semibold text-green-600">{formatCurrency(totals.current)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totals.total > 0 ? ((totals.current / totals.total) * 100).toFixed(1) : 0}% of total
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Past Due</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <>
                  <div className="text-2xl font-semibold text-amber-600">{formatCurrency(pastDueAmount)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    {pastDuePercent.toFixed(1)}% past due
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Over 90 Days</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <>
                  <div className="text-2xl font-semibold text-red-600">{formatCurrency(totals.over90)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totals.total > 0 ? ((totals.over90 / totals.total) * 100).toFixed(1) : 0}% at risk
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Aging by Bucket</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agingData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="bucket" className="text-xs" />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    className="text-xs"
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelClassName="font-medium"
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {agingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Customer Aging Table */}
        <Card>
          <CardHeader>
            <CardTitle>Aging by Customer</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">1-30 Days</TableHead>
                  <TableHead className="text-right">31-60 Days</TableHead>
                  <TableHead className="text-right">61-90 Days</TableHead>
                  <TableHead className="text-right">Over 90 Days</TableHead>
                  <TableHead className="text-right font-semibold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {customerAging.map(customer => (
                      <TableRow key={customer.customerId} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{customer.customerName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(customer.current)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(customer.days1to30)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(customer.days31to60)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(customer.days61to90)}</TableCell>
                        <TableCell className={`text-right ${customer.over90 > 0 ? 'text-red-600 font-medium' : ''}`}>
                          {formatCurrency(customer.over90)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(customer.total)}</TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.current)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.days1to30)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.days31to60)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.days61to90)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(totals.over90)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.total)}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
