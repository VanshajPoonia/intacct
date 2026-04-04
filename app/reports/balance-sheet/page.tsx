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
  ChevronDown,
  ChevronRight,
  Building2
} from "lucide-react"
import { format } from "date-fns"
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

interface LineItemProps {
  label: string
  value: number
  indent?: number
  isHeader?: boolean
  isTotal?: boolean
  isSubtotal?: boolean
}

function LineItem({ label, value, indent = 0, isHeader, isTotal, isSubtotal }: LineItemProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between py-1.5 px-4",
        isHeader && "font-semibold text-foreground bg-muted/50",
        isTotal && "font-bold text-foreground border-t-2 border-double pt-2 mt-2",
        isSubtotal && "font-medium border-t pt-1.5 mt-1",
        !isHeader && !isTotal && !isSubtotal && "text-muted-foreground"
      )}
      style={{ paddingLeft: `${16 + indent * 16}px` }}
    >
      <span>{label}</span>
      <span className="tabular-nums">{formatCurrency(value)}</span>
    </div>
  )
}

function SectionHeader({ 
  label, 
  isOpen, 
  onToggle 
}: { 
  label: string
  isOpen: boolean
  onToggle: () => void 
}) {
  return (
    <button 
      onClick={onToggle}
      className="flex items-center gap-2 w-full py-2 px-4 font-semibold text-sm uppercase tracking-wide text-primary hover:bg-muted/50 transition-colors"
    >
      {isOpen ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
      {label}
    </button>
  )
}

export default function BalanceSheetPage() {
  const [loading, setLoading] = useState(true)
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string>("e4")
  const [data, setData] = useState<BalanceSheetData | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['assets', 'liabilities', 'equity'])
  )
  
  const asOfDate = new Date()

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
  }, [selectedEntity])

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

  const selectedEntityName = entities.find(e => e.id === selectedEntity)?.name || 'All Entities'

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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>As of {format(asOfDate, 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Report Header */}
          <Card>
            <CardHeader className="text-center border-b pb-4">
              <CardTitle className="text-lg">{selectedEntityName}</CardTitle>
              <p className="text-sm text-muted-foreground">Balance Sheet</p>
              <p className="text-sm text-muted-foreground">As of {format(asOfDate, 'MMMM d, yyyy')}</p>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
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
                    />
                    {expandedSections.has('assets') && (
                      <div className="pb-4">
                        <LineItem label="Current Assets" value={0} isHeader indent={0} />
                        <LineItem label="Cash and Cash Equivalents" value={data.assets.currentAssets.cash} indent={1} />
                        <LineItem label="Accounts Receivable" value={data.assets.currentAssets.accountsReceivable} indent={1} />
                        <LineItem label="Inventory" value={data.assets.currentAssets.inventory} indent={1} />
                        <LineItem label="Prepaid Expenses" value={data.assets.currentAssets.prepaidExpenses} indent={1} />
                        <LineItem label="Other Current Assets" value={data.assets.currentAssets.other} indent={1} />
                        <LineItem label="Total Current Assets" value={data.assets.currentAssets.total} isSubtotal indent={0} />
                        
                        <div className="h-3" />
                        
                        <LineItem label="Non-Current Assets" value={0} isHeader indent={0} />
                        <LineItem label="Property, Plant & Equipment" value={data.assets.nonCurrentAssets.ppe} indent={1} />
                        <LineItem label="Accumulated Depreciation" value={-data.assets.nonCurrentAssets.accumulatedDepreciation} indent={1} />
                        <LineItem label="Intangible Assets" value={data.assets.nonCurrentAssets.intangibles} indent={1} />
                        <LineItem label="Long-term Investments" value={data.assets.nonCurrentAssets.investments} indent={1} />
                        <LineItem label="Other Non-Current Assets" value={data.assets.nonCurrentAssets.other} indent={1} />
                        <LineItem label="Total Non-Current Assets" value={data.assets.nonCurrentAssets.total} isSubtotal indent={0} />
                        
                        <div className="h-2" />
                        <LineItem label="TOTAL ASSETS" value={data.assets.total} isTotal />
                      </div>
                    )}
                  </div>

                  {/* LIABILITIES */}
                  <div>
                    <SectionHeader 
                      label="Liabilities" 
                      isOpen={expandedSections.has('liabilities')}
                      onToggle={() => toggleSection('liabilities')}
                    />
                    {expandedSections.has('liabilities') && (
                      <div className="pb-4">
                        <LineItem label="Current Liabilities" value={0} isHeader indent={0} />
                        <LineItem label="Accounts Payable" value={data.liabilities.currentLiabilities.accountsPayable} indent={1} />
                        <LineItem label="Accrued Expenses" value={data.liabilities.currentLiabilities.accruedExpenses} indent={1} />
                        <LineItem label="Short-term Debt" value={data.liabilities.currentLiabilities.shortTermDebt} indent={1} />
                        <LineItem label="Current Portion of Long-term Debt" value={data.liabilities.currentLiabilities.currentPortionLTD} indent={1} />
                        <LineItem label="Other Current Liabilities" value={data.liabilities.currentLiabilities.other} indent={1} />
                        <LineItem label="Total Current Liabilities" value={data.liabilities.currentLiabilities.total} isSubtotal indent={0} />
                        
                        <div className="h-3" />
                        
                        <LineItem label="Non-Current Liabilities" value={0} isHeader indent={0} />
                        <LineItem label="Long-term Debt" value={data.liabilities.nonCurrentLiabilities.longTermDebt} indent={1} />
                        <LineItem label="Deferred Tax Liabilities" value={data.liabilities.nonCurrentLiabilities.deferredTax} indent={1} />
                        <LineItem label="Other Long-term Liabilities" value={data.liabilities.nonCurrentLiabilities.other} indent={1} />
                        <LineItem label="Total Non-Current Liabilities" value={data.liabilities.nonCurrentLiabilities.total} isSubtotal indent={0} />
                        
                        <div className="h-2" />
                        <LineItem label="TOTAL LIABILITIES" value={data.liabilities.total} isTotal />
                      </div>
                    )}
                  </div>

                  {/* EQUITY */}
                  <div>
                    <SectionHeader 
                      label="Stockholders&apos; Equity" 
                      isOpen={expandedSections.has('equity')}
                      onToggle={() => toggleSection('equity')}
                    />
                    {expandedSections.has('equity') && (
                      <div className="pb-4">
                        <LineItem label="Common Stock" value={data.equity.commonStock} indent={1} />
                        <LineItem label="Additional Paid-in Capital" value={data.equity.additionalPaidInCapital} indent={1} />
                        <LineItem label="Retained Earnings" value={data.equity.retainedEarnings} indent={1} />
                        <LineItem label="Treasury Stock" value={-data.equity.treasuryStock} indent={1} />
                        <LineItem label="Other Comprehensive Income" value={data.equity.otherComprehensiveIncome} indent={1} />
                        
                        <div className="h-2" />
                        <LineItem label="TOTAL STOCKHOLDERS&apos; EQUITY" value={data.equity.total} isTotal />
                      </div>
                    )}
                  </div>

                  {/* TOTAL LIABILITIES AND EQUITY */}
                  <div className="bg-muted/30 py-4">
                    <LineItem 
                      label="TOTAL LIABILITIES AND STOCKHOLDERS' EQUITY" 
                      value={data.liabilities.total + data.equity.total} 
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
