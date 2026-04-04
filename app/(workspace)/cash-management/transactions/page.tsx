// @ts-nocheck
"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { 
  getTransactions, 
  getBankAccounts,
  getEntities,
} from "@/lib/services"
import type { Transaction, BankAccount, Entity, DashboardFilters, SortConfig } from "@/lib/types"
import { 
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  ExternalLink,
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
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  cleared: "bg-blue-100 text-blue-700",
}

const reconciliationStatusColors: Record<string, string> = {
  unmatched: "bg-gray-100 text-gray-700",
  matched: "bg-blue-100 text-blue-700",
  reconciled: "bg-green-100 text-green-700",
  exception: "bg-red-100 text-red-700",
}

const sourceLabels: Record<string, string> = {
  bank_feed: "Bank Feed",
  manual: "Manual",
  import: "Import",
  api: "API",
}

const typeIcons: Record<string, typeof ArrowUpRight> = {
  deposit: ArrowUpRight,
  withdrawal: ArrowDownRight,
  transfer: ArrowUpRight,
  fee: ArrowDownRight,
  interest: ArrowUpRight,
}

export default function TransactionsPage() {
  // Filter state
  const [entities, setEntities] = useState<Entity[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string>("e4")
  const [selectedAccount, setSelectedAccount] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedReconStatus, setSelectedReconStatus] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  
  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState<SortConfig>({ key: 'date', direction: 'desc' })
  
  // UI state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  
  const pageSize = 15

  const filters: DashboardFilters = {
    entityId: selectedEntity,
    dateRange: {
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(),
      preset: 'this_year',
    },
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const typeFilter = selectedType !== 'all' ? [selectedType] : undefined
      const reconFilter = selectedReconStatus !== 'all' ? selectedReconStatus : undefined
      const result = await getTransactions(
        filters,
        debouncedSearch || undefined,
        typeFilter,
        reconFilter,
        sort,
        page,
        pageSize
      )
      setTransactions(result.data)
      setTotalPages(result.totalPages)
      setTotal(result.total)
    } finally {
      setLoading(false)
    }
  }, [selectedEntity, selectedType, selectedReconStatus, debouncedSearch, sort, page])

  useEffect(() => {
    Promise.all([getEntities(), getBankAccounts()]).then(([e, a]) => {
      setEntities(e)
      setAccounts(a)
    })
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setPage(1)
  }, [selectedEntity, selectedType, selectedReconStatus, debouncedSearch])

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setDrawerOpen(true)
  }

  // Calculate summary
  const deposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0)
  const withdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Bank Transactions</h1>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage all bank transactions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                {loading ? (
                  <Skeleton className="h-7 w-20 mt-1" />
                ) : (
                  <p className="text-xl font-bold">{total}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Deposits</p>
                {loading ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-green-600">+{formatCurrency(deposits)}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Withdrawals</p>
                {loading ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-red-600">-{formatCurrency(withdrawals)}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposits</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                    <SelectItem value="transfer">Transfers</SelectItem>
                    <SelectItem value="fee">Fees</SelectItem>
                    <SelectItem value="interest">Interest</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedReconStatus} onValueChange={setSelectedReconStatus}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Reconciliation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unmatched">Unmatched</SelectItem>
                    <SelectItem value="matched">Matched</SelectItem>
                    <SelectItem value="reconciled">Reconciled</SelectItem>
                    <SelectItem value="exception">Exception</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description / Merchant</TableHead>
                    <TableHead>Bank Account</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Amount
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reconciliation</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => {
                      const Icon = typeIcons[transaction.type] || ArrowUpRight
                      const isDeposit = transaction.type === 'deposit' || transaction.type === 'interest'
                      return (
                        <TableRow 
                          key={transaction.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(transaction)}
                        >
                          <TableCell className="font-medium">
                            {format(new Date(transaction.date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {transaction.reference || '-'}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div>
                              <p className="truncate">{transaction.description}</p>
                              {transaction.merchant && (
                                <p className="text-xs text-muted-foreground truncate">{transaction.merchant}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{transaction.bankAccountName || '-'}</TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {sourceLabels[transaction.source] || transaction.source}
                            </span>
                          </TableCell>
                          <TableCell>
                            {transaction.category ? (
                              <Badge variant="outline" className="text-xs">{transaction.category}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Icon className={cn(
                                "h-3.5 w-3.5",
                                isDeposit ? "text-green-600" : "text-red-600"
                              )} />
                              <span className="capitalize text-sm">{transaction.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-medium tabular-nums",
                            isDeposit ? "text-green-600" : "text-red-600"
                          )}>
                            {isDeposit ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", statusColors[transaction.status])}
                            >
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", reconciliationStatusColors[transaction.reconciliationStatus])}
                            >
                              {transaction.reconciliationStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Match Transaction</DropdownMenuItem>
                                <DropdownMenuItem>Add Memo</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Transaction Details</SheetTitle>
          </SheetHeader>
          {selectedTransaction && (
            <div className="mt-6 space-y-6">
              {/* Amount */}
              <div className="text-center py-4 bg-muted/30 rounded-lg">
                <p className={cn(
                  "text-3xl font-bold",
                  (selectedTransaction.type === 'deposit' || selectedTransaction.type === 'interest') ? "text-green-600" : "text-red-600"
                )}>
                  {(selectedTransaction.type === 'deposit' || selectedTransaction.type === 'interest') ? '+' : '-'}
                  {formatCurrency(Math.abs(selectedTransaction.amount))}
                </p>
                <p className="text-sm text-muted-foreground mt-1 capitalize">
                  {selectedTransaction.type}
                </p>
              </div>

              <Separator />

              {/* Basic Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Transaction Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">{format(new Date(selectedTransaction.date), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reference</p>
                    <p className="text-sm font-medium">{selectedTransaction.reference || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p className="text-sm font-medium">{sourceLabels[selectedTransaction.source] || selectedTransaction.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Currency</p>
                    <p className="text-sm font-medium">{selectedTransaction.currency}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm font-medium">{selectedTransaction.description}</p>
                </div>
                {selectedTransaction.merchant && (
                  <div>
                    <p className="text-xs text-muted-foreground">Merchant</p>
                    <p className="text-sm font-medium">{selectedTransaction.merchant}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Account & Entity */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Account Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Bank Account</p>
                    <p className="text-sm font-medium">{selectedTransaction.bankAccountName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">GL Account</p>
                    <p className="text-sm font-medium">{selectedTransaction.accountName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Entity</p>
                    <p className="text-sm font-medium">{selectedTransaction.entityName || '-'}</p>
                  </div>
                  {selectedTransaction.departmentName && (
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="text-sm font-medium">{selectedTransaction.departmentName}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Status & Reconciliation */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Transaction Status</p>
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs mt-1", statusColors[selectedTransaction.status])}
                    >
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reconciliation</p>
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs mt-1", reconciliationStatusColors[selectedTransaction.reconciliationStatus])}
                    >
                      {selectedTransaction.reconciliationStatus}
                    </Badge>
                  </div>
                </div>
                {selectedTransaction.matchedTransactionId && (
                  <div>
                    <p className="text-xs text-muted-foreground">Matched To</p>
                    <p className="text-sm font-medium text-blue-600">{selectedTransaction.matchedTransactionId}</p>
                  </div>
                )}
                {selectedTransaction.ruleName && (
                  <div>
                    <p className="text-xs text-muted-foreground">Applied Rule</p>
                    <p className="text-sm font-medium">{selectedTransaction.ruleName}</p>
                  </div>
                )}
              </div>

              {/* Category & Tags */}
              {(selectedTransaction.category || (selectedTransaction.tags && selectedTransaction.tags.length > 0)) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Categorization</h3>
                    {selectedTransaction.category && (
                      <div>
                        <p className="text-xs text-muted-foreground">Category</p>
                        <Badge variant="outline" className="mt-1">{selectedTransaction.category}</Badge>
                      </div>
                    )}
                    {selectedTransaction.tags && selectedTransaction.tags.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">Tags</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedTransaction.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              {/* Actions */}
              <div className="space-y-2">
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Journal Entry
                </Button>
                <Button className="w-full" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Match to Invoice/Bill
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}
