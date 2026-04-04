"use client"

import { useState, useEffect, useCallback } from "react"
import { startOfYear } from "date-fns"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/finance/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Download, 
  Printer,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react"
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
import type { 
  DashboardFilters, 
  AgingData,
  Entity,
} from "@/lib/types"
import { 
  getAPAging, 
  getEntities,
  getVendors,
} from "@/lib/services"

const defaultFilters: DashboardFilters = {
  entityId: 'e4',
  dateRange: {
    startDate: startOfYear(new Date()),
    endDate: new Date(),
    preset: 'this_year'
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const bucketColors: Record<string, string> = {
  'Current': '#22c55e',
  '1-30 Days': '#84cc16',
  '31-60 Days': '#eab308',
  '61-90 Days': '#f97316',
  '90+ Days': '#ef4444',
}

interface VendorAgingRow {
  vendorId: string
  vendorName: string
  current: number
  days1to30: number
  days31to60: number
  days61to90: number
  over90: number
  total: number
}

export default function APAgingPage() {
  // Filter state
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters)
  const [entities, setEntities] = useState<Entity[]>([])
  
  // Data state
  const [agingData, setAgingData] = useState<AgingData[]>([])
  const [vendorAging, setVendorAging] = useState<VendorAgingRow[]>([])
  const [loading, setLoading] = useState(true)

  // Load entities on mount
  useEffect(() => {
    getEntities().then(setEntities)
  }, [])

  // Fetch aging data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [agingResult, vendorsResult] = await Promise.all([
        getAPAging(filters),
        getVendors(),
      ])
      setAgingData(agingResult)
      
      // Generate vendor aging breakdown (mock data based on vendors)
      const vendorAgingData: VendorAgingRow[] = (vendorsResult.data || []).slice(0, 10).map((vendor, index) => {
        const multiplier = (10 - index) / 10
        return {
          vendorId: vendor.id,
          vendorName: vendor.name,
          current: Math.round(25000 * multiplier),
          days1to30: Math.round(15000 * multiplier),
          days31to60: Math.round(8000 * multiplier),
          days61to90: Math.round(3000 * multiplier),
          over90: Math.round(1500 * multiplier),
          total: Math.round(52500 * multiplier),
        }
      })
      setVendorAging(vendorAgingData)
    } catch (error) {
      console.error('Error fetching aging data:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle entity change
  const handleEntityChange = (entityId: string) => {
    setFilters(prev => ({ ...prev, entityId }))
  }

  // Calculate totals
  const totals = agingData.reduce((acc, item) => {
    acc.total += item.amount
    acc.count += item.count
    return acc
  }, { total: 0, count: 0 })

  const vendorTotals = vendorAging.reduce((acc, vendor) => ({
    current: acc.current + vendor.current,
    days1to30: acc.days1to30 + vendor.days1to30,
    days31to60: acc.days31to60 + vendor.days31to60,
    days61to90: acc.days61to90 + vendor.days61to90,
    over90: acc.over90 + vendor.over90,
    total: acc.total + vendor.total,
  }), { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, over90: 0, total: 0 })

  // Calculate overdue percentage
  const overdueAmount = agingData
    .filter(d => d.bucket !== 'Current')
    .reduce((sum, d) => sum + d.amount, 0)
  const overduePercentage = totals.total > 0 ? (overdueAmount / totals.total) * 100 : 0

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="AP Aging"
          description="Accounts payable aging analysis"
          actions={
            <div className="flex items-center gap-2">
              <Select value={filters.entityId} onValueChange={handleEntityChange}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="e4">All Entities</SelectItem>
                  {entities.map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-1.5" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Payables</p>
                  <p className="text-2xl font-semibold">
                    {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totals.total)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(vendorTotals.current)}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(overdueAmount)}
                  </p>
                </div>
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Overdue %</p>
                  <p className={`text-2xl font-semibold ${overduePercentage > 20 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {loading ? <Skeleton className="h-8 w-16" /> : `${overduePercentage.toFixed(1)}%`}
                  </p>
                </div>
                {overduePercentage > 20 && <AlertTriangle className="h-5 w-5 text-red-600" />}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aging Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aging Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="bucket" fontSize={12} />
                  <YAxis 
                    fontSize={12}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {agingData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={bucketColors[entry.bucket] || '#6b7280'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Vendor Aging Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aging by Vendor</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Vendor</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">1-30 Days</TableHead>
                  <TableHead className="text-right">31-60 Days</TableHead>
                  <TableHead className="text-right">61-90 Days</TableHead>
                  <TableHead className="text-right">90+ Days</TableHead>
                  <TableHead className="text-right font-semibold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="space-y-2 py-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : vendorAging.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No aging data available
                    </TableCell>
                  </TableRow>
                ) : (
                  vendorAging.map((vendor) => (
                    <TableRow key={vendor.vendorId} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {formatCurrency(vendor.current)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-lime-600">
                        {formatCurrency(vendor.days1to30)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-yellow-600">
                        {formatCurrency(vendor.days31to60)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-orange-600">
                        {formatCurrency(vendor.days61to90)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {formatCurrency(vendor.over90)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(vendor.total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/50">
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-green-600">
                    {formatCurrency(vendorTotals.current)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-lime-600">
                    {formatCurrency(vendorTotals.days1to30)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-yellow-600">
                    {formatCurrency(vendorTotals.days31to60)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-orange-600">
                    {formatCurrency(vendorTotals.days61to90)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-red-600">
                    {formatCurrency(vendorTotals.over90)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {formatCurrency(vendorTotals.total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
