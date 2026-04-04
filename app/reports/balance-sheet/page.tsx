"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Download,
  Printer,
  Calendar,
  ChevronDown,
  ChevronRight,
  Building2,
  GitCompare,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
} from "lucide-react"
import { format, subMonths, subQuarters, subYears } from "date-fns"
import { getEntities, getBalanceSheetData } from "@/lib/services"
import type { Entity, BalanceSheetData } from "@/lib/types"
import { cn } from "@/lib/utils"

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

interface LineItemProps {
  label: string
  value: number
  previousValue?: number
  showComparison?: boolean
  indent?: number
  isHeader?: boolean
  isTotal?: boolean
  isSubtotal?: boolean
}

function LineItem({ 
  label, 
  value, 
  previousValue,
  showComparison = false,
  indent = 0, 
  isHeader, 
  isTotal, 
  isSubtotal 
}: LineItemProps) {
  const hasComparison = showComparison && previousValue !== undefined
  const change = hasComparison && previousValue !== 0 
    ? ((value - previousValue) / Math.abs(previousValue)) * 100 
    : 0

  return (
    <div 
      className={cn(
        "flex items-center justify-between py-2 px-4 transition-colors",
        isHeader && "font-semibold text-foreground bg-muted/50",
        isTotal && "font-bold text-foreground border-t-2 border-double pt-2 mt-2",
        isSubtotal && "font-medium border-t pt-2 mt-1",
        !isHeader && !isTotal && !isSubtotal && "text-muted-foreground hover:bg-muted/30"
      )}
      style={{ paddingLeft: `${16 + indent * 20}px` }}
    >
      <span>{label}</span>
      <div className="flex items-center gap-6">
        <span className="tabular-nums w-28 text-right font-medium">{formatCurrency(value)}</span>
        {hasComparison && (
          <>
            <span className="tabular-nums text-muted-foreground w-24 text-right text-sm">
              {formatCurrency(previousValue)}
            </span>
            {change !== 0 && (
              <span className={cn(
                "text-xs flex items-center gap-0.5 w-16 justify-end",
                change >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(change)}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SectionHeader({ 
  label, 
  isOpen, 
  onToggle,
  total,
  previousTotal,
  showComparison,
}: { 
  label: string
  isOpen: boolean
  onToggle: () => void
  total?: number
  previousTotal?: number
  showComparison?: boolean
}) {
  const hasComparison = showComparison && previousTotal !== undefined && total !== undefined
  const change = hasComparison && previousTotal !== 0 
    ? ((total - previousTotal) / Math.abs(previousTotal)) * 100 
    : 0

  return (
    <button 
      onClick={onToggle}
      className="flex items-center justify-between w-full py-3 px-4 font-semibold text-sm uppercase tracking-wide text-primary hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-2">
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {label}
      </div>
      {total !== undefined && (
        <div className="flex items-center gap-6">
          <span className="tabular-nums w-28 text-right">{formatCurrency(total)}</span>
          {hasComparison && (
            <>
              <span className="tabular-nums text-muted-foreground w-24 text-right text-sm">
                {formatCurrency(previousTotal)}
              </span>
              {change !== 0 && (
                <span className={cn(
                  "text-xs flex items-center gap-0.5 w-16 justify-end font-normal",
                  change >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {formatPercent(change)}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </button>
  )
}

const periodOptions = [
  { value: 'end_of_month', label: 'End of Month' },
  { value: 'end_of_quarter', label: 'End of Quarter' },
  { value: 'end_of_year', label: 'End of Year' },
  { value: 'custom', label: 'Custom Date' },
]

const comparisonOptions = [
  { value: 'none', label: 'No Comparison' },
  { value: 'prior_month', label: 'Prior Month' },
  { value: 'prior_quarter', label: 'Prior Quarter' },
  { value: 'prior_year', label: 'Prior Year' },
]

export default function BalanceSheetPage() {
  const [loading, setLoading] = useState(true)
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string>("e4")
  const [periodType, setPeriodType] = useState<string>("end_of_month")
  const [comparisonMode, setComparisonMode] = useState<string>("prior_month")
  const [customDate, setCustomDate] = useState<Date>(new Date())
  const [data, setData] = useState<BalanceSheetData | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['assets', 'liabilities', 'equity'])
  )
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  
  const asOfDate = customDate

  const getComparisonDate = useCallback(() => {
    switch (comparisonMode) {
      case 'prior_month':
        return subMonths(asOfDate, 1)
      case 'prior_quarter':
        return subQuarters(asOfDate, 1)
      case 'prior_year':
        return subYears(asOfDate, 1)
      default:
        return null
    }
  }, [comparisonMode, asOfDate])

  useEffect(() => {
    async function loadEntities() {
      const result = await getEntities()
      setEntities(result)
    }
    loadEntities()
  }, [])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const result = await getBalanceSheetData({
          entityId: selectedEntity,
          dateRange: {
            startDate: new Date(asOfDate.getFullYear(), 0, 1),
            endDate: asOfDate,
            preset: 'this_year'
          }
        })
        setData(result)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedEntity, asOfDate])

  // Update active filters
  useEffect(() => {
    const filters: string[] = []
    if (selectedEntity !== 'e4') {
      const entity = entities.find(e => e.id === selectedEntity)
      if (entity) filters.push(`Entity: ${entity.name}`)
    }
    if (comparisonMode !== 'none') {
      const comp = comparisonOptions.find(c => c.value === comparisonMode)
      if (comp) filters.push(`Compare: ${comp.label}`)
    }
    setActiveFilters(filters)
  }, [selectedEntity, comparisonMode, entities])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const clearFilter = (filter: string) => {
    if (filter.startsWith('Entity:')) {
      setSelectedEntity('e4')
    } else if (filter.startsWith('Compare:')) {
      setComparisonMode('none')
    }
  }

  const selectedEntityName = entities.find(e => e.id === selectedEntity)?.name || 'All Entities'
  const showComparison = comparisonMode !== 'none'
  const comparisonDate = getComparisonDate()

  // Generate mock previous values (in real app would come from API)
  const getPreviousValue = (currentValue: number) => {
    return Math.round(currentValue * (0.85 + Math.random() * 0.3))
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Balance Sheet</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Statement of financial position as of {format(asOfDate, 'MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setLoading(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Select defaultValue="pdf" onValueChange={(format) => console.log(`Exporting as ${format}`)}>
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
                  <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map(entity => (
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(asOfDate, 'MMM d, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customDate}
                        onSelect={(date) => date && setCustomDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Separator orientation="vertical" className="h-8" />

                <div className="flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-muted-foreground" />
                  <Select value={comparisonMode} onValueChange={setComparisonMode}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Compare" />
                    </SelectTrigger>
                    <SelectContent>
                      {comparisonOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      setSelectedEntity('e4')
                      setComparisonMode('none')
                    }}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report Header */}
          <Card>
            <CardHeader className="text-center border-b pb-4">
              <CardTitle className="text-lg">{selectedEntityName}</CardTitle>
              <p className="text-sm text-muted-foreground">Balance Sheet</p>
              <p className="text-sm text-muted-foreground">As of {format(asOfDate, 'MMMM d, yyyy')}</p>
              {showComparison && comparisonDate && (
                <Badge variant="outline" className="mt-2">
                  Compared to {format(comparisonDate, 'MMM d, yyyy')}
                </Badge>
              )}
            </CardHeader>

            {/* Column Headers */}
            {showComparison && (
              <div className="flex items-center justify-end px-4 py-2 bg-muted/30 border-b text-xs font-medium text-muted-foreground gap-6">
                <span className="w-28 text-right">Current</span>
                <span className="w-24 text-right">
                  {comparisonMode === 'prior_year' ? 'Prior Year' : comparisonMode === 'prior_quarter' ? 'Prior Quarter' : 'Prior Month'}
                </span>
                <span className="w-16 text-right">Change</span>
              </div>
            )}

            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : data ? (
                <div className="divide-y">
                  {/* ASSETS */}
                  <div>
                    <SectionHeader 
                      label="Assets" 
                      isOpen={expandedSections.has('assets')}
                      onToggle={() => toggleSection('assets')}
                      total={data.assets.total}
                      previousTotal={showComparison ? getPreviousValue(data.assets.total) : undefined}
                      showComparison={showComparison}
                    />
                    {expandedSections.has('assets') && (
                      <div className="pb-4">
                        <LineItem label="Current Assets" value={data.assets.currentAssets.total} isHeader indent={0} showComparison={false} />
                        <LineItem label="Cash and Cash Equivalents" value={data.assets.currentAssets.cash} previousValue={showComparison ? getPreviousValue(data.assets.currentAssets.cash) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Accounts Receivable" value={data.assets.currentAssets.accountsReceivable} previousValue={showComparison ? getPreviousValue(data.assets.currentAssets.accountsReceivable) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Inventory" value={data.assets.currentAssets.inventory} previousValue={showComparison ? getPreviousValue(data.assets.currentAssets.inventory) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Prepaid Expenses" value={data.assets.currentAssets.prepaidExpenses} previousValue={showComparison ? getPreviousValue(data.assets.currentAssets.prepaidExpenses) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Other Current Assets" value={data.assets.currentAssets.other} previousValue={showComparison ? getPreviousValue(data.assets.currentAssets.other) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Total Current Assets" value={data.assets.currentAssets.total} previousValue={showComparison ? getPreviousValue(data.assets.currentAssets.total) : undefined} showComparison={showComparison} isSubtotal indent={0} />
                        
                        <div className="h-3" />
                        
                        <LineItem label="Non-Current Assets" value={data.assets.nonCurrentAssets.total} isHeader indent={0} showComparison={false} />
                        <LineItem label="Property, Plant & Equipment" value={data.assets.nonCurrentAssets.ppe} previousValue={showComparison ? getPreviousValue(data.assets.nonCurrentAssets.ppe) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Accumulated Depreciation" value={-data.assets.nonCurrentAssets.accumulatedDepreciation} previousValue={showComparison ? -getPreviousValue(data.assets.nonCurrentAssets.accumulatedDepreciation) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Intangible Assets" value={data.assets.nonCurrentAssets.intangibles} previousValue={showComparison ? getPreviousValue(data.assets.nonCurrentAssets.intangibles) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Long-term Investments" value={data.assets.nonCurrentAssets.investments} previousValue={showComparison ? getPreviousValue(data.assets.nonCurrentAssets.investments) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Other Non-Current Assets" value={data.assets.nonCurrentAssets.other} previousValue={showComparison ? getPreviousValue(data.assets.nonCurrentAssets.other) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Total Non-Current Assets" value={data.assets.nonCurrentAssets.total} previousValue={showComparison ? getPreviousValue(data.assets.nonCurrentAssets.total) : undefined} showComparison={showComparison} isSubtotal indent={0} />
                        
                        <div className="h-2" />
                        <LineItem label="TOTAL ASSETS" value={data.assets.total} previousValue={showComparison ? getPreviousValue(data.assets.total) : undefined} showComparison={showComparison} isTotal />
                      </div>
                    )}
                  </div>

                  {/* LIABILITIES */}
                  <div>
                    <SectionHeader 
                      label="Liabilities" 
                      isOpen={expandedSections.has('liabilities')}
                      onToggle={() => toggleSection('liabilities')}
                      total={data.liabilities.total}
                      previousTotal={showComparison ? getPreviousValue(data.liabilities.total) : undefined}
                      showComparison={showComparison}
                    />
                    {expandedSections.has('liabilities') && (
                      <div className="pb-4">
                        <LineItem label="Current Liabilities" value={data.liabilities.currentLiabilities.total} isHeader indent={0} showComparison={false} />
                        <LineItem label="Accounts Payable" value={data.liabilities.currentLiabilities.accountsPayable} previousValue={showComparison ? getPreviousValue(data.liabilities.currentLiabilities.accountsPayable) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Accrued Expenses" value={data.liabilities.currentLiabilities.accruedExpenses} previousValue={showComparison ? getPreviousValue(data.liabilities.currentLiabilities.accruedExpenses) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Short-term Debt" value={data.liabilities.currentLiabilities.shortTermDebt} previousValue={showComparison ? getPreviousValue(data.liabilities.currentLiabilities.shortTermDebt) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Current Portion of Long-term Debt" value={data.liabilities.currentLiabilities.currentPortionLTD} previousValue={showComparison ? getPreviousValue(data.liabilities.currentLiabilities.currentPortionLTD) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Other Current Liabilities" value={data.liabilities.currentLiabilities.other} previousValue={showComparison ? getPreviousValue(data.liabilities.currentLiabilities.other) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Total Current Liabilities" value={data.liabilities.currentLiabilities.total} previousValue={showComparison ? getPreviousValue(data.liabilities.currentLiabilities.total) : undefined} showComparison={showComparison} isSubtotal indent={0} />
                        
                        <div className="h-3" />
                        
                        <LineItem label="Non-Current Liabilities" value={data.liabilities.nonCurrentLiabilities.total} isHeader indent={0} showComparison={false} />
                        <LineItem label="Long-term Debt" value={data.liabilities.nonCurrentLiabilities.longTermDebt} previousValue={showComparison ? getPreviousValue(data.liabilities.nonCurrentLiabilities.longTermDebt) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Deferred Tax Liabilities" value={data.liabilities.nonCurrentLiabilities.deferredTax} previousValue={showComparison ? getPreviousValue(data.liabilities.nonCurrentLiabilities.deferredTax) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Other Long-term Liabilities" value={data.liabilities.nonCurrentLiabilities.other} previousValue={showComparison ? getPreviousValue(data.liabilities.nonCurrentLiabilities.other) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Total Non-Current Liabilities" value={data.liabilities.nonCurrentLiabilities.total} previousValue={showComparison ? getPreviousValue(data.liabilities.nonCurrentLiabilities.total) : undefined} showComparison={showComparison} isSubtotal indent={0} />
                        
                        <div className="h-2" />
                        <LineItem label="TOTAL LIABILITIES" value={data.liabilities.total} previousValue={showComparison ? getPreviousValue(data.liabilities.total) : undefined} showComparison={showComparison} isTotal />
                      </div>
                    )}
                  </div>

                  {/* EQUITY */}
                  <div>
                    <SectionHeader 
                      label="Stockholders' Equity" 
                      isOpen={expandedSections.has('equity')}
                      onToggle={() => toggleSection('equity')}
                      total={data.equity.total}
                      previousTotal={showComparison ? getPreviousValue(data.equity.total) : undefined}
                      showComparison={showComparison}
                    />
                    {expandedSections.has('equity') && (
                      <div className="pb-4">
                        <LineItem label="Common Stock" value={data.equity.commonStock} previousValue={showComparison ? getPreviousValue(data.equity.commonStock) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Additional Paid-in Capital" value={data.equity.additionalPaidInCapital} previousValue={showComparison ? getPreviousValue(data.equity.additionalPaidInCapital) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Retained Earnings" value={data.equity.retainedEarnings} previousValue={showComparison ? getPreviousValue(data.equity.retainedEarnings) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Treasury Stock" value={-data.equity.treasuryStock} previousValue={showComparison ? -getPreviousValue(data.equity.treasuryStock) : undefined} showComparison={showComparison} indent={1} />
                        <LineItem label="Other Comprehensive Income" value={data.equity.otherComprehensiveIncome} previousValue={showComparison ? getPreviousValue(data.equity.otherComprehensiveIncome) : undefined} showComparison={showComparison} indent={1} />
                        
                        <div className="h-2" />
                        <LineItem label="TOTAL STOCKHOLDERS' EQUITY" value={data.equity.total} previousValue={showComparison ? getPreviousValue(data.equity.total) : undefined} showComparison={showComparison} isTotal />
                      </div>
                    )}
                  </div>

                  {/* TOTAL LIABILITIES AND EQUITY */}
                  <div className="bg-muted/30 py-4">
                    <LineItem 
                      label="TOTAL LIABILITIES AND STOCKHOLDERS' EQUITY" 
                      value={data.liabilities.total + data.equity.total} 
                      previousValue={showComparison ? getPreviousValue(data.liabilities.total) + getPreviousValue(data.equity.total) : undefined}
                      showComparison={showComparison}
                      isTotal 
                    />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
