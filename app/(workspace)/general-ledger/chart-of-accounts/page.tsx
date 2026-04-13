"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { OperatorListWorkspace } from "@/components/finance/operator-list-workspace"
import { RecordDetailDrawer } from "@/components/finance/record-detail-drawer"
import { AccountModal } from "@/components/general-ledger/account-modal"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import {
  deleteSavedView,
  deleteAccount,
  getChartAccountWorkspaceDetail,
  getChartOfAccountsWorkspace,
  getSavedViews,
  saveView,
  saveAccount,
  setDefaultView,
} from "@/lib/services"
import type { Account, SavedView, SortConfig, WorkspaceDetailAction, WorkspaceDetailData, WorkspaceFilterDefinition } from "@/lib/types"
import type { OperatorTableColumn } from "@/components/finance/operator-data-table"
import { formatCurrency } from "@/lib/utils"

const typeToneClasses: Record<Account["type"], string> = {
  asset: "border-primary/20 bg-primary/10 text-primary",
  liability: "border-purple-200 bg-purple-50 text-purple-700",
  equity: "border-emerald-200 bg-emerald-50 text-emerald-700",
  revenue: "border-sky-200 bg-sky-50 text-sky-700",
  expense: "border-amber-200 bg-amber-50 text-amber-700",
}

export default function ChartOfAccountsPage() {
  const { activeEntity, activeRole, dateRange } = useWorkspaceShell()
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof getChartOfAccountsWorkspace>> | null>(null)
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [didApplyDefaultView, setDidApplyDefaultView] = useState(false)
  const [isViewsLoading, setIsViewsLoading] = useState(true)
  const [isSavingView, setIsSavingView] = useState(false)
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sort, setSort] = useState<SortConfig>({ key: "number", direction: "asc" })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detail, setDetail] = useState<WorkspaceDetailData | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!activeEntity || !dateRange) {
      return
    }

    getChartOfAccountsWorkspace(
      {
        entityId: activeEntity.id,
        dateRange,
      },
      {
        search: search || undefined,
        types: typeFilter !== "all" ? [typeFilter] : undefined,
        sort,
        page,
        pageSize,
      }
    ).then(data => {
      setWorkspace(data)
      setSelectedIds(previous => previous.filter(id => data.data.some(account => account.id === id)))
    })
  }, [activeEntity, dateRange, page, pageSize, refreshKey, search, sort, typeFilter])

  const columns = useMemo<OperatorTableColumn<Account>[]>(
    () => [
      {
        id: "account",
        label: "Account",
        sortKey: "number",
        render: account => (
          <div className="space-y-1">
            <div className="font-medium text-foreground">{account.number}</div>
            <div className="text-sm text-muted-foreground">{account.name}</div>
          </div>
        ),
      },
      {
        id: "type",
        label: "Type",
        sortKey: "type",
        render: account => (
          <Badge variant="outline" className={`rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${typeToneClasses[account.type]}`}>
            {account.type}
          </Badge>
        ),
      },
      {
        id: "category",
        label: "Category",
        sortKey: "category",
        render: account => <div className="text-sm text-foreground">{account.category}</div>,
      },
      {
        id: "status",
        label: "Status",
        sortKey: "status",
        render: account => <div className="text-sm text-foreground capitalize">{account.status}</div>,
      },
      {
        id: "balance",
        label: "Balance",
        sortKey: "balance",
        align: "right",
        render: account => <div className="font-medium text-foreground">{formatCurrency(account.balance, account.currency)}</div>,
      },
    ],
    []
  )

  const allColumnIds = useMemo(() => columns.map(column => column.id), [columns])
  const columnOptions = useMemo(
    () => columns.map(column => ({ id: column.id, label: column.label })),
    [columns]
  )

  useEffect(() => {
    setVisibleColumnIds([])
  }, [allColumnIds])

  useEffect(() => {
    setActiveViewId(null)
    setDidApplyDefaultView(false)
  }, [activeRole?.id])

  useEffect(() => {
    let cancelled = false
    setIsViewsLoading(true)

    getSavedViews("general-ledger-chart-of-accounts")
      .then(views => {
        if (cancelled) {
          return
        }

        const filteredViews = views.filter(view => !view.roleScope?.length || (activeRole?.id && view.roleScope.includes(activeRole.id)))
        setSavedViews(filteredViews)
        setIsViewsLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setIsViewsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeRole?.id, refreshKey])

  const currentFilters = {
    search,
    typeFilter,
    sortKey: sort.key,
    sortDirection: sort.direction,
    pageSize,
    visibleColumnIds: visibleColumnIds.length ? visibleColumnIds : allColumnIds,
  }

  const applySavedView = useCallback((view: SavedView) => {
    const filters = view.filters as Record<string, unknown>
    setSearch(String(filters.search ?? ""))
    setTypeFilter(String(filters.typeFilter ?? "all"))
    setSort({
      key: view.sortBy ?? String(filters.sortKey ?? "number"),
      direction: view.sortDirection === "desc" ? "desc" : "asc",
    })
    const nextVisibleColumns =
      Array.isArray(view.columns) && view.columns.length
        ? view.columns
        : Array.isArray(filters.visibleColumnIds)
          ? filters.visibleColumnIds.filter((value): value is string => typeof value === "string")
          : []

    setVisibleColumnIds(nextVisibleColumns.length === allColumnIds.length ? [] : nextVisibleColumns)
    setPageSize(Number(filters.pageSize ?? 15))
    setPage(1)
    setSelectedIds([])
    setActiveViewId(view.id)
  }, [allColumnIds])

  async function openDetail(account: Account) {
    setDetailOpen(true)
    setDetailLoading(true)
    const nextDetail = await getChartAccountWorkspaceDetail(account.id)
    setDetail(nextDetail)
    setDetailLoading(false)
  }

  async function handleDetailAction(action: WorkspaceDetailAction) {
    if (!detail) {
      return
    }

    if (action.id === "edit-account") {
      const account = workspace?.data.find(item => item.id === detail.id) ?? null
      setEditingAccount(account)
      setModalOpen(true)
      return
    }

    if (action.id === "archive-account") {
      await deleteAccount(detail.id)
      toast.success("Account archived")
    }

    if (action.id === "activate-account") {
      await saveAccount({ id: detail.id, status: "active" })
      toast.success("Account reactivated")
    }

    setRefreshKey(previous => previous + 1)
    setDetail(await getChartAccountWorkspaceDetail(detail.id))
  }

  const filters = useMemo<Array<WorkspaceFilterDefinition & { value: string; onChange: (value: string) => void }>>(
    () =>
      (workspace?.filters.map(filter => ({
        ...filter,
        value: typeFilter,
        onChange: value => {
          setTypeFilter(value)
          setPage(1)
          setActiveViewId(null)
        },
      })) ?? []),
    [typeFilter, workspace?.filters]
  )

  useEffect(() => {
    if (didApplyDefaultView || !savedViews.length) {
      return
    }

    const defaultView = savedViews.find(view => view.isDefault)
    if (defaultView) {
      applySavedView(defaultView)
    }

    setDidApplyDefaultView(true)
  }, [applySavedView, didApplyDefaultView, savedViews])

  async function refreshViews(nextActiveViewId?: string | null) {
    const views = await getSavedViews("general-ledger-chart-of-accounts")
    const filteredViews = views.filter(view => !view.roleScope?.length || (activeRole?.id && view.roleScope.includes(activeRole.id)))
    setSavedViews(filteredViews)
    setActiveViewId(nextActiveViewId ?? null)
  }

  async function handleSaveView(payload: { name: string; isDefault: boolean }) {
    setIsSavingView(true)

    try {
      const nextVisibleColumnIds = visibleColumnIds.length ? visibleColumnIds : allColumnIds
      const nextView = await saveView({
        name: payload.name,
        module: "general-ledger-chart-of-accounts",
        filters: {
          ...currentFilters,
          visibleColumnIds: nextVisibleColumnIds,
        },
        columns: nextVisibleColumnIds,
        sortBy: sort.key,
        sortDirection: sort.direction,
        isDefault: payload.isDefault,
        roleScope: activeRole?.id ? [activeRole.id] : undefined,
      })

      await refreshViews(nextView.id)
    } finally {
      setIsSavingView(false)
    }
  }

  async function handleDeleteView(view: SavedView) {
    await deleteSavedView(view.id)
    await refreshViews(activeViewId === view.id ? null : activeViewId)
  }

  async function handleSetDefaultView(view: SavedView) {
    await setDefaultView(view.id, view.module)
    await refreshViews(view.id)
  }

  function toggleVisibleColumn(columnId: string, visible: boolean) {
    setVisibleColumnIds(previous => {
      const current = previous.length ? previous : allColumnIds
      const next = visible
        ? allColumnIds.filter(id => new Set([...current, columnId]).has(id))
        : current.filter(id => id !== columnId)

      return next.length === allColumnIds.length ? [] : next
    })
    setActiveViewId(null)
  }

  if (!workspace) {
    return null
  }

  return (
    <>
      <OperatorListWorkspace
        moduleKey="general-ledger-chart-of-accounts"
        moduleLabel="Chart Of Accounts"
        eyebrow="Ledger Structure"
        title="Chart of Accounts"
        description="Maintain account structure and review balances with service-driven ledger metadata."
        metrics={workspace.metrics}
        actions={workspace.actions}
        actionHandlers={{
          "new-account": () => {
            setEditingAccount(null)
            setModalOpen(true)
          },
          "export-accounts": () => toast.info("Account export will connect to the export service in a later milestone."),
        }}
        onApplySavedView={applySavedView}
        savedViews={savedViews}
        activeViewId={activeViewId}
        viewsLoading={isViewsLoading}
        viewsSaving={isSavingView}
        onSaveView={handleSaveView}
        onDeleteView={handleDeleteView}
        onSetDefaultView={handleSetDefaultView}
        search={search}
        onSearchChange={value => {
          setSearch(value)
          setPage(1)
          setActiveViewId(null)
        }}
        searchPlaceholder="Search account number, name, or category..."
        filters={filters}
        visibleColumnIds={visibleColumnIds}
        onToggleColumn={toggleVisibleColumn}
        columnOptions={columnOptions}
        rows={workspace.data}
        columns={columns}
        rowId={account => account.id}
        sort={sort}
        selectedIds={selectedIds}
        page={workspace.page}
        pageSize={workspace.pageSize}
        total={workspace.total}
        totalPages={workspace.totalPages}
        emptyMessage={workspace.emptyMessage}
        onRowClick={openDetail}
        onSortChange={nextSort => {
          setSort(nextSort)
          setActiveViewId(null)
        }}
        onSelectedIdsChange={setSelectedIds}
        onPageChange={setPage}
        onPageSizeChange={nextPageSize => {
          setPageSize(nextPageSize)
          setPage(1)
          setActiveViewId(null)
        }}
        drawer={
          <RecordDetailDrawer
            detail={detail}
            open={detailOpen}
            isLoading={detailLoading}
            onOpenChange={setDetailOpen}
            onAction={handleDetailAction}
          />
        }
      />
      <AccountModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingAccount(null)
        }}
        account={editingAccount}
        mode={editingAccount ? "edit" : "create"}
        onSave={async data => {
          await saveAccount(data)
          setModalOpen(false)
          setEditingAccount(null)
          setRefreshKey(previous => previous + 1)
        }}
      />
    </>
  )
}
