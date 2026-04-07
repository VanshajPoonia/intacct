"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  ChevronDown,
  ArrowUpDown,
  CreditCard,
  Banknote,
  Building2,
  DollarSign,
  MoreHorizontal,
  Check,
  X,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { AppShell } from "@/components/layout/app-shell"
import type { Receipt, Entity, Customer, DashboardFilters, SortConfig } from "@/lib/types"
import { 
  getReceipts, 
  getEntities,
  getCustomers,
  applyReceipt,
  voidReceipt,
} from "@/lib/services"

export default function ReceiptsPage() {
  // Data state
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filter state
  const [entityId, setEntityId] = useState("e4") // All entities
  const [customerId, setCustomerId] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [methodFilter, setMethodFilter] = useState<string[]>([])
  const [sort, setSort] = useState<SortConfig>({ key: "date", direction: "desc" })
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Build filters
  const filters: DashboardFilters = {
    entityId,
    customerId: customerId || undefined,
    dateRange: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      preset: 'this_quarter'
    }
  }

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    const [receiptsRes, entitiesData, customersData] = await Promise.all([
      getReceipts(filters, search, statusFilter.length > 0 ? statusFilter : undefined, methodFilter.length > 0 ? methodFilter : undefined, sort, page, pageSize),
      getEntities(),
      getCustomers(),
    ])
    setReceipts(receiptsRes.data)
    setTotal(receiptsRes.total)
    setEntities(entitiesData)
    setCustomers(customersData.data)
    setLoading(false)
  }, [entityId, customerId, search, statusFilter, methodFilter, sort, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculate summary metrics
  const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0)
  const appliedAmount = receipts.filter(r => r.status === 'applied').reduce((sum, r) => sum + r.amount, 0)
  const unappliedAmount = receipts.filter(r => r.status === 'unapplied').reduce((sum, r) => sum + r.amount, 0)
  const pendingAmount = receipts.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0)

  // Handle sort
  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Handle apply receipt
  const handleApply = async (id: string) => {
    await applyReceipt(id, [])
    fetchData()
  }

  // Handle void receipt
  const handleVoid = async (id: string) => {
    await voidReceipt(id)
    fetchData()
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Status badge
  const getStatusBadge = (status: Receipt['status']) => {
    const variants: Record<Receipt['status'], { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      applied: { variant: "default", label: "Applied" },
      unapplied: { variant: "outline", label: "Unapplied" },
      voided: { variant: "destructive", label: "Voided" },
    }
    const { variant, label } = variants[status]
    return <Badge variant={variant}>{label}</Badge>
  }

  // Method icon
  const getMethodIcon = (method: Receipt['method']) => {
    switch (method) {
      case 'check': return <FileText className="h-4 w-4" />
      case 'ach': return <Building2 className="h-4 w-4" />
      case 'wire': return <Building2 className="h-4 w-4" />
      case 'credit_card': return <CreditCard className="h-4 w-4" />
      case 'cash': return <Banknote className="h-4 w-4" />
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Cash Receipts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage customer payments and cash receipts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New Receipt
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatCurrency(totalAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">{receipts.length} receipts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Applied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-green-600">{formatCurrency(appliedAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">{receipts.filter(r => r.status === 'applied').length} receipts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unapplied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-amber-600">{formatCurrency(unappliedAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">{receipts.filter(r => r.status === 'unapplied').length} receipts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-blue-600">{formatCurrency(pendingAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">{receipts.filter(r => r.status === 'pending').length} receipts</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search receipts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={entityId} onValueChange={setEntityId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="e4">All Entities</SelectItem>
              {entities.filter(e => e.id !== 'e4').map(entity => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Customers</SelectItem>
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1.5" />
                Status
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {['pending', 'applied', 'unapplied', 'voided'].map(status => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => {
                    setStatusFilter(prev => 
                      prev.includes(status) 
                        ? prev.filter(s => s !== status)
                        : [...prev, status]
                    )
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-4 w-4 border rounded flex items-center justify-center ${statusFilter.includes(status) ? 'bg-primary border-primary' : 'border-input'}`}>
                      {statusFilter.includes(status) && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="capitalize">{status}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <CreditCard className="h-4 w-4 mr-1.5" />
                Method
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {['check', 'ach', 'wire', 'credit_card', 'cash'].map(method => (
                <DropdownMenuItem
                  key={method}
                  onClick={() => {
                    setMethodFilter(prev => 
                      prev.includes(method) 
                        ? prev.filter(m => m !== method)
                        : [...prev, method]
                    )
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-4 w-4 border rounded flex items-center justify-center ${methodFilter.includes(method) ? 'bg-primary border-primary' : 'border-input'}`}>
                      {methodFilter.includes(method) && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="capitalize">{method.replace('_', ' ')}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('number')}
                >
                  <div className="flex items-center gap-1">
                    Receipt #
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : receipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No receipts found
                  </TableCell>
                </TableRow>
              ) : (
                receipts.map(receipt => (
                  <TableRow key={receipt.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{receipt.number}</TableCell>
                    <TableCell>{formatDate(receipt.date)}</TableCell>
                    <TableCell>{receipt.customerName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMethodIcon(receipt.method)}
                        <span className="capitalize">{receipt.method.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(receipt.amount)}</TableCell>
                    <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {receipt.reference || receipt.checkNumber || '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          {receipt.status === 'unapplied' && (
                            <DropdownMenuItem onClick={() => handleApply(receipt.id)}>
                              Apply to Invoices
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {receipt.status !== 'voided' && (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleVoid(receipt.id)}
                            >
                              Void Receipt
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
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} receipts
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
