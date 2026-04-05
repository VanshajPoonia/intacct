"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, BookOpen, Calendar, ChevronDown, Download, Edit, Filter, Lock, MoreHorizontal, Plus, TrendingDown, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { mockAccounts, mockJournalEntries } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/services"

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [period, setPeriod] = useState("current")

  const account = useMemo(() => mockAccounts.find(a => a.id === id) || mockAccounts[0], [id])
  
  const relatedJournals = useMemo(() => 
    mockJournalEntries.filter(j => 
      j.lines.some(l => l.accountId === account.id)
    ).slice(0, 10),
    [account.id]
  )

  const accountTypeColors: Record<string, string> = {
    asset: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    liability: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    equity: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    revenue: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    expense: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  }

  // Generate mock balance history
  const balanceHistory = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentMonth = new Date().getMonth()
    return months.slice(0, currentMonth + 1).map((month, i) => ({
      month,
      balance: account.balance * (0.7 + Math.random() * 0.6) * ((i + 1) / (currentMonth + 1)),
    }))
  }, [account.balance])

  const chartConfig: ChartConfig = {
    balance: { label: "Balance", color: "hsl(var(--chart-1))" },
  }

  // Mock ledger transactions
  const ledgerTransactions = relatedJournals.flatMap(j => 
    j.lines
      .filter(l => l.accountId === account.id)
      .map(line => ({
        id: `${j.id}-${line.id}`,
        date: j.entryDate,
        reference: j.entryNumber,
        description: line.description || j.description,
        debit: line.type === "debit" ? line.amount : 0,
        credit: line.type === "credit" ? line.amount : 0,
        balance: account.balance,
        journalId: j.id,
      }))
  )

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/general-ledger/chart-of-accounts">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{account.accountNumber} - {account.name}</h1>
                <Badge className={accountTypeColors[account.type]}>{account.type}</Badge>
                {!account.isActive && <Badge variant="outline">Inactive</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {account.category} &middot; Normal {account.normalBalance} balance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Journal Entry
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
                  <Download className="mr-2 h-4 w-4" />
                  Export Ledger
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Lock className="mr-2 h-4 w-4" />
                  Lock Account
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
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(account.balance)}</p>
                <p className="text-xs text-muted-foreground mt-1">As of today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Period Activity</p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(account.balance * 0.15)}</p>
                <p className="text-xs text-green-600 mt-1">+12.5% from prior period</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Debits</p>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(account.balance * 0.8)}</p>
                <p className="text-xs text-muted-foreground mt-1">This period</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(account.balance * 0.65)}</p>
                <p className="text-xs text-muted-foreground mt-1">This period</p>
              </CardContent>
            </Card>
          </div>

          {/* Balance Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Balance Trend</CardTitle>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Year</SelectItem>
                  <SelectItem value="prior">Prior Year</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart data={balanceHistory} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
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

          {/* Tabs */}
          <Tabs defaultValue="ledger" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="ledger">Ledger</TabsTrigger>
                <TabsTrigger value="journals">Journal Entries</TabsTrigger>
                <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <TabsContent value="ledger">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={3} className="font-medium">Beginning Balance</TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(account.balance * 0.8)}</TableCell>
                      </TableRow>
                      {ledgerTransactions.map((txn, index) => (
                        <TableRow key={txn.id}>
                          <TableCell>{formatDate(txn.date)}</TableCell>
                          <TableCell>
                            <Link 
                              href={`/general-ledger/journal-entries/${txn.journalId}`}
                              className="text-primary hover:underline"
                            >
                              {txn.reference}
                            </Link>
                          </TableCell>
                          <TableCell>{txn.description}</TableCell>
                          <TableCell className="text-right">{txn.debit > 0 ? formatCurrency(txn.debit) : ""}</TableCell>
                          <TableCell className="text-right">{txn.credit > 0 ? formatCurrency(txn.credit) : ""}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(account.balance * 0.8 + (index + 1) * (account.balance * 0.02))}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={3}>Ending Balance</TableCell>
                        <TableCell className="text-right">{formatCurrency(account.balance * 0.8)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(account.balance * 0.6)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="journals">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entry #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatedJournals.map(journal => {
                        const accountLine = journal.lines.find(l => l.accountId === account.id)
                        return (
                          <TableRow key={journal.id}>
                            <TableCell>
                              <Link 
                                href={`/general-ledger/journal-entries/${journal.id}`}
                                className="text-primary hover:underline font-medium"
                              >
                                {journal.entryNumber}
                              </Link>
                            </TableCell>
                            <TableCell>{formatDate(journal.entryDate)}</TableCell>
                            <TableCell>{journal.description}</TableCell>
                            <TableCell>
                              <Badge variant={journal.status === "posted" ? "default" : "outline"}>
                                {journal.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {accountLine && formatCurrency(accountLine.amount)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reconciliation">
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-30" />
                  <p className="font-medium">Reconciliation Not Required</p>
                  <p className="text-sm mt-1">This account type does not require reconciliation.</p>
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
                        <p className="text-sm text-muted-foreground">Account Number</p>
                        <p className="font-medium">{account.accountNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Account Name</p>
                        <p className="font-medium">{account.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Account Type</p>
                        <p className="font-medium capitalize">{account.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <p className="font-medium">{account.category}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Normal Balance</p>
                        <p className="font-medium capitalize">{account.normalBalance}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium">{account.isActive ? "Active" : "Inactive"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Parent Account</p>
                        <p className="font-medium">{account.parentId || "None (Top Level)"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="font-medium">{account.description || "No description provided"}</p>
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
