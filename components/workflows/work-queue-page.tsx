"use client"

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react"
import { FilterX, Inbox, RefreshCcw, Settings2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import {
  DenseSectionHeader,
  WorkspaceBreadcrumbRow,
  WorkspaceContentContainer,
  WorkspacePageToolbar,
} from "@/components/layout/workspace-primitives"
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import { WorkQueueTable } from "@/components/tables/work-queue-table"
import { WorkQueueDetailDrawer } from "@/components/workflows/work-queue-detail-drawer"
import { WorkQueueSavedViews } from "@/components/workflows/work-queue-saved-views"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  applyBulkWorkQueueAction,
  applyWorkQueueAction,
  deleteSavedView,
  getWorkQueueFilterOptions,
  getWorkQueueItemDetail,
  getWorkQueueItems,
  getWorkQueueSavedViews,
  getWorkQueueSummary,
  saveWorkQueueView,
  setDefaultView,
} from "@/lib/services"
import type {
  SavedView,
  SortConfig,
  WorkQueueActionId,
  WorkQueueColumnId,
  WorkQueueDetail,
  WorkQueueFilterOptions,
  WorkQueueFilters,
  WorkQueueItemsResponse,
  WorkQueueSectionId,
  WorkQueueStatus,
  WorkQueueSummary,
} from "@/lib/types"
import { getShellIcon } from "@/lib/utils/shell-icons"
import { cn } from "@/lib/utils"

const defaultSectionId: WorkQueueSectionId = "needs_review"
const defaultSort: SortConfig = { key: "dueDate", direction: "asc" }

const toneClasses = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const

function formatDateWindow(startDate: Date, endDate: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(startDate) + " - " +
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(endDate)
}

function isSectionId(value: unknown): value is WorkQueueSectionId {
  return [
    "needs_review",
    "approvals",
    "reconciliation_exceptions",
    "missing_documents",
    "import_errors",
    "close_tasks",
    "assigned_to_me",
  ].includes(String(value))
}

function isWorkQueueStatus(value: unknown): value is WorkQueueStatus {
  return [
    "new",
    "needs_review",
    "pending_approval",
    "requested",
    "in_progress",
    "blocked",
    "error",
    "retrying",
    "snoozed",
    "reviewed",
    "resolved",
    "completed",
  ].includes(String(value))
}

interface QueueLocalState {
  sectionId: WorkQueueSectionId
  search: string
  departmentId: string
  projectId: string
  status: string
  assigneeId: string
}

const defaultLocalState: QueueLocalState = {
  sectionId: defaultSectionId,
  search: "",
  departmentId: "all",
  projectId: "all",
  status: "all",
  assigneeId: "all",
}

export function WorkQueuePage() {
  const { toast } = useToast()
  const { activeEntity, activeRole, currentUser, dateRange } = useWorkspaceShell()

  const [localState, setLocalState] = useState<QueueLocalState>(defaultLocalState)
  const [sort, setSort] = useState<SortConfig>(defaultSort)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [visibleColumnIds, setVisibleColumnIds] = useState<WorkQueueColumnId[]>([])
  const [summary, setSummary] = useState<WorkQueueSummary | null>(null)
  const [tableData, setTableData] = useState<WorkQueueItemsResponse | null>(null)
  const [filterOptions, setFilterOptions] = useState<WorkQueueFilterOptions | null>(null)
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null)
  const [detail, setDetail] = useState<WorkQueueDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isViewsLoading, setIsViewsLoading] = useState(true)
  const [isSavingView, setIsSavingView] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [didApplyDefaultView, setDidApplyDefaultView] = useState(false)

  const deferredSearch = useDeferredValue(localState.search)

  const effectiveFilters = useMemo<WorkQueueFilters>(
    () => ({
      entityId: activeEntity?.id,
      dateRange: dateRange ?? undefined,
      sectionId: localState.sectionId,
      search: deferredSearch || undefined,
      departmentId: localState.departmentId !== "all" ? localState.departmentId : undefined,
      projectId: localState.projectId !== "all" ? localState.projectId : undefined,
      assigneeId: localState.assigneeId !== "all" ? localState.assigneeId : undefined,
      status: localState.status !== "all" ? [localState.status as WorkQueueStatus] : undefined,
    }),
    [
      activeEntity?.id,
      dateRange,
      deferredSearch,
      localState.assigneeId,
      localState.departmentId,
      localState.projectId,
      localState.sectionId,
      localState.status,
    ]
  )

  useEffect(() => {
    setDidApplyDefaultView(false)
    setActiveViewId(null)
  }, [activeRole?.id])

  useEffect(() => {
    if (!activeEntity || !activeRole || !currentUser) {
      return
    }

    let cancelled = false
    setIsViewsLoading(true)

    Promise.all([
      getWorkQueueFilterOptions(
        {
          entityId: activeEntity.id,
          dateRange,
          sectionId: localState.sectionId,
        },
        currentUser.id
      ),
      getWorkQueueSavedViews(activeRole.id),
    ])
      .then(([options, views]) => {
        if (cancelled) {
          return
        }

        startTransition(() => {
          setFilterOptions(options)
          setSavedViews(views)
          setIsViewsLoading(false)
        })
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setIsViewsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeEntity?.id, activeRole?.id, currentUser?.id, dateRange, localState.sectionId])

  useEffect(() => {
    if (didApplyDefaultView || !savedViews.length) {
      return
    }

    const defaultView = savedViews.find(view => view.isDefault)
    if (defaultView) {
      applySavedView(defaultView)
    }
    setDidApplyDefaultView(true)
  }, [didApplyDefaultView, savedViews])

  useEffect(() => {
    if (!activeEntity || !currentUser || !dateRange) {
      return
    }

    let cancelled = false
    setIsLoading(true)

    Promise.all([
      getWorkQueueSummary(effectiveFilters, currentUser.id),
      getWorkQueueItems(
        effectiveFilters,
        {
          page,
          pageSize,
          sort,
        },
        currentUser.id
      ),
    ])
      .then(([summaryResult, tableResult]) => {
        if (cancelled) {
          return
        }

        startTransition(() => {
          setSummary(summaryResult)
          setTableData(tableResult)
          setIsLoading(false)
        })
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentUser?.id, effectiveFilters, page, pageSize, reloadKey, sort, activeEntity?.id, dateRange])

  useEffect(() => {
    if (!tableData?.activeSection) {
      return
    }

    setVisibleColumnIds(previous => {
      const allowed = tableData.activeSection?.columns ?? []
      const preserved = previous.filter(columnId => allowed.includes(columnId))
      return preserved.length ? preserved : allowed
    })
  }, [tableData?.activeSection?.id, tableData?.activeSection?.columns])

  useEffect(() => {
    if (!tableData) {
      return
    }

    const pageIds = tableData.data.map(item => item.id)
    setSelectedIds(previous => previous.filter(id => pageIds.includes(id)))
  }, [tableData?.data])

  useEffect(() => {
    if (!drawerItemId || !currentUser) {
      setDetail(null)
      return
    }

    let cancelled = false

    getWorkQueueItemDetail(drawerItemId, currentUser.id).then(result => {
      if (!cancelled) {
        setDetail(result)
        if (!result) {
          setDrawerItemId(null)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [drawerItemId, currentUser?.id, reloadKey])

  if (!activeEntity || !activeRole || !currentUser || !dateRange) {
    return null
  }

  function handleLocalStateChange<K extends keyof QueueLocalState>(key: K, value: QueueLocalState[K]) {
    setPage(1)
    setSelectedIds([])
    setActiveViewId(null)
    setLocalState(previous => ({ ...previous, [key]: value }))
  }

  function handleSectionChange(sectionId: WorkQueueSectionId) {
    const nextSection = summary?.sections.find(section => section.id === sectionId)
    setLocalState(previous => ({ ...previous, sectionId }))
    setSort(nextSection?.defaultSort ?? defaultSort)
    setVisibleColumnIds(nextSection?.columns ?? [])
    setPage(1)
    setSelectedIds([])
    setActiveViewId(null)
  }

  function applySavedView(view: SavedView) {
    const filters = view.filters as Record<string, unknown>
    const nextSectionId = isSectionId(filters.sectionId) ? filters.sectionId : defaultSectionId
    const nextStatus = Array.isArray(filters.status) && isWorkQueueStatus(filters.status[0]) ? String(filters.status[0]) : "all"
    const nextSearch = typeof filters.search === "string" ? filters.search : ""
    const nextDepartmentId = typeof filters.departmentId === "string" ? filters.departmentId : "all"
    const nextProjectId = typeof filters.projectId === "string" ? filters.projectId : "all"
    const nextAssigneeId = typeof filters.assigneeId === "string" ? filters.assigneeId : "all"

    setLocalState({
      sectionId: nextSectionId,
      search: nextSearch,
      departmentId: nextDepartmentId,
      projectId: nextProjectId,
      status: nextStatus,
      assigneeId: nextAssigneeId,
    })
    setSort(
      view.sortBy
        ? {
            key: view.sortBy,
            direction: view.sortDirection ?? "asc",
          }
        : summary?.sections.find(section => section.id === nextSectionId)?.defaultSort ?? defaultSort
    )
    setVisibleColumnIds((view.columns as WorkQueueColumnId[] | undefined) ?? [])
    setPage(1)
    setSelectedIds([])
    setActiveViewId(view.id)
  }

  async function refreshViews(nextActiveId?: string | null) {
    const views = await getWorkQueueSavedViews(activeRole.id)
    setSavedViews(views)
    setActiveViewId(nextActiveId ?? activeViewId)
  }

  async function handleSaveView(payload: { name: string; isDefault: boolean }) {
    setIsSavingView(true)

    try {
      const view = await saveWorkQueueView({
        name: payload.name,
        filters: effectiveFilters,
        columns: visibleColumnIds,
        sort,
        isDefault: payload.isDefault,
        roleScope: [activeRole.id],
      })

      await refreshViews(view.id)
      toast({
        title: "View saved",
        description: `"${view.name}" is now available in the work queue.`,
      })
    } catch {
      toast({
        title: "Save failed",
        description: "The view could not be saved.",
        variant: "destructive",
      })
    } finally {
      setIsSavingView(false)
    }
  }

  async function handleDeleteView(view: SavedView) {
    await deleteSavedView(view.id)
    await refreshViews(activeViewId === view.id ? null : activeViewId)
    toast({
      title: "View deleted",
      description: `"${view.name}" was removed.`,
    })
  }

  async function handleSetDefaultView(view: SavedView) {
    await setDefaultView(view.id, "work-queue")
    await refreshViews(view.id)
    toast({
      title: "Default updated",
      description: `"${view.name}" is now the default queue view.`,
    })
  }

  async function executeQueueAction(actionId: WorkQueueActionId, payload?: { assigneeId?: string; assigneeName?: string }, itemIds?: string[]) {
    const targetIds = itemIds ?? (drawerItemId ? [drawerItemId] : [])
    if (!targetIds.length) {
      return
    }

    setIsMutating(true)

    try {
      if (targetIds.length === 1) {
        await applyWorkQueueAction(
          targetIds[0],
          {
            actionId,
            assigneeId: payload?.assigneeId,
            assigneeName: payload?.assigneeName,
          },
          effectiveFilters,
          currentUser.id
        )
      } else {
        await applyBulkWorkQueueAction(
          targetIds,
          {
            actionId,
            assigneeId: payload?.assigneeId,
            assigneeName: payload?.assigneeName,
          },
          effectiveFilters,
          currentUser.id
        )
      }

      setSelectedIds([])
      setReloadKey(previous => previous + 1)

      const actionLabel = actionId.replace(/_/g, " ")
      toast({
        title: "Queue updated",
        description:
          targetIds.length === 1
            ? `Applied ${actionLabel} to the selected item.`
            : `Applied ${actionLabel} to ${targetIds.length} items.`,
      })
    } catch {
      toast({
        title: "Action failed",
        description: "The queue action could not be completed.",
        variant: "destructive",
      })
    } finally {
      setIsMutating(false)
    }
  }

  function toggleVisibleColumn(columnId: WorkQueueColumnId) {
    setVisibleColumnIds(previous => {
      if (previous.includes(columnId)) {
        return previous.length === 1 ? previous : previous.filter(id => id !== columnId)
      }

      return [...previous, columnId]
    })
    setActiveViewId(null)
  }

  function clearFilters() {
    const activeSection = summary?.sections.find(section => section.id === localState.sectionId)
    setLocalState({
      ...defaultLocalState,
      sectionId: localState.sectionId,
    })
    setSort(activeSection?.defaultSort ?? defaultSort)
    setVisibleColumnIds(activeSection?.columns ?? [])
    setPage(1)
    setSelectedIds([])
    setActiveViewId(null)
  }

  const activeSection = tableData?.activeSection ?? summary?.sections.find(section => section.id === localState.sectionId) ?? null
  const activeSectionCount = activeSection?.count ?? 0
  const activeSectionTone =
    activeSection && (activeSection.criticalCount > 0 || activeSection.overdueCount > 0) ? "warning" : "neutral"
  const activeFilterCount =
    Number(localState.departmentId !== "all") +
    Number(localState.projectId !== "all") +
    Number(localState.status !== "all") +
    Number(localState.assigneeId !== "all") +
    Number(Boolean(localState.search))

  const bulkActions = tableData?.availableActions ?? []

  return (
    <>
      <WorkspaceContentContainer>
        <div className="space-y-5">
          <WorkspacePageToolbar className="space-y-4 pb-4">
            <WorkspaceBreadcrumbRow>
              <Breadcrumbs />
            </WorkspaceBreadcrumbRow>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <DenseSectionHeader
                  eyebrow="Accountant Queue"
                  title="Work Queue"
                  description={`Daily accounting workspace for ${activeEntity.name} across ${formatDateWindow(
                    dateRange.startDate,
                    dateRange.endDate
                  )}.`}
                  actions={
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                          toneClasses[activeSectionTone]
                        )}
                      >
                        {activeSection?.label ?? "Queue"}
                      </Badge>
                      <WorkQueueSavedViews
                        views={savedViews}
                        activeViewId={activeViewId}
                        isLoading={isViewsLoading}
                        isSaving={isSavingView}
                        onApplyView={applySavedView}
                        onSaveView={handleSaveView}
                        onDeleteView={handleDeleteView}
                        onSetDefaultView={handleSetDefaultView}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="rounded-sm">
                            <Settings2 className="mr-2 h-4 w-4" />
                            Columns
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {(tableData?.columns ?? []).map(column => (
                            <DropdownMenuCheckboxItem
                              key={column.id}
                              checked={visibleColumnIds.includes(column.id)}
                              onCheckedChange={() => toggleVisibleColumn(column.id)}
                            >
                              {column.label}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  }
                />

                <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[420px]">
                  <div className="border border-border/80 bg-card/80 px-3 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Open Queue
                    </div>
                    <div className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                      {summary?.totalCount ?? 0}
                    </div>
                  </div>
                  <div className="border border-border/80 bg-card/80 px-3 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Attention Items
                    </div>
                    <div className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                      {summary?.attentionCount ?? 0}
                    </div>
                  </div>
                  <div className="border border-border/80 bg-card/80 px-3 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Assigned To Me
                    </div>
                    <div className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                      {summary?.assignedToMeCount ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {(summary?.sections ?? []).map(section => {
                  const Icon = getShellIcon(section.icon)
                  const isActive = section.id === localState.sectionId

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => handleSectionChange(section.id)}
                      className={cn(
                        "min-w-[180px] shrink-0 border px-3 py-3 text-left transition-colors",
                        isActive
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border/80 bg-card/70 text-foreground hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Icon className="h-4 w-4" />
                          {section.label}
                        </div>
                        <div className="text-base font-semibold">{section.count}</div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {section.criticalCount ? <span>{section.criticalCount} critical</span> : null}
                        {section.overdueCount ? <span>{section.overdueCount} overdue</span> : null}
                        {!section.criticalCount && !section.overdueCount ? <span>Operational</span> : null}
                      </div>
                    </button>
                  )
                })}
              </div>

              <section className="grid gap-3 border border-border/80 bg-card/80 px-4 py-4 shadow-sm lg:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,180px))]">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Filter Queue
                  </div>
                  <Input
                    value={localState.search}
                    onChange={event => handleLocalStateChange("search", event.target.value)}
                    placeholder="Search work items, references, owners, or source records"
                    className="h-9 rounded-sm"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Department
                  </div>
                  <Select value={localState.departmentId} onValueChange={value => handleLocalStateChange("departmentId", value)}>
                    <SelectTrigger className="w-full rounded-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {(filterOptions?.departments ?? []).map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Project
                  </div>
                  <Select value={localState.projectId} onValueChange={value => handleLocalStateChange("projectId", value)}>
                    <SelectTrigger className="w-full rounded-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All projects</SelectItem>
                      {(filterOptions?.projects ?? []).map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Status
                  </div>
                  <Select value={localState.status} onValueChange={value => handleLocalStateChange("status", value)}>
                    <SelectTrigger className="w-full rounded-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {(filterOptions?.statuses ?? []).map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Owner
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={localState.assigneeId} onValueChange={value => handleLocalStateChange("assigneeId", value)}>
                      <SelectTrigger className="w-full rounded-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All owners</SelectItem>
                        {(filterOptions?.assignees ?? []).map(option => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="rounded-sm" onClick={clearFilters}>
                      <FilterX className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </section>

              {selectedIds.length ? (
                <section className="flex flex-wrap items-center gap-3 border border-border/80 bg-background px-4 py-3 shadow-sm">
                  <div className="text-sm font-medium text-foreground">
                    {selectedIds.length} item{selectedIds.length === 1 ? "" : "s"} selected
                  </div>
                  <Separator orientation="vertical" className="hidden h-5 sm:block" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-sm" disabled={isMutating}>
                        <Inbox className="mr-2 h-4 w-4" />
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      <DropdownMenuLabel>Apply To Selection</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {bulkActions.map(action => {
                        const Icon = getShellIcon(action.icon)

                        if (action.id === "assign") {
                          return (
                            <DropdownMenuSub key={action.id}>
                              <DropdownMenuSubTrigger>
                                <Icon className="h-4 w-4" />
                                {action.label}
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="w-56">
                                {(filterOptions?.assignees ?? []).map(option => (
                                  <DropdownMenuItem
                                    key={option.id}
                                    onClick={() => executeQueueAction("assign", { assigneeId: option.id, assigneeName: option.label }, selectedIds)}
                                  >
                                    {option.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          )
                        }

                        return (
                          <DropdownMenuItem
                            key={action.id}
                            onClick={() => executeQueueAction(action.id, undefined, selectedIds)}
                          >
                            <Icon className="h-4 w-4" />
                            {action.label}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
                  </div>
                </section>
              ) : null}
            </div>
          </WorkspacePageToolbar>

          <section className="grid gap-3 border border-border/80 bg-card/80 px-4 py-3 shadow-sm md:grid-cols-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Active Section
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">{activeSection?.label ?? "Work Queue"}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                In View
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">{activeSectionCount}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Visible Columns
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">{visibleColumnIds.length}</div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Refresh
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">Service-backed queue state</div>
              </div>
              <Button variant="outline" size="sm" className="rounded-sm" onClick={() => setReloadKey(previous => previous + 1)}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </section>

          <WorkQueueTable
            columns={tableData?.columns ?? []}
            visibleColumnIds={visibleColumnIds}
            data={tableData?.data ?? []}
            selectedIds={selectedIds}
            sort={sort}
            page={tableData?.page ?? page}
            pageSize={tableData?.pageSize ?? pageSize}
            total={tableData?.total ?? 0}
            totalPages={tableData?.totalPages ?? 1}
            isLoading={isLoading}
            onSelectedIdsChange={setSelectedIds}
            onSortChange={nextSort => {
              setSort(nextSort)
              setPage(1)
              setActiveViewId(null)
            }}
            onRowClick={item => {
              setDrawerItemId(item.id)
            }}
            onPageChange={setPage}
            onPageSizeChange={nextPageSize => {
              setPageSize(nextPageSize)
              setPage(1)
            }}
          />
        </div>
      </WorkspaceContentContainer>

      <WorkQueueDetailDrawer
        detail={detail}
        open={Boolean(drawerItemId)}
        onOpenChange={open => {
          if (!open) {
            setDrawerItemId(null)
          }
        }}
        assignees={filterOptions?.assignees ?? []}
        isSubmitting={isMutating}
        onAction={(actionId, payload) => executeQueueAction(actionId, payload, drawerItemId ? [drawerItemId] : [])}
      />
    </>
  )
}
