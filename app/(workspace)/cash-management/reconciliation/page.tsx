"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  getReconciliationItems, 
  getReconciliationSummary,
  getBankAccounts,
  matchReconciliationItem,
  clearReconciliationItem,
} from "@/lib/services"
import type { ReconciliationItem, ReconciliationSummary, BankAccount, SortConfig } from "@/lib/types"
import { 
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  MoreHorizontal,
  ArrowUpDown,
  Check,
  Link,
  FileEdit,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

const statusColors: Record<string, string> = {
  matched: "bg-green-100 text-green-700",
  unmatched: "bg-yellow-100 text-yellow-700",
  adjusted: "bg-blue-100 text-blue-700",
  cleared: "bg-gray-100 text-gray-700",
}

const statusIcons: Record<string, typeof CheckCircle2> = {
  matched: CheckCircle2,
  unmatched: AlertCircle,
  adjusted: FileEdit,
  cleared: Check,
}

const typeLabels: Record<string, string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  transfer: 'Transfer',
  fee: 'Bank Fee',
  interest: 'Interest',
}

export default function ReconciliationPage() {
  // Filter state
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("items")
  
  // Data state
  const [items, setItems] = useState<ReconciliationItem[]>([])
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  
  const [sort, setSort] = useState<SortConfig>({ key: 'date', direction: 'desc' })

  const fetchData = useCallback(async () => {
    if (!selectedAccount) return
    
    setLoading(true)
    try {
      const statusFilter = selectedStatus !== 'all' ? [selectedStatus] : undefined
      const [itemsResult, summaryResult] = await Promise.all([
        getReconciliationItems(selectedAccount, statusFilter, sort),
        getReconciliationSummary(selectedAccount),
      ])
      setItems(itemsResult.data)
      setSummary(summaryResult)
    } finally {
      setLoading(false)
    }
  }, [selectedAccount, selectedStatus, sort])

  useEffect(() => {
    getBankAccounts().then((a) => {
      setAccounts(a)
      if (a.length > 0) {
        setSelectedAccount(a[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      fetchData()
    }
  }, [fetchData, selectedAccount])

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.filter(i => i.status === 'unmatched').map(i => i.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleMatch = async (id: string) => {
    await matchReconciliationItem(id, 'auto-matched')
    fetchData()
  }

  const handleClear = async (id: string) => {
    await clearReconciliationItem(id)
    fetchData()
  }

  const handleClearSelected = async () => {
    for (const id of selectedItems) {
      await clearReconciliationItem(id)
    }
    setSelectedItems(new Set())
    fetchData()
  }

  const selectedAccount_ = accounts.find(a => a.id === selectedAccount)
  const unmatchedCount = items.filter(i => i.status === 'unmatched').length

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Bank Reconciliation</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Reconcile bank transactions with book entries
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Account Selector & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bank Account</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAccount_ && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                    <p className="text-lg font-bold">{formatCurrency(selectedAccount_.balance)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Bank Balance</p>
                {loading ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : (
                  <p className="text-xl font-bold">{formatCurrency(summary?.bankBalance || 0)}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Book Balance</p>
                {loading ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : (
                  <p className="text-xl font-bold">{formatCurrency(summary?.bookBalance || 0)}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Difference</p>
                {loading ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : (
                  <p className={cn(
                    "text-xl font-bold",
                    (summary?.bankBalance || 0) - (summary?.bookBalance || 0) !== 0 
                      ? "text-red-600" 
                      : "text-green-600"
                  )}>
                    {formatCurrency((summary?.bankBalance || 0) - (summary?.bookBalance || 0))}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reconciliation Details */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Reconciliation Summary</CardTitle>
                {summary && (
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      summary.status === 'completed' ? "bg-green-100 text-green-700" :
                      summary.status === 'needs_review' ? "bg-yellow-100 text-yellow-700" :
                      "bg-blue-100 text-blue-700"
                    )}
                  >
                    {summary.status === 'completed' ? 'Reconciled' :
                     summary.status === 'needs_review' ? 'Needs Review' : 'In Progress'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : summary ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Bank Balance</p>
                    <p className="text-sm font-semibold">{formatCurrency(summary.bankBalance)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <p className="text-xs text-muted-foreground">+ Outstanding Deposits</p>
                    <p className="text-sm font-semibold text-green-600">
                      {formatCurrency(summary.outstandingDeposits)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50">
                    <p className="text-xs text-muted-foreground">- Outstanding Withdrawals</p>
                    <p className="text-sm font-semibold text-red-600">
                      {formatCurrency(summary.outstandingWithdrawals)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50">
                    <p className="text-xs text-muted-foreground">+/- Adjustments</p>
                    <p className="text-sm font-semibold text-blue-600">
                      {formatCurrency(summary.adjustments)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border-2 border-dashed">
                    <p className="text-xs text-muted-foreground">= Reconciled Balance</p>
                    <p className="text-sm font-semibold">{formatCurrency(summary.reconciledBalance)}</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="items">
                  Reconciliation Items
                  {unmatchedCount > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-700">
                      {unmatchedCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unmatched">Unmatched</SelectItem>
                    <SelectItem value="matched">Matched</SelectItem>
                    <SelectItem value="cleared">Cleared</SelectItem>
                    <SelectItem value="adjusted">Adjusted</SelectItem>
                  </SelectContent>
                </Select>
                {selectedItems.size > 0 && (
                  <Button size="sm" onClick={handleClearSelected}>
                    <Check className="h-4 w-4 mr-2" />
                    Clear Selected ({selectedItems.size})
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value="items" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox 
                            checked={selectedItems.size > 0 && selectedItems.size === items.filter(i => i.status === 'unmatched').length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('date')}
                        >
                          <div className="flex items-center gap-1">
                            Date
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Bank Amount</TableHead>
                        <TableHead className="text-right">Book Amount</TableHead>
                        <TableHead className="text-right">Difference</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                          </TableRow>
                        ))
                      ) : items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                            <p>All items reconciled</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item) => {
                          const StatusIcon = statusIcons[item.status] || AlertCircle
                          const isNegative = item.bankAmount < 0
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Checkbox 
                                  checked={selectedItems.has(item.id)}
                                  onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                                  disabled={item.status !== 'unmatched'}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {format(new Date(item.date), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {item.description}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{typeLabels[item.type] || item.type}</span>
                              </TableCell>
                              <TableCell className={cn(
                                "text-right font-medium",
                                isNegative ? "text-red-600" : "text-green-600"
                              )}>
                                {formatCurrency(item.bankAmount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(item.bookAmount)}
                              </TableCell>
                              <TableCell className={cn(
                                "text-right font-medium",
                                item.difference !== 0 ? "text-red-600" : "text-muted-foreground"
                              )}>
                                {item.difference !== 0 ? formatCurrency(item.difference) : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="secondary" 
                                  className={cn("text-xs", statusColors[item.status])}
                                >
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {item.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {item.status === 'unmatched' && (
                                      <>
                                        <DropdownMenuItem onClick={() => handleMatch(item.id)}>
                                          <Link className="h-4 w-4 mr-2" />
                                          Match Transaction
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleClear(item.id)}>
                                          <Check className="h-4 w-4 mr-2" />
                                          Clear Item
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <p>Reconciliation history will be displayed here</p>
                  <p className="text-sm mt-2">
                    Last reconciled: {summary?.lastReconciledDate 
                      ? format(new Date(summary.lastReconciledDate), 'MMMM d, yyyy')
                      : 'Never'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  )
}
