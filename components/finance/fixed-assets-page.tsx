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
  disposeFixedAsset,
  getAssetLifecycleEventDetail,
  getAssetLifecycleWorkspace,
  getDepreciationRunDetail,
  getDepreciationWorkspace,
  getFixedAssetDetail,
  getFixedAssetsDefaultSection,
  getFixedAssetsOverview,
  getFixedAssetsTabs,
  getFixedAssetsWorkspace,
  getSavedViews,
  runDepreciationPreview,
  saveFixedAsset,
  saveView,
  setDefaultView,
} from "@/lib/services"
import type {
  AssetLifecycleEvent,
  DepreciationScheduleLine,
  FixedAsset,
  FixedAssetsSectionId,
  ModuleOverviewData,
  SavedView,
  SortConfig,
  WorkspaceDetailAction,
  WorkspaceDetailData,
  WorkspaceTabItem,
} from "@/lib/types"
import { cn } from "@/lib/utils"

type FixedAssetRow = FixedAsset | DepreciationScheduleLine | AssetLifecycleEvent

interface AssetLocalFilters {
  search: string
  status: string
  departmentId: string
  projectId: string
}

interface AssetViewFilters extends AssetLocalFilters {
  tabId: FixedAssetsSectionId
}

const defaultLocalFilters: AssetLocalFilters = {
  search: "",
  status: "all",
  departmentId: "all",
  projectId: "all",
}

const defaultColumnsByTab: Record<FixedAssetsSectionId, string[]> = {
  asset_register: ["name", "category", "scope", "status", "cost", "nbv", "updated"],
  depreciation: ["name", "period", "book", "status", "amount", "ending", "date"],
  lifecycle_events: ["name", "event", "status", "amount", "date", "user"],
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
    case "in_service":
    case "posted":
    case "completed":
    case "capitalized":
      return "positive"
    case "queued":
    case "hold":
    case "scheduled":
    case "pending":
      return "warning"
    case "disposed":
    case "exception":
    case "needs_review":
      return "critical"
    default:
      return "neutral"
  }
}

function isFixedAsset(row: FixedAssetRow): row is FixedAsset {
  return "assetNumber" in row
}

function isDepreciationLine(row: FixedAssetRow): row is DepreciationScheduleLine {
  return "scheduledDate" in row
}

function isLifecycleEvent(row: FixedAssetRow): row is AssetLifecycleEvent {
  return "eventType" in row
}

function parseAssetViewFilters(value: Record<string, unknown> | undefined, fallbackTab: FixedAssetsSectionId): AssetViewFilters {
  return {
    tabId: typeof value?.tabId === "string" ? (value.tabId as FixedAssetsSectionId) : fallbackTab,
    search: typeof value?.search === "string" ? value.search : "",
    status: typeof value?.status === "string" ? value.status : "all",
    departmentId: typeof value?.departmentId === "string" ? value.departmentId : "all",
    projectId: typeof value?.projectId === "string" ? value.projectId : "all",
  }
}

export function FixedAssetsPage() {
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
  const [sort, setSort] = useState<SortConfig>({ key: "updatedAt", direction: "desc" })
  const [filters, setFilters] = useState<AssetLocalFilters>(defaultLocalFilters)
  const [activeTab, setActiveTab] = useState<FixedAssetsSectionId>("asset_register")
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(defaultColumnsByTab.asset_register)

  const scopedFilters = useMemo(
    () =>
      activeEntity && dateRange
        ? {
            entityId: activeEntity.id,
            dateRange,
            departmentId: filters.departmentId !== "all" ? filters.departmentId : undefined,
            projectId: filters.projectId !== "all" ? filters.projectId : undefined,
          }
        : null,
    [activeEntity, dateRange, filters.departmentId, filters.projectId]
  )

  useEffect(() => {
    if (!activeRole) {
      return
    }

    const nextTab = getFixedAssetsDefaultSection(activeRoleId)
    setActiveTab(nextTab)
    setVisibleColumnIds(defaultColumnsByTab[nextTab])
    setSort({ key: nextTab === "depreciation" ? "scheduledDate" : nextTab === "lifecycle_events" ? "eventDate" : "updatedAt", direction: nextTab === "depreciation" ? "asc" : "desc" })
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
      getFixedAssetsOverview(scopedFilters, activeRoleId),
      getFixedAssetsTabs(scopedFilters, activeRoleId),
      getSavedViews("fixed-assets"),
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

    applyView(defaultView, getFixedAssetsDefaultSection(activeRoleId))
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
      departmentId: filters.departmentId,
      projectId: filters.projectId,
      page,
      pageSize,
      sort,
    }

    const load =
      activeTab === "asset_register"
        ? getFixedAssetsWorkspace(scopedFilters, query)
        : activeTab === "depreciation"
          ? getDepreciationWorkspace(scopedFilters, query)
          : getAssetLifecycleWorkspace(scopedFilters, query)

    load.then(result => {
      if (cancelled) {
        return
      }

      setRowsResponse(result)
      setIsLoading(false)
      setSelectedIds(previous => previous.filter(id => result.data.some((row: FixedAssetRow) => row.id === id)))
    }).catch(() => {
      if (!cancelled) {
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [scopedFilters, activeTab, filters.search, filters.status, filters.departmentId, filters.projectId, page, pageSize, sort, reloadKey])

  useEffect(() => {
    if (!drawerId) {
      setDetail(null)
      return
    }

    const load =
      activeTab === "asset_register"
        ? getFixedAssetDetail(drawerId)
        : activeTab === "depreciation"
          ? getDepreciationRunDetail(drawerId)
          : getAssetLifecycleEventDetail(drawerId)

    load.then(setDetail)
  }, [drawerId, activeTab, reloadKey])

  async function handlePrimaryAction(actionId: string) {
    if (!activeEntity) {
      return
    }

    if (actionId === "new-fixed-asset") {
      await saveFixedAsset({
        name: `New Asset ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date())}`,
        entityId: activeEntity.id,
        category: "equipment",
        cost: 95000,
        departmentId: filters.departmentId !== "all" ? filters.departmentId : undefined,
        projectId: filters.projectId !== "all" ? filters.projectId : undefined,
      })
      setActiveTab("asset_register")
      setReloadKey(previous => previous + 1)
      toast({ title: "Asset added", description: "A new draft asset was created in the register." })
      return
    }

    if (actionId === "preview-depreciation") {
      const target = rowsResponse?.data.find((row: FixedAssetRow) => isFixedAsset(row)) as FixedAsset | undefined
      const preview = await runDepreciationPreview(target?.id ?? "fa-1001")
      toast({
        title: "Depreciation preview ready",
        description: preview ? `${preview.assetName}: ${formatMoney(preview.nextPeriodAmount)} next period.` : "Preview unavailable.",
      })
      return
    }
  }

  async function handleDrawerAction(action: WorkspaceDetailAction) {
    if (!detail) {
      return
    }

    if (action.id === "dispose-asset") {
      await disposeFixedAsset(detail.id)
      setReloadKey(previous => previous + 1)
      toast({ title: "Asset disposed", description: "The asset was moved to disposed status." })
      return
    }

    if (action.id === "activate-asset") {
      const row = rowsResponse?.data.find((candidate: FixedAssetRow) => candidate.id === detail.id)
      if (row && isFixedAsset(row)) {
        await saveFixedAsset({ ...row, status: "in_service", capitalizationStatus: "capitalized", inServiceDate: new Date() })
        setReloadKey(previous => previous + 1)
        toast({ title: "Asset activated", description: "The asset is now in service." })
      }
      return
    }

    await handlePrimaryAction(action.id)
  }

  function applyView(view: SavedView, fallbackTab: FixedAssetsSectionId) {
    const parsed = parseAssetViewFilters(view.filters, fallbackTab)
    setActiveTab(parsed.tabId)
    setFilters({
      search: parsed.search,
      status: parsed.status,
      departmentId: parsed.departmentId,
      projectId: parsed.projectId,
    })
    setSort({
      key: view.sortBy ?? (parsed.tabId === "depreciation" ? "scheduledDate" : parsed.tabId === "lifecycle_events" ? "eventDate" : "updatedAt"),
      direction: view.sortDirection ?? (parsed.tabId === "depreciation" ? "asc" : "desc"),
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
        module: "fixed-assets",
        filters: {
          tabId: activeTab,
          search: filters.search,
          status: filters.status,
          departmentId: filters.departmentId,
          projectId: filters.projectId,
        },
        columns: visibleColumnIds,
        sortBy: sort.key,
        sortDirection: sort.direction,
        isDefault: payload.isDefault,
        roleScope: [activeRole.id],
      })
      const nextViews = await getSavedViews("fixed-assets")
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
    const nextViews = await getSavedViews("fixed-assets")
    setSavedViews(nextViews.filter(candidate => !candidate.roleScope?.length || candidate.roleScope.includes(activeRole.id)))
    setActiveViewId(previous => previous === view.id ? null : previous)
  }

  async function handleSetDefaultView(view: SavedView) {
    if (!activeRole) {
      return
    }

    await setDefaultView(view.id, "fixed-assets")
    const nextViews = await getSavedViews("fixed-assets")
    setSavedViews(nextViews.filter(candidate => !candidate.roleScope?.length || candidate.roleScope.includes(activeRole.id)))
    setActiveViewId(view.id)
  }

  async function handleBulkAction() {
    const selectedRows = rowsResponse?.data.filter((row: FixedAssetRow) => selectedIds.includes(row.id)) ?? []
    if (activeTab === "asset_register") {
      await Promise.all(
        selectedRows
          .filter(isFixedAsset)
          .map((row: FixedAsset) =>
            row.status === "disposed"
              ? Promise.resolve(row)
              : saveFixedAsset({ ...row, status: "in_service", capitalizationStatus: "capitalized", inServiceDate: row.inServiceDate ?? new Date() })
          )
      )
    }

    setSelectedIds([])
    setReloadKey(previous => previous + 1)
    toast({ title: "Assets updated", description: "Selected assets were updated from the workspace." })
  }

  const allColumns = useMemo<Record<string, OperatorTableColumn<FixedAssetRow>>>(() => ({
    name: {
      id: "name",
      label: activeTab === "asset_register" ? "Asset" : activeTab === "depreciation" ? "Depreciation Run" : "Lifecycle Item",
      sortKey: activeTab === "lifecycle_events" ? "assetName" : activeTab === "depreciation" ? "assetName" : "name",
      widthClassName: "min-w-[260px]",
      render: row => (
        <div className="space-y-1">
          <div className="font-medium text-foreground">
            {isFixedAsset(row) ? `${row.assetNumber} · ${row.name}` : row.assetName}
          </div>
          <div className="text-sm text-muted-foreground">
            {isFixedAsset(row) ? row.vendorName ?? row.category : isDepreciationLine(row) ? row.periodLabel : row.description}
          </div>
        </div>
      ),
    },
    category: {
      id: "category",
      label: "Category",
      sortKey: "category",
      widthClassName: "min-w-[140px]",
      render: row => <span className="text-sm text-foreground">{isFixedAsset(row) ? row.category : "—"}</span>,
    },
    scope: {
      id: "scope",
      label: "Scope",
      widthClassName: "min-w-[170px]",
      render: row => (
        <div className="space-y-1 text-sm">
          <div>{("departmentName" in row ? row.departmentName : undefined) ?? "Shared"}</div>
          <div className="text-muted-foreground">{("projectName" in row ? row.projectName : undefined) ?? "No project"}</div>
        </div>
      ),
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
    cost: {
      id: "cost",
      label: "Cost",
      sortKey: "cost",
      align: "right",
      widthClassName: "min-w-[140px]",
      render: row => <span className="text-sm font-medium text-foreground">{formatMoney(isFixedAsset(row) ? row.cost : 0)}</span>,
    },
    nbv: {
      id: "nbv",
      label: "Net Book Value",
      sortKey: "netBookValue",
      align: "right",
      widthClassName: "min-w-[160px]",
      render: row => <span className="text-sm font-medium text-foreground">{formatMoney(isFixedAsset(row) ? row.netBookValue : 0)}</span>,
    },
    updated: {
      id: "updated",
      label: "Updated",
      sortKey: "updatedAt",
      widthClassName: "min-w-[120px]",
      render: row => <span className="text-sm text-muted-foreground">{formatDate(isFixedAsset(row) ? row.updatedAt : undefined)}</span>,
    },
    period: {
      id: "period",
      label: "Period",
      sortKey: "periodLabel",
      widthClassName: "min-w-[150px]",
      render: row => <span className="text-sm text-foreground">{isDepreciationLine(row) ? row.periodLabel : "—"}</span>,
    },
    book: {
      id: "book",
      label: "Book",
      sortKey: "bookName",
      widthClassName: "min-w-[140px]",
      render: row => <span className="text-sm text-foreground">{isDepreciationLine(row) ? row.bookName : "—"}</span>,
    },
    amount: {
      id: "amount",
      label: "Amount",
      sortKey: activeTab === "lifecycle_events" ? "amount" : "depreciationAmount",
      align: "right",
      widthClassName: "min-w-[140px]",
      render: row => <span className="text-sm font-medium text-foreground">{formatMoney(isDepreciationLine(row) ? row.depreciationAmount : isLifecycleEvent(row) ? row.amount ?? 0 : 0)}</span>,
    },
    ending: {
      id: "ending",
      label: "Ending Value",
      sortKey: "endingBookValue",
      align: "right",
      widthClassName: "min-w-[150px]",
      render: row => <span className="text-sm font-medium text-foreground">{formatMoney(isDepreciationLine(row) ? row.endingBookValue : 0)}</span>,
    },
    date: {
      id: "date",
      label: "Date",
      sortKey: activeTab === "lifecycle_events" ? "eventDate" : "scheduledDate",
      widthClassName: "min-w-[120px]",
      render: row => <span className="text-sm text-foreground">{formatDate(isDepreciationLine(row) ? row.scheduledDate : isLifecycleEvent(row) ? row.eventDate : undefined)}</span>,
    },
    event: {
      id: "event",
      label: "Event",
      sortKey: "eventType",
      widthClassName: "min-w-[160px]",
      render: row => <span className="text-sm text-foreground">{isLifecycleEvent(row) ? row.eventType : "—"}</span>,
    },
    user: {
      id: "user",
      label: "User",
      sortKey: "userName",
      widthClassName: "min-w-[140px]",
      render: row => <span className="text-sm text-foreground">{isLifecycleEvent(row) ? row.userName : "—"}</span>,
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
      moduleLabel="Fixed Assets"
      eyebrow={overview.badge}
      title={overview.title}
      description={overview.subtitle}
      metrics={rowsResponse.metrics}
      actions={[...overview.actions, ...rowsResponse.actions.filter((action: any) => !overview.actions.some(existing => existing.id === action.id))]}
      actionHandlers={{
        "new-fixed-asset": () => void handlePrimaryAction("new-fixed-asset"),
        "preview-depreciation": () => void handlePrimaryAction("preview-depreciation"),
      }}
      tabs={tabs}
      activeTabId={activeTab}
      onTabChange={tabId => {
        const nextTab = tabId as FixedAssetsSectionId
        setActiveTab(nextTab)
        setVisibleColumnIds(defaultColumnsByTab[nextTab])
        setSelectedIds([])
        setPage(1)
      }}
      savedViews={savedViews}
      activeViewId={activeViewId}
      viewsLoading={isViewsLoading}
      viewsSaving={isSavingView}
      onApplySavedView={view => applyView(view, getFixedAssetsDefaultSection(activeRole.id))}
      onSaveView={handleSaveView}
      onDeleteView={view => void handleDeleteView(view)}
      onSetDefaultView={view => void handleSetDefaultView(view)}
      search={filters.search}
      onSearchChange={value => {
        setFilters(previous => ({ ...previous, search: value }))
        setPage(1)
      }}
      searchPlaceholder="Search assets, depreciation runs, vendors, or lifecycle notes..."
      filters={(rowsResponse.filters ?? []).map((definition: any) => ({
        ...definition,
        value: definition.id === "status" ? filters.status : definition.id === "departmentId" ? filters.departmentId : filters.projectId,
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
      bulkActions={activeTab === "asset_register" && selectedIds.length ? [{ id: "bulk-activate", label: "Place In Service", icon: "BadgeCheck", onClick: () => void handleBulkAction() }] : []}
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
