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
  getBudgetSubmissionDetail,
  getBudgetSubmissionsWorkspace,
  getBudgetVarianceDetail,
  getBudgetVarianceWorkspace,
  getBudgetVersionDetail,
  getBudgetVersionsWorkspace,
  getBudgetsForecastingDefaultSection,
  getBudgetsForecastingOverview,
  getBudgetsForecastingTabs,
  getForecastScenarioDetail,
  getForecastScenariosWorkspace,
  getSavedViews,
  saveBudgetVersion,
  saveForecastScenario,
  saveView,
  setDefaultView,
  updateBudgetSubmission,
} from "@/lib/services"
import type {
  BudgetSubmission,
  BudgetVarianceRow,
  BudgetVersion,
  BudgetsForecastingSectionId,
  ForecastScenario,
  ModuleOverviewData,
  SavedView,
  SortConfig,
  WorkspaceDetailAction,
  WorkspaceDetailData,
  WorkspaceTabItem,
} from "@/lib/types"
import { cn } from "@/lib/utils"

type PlanningRow = BudgetVersion | ForecastScenario | BudgetVarianceRow | BudgetSubmission

interface PlanningLocalFilters {
  search: string
  status: string
  departmentId: string
  projectId: string
}

interface PlanningViewFilters extends PlanningLocalFilters {
  tabId: BudgetsForecastingSectionId
}

const defaultLocalFilters: PlanningLocalFilters = {
  search: "",
  status: "all",
  departmentId: "all",
  projectId: "all",
}

const defaultColumnsByTab: Record<BudgetsForecastingSectionId, string[]> = {
  budget_versions: ["name", "owner", "scope", "status", "budget", "variance", "updated"],
  forecast_scenarios: ["name", "owner", "confidence", "revenue", "net", "status", "updated"],
  variance_review: ["name", "scope", "owner", "budget", "actual", "variance", "status"],
  submission_queue: ["name", "owner", "scope", "due", "status", "exception"],
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
    case "approved":
    case "submitted":
    case "locked":
    case "active":
    case "favorable":
      return "positive"
    case "in_review":
    case "in_progress":
    case "watch":
    case "not_started":
      return "warning"
    case "critical":
    case "returned":
    case "overdue":
      return "critical"
    default:
      return "neutral"
  }
}

function isBudgetVersion(row: PlanningRow): row is BudgetVersion {
  return "versionType" in row
}

function isForecastScenario(row: PlanningRow): row is ForecastScenario {
  return "basedOnBudgetVersionId" in row
}

function isBudgetVarianceRow(row: PlanningRow): row is BudgetVarianceRow {
  return "budgetAmount" in row && "actualAmount" in row && "ownerName" in row && !("dueDate" in row)
}

function isBudgetSubmission(row: PlanningRow): row is BudgetSubmission {
  return "budgetVersionId" in row && "dueDate" in row
}

function parsePlanningViewFilters(value: Record<string, unknown> | undefined, fallbackTab: BudgetsForecastingSectionId): PlanningViewFilters {
  return {
    tabId: typeof value?.tabId === "string" ? (value.tabId as BudgetsForecastingSectionId) : fallbackTab,
    search: typeof value?.search === "string" ? value.search : "",
    status: typeof value?.status === "string" ? value.status : "all",
    departmentId: typeof value?.departmentId === "string" ? value.departmentId : "all",
    projectId: typeof value?.projectId === "string" ? value.projectId : "all",
  }
}

export function BudgetsForecastingPage() {
  const { toast } = useToast()
  const { activeEntity, activeRole, currentUser, dateRange } = useWorkspaceShell()
  const activeRoleId = activeRole?.id

  const [overview, setOverview] = useState<ModuleOverviewData | null>(null)
  const [tabs, setTabs] = useState<WorkspaceTabItem[]>([])
  const [rowsResponse, setRowsResponse] = useState<{
    data: PlanningRow[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    metrics: ModuleOverviewData["metrics"]
    actions: ModuleOverviewData["actions"]
    filters: Array<{ id: string; label: string; options: Array<{ value: string; label: string }> }>
    emptyMessage: string
    defaultSort: SortConfig
  } | null>(null)
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
  const [sort, setSort] = useState<SortConfig>({ key: "varianceAmount", direction: "desc" })
  const [filters, setFilters] = useState<PlanningLocalFilters>(defaultLocalFilters)
  const [activeTab, setActiveTab] = useState<BudgetsForecastingSectionId>("variance_review")
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(defaultColumnsByTab.variance_review)

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

    const nextTab = getBudgetsForecastingDefaultSection(activeRoleId)
    setActiveTab(nextTab)
    setVisibleColumnIds(defaultColumnsByTab[nextTab])
    setSort({ key: defaultColumnsByTab[nextTab].includes("variance") ? "varianceAmount" : "updatedAt", direction: nextTab === "submission_queue" ? "asc" : "desc" })
    setActiveViewId(null)
    setDidApplyDefaultView(false)
    setFilters(defaultLocalFilters)
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
      getBudgetsForecastingOverview(scopedFilters, activeRoleId),
      getBudgetsForecastingTabs(scopedFilters, activeRoleId),
      getSavedViews("budgets-forecasting"),
    ]).then(([nextOverview, nextTabs, nextViews]) => {
      if (cancelled) {
        return
      }

      const filteredViews = nextViews.filter(
        view => !view.roleScope?.length || view.roleScope.includes(activeRoleId)
      )

      setOverview(nextOverview)
      setTabs(nextTabs)
      setSavedViews(filteredViews)
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
    if (!savedViews.length || didApplyDefaultView) {
      return
    }

    const defaultView = savedViews.find(view => view.isDefault)
    if (!defaultView || !activeRoleId) {
      setDidApplyDefaultView(true)
      return
    }

    applyView(defaultView, getBudgetsForecastingDefaultSection(activeRoleId))
    setDidApplyDefaultView(true)
  }, [savedViews, didApplyDefaultView, activeRoleId])

  useEffect(() => {
    if (!scopedFilters || !activeRoleId) {
      return
    }

    let cancelled = false
    setIsLoading(true)

    const query = {
      roleId: activeRoleId,
      search: filters.search,
      status: filters.status,
      departmentId: filters.departmentId,
      projectId: filters.projectId,
      page,
      pageSize,
      sort,
    }

    const load =
      activeTab === "budget_versions"
        ? getBudgetVersionsWorkspace(scopedFilters, query)
        : activeTab === "forecast_scenarios"
          ? getForecastScenariosWorkspace(scopedFilters, query)
          : activeTab === "submission_queue"
            ? getBudgetSubmissionsWorkspace(scopedFilters, query)
            : getBudgetVarianceWorkspace(scopedFilters, query)

    load.then(result => {
      if (cancelled) {
        return
      }

      setRowsResponse(result as typeof rowsResponse)
      setIsLoading(false)
      setSelectedIds(previous => previous.filter(id => result.data.some(row => row.id === id)))
    }).catch(() => {
      if (!cancelled) {
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [scopedFilters, activeRoleId, activeTab, filters.search, filters.status, filters.departmentId, filters.projectId, page, pageSize, sort, reloadKey])

  useEffect(() => {
    if (!drawerId || !scopedFilters) {
      setDetail(null)
      return
    }

    const load =
      activeTab === "budget_versions"
        ? getBudgetVersionDetail(drawerId)
        : activeTab === "forecast_scenarios"
          ? getForecastScenarioDetail(drawerId)
          : activeTab === "submission_queue"
            ? getBudgetSubmissionDetail(drawerId)
            : getBudgetVarianceDetail(drawerId, scopedFilters)

    load.then(setDetail)
  }, [drawerId, activeTab, scopedFilters, reloadKey])

  async function handlePrimaryAction(actionId: string) {
    if (!activeEntity || !activeRole || !currentUser) {
      return
    }

    if (actionId === "new-budget-version") {
      await saveBudgetVersion({
        name: `FY26 Working ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date())}`,
        entityId: activeEntity.id,
        ownerId: currentUser.id,
        ownerName: currentUser.displayName ?? currentUser.email,
        versionType: "operating",
        departmentId: filters.departmentId !== "all" ? filters.departmentId : undefined,
        projectId: filters.projectId !== "all" ? filters.projectId : undefined,
        totalBudget: 125000,
        actualToDate: 0,
        forecastAmount: 125000,
      })
      setActiveTab("budget_versions")
      setReloadKey(previous => previous + 1)
      toast({ title: "Budget version created", description: "A new draft version is ready for planning updates." })
      return
    }

    if (actionId === "create-scenario") {
      const baseVersion = rowsResponse?.data.find(isBudgetVersion) ?? null
      await saveForecastScenario({
        name: `Scenario ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date())}`,
        entityId: activeEntity.id,
        basedOnBudgetVersionId: baseVersion?.id ?? "bud-2026-op-v1",
        ownerId: currentUser.id,
        ownerName: currentUser.displayName ?? currentUser.email,
        departmentId: filters.departmentId !== "all" ? filters.departmentId : undefined,
        projectId: filters.projectId !== "all" ? filters.projectId : undefined,
      })
      setActiveTab("forecast_scenarios")
      setReloadKey(previous => previous + 1)
      toast({ title: "Scenario created", description: "A new forecast scenario is ready for assumptions." })
      return
    }

    if (actionId === "start-review-cycle") {
      const targets = rowsResponse?.data.filter(isBudgetVersion).slice(0, 2) ?? []
      await Promise.all(
        targets.map(version =>
          saveBudgetVersion({
            ...version,
            status: version.status === "draft" ? "in_review" : version.status,
          })
        )
      )
      setReloadKey(previous => previous + 1)
      toast({ title: "Review cycle started", description: "Draft versions were moved into review." })
      return
    }

    if (actionId === "refresh-assumptions") {
      const target = rowsResponse?.data.find(isForecastScenario)
      if (target) {
        await saveForecastScenario({ ...target })
      }
      setReloadKey(previous => previous + 1)
      toast({ title: "Assumptions refreshed", description: "Scenario assumptions were refreshed from the service layer." })
      return
    }

    if (actionId === "nudge-owners") {
      const targets = rowsResponse?.data.filter(isBudgetSubmission).slice(0, 3) ?? []
      await Promise.all(
        targets.map(submission =>
          updateBudgetSubmission(submission.id, {
            status: submission.status === "not_started" ? "in_progress" : submission.status,
          })
        )
      )
      setReloadKey(previous => previous + 1)
      toast({ title: "Owners nudged", description: "Submission follow-up was logged in the queue." })
      return
    }
  }

  async function handleDrawerAction(action: WorkspaceDetailAction) {
    if (!detail) {
      return
    }

    if (action.id === "advance-status") {
      if (activeTab === "budget_versions") {
        const row = rowsResponse?.data.find(candidate => candidate.id === detail.id)
        if (row && isBudgetVersion(row)) {
          const nextStatus =
            row.status === "draft"
              ? "in_review"
              : row.status === "in_review"
                ? "approved"
                : row.status === "approved"
                  ? "locked"
                  : row.status
          await saveBudgetVersion({ ...row, status: nextStatus })
        }
      }

      if (activeTab === "forecast_scenarios") {
        const row = rowsResponse?.data.find(candidate => candidate.id === detail.id)
        if (row && isForecastScenario(row)) {
          const nextStatus =
            row.status === "draft"
              ? "in_review"
              : row.status === "in_review"
                ? "approved"
                : row.status === "approved"
                  ? "active"
                  : row.status
          await saveForecastScenario({ ...row, status: nextStatus })
        }
      }

      if (activeTab === "submission_queue") {
        await updateBudgetSubmission(detail.id, { status: "submitted" })
      }

      setReloadKey(previous => previous + 1)
      toast({ title: "Status updated", description: "The planning record advanced to its next state." })
      return
    }

    await handlePrimaryAction(action.id)
  }

  function applyView(view: SavedView, fallbackTab: BudgetsForecastingSectionId) {
    const parsed = parsePlanningViewFilters(view.filters, fallbackTab)
    setActiveTab(parsed.tabId)
    setFilters({
      search: parsed.search,
      status: parsed.status,
      departmentId: parsed.departmentId,
      projectId: parsed.projectId,
    })
    setSort({
      key: view.sortBy ?? "updatedAt",
      direction: view.sortDirection ?? "desc",
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
        module: "budgets-forecasting",
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
      const nextViews = await getSavedViews("budgets-forecasting")
      setSavedViews(nextViews.filter(candidate => !candidate.roleScope?.length || candidate.roleScope.includes(activeRole.id)))
      setActiveViewId(view.id)
      toast({ title: "View saved", description: `"${view.name}" is now available in planning.` })
    } finally {
      setIsSavingView(false)
    }
  }

  async function handleDeleteView(view: SavedView) {
    if (!activeRole) {
      return
    }

    await deleteSavedView(view.id)
    const nextViews = await getSavedViews("budgets-forecasting")
    setSavedViews(nextViews.filter(candidate => !candidate.roleScope?.length || candidate.roleScope.includes(activeRole.id)))
    setActiveViewId(previous => (previous === view.id ? null : previous))
  }

  async function handleSetDefaultView(view: SavedView) {
    if (!activeRole) {
      return
    }

    await setDefaultView(view.id, "budgets-forecasting")
    const nextViews = await getSavedViews("budgets-forecasting")
    setSavedViews(nextViews.filter(candidate => !candidate.roleScope?.length || candidate.roleScope.includes(activeRole.id)))
    setActiveViewId(view.id)
  }

  async function handleBulkAdvance() {
    const selectedRows = rowsResponse?.data.filter(row => selectedIds.includes(row.id)) ?? []

    if (activeTab === "budget_versions") {
      await Promise.all(
        selectedRows
          .filter(isBudgetVersion)
          .map(row =>
            saveBudgetVersion({
              ...row,
              status: row.status === "draft" ? "in_review" : row.status === "in_review" ? "approved" : "locked",
            })
          )
      )
    }

    if (activeTab === "forecast_scenarios") {
      await Promise.all(
        selectedRows
          .filter(isForecastScenario)
          .map(row =>
            saveForecastScenario({
              ...row,
              status: row.status === "draft" ? "in_review" : row.status === "in_review" ? "approved" : "active",
            })
          )
      )
    }

    if (activeTab === "submission_queue") {
      await Promise.all(
        selectedRows
          .filter(isBudgetSubmission)
          .map(row => updateBudgetSubmission(row.id, { status: "submitted" }))
      )
    }

    setReloadKey(previous => previous + 1)
    setSelectedIds([])
  }

  const allColumns = useMemo<Record<string, OperatorTableColumn<PlanningRow>>>(() => ({
    name: {
      id: "name",
      label: activeTab === "submission_queue" ? "Submission" : activeTab === "variance_review" ? "Category" : "Name",
      sortKey: activeTab === "submission_queue" ? "ownerName" : activeTab === "variance_review" ? "category" : "name",
      widthClassName: "min-w-[260px]",
      render: row => (
        <div className="space-y-1">
          <div className="font-medium text-foreground">
            {isBudgetVersion(row)
              ? row.name
              : isForecastScenario(row)
                ? row.name
                : isBudgetVarianceRow(row)
                  ? row.category
                  : row.ownerName}
          </div>
          <div className="text-sm text-muted-foreground">
            {isBudgetVersion(row)
              ? row.versionType
              : isForecastScenario(row)
                ? `${row.confidence} confidence`
                : isBudgetVarianceRow(row)
                  ? row.entityName
                  : `Version ${row.budgetVersionId}`}
          </div>
        </div>
      ),
    },
    owner: {
      id: "owner",
      label: "Owner",
      sortKey: "ownerName",
      widthClassName: "min-w-[170px]",
      render: row => <span className="text-sm text-foreground">{isBudgetVarianceRow(row) || isBudgetSubmission(row) || isBudgetVersion(row) || isForecastScenario(row) ? row.ownerName : "—"}</span>,
    },
    scope: {
      id: "scope",
      label: "Scope",
      widthClassName: "min-w-[180px]",
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
        <Badge
          variant="outline"
          className={cn("rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]", toneClasses[statusTone(row.status)])}
        >
          {row.status.replace(/_/g, " ")}
        </Badge>
      ),
    },
    budget: {
      id: "budget",
      label: "Budget",
      sortKey: activeTab === "variance_review" ? "budgetAmount" : "totalBudget",
      align: "right",
      widthClassName: "min-w-[140px]",
      render: row => <span className="text-sm font-medium text-foreground">{formatMoney(isBudgetVarianceRow(row) ? row.budgetAmount : isBudgetVersion(row) ? row.totalBudget : 0)}</span>,
    },
    actual: {
      id: "actual",
      label: "Actual",
      sortKey: "actualAmount",
      align: "right",
      widthClassName: "min-w-[140px]",
      render: row => <span className="text-sm font-medium text-foreground">{formatMoney(isBudgetVarianceRow(row) ? row.actualAmount : isBudgetVersion(row) ? row.actualToDate : 0)}</span>,
    },
    variance: {
      id: "variance",
      label: "Variance",
      sortKey: "varianceAmount",
      align: "right",
      widthClassName: "min-w-[150px]",
      render: row => {
        const amount = isBudgetVarianceRow(row) ? row.varianceAmount : isBudgetVersion(row) ? row.varianceAmount : 0
        const percent = isBudgetVarianceRow(row) ? row.variancePercent : isBudgetVersion(row) ? row.variancePercent : 0
        return (
          <div className="space-y-1 text-right">
            <div className={cn("text-sm font-medium", amount > 0 ? "text-red-700" : "text-emerald-700")}>{formatMoney(amount)}</div>
            <div className="text-xs text-muted-foreground">{percent}%</div>
          </div>
        )
      },
    },
    updated: {
      id: "updated",
      label: "Updated",
      sortKey: "updatedAt",
      widthClassName: "min-w-[120px]",
      render: row => <span className="text-sm text-muted-foreground">{formatDate(("updatedAt" in row ? row.updatedAt : undefined) ?? undefined)}</span>,
    },
    confidence: {
      id: "confidence",
      label: "Confidence",
      sortKey: "confidence",
      widthClassName: "min-w-[140px]",
      render: row => <span className="text-sm text-foreground">{isForecastScenario(row) ? row.confidence : "—"}</span>,
    },
    revenue: {
      id: "revenue",
      label: "Revenue",
      sortKey: "revenueForecast",
      align: "right",
      widthClassName: "min-w-[150px]",
      render: row => <span className="text-sm font-medium text-foreground">{formatMoney(isForecastScenario(row) ? row.revenueForecast : 0)}</span>,
    },
    net: {
      id: "net",
      label: "Net",
      sortKey: "netForecast",
      align: "right",
      widthClassName: "min-w-[150px]",
      render: row => <span className="text-sm font-medium text-foreground">{formatMoney(isForecastScenario(row) ? row.netForecast : 0)}</span>,
    },
    due: {
      id: "due",
      label: "Due",
      sortKey: "dueDate",
      widthClassName: "min-w-[120px]",
      render: row => <span className="text-sm text-foreground">{formatDate(isBudgetSubmission(row) ? row.dueDate : undefined)}</span>,
    },
    exception: {
      id: "exception",
      label: "Exception",
      widthClassName: "min-w-[220px]",
      render: row => <span className="text-sm text-muted-foreground">{isBudgetSubmission(row) ? row.exceptionReason ?? "No exception" : "—"}</span>,
    },
  }), [activeTab])

  const visibleColumns = useMemo(() => {
    const fallback = defaultColumnsByTab[activeTab]
    const nextIds = visibleColumnIds.length ? visibleColumnIds : fallback
    return nextIds.map(columnId => allColumns[columnId]).filter(Boolean)
  }, [activeTab, allColumns, visibleColumnIds])

  const filterDefinitions = rowsResponse?.filters ?? []

  const bulkActions = (() => {
    if (!selectedIds.length) {
      return []
    }

    if (activeTab === "variance_review") {
      return []
    }

    return [
      {
        id: "bulk-advance",
        label: activeTab === "submission_queue" ? "Mark Submitted" : "Advance Status",
        icon: "BadgeCheck",
        onClick: handleBulkAdvance,
      },
    ]
  })()

  if (!overview || !rowsResponse || !activeRole || !activeEntity || !dateRange) {
    return null
  }

  return (
    <TabbedOperatorWorkspace
      moduleLabel="Budgets & Forecasting"
      eyebrow={overview.badge}
      title={overview.title}
      description={overview.subtitle}
      metrics={rowsResponse.metrics}
      actions={[...overview.actions, ...rowsResponse.actions.filter(action => !overview.actions.some(existing => existing.id === action.id))]}
      actionHandlers={{
        "new-budget-version": () => void handlePrimaryAction("new-budget-version"),
        "create-scenario": () => void handlePrimaryAction("create-scenario"),
        "start-review-cycle": () => void handlePrimaryAction("start-review-cycle"),
        "refresh-assumptions": () => void handlePrimaryAction("refresh-assumptions"),
        "nudge-owners": () => void handlePrimaryAction("nudge-owners"),
      }}
      tabs={tabs}
      activeTabId={activeTab}
      onTabChange={tabId => {
        const nextTab = tabId as BudgetsForecastingSectionId
        setActiveTab(nextTab)
        setVisibleColumnIds(defaultColumnsByTab[nextTab])
        setSelectedIds([])
        setPage(1)
      }}
      savedViews={savedViews}
      activeViewId={activeViewId}
      viewsLoading={isViewsLoading}
      viewsSaving={isSavingView}
      onApplySavedView={view => applyView(view, getBudgetsForecastingDefaultSection(activeRole.id))}
      onSaveView={handleSaveView}
      onDeleteView={view => void handleDeleteView(view)}
      onSetDefaultView={view => void handleSetDefaultView(view)}
      search={filters.search}
      onSearchChange={value => {
        setFilters(previous => ({ ...previous, search: value }))
        setPage(1)
      }}
      searchPlaceholder="Search budget versions, scenarios, owners, or variance categories..."
      filters={filterDefinitions.map(definition => ({
        ...definition,
        value:
          definition.id === "status"
            ? filters.status
            : definition.id === "departmentId"
              ? filters.departmentId
              : filters.projectId,
        onChange: value => {
          setFilters(previous => ({
            ...previous,
            [definition.id]:
              definition.id === "status"
                ? value
                : definition.id === "departmentId"
                  ? value
                  : value,
          }))
          setPage(1)
        },
      }))}
      visibleColumnIds={visibleColumnIds}
      onToggleColumn={(columnId, visible) => {
        setVisibleColumnIds(previous => {
          const next = visible
            ? [...new Set([...previous, columnId])]
            : previous.filter(existing => existing !== columnId)
          return next.length ? next : defaultColumnsByTab[activeTab]
        })
      }}
      columnOptions={defaultColumnsByTab[activeTab].map(columnId => ({
        id: columnId,
        label: allColumns[columnId]?.label ?? columnId,
      }))}
      bulkActions={bulkActions}
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
