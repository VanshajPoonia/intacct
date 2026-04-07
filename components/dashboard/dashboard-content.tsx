// @ts-nocheck
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { startOfYear } from "date-fns"
import type { 
  DashboardFilters, 
  DashboardMetricsResponse,
  RevenueByChannelData,
  DepartmentExpenseData,
  CashWeeklyData,
  ContractExpenseData,
  AgingData,
  BudgetActualData,
  EntityPerformanceData,
  AIInsight,
  Transaction,
  ApprovalItem,
  PaginatedResponse,
} from "@/lib/types"
import {
  getDashboardMetrics,
  getRevenueByChannel,
  getDepartmentExpenses,
  getCashWeekly,
  getContractExpensesByRep,
  getAPAging,
  getARAging,
  getBudgetVsActual,
  getEntityPerformance,
  getAIInsights,
  getTransactions,
  getApprovalItems,
  approveItem,
  rejectItem,
} from "@/lib/services"
import { DashboardFilterBar } from "./dashboard-filter-bar"
import { DashboardMetrics } from "./dashboard-metrics"
import { DashboardCharts } from "./dashboard-charts"
import { DashboardTables } from "./dashboard-tables"
import { DashboardInsights } from "./dashboard-insights"
import { TransactionDrawer } from "./transaction-drawer"
import { Button } from "@/components/ui/button"
import { Plus, Download, RefreshCw, Save, LayoutGrid } from "lucide-react"
import { toast } from "sonner"

const defaultFilters: DashboardFilters = {
  entityId: 'e4', // Consolidated view by default
  dateRange: {
    startDate: startOfYear(new Date()),
    endDate: new Date(),
    preset: 'this_year'
  }
}

export function DashboardContent() {
  // Filter state
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters)
  
  // Data states
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null)
  const [revenueByChannel, setRevenueByChannel] = useState<RevenueByChannelData[]>([])
  const [departmentExpenses, setDepartmentExpenses] = useState<DepartmentExpenseData[]>([])
  const [cashWeekly, setCashWeekly] = useState<CashWeeklyData[]>([])
  const [contractExpenses, setContractExpenses] = useState<ContractExpenseData[]>([])
  const [apAging, setApAging] = useState<AgingData[]>([])
  const [arAging, setArAging] = useState<AgingData[]>([])
  const [budgetVsActual, setBudgetVsActual] = useState<BudgetActualData[]>([])
  const [entityPerformance, setEntityPerformance] = useState<EntityPerformanceData[]>([])
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [transactions, setTransactions] = useState<PaginatedResponse<Transaction> | null>(null)
  const [approvals, setApprovals] = useState<PaginatedResponse<ApprovalItem> | null>(null)
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [transactionSearch, setTransactionSearch] = useState('')
  const [transactionPage, setTransactionPage] = useState(1)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    
    try {
      const [
        metricsData,
        revenueData,
        expensesData,
        cashData,
        contractData,
        apData,
        arData,
        budgetData,
        entityData,
        insightsData,
        transactionsData,
        approvalsData,
      ] = await Promise.all([
        getDashboardMetrics(filters),
        getRevenueByChannel(filters),
        getDepartmentExpenses(filters),
        getCashWeekly(filters),
        getContractExpensesByRep(filters),
        getAPAging(filters),
        getARAging(filters),
        getBudgetVsActual(filters),
        getEntityPerformance(filters),
        getAIInsights(filters),
        getTransactions(filters, transactionSearch, undefined, transactionPage),
        getApprovalItems(filters, 'pending'),
      ])
      
      setMetrics(metricsData)
      setRevenueByChannel(revenueData)
      setDepartmentExpenses(expensesData)
      setCashWeekly(cashData)
      setContractExpenses(contractData)
      setApAging(apData)
      setArAging(arData)
      setBudgetVsActual(budgetData)
      setEntityPerformance(entityData)
      setAiInsights(insightsData)
      setTransactions(transactionsData)
      setApprovals(approvalsData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, transactionSearch, transactionPage])

  // Initial load and filter changes
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: DashboardFilters) => {
    setFilters(newFilters)
    setTransactionPage(1) // Reset pagination on filter change
  }, [])

  // Handle transaction search
  const handleTransactionSearch = useCallback((search: string) => {
    setTransactionSearch(search)
    setTransactionPage(1)
  }, [])

  // Handle transaction row click
  const handleTransactionClick = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setDrawerOpen(true)
  }, [])

  // Handle approval actions
  const handleApprove = useCallback(async (id: string) => {
    await approveItem(id)
    // Refresh approvals
    const approvalsData = await getApprovalItems(filters, 'pending')
    setApprovals(approvalsData)
    // Refresh metrics to update pending count
    const metricsData = await getDashboardMetrics(filters)
    setMetrics(metricsData)
  }, [filters])

  const handleReject = useCallback(async (id: string) => {
    await rejectItem(id)
    const approvalsData = await getApprovalItems(filters, 'pending')
    setApprovals(approvalsData)
    const metricsData = await getDashboardMetrics(filters)
    setMetrics(metricsData)
  }, [filters])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchDashboardData()
    toast.success('Dashboard refreshed')
  }, [fetchDashboardData])

  // Handle save view
  const handleSaveView = useCallback(() => {
    toast.success('View saved successfully')
  }, [])

  // Entity name for header
  const entityName = useMemo(() => {
    if (filters.entityId === 'e4') return 'Consolidated View'
    if (filters.entityId === 'e1') return 'Acme Corporation'
    if (filters.entityId === 'e2') return 'Acme West'
    if (filters.entityId === 'e3') return 'Acme Europe'
    return 'Entity'
  }, [filters.entityId])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">CFO Dashboard</h1>
          <p className="text-sm text-muted-foreground">{entityName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveView}>
            <Save className="h-4 w-4 mr-1.5" />
            Save View
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <LayoutGrid className="h-4 w-4 mr-1.5" />
            Add Widget
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilterBar 
        filters={filters} 
        onFiltersChange={handleFiltersChange} 
      />

      {/* Metrics Cards */}
      <DashboardMetrics 
        metrics={metrics} 
        loading={loading} 
      />

      {/* Charts Grid */}
      <DashboardCharts
        revenueByChannel={revenueByChannel}
        departmentExpenses={departmentExpenses}
        cashWeekly={cashWeekly}
        contractExpenses={contractExpenses}
        apAging={apAging}
        arAging={arAging}
        budgetVsActual={budgetVsActual}
        entityPerformance={entityPerformance}
        loading={loading}
        isConsolidated={filters.entityId === 'e4'}
      />

      {/* Tables & Insights Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <DashboardTables
            transactions={transactions}
            approvals={approvals}
            loading={loading}
            transactionSearch={transactionSearch}
            onTransactionSearch={handleTransactionSearch}
            transactionPage={transactionPage}
            onTransactionPageChange={setTransactionPage}
            onTransactionClick={handleTransactionClick}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
        <div>
          <DashboardInsights 
            insights={aiInsights} 
            loading={loading} 
          />
        </div>
      </div>

      {/* Transaction Detail Drawer */}
      <TransactionDrawer
        transaction={selectedTransaction}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
