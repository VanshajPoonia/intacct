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

const typeIcons: Record<string, typeof ArrowUpRight> = {
  deposit: ArrowUpRight,
  withdrawal: ArrowDownRight,
  transfer: ArrowUpRight,
}

export default function TransactionsPage() {
  // Filter state
  const [entities, setEntities] = useState<Entity[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string>("e4")
  const [selectedAccount, setSelectedAccount] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
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
      const result = await getTransactions(
        filters,
        debouncedSearch || undefined,
        typeFilter,
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
  }, [selectedEntity, selectedType, debouncedSearch, sort, page])

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
  }, [selectedEntity, selectedType, debouncedSearch])

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
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
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
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => {
                      const Icon = typeIcons[transaction.type] || ArrowUpRight
                      const isDeposit = transaction.type === 'deposit'
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
                          <TableCell className="max-w-[200px] truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell>{transaction.bankAccountName || '-'}</TableCell>
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
                            "text-right font-medium",
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
        <SheetContent className="w-[450px] sm:max-w-[450px]">
          <SheetHeader>
            <SheetTitle>Transaction Details</SheetTitle>
          </SheetHeader>
          {selectedTransaction && (
            <div className="mt-6 space-y-6">
              {/* Amount */}
              <div className="text-center py-4 bg-muted/30 rounded-lg">
                <p className={cn(
                  "text-3xl font-bold",
                  selectedTransaction.type === 'deposit' ? "text-green-600" : "text-red-600"
                )}>
                  {selectedTransaction.type === 'deposit' ? '+' : '-'}
                  {formatCurrency(Math.abs(selectedTransaction.amount))}
                </p>
                <p className="text-sm text-muted-foreground mt-1 capitalize">
                  {selectedTransaction.type}
                </p>
              </div>

              <Separator />

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedTransaction.date), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedTransaction.description}</p>
                </div>
                {selectedTransaction.reference && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reference</p>
                    <p className="font-medium">{selectedTransaction.reference}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Bank Account</p>
                  <p className="font-medium">{selectedTransaction.bankAccountName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs", statusColors[selectedTransaction.status])}
                  >
                    {selectedTransaction.status}
                  </Badge>
                </div>
                {selectedTransaction.category && (
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{selectedTransaction.category}</p>
                  </div>
                )}
              </div>

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
