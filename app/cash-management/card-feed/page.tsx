"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCorporateCardTransactions, getBankAccounts } from "@/lib/services"
import type { CorporateCardTransaction, BankAccount } from "@/lib/types"
import { 
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MoreHorizontal,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  Upload,
  Sparkles,
  CreditCard,
  Building2,
  Tag,
  FileText,
  X,
  Check,
  Camera,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

const receiptStatusConfig: Record<string, { label: string; color: string; icon: typeof Receipt }> = {
  missing: { label: 'Missing', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  uploaded: { label: 'Uploaded', color: 'bg-blue-100 text-blue-700', icon: Upload },
  matched: { label: 'Matched', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  not_required: { label: 'Not Required', color: 'bg-gray-100 text-gray-700', icon: Check },
}

const codingStatusConfig: Record<string, { label: string; color: string; icon: typeof Sparkles }> = {
  uncoded: { label: 'Uncoded', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  suggested: { label: 'AI Suggested', color: 'bg-purple-100 text-purple-700', icon: Sparkles },
  coded: { label: 'Coded', color: 'bg-blue-100 text-blue-700', icon: Tag },
  reviewed: { label: 'Reviewed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
}

export default function CorporateCardFeedPage() {
  // Filter state
  const [cardAccounts, setCardAccounts] = useState<BankAccount[]>([])
  const [selectedCard, setSelectedCard] = useState<string>("all")
  const [selectedReceiptStatus, setSelectedReceiptStatus] = useState<string>("all")
  const [selectedCodingStatus, setSelectedCodingStatus] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  
  // Data state
  const [transactions, setTransactions] = useState<CorporateCardTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // UI state
  const [selectedTransaction, setSelectedTransaction] = useState<CorporateCardTransaction | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [coding, setCoding] = useState(false)
  
  const pageSize = 15

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [transactionsResult, accountsResult] = await Promise.all([
        getCorporateCardTransactions(
          selectedCard !== 'all' ? selectedCard : undefined,
          selectedReceiptStatus !== 'all' ? selectedReceiptStatus : undefined,
          selectedCodingStatus !== 'all' ? selectedCodingStatus : undefined,
          debouncedSearch || undefined,
          page,
          pageSize
        ),
        getBankAccounts()
      ])
      setTransactions(transactionsResult.data)
      setTotalPages(transactionsResult.totalPages)
      setTotal(transactionsResult.total)
      setCardAccounts(accountsResult.filter(a => a.type === 'credit' || a.type === 'corporate_card'))
    } finally {
      setLoading(false)
    }
  }, [selectedCard, selectedReceiptStatus, selectedCodingStatus, debouncedSearch, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setPage(1)
  }, [selectedCard, selectedReceiptStatus, selectedCodingStatus, debouncedSearch])

  const handleRowClick = (transaction: CorporateCardTransaction) => {
    setSelectedTransaction(transaction)
    setDrawerOpen(true)
  }

  const handleApplySuggestion = async () => {
    if (!selectedTransaction) return
    setCoding(true)
    // Simulate API call
    await new Promise(r => setTimeout(r, 500))
    toast.success('Coding applied successfully')
    setCoding(false)
    setDrawerOpen(false)
    fetchData()
  }

  // Calculate summary stats
  const missingReceipts = transactions.filter(t => t.receiptStatus === 'missing').length
  const uncodedCount = transactions.filter(t => t.codingStatus === 'uncoded' || t.codingStatus === 'suggested').length
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Corporate Card Feed</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Review, code, and attach receipts to card transactions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                    {loading ? (
                      <Skeleton className="h-7 w-20 mt-1" />
                    ) : (
                      <p className="text-xl font-bold">{total}</p>
                    )}
                  </div>
                  <div className="h-10 w-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spend</p>
                    {loading ? (
                      <Skeleton className="h-7 w-28 mt-1" />
                    ) : (
                      <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
                    )}
                  </div>
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={cn(missingReceipts > 0 && "border-red-200")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Missing Receipts</p>
                    {loading ? (
                      <Skeleton className="h-7 w-12 mt-1" />
                    ) : (
                      <p className={cn("text-xl font-bold", missingReceipts > 0 && "text-red-600")}>
                        {missingReceipts}
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    missingReceipts > 0 ? "bg-red-100" : "bg-green-100"
                  )}>
                    <Receipt className={cn(
                      "h-5 w-5",
                      missingReceipts > 0 ? "text-red-600" : "text-green-600"
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={cn(uncodedCount > 0 && "border-yellow-200")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Needs Coding</p>
                    {loading ? (
                      <Skeleton className="h-7 w-12 mt-1" />
                    ) : (
                      <p className={cn("text-xl font-bold", uncodedCount > 0 && "text-yellow-600")}>
                        {uncodedCount}
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    uncodedCount > 0 ? "bg-yellow-100" : "bg-green-100"
                  )}>
                    <Sparkles className={cn(
                      "h-5 w-5",
                      uncodedCount > 0 ? "text-yellow-600" : "text-green-600"
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by merchant, cardholder..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedCard} onValueChange={setSelectedCard}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Cards" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cards</SelectItem>
                    {cardAccounts.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name} ({card.accountNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedReceiptStatus} onValueChange={setSelectedReceiptStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Receipt Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Receipts</SelectItem>
                    <SelectItem value="missing">Missing</SelectItem>
                    <SelectItem value="uploaded">Uploaded</SelectItem>
                    <SelectItem value="matched">Matched</SelectItem>
                    <SelectItem value="not_required">Not Required</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedCodingStatus} onValueChange={setSelectedCodingStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Coding Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Coding</SelectItem>
                    <SelectItem value="uncoded">Uncoded</SelectItem>
                    <SelectItem value="suggested">AI Suggested</SelectItem>
                    <SelectItem value="coded">Coded</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Cardholder</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Coding</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No card transactions found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => {
                      const receiptConfig = receiptStatusConfig[transaction.receiptStatus]
                      const codingConfig = codingStatusConfig[transaction.codingStatus]
                      const ReceiptIcon = receiptConfig.icon
                      const CodingIcon = codingConfig.icon
                      
                      return (
                        <TableRow 
                          key={transaction.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(transaction)}
                        >
                          <TableCell className="font-medium">
                            {format(new Date(transaction.transactionDate), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{transaction.cardholderName}</p>
                              <p className="text-xs text-muted-foreground">****{transaction.cardLastFour}</p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <p className="truncate font-medium">{transaction.merchantName}</p>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {transaction.merchantCategory}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", receiptConfig.color)}
                            >
                              <ReceiptIcon className="h-3 w-3 mr-1" />
                              {receiptConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", codingConfig.color)}
                            >
                              <CodingIcon className="h-3 w-3 mr-1" />
                              {codingConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Camera className="h-4 w-4 mr-2" />
                                  Upload Receipt
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Tag className="h-4 w-4 mr-2" />
                                  Apply Coding
                                </DropdownMenuItem>
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total}
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
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Transaction Details</SheetTitle>
          </SheetHeader>
          {selectedTransaction && (
            <div className="mt-6 space-y-6">
              {/* Amount */}
              <div className="text-center py-4 bg-muted/30 rounded-lg">
                <p className="text-3xl font-bold">
                  {formatCurrency(selectedTransaction.amount)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTransaction.merchantName}
                </p>
              </div>

              <Separator />

              {/* Transaction Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Transaction Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Transaction Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedTransaction.transactionDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Post Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedTransaction.postDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cardholder</p>
                    <p className="text-sm font-medium">{selectedTransaction.cardholderName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Card</p>
                    <p className="text-sm font-medium">****{selectedTransaction.cardLastFour}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Merchant Category</p>
                    <p className="text-sm font-medium">{selectedTransaction.merchantCategory}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="outline" className="capitalize mt-1">
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Receipt Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Receipt</h3>
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs", receiptStatusConfig[selectedTransaction.receiptStatus].color)}
                  >
                    {receiptStatusConfig[selectedTransaction.receiptStatus].label}
                  </Badge>
                </div>
                {selectedTransaction.receiptStatus === 'missing' ? (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">No receipt attached</p>
                    <Button size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Receipt
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">receipt_{selectedTransaction.id}.pdf</span>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Coding Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Account Coding</h3>
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs", codingStatusConfig[selectedTransaction.codingStatus].color)}
                  >
                    {codingStatusConfig[selectedTransaction.codingStatus].label}
                  </Badge>
                </div>

                {selectedTransaction.codingStatus === 'suggested' && selectedTransaction.suggestedAccountName && (
                  <Card className="border-purple-200 bg-purple-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-900">AI Suggestion</p>
                          <p className="text-xs text-purple-700 mt-1">
                            Based on merchant category and past transactions
                          </p>
                          <div className="mt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-700">Category</span>
                              <span className="font-medium">{selectedTransaction.suggestedCategory}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-700">Account</span>
                              <span className="font-medium">{selectedTransaction.suggestedAccountName}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button 
                              size="sm" 
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={handleApplySuggestion}
                              disabled={coding}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Apply
                            </Button>
                            <Button size="sm" variant="outline">
                              <X className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(selectedTransaction.codingStatus === 'coded' || selectedTransaction.codingStatus === 'reviewed') && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium">{selectedTransaction.actualCategory}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Account</span>
                      <span className="font-medium">{selectedTransaction.actualAccountName}</span>
                    </div>
                    {selectedTransaction.departmentName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Department</span>
                        <span className="font-medium">{selectedTransaction.departmentName}</span>
                      </div>
                    )}
                    {selectedTransaction.projectName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Project</span>
                        <span className="font-medium">{selectedTransaction.projectName}</span>
                      </div>
                    )}
                  </div>
                )}

                {selectedTransaction.codingStatus === 'uncoded' && (
                  <div className="text-center py-4 border rounded-lg border-dashed">
                    <Tag className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No coding applied</p>
                    <Button size="sm" variant="outline" className="mt-3">
                      Add Coding
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Memo */}
              <div className="space-y-2">
                <Label>Memo</Label>
                <Input 
                  placeholder="Add a memo..." 
                  defaultValue={selectedTransaction.memo || ''}
                />
              </div>
            </div>
          )}
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Close
            </Button>
            <Button>Save Changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}
