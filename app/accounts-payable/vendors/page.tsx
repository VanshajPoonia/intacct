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
  Building2,
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
import { getVendors } from "@/lib/services"
import { VendorDrawer } from "@/components/accounts-payable/vendor-drawer"
import type { Vendor, SortConfig, PaginatedResponse } from "@/lib/types"

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

export default function VendorsPage() {
  const [vendors, setVendors] = useState<PaginatedResponse<Vendor> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sort, setSort] = useState<SortConfig | null>(null)
  const [page, setPage] = useState(1)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pageSize = 10

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getVendors(
        search || undefined,
        statusFilter !== 'all' ? [statusFilter] : undefined,
        sort || undefined,
        page,
        pageSize
      )
      setVendors(result)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, sort, page])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const handleSort = (key: string) => {
    setSort(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' }
        if (prev.direction === 'desc') return null
      }
      return { key, direction: 'asc' }
    })
  }

  const handleRowClick = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setDrawerOpen(true)
  }

  // Calculate summary stats from data
  const activeCount = vendors?.data.filter(v => v.status === 'active').length || 0
  const totalOutstanding = vendors?.data.reduce((sum, v) => sum + (v.openBalance || v.balance || 0), 0) || 0
  const ytdPayments = vendors?.data.reduce((sum, v) => sum + (v.ytdPurchases || 0), 0) || 0

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Vendors</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage vendor information and payment terms
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Vendors</p>
                <p className="text-2xl font-semibold mt-1">{vendors?.total || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Active Vendors</p>
                <p className="text-2xl font-semibold mt-1 text-emerald-600">
                  {activeCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Outstanding</p>
                <p className="text-2xl font-semibold mt-1">
                  {formatCurrency(totalOutstanding)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">YTD Payments</p>
                <p className="text-2xl font-semibold mt-1">
                  {formatCurrency(ytdPayments)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
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
                        label="Vendor Name" 
                        sortKey="name" 
                        currentSort={sort}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>Vendor ID</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead className="text-right">
                      <SortableHeader 
                        label="Balance" 
                        sortKey="balance" 
                        currentSort={sort}
                        onSort={handleSort}
                      />
                    </TableHead>
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
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : vendors?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Building2 className="h-8 w-8 mb-2" />
                          <p>No vendors found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendors?.data.map((vendor) => (
                      <TableRow 
                        key={vendor.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(vendor)}
                      >
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {vendor.vendorId || vendor.code}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {(vendor.contactEmail || vendor.email) && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {vendor.contactEmail || vendor.email}
                              </div>
                            )}
                            {vendor.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {vendor.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{vendor.paymentTerms}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(vendor.openBalance || vendor.balance || 0)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={vendor.status} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRowClick(vendor) }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Vendor
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                View Bills
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
          {vendors && vendors.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, vendors.total)} of {vendors.total} vendors
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
                  Page {page} of {vendors.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page === vendors.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <VendorDrawer
        vendor={selectedVendor}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdate={fetchVendors}
      />
    </AppShell>
  )
}
