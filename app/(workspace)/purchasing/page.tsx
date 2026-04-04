// @ts-nocheck
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { startOfYear } from "date-fns"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/finance/page-header"
import { MetricCard } from "@/components/finance/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  MoreHorizontal, 
  FileText, 
  Send,
  Check,
  Package,
  Clock,
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Eye,
  Pencil,
  XCircle,
  Building2,
  Truck,
  Calendar,
  DollarSign,
  Filter,
  X,
} from "lucide-react"
import { 
  getPurchaseOrders, 
  approvePurchaseOrder, 
  sendPurchaseOrder,
  getEntities,
  getVendors,
  createPurchaseOrder,
  receivePurchaseOrder,
} from "@/lib/services"
import type { PurchaseOrder, Entity, Vendor, DashboardFilters, SortConfig } from "@/lib/types"
import { formatCurrency, formatDate, cn } from "@/lib/utils"

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  sent: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  partially_received: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  received: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  sent: "Sent to Vendor",
  partially_received: "Partially Received",
  received: "Received",
  closed: "Closed",
  cancelled: "Cancelled",
}

const defaultFilters: DashboardFilters = {
  entityId: 'e4',
  dateRange: {
    startDate: startOfYear(new Date()),
    endDate: new Date(),
    preset: 'this_year'
  }
}

export default function PurchasingPage() {
  const router = useRouter()
  
  // Data state
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filter state
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [vendorFilter, setVendorFilter] = useState<string>("")
  const [activeTab, setActiveTab] = useState("all")
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  
  // Sort state
  const [sort, setSort] = useState<SortConfig>({ key: 'orderDate', direction: 'desc' })
  
  // Selection state
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  
  // Modal/Drawer state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  
  // Metrics
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    open: 0,
    totalValue: 0,
  })

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      const [entitiesData, vendorsData] = await Promise.all([
        getEntities(),
        getVendors(),
      ])
      setEntities(entitiesData)
      setVendors(vendorsData.data)
    }
    loadReferenceData()
  }, [])

  // Load purchase orders
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const statusFilterValues = activeTab === "all" ? 
        (statusFilter.length > 0 ? statusFilter : undefined) : 
        [activeTab]
      
      const result = await getPurchaseOrders(
        statusFilterValues, 
        vendorFilter || undefined, 
        search || undefined,
        sort,
        page,
        pageSize
      )
      
      setPurchaseOrders(result.data)
      setTotalCount(result.total)
      setTotalPages(result.totalPages)
      
      // Calculate metrics from full dataset (separate call without pagination)
      const allOrders = await getPurchaseOrders(undefined, undefined, undefined, undefined, 1, 1000)
      setMetrics({
        total: allOrders.total,
        pending: allOrders.data.filter(po => po.status === 'pending_approval').length,
        open: allOrders.data.filter(po => ['approved', 'sent', 'partially_received'].includes(po.status)).length,
        totalValue: allOrders.data.reduce((sum, po) => sum + po.total, 0),
      })
    } catch (error) {
      console.error('Failed to load purchase orders:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, statusFilter, vendorFilter, search, sort, page, pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [activeTab, statusFilter, vendorFilter, search])

  const handleApprove = async (id: string) => {
    await approvePurchaseOrder(id)
    loadData()
  }

  const handleSend = async (id: string) => {
    await sendPurchaseOrder(id)
    loadData()
  }

  const handleReceive = async (id: string) => {
    await receivePurchaseOrder(id) // Marks all lines as received
    loadData()
  }

  const handleBulkApprove = async () => {
    await Promise.all(selectedOrders.map(id => approvePurchaseOrder(id)))
    setSelectedOrders([])
    loadData()
  }

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(purchaseOrders.map(po => po.id))
    } else {
      setSelectedOrders([])
    }
  }

  const handleSelectOrder = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, id])
    } else {
      setSelectedOrders(prev => prev.filter(i => i !== id))
    }
  }

  const openDetailDrawer = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setDetailDrawerOpen(true)
  }

  const handleExport = () => {
    // Mock export
    console.log('Exporting purchase orders...')
    alert('Export started. File will be downloaded shortly.')
  }

  const clearFilters = () => {
    setStatusFilter([])
    setVendorFilter("")
    setSearch("")
    setActiveTab("all")
  }

  const hasActiveFilters = statusFilter.length > 0 || vendorFilter || search

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Purchasing"
          description="Manage purchase orders and vendor procurement"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Purchase Order
              </Button>
            </div>
          }
        />

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total POs"
            value={metrics.total}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <MetricCard
            title="Pending Approval"
            value={metrics.pending}
            icon={<Clock className="h-4 w-4" />}
            trend={metrics.pending > 0 ? "attention" : undefined}
          />
          <MetricCard
            title="Open Orders"
            value={metrics.open}
            icon={<Package className="h-4 w-4" />}
          />
          <MetricCard
            title="Total Value"
            value={formatCurrency(metrics.totalValue)}
            icon={<DollarSign className="h-4 w-4" />}
          />
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Purchase Orders</CardTitle>
              <div className="flex items-center gap-3">
                {/* Entity Filter */}
                <Select 
                  value={filters.entityId} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, entityId: value }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map(entity => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Vendor Filter */}
                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Truck className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Vendors</SelectItem>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Search */}
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Status Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="pending_approval">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="partially_received">Partial</TabsTrigger>
                <TabsTrigger value="received">Received</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Bulk Actions */}
            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">{selectedOrders.length} selected</span>
                <Button size="sm" variant="outline" onClick={handleBulkApprove}>
                  <Check className="h-4 w-4 mr-1" />
                  Approve Selected
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedOrders([])}>
                  Clear Selection
                </Button>
              </div>
            )}

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedOrders.length === purchaseOrders.length && purchaseOrders.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleSort('number')} className="-ml-3">
                        PO Number
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleSort('vendorName')} className="-ml-3">
                        Vendor
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleSort('orderDate')} className="-ml-3">
                        Order Date
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </Button>
                    </TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('total')} className="-mr-3">
                        Total
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : purchaseOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground font-medium">No purchase orders found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first purchase order to get started'}
                        </p>
                        {!hasActiveFilters && (
                          <Button className="mt-4" onClick={() => setCreateModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Purchase Order
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseOrders.map((po) => (
                      <TableRow 
                        key={po.id} 
                        className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          selectedOrders.includes(po.id) && "bg-muted/30"
                        )}
                        onClick={() => openDetailDrawer(po)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedOrders.includes(po.id)}
                            onCheckedChange={(checked) => handleSelectOrder(po.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {po.number}
                        </TableCell>
                        <TableCell>{po.vendorName}</TableCell>
                        <TableCell>{formatDate(po.orderDate)}</TableCell>
                        <TableCell>{po.expectedDate ? formatDate(po.expectedDate) : '-'}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[po.status]} variant="secondary">
                            {statusLabels[po.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(po.total)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openDetailDrawer(po)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/purchasing/orders/${po.id}/edit`}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(po.status === 'draft' || po.status === 'pending_approval') && (
                                <DropdownMenuItem onClick={() => handleApprove(po.id)}>
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {po.status === 'approved' && (
                                <DropdownMenuItem onClick={() => handleSend(po.id)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send to Vendor
                                </DropdownMenuItem>
                              )}
                              {po.status === 'sent' && (
                                <DropdownMenuItem onClick={() => handleReceive(po.id)}>
                                  <Package className="h-4 w-4 mr-2" />
                                  Mark Received
                                </DropdownMenuItem>
                              )}
                              {po.status === 'draft' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel Order
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!loading && purchaseOrders.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} orders
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create PO Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order for vendor procurement
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity">Entity *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date *</Label>
                <Input type="date" id="orderDate" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDate">Expected Delivery</Label>
                <Input type="date" id="expectedDate" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Order description or notes..." />
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Line Items</h4>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center py-6">
                No items added yet. Click &quot;Add Item&quot; to add products or services.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline">
              Save as Draft
            </Button>
            <Button onClick={() => {
              setCreateModalOpen(false)
              loadData()
            }}>
              Create & Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PO Detail Drawer */}
      <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
        <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle>{selectedOrder.number}</SheetTitle>
                  <Badge className={statusColors[selectedOrder.status]} variant="secondary">
                    {statusLabels[selectedOrder.status]}
                  </Badge>
                </div>
                <SheetDescription>
                  Purchase order for {selectedOrder.vendorName}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor</p>
                    <p className="font-medium">{selectedOrder.vendorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-medium">{formatDate(selectedOrder.orderDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Delivery</p>
                    <p className="font-medium">
                      {selectedOrder.expectedDate ? formatDate(selectedOrder.expectedDate) : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entity</p>
                    <p className="font-medium">
                      {entities.find(e => e.id === selectedOrder.entityId)?.name || '-'}
                    </p>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h4 className="font-medium mb-3">Line Items</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.lineItems?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                          </TableRow>
                        )) || (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              No line items
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Totals */}
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal || selectedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(selectedOrder.tax || 0)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  {(selectedOrder.status === 'draft' || selectedOrder.status === 'pending_approval') && (
                    <Button onClick={() => {
                      handleApprove(selectedOrder.id)
                      setDetailDrawerOpen(false)
                    }}>
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  )}
                  {selectedOrder.status === 'approved' && (
                    <Button onClick={() => {
                      handleSend(selectedOrder.id)
                      setDetailDrawerOpen(false)
                    }}>
                      <Send className="h-4 w-4 mr-2" />
                      Send to Vendor
                    </Button>
                  )}
                  {selectedOrder.status === 'sent' && (
                    <Button onClick={() => {
                      handleReceive(selectedOrder.id)
                      setDetailDrawerOpen(false)
                    }}>
                      <Package className="h-4 w-4 mr-2" />
                      Mark Received
                    </Button>
                  )}
                  <Button variant="outline" asChild>
                    <Link href={`/purchasing/orders/${selectedOrder.id}/edit`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}
