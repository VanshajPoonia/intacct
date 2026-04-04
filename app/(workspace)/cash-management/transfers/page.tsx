"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
  getTransfers, 
  getBankAccounts,
  getEntities,
  createTransfer,
  processTransfer,
  completeTransfer,
  cancelTransfer,
} from "@/lib/services"
import type { Transfer, BankAccount, Entity, DashboardFilters, SortConfig } from "@/lib/types"
import { 
  Search,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MoreHorizontal,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Clock,
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
  processing: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
}

const statusIcons: Record<string, typeof CheckCircle> = {
  completed: CheckCircle,
  processing: Clock,
  pending: Clock,
  failed: XCircle,
  cancelled: XCircle,
}

export default function TransfersPage() {
  // Filter state
  const [entities, setEntities] = useState<Entity[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string>("e4")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  
  // Data state
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState<SortConfig>({ key: 'date', direction: 'desc' })
  
  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    memo: '',
  })
  const [creating, setCreating] = useState(false)
  
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
      const statusFilter = selectedStatus !== 'all' ? [selectedStatus] : undefined
      const result = await getTransfers(
        filters,
        debouncedSearch || undefined,
        statusFilter,
        sort,
        page,
        pageSize
      )
      setTransfers(result.data)
      setTotalPages(result.totalPages)
      setTotal(result.total)
    } finally {
      setLoading(false)
    }
  }, [selectedEntity, selectedStatus, debouncedSearch, sort, page])

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
  }, [selectedEntity, selectedStatus, debouncedSearch])

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleCreateTransfer = async () => {
    if (!createForm.fromAccountId || !createForm.toAccountId || !createForm.amount) return
    
    setCreating(true)
    try {
      await createTransfer({
        fromAccountId: createForm.fromAccountId,
        toAccountId: createForm.toAccountId,
        amount: parseFloat(createForm.amount),
        memo: createForm.memo,
        entityId: selectedEntity,
      })
      setCreateModalOpen(false)
      setCreateForm({ fromAccountId: '', toAccountId: '', amount: '', memo: '' })
      fetchData()
    } finally {
      setCreating(false)
    }
  }

  const handleProcess = async (id: string) => {
    await processTransfer(id)
    fetchData()
  }

  const handleComplete = async (id: string) => {
    await completeTransfer(id)
    fetchData()
  }

  const handleCancel = async (id: string) => {
    await cancelTransfer(id)
    fetchData()
  }

  // Calculate summary
  const pendingAmount = transfers.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0)
  const completedAmount = transfers.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0)

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Transfers</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage inter-account transfers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Transfer
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Transfers</p>
                {loading ? (
                  <Skeleton className="h-7 w-20 mt-1" />
                ) : (
                  <p className="text-xl font-bold">{total}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                {loading ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Completed This Period</p>
                {loading ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-green-600">{formatCurrency(completedAmount)}</p>
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
                    placeholder="Search transfers..."
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
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transfers Table */}
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
                    <TableHead>Number</TableHead>
                    <TableHead>From Account</TableHead>
                    <TableHead>To Account</TableHead>
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
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : transfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <ArrowRightLeft className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No transfers found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transfers.map((transfer) => {
                      const StatusIcon = statusIcons[transfer.status] || Clock
                      return (
                        <TableRow key={transfer.id}>
                          <TableCell className="font-medium">
                            {format(new Date(transfer.date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {transfer.number}
                          </TableCell>
                          <TableCell>{transfer.fromAccountName}</TableCell>
                          <TableCell>{transfer.toAccountName}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(transfer.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", statusColors[transfer.status])}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {transfer.status}
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
                                {transfer.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleProcess(transfer.id)}>
                                      Process Transfer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleComplete(transfer.id)}>
                                      Complete Transfer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => handleCancel(transfer.id)}
                                    >
                                      Cancel Transfer
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {transfer.status === 'processing' && (
                                  <DropdownMenuItem onClick={() => handleComplete(transfer.id)}>
                                    Complete Transfer
                                  </DropdownMenuItem>
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

      {/* Create Transfer Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>From Account</Label>
              <Select 
                value={createForm.fromAccountId} 
                onValueChange={(v) => setCreateForm(prev => ({ ...prev, fromAccountId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem 
                      key={account.id} 
                      value={account.id}
                      disabled={account.id === createForm.toAccountId}
                    >
                      {account.name} ({formatCurrency(account.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Account</Label>
              <Select 
                value={createForm.toAccountId} 
                onValueChange={(v) => setCreateForm(prev => ({ ...prev, toAccountId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem 
                      key={account.id} 
                      value={account.id}
                      disabled={account.id === createForm.fromAccountId}
                    >
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={createForm.amount}
                onChange={(e) => setCreateForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Memo (Optional)</Label>
              <Input
                placeholder="Transfer memo..."
                value={createForm.memo}
                onChange={(e) => setCreateForm(prev => ({ ...prev, memo: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTransfer}
              disabled={!createForm.fromAccountId || !createForm.toAccountId || !createForm.amount || creating}
            >
              {creating ? 'Creating...' : 'Create Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
