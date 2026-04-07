"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/layout/page-header"
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  UserPlus,
  Clock,
  DollarSign,
  FileText,
  Building2,
  AlertTriangle,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import { 
  getBills, 
  getEntities, 
  approveBill, 
  rejectBill,
  getVendorById
} from "@/lib/services"
import type { Bill, Entity, Vendor } from "@/lib/types"

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface ApprovalItem {
  bill: Bill
  vendor?: Vendor
}

export default function APApprovalsPage() {
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [entities, setEntities] = useState<Entity[]>([])
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [tab, setTab] = useState<string>('pending')
  
  // Action modals
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [reassignModalOpen, setReassignModalOpen] = useState(false)
  const [requestChangesModalOpen, setRequestChangesModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [reassignTo, setReassignTo] = useState('')
  
  // Detail drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<ApprovalItem | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [entitiesData, billsData] = await Promise.all([
        getEntities(),
        getBills({ entityId: entityFilter !== 'all' ? entityFilter : undefined }, undefined, undefined, 1, 100)
      ])
      setEntities(entitiesData)
      
      // Filter bills based on tab
      let filteredBills = billsData.data
      if (tab === 'pending') {
        filteredBills = billsData.data.filter(b => b.approvalStatus === 'pending_approval')
      } else if (tab === 'approved') {
        filteredBills = billsData.data.filter(b => b.approvalStatus === 'approved')
      } else if (tab === 'rejected') {
        filteredBills = billsData.data.filter(b => b.approvalStatus === 'rejected')
      }
      
      // Apply search filter
      if (search) {
        const s = search.toLowerCase()
        filteredBills = filteredBills.filter(b => 
          b.number.toLowerCase().includes(s) ||
          b.vendorName.toLowerCase().includes(s) ||
          b.description?.toLowerCase().includes(s)
        )
      }
      
      // Load vendor details for each bill
      const itemsWithVendors = await Promise.all(
        filteredBills.map(async (bill) => {
          const vendor = await getVendorById(bill.vendorId)
          return { bill, vendor: vendor || undefined }
        })
      )
      
      setItems(itemsWithVendors)
    } catch (error) {
      console.error('Error loading approvals:', error)
    } finally {
      setLoading(false)
    }
  }, [entityFilter, tab, search])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleApprove = async (billId: string) => {
    try {
      await approveBill(billId)
      toast.success('Bill approved successfully')
      loadData()
    } catch {
      toast.error('Failed to approve bill')
    }
  }

  const handleBulkApprove = async () => {
    for (const id of selectedIds) {
      await approveBill(id)
    }
    toast.success(`${selectedIds.length} bills approved`)
    setSelectedIds([])
    loadData()
  }

  const handleReject = async () => {
    if (!selectedItem) return
    try {
      await rejectBill(selectedItem.bill.id, actionReason)
      toast.success('Bill rejected')
      setRejectModalOpen(false)
      setActionReason('')
      setSelectedItem(null)
      loadData()
    } catch {
      toast.error('Failed to reject bill')
    }
  }

  const handleRequestChanges = async () => {
    if (!selectedItem) return
    toast.success('Change request sent to submitter')
    setRequestChangesModalOpen(false)
    setActionReason('')
    setSelectedItem(null)
  }

  const handleReassign = async () => {
    if (!selectedItem || !reassignTo) return
    toast.success(`Bill reassigned to ${reassignTo}`)
    setReassignModalOpen(false)
    setReassignTo('')
    setSelectedItem(null)
  }

  const openRejectModal = (item: ApprovalItem) => {
    setSelectedItem(item)
    setRejectModalOpen(true)
  }

  const openRequestChangesModal = (item: ApprovalItem) => {
    setSelectedItem(item)
    setRequestChangesModalOpen(true)
  }

  const openReassignModal = (item: ApprovalItem) => {
    setSelectedItem(item)
    setReassignModalOpen(true)
  }

  const openDetail = (item: ApprovalItem) => {
    setDetailItem(item)
    setDrawerOpen(true)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(items.map(i => i.bill.id))
    }
  }

  // Summary stats
  const pendingCount = items.filter(i => i.bill.approvalStatus === 'pending_approval').length
  const pendingAmount = items.filter(i => i.bill.approvalStatus === 'pending_approval').reduce((sum, i) => sum + i.bill.amount, 0)
  const overdueCount = items.filter(i => new Date(i.bill.dueDate) < new Date()).length

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="AP Approval Center"
        description="Review and approve pending bills and invoices"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-semibold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-semibold">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue Items</p>
                <p className="text-2xl font-semibold">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved Today</p>
                <p className="text-2xl font-semibold">
                  {items.filter(i => i.bill.approvalStatus === 'approved' && i.bill.approvedAt && new Date(i.bill.approvedAt).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Approval Queue</CardTitle>
              <CardDescription>Bills awaiting your review and approval</CardDescription>
            </div>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
                <Button size="sm" onClick={handleBulkApprove}>
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Approve Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <div className="flex items-center justify-between gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bills..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Building2 className="h-4 w-4 mr-1.5" />
                    <SelectValue placeholder="All Entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    {entities.filter(e => e.type !== 'consolidated').map(entity => (
                      <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value={tab} className="mt-0">
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No items to display</h3>
                  <p className="text-muted-foreground">
                    {tab === 'pending' ? 'All caught up! No pending approvals.' : `No ${tab} items found.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Header row */}
                  <div className="flex items-center gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
                    <Checkbox
                      checked={selectedIds.length === items.length && items.length > 0}
                      onCheckedChange={selectAll}
                    />
                    <div className="w-12" />
                    <div className="flex-1">Bill Details</div>
                    <div className="w-24 text-right">Amount</div>
                    <div className="w-28">Due Date</div>
                    <div className="w-28">Status</div>
                    <div className="w-48">Actions</div>
                  </div>

                  {items.map((item) => {
                    const isOverdue = new Date(item.bill.dueDate) < new Date()
                    const daysUntilDue = Math.ceil((new Date(item.bill.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    
                    return (
                      <div 
                        key={item.bill.id}
                        className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors ${isOverdue ? 'border-red-200 bg-red-50/50' : ''}`}
                      >
                        <Checkbox
                          checked={selectedIds.includes(item.bill.id)}
                          onCheckedChange={() => toggleSelect(item.bill.id)}
                        />
                        
                        <div 
                          className="w-12 h-12 rounded bg-muted flex items-center justify-center cursor-pointer"
                          onClick={() => openDetail(item)}
                        >
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openDetail(item)}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.bill.number}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.bill.vendorName} • {item.bill.description}
                          </p>
                          {item.bill.departmentName && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.bill.departmentName}
                            </p>
                          )}
                        </div>
                        
                        <div className="w-24 text-right font-medium">
                          {formatCurrency(item.bill.amount, item.bill.currency)}
                        </div>
                        
                        <div className="w-28">
                          <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                            {format(new Date(item.bill.dueDate), 'MMM d, yyyy')}
                          </p>
                          {!isOverdue && daysUntilDue <= 7 && (
                            <p className="text-xs text-amber-600">Due in {daysUntilDue}d</p>
                          )}
                          {isOverdue && (
                            <p className="text-xs text-red-600">Overdue</p>
                          )}
                        </div>
                        
                        <div className="w-28">
                          {item.bill.approvalStatus === 'pending_approval' && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Pending
                            </Badge>
                          )}
                          {item.bill.approvalStatus === 'approved' && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              Approved
                            </Badge>
                          )}
                          {item.bill.approvalStatus === 'rejected' && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Rejected
                            </Badge>
                          )}
                        </div>
                        
                        <div className="w-48 flex items-center gap-1">
                          {item.bill.approvalStatus === 'pending_approval' && (
                            <>
                              <Button size="sm" variant="default" onClick={() => handleApprove(item.bill.id)}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openRejectModal(item)}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openRequestChangesModal(item)}>
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openReassignModal(item)}>
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {item.bill.approvalStatus === 'rejected' && (
                            <span className="text-xs text-muted-foreground truncate">
                              {item.bill.rejectionReason}
                            </span>
                          )}
                          {item.bill.approvalStatus === 'approved' && item.bill.approvedBy && (
                            <span className="text-xs text-muted-foreground">
                              by {item.bill.approvedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Bill</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedItem?.bill.number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="Enter reason for rejection..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!actionReason}>
              Reject Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Changes Modal */}
      <Dialog open={requestChangesModalOpen} onOpenChange={setRequestChangesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Send a request for changes to the submitter of {selectedItem?.bill.number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What changes are needed?</Label>
              <Textarea
                placeholder="Describe the changes needed..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestChangesModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRequestChanges} disabled={!actionReason}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Modal */}
      <Dialog open={reassignModalOpen} onOpenChange={setReassignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Approval</DialogTitle>
            <DialogDescription>
              Reassign {selectedItem?.bill.number} to another approver
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reassign To</Label>
              <Select value={reassignTo} onValueChange={setReassignTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select approver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sarah Chen">Sarah Chen (CFO)</SelectItem>
                  <SelectItem value="Michael Johnson">Michael Johnson (Controller)</SelectItem>
                  <SelectItem value="Emily Davis">Emily Davis (AP Manager)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignModalOpen(false)}>Cancel</Button>
            <Button onClick={handleReassign} disabled={!reassignTo}>
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          {detailItem && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {detailItem.bill.number}
                  {detailItem.bill.approvalStatus === 'pending_approval' && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700">Pending</Badge>
                  )}
                  {detailItem.bill.approvalStatus === 'approved' && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700">Approved</Badge>
                  )}
                  {detailItem.bill.approvalStatus === 'rejected' && (
                    <Badge variant="outline" className="bg-red-50 text-red-700">Rejected</Badge>
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Bill Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor</p>
                    <p className="font-medium">{detailItem.bill.vendorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium text-lg">{formatCurrency(detailItem.bill.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bill Date</p>
                    <p className="font-medium">{format(new Date(detailItem.bill.date), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">{format(new Date(detailItem.bill.dueDate), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{detailItem.bill.departmentName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Terms</p>
                    <p className="font-medium">{detailItem.bill.terms || '-'}</p>
                  </div>
                </div>

                {detailItem.bill.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p>{detailItem.bill.description}</p>
                  </div>
                )}

                {/* Line Items */}
                <div>
                  <h4 className="font-medium mb-2">Line Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailItem.bill.lineItems.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>{line.description}</TableCell>
                          <TableCell className="text-muted-foreground">{line.accountName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(line.amount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={2} className="font-medium">Total</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(detailItem.bill.amount)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Approval Timeline */}
                <div>
                  <h4 className="font-medium mb-3">Approval History</h4>
                  <div className="space-y-3">
                    {detailItem.bill.submittedAt && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                        <div>
                          <p className="text-sm font-medium">Submitted for approval</p>
                          <p className="text-xs text-muted-foreground">
                            by {detailItem.bill.submittedBy} on {format(new Date(detailItem.bill.submittedAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    )}
                    {detailItem.bill.approvedAt && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                        <div>
                          <p className="text-sm font-medium">Approved</p>
                          <p className="text-xs text-muted-foreground">
                            by {detailItem.bill.approvedBy} on {format(new Date(detailItem.bill.approvedAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    )}
                    {detailItem.bill.rejectedAt && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                        <div>
                          <p className="text-sm font-medium">Rejected</p>
                          <p className="text-xs text-muted-foreground">
                            by {detailItem.bill.rejectedBy} on {format(new Date(detailItem.bill.rejectedAt), 'MMM d, yyyy h:mm a')}
                          </p>
                          {detailItem.bill.rejectionReason && (
                            <p className="text-sm mt-1 text-red-600">{detailItem.bill.rejectionReason}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {detailItem.bill.approvalStatus === 'pending_approval' && (
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button className="flex-1" onClick={() => { handleApprove(detailItem.bill.id); setDrawerOpen(false); }}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="outline" onClick={() => { openRejectModal(detailItem); setDrawerOpen(false); }}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button variant="ghost" onClick={() => { openRequestChangesModal(detailItem); setDrawerOpen(false); }}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
