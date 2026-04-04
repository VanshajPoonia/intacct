"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
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
  Check, 
  X, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  MoreHorizontal, 
  Eye,
  Search,
  Filter,
  Receipt,
  ScrollText,
  CreditCard,
  AlertTriangle,
  Building2,
} from "lucide-react"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getApprovalItems, approveItem, rejectItem, getUsers } from "@/lib/services"
import type { ApprovalItem, DashboardFilters, PaginatedResponse, User } from "@/lib/types"
import { ApprovalDetailDrawer } from "@/components/workflow/approval-detail-drawer"

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    pending: { className: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Pending' },
    approved: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Approved' },
    rejected: { className: 'bg-red-100 text-red-700 border-red-200', label: 'Rejected' },
  }
  
  const variant = variants[status] || { className: 'bg-gray-100 text-gray-700', label: status }
  
  return (
    <Badge variant="outline" className={`text-xs font-medium ${variant.className}`}>
      {variant.label}
    </Badge>
  )
}

function TypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    bill: <Receipt className="h-4 w-4" />,
    invoice: <ScrollText className="h-4 w-4" />,
    expense: <CreditCard className="h-4 w-4" />,
    journal_entry: <FileText className="h-4 w-4" />,
    purchase_order: <FileText className="h-4 w-4" />,
  }
  return icons[type] || <FileText className="h-4 w-4" />
}

const documentTabs = [
  { value: "all", label: "All", icon: FileText },
  { value: "bill", label: "Bills", icon: Receipt },
  { value: "expense", label: "Expenses", icon: CreditCard },
  { value: "journal_entry", label: "Journals", icon: ScrollText },
  { value: "invoice", label: "Invoices", icon: ScrollText },
  { value: "exception", label: "Exceptions", icon: AlertTriangle },
]

export default function ApprovalsPage() {
  const [allItems, setAllItems] = useState<PaginatedResponse<ApprovalItem> | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState<string>("pending")
  const [documentTab, setDocumentTab] = useState<string>("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const defaultFilters: DashboardFilters = {
    entityId: 'e4',
    dateRange: {
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(),
      preset: 'this_year'
    }
  }

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getApprovalItems(
        defaultFilters,
        undefined,
        1,
        100
      )
      setAllItems(result)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    const result = await getUsers(undefined, undefined, ["active"])
    setUsers(result.data)
  }, [])

  useEffect(() => {
    fetchItems()
    fetchUsers()
  }, [fetchItems, fetchUsers])

  const handleApprove = async (id: string, comment?: string) => {
    setActionLoading(id)
    await approveItem(id)
    await fetchItems()
    setActionLoading(null)
  }

  const handleReject = async (id: string, comment?: string) => {
    setActionLoading(id)
    await rejectItem(id)
    await fetchItems()
    setActionLoading(null)
  }

  const handleReassign = async (id: string, userId: string) => {
    console.log(`Reassigning ${id} to ${userId}`)
    // In a real app, this would call an API
  }

  const handleViewDetail = (item: ApprovalItem) => {
    setSelectedApproval(item)
    setDrawerOpen(true)
  }

  // Filter by status
  const getStatusFilteredItems = () => {
    if (!allItems?.data) return []
    switch (statusTab) {
      case 'pending': return allItems.data.filter(item => item.status === 'pending')
      case 'approved': return allItems.data.filter(item => item.status === 'approved')
      case 'rejected': return allItems.data.filter(item => item.status === 'rejected')
      default: return allItems.data
    }
  }

  // Filter by document type
  const getDocumentFilteredItems = () => {
    const statusFiltered = getStatusFilteredItems()
    if (documentTab === 'all') return statusFiltered
    if (documentTab === 'exception') {
      // Mock exception filter - items over a certain amount
      return statusFiltered.filter(item => item.amount > 5000)
    }
    return statusFiltered.filter(item => item.type === documentTab)
  }

  // Filter by search
  const filteredItems = getDocumentFilteredItems().filter(item => {
    if (!search) return true
    const s = search.toLowerCase()
    return item.documentNumber.toLowerCase().includes(s) ||
           item.description.toLowerCase().includes(s) ||
           item.requestedBy.toLowerCase().includes(s)
  })

  // Counts
  const pendingItems = allItems?.data.filter(item => item.status === 'pending') || []
  const approvedItems = allItems?.data.filter(item => item.status === 'approved') || []
  const rejectedItems = allItems?.data.filter(item => item.status === 'rejected') || []
  
  // Document type counts (pending only)
  const billCount = pendingItems.filter(item => item.type === 'bill').length
  const expenseCount = pendingItems.filter(item => item.type === 'expense').length
  const journalCount = pendingItems.filter(item => item.type === 'journal_entry').length
  const invoiceCount = pendingItems.filter(item => item.type === 'invoice').length
  const exceptionCount = pendingItems.filter(item => item.amount > 5000).length

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'bill': return billCount
      case 'expense': return expenseCount
      case 'journal_entry': return journalCount
      case 'invoice': return invoiceCount
      case 'exception': return exceptionCount
      case 'all': return pendingItems.length
      default: return 0
    }
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Approvals Center</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review and approve pending items across all modules
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className={statusTab === 'pending' ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-4 cursor-pointer" onClick={() => setStatusTab('pending')}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{pendingItems.length}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={statusTab === 'approved' ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-4 cursor-pointer" onClick={() => setStatusTab('approved')}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{approvedItems.length}</p>
                    <p className="text-sm text-muted-foreground">Approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={statusTab === 'rejected' ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-4 cursor-pointer" onClick={() => setStatusTab('rejected')}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{rejectedItems.length}</p>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">
                      {formatCurrency(pendingItems.reduce((sum, item) => sum + item.amount, 0))}
                    </p>
                    <p className="text-sm text-muted-foreground">Pending Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document Type Tabs */}
          <Card className="sticky top-0 z-10">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <Tabs value={documentTab} onValueChange={setDocumentTab}>
                  <TabsList className="h-auto p-1">
                    {documentTabs.map((tab) => {
                      const Icon = tab.icon
                      const count = statusTab === 'pending' ? getTabCount(tab.value) : 0
                      return (
                        <TabsTrigger 
                          key={tab.value} 
                          value={tab.value}
                          className="gap-1.5 px-3"
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                          {count > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                              {count}
                            </Badge>
                          )}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                </Tabs>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Search approvals..." 
                      className="pl-9 w-[250px]"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approvals Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <FileText className="h-8 w-8 mb-2" />
                          <p>No items found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow 
                        key={item.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewDetail(item)}
                      >
                        <TableCell>
                          <div className="p-1.5 rounded bg-muted w-fit">
                            <TypeIcon type={item.type} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-primary">{item.documentNumber}</span>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <span className="text-sm truncate block">{item.description}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{item.requestedBy}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(item.requestedAt, 'MMM d, yyyy')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium tabular-nums">{formatCurrency(item.amount)}</span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {item.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleApprove(item.id)}
                                disabled={actionLoading === item.id}
                              >
                                <Check className="h-4 w-4" />
                                <span className="sr-only">Approve</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleReject(item.id)}
                                disabled={actionLoading === item.id}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Reject</span>
                              </Button>
                            </div>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetail(item)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approval Detail Drawer */}
      <ApprovalDetailDrawer
        approval={selectedApproval}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onApprove={handleApprove}
        onReject={handleReject}
        onReassign={handleReassign}
        users={users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email }))}
      />
    </AppShell>
  )
}
