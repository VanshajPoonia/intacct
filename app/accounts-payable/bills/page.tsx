"use client"

import { useState, useEffect, useCallback } from "react"
import { startOfYear, format } from "date-fns"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/finance/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileText,
  Eye,
  Pencil,
  CheckCircle,
  DollarSign,
  XCircle,
  Clock,
  AlertCircle,
  Send,
} from "lucide-react"
import type { 
  Bill, 
  DashboardFilters, 
  PaginatedResponse,
  SortConfig,
  Entity,
  Vendor,
} from "@/lib/types"
import { 
  getBills, 
  getEntities,
  getVendors,
  approveBill,
  rejectBill,
  submitBillForApproval,
  voidBill,
} from "@/lib/services"
import { BillDrawer } from "@/components/accounts-payable/bill-drawer"
import { CreateBillModal } from "@/components/accounts-payable/create-bill-modal"

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  voided: "bg-red-100 text-red-800",
}

const defaultFilters: DashboardFilters = {
  entityId: 'e4',
  dateRange: {
    startDate: startOfYear(new Date()),
    endDate: new Date(),
    preset: 'this_year'
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export default function BillsPage() {
  // Filter state
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters)
  const [entities, setEntities] = useState<Entity[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortConfig | undefined>(undefined)
  const [page, setPage] = useState(1)
  const pageSize = 10
  
  // Data state
  const [data, setData] = useState<PaginatedResponse<Bill> | null>(null)
  const [loading, setLoading] = useState(true)
  
  // UI state
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Bulk selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (!data) return
    if (selectedIds.length === data.data.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(data.data.map(b => b.id))
    }
  }

  const handleBulkApprove = async () => {
    for (const id of selectedIds) {
      await approveBill(id)
    }
    toast.success(`${selectedIds.length} bills approved`)
    setSelectedIds([])
    fetchData()
  }

  const handleBulkSubmit = async () => {
    for (const id of selectedIds) {
      await submitBillForApproval(id)
    }
    toast.success(`${selectedIds.length} bills submitted for approval`)
    setSelectedIds([])
    fetchData()
  }

  // Load entities and vendors on mount
  useEffect(() => {
    Promise.all([getEntities(), getVendors()]).then(([e, v]) => {
      setEntities(e)
      setVendors(v)
    })
  }, [])

  // Fetch bills
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getBills(
        filters,
        search || undefined,
        statusFilter.length > 0 ? statusFilter : undefined,
        sort,
        page,
        pageSize
      )
      setData(result)
    } catch (error) {
      console.error('Error fetching bills:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, search, statusFilter, sort, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle entity change
  const handleEntityChange = (entityId: string) => {
    setFilters(prev => ({ ...prev, entityId }))
    setPage(1)
  }

  // Handle vendor change
  const handleVendorChange = (vendorId: string) => {
    setFilters(prev => ({ ...prev, vendorId: vendorId === 'all' ? undefined : vendorId }))
    setPage(1)
  }

  // Handle status filter change
  const handleStatusChange = (status: string) => {
    if (status === 'all') {
      setStatusFilter([])
    } else {
      setStatusFilter([status])
    }
    setPage(1)
  }

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  // Handle sort
  const handleSort = (key: string) => {
    setSort(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' 
          ? { key, direction: 'desc' } 
          : undefined
      }
      return { key, direction: 'asc' }
    })
  }

  // Handle row click
  const handleRowClick = (bill: Bill) => {
    setSelectedBillId(bill.id)
    setDrawerOpen(true)
  }

  // Handle approve
  const handleApprove = async (id: string) => {
    await approveBill(id)
    fetchData()
  }

  // Handle pay
  const handlePay = async (id: string) => {
    // Navigate to payment creation with this bill pre-selected
    console.log('Creating payment for bill:', id)
    fetchData()
  }

  // Handle void
  const handleVoid = async (id: string) => {
    await voidBill(id)
    fetchData()
  }

  // Calculate summary metrics
  const summaryMetrics = data?.data.reduce((acc, bill) => {
    acc.total += bill.amount
    if (bill.status === 'pending') acc.pending += bill.amount
    if (bill.status === 'approved') acc.approved += bill.amount
    if (new Date(bill.dueDate) < new Date() && bill.status !== 'paid') acc.overdue += bill.amount
    return acc
  }, { total: 0, pending: 0, approved: 0, overdue: 0 }) || { total: 0, pending: 0, approved: 0, overdue: 0 }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Bills"
          description="Manage vendor bills and payments"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
              <Button size="sm" onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                New Bill
              </Button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Approval</p>
                  <p className="text-xl font-semibold text-yellow-600">
                    {formatCurrency(summaryMetrics.pending)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Approved to Pay</p>
                  <p className="text-xl font-semibold text-blue-600">
                    {formatCurrency(summaryMetrics.approved)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-blue-100">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className="text-xl font-semibold text-red-600">
                    {formatCurrency(summaryMetrics.overdue)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-red-100">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Outstanding</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(summaryMetrics.total)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-muted">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={filters.entityId} onValueChange={handleEntityChange}>
                <SelectTrigger className="w-[200px] h-9">
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="e4">All Entities (Consolidated)</SelectItem>
                  {entities.map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.vendorId || 'all'} onValueChange={handleVendorChange}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={statusFilter.length === 0 ? 'all' : statusFilter[0]} 
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="voided">Voided</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bills..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Button variant="outline" size="sm" className="ml-auto">
                <Filter className="h-4 w-4 mr-1.5" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{selectedIds.length} bill(s) selected</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleBulkSubmit}>
                    <Send className="h-4 w-4 mr-1.5" />
                    Submit for Approval
                  </Button>
                  <Button size="sm" onClick={handleBulkApprove}>
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Approve Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={data && selectedIds.length === data.data.length && data.data.length > 0}
                      onCheckedChange={selectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[110px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort('number')}
                    >
                      Bill #
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="w-[100px]">Dept</TableHead>
                  <TableHead className="w-[90px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort('date')}
                    >
                      Date
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[90px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort('dueDate')}
                    >
                      Due
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right w-[100px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-mr-3 h-8"
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[85px]">Status</TableHead>
                  <TableHead className="w-[85px]">Approval</TableHead>
                  <TableHead className="w-[70px]">Payment</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileText className="h-8 w-8" />
                        <p>No bills found</p>
                        <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(true)}>
                          Create Bill
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data.map((bill) => {
                    const isOverdue = new Date(bill.dueDate) < new Date() && bill.status !== 'paid'
                    return (
                      <TableRow 
                        key={bill.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(bill)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(bill.id)}
                            onCheckedChange={() => toggleSelect(bill.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{bill.number}</TableCell>
                        <TableCell>{bill.vendorName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {bill.departmentName || '-'}
                        </TableCell>
                        <TableCell className="text-sm">{format(new Date(bill.date), 'MMM d')}</TableCell>
                        <TableCell>
                          <span className={isOverdue ? 'text-red-600 font-medium text-sm' : 'text-sm'}>
                            {format(new Date(bill.dueDate), 'MMM d')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(bill.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${statusColors[bill.status]} text-xs`}>
                            {bill.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {bill.approvalStatus === 'not_submitted' && (
                            <Badge variant="outline" className="text-xs bg-muted">Draft</Badge>
                          )}
                          {bill.approvalStatus === 'pending_approval' && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                          )}
                          {bill.approvalStatus === 'approved' && (
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge>
                          )}
                          {bill.approvalStatus === 'rejected' && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">Rejected</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {bill.paymentStatus === 'unpaid' && (
                            <Badge variant="outline" className="text-xs">Unpaid</Badge>
                          )}
                          {bill.paymentStatus === 'partial' && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Partial</Badge>
                          )}
                          {bill.paymentStatus === 'paid' && (
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Paid</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                handleRowClick(bill)
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {(bill.status === 'draft' || bill.status === 'pending') && (
                                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {bill.status === 'pending' && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleApprove(bill.id)
                                  }}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {bill.status === 'approved' && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePay(bill.id)
                                  }}
                                  className="text-blue-600"
                                >
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Pay
                                </DropdownMenuItem>
                              )}
                              {(bill.status === 'draft' || bill.status === 'pending') && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleVoid(bill.id)
                                  }}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Void
                                </DropdownMenuItem>
                              )}
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
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.total)} of {data.total} bills
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page === data.totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bill Drawer */}
      <BillDrawer
        billId={selectedBillId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApprove={handleApprove}
        onPay={handlePay}
        onVoid={handleVoid}
      />

      {/* Create Bill Modal */}
      <CreateBillModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchData}
      />
    </AppShell>
  )
}
