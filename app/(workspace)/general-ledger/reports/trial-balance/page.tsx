"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { startOfYear, startOfMonth, endOfMonth, format } from "date-fns"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/finance/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Download, 
  Printer,
  CalendarIcon,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Building2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { DashboardFilters, Entity } from "@/lib/types"
import type { TrialBalanceRow } from "@/lib/services"
import { getTrialBalance, getEntities } from "@/lib/services"

const typeColors: Record<string, string> = {
  asset: "text-blue-600",
  liability: "text-purple-600",
  equity: "text-green-600",
  revenue: "text-emerald-600",
  expense: "text-orange-600",
}

const formatCurrency = (value: number) => {
  if (value === 0) return "-"
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

const defaultFilters: DashboardFilters = {
  entityId: 'e1',
  dateRange: {
    startDate: startOfYear(new Date()),
    endDate: new Date(),
    preset: 'this_year'
  }
}

export default function TrialBalancePage() {
  // Filter state
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters)
  const [entities, setEntities] = useState<Entity[]>([])
  
  // Data state
  const [data, setData] = useState<TrialBalanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  
  // Update active filters
  useEffect(() => {
    const filtersList: string[] = []
    if (filters.entityId !== 'e1') {
      const entity = entities.find(e => e.id === filters.entityId)
      if (entity) filtersList.push(`Entity: ${entity.name}`)
    }
    setActiveFilters(filtersList)
  }, [filters.entityId, entities])

  // Load entities on mount
  useEffect(() => {
    getEntities().then(setEntities)
  }, [])

  // Fetch trial balance data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getTrialBalance(filters)
      setData(result)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching trial balance:', error)
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

  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFilters(prev => ({
        ...prev,
        dateRange: {
          ...prev.dateRange,
          endDate: date,
        }
      }))
    }
  }

  const clearFilter = (filter: string) => {
    if (filter.startsWith('Entity:')) {
      handleEntityChange('e1')
    }
  }

  // Calculate totals
  const totals = useMemo(() => {
    return data.reduce(
      (acc, row) => ({
        openingDebit: acc.openingDebit + row.openingDebit,
        openingCredit: acc.openingCredit + row.openingCredit,
        periodDebit: acc.periodDebit + row.periodDebit,
        periodCredit: acc.periodCredit + row.periodCredit,
        closingDebit: acc.closingDebit + row.closingDebit,
        closingCredit: acc.closingCredit + row.closingCredit,
      }),
      { openingDebit: 0, openingCredit: 0, periodDebit: 0, periodCredit: 0, closingDebit: 0, closingCredit: 0 }
    )
  }, [data])

  // Check if balanced
  const isOpeningBalanced = Math.abs(totals.openingDebit - totals.openingCredit) < 0.01
  const isClosingBalanced = Math.abs(totals.closingDebit - totals.closingCredit) < 0.01

  // Get entity name
  const entityName = useMemo(() => {
    const entity = entities.find(e => e.id === filters.entityId)
    return entity?.name || 'Entity'
  }, [entities, filters.entityId])

  // Group data by account type
  const groupedData = useMemo(() => {
    const groups: Record<string, TrialBalanceRow[]> = {
      asset: [],
      liability: [],
      equity: [],
      revenue: [],
      expense: [],
    }
    
    data.forEach(row => {
      if (groups[row.accountType]) {
        groups[row.accountType].push(row)
      }
    })
    
    return groups
  }, [data])

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Trial Balance"
          description="View account balances for the selected period"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Refresh
              </Button>
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

        {/* Sticky Filter Bar */}
        <Card className="sticky top-0 z-10 shadow-sm">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Select value={filters.entityId} onValueChange={handleEntityChange}>
                  <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.filter(e => e.type !== 'consolidated').map(entity => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="h-8" />

              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] h-9 justify-start text-left font-normal",
                        !filters.dateRange.endDate && "text-muted-foreground"
                      )}
                    >
                      {format(filters.dateRange.endDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.endDate}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
                <span>Last refreshed: {format(lastRefresh, 'h:mm a')}</span>
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
                  onClick={() => handleEntityChange('e1')}
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Opening Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Debits</p>
                  <p className="text-lg font-semibold">{formatCurrency(totals.openingDebit)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Credits</p>
                  <p className="text-lg font-semibold">{formatCurrency(totals.openingCredit)}</p>
                </div>
              </div>
              <div className={cn(
                "mt-2 flex items-center gap-1 text-xs",
                isOpeningBalanced ? "text-green-600" : "text-destructive"
              )}>
                {isOpeningBalanced ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {isOpeningBalanced ? "Balanced" : "Out of Balance"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Period Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Debits</p>
                  <p className="text-lg font-semibold">{formatCurrency(totals.periodDebit)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Credits</p>
                  <p className="text-lg font-semibold">{formatCurrency(totals.periodCredit)}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Net: {formatCurrency(Math.abs(totals.periodDebit - totals.periodCredit))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Closing Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Debits</p>
                  <p className="text-lg font-semibold">{formatCurrency(totals.closingDebit)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Credits</p>
                  <p className="text-lg font-semibold">{formatCurrency(totals.closingCredit)}</p>
                </div>
              </div>
              <div className={cn(
                "mt-2 flex items-center gap-1 text-xs",
                isClosingBalanced ? "text-green-600" : "text-destructive"
              )}>
                {isClosingBalanced ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {isClosingBalanced ? "Balanced" : "Out of Balance"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trial Balance Report Header */}
        <Card>
          <CardHeader className="text-center border-b pb-4">
            <p className="text-lg font-semibold">{entityName}</p>
            <CardTitle className="text-xl">Trial Balance</CardTitle>
            <p className="text-sm text-muted-foreground">
              As of {format(filters.dateRange.endDate, 'MMMM d, yyyy')}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right w-[120px]">Opening Dr</TableHead>
                  <TableHead className="text-right w-[120px]">Opening Cr</TableHead>
                  <TableHead className="text-right w-[120px]">Period Dr</TableHead>
                  <TableHead className="text-right w-[120px]">Period Cr</TableHead>
                  <TableHead className="text-right w-[120px]">Closing Dr</TableHead>
                  <TableHead className="text-right w-[120px]">Closing Cr</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  Object.entries(groupedData).map(([type, rows]) => (
                    rows.length > 0 && (
                      <TableRow key={`group-${type}`} className="contents">
                        {/* Type Header */}
                        <TableCell colSpan={8} className="bg-muted/30 py-2">
                          <span className={cn("font-semibold capitalize", typeColors[type])}>
                            {type} Accounts
                          </span>
                        </TableCell>
                        {rows.map((row) => (
                          <TableRow key={row.accountId} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-sm">{row.accountNumber}</TableCell>
                            <TableCell>{row.accountName}</TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatCurrency(row.openingDebit)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatCurrency(row.openingCredit)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatCurrency(row.periodDebit)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatCurrency(row.periodCredit)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-medium">
                              {formatCurrency(row.closingDebit)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-medium">
                              {formatCurrency(row.closingCredit)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableRow>
                    )
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted font-semibold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.openingDebit)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.openingCredit)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.periodDebit)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.periodCredit)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.closingDebit)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.closingCredit)}
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
