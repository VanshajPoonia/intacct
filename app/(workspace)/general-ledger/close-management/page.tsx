"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import {
  DenseSectionHeader,
  WorkspaceBreadcrumbRow,
  WorkspaceContentContainer,
  WorkspacePageToolbar,
} from "@/components/layout/workspace-primitives"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  Lock,
  Play,
  RefreshCcw,
  XCircle,
} from "lucide-react"
import { getCloseStatus, getCloseTasks } from "@/lib/services"
import type { CloseStatus, CloseTask, FinanceFilters } from "@/lib/types"
import { cn } from "@/lib/utils"

const toneClasses = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value)
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value)
}

function getStatusIcon(status: CloseTask["status"]) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    case "in_progress":
      return <Play className="h-4 w-4 text-amber-600" />
    case "blocked":
      return <XCircle className="h-4 w-4 text-red-600" />
    case "not_started":
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

function getStatusTone(status: CloseTask["status"]) {
  switch (status) {
    case "completed":
      return "positive"
    case "in_progress":
      return "warning"
    case "blocked":
      return "critical"
    default:
      return "neutral"
  }
}

export default function CloseManagementPage() {
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [closeStatus, setCloseStatus] = useState<CloseStatus | null>(null)
  const [closeTasks, setCloseTasks] = useState<CloseTask[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!activeEntity || !dateRange) {
      return
    }

    const filters: FinanceFilters = {
      entityId: activeEntity.id,
      dateRange,
    }

    setIsLoading(true)

    Promise.all([getCloseStatus(filters), getCloseTasks(filters)])
      .then(([status, tasks]) => {
        setCloseStatus(status)
        setCloseTasks(tasks)
        setIsLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load close management data")
        setIsLoading(false)
      })
  }, [activeEntity?.id, dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime()])

  if (!activeEntity || !dateRange) {
    return null
  }

  const notStartedTasks = closeTasks.filter(task => task.status === "not_started")
  const inProgressTasks = closeTasks.filter(task => task.status === "in_progress")
  const completedTasks = closeTasks.filter(task => task.status === "completed")
  const blockedTasks = closeTasks.filter(task => task.status === "blocked")

  return (
    <WorkspaceContentContainer className="gap-5">
      <WorkspacePageToolbar>
        <WorkspaceBreadcrumbRow>
          <Breadcrumbs />
        </WorkspaceBreadcrumbRow>
      </WorkspacePageToolbar>

      <DenseSectionHeader
        eyebrow="Period Close"
        title="Close Management"
        description="Monitor and manage period close activities, task assignments, and completion status."
        actions={
          <>
            <Button variant="outline" size="sm" className="rounded-sm" onClick={() => toast.info("Refresh initiated")}>
              <RefreshCcw className="mr-1.5 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" className="rounded-sm" onClick={() => toast.info("Lock period workflow will open")}>
              <Lock className="mr-1.5 h-4 w-4" />
              Lock Period
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-sm border border-border/80 bg-muted" />
          ))}
        </div>
      ) : closeStatus ? (
        <>
          <section className="border border-border/80 bg-card/90 px-5 py-5 shadow-sm">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Current Period
                  </div>
                  <div className="text-lg font-semibold text-foreground">{closeStatus.currentPeriodLabel}</div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-sm px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                    closeStatus.progressPercent >= 90
                      ? toneClasses.positive
                      : closeStatus.progressPercent >= 50
                        ? toneClasses.warning
                        : toneClasses.neutral
                  )}
                >
                  {closeStatus.progressPercent}% Complete
                </Badge>
              </div>

              <div className="space-y-2">
                <Progress value={closeStatus.progressPercent} className="h-3" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{closeStatus.completedTasks} of {closeStatus.totalTasks} tasks completed</span>
                  <span>{closeStatus.overdueTasks} overdue, {closeStatus.blockedTasks} blocked</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-border/80">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Not Started</div>
                    <div className="text-2xl font-semibold">{notStartedTasks.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-amber-50">
                    <Play className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">In Progress</div>
                    <div className="text-2xl font-semibold">{inProgressTasks.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-50">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Completed</div>
                    <div className="text-2xl font-semibold">{completedTasks.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-red-50">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Blocked</div>
                    <div className="text-2xl font-semibold">{blockedTasks.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <section className="space-y-4 border border-border/80 bg-card/95 px-4 py-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Phase Breakdown
              </div>
              <div className="text-xs text-muted-foreground">{closeStatus.phaseBreakdown.length} phases</div>
            </div>
            <Separator />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {closeStatus.phaseBreakdown.map(phase => {
                const percentage = phase.total === 0 ? 0 : Math.round((phase.completed / phase.total) * 100)
                return (
                  <div key={phase.phase} className="space-y-2 border border-border/70 bg-background px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium capitalize">{phase.phase.replace("_", " ")}</div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]",
                          percentage === 100 ? toneClasses.positive : percentage >= 50 ? toneClasses.warning : toneClasses.neutral
                        )}
                      >
                        {percentage}%
                      </Badge>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {phase.completed} of {phase.total} tasks
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="space-y-4 border border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold">Close Tasks</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/80 bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Task</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Phase</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Owner</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Due Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closeTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        No close tasks found for the current period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    closeTasks.map(task => (
                      <TableRow key={task.id} className="border-b border-border/60">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{task.name}</div>
                            {task.blockerReason ? (
                              <div className="text-xs text-red-600">{task.blockerReason}</div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm capitalize text-foreground">{task.phase.replace("_", " ")}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">{task.ownerName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">{formatShortDate(task.dueDate)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                                toneClasses[getStatusTone(task.status)]
                              )}
                            >
                              {task.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="text-sm text-muted-foreground">{task.documentCount} docs</div>
                            {task.exceptionCount > 0 ? (
                              <Badge variant="outline" className={cn("rounded-sm px-2 py-0.5 text-[10px]", toneClasses.critical)}>
                                {task.exceptionCount} exceptions
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </section>
        </>
      ) : (
        <div className="border border-border/80 bg-card/95 px-6 py-12 text-center">
          <FileCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <div className="mt-4 text-lg font-medium text-foreground">No Close Data</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Unable to load close management data for the selected entity and period.
          </div>
        </div>
      )}
    </WorkspaceContentContainer>
  )
}
