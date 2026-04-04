"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/finance/page-header"
import { Card, CardContent } from "@/components/ui/card"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search, 
  Download, 
  Filter,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  History,
  User,
  FileText,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import type { PaginatedResponse } from "@/lib/types"
import { getAuditLogs } from "@/lib/services"
import { cn } from "@/lib/utils"

interface AuditLogEntry {
  id: string
  timestamp: Date
  action: 'create' | 'update' | 'delete' | 'post' | 'reverse' | 'approve' | 'reject'
  entityType: string
  entityId: string
  entityNumber: string
  userId: string
  userName: string
  changes?: { field: string; oldValue: string; newValue: string }[]
  ipAddress: string
}

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  post: "bg-purple-100 text-purple-800",
  reverse: "bg-orange-100 text-orange-800",
  approve: "bg-emerald-100 text-emerald-800",
  reject: "bg-rose-100 text-rose-800",
}

const entityTypeLabels: Record<string, string> = {
  journal_entry: "Journal Entry",
  bill: "Bill",
  invoice: "Invoice",
  payment: "Payment",
  account: "Account",
  vendor: "Vendor",
  customer: "Customer",
}

const entityTypeLinks: Record<string, string> = {
  journal_entry: "/general-ledger/journal-entries",
  bill: "/accounts-payable/bills",
  invoice: "/accounts-receivable/invoices",
  account: "/general-ledger/chart-of-accounts",
}

export default function AuditTrailPage() {
  const [entityType, setEntityType] = useState<string>('all')
  const [action, setAction] = useState<string>('all')
  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [page, setPage] = useState(1)
  const pageSize = 15
  
  const [data, setData] = useState<PaginatedResponse<AuditLogEntry> | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getAuditLogs(
        entityType === 'all' ? undefined : entityType,
        undefined,
        startDate,
        endDate,
        page,
        pageSize
      )
      
      // Client-side search filter
      if (search) {
        result.data = result.data.filter(log => 
          log.entityNumber.toLowerCase().includes(search.toLowerCase()) ||
          log.userName.toLowerCase().includes(search.toLowerCase())
        )
        result.total = result.data.length
      }
      
      // Client-side action filter
      if (action !== 'all') {
        result.data = result.data.filter(log => log.action === action)
        result.total = result.data.length
      }
      
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [entityType, action, search, startDate, endDate, page])

  useEffect(() => {
    loadData()
  }, [loadData])

  const clearFilters = () => {
    setEntityType('all')
    setAction('all')
    setSearch("")
    setStartDate(undefined)
    setEndDate(undefined)
    setPage(1)
  }

  const hasFilters = entityType !== 'all' || action !== 'all' || search || startDate || endDate

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Audit Trail"
          description="Track all changes and actions across the system"
          actions={
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          }
        />

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by document # or user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Entity Type */}
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger className="w-[160px]">
                  <FileText className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Object Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="journal_entry">Journal Entry</SelectItem>
                  <SelectItem value="bill">Bill</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>

              {/* Action */}
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="w-[140px]">
                  <History className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="reverse">Reverse</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {startDate ? format(startDate, 'MMM d') : 'Start Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {endDate ? format(endDate, 'MMM d') : 'End Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !data || data.data.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit logs found</p>
                {hasFilters && (
                  <Button variant="link" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Object Type</TableHead>
                      <TableHead>Object ID</TableHead>
                      <TableHead>Changes</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map(log => (
                      <TableRow 
                        key={log.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedLog(log)}
                      >
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-3 w-3 text-primary" />
                            </div>
                            {log.userName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={actionColors[log.action]} variant="secondary">
                            {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {entityTypeLabels[log.entityType] || log.entityType}
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`${entityTypeLinks[log.entityType] || '#'}?id=${log.entityId}`}
                            className="text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {log.entityNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {log.changes && log.changes.length > 0 ? (
                            <span className="text-sm text-muted-foreground">
                              {log.changes.length} field{log.changes.length > 1 ? 's' : ''} changed
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {log.ipAddress}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, data.total)} of {data.total}
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
                      Page {page} of {Math.ceil(data.total / pageSize)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= Math.ceil(data.total / pageSize)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Detail Drawer */}
        <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Audit Log Details</SheetTitle>
              <SheetDescription>
                {selectedLog && format(new Date(selectedLog.timestamp), 'MMMM d, yyyy h:mm:ss a')}
              </SheetDescription>
            </SheetHeader>

            {selectedLog && (
              <div className="mt-6 space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">User</p>
                    <p className="font-medium">{selectedLog.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Action</p>
                    <Badge className={actionColors[selectedLog.action]} variant="secondary">
                      {selectedLog.action.charAt(0).toUpperCase() + selectedLog.action.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Object Type</p>
                    <p className="font-medium">{entityTypeLabels[selectedLog.entityType] || selectedLog.entityType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Object ID</p>
                    <Link 
                      href={`${entityTypeLinks[selectedLog.entityType] || '#'}?id=${selectedLog.entityId}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {selectedLog.entityNumber}
                    </Link>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">IP Address</p>
                    <p className="font-medium">{selectedLog.ipAddress}</p>
                  </div>
                </div>

                {/* Changes */}
                {selectedLog.changes && selectedLog.changes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Changes</h4>
                    <div className="space-y-3">
                      {selectedLog.changes.map((change, idx) => (
                        <div key={idx} className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-medium mb-2">{change.field}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-1 bg-red-50 text-red-700 rounded line-through">
                              {change.oldValue || '(empty)'}
                            </span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
                              {change.newValue || '(empty)'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppShell>
  )
}
