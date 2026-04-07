"use client"

import { useEffect, useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { RecordDetailDrawer } from "@/components/finance/record-detail-drawer"
import { TabbedOperatorWorkspace } from "@/components/finance/tabbed-operator-workspace"
import type { OperatorTableColumn } from "@/components/finance/operator-data-table"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { Badge } from "@/components/ui/badge"
import {
  deleteSavedView,
  getContractDetail,
  getContractsRevenueDefaultSection,
  getContractsRevenueOverview,
  getContractsRevenueTabs,
  getContractsWorkspace,
  getRevenueRecognitionDetail,
  getRevenueRecognitionWorkspace,
  getRevenueScheduleDetail,
  getRevenueSchedulesWorkspace,
  getSavedViews,
  postRevenueRecognition,
  releaseRevenueRecognitionHold,
  saveContract,
  saveView,
  setDefaultView,
} from "@/lib/services"
import type {
  Contract,
  ContractsRevenueSectionId,
  ModuleOverviewData,
  RevenueRecognitionEvent,
  RevenueSchedule,
  SavedView,
  SortConfig,
  WorkspaceDetailAction,
  WorkspaceDetailData,
  WorkspaceTabItem,
} from "@/lib/types"
import { cn } from "@/lib/utils"

type RevenueRow = Contract | RevenueSchedule | RevenueRecognitionEvent

interface RevenueLocalFilters {
  search: string
  status: string
  departmentId: string
  projectId: string
}

interface RevenueViewFilters extends RevenueLocalFilters {
  tabId: ContractsRevenueSectionId
}

const defaultLocalFilters: RevenueLocalFilters = {
  search: "",
  status: "all",
  departmentId: "all",
  projectId: "all",
}

const defaultColumnsByTab: Record<ContractsRevenueSectionId, string[]> = {
  contracts: ["name", "customer", "status", "value", "recognized", "deferred", "dates"],
  revenue_schedules: ["name", "customer", "method", "status", "value", "deferred", "next"],
  recognition_queue: ["name", "customer", "status", "amount", "date", "note"],
  exceptions: ["name", "customer", "status", "amount", "date", "note"],
}

const toneClasses = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value?: Date) {
  if (!value) {
    return "None"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value)
}

function statusTone(status?: string) {
  switch (status) {
    case "active":
    case "posted":
    case "completed":
      return "positive"
    case "queued":
    case "draft":
      return "warning"
    case "hold":
    case "held":
    case "terminated":
      return "critical"
    default:
      return "neutral"
  }
}

function isContract(row: RevenueRow): row is Contract {
  return "contractValue" in row
}

function isRevenueSchedule(row: RevenueRow): row is RevenueSchedule {
  return "recognitionMethod" in row
}

function isRecognitionEvent(row: RevenueRow): row is RevenueRecognitionEvent {
  return "recognitionDate" in row && "description" in row
}

function parseRevenueViewFilters(value: Record<string, unknown> | undefined, fallbackTab: ContractsRevenueSectionId): RevenueViewFilters {
  return {
    tabId: typeof value?.tabId === "string" ? (value.tabId as ContractsRevenueSectionId) : fallbackTab,
    search: typeof value?.search === "string" ? value.search : "",
    status: typeof value?.status === "string" ? value.status : "all",
    departmentId: typeof value?.departmentId === "string" ? value.departmentId : "all",
    projectId: typeof value?.projectId === "string" ? value.projectId : "all",
  }
}

export function ContractsRevenuePage() {
  const { toast } = useToast()
  const { activeEntity, activeRole, dateRange } = useWorkspaceShell()
  const activeRoleId = activeRole?.id

  const [overview, setOverview] = useState<ModuleOverviewData | null>(null)
  const [tabs, setTabs] = useState<WorkspaceTabItem[]>([])
  const [rowsResponse, setRowsResponse] = useState<any>(null)
  const [detail, setDetail] = useState<WorkspaceDetailData | null>(null)
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isViewsLoading, setIsViewsLoading] = useState(true)
  const [isSavingView, setIsSavingView] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [didApplyDefaultView, setDidApplyDefaultView] = useState(false)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<SortConfig>({ key: "recognitionDate", direction: "asc" })
  const [filters, setFilters] = useState<RevenueLocalFilters>(defaultLocalFilters)
  const [activeTab, setActiveTab] = useState<ContractsRevenueSectionId>("recognition_queue")
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(defaultColumnsByTab.recognition_queue)

  const scopedFilters = useMemo(
    () =>
      activeEntity && dateRange
        ? {
            entityId: activeEntity.id,
            dateRange,
            projectId: filters.projectId !== "all" ? filters.projectId : undefined,
          }
        : null,
    [activeEntity, dateRange, filters.projectId]
  )

  useEffect(() => {
    if (!activeRole) {
      return
    }

    const nextTab = getContractsRevenueDefaultSection(activeRoleId)
    setActiveTab(nextTab)
    setVisibleColumnIds(defaultColumnsByTab[nextTab])
    setSort({ key: nextTab === "contracts" ? "createdAt" : nextTab === "revenue_schedules" ? "nextRecognitionDate" : "recognitionDate", direction: nextTab === "contracts" ? "desc" : "asc" })
    setFilters(defaultLocalFilters)
    setActiveViewId(null)
    setDidApplyDefaultView(false)
    setPage(1)
    setSelectedIds([])
  }, [activeRoleId])

  useEffect(() => {
    if (!scopedFilters || !activeRoleId) {
      return
    }

    let cancelled = false
    setIsViewsLoading(true)

    Promise.all([
      getContractsRevenueOverview(scopedFilters, activeRoleId),
      getContractsRevenueTabs(scopedFilters, activeRoleId),
      getSavedViews("contracts-revenue"),
    ]).then(([nextOverview, nextTabs, nextViews]) => {
      if (cancelled) {
        return
      }

      setOverview(nextOverview)
      setTabs(nextTabs)
      setSavedViews(nextViews.filter(view => !view.roleScope?.length || view.roleScope.includes(activeRoleId)))
      setIsViewsLoading(false)
    }).catch(() => {
      if (!cancelled) {
        setIsViewsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [scopedFilters, activeRoleId, reloadKey])

  useEffect(() => {
    if (!savedViews.length || didApplyDefaultView || !activeRoleId) {
      return
    }

    const defaultView = savedViews.find(view => view.isDefault)
    if (!defaultView) {
      setDidApplyDefaultView(true)
      return
    }

    applyView(defaultView, getContractsRevenueDefaultSection(activeRoleId))
    setDidApplyDefaultView(true)
  }, [savedViews, didApplyDefaultView, activeRoleId])

  useEffect(() => {
    if (!scopedFilters) {
      return
    }

    let cancelled = false
    setIsLoading(true)

    const query = {
      search: filters.search,
      status: filters.status,
      projectId: filters.projectId,
      page,
      pageSize,
      sort,
    }

    const load =
      activeTab === "contracts"
        ? getContractsWorkspace(scopedFilters, query)
        : activeTab === "revenue_schedules"
          ? getRevenueSchedulesWorkspace(scopedFilters, query)
          : activeTab === "recognition_queue"
            ? getRevenueRecognitionWorkspace(scopedFilters, query, "queue")
            : getRevenueRecognitionWorkspace(scopedFilters, query, "exceptions")

    load.then(result => {
      if (cancelled) {
        return
      }

      setRowsResponse(result)
      setIsLoading(false)
      setSelectedIds(previous => previous.filter(id => result.data.some((row: RevenueRow) => row.id === id)))
    }).catch(() => {
      if (!cancelled) {
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [scopedFilters, activeTab, filters.search, filters.status, filters.projectId, page, pageSize, sort, reloadKey])

  useEffect(() => {
    if (!drawerId) {
      setDetail(null)
      return
    }

    const load =
      activeTab === "contracts"
        ? getContractDetail(drawerId)
        : activeTab === "revenue_schedules"
          ? getRevenueScheduleDetail(drawerId)
          : getRevenueRecognitionDetail(drawerId)

    load.then(setDetail)
  }, [drawerId, activeTab, reloadKey])

  async function handlePrimaryAction(actionId: string) {
    if (!activeEntity) {
      return
    }

    if (actionId === "new-contract") {
      await saveContract({
        name: `New services agreement ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date())}`,
        customerId: "c-apex",
        customerName: "Apex Retail Group",
        entityId: activeEntity.id,
        contractValue: 185000,
        startDate: new Date(),
        endDate: new Date("2027-03-31"),
      })
      setActiveTab("contracts")
      setReloadKey(previous => previous + 1)
      toast({ title: "Contract created", description: "A new draft contract was added to the workspace." })
      return
    }

    if (actionId === "post-recognition") {
      const event = rowsResponse?.data.find((row: RevenueRow) => isRecognitionEvent(row)) as RevenueRecognitionEvent | undefined
      if (event) {
        await postRevenueRecognition(event.id)
        setReloadKey(previous => previous + 1)
        toast({ title: "Recognition posted", description: "The revenue event was posted and balances were updated." })
      }
    }

    if (actionId === "release-hold") {
      const event = rowsResponse?.data.find((row: RevenueRow) => isRecognitionEvent(row)) as RevenueRecognitionEvent | undefined
      if (event) {
        await releaseRevenueRecognitionHold(event.id)
        setReloadKey(previous => previous + 1)
        toast({ title: "Hold released", description: "The event moved back into the recognition queue." })
      }
    }
  }

  async function handleDrawerAction(action: WorkspaceDetailAction) {
    if (!detail) {
      return
    }

    if (action.id === "post-recognition") {
      await postRevenueRecognition(detail.id)
      setReloadKey(previous => previous + 1)
      toast({ title: "Recognition posted", description: "The event was posted from the drawer." })
      return
    }

    await handlePrimaryAction(action.id)
  }

  function applyView(view: SavedView, fallbackTab: ContractsRevenueSectionId) {
    const parsed = parseRevenueViewFilters(view.filters, fallbackTab)
    setActiveTab(parsed.tabId)
    setFilters({
      search: parsed.search,
      status: parsed.status,
      departmentId: parsed.departmentId,
      projectId: parsed.projectId,
    })
    setSort({
      key: view.sortBy ?? (parsed.tabId === "contracts" ? "createdAt" : parsed.tabId === "revenue_schedules" ? "nextRecognitionDate" : "recognitionDate"),
      direction: view.sortDirection ?? (parsed.tabId === "contracts" ? "desc" : "asc"),
    })
    setVisibleColumnIds((view.columns as string[] | undefined) ?? defaultColumnsByTab[parsed.tabId])
    setPage(1)
    setActiveViewId(view.id)
    setSelectedIds([])
  }

  async function handleSaveView(payload: { name: string; isDefault: boolean }) {
    if (!activeRole) {
      return
    }

    setIsSavingView(true)
    try {
      const view = await saveView({
        name: payload.name,
        module: "contracts-revenue",
        filters: {
          tabId: activeTab,
          search: filters.search,
          status: filters.status,
          projectId: filters.projectId,
          departmentId: filters.departmentId,
        },
        columns: visibleColumnIds,
        sortBy: sort.key,
        sortDirection: sort.direction,
        isDefault: payload.isDefault,
        roleScope: [activeRole.id],
      })
      const nextViews = await getSavedViews("contracts-revenue")
      setSavedViews(nextViews.filter(candidate => !candidate.roleScope?.length || candidate.roleScope.includes(activeRole.id)))
      setActiveViewId(view.id)
    } finally {
      setIsSavingView(false)
    }
  }

  async function handleDeleteView(view: SavedView) {
    if (!activeRole) {
      return
    }

    await deleteSavedView(view.id)
    const nextViews = await getSavedViews("contracts-revenue")
    setSavedViews(nextViews.filter(candidate => !candidate.roleScope?.length || candidate.roleScope.includes(activeRole.id)))
    setActiveViewId(previous => previous === view.id ? null : previous)
  }

  async function handleSetDefaultView(view: SavedView) {
    if (!activeRole) {
      return
    }

    await setDefaultView(view.id, "contracts-revenue")
    const nextViews = await getSavedViews("contracts-revenue")
    setSavedViews(nextViews.filter(candidate => !candidate.roleScope?.length || candidate.roleScope.includes(activeRole.id)))
    setActiveViewId(view.id)
  }

  async function handleBulkAction() {
    const selectedRows = rowsResponse?.data.filter((row: RevenueRow) => selectedIds.includes(row.id)) ?? []
    if (activeTab === "recognition_queue") {
      await Promise.all(selectedRows.filter(isRecognitionEvent).map((row: RevenueRecognitionEvent) => postRevenueRecognition(row.id)))
    }
    if (activeTab === "exceptions") {
      await Promise.all(selectedRows.filter(isRecognitionEvent).map((row: RevenueRecognitionEvent) => releaseRevenueRecognitionHold(row.id)))
    }
    setSelectedIds([])
    setReloadKey(previous => previous + 1)
  }

  const allColumns = useMemo<Record<string, OperatorTableColumn<RevenueRow>>>(() => ({
    name: {
      id: "name",
      label: activeTab === "contracts" ? "Contract" : activeTab === "revenue_schedules" ? "Schedule" : "Recognition Item",
      sortKey: activeTab === "contracts" ? "name" : "contractName",
      widthClassName: "min-w-[260px]",
      render: row => (
        <div className="space-y-1">
          <div className="font-medium text-foreground">
            {isContract(row)
              ? `${row.number} · ${row.name}`
              : isRevenueSchedule(row)
                ? `${row.contractNumber} · ${row.contractName}`
                : row.contractNumber}
          </div>
          <div className="text-sm text-muted-foreground">
            {isRecognitionEvent(row) ? row.description : isContract(row) ? row.customerName : row.recognitionMethod}
          </div>
        </div>
      ),
    },
    customer: {
      id: "customer",
      label: "Customer",
      sortKey: "customerName",
      widthClassName: "min-w-[180px]",
      render: row => <span className="text-sm text-foreground">{isContract(row) ? row.customerName : isRevenueSchedule(row) ? row.customerName : row.contractNumber}</span>,
    },
    status: {
      id: "status",
      label: "Status",
      sortKey: "status",
      widthClassName: "min-w-[140px]",
      render: row => (
        <Badge variant="outline" className={cn("rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]", toneClasses[statusTone(row.status)])}>
          {row.status.replace(/_/g, " ")}
        </Badge>
      ),
    },
    value: {
      id: "value",
      label: "Value",
      sortKey: activeTab === "contracts" ? "contractValue" : "totalValue",
      align: "right",
      widthClassName: "min-w-[140px]",
      render: row => <span className="text-sm font-medium text-foreground">{formatMoney(isContract(row) ? row.contractValue : isRevenueSchedule(row) ? row.totalValue : row.amount)}</span>,
    },
    recognized: {
      id: "recognized",
      label: "Recognized",
      sortKey: "recognizedRevenue",
      align: "right",
      widthClassName: "min-w-[140px]",
      render: row => <span className="text-sm font-medium text-foreground">{formatMoney(isContract(row) ? row.recognizedRevenue : 0)}</span>,
    },
    deferred: {
      id: "deferred",
      label: "Deferred",
      sortKey: activeTab === "contracts" ? "deferredRevenue" : "deferredBalance",
      align: "right",
      widthClassName: "min-w-[140px]",
      render: row => <span className="text-sm font-medium text-foreground">{formatMoney(isContract(row) ? row.deferredRevenue : isRevenueSchedule(row) ? row.deferredBalance : 0)}</span>,
    },
    dates: {
      id: "dates",
      label: "Dates",
      widthClassName: "min-w-[150px]",
      render: row => (
        <div className="space-y-1 text-sm">
          <div>{isContract(row) ? formatDate(row.startDate) : "—"}</div>
          <div className="text-muted-foreground">{isContract(row) ? formatDate(row.endDate) : ""}</div>
        </div>
      ),
    },
    method: {
      id: "method",
      label: "Method",
      sortKey: "recognitionMethod",
      widthClassName: "min-w-[140px]",
      render: row => <span className="text-sm text-foreground">{isRevenueSchedule(row) ? row.recognitionMethod : "—"}</span>,
    },
    next: {
      id: "next",
      label: "Next Recognition",
      sortKey: "nextRecognitionDate",
      widthClassName: "min-w-[150px]",
      render: row => <span className="text-sm text-foreground">{formatDate(isRevenueSchedule(row) ? row.nextRecognitionDate : undefined)}</span>,
    },
    amount: {
      id: "amount",
      label: "Amount",
      sortKey: "amount",
      align: "right",
      widthClassName: "min-w-[140px]",
      render: row => <span className="text-sm font-medium text-foreground">{formatMoney(isRecognitionEvent(row) ? row.amount : 0)}</span>,
    },
    date: {
      id: "date",
      label: "Date",
      sortKey: "recognitionDate",
      widthClassName: "min-w-[130px]",
      render: row => <span className="text-sm text-foreground">{formatDate(isRecognitionEvent(row) ? row.recognitionDate : undefined)}</span>,
    },
    note: {
      id: "note",
      label: "Note",
      widthClassName: "min-w-[220px]",
      render: row => <span className="text-sm text-muted-foreground">{isRecognitionEvent(row) ? row.exceptionReason ?? row.description : "—"}</span>,
    },
  }), [activeTab])

  const visibleColumns = useMemo(() => {
    const nextIds = visibleColumnIds.length ? visibleColumnIds : defaultColumnsByTab[activeTab]
    return nextIds.map(columnId => allColumns[columnId]).filter(Boolean)
  }, [activeTab, allColumns, visibleColumnIds])

  if (!overview || !rowsResponse || !activeRole) {
    return null
  }

  return (
    <TabbedOperatorWorkspace
      moduleLabel="Contracts & Revenue"
      eyebrow={overview.badge}
      title={overview.title}
      description={overview.subtitle}
      metrics={rowsResponse.metrics}
      actions={[...overview.actions, ...rowsResponse.actions.filter((action: any) => !overview.actions.some(existing => existing.id === action.id))]}
      actionHandlers={{
        "new-contract": () => void handlePrimaryAction("new-contract"),
        "post-recognition": () => void handlePrimaryAction("post-recognition"),
        "release-hold": () => void handlePrimaryAction("release-hold"),
      }}
      tabs={tabs}
      activeTabId={activeTab}
      onTabChange={tabId => {
        const nextTab = tabId as ContractsRevenueSectionId
        setActiveTab(nextTab)
        setVisibleColumnIds(defaultColumnsByTab[nextTab])
        setSelectedIds([])
        setPage(1)
      }}
      savedViews={savedViews}
      activeViewId={activeViewId}
      viewsLoading={isViewsLoading}
      viewsSaving={isSavingView}
      onApplySavedView={view => applyView(view, getContractsRevenueDefaultSection(activeRole.id))}
      onSaveView={handleSaveView}
      onDeleteView={view => void handleDeleteView(view)}
      onSetDefaultView={view => void handleSetDefaultView(view)}
      search={filters.search}
      onSearchChange={value => {
        setFilters(previous => ({ ...previous, search: value }))
        setPage(1)
      }}
      searchPlaceholder="Search contracts, schedules, customers, or recognition notes..."
      filters={(rowsResponse.filters ?? []).map((definition: any) => ({
        ...definition,
        value: definition.id === "status" ? filters.status : filters.projectId,
        onChange: (value: string) => {
          setFilters(previous => ({ ...previous, [definition.id]: value }))
          setPage(1)
        },
      }))}
      visibleColumnIds={visibleColumnIds}
      onToggleColumn={(columnId, visible) => {
        setVisibleColumnIds(previous => {
          const next = visible ? [...new Set([...previous, columnId])] : previous.filter(existing => existing !== columnId)
          return next.length ? next : defaultColumnsByTab[activeTab]
        })
      }}
      columnOptions={defaultColumnsByTab[activeTab].map(columnId => ({ id: columnId, label: allColumns[columnId]?.label ?? columnId }))}
      bulkActions={(activeTab === "recognition_queue" || activeTab === "exceptions") && selectedIds.length ? [{ id: "bulk-post", label: activeTab === "recognition_queue" ? "Post Selected" : "Release Selected", icon: "BadgeCheck", onClick: () => void handleBulkAction() }] : []}
      rows={rowsResponse.data}
      columns={visibleColumns}
      rowId={row => row.id}
      sort={sort}
      selectedIds={selectedIds}
      page={rowsResponse.page}
      pageSize={rowsResponse.pageSize}
      total={rowsResponse.total}
      totalPages={rowsResponse.totalPages}
      emptyMessage={rowsResponse.emptyMessage}
      isLoading={isLoading}
      drawer={
        <RecordDetailDrawer
          detail={detail}
          open={Boolean(drawerId)}
          onOpenChange={open => setDrawerId(open ? drawerId : null)}
          onAction={action => void handleDrawerAction(action)}
        />
      }
      onRowClick={row => setDrawerId(row.id)}
      onSortChange={setSort}
      onSelectedIdsChange={setSelectedIds}
      onPageChange={setPage}
      onPageSizeChange={value => {
        setPageSize(value)
        setPage(1)
      }}
    />
  )
}
