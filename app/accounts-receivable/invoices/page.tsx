"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  MoreHorizontal,
  FileText,
  Eye,
  Edit,
  Send,
  CreditCard,
  Printer,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle
} from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { getInvoices, sendInvoice, voidInvoice } from "@/lib/services"
import { InvoiceDrawer } from "@/components/accounts-receivable/invoice-drawer"
import { CreateInvoiceModal } from "@/components/accounts-receivable/create-invoice-modal"
import type { Invoice, SortConfig, PaginatedResponse, DashboardFilters } from "@/lib/types"

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function StatusBadge({ status, isOverdue }: { status: string; isOverdue?: boolean }) {
  if (isOverdue && status !== 'paid' && status !== 'void') {
    return (
      <Badge variant="outline" className="text-xs font-medium bg-red-100 text-red-700 border-red-200 gap-1">
        <AlertCircle className="h-3 w-3" />
        Overdue
      </Badge>
    )
  }

  const variants: Record<string, { className: string; label: string }> = {
    draft: { className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Draft' },
    sent: { className: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Sent' },
    partial: { className: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Partial' },
    paid: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Paid' },
    void: { className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Void' },
  }
  
  const variant = variants[status] || { className: 'bg-gray-100 text-gray-700', label: status }
  
  return (
    <Badge variant="outline" className={`text-xs font-medium ${variant.className}`}>
      {variant.label}
    </Badge>
  )
}

function SortableHeader({ 
  label, 
  sortKey, 
  currentSort, 
  onSort 
}: { 
  label: string
  sortKey: string
  currentSort: SortConfig | null
  onSort: (key: string) => void
}) {
  const isActive = currentSort?.key === sortKey
  const direction = isActive ? currentSort.direction : null

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => onSort(sortKey)}
    >
      {label}
      {direction === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : direction === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  )
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<PaginatedResponse<Invoice> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sort, setSort] = useState<SortConfig | null>({ key: 'date', direction: 'desc' })
  const [page, setPage] = useState(1)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const pageSize = 10

  // Default filters for service calls
  const defaultFilters: DashboardFilters = {
    entityId: 'e4', // All entities
    dateRange: {
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(),
      preset: 'this_year'
    }
  }

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getInvoices(
        defaultFilters,
        search || undefined,
        statusFilter !== 'all' ? [statusFilter] : undefined,
        sort || undefined,
        page,
        pageSize
      )
      setInvoices(result)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, sort, page])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const handleSort = (key: string) => {
    setSort(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' }
        if (prev.direction === 'desc') return null
      }
      return { key, direction: 'asc' }
    })
  }

  const handleRowClick = (invoice: Invoice) => {
    setSelectedInvoiceId(invoice.id)
    setDrawerOpen(true)
  }

  const handleSend = async (id: string) => {
    await sendInvoice(id)
    fetchInvoices()
  }

  const handleVoid = async (id: string) => {
    await voidInvoice(id)
    fetchInvoices()
  }

  // Calculate summary stats from data
  const now = new Date()
  const totalOutstanding = invoices?.data
    .filter(i => i.status !== 'paid' && i.status !== 'void')
    .reduce((sum, i) => sum + (i.amount - (i.amountPaid || 0)), 0) || 0
  const overdueCount = invoices?.data.filter(i => 
    i.status !== 'paid' && i.status !== 'void' && new Date(i.dueDate) < now
  ).length || 0
  const overdueAmount = invoices?.data
    .filter(i => i.status !== 'paid' && i.status !== 'void' && new Date(i.dueDate) < now)
    .reduce((sum, i) => sum + (i.amount - (i.amountPaid || 0)), 0) || 0

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Invoices</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage customer invoices and collections
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-semibold mt-1">{invoices?.total || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Outstanding Amount</p>
                <p className="text-2xl font-semibold mt-1 text-amber-600">
                  {formatCurrency(totalOutstanding)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Overdue Invoices</p>
                <p className="text-2xl font-semibold mt-1 text-red-600">
                  {overdueCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Overdue Amount</p>
                <p className="text-2xl font-semibold mt-1 text-red-600">
                  {formatCurrency(overdueAmount)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortableHeader 
                        label="Invoice #" 
                        sortKey="number" 
                        currentSort={sort}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>
                      <SortableHeader 
                        label="Date" 
                        sortKey="date" 
                        currentSort={sort}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">
                      <SortableHeader 
                        label="Amount" 
                        sortKey="amount" 
                        currentSort={sort}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : invoices?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <FileText className="h-8 w-8 mb-2" />
                          <p>No invoices found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices?.data.map((invoice) => {
                      const isOverdue = invoice.status !== 'paid' && invoice.status !== 'void' && new Date(invoice.dueDate) < now
                      const balance = invoice.amount - (invoice.amountPaid || 0)
                      const daysOverdue = isOverdue ? differenceInDays(now, new Date(invoice.dueDate)) : 0
                      
                      return (
                        <TableRow 
                          key={invoice.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(invoice)}
                        >
                          <TableCell className="font-medium font-mono">{invoice.number}</TableCell>
                          <TableCell>{invoice.customerName}</TableCell>
                          <TableCell className="tabular-nums">{format(invoice.date, 'MMM d, yyyy')}</TableCell>
                          <TableCell className={`tabular-nums ${isOverdue ? 'text-red-600' : ''}`}>
                            {format(invoice.dueDate, 'MMM d, yyyy')}
                            {isOverdue && (
                              <span className="text-xs ml-1">({daysOverdue}d)</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrency(invoice.amount)}
                          </TableCell>
                          <TableCell className={`text-right font-medium tabular-nums ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {formatCurrency(balance)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={invoice.status} isOverdue={isOverdue} />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRowClick(invoice) }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Invoice
                                </DropdownMenuItem>
                                {invoice.status === 'draft' && (
                                  <DropdownMenuItem>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Invoice
                                  </DropdownMenuItem>
                                )}
                                {balance > 0 && invoice.status !== 'void' && (
                                  <DropdownMenuItem>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Record Payment
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Printer className="h-4 w-4 mr-2" />
                                  Print
                                </DropdownMenuItem>
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

          {/* Pagination */}
          {invoices && invoices.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, invoices.total)} of {invoices.total} invoices
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {invoices.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page === invoices.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <InvoiceDrawer
        invoiceId={selectedInvoiceId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdate={fetchInvoices}
      />

      <CreateInvoiceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchInvoices}
      />
    </AppShell>
  )
}
