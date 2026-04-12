// @ts-nocheck
"use client"

import { useState, useEffect, use, useCallback } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/finance/page-header"
import { MetricCard } from "@/components/finance/metric-card"
import { StatusBadge } from "@/components/finance/status-badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  PlayCircle, 
  PauseCircle, 
  CheckCircle2,
  Building2,
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  Clock,
  Receipt
} from "lucide-react"
import { 
  getProjectDetailById, 
  updateProjectStatus,
  getTimeEntries,
  getExpenseEntries
} from "@/lib/services"
import type { ProjectDetail, TimeEntry, ExpenseEntry } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [projectData, timeData, expenseData] = await Promise.all([
      getProjectDetailById(id),
      getTimeEntries(undefined, id),
      getExpenseEntries(undefined, id),
    ])
    setProject(projectData)
    setTimeEntries(timeData.data)
    setExpenses(expenseData.data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleStatusChange = async (status: ProjectDetail['status']) => {
    await updateProjectStatus(id, status)
    loadData()
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!project) {
    return (
      <AppShell>
        <div className="flex-1 p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Project not found</p>
              <Button asChild className="mt-4">
                <Link href="/projects">Back to Projects</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  const totalHours = timeEntries.reduce((sum, te) => sum + te.hours, 0)
  const billableHours = timeEntries.filter(te => te.billable).reduce((sum, te) => sum + te.hours, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title={project.name}
          description={project.description || `Project ${project.code}`}
          breadcrumbs={[
            { label: "Projects", href: "/projects" },
            { label: project.name },
          ]}
          actions={
            <div className="flex gap-2">
              {project.status === 'planning' && (
                <Button size="sm" onClick={() => handleStatusChange('active')}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Project
                </Button>
              )}
              {project.status === 'active' && (
                <>
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange('on_hold')}>
                    <PauseCircle className="h-4 w-4 mr-2" />
                    Put On Hold
                  </Button>
                  <Button size="sm" onClick={() => handleStatusChange('completed')}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                </>
              )}
              {project.status === 'on_hold' && (
                <Button size="sm" onClick={() => handleStatusChange('active')}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
            </div>
          }
        />

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Budget"
            value={formatCurrency(project.budget)}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <MetricCard
            title="Actual Cost"
            value={formatCurrency(project.actualCost)}
            icon={<Receipt className="h-4 w-4" />}
            trend={project.actualCost > project.budget ? "down" : "up"}
          />
          <MetricCard
            title="Revenue"
            value={formatCurrency(project.revenue)}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="Profit Margin"
            value={`${project.profitMargin.toFixed(1)}%`}
            icon={<TrendingUp className="h-4 w-4" />}
            trend={project.profitMargin >= 20 ? "up" : project.profitMargin >= 10 ? undefined : "down"}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Project Details */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Project Details</CardTitle>
                <StatusBadge status={project.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {project.customerName && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Customer</p>
                      <Link href={`/accounts-receivable/customers/${project.customerId}`} className="font-medium hover:underline">
                        {project.customerName}
                      </Link>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Project Manager</p>
                    <p className="font-medium">{project.managerName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{formatDate(project.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{project.endDate ? formatDate(project.endDate) : 'Ongoing'}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">{project.percentComplete}%</span>
                </div>
                <Progress value={project.percentComplete} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Time & Expenses Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Time & Expenses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Hours</span>
                <span className="font-medium">{totalHours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billable Hours</span>
                <span className="font-medium">{billableHours}h</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Expenses</span>
                <span className="font-medium">{formatCurrency(totalExpenses)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Time Entries */}
        {timeEntries.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Time Entries</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/time-expenses?project=${id}`}>View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.slice(0, 5).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell>{entry.employeeName}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{entry.taskDescription}</TableCell>
                      <TableCell className="text-right">{entry.hours}h</TableCell>
                      <TableCell>
                        <StatusBadge status={entry.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
