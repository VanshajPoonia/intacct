// @ts-nocheck
"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  Filter, 
  Download, 
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  FileText,
  Eye,
  History,
} from "lucide-react"
import type { AuditLogEntry, PaginatedAuditLogs } from "@/lib/services"
import { getAuditLogs } from "@/lib/services"

interface AuditTrailProps {
  entityType?: string
  entityId?: string
  title?: string
  compact?: boolean
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
  account: "Account",
  invoice: "Invoice",
  payment: "Payment",
  vendor: "Vendor",
  customer: "Customer",
  report: "Report",
}

export function AuditTrail({
  entityType,
  entityId,
  title = "Audit Trail",
  compact = false,
}: AuditTrailProps) {
  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>(entityType || 'all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = compact ? 5 : 10
  
  // Data state
  const [data, setData] = useState<PaginatedAuditLogs | null>(null)
  const [loading, setLoading] = useState(true)
  
  // UI state
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Fetch audit logs
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getAuditLogs(
        typeFilter === 'all' ? entityType : typeFilter,
        entityId,
        search || undefined,
        actionFilter === 'all' ? undefined : actionFilter,
        page,
        pageSize
      )
      setData(result)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId, typeFilter, actionFilter, search, page, pageSize])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle type filter change
  const handleTypeChange = (type: string) => {
    setTypeFilter(type)
    setPage(1)
  }

  // Handle action filter change
  const handleActionChange = (action: string) => {
    setActionFilter(action)
    setPage(1)
  }

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  // Handle view details
  const handleViewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <History className="h-4 w-4" />
              {title}
            </CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.data.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.data.map((log, index) => (
                <div key={log.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="p-1.5 rounded-full bg-muted">
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                    {index < (data?.data.length || 0) - 1 && (
                      <div className="w-px h-full bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{log.userName}</span>
                      <Badge variant="secondary" className={`text-xs ${actionColors[log.action]}`}>
                        {log.action}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entityTypeLabels[log.entityType] || log.entityType}
                      {' • '}
                      {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
              {!entityType && (
                <Select value={typeFilter} onValueChange={handleTypeChange}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Entity Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="journal_entry">Journal Entry</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Select value={actionFilter} onValueChange={handleActionChange}>
                <SelectTrigger className="w-[140px] h-9">
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
                </SelectContent>
              </Select>

              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user or description..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Button variant="outline" size="sm" className="ml-auto">
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[140px]">User</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                  <TableHead className="w-[140px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <History className="h-8 w-8" />
                        <p>No audit logs found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell className="text-sm">
                        <div>
                          <p>{format(new Date(log.timestamp), 'MMM d, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.timestamp), 'h:mm:ss a')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-muted">
                            <User className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <span className="text-sm">{log.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={actionColors[log.action]}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entityTypeLabels[log.entityType] || log.entityType}
                      </TableCell>
                      <TableCell className="text-sm max-w-[300px] truncate">
                        {log.changes && log.changes.length > 0 
                          ? `${log.changes.length} field(s) changed`
                          : 'No details'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.total)} of {data.total} entries
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

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Timestamp</p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedLog.timestamp), 'MMM d, yyyy h:mm:ss a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">User</p>
                    <p className="text-sm font-medium">{selectedLog.userName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Entity Type</p>
                    <p className="text-sm font-medium">
                      {entityTypeLabels[selectedLog.entityType] || selectedLog.entityType}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Action</p>
                  <Badge variant="secondary" className={actionColors[selectedLog.action]}>
                    {selectedLog.action}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Changes</p>
                {selectedLog.changes && selectedLog.changes.length > 0 ? (
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-2">
                      {selectedLog.changes.map((change, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/50 text-sm">
                          <p className="font-medium text-xs text-muted-foreground mb-1">
                            {change.field}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground line-through">
                              {change.oldValue || '(empty)'}
                            </span>
                            <span>→</span>
                            <span className="font-medium">{change.newValue || '(empty)'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">No field changes recorded</p>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                <p>Entity ID: {selectedLog.entityId}</p>
                <p>Log ID: {selectedLog.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
