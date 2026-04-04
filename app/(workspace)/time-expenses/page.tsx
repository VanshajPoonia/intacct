// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/finance/page-header"
import { MetricCard } from "@/components/finance/metric-card"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  Clock, 
  Receipt, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Send,
  Check,
  DollarSign,
  Timer,
  Briefcase
} from "lucide-react"
import { 
  getTimeEntries, 
  getExpenseEntries,
  submitTimeEntry,
  approveTimeEntry,
  submitExpenseEntry,
  approveExpenseEntry
} from "@/lib/services"
import type { TimeEntry, ExpenseEntry } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  invoiced: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  reimbursed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
}

export default function TimeExpensesPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeModule, setActiveModule] = useState("time")
  const [search, setSearch] = useState("")

  const loadTimeEntries = async () => {
    const result = await getTimeEntries()
    setTimeEntries(result.data)
  }

  const loadExpenseEntries = async () => {
    const result = await getExpenseEntries()
    setExpenseEntries(result.data)
  }

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadTimeEntries(), loadExpenseEntries()])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmitTime = async (id: string) => {
    await submitTimeEntry(id)
    loadTimeEntries()
  }

  const handleApproveTime = async (id: string) => {
    await approveTimeEntry(id)
    loadTimeEntries()
  }

  const handleSubmitExpense = async (id: string) => {
    await submitExpenseEntry(id)
    loadExpenseEntries()
  }

  const handleApproveExpense = async (id: string) => {
    await approveExpenseEntry(id)
    loadExpenseEntries()
  }

  const timeMetrics = {
    totalHours: timeEntries.reduce((sum, te) => sum + te.hours, 0),
    billableHours: timeEntries.filter(te => te.billable).reduce((sum, te) => sum + te.hours, 0),
    billableAmount: timeEntries.filter(te => te.billable).reduce((sum, te) => sum + te.amount, 0),
    pendingApproval: timeEntries.filter(te => te.status === 'submitted').length,
  }

  const expenseMetrics = {
    total: expenseEntries.reduce((sum, e) => sum + e.amount, 0),
    billable: expenseEntries.filter(e => e.billable).reduce((sum, e) => sum + e.amount, 0),
    pendingApproval: expenseEntries.filter(e => e.status === 'submitted').length,
    pendingReimbursement: expenseEntries.filter(e => e.status === 'approved').length,
  }

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Time & Expenses"
          description="Track time entries and expense reports"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/time-expenses/expenses/new">
                  <Receipt className="h-4 w-4 mr-2" />
                  New Expense
                </Link>
              </Button>
              <Button asChild>
                <Link href="/time-expenses/time/new">
                  <Clock className="h-4 w-4 mr-2" />
                  Log Time
                </Link>
              </Button>
            </div>
          }
        />

        <Tabs value={activeModule} onValueChange={setActiveModule}>
          <TabsList className="mb-4">
            <TabsTrigger value="time" className="gap-2">
              <Clock className="h-4 w-4" />
              Time Tracking
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2">
              <Receipt className="h-4 w-4" />
              Expenses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="time" className="space-y-6">
            {/* Time Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard
                title="Total Hours"
                value={`${timeMetrics.totalHours}h`}
                icon={<Timer className="h-4 w-4" />}
              />
              <MetricCard
                title="Billable Hours"
                value={`${timeMetrics.billableHours}h`}
                icon={<Briefcase className="h-4 w-4" />}
              />
              <MetricCard
                title="Billable Amount"
                value={formatCurrency(timeMetrics.billableAmount)}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <MetricCard
                title="Pending Approval"
                value={timeMetrics.pendingApproval}
                icon={<Clock className="h-4 w-4" />}
                trend={timeMetrics.pendingApproval > 0 ? "attention" : undefined}
              />
            </div>

            {/* Time Entries Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Time Entries</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Billable</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : timeEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No time entries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      timeEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{formatDate(entry.date)}</TableCell>
                          <TableCell>{entry.employeeName}</TableCell>
                          <TableCell>{entry.projectName || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{entry.taskDescription}</TableCell>
                          <TableCell>{entry.hours}h</TableCell>
                          <TableCell>
                            {entry.billable ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">Yes</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[entry.status]} variant="secondary">
                              {entry.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(entry.amount)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {entry.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleSubmitTime(entry.id)}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit
                                  </DropdownMenuItem>
                                )}
                                {entry.status === 'submitted' && (
                                  <DropdownMenuItem onClick={() => handleApproveTime(entry.id)}>
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            {/* Expense Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard
                title="Total Expenses"
                value={formatCurrency(expenseMetrics.total)}
                icon={<Receipt className="h-4 w-4" />}
              />
              <MetricCard
                title="Billable"
                value={formatCurrency(expenseMetrics.billable)}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <MetricCard
                title="Pending Approval"
                value={expenseMetrics.pendingApproval}
                icon={<Clock className="h-4 w-4" />}
                trend={expenseMetrics.pendingApproval > 0 ? "attention" : undefined}
              />
              <MetricCard
                title="To Reimburse"
                value={expenseMetrics.pendingReimbursement}
                icon={<DollarSign className="h-4 w-4" />}
              />
            </div>

            {/* Expense Entries Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Expense Reports</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Billable</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : expenseEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No expense entries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenseEntries.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{formatDate(expense.date)}</TableCell>
                          <TableCell>{expense.employeeName}</TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{expense.description}</TableCell>
                          <TableCell>{expense.projectName || '-'}</TableCell>
                          <TableCell>
                            {expense.billable ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">Yes</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[expense.status]} variant="secondary">
                              {expense.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {expense.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleSubmitExpense(expense.id)}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit
                                  </DropdownMenuItem>
                                )}
                                {expense.status === 'submitted' && (
                                  <DropdownMenuItem onClick={() => handleApproveExpense(expense.id)}>
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
