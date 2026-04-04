"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Download,
  Printer,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear } from "date-fns"
import { getEntities, getIncomeStatementData } from "@/lib/services"
import type { Entity, IncomeStatementData } from "@/lib/types"
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
  indent?: number
  isHeader?: boolean
  isTotal?: boolean
  isSubtotal?: boolean
  isProfit?: boolean
}

function LineItem({ 
  label, 
  value, 
  previousValue,
  indent = 0, 
  isHeader, 
  isTotal, 
  isSubtotal,
  isProfit 
}: LineItemProps) {
  const hasComparison = previousValue !== undefined
  const change = hasComparison && previousValue !== 0 
    ? ((value - previousValue) / Math.abs(previousValue)) * 100 
    : 0
  const isPositive = value >= 0
  const changeIsGood = isProfit ? change >= 0 : label.toLowerCase().includes('expense') ? change <= 0 : change >= 0

  return (
    <div 
      className={cn(
        "flex items-center justify-between py-1.5 px-4",
        isHeader && "font-semibold text-foreground bg-muted/50",
        isTotal && "font-bold text-foreground border-t-2 border-double pt-2 mt-2",
        isSubtotal && "font-medium border-t pt-1.5 mt-1",
        isProfit && value >= 0 && "text-emerald-600",
        isProfit && value < 0 && "text-red-600",
        !isHeader && !isTotal && !isSubtotal && !isProfit && "text-muted-foreground"
      )}
      style={{ paddingLeft: `${16 + indent * 16}px` }}
    >
      <span>{label}</span>
      <div className="flex items-center gap-4">
        <span className={cn("tabular-nums", !isPositive && "text-red-600")}>
          {formatCurrency(value)}
        </span>
        {hasComparison && change !== 0 && (
          <span className={cn(
            "text-xs flex items-center gap-0.5 w-16 justify-end",
            changeIsGood ? "text-emerald-600" : "text-red-600"
          )}>
            {changeIsGood ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {formatPercent(change)}
          </span>
        )}
      </div>
    </div>
  )
}

const dateRangeOptions = [
  { value: 'this_month', label: 'This Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'Year to Date' },
  { value: 'last_year', label: 'Last Year' },
]

export default function IncomeStatementPage() {
  const [loading, setLoading] = useState(true)
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string>("e4")
  const [dateRange, setDateRange] = useState<string>("this_year")
  const [data, setData] = useState<IncomeStatementData | null>(null)
  
  const now = new Date()

  const getDateRangeValues = () => {
    switch (dateRange) {
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) }
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
  }

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
  }, [selectedEntity, dateRange])

  const selectedEntityName = entities.find(e => e.id === selectedEntity)?.name || 'All Entities'
  const { start, end } = getDateRangeValues()

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

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger className="w-[200px]">
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
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[160px]">
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
          </div>

          {/* Report */}
          <Card>
            <CardHeader className="text-center border-b pb-4">
              <CardTitle className="text-lg">{selectedEntityName}</CardTitle>
              <p className="text-sm text-muted-foreground">Income Statement</p>
              <p className="text-sm text-muted-foreground">
                For the period {format(start, 'MMMM d, yyyy')} to {format(end, 'MMMM d, yyyy')}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : data ? (
                <div className="divide-y">
                  {/* Revenue */}
                  <div className="py-4">
                    <LineItem label="Revenue" value={0} isHeader />
                    {data.revenue.lines.map((line, i) => (
                      <LineItem 
                        key={i} 
                        label={line.name} 
                        value={line.amount} 
                        previousValue={line.previousAmount}
                        indent={1} 
                      />
                    ))}
                    <LineItem label="Total Revenue" value={data.revenue.total} previousValue={data.revenue.previousTotal} isSubtotal />
                  </div>

                  {/* Cost of Goods Sold */}
                  <div className="py-4">
                    <LineItem label="Cost of Goods Sold" value={0} isHeader />
                    {data.costOfGoodsSold.lines.map((line, i) => (
                      <LineItem 
                        key={i} 
                        label={line.name} 
                        value={line.amount}
                        previousValue={line.previousAmount}
                        indent={1} 
                      />
                    ))}
                    <LineItem label="Total COGS" value={data.costOfGoodsSold.total} previousValue={data.costOfGoodsSold.previousTotal} isSubtotal />
                  </div>

                  {/* Gross Profit */}
                  <div className="py-4 bg-muted/30">
                    <LineItem 
                      label="GROSS PROFIT" 
                      value={data.grossProfit} 
                      previousValue={data.previousGrossProfit}
                      isTotal 
                      isProfit 
                    />
                    <div className="px-4 pt-1 text-xs text-muted-foreground text-right">
                      Gross Margin: {((data.grossProfit / data.revenue.total) * 100).toFixed(1)}%
                    </div>
                  </div>

                  {/* Operating Expenses */}
                  <div className="py-4">
                    <LineItem label="Operating Expenses" value={0} isHeader />
                    {data.operatingExpenses.lines.map((line, i) => (
                      <LineItem 
                        key={i} 
                        label={line.name} 
                        value={line.amount}
                        previousValue={line.previousAmount}
                        indent={1} 
                      />
                    ))}
                    <LineItem label="Total Operating Expenses" value={data.operatingExpenses.total} previousValue={data.operatingExpenses.previousTotal} isSubtotal />
                  </div>

                  {/* Operating Income */}
                  <div className="py-4 bg-muted/30">
                    <LineItem 
                      label="OPERATING INCOME" 
                      value={data.operatingIncome}
                      previousValue={data.previousOperatingIncome}
                      isTotal 
                      isProfit 
                    />
                    <div className="px-4 pt-1 text-xs text-muted-foreground text-right">
                      Operating Margin: {((data.operatingIncome / data.revenue.total) * 100).toFixed(1)}%
                    </div>
                  </div>

                  {/* Other Income/Expenses */}
                  <div className="py-4">
                    <LineItem label="Other Income (Expense)" value={0} isHeader />
                    <LineItem label="Interest Income" value={data.otherIncome.interestIncome} indent={1} />
                    <LineItem label="Interest Expense" value={-data.otherIncome.interestExpense} indent={1} />
                    <LineItem label="Other Income" value={data.otherIncome.other} indent={1} />
                    <LineItem label="Total Other Income (Expense)" value={data.otherIncome.total} isSubtotal />
                  </div>

                  {/* Income Before Tax */}
                  <div className="py-4">
                    <LineItem 
                      label="INCOME BEFORE INCOME TAX" 
                      value={data.incomeBeforeTax}
                      previousValue={data.previousIncomeBeforeTax}
                      isTotal 
                      isProfit 
                    />
                  </div>

                  {/* Tax */}
                  <div className="py-4">
                    <LineItem label="Income Tax Expense" value={data.incomeTaxExpense} indent={0} />
                  </div>

                  {/* Net Income */}
                  <div className="py-4 bg-primary/5">
                    <LineItem 
                      label="NET INCOME" 
                      value={data.netIncome}
                      previousValue={data.previousNetIncome}
                      isTotal 
                      isProfit 
                    />
                    <div className="px-4 pt-1 text-xs text-muted-foreground text-right">
                      Net Profit Margin: {((data.netIncome / data.revenue.total) * 100).toFixed(1)}%
                    </div>
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
