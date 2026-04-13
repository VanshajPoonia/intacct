"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { OperatorListWorkspace } from "@/components/finance/operator-list-workspace"
import { RecordDetailDrawer } from "@/components/finance/record-detail-drawer"
import { CreateVendorModal } from "@/components/accounts-payable/create-vendor-modal"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import {
  deleteSavedView,
  getSavedViews,
  getVendorWorkspaceDetail,
  getVendorsWorkspace,
  saveView,
  setDefaultView,
  updateVendor,
} from "@/lib/services"
import type { SavedView, SortConfig, Vendor, WorkspaceDetailAction, WorkspaceDetailData, WorkspaceFilterDefinition } from "@/lib/types"
import type { OperatorTableColumn } from "@/components/finance/operator-data-table"
import { formatCurrency } from "@/lib/utils"

export default function VendorsPage() {
  const { activeRole } = useWorkspaceShell()
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof getVendorsWorkspace>> | null>(null)
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [didApplyDefaultView, setDidApplyDefaultView] = useState(false)
  const [isViewsLoading, setIsViewsLoading] = useState(true)
  const [isSavingView, setIsSavingView] = useState(false)
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [sort, setSort] = useState<SortConfig>({ key: "name", direction: "asc" })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detail, setDetail] = useState<WorkspaceDetailData | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    getVendorsWorkspace({
      search: search || undefined,
      statuses: status !== "all" ? [status] : undefined,
      sort,
      page,
      pageSize,
    }).then(data => {
      setWorkspace(data)
      setSelectedIds(previous => previous.filter(id => data.data.some(vendor => vendor.id === id)))
    })
  }, [page, pageSize, refreshKey, search, sort, status])

  const columns = useMemo<OperatorTableColumn<Vendor>[]>(
    () => [
      {
        id: "vendor",
        label: "Vendor",
        sortKey: "name",
        render: vendor => (
          <div className="space-y-1">
            <div className="font-medium text-foreground">{vendor.name}</div>
            <div className="text-sm text-muted-foreground">{vendor.code}</div>
          </div>
        ),
      },
      {
        id: "email",
        label: "Email",
        sortKey: "email",
        render: vendor => <div className="text-sm text-foreground">{vendor.email}</div>,
      },
      {
        id: "terms",
        label: "Terms",
        sortKey: "paymentTerms",
        render: vendor => <div className="text-sm text-foreground">{vendor.paymentTerms}</div>,
      },
      {
        id: "status",
        label: "Status",
        sortKey: "status",
        render: vendor => <Badge variant="outline" className="rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]">{vendor.status}</Badge>,
      },
      {
        id: "balance",
        label: "Open Balance",
        sortKey: "balance",
        align: "right",
        render: vendor => <div className="font-medium text-foreground">{formatCurrency(vendor.balance, vendor.currency)}</div>,
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

    getSavedViews("accounts-payable-vendors")
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

  const filters = useMemo<Array<WorkspaceFilterDefinition & { value: string; onChange: (value: string) => void }>>(
    () =>
      (workspace?.filters.map(filter => ({
        ...filter,
        value: status,
        onChange: value => {
          setStatus(value)
          setPage(1)
          setActiveViewId(null)
        },
      })) ?? []),
    [status, workspace?.filters]
  )

  const currentFilters = {
    search,
    status,
    sortKey: sort.key,
    sortDirection: sort.direction,
    pageSize,
    visibleColumnIds: visibleColumnIds.length ? visibleColumnIds : allColumnIds,
  }

  const applySavedView = useCallback((view: SavedView) => {
    const filters = view.filters as Record<string, unknown>
    setSearch(String(filters.search ?? ""))
    setStatus(String(filters.status ?? "all"))
    setSort({
      key: view.sortBy ?? String(filters.sortKey ?? "name"),
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
    const views = await getSavedViews("accounts-payable-vendors")
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
        module: "accounts-payable-vendors",
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

  async function openDetail(vendor: Vendor) {
    setDetailOpen(true)
    setDetailLoading(true)
    const nextDetail = await getVendorWorkspaceDetail(vendor.id)
    setDetail(nextDetail)
    setDetailLoading(false)
  }

  async function handleDetailAction(action: WorkspaceDetailAction) {
    if (action.id === "edit-vendor" && detail && workspace) {
      const vendor = workspace.data.find(item => item.id === detail.id) ?? null
      setEditingVendor(vendor)
      setModalOpen(true)
    }
  }

  async function updateSelectedStatus(nextStatus: Vendor["status"]) {
    const updates = workspace?.data.filter(vendor => selectedIds.includes(vendor.id)) ?? []
    for (const vendor of updates) {
      await updateVendor(vendor.id, { status: nextStatus })
    }
    toast.success(`${updates.length} vendors updated`)
    setSelectedIds([])
    setRefreshKey(previous => previous + 1)
  }

  if (!workspace) {
    return null
  }

  return (
    <>
      <OperatorListWorkspace
        moduleKey="accounts-payable-vendors"
        moduleLabel="Vendors"
        eyebrow="Vendor Master"
        title="Vendors"
        description="Maintain vendor records, remittance setup, and liability exposure from one dense workspace."
        metrics={workspace.metrics}
        actions={workspace.actions}
        actionHandlers={{
          "new-vendor": () => {
            setEditingVendor(null)
            setModalOpen(true)
          },
          "export-vendors": () => toast.info("Vendor export will connect to the export service in a later milestone."),
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
        searchPlaceholder="Search vendor name, code, or email..."
        filters={filters}
        visibleColumnIds={visibleColumnIds}
        onToggleColumn={toggleVisibleColumn}
        columnOptions={columnOptions}
        bulkActions={[
          {
            id: "activate-vendors",
            label: "Set Active",
            icon: "CheckSquare",
            disabled: selectedIds.length === 0,
            onClick: () => updateSelectedStatus("active"),
          },
          {
            id: "pending-vendors",
            label: "Mark Pending",
            icon: "RefreshCcw",
            disabled: selectedIds.length === 0,
            onClick: () => updateSelectedStatus("pending"),
          },
        ]}
        rows={workspace.data}
        columns={columns}
        rowId={vendor => vendor.id}
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
      <CreateVendorModal
        open={modalOpen}
        vendor={editingVendor}
        onClose={() => {
          setModalOpen(false)
          setEditingVendor(null)
        }}
        onSuccess={() => {
          setModalOpen(false)
          setEditingVendor(null)
          setRefreshKey(previous => previous + 1)
        }}
      />
    </>
  )
}
