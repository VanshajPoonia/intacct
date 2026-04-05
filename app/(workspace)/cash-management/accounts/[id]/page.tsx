"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Building, Calendar, Check, CreditCard, Download, Edit, ExternalLink, Filter, Landmark, MoreHorizontal, Plus, RefreshCw, Settings, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { mockBankAccounts, mockBankTransactions } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/services"

export default function BankAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [period, setPeriod] = useState("30d")
  const [filter, setFilter] = useState("all")

  const account = useMemo(() => mockBankAccounts.find(a => a.id === id) || mockBankAccounts[0], [id])
  const transactions = useMemo(() => 
    mockBankTransactions
      .filter(t => t.bankAccountId === account.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50),
    [account.id]
  )

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return transactions
    if (filter === "unmatched") return transactions.filter(t => t.status === "unmatched")
    if (filter === "matched") return transactions.filter(t => t.status === "matched")
    if (filter === "deposits") return transactions.filter(t => t.amount > 0)
    if (filter === "withdrawals") return transactions.filter(t => t.amount < 0)
    return transactions
  }, [transactions, filter])

  const unmatchedCount = transactions.filter(t => t.status === "unmatched").length
  const totalDeposits = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const totalWithdrawals = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0))

  // Generate balance history
  const balanceHistory = useMemo(() => {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
    const history = []
    let runningBalance = account.currentBalance
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      history.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        balance: runningBalance + (Math.random() - 0.5) * 50000,
      })
    }
    return history
  }, [account.currentBalance, period])

  const chartConfig: ChartConfig = {
    balance: { label: "Balance", color: "hsl(var(--chart-1))" },
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/cash-management/accounts">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{account.name}</h1>
                <Badge variant={account.isActive ? "default" : "outline"}>
                  {account.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {account.bankName} &middot; ****{account.accountNumber.slice(-4)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Transactions
            </Button>
            <Button size="sm" asChild>
              <Link href="/cash-management/reconciliation">
                <Check className="mr-2 h-4 w-4" />
                Reconcile
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Bank Feed Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export Statement
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Bank Portal
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Deactivate Account</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(account.currentBalance)}</p>
                <p className="text-xs text-muted-foreground mt-1">As of {formatDate(new Date().toISOString())}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(account.availableBalance || account.currentBalance)}</p>
                <p className="text-xs text-muted-foreground mt-1">Available to use</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Unmatched</p>
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold mt-2">{unmatchedCount}</p>
                <p className="text-xs text-yellow-600 mt-1">Transactions to review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Last Reconciled</p>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatDate(account.lastReconciled || new Date().toISOString())}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {account.reconciledBalance ? `Balance: ${formatCurrency(account.reconciledBalance)}` : "Not yet reconciled"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Balance Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Balance History</CardTitle>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart data={balanceHistory} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={8}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    fill="hsl(var(--chart-1))"
                    stroke="hsl(var(--chart-1))"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Tabs defaultValue="transactions" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="reconciliation">Reconciliation History</TabsTrigger>
                <TabsTrigger value="details">Account Details</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="unmatched">Unmatched</SelectItem>
                    <SelectItem value="matched">Matched</SelectItem>
                    <SelectItem value="deposits">Deposits</SelectItem>
                    <SelectItem value="withdrawals">Withdrawals</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <TabsContent value="transactions">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((txn, index) => (
                        <TableRow key={txn.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>{formatDate(txn.date)}</TableCell>
                          <TableCell className="max-w-[300px]">
                            <div className="flex items-center gap-2">
                              <div className={`rounded p-1 ${txn.amount > 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                                {txn.amount > 0 ? (
                                  <ArrowDownRight className="h-3 w-3 text-green-600" />
                                ) : (
                                  <ArrowUpRight className="h-3 w-3 text-red-600" />
                                )}
                              </div>
                              <span className="truncate">{txn.description}</span>
                            </div>
                          </TableCell>
                          <TableCell>{txn.category || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={txn.status === "matched" ? "default" : "outline"}>
                              {txn.status}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${txn.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                            {txn.amount > 0 ? "+" : ""}{formatCurrency(txn.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(account.currentBalance - (index * 1500))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reconciliation">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Statement Date</TableHead>
                        <TableHead>Statement Balance</TableHead>
                        <TableHead>Book Balance</TableHead>
                        <TableHead>Difference</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { period: "March 2026", date: "2026-03-31", statement: 485000, book: 485000, status: "reconciled" },
                        { period: "February 2026", date: "2026-02-28", statement: 462500, book: 462500, status: "reconciled" },
                        { period: "January 2026", date: "2026-01-31", statement: 445000, book: 445000, status: "reconciled" },
                      ].map(rec => (
                        <TableRow key={rec.period}>
                          <TableCell className="font-medium">{rec.period}</TableCell>
                          <TableCell>{formatDate(rec.date)}</TableCell>
                          <TableCell>{formatCurrency(rec.statement)}</TableCell>
                          <TableCell>{formatCurrency(rec.book)}</TableCell>
                          <TableCell className={rec.statement === rec.book ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(rec.statement - rec.book)}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              {rec.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Account Name</p>
                        <p className="font-medium">{account.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bank Name</p>
                        <p className="font-medium">{account.bankName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Account Number</p>
                        <p className="font-medium">****{account.accountNumber.slice(-4)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Routing Number</p>
                        <p className="font-medium">{account.routingNumber || "N/A"}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Account Type</p>
                        <p className="font-medium capitalize">{account.accountType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Currency</p>
                        <p className="font-medium">{account.currency}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">GL Account</p>
                        <p className="font-medium">1000 - Cash and Cash Equivalents</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bank Feed Status</p>
                        <Badge className="mt-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Connected</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
