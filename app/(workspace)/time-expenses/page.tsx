// @ts-nocheck
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { PageHeader } from "@/components/finance/page-header"
import { MetricCard } from "@/components/finance/metric-card"
import { StatusBadge } from "@/components/finance/status-badge"
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
  getExpenseWorkspace,
  getTimeTrackingWorkspace,
  submitTimeEntry,
  approveTimeEntry,
  submitExpenseEntry,
  approveExpenseEntry
} from "@/lib/services"
import type { ExpenseEntry, FinanceFilters, TimeEntry } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function TimeExpensesPage() {
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [timeWorkspace, setTimeWorkspace] = useState<Awaited<ReturnType<typeof getTimeTrackingWorkspace>> | null>(null)
  const [expenseWorkspace, setExpenseWorkspace] = useState<Awaited<ReturnType<typeof getExpenseWorkspace>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeModule, setActiveModule] = useState("time")
  const [search, setSearch] = useState("")
  const shellFilters = useMemo<FinanceFilters | null>(() => {
    if (!activeEntity || !dateRange) {
      return null
    }

    return {
      entityId: activeEntity.id,
      dateRange,
    }
  }, [activeEntity, dateRange])

  const loadData = useCallback(async () => {
    if (!shellFilters) {
      return
    }

    setLoading(true)
    const [timeData, expenseData] = await Promise.all([
      getTimeTrackingWorkspace(shellFilters, { search, page: 1, pageSize: 50 }),
      getExpenseWorkspace(shellFilters, { search, page: 1, pageSize: 50 }),
    ])
    setTimeWorkspace(timeData)
    setExpenseWorkspace(expenseData)
    setLoading(false)
  }, [search, shellFilters])

  useEffect(() => {
    if (!shellFilters) {
      return
    }

    loadData()
  }, [loadData, shellFilters])

  const handleSubmitTime = async (id: string) => {
    await submitTimeEntry(id)
    loadData()
  }

  const handleApproveTime = async (id: string) => {
    await approveTimeEntry(id)
    loadData()
  }

  const handleSubmitExpense = async (id: string) => {
    await submitExpenseEntry(id)
    loadData()
  }

  const handleApproveExpense = async (id: string) => {
    await approveExpenseEntry(id)
    loadData()
  }
  const timeEntries = timeWorkspace?.data ?? []
  const expenseEntries = expenseWorkspace?.data ?? []

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Time & Expenses"
          description={activeEntity ? `Track time entries and expense reports for ${activeEntity.name}` : "Track time entries and expense reports"}
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
              {(timeWorkspace?.metrics ?? []).map((metric, index) => (
                <MetricCard
                  key={metric.id}
                  title={metric.label}
                  value={metric.value}
                  icon={
                    index === 0 ? <Timer className="h-4 w-4" /> :
                    index === 1 ? <Briefcase className="h-4 w-4" /> :
                    index === 2 ? <DollarSign className="h-4 w-4" /> :
                    <Clock className="h-4 w-4" />
                  }
                  trend={metric.tone === "positive" ? "up" : metric.tone === "warning" ? "attention" : undefined}
                />
              ))}
            </div>

            {/* Time Entries Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Time Entries</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search employees, projects, or notes..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
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
                          <TableCell>
                            {entry.projectId ? (
                              <Link href={`/projects/${entry.projectId}`} className="text-muted-foreground transition-colors hover:text-foreground hover:underline">
                                {entry.projectName}
                              </Link>
                            ) : (
                              '-'
                            )}
                          </TableCell>
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
                            <StatusBadge status={entry.status} />
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
              {(expenseWorkspace?.metrics ?? []).map((metric, index) => (
                <MetricCard
                  key={metric.id}
                  title={metric.label}
                  value={metric.value}
                  icon={
                    index === 0 ? <Receipt className="h-4 w-4" /> :
                    index === 1 ? <DollarSign className="h-4 w-4" /> :
                    index === 2 ? <Clock className="h-4 w-4" /> :
                    <DollarSign className="h-4 w-4" />
                  }
                  trend={metric.tone === "positive" ? "up" : metric.tone === "warning" ? "attention" : undefined}
                />
              ))}
            </div>

            {/* Expense Entries Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Expense Reports</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search employees, categories, or projects..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
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
                          <TableCell>
                            {expense.projectId ? (
                              <Link href={`/projects/${expense.projectId}`} className="text-muted-foreground transition-colors hover:text-foreground hover:underline">
                                {expense.projectName}
                              </Link>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {expense.billable ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">Yes</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={expense.status} />
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
