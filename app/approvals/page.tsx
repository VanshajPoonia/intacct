"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Check, X, Clock, CheckCircle2, XCircle, FileText, MoreHorizontal, Eye } from "lucide-react"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getApprovalItems, approveItem, rejectItem } from "@/lib/services"
import type { ApprovalItem, DashboardFilters, PaginatedResponse } from "@/lib/types"

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

export default function ApprovalsPage() {
  const [allItems, setAllItems] = useState<PaginatedResponse<ApprovalItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<string>("pending")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
      // Get all items with larger pageSize
      const result = await getApprovalItems(
        defaultFilters,
        undefined, // no status filter - we'll filter client-side by tab
        1,
        100
      )
      setAllItems(result)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    await approveItem(id)
    await fetchItems()
    setActionLoading(null)
  }

  const handleReject = async (id: string) => {
    setActionLoading(id)
    await rejectItem(id)
    await fetchItems()
    setActionLoading(null)
  }

  const pendingItems = allItems?.data.filter(item => item.status === 'pending') || []
  const approvedItems = allItems?.data.filter(item => item.status === 'approved') || []
  const rejectedItems = allItems?.data.filter(item => item.status === 'rejected') || []

  const getFilteredItems = () => {
    switch (tab) {
      case 'pending': return pendingItems
      case 'approved': return approvedItems
      case 'rejected': return rejectedItems
      default: return allItems?.data || []
    }
  }

  const filteredItems = getFilteredItems()

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Approvals</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review and approve pending items
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{pendingItems.length}</p>
                    <p className="text-sm text-muted-foreground">Pending Approvals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
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
            <Card>
              <CardContent className="p-4">
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
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending" className="gap-1.5">
                Pending
                {pendingItems.length > 0 && (
                  <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {pendingItems.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
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
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <FileText className="h-8 w-8 mb-2" />
                            <p>No items found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-primary">{item.documentNumber}</span>
                              <span className="text-xs text-muted-foreground capitalize">
                                {item.type.replace('_', ' ')}
                              </span>
                            </div>
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
                          <TableCell>
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
                                  <DropdownMenuItem>
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
          </Tabs>
        </div>
      </div>
    </AppShell>
  )
}
