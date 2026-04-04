"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { OperatorListWorkspace } from "@/components/finance/operator-list-workspace"
import { RecordDetailDrawer } from "@/components/finance/record-detail-drawer"
import { CreateVendorModal } from "@/components/accounts-payable/create-vendor-modal"
import {
  getVendorWorkspaceDetail,
  getVendorsWorkspace,
  updateVendor,
} from "@/lib/services"
import type { Vendor, SortConfig, WorkspaceDetailAction, WorkspaceDetailData, WorkspaceFilterDefinition } from "@/lib/types"
import type { OperatorTableColumn } from "@/components/finance/operator-data-table"
import { formatCurrency } from "@/lib/utils"

export default function VendorsPage() {
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof getVendorsWorkspace>> | null>(null)
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
    }).then(setWorkspace)
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

  const filters = useMemo<Array<WorkspaceFilterDefinition & { value: string; onChange: (value: string) => void }>>(
    () =>
      (workspace?.filters.map(filter => ({
        ...filter,
        value: status,
        onChange: value => {
          setStatus(value)
          setPage(1)
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
  }

  function applySavedView(filters: Record<string, unknown>) {
    setSearch(String(filters.search ?? ""))
    setStatus(String(filters.status ?? "all"))
    setSort({
      key: String(filters.sortKey ?? "name"),
      direction: filters.sortDirection === "desc" ? "desc" : "asc",
    })
    setPageSize(Number(filters.pageSize ?? 15))
    setPage(1)
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
        currentFilters={currentFilters}
        onApplySavedView={applySavedView}
        search={search}
        onSearchChange={value => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder="Search vendor name, code, or email..."
        filters={filters}
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
        onSortChange={setSort}
        onSelectedIdsChange={setSelectedIds}
        onPageChange={setPage}
        onPageSizeChange={nextPageSize => {
          setPageSize(nextPageSize)
          setPage(1)
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
