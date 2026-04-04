"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowRight, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  MessageSquare,
  ExternalLink
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import type { Transaction, ApprovalItem, PaginatedResponse } from "@/lib/types"

interface DashboardTablesProps {
  transactions: PaginatedResponse<Transaction> | null
  approvals: PaginatedResponse<ApprovalItem> | null
  loading: boolean
  transactionSearch: string
  onTransactionSearch: (search: string) => void
  transactionPage: number
  onTransactionPageChange: (page: number) => void
  onTransactionClick: (transaction: Transaction) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

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
    posted: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Posted' },
    pending: { className: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Pending' },
    approved: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Approved' },
    rejected: { className: 'bg-red-100 text-red-700 border-red-200', label: 'Rejected' },
    voided: { className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Voided' },
  }
  
  const variant = variants[status] || { className: 'bg-gray-100 text-gray-700', label: status }
  
  return (
    <Badge variant="outline" className={`text-xs font-medium ${variant.className}`}>
      {variant.label}
    </Badge>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
}

export function DashboardTables({
  transactions,
  approvals,
  loading,
  transactionSearch,
  onTransactionSearch,
  transactionPage,
  onTransactionPageChange,
  onTransactionClick,
  onApprove,
  onReject,
}: DashboardTablesProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <TableSkeleton />
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="transactions" className="w-full">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="transactions" className="text-sm">
                Recent Transactions
              </TabsTrigger>
              <TabsTrigger value="approvals" className="text-sm">
                Pending Approvals
                {approvals && approvals.total > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-5 p-0 flex items-center justify-center text-xs">
                    {approvals.total}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <TabsContent value="transactions" className="mt-0">
            {/* Search & Pagination */}
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={transactionSearch}
                  onChange={(e) => onTransactionSearch(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
              <Link href="/cash-management/transactions">
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* Transactions Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Description</th>
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Account</th>
                    <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions?.data.map((txn) => (
                    <tr 
                      key={txn.id} 
                      className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => onTransactionClick(txn)}
                    >
                      <td className="py-2.5 px-3 tabular-nums text-muted-foreground">
                        {format(txn.date, 'MMM d')}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[250px]">{txn.description}</span>
                          {txn.reference && (
                            <span className="text-xs text-muted-foreground">{txn.reference}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{txn.accountName}</td>
                      <td className={`py-2.5 px-3 text-right tabular-nums font-medium ${txn.type === 'credit' ? 'text-emerald-600' : ''}`}>
                        {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={txn.status} />
                      </td>
                    </tr>
                  ))}
                  {(!transactions || transactions.data.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {transactions && transactions.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">
                  Showing {(transactionPage - 1) * transactions.pageSize + 1} to{' '}
                  {Math.min(transactionPage * transactions.pageSize, transactions.total)} of{' '}
                  {transactions.total} results
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={transactionPage <= 1}
                    onClick={() => onTransactionPageChange(transactionPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs px-2">
                    Page {transactionPage} of {transactions.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={transactionPage >= transactions.totalPages}
                    onClick={() => onTransactionPageChange(transactionPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approvals" className="mt-0">
            <div className="flex items-center justify-end mb-4">
              <Link href="/approvals">
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* Approvals Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Document</th>
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Description</th>
                    <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Requested By</th>
                    <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals?.data.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{item.documentNumber}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {item.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-muted-foreground truncate block max-w-[200px]">
                          {item.description}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {item.requestedBy}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => onApprove(item.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onReject(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!approvals || approvals.data.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No pending approvals
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  )
}
