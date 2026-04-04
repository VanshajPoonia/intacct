// @ts-nocheck
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
  Users,
  Mail,
  Phone,
  FileText,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { format } from "date-fns"
import { getCustomers } from "@/lib/services"
import { CustomerDrawer } from "@/components/accounts-receivable/customer-drawer"
import { CreateCustomerModal } from "@/components/accounts-receivable/create-customer-modal"
import type { Customer, SortConfig, PaginatedResponse } from "@/lib/types"

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    active: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Active' },
    inactive: { className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Inactive' },
    pending: { className: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Pending' },
    hold: { className: 'bg-red-100 text-red-700 border-red-200', label: 'On Hold' },
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<PaginatedResponse<Customer> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sort, setSort] = useState<SortConfig | null>(null)
  const [page, setPage] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const pageSize = 10

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getCustomers(
        search || undefined,
        statusFilter !== 'all' ? [statusFilter] : undefined,
        sort || undefined,
        page,
        pageSize
      )
      setCustomers(result)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, sort, page])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleSort = (key: string) => {
    setSort(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' }
        if (prev.direction === 'desc') return null
      }
      return { key, direction: 'asc' }
    })
  }

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer)
    setDrawerOpen(true)
  }

  // Calculate summary stats from data
  const activeCount = customers?.data.filter(c => c.status === 'active').length || 0
  const totalOutstanding = customers?.data.reduce((sum, c) => sum + (c.balance || 0), 0) || 0
  const totalCreditLimit = customers?.data.reduce((sum, c) => sum + (c.creditLimit || 0), 0) || 0

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage customer information and credit terms
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-semibold mt-1">{customers?.total || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Active Customers</p>
                <p className="text-2xl font-semibold mt-1 text-emerald-600">
                  {activeCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Outstanding</p>
                <p className="text-2xl font-semibold mt-1 text-amber-600">
                  {formatCurrency(totalOutstanding)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Credit Limit</p>
                <p className="text-2xl font-semibold mt-1">
                  {formatCurrency(totalCreditLimit)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="hold">On Hold</SelectItem>
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
                        label="Customer Name" 
                        sortKey="name" 
                        currentSort={sort}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead className="text-right">Credit Limit</TableHead>
                    <TableHead className="text-right">
                      <SortableHeader 
                        label="AR Balance" 
                        sortKey="balance" 
                        currentSort={sort}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="text-right">Lifetime Revenue</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : customers?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Users className="h-8 w-8 mb-2" />
                          <p>No customers found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers?.data.map((customer) => (
                      <TableRow 
                        key={customer.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(customer)}
                      >
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {customer.customerId || customer.code}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {(customer.contactEmail || customer.email) && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {customer.contactEmail || customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{customer.paymentTerms}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatCurrency(customer.creditLimit)}
                        </TableCell>
                        <TableCell className={`text-right font-medium tabular-nums ${customer.balance > customer.creditLimit ? 'text-red-600' : customer.balance > 0 ? 'text-amber-600' : ''}`}>
                          {formatCurrency(customer.balance)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {customer.lifetimeRevenue ? formatCurrency(customer.lifetimeRevenue) : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {customer.lastPaymentDate ? (
                            <div>
                              <div>{format(new Date(customer.lastPaymentDate), 'MMM d, yyyy')}</div>
                              {customer.lastPaymentAmount && (
                                <div className="text-xs">{formatCurrency(customer.lastPaymentAmount)}</div>
                              )}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={customer.status} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRowClick(customer) }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Customer
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                View Invoices
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {customers && customers.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, customers.total)} of {customers.total} customers
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
                  Page {page} of {customers.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page === customers.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CustomerDrawer
        customer={selectedCustomer}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdate={fetchCustomers}
      />

      <CreateCustomerModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchCustomers}
      />
    </AppShell>
  )
}
