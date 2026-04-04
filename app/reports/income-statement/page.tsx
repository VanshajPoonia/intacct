"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { 
  Download,
  Printer,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Layers,
  GitCompare,
  X,
  RefreshCw,
  FileText,
} from "lucide-react"
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, subMonths, subYears } from "date-fns"
import { getEntities, getIncomeStatementData, getDepartments, type Department } from "@/lib/services"
import type { Entity, IncomeStatementData } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ExportPreviewDialog, type ExportFormat, type ExportOptions } from "@/components/reports/export-preview-dialog"

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
  budgetValue?: number
  indent?: number
  isHeader?: boolean
  isTotal?: boolean
  isSubtotal?: boolean
  isProfit?: boolean
  showComparison?: boolean
  showBudget?: boolean
  isExpandable?: boolean
  isExpanded?: boolean
  onToggle?: () => void
  children?: React.ReactNode
}

function LineItem({ 
  label, 
  value, 
  previousValue,
  budgetValue,
  indent = 0, 
  isHeader, 
  isTotal, 
  isSubtotal,
  isProfit,
  showComparison = true,
  showBudget = false,
  isExpandable = false,
  isExpanded = false,
  onToggle,
  children,
}: LineItemProps) {
  const hasComparison = showComparison && previousValue !== undefined
  const hasBudget = showBudget && budgetValue !== undefined
  const change = hasComparison && previousValue !== 0 
    ? ((value - previousValue) / Math.abs(previousValue)) * 100 
    : 0
  const budgetVariance = hasBudget && budgetValue !== 0
    ? ((value - budgetValue) / Math.abs(budgetValue)) * 100
    : 0
  const isPositive = value >= 0
  const changeIsGood = isProfit ? change >= 0 : label.toLowerCase().includes('expense') ? change <= 0 : change >= 0
  const budgetIsGood = isProfit ? budgetVariance >= 0 : label.toLowerCase().includes('expense') ? budgetVariance <= 0 : budgetVariance >= 0

  const content = (
    <div 
      className={cn(
        "flex items-center justify-between py-2 px-4 transition-colors",
        isHeader && "font-semibold text-foreground bg-muted/50",
        isTotal && "font-bold text-foreground border-t-2 border-double pt-2 mt-2",
        isSubtotal && "font-medium border-t pt-2 mt-1",
        isProfit && value >= 0 && "text-emerald-600",
        isProfit && value < 0 && "text-red-600",
        !isHeader && !isTotal && !isSubtotal && !isProfit && "text-muted-foreground hover:bg-muted/30",
        isExpandable && "cursor-pointer"
      )}
      style={{ paddingLeft: `${16 + indent * 20}px` }}
      onClick={isExpandable ? onToggle : undefined}
    >
      <div className="flex items-center gap-2">
        {isExpandable && (
          isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
        )}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-6">
        {hasBudget && (
          <>
            <span className="tabular-nums text-muted-foreground w-24 text-right text-sm">
              {formatCurrency(budgetValue)}
            </span>
            <span className={cn(
              "text-xs flex items-center gap-0.5 w-16 justify-end",
              budgetIsGood ? "text-emerald-600" : "text-red-600"
            )}>
              {budgetVariance !== 0 && (
                <>
                  {budgetIsGood ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {formatPercent(budgetVariance)}
                </>
              )}
            </span>
          </>
        )}
        <span className={cn("tabular-nums w-28 text-right font-medium", !isPositive && "text-red-600")}>
          {formatCurrency(value)}
        </span>
        {hasComparison && (
          <>
            <span className="tabular-nums text-muted-foreground w-24 text-right text-sm">
              {formatCurrency(previousValue)}
            </span>
            {change !== 0 && (
              <span className={cn(
                "text-xs flex items-center gap-0.5 w-16 justify-end",
                changeIsGood ? "text-emerald-600" : "text-red-600"
              )}>
                {changeIsGood ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(change)}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )

  if (isExpandable && children) {
    return (
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          {content}
        </CollapsibleTrigger>
        <CollapsibleContent>
          {children}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return content
}

const dateRangeOptions = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'Year to Date' },
  { value: 'last_year', label: 'Last Year' },
]

const comparisonOptions = [
  { value: 'none', label: 'No Comparison' },
  { value: 'prior_period', label: 'Prior Period' },
  { value: 'prior_year', label: 'Prior Year' },
  { value: 'budget', label: 'Budget' },
]

export default function IncomeStatementPage() {
  const [loading, setLoading] = useState(true)
  const [entities, setEntities] = useState<Entity[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string>("e4")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("this_year")
  const [comparisonMode, setComparisonMode] = useState<string>("prior_period")
  const [showBudget, setShowBudget] = useState(false)
  const [data, setData] = useState<IncomeStatementData | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['revenue', 'cogs', 'opex']))
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  
  const now = new Date()

  const getDateRangeValues = useCallback(() => {
    switch (dateRange) {
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case 'last_month':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }
      case 'this_quarter':
        return { start: startOfQuarter(now), end: endOfQuarter(now) }
      case 'this_year':
        return { start: startOfYear(now), end: now }
      case 'last_year':
        return { 
          start: new Date(now.getFullYear() - 1, 0, 1), 
          end: new Date(now.getFullYear() - 1, 11, 31) 
        }
      default:
        return { start: startOfYear(now), end: now }
    }
  }, [dateRange, now])

  useEffect(() => {
    async function loadInitialData() {
      const [entitiesResult, departmentsResult] = await Promise.all([
        getEntities(),
        getDepartments(),
      ])
      setEntities(entitiesResult)
      setDepartments(departmentsResult)
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const { start, end } = getDateRangeValues()
      try {
        const result = await getIncomeStatementData({
          entityId: selectedEntity,
          dateRange: {
            startDate: start,
            endDate: end,
            preset: dateRange
          }
        })
        setData(result)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedEntity, dateRange, selectedDepartment, getDateRangeValues])

  // Update active filters
  useEffect(() => {
    const filters: string[] = []
    if (selectedEntity !== 'e4') {
      const entity = entities.find(e => e.id === selectedEntity)
      if (entity) filters.push(`Entity: ${entity.name}`)
    }
    if (selectedDepartment !== 'all') {
      const dept = departments.find(d => d.id === selectedDepartment)
      if (dept) filters.push(`Department: ${dept.name}`)
    }
    if (comparisonMode !== 'none') {
      const comp = comparisonOptions.find(c => c.value === comparisonMode)
      if (comp) filters.push(`Compare: ${comp.label}`)
    }
    if (showBudget) {
      filters.push('Show Budget')
    }
    setActiveFilters(filters)
  }, [selectedEntity, selectedDepartment, comparisonMode, showBudget, entities, departments])

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
    } else if (filter.startsWith('Department:')) {
      setSelectedDepartment('all')
    } else if (filter.startsWith('Compare:')) {
      setComparisonMode('none')
    } else if (filter === 'Show Budget') {
      setShowBudget(false)
    }
  }

  const handleExport = (format: ExportFormat, options: ExportOptions) => {
    console.log(`Exporting income statement as ${format} with options:`, options)
    // In a real app, this would trigger the actual export
  }

  const selectedEntityName = entities.find(e => e.id === selectedEntity)?.name || 'All Entities'
  const { start, end } = getDateRangeValues()
  const showComparisonColumn = comparisonMode !== 'none' && comparisonMode !== 'budget'

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Income Statement</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Profit and Loss for the period
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
              <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
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
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      {dateRangeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator orientation="vertical" className="h-8" />

                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator orientation="vertical" className="h-8" />

                <div className="flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-muted-foreground" />
                  <Select value={comparisonMode} onValueChange={setComparisonMode}>
                    <SelectTrigger className="w-[150px]">
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

                <Separator orientation="vertical" className="h-8" />

                <div className="flex items-center gap-2">
                  <Switch
                    id="show-budget"
                    checked={showBudget}
                    onCheckedChange={setShowBudget}
                  />
                  <Label htmlFor="show-budget" className="text-sm">Show Budget</Label>
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
                      setSelectedDepartment('all')
                      setComparisonMode('none')
                      setShowBudget(false)
                    }}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report */}
          <Card>
            <CardHeader className="text-center border-b pb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">{selectedEntityName}</CardTitle>
              <p className="text-sm text-muted-foreground">Income Statement (Profit & Loss)</p>
              <p className="text-sm text-muted-foreground">
                For the period {format(start, 'MMMM d, yyyy')} to {format(end, 'MMMM d, yyyy')}
              </p>
              {selectedDepartment !== 'all' && (
                <Badge variant="outline" className="mt-2">
                  {departments.find(d => d.id === selectedDepartment)?.name}
                </Badge>
              )}
            </CardHeader>

            {/* Column Headers */}
            {(showComparisonColumn || showBudget) && (
              <div className="flex items-center justify-end px-4 py-2 bg-muted/30 border-b text-xs font-medium text-muted-foreground gap-6">
                {showBudget && (
                  <>
                    <span className="w-24 text-right">Budget</span>
                    <span className="w-16 text-right">Var %</span>
                  </>
                )}
                <span className="w-28 text-right">Actual</span>
                {showComparisonColumn && (
                  <>
                    <span className="w-24 text-right">
                      {comparisonMode === 'prior_year' ? 'Prior Year' : 'Prior Period'}
                    </span>
                    <span className="w-16 text-right">Change</span>
                  </>
                )}
              </div>
            )}

            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : data ? (
                <div className="divide-y">
                  {/* Revenue */}
                  <div className="py-2">
                    <LineItem 
                      label="Revenue" 
                      value={data.revenue.total} 
                      previousValue={showComparisonColumn ? data.revenue.previousTotal : undefined}
                      budgetValue={showBudget ? Math.round(data.revenue.total * 0.95) : undefined}
                      isExpandable
                      isExpanded={expandedSections.has('revenue')}
                      onToggle={() => toggleSection('revenue')}
                      showComparison={showComparisonColumn}
                      showBudget={showBudget}
                      isHeader
                    >
                      {data.revenue.lines.map((line, i) => (
                        <LineItem 
                          key={i} 
                          label={line.name} 
                          value={line.amount} 
                          previousValue={showComparisonColumn ? line.previousAmount : undefined}
                          budgetValue={showBudget ? Math.round(line.amount * 0.95) : undefined}
                          indent={1}
                          showComparison={showComparisonColumn}
                          showBudget={showBudget}
                        />
                      ))}
                    </LineItem>
                  </div>

                  {/* Cost of Goods Sold */}
                  <div className="py-2">
                    <LineItem 
                      label="Cost of Goods Sold" 
                      value={data.costOfGoodsSold.total}
                      previousValue={showComparisonColumn ? data.costOfGoodsSold.previousTotal : undefined}
                      budgetValue={showBudget ? Math.round(data.costOfGoodsSold.total * 1.05) : undefined}
                      isExpandable
                      isExpanded={expandedSections.has('cogs')}
                      onToggle={() => toggleSection('cogs')}
                      showComparison={showComparisonColumn}
                      showBudget={showBudget}
                      isHeader
                    >
                      {data.costOfGoodsSold.lines.map((line, i) => (
                        <LineItem 
                          key={i} 
                          label={line.name} 
                          value={line.amount}
                          previousValue={showComparisonColumn ? line.previousAmount : undefined}
                          budgetValue={showBudget ? Math.round(line.amount * 1.05) : undefined}
                          indent={1}
                          showComparison={showComparisonColumn}
                          showBudget={showBudget}
                        />
                      ))}
                    </LineItem>
                  </div>

                  {/* Gross Profit */}
                  <div className="py-3 bg-muted/30">
                    <LineItem 
                      label="GROSS PROFIT" 
                      value={data.grossProfit} 
                      previousValue={showComparisonColumn ? data.previousGrossProfit : undefined}
                      budgetValue={showBudget ? Math.round(data.grossProfit * 0.92) : undefined}
                      isTotal 
                      isProfit
                      showComparison={showComparisonColumn}
                      showBudget={showBudget}
                    />
                    <div className="px-4 pt-1 text-xs text-muted-foreground text-right">
                      Gross Margin: {data.revenue.total > 0 ? ((data.grossProfit / data.revenue.total) * 100).toFixed(1) : 0}%
                    </div>
                  </div>

                  {/* Operating Expenses */}
                  <div className="py-2">
                    <LineItem 
                      label="Operating Expenses" 
                      value={data.operatingExpenses.total}
                      previousValue={showComparisonColumn ? data.operatingExpenses.previousTotal : undefined}
                      budgetValue={showBudget ? Math.round(data.operatingExpenses.total * 1.03) : undefined}
                      isExpandable
                      isExpanded={expandedSections.has('opex')}
                      onToggle={() => toggleSection('opex')}
                      showComparison={showComparisonColumn}
                      showBudget={showBudget}
                      isHeader
                    >
                      {data.operatingExpenses.lines.map((line, i) => (
                        <LineItem 
                          key={i} 
                          label={line.name} 
                          value={line.amount}
                          previousValue={showComparisonColumn ? line.previousAmount : undefined}
                          budgetValue={showBudget ? Math.round(line.amount * 1.03) : undefined}
                          indent={1}
                          showComparison={showComparisonColumn}
                          showBudget={showBudget}
                        />
                      ))}
                    </LineItem>
                  </div>

                  {/* Operating Income */}
                  <div className="py-3 bg-muted/30">
                    <LineItem 
                      label="OPERATING INCOME" 
                      value={data.operatingIncome}
                      previousValue={showComparisonColumn ? data.previousOperatingIncome : undefined}
                      budgetValue={showBudget ? Math.round(data.operatingIncome * 0.9) : undefined}
                      isTotal 
                      isProfit
                      showComparison={showComparisonColumn}
                      showBudget={showBudget}
                    />
                    <div className="px-4 pt-1 text-xs text-muted-foreground text-right">
                      Operating Margin: {data.revenue.total > 0 ? ((data.operatingIncome / data.revenue.total) * 100).toFixed(1) : 0}%
                    </div>
                  </div>

                  {/* Other Income/Expenses */}
                  <div className="py-2">
                    <LineItem 
                      label="Other Income (Expense)" 
                      value={data.otherIncome.total}
                      isExpandable
                      isExpanded={expandedSections.has('other')}
                      onToggle={() => toggleSection('other')}
                      showComparison={false}
                      showBudget={false}
                      isHeader
                    >
                      <LineItem label="Interest Income" value={data.otherIncome.interestIncome} indent={1} showComparison={false} showBudget={false} />
                      <LineItem label="Interest Expense" value={-data.otherIncome.interestExpense} indent={1} showComparison={false} showBudget={false} />
                      <LineItem label="Other Income" value={data.otherIncome.other} indent={1} showComparison={false} showBudget={false} />
                    </LineItem>
                  </div>

                  {/* Income Before Tax */}
                  <div className="py-3">
                    <LineItem 
                      label="INCOME BEFORE INCOME TAX" 
                      value={data.incomeBeforeTax}
                      previousValue={showComparisonColumn ? data.previousIncomeBeforeTax : undefined}
                      budgetValue={showBudget ? Math.round(data.incomeBeforeTax * 0.88) : undefined}
                      isTotal 
                      isProfit
                      showComparison={showComparisonColumn}
                      showBudget={showBudget}
                    />
                  </div>

                  {/* Tax */}
                  <div className="py-2">
                    <LineItem 
                      label="Income Tax Expense" 
                      value={data.incomeTaxExpense} 
                      indent={0}
                      showComparison={false}
                      showBudget={false}
                    />
                  </div>

                  {/* Net Income */}
                  <div className="py-4 bg-primary/5">
                    <LineItem 
                      label="NET INCOME" 
                      value={data.netIncome}
                      previousValue={showComparisonColumn ? data.previousNetIncome : undefined}
                      budgetValue={showBudget ? Math.round(data.netIncome * 0.85) : undefined}
                      isTotal 
                      isProfit
                      showComparison={showComparisonColumn}
                      showBudget={showBudget}
                    />
                    <div className="px-4 pt-1 text-xs text-muted-foreground text-right">
                      Net Profit Margin: {data.revenue.total > 0 ? ((data.netIncome / data.revenue.total) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export Preview Dialog */}
      <ExportPreviewDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        reportTitle="Income Statement"
        reportSubtitle={`${selectedEntityName} | ${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`}
        onExport={handleExport}
        onPrint={() => window.print()}
      >
        {data && (
          <div className="text-sm space-y-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Category</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-semibold bg-muted/50">
                  <td className="py-2">Revenue</td>
                  <td className="text-right py-2">{formatCurrency(data.revenue.total)}</td>
                </tr>
                <tr>
                  <td className="py-2">Cost of Goods Sold</td>
                  <td className="text-right py-2">{formatCurrency(data.costOfGoodsSold.total)}</td>
                </tr>
                <tr className="font-semibold border-t">
                  <td className="py-2">Gross Profit</td>
                  <td className="text-right py-2 text-emerald-600">{formatCurrency(data.grossProfit)}</td>
                </tr>
                <tr>
                  <td className="py-2">Operating Expenses</td>
                  <td className="text-right py-2">{formatCurrency(data.operatingExpenses.total)}</td>
                </tr>
                <tr className="font-semibold border-t">
                  <td className="py-2">Operating Income</td>
                  <td className="text-right py-2 text-emerald-600">{formatCurrency(data.operatingIncome)}</td>
                </tr>
                <tr>
                  <td className="py-2">Other Income (Expense)</td>
                  <td className="text-right py-2">{formatCurrency(data.otherIncome.total)}</td>
                </tr>
                <tr>
                  <td className="py-2">Income Tax Expense</td>
                  <td className="text-right py-2">{formatCurrency(data.incomeTaxExpense)}</td>
                </tr>
                <tr className="font-bold border-t-2 bg-primary/5">
                  <td className="py-3">NET INCOME</td>
                  <td className="text-right py-3 text-emerald-600">{formatCurrency(data.netIncome)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </ExportPreviewDialog>
    </AppShell>
  )
}
