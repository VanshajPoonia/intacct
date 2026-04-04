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
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Banknote,
  RefreshCw,
} from "lucide-react"
import type { 
  DashboardFilters, 
  PaginatedResponse,
  SortConfig,
  Entity,
  Payment,
} from "@/lib/types"
import { 
  getPayments, 
  getEntities,
  processPayment,
  completePayment,
  voidPayment,
} from "@/lib/services"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  voided: "bg-muted text-muted-foreground",
}

const methodIcons: Record<string, React.ReactNode> = {
  check: <Banknote className="h-4 w-4" />,
  ach: <RefreshCw className="h-4 w-4" />,
  wire: <RefreshCw className="h-4 w-4" />,
  credit_card: <CreditCard className="h-4 w-4" />,
}

const methodLabels: Record<string, string> = {
  check: "Check",
  ach: "ACH",
  wire: "Wire",
  credit_card: "Credit Card",
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

export default function PaymentsPage() {
  // Filter state
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters)
  const [entities, setEntities] = useState<Entity[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [methodFilter, setMethodFilter] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortConfig | undefined>(undefined)
  const [page, setPage] = useState(1)
  const pageSize = 10
  
  // Data state
  const [data, setData] = useState<PaginatedResponse<Payment> | null>(null)
  const [loading, setLoading] = useState(true)

  // Load entities on mount
  useEffect(() => {
    getEntities().then(setEntities)
  }, [])

  // Fetch payments
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getPayments(
        filters,
        search || undefined,
        statusFilter.length > 0 ? statusFilter : undefined,
        methodFilter.length > 0 ? methodFilter : undefined,
        sort,
        page,
        pageSize
      )
      setData(result)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, search, statusFilter, methodFilter, sort, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle entity change
  const handleEntityChange = (entityId: string) => {
    setFilters(prev => ({ ...prev, entityId }))
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

  // Handle method filter change
  const handleMethodChange = (method: string) => {
    if (method === 'all') {
      setMethodFilter([])
    } else {
      setMethodFilter([method])
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

  // Handle process
  const handleProcess = async (id: string) => {
    await processPayment(id)
    fetchData()
  }

  // Handle complete
  const handleComplete = async (id: string) => {
    await completePayment(id)
    fetchData()
  }

  // Handle void
  const handleVoid = async (id: string) => {
    await voidPayment(id)
    fetchData()
  }

  // Calculate summary metrics
  const summaryMetrics = data?.data.reduce((acc, payment) => {
    acc.total += payment.amount
    if (payment.status === 'pending') acc.pending += payment.amount
    if (payment.status === 'processing') acc.processing += payment.amount
    if (payment.status === 'completed') acc.completed += payment.amount
    return acc
  }, { total: 0, pending: 0, processing: 0, completed: 0 }) || { total: 0, pending: 0, processing: 0, completed: 0 }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Payments"
          description="Manage vendor payments and disbursements"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                New Payment
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
                  <p className="text-xs text-muted-foreground">Pending</p>
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
                  <p className="text-xs text-muted-foreground">Processing</p>
                  <p className="text-xl font-semibold text-blue-600">
                    {formatCurrency(summaryMetrics.processing)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-blue-100">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-xl font-semibold text-green-600">
                    {formatCurrency(summaryMetrics.completed)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total This Period</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(summaryMetrics.total)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-muted">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">All Payments</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
                    className="pl-8 h-9 w-[200px]"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <Select value={filters.entityId} onValueChange={handleEntityChange}>
                  <SelectTrigger className="h-9 w-[150px]">
                    <SelectValue placeholder="Entity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="e4">All Entities</SelectItem>
                    {entities.map(entity => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={statusFilter[0] || 'all'} 
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="h-9 w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="voided">Voided</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={methodFilter[0] || 'all'} 
                  onValueChange={handleMethodChange}
                >
                  <SelectTrigger className="h-9 w-[120px]">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="ach">ACH</SelectItem>
                    <SelectItem value="wire">Wire</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('number')}
                  >
                    <div className="flex items-center gap-1">
                      Number
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Related Bills</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Amount
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="space-y-2 py-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{payment.number}</TableCell>
                      <TableCell>{payment.vendorName}</TableCell>
                      <TableCell>{format(new Date(payment.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {methodIcons[payment.method]}
                          <span>{methodLabels[payment.method]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {payment.checkNumber || payment.reference || '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[payment.status]}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                            <DropdownMenuSeparator />
                            {payment.status === 'pending' && (
                              <DropdownMenuItem 
                                onClick={() => handleProcess(payment.id)}
                                className="text-blue-600"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Process
                              </DropdownMenuItem>
                            )}
                            {payment.status === 'processing' && (
                              <DropdownMenuItem 
                                onClick={() => handleComplete(payment.id)}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Complete
                              </DropdownMenuItem>
                            )}
                            {payment.status !== 'completed' && payment.status !== 'voided' && (
                              <DropdownMenuItem 
                                onClick={() => handleVoid(payment.id)}
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
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.total)} of {data.total} payments
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
    </AppShell>
  )
}
