// @ts-nocheck
"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  UserCircle,
  DollarSign,
  Calendar,
  Send,
  FileText,
  Flag,
  CheckCircle,
  XCircle,
  ArrowUpDown,
} from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { getInvoices, getCustomers } from "@/lib/services"
import type { Invoice, Customer, SortConfig } from "@/lib/types"

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

interface CollectionItem {
  invoice: Invoice
  customer: Customer | undefined
  daysOverdue: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  nextAction: string
}

export default function CollectionsPage() {
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [collectorFilter, setCollectorFilter] = useState<string>("all")
  const [sort, setSort] = useState<SortConfig>({ key: 'daysOverdue', direction: 'desc' })
  
  // Action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null)
  const [actionType, setActionType] = useState<string>("")
  const [actionNote, setActionNote] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [invoicesRes, customersRes] = await Promise.all([
        getInvoices(),
        getCustomers(),
      ])
      
      setCustomers(customersRes.data)
      
      // Filter to overdue invoices and build collection items
      const overdueInvoices = invoicesRes.data.filter(
        inv => (inv.status === 'overdue' || inv.status === 'sent') && 
               inv.openBalance > 0 &&
               new Date(inv.dueDate) < new Date()
      )
      
      const items: CollectionItem[] = overdueInvoices.map(inv => {
        const customer = customersRes.data.find(c => c.id === inv.customerId)
        const daysOverdue = differenceInDays(new Date(), new Date(inv.dueDate))
        
        let priority: 'low' | 'medium' | 'high' | 'critical' = 'low'
        if (daysOverdue > 90 || inv.collectionStatus === 'escalated') priority = 'critical'
        else if (daysOverdue > 60 || inv.collectionStatus === 'in_collections') priority = 'high'
        else if (daysOverdue > 30) priority = 'medium'
        
        let nextAction = 'Send reminder'
        if (inv.collectionStatus === 'reminder_sent') nextAction = 'Follow up call'
        else if (inv.collectionStatus === 'in_collections') nextAction = 'Escalate to manager'
        else if (inv.collectionStatus === 'escalated') nextAction = 'Legal review'
        
        return { invoice: inv, customer, daysOverdue, priority, nextAction }
      })
      
      setCollectionItems(items)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleAction = (item: CollectionItem, action: string) => {
    setSelectedItem(item)
    setActionType(action)
    setActionNote("")
    setActionModalOpen(true)
  }

  const submitAction = async () => {
    // Mock save action
    await new Promise(resolve => setTimeout(resolve, 500))
    setActionModalOpen(false)
    fetchData()
  }

  // Filter and sort items
  const filteredItems = collectionItems
    .filter(item => {
      if (search && !item.invoice.customerName.toLowerCase().includes(search.toLowerCase()) &&
          !item.invoice.number.toLowerCase().includes(search.toLowerCase())) return false
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false
      if (statusFilter !== 'all' && item.invoice.collectionStatus !== statusFilter) return false
      if (collectorFilter !== 'all' && item.customer?.assignedCollector !== collectorFilter) return false
      return true
    })
    .sort((a, b) => {
      const direction = sort.direction === 'asc' ? 1 : -1
      if (sort.key === 'daysOverdue') return (a.daysOverdue - b.daysOverdue) * direction
      if (sort.key === 'amount') return (a.invoice.openBalance - b.invoice.openBalance) * direction
      if (sort.key === 'customer') return a.invoice.customerName.localeCompare(b.invoice.customerName) * direction
      return 0
    })

  // Summary stats
  const totalOverdue = collectionItems.reduce((sum, item) => sum + item.invoice.openBalance, 0)
  const criticalCount = collectionItems.filter(item => item.priority === 'critical').length
  const highCount = collectionItems.filter(item => item.priority === 'high').length

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700 border-gray-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200',
  }

  const collectionStatusLabels: Record<string, string> = {
    none: 'New',
    reminder_sent: 'Reminder Sent',
    in_collections: 'In Collections',
    escalated: 'Escalated',
    written_off: 'Written Off',
  }

  const collectors = [...new Set(customers.filter(c => c.assignedCollector).map(c => c.assignedCollector!))]

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Collections</h1>
            <p className="text-sm text-muted-foreground">Manage overdue invoices and collection activities</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Overdue</p>
                  <p className="text-2xl font-semibold">{formatCurrency(totalOverdue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Critical Priority</p>
                  <p className="text-2xl font-semibold">{criticalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-semibold">{highCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-semibold">{collectionItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customer or invoice..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Collection Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="none">New</SelectItem>
                  <SelectItem value="reminder_sent">Reminder Sent</SelectItem>
                  <SelectItem value="in_collections">In Collections</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
              {collectors.length > 0 && (
                <Select value={collectorFilter} onValueChange={setCollectorFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Collector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Collectors</SelectItem>
                    {collectors.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Collection Queue Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('priority')}>
                      Priority
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('customer')}>
                      Customer
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px]">Invoice</TableHead>
                  <TableHead className="w-[100px]">
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort('daysOverdue')}>
                      Days Overdue
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right w-[120px]">
                    <Button variant="ghost" size="sm" className="-mr-3 h-8" onClick={() => handleSort('amount')}>
                      Amount
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[130px]">Collector</TableHead>
                  <TableHead className="w-[150px]">Next Action</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 text-emerald-500" />
                        <p>No overdue invoices</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.invoice.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Badge variant="outline" className={priorityColors[item.priority]}>
                          {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.invoice.customerName}</p>
                          {item.customer?.email && (
                            <p className="text-xs text-muted-foreground">{item.customer.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.invoice.number}</TableCell>
                      <TableCell>
                        <span className={item.daysOverdue > 60 ? 'text-red-600 font-medium' : ''}>
                          {item.daysOverdue} days
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(item.invoice.openBalance)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {collectionStatusLabels[item.invoice.collectionStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.customer?.assignedCollector ? (
                          <div className="flex items-center gap-1.5">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{item.customer.assignedCollector}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-blue-600">{item.nextAction}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAction(item, 'call')}>
                              <Phone className="h-4 w-4 mr-2" />
                              Log Call
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(item, 'email')}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(item, 'reminder')}>
                              <Send className="h-4 w-4 mr-2" />
                              Send Reminder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAction(item, 'note')}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Add Note
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(item, 'escalate')}>
                              <Flag className="h-4 w-4 mr-2" />
                              Escalate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAction(item, 'payment')}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Record Payment
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
      </div>

      {/* Action Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'call' && 'Log Phone Call'}
              {actionType === 'email' && 'Send Collection Email'}
              {actionType === 'reminder' && 'Send Payment Reminder'}
              {actionType === 'note' && 'Add Collection Note'}
              {actionType === 'escalate' && 'Escalate to Manager'}
              {actionType === 'payment' && 'Record Payment'}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedItem.invoice.customerName}</p>
                    <p className="text-sm text-muted-foreground">{selectedItem.invoice.number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium">{formatCurrency(selectedItem.invoice.openBalance)}</p>
                    <p className="text-sm text-red-600">{selectedItem.daysOverdue} days overdue</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Enter notes about this action..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModalOpen(false)}>Cancel</Button>
            <Button onClick={submitAction}>
              {actionType === 'call' && 'Log Call'}
              {actionType === 'email' && 'Send Email'}
              {actionType === 'reminder' && 'Send Reminder'}
              {actionType === 'note' && 'Save Note'}
              {actionType === 'escalate' && 'Escalate'}
              {actionType === 'payment' && 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
