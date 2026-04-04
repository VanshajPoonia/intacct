"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Download, 
  Printer, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { getCashFlowData, getEntities, type CashFlowData } from "@/lib/services"
import type { Entity, DashboardFilters } from "@/lib/types"
import { cn } from "@/lib/utils"

const DATE_PRESETS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'last_year', label: 'Last Year' },
]

function formatCurrency(amount: number): string {
  const isNegative = amount < 0
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
  return isNegative ? `(${formatted})` : formatted
}

export default function CashFlowPage() {
  // Filter state
  const [entityId, setEntityId] = useState("e4")
  const [datePreset, setDatePreset] = useState("this_year")
  
  // Data state
  const [entities, setEntities] = useState<Entity[]>([])
  const [data, setData] = useState<CashFlowData | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Collapse state
  const [operatingExpanded, setOperatingExpanded] = useState(true)
  const [investingExpanded, setInvestingExpanded] = useState(true)
  const [financingExpanded, setFinancingExpanded] = useState(true)

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
    
    const [entitiesData, cashFlowData] = await Promise.all([
      getEntities(),
      getCashFlowData(filters),
    ])
    
    setEntities(entitiesData)
    setData(cashFlowData)
    setLoading(false)
  }, [entityId, datePreset])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting cash flow statement as ${format}`)
    // Mock export - in real app would call API
  }

  const handlePrint = () => {
    window.print()
  }

  const renderChangeIndicator = (current: number, previous: number) => {
    if (current === previous) return <Minus className="h-4 w-4 text-muted-foreground" />
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Cash Flow Statement</h1>
            <p className="text-sm text-muted-foreground">
              Statement of cash flows for the period
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
          </CardContent>
        </Card>

        {/* Report Content */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {entities.find(e => e.id === entityId)?.name || 'All Entities'}
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {DATE_PRESETS.find(p => p.value === datePreset)?.label}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : data ? (
              <div className="divide-y">
                {/* Operating Activities */}
                <div>
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    onClick={() => setOperatingExpanded(!operatingExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      {operatingExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-semibold">Cash Flows from Operating Activities</span>
                    </div>
                    <span className={cn(
                      "font-semibold",
                      data.operatingActivities.total >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(data.operatingActivities.total)}
                    </span>
                  </button>
                  {operatingExpanded && (
                    <div className="px-4 pb-4 space-y-1">
                      <div className="flex justify-between py-2 px-4 bg-muted/30 rounded">
                        <span>Net Income</span>
                        <span className="font-medium">{formatCurrency(data.operatingActivities.netIncome)}</span>
                      </div>
                      
                      <div className="py-2 px-4 text-sm text-muted-foreground font-medium">
                        Adjustments for Non-Cash Items:
                      </div>
                      {data.operatingActivities.adjustments.map((adj) => (
                        <div key={adj.name} className="flex justify-between py-1.5 px-8 text-sm">
                          <span>{adj.name}</span>
                          <span>{formatCurrency(adj.amount)}</span>
                        </div>
                      ))}
                      
                      <div className="py-2 px-4 text-sm text-muted-foreground font-medium">
                        Changes in Working Capital:
                      </div>
                      {data.operatingActivities.changesInWorkingCapital.map((item) => (
                        <div key={item.name} className="flex justify-between py-1.5 px-8 text-sm">
                          <span>{item.name}</span>
                          <span className={item.amount < 0 ? "text-red-600" : ""}>
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Investing Activities */}
                <div>
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    onClick={() => setInvestingExpanded(!investingExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      {investingExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-semibold">Cash Flows from Investing Activities</span>
                    </div>
                    <span className={cn(
                      "font-semibold",
                      data.investingActivities.total >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(data.investingActivities.total)}
                    </span>
                  </button>
                  {investingExpanded && (
                    <div className="px-4 pb-4 space-y-1">
                      {data.investingActivities.items.map((item) => (
                        <div key={item.name} className="flex justify-between py-1.5 px-8 text-sm">
                          <span>{item.name}</span>
                          <span className={item.amount < 0 ? "text-red-600" : ""}>
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Financing Activities */}
                <div>
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    onClick={() => setFinancingExpanded(!financingExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      {financingExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-semibold">Cash Flows from Financing Activities</span>
                    </div>
                    <span className={cn(
                      "font-semibold",
                      data.financingActivities.total >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(data.financingActivities.total)}
                    </span>
                  </button>
                  {financingExpanded && (
                    <div className="px-4 pb-4 space-y-1">
                      {data.financingActivities.items.map((item) => (
                        <div key={item.name} className="flex justify-between py-1.5 px-8 text-sm">
                          <span>{item.name}</span>
                          <span className={item.amount < 0 ? "text-red-600" : ""}>
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-muted/50 p-4 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-semibold">Net Change in Cash</span>
                    <div className="flex items-center gap-2">
                      {renderChangeIndicator(data.netChangeInCash, data.previousNetChangeInCash)}
                      <span className={cn(
                        "font-bold text-lg",
                        data.netChangeInCash >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrency(data.netChangeInCash)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Beginning Cash Balance</span>
                    <span className="font-medium">{formatCurrency(data.beginningCash)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-primary/10 rounded px-3">
                    <span className="font-semibold">Ending Cash Balance</span>
                    <span className="font-bold text-lg">{formatCurrency(data.endingCash)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No data available for the selected period.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
