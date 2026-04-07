"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { OperatorListWorkspace } from "@/components/finance/operator-list-workspace"
import { RecordDetailDrawer } from "@/components/finance/record-detail-drawer"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import {
  completePayment,
  getPaymentWorkspaceDetail,
  getPaymentsWorkspace,
  processPayment,
  voidPayment,
} from "@/lib/services"
import type { Payment, SortConfig, WorkspaceDetailAction, WorkspaceDetailData, WorkspaceFilterDefinition } from "@/lib/types"
import type { OperatorTableColumn } from "@/components/finance/operator-data-table"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function PaymentsPage() {
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof getPaymentsWorkspace>> | null>(null)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [method, setMethod] = useState("all")
  const [sort, setSort] = useState<SortConfig>({ key: "date", direction: "desc" })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detail, setDetail] = useState<WorkspaceDetailData | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!activeEntity || !dateRange) {
      return
    }

    getPaymentsWorkspace(
      {
        entityId: activeEntity.id,
        dateRange,
      },
      {
        search: search || undefined,
        statuses: status !== "all" ? [status] : undefined,
        methods: method !== "all" ? [method] : undefined,
        sort,
        page,
        pageSize,
      }
    ).then(data => {
      setWorkspace(data)
      setSelectedIds(previous => previous.filter(id => data.data.some(payment => payment.id === id)))
    })
  }, [activeEntity, dateRange, method, page, pageSize, refreshKey, search, sort, status])

  const columns = useMemo<OperatorTableColumn<Payment>[]>(
    () => [
      {
        id: "payment",
        label: "Payment",
        sortKey: "number",
        render: payment => (
          <div className="space-y-1">
            <div className="font-medium text-foreground">{payment.number}</div>
            <div className="text-sm text-muted-foreground">{payment.vendorName}</div>
          </div>
        ),
      },
      {
        id: "date",
        label: "Date",
        sortKey: "date",
        render: payment => <div className="text-sm text-foreground">{formatDate(payment.date)}</div>,
      },
      {
        id: "method",
        label: "Method",
        sortKey: "method",
        render: payment => <div className="text-sm uppercase text-foreground">{payment.method}</div>,
      },
      {
        id: "status",
        label: "Status",
        sortKey: "status",
        render: payment => <Badge variant="outline" className="rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]">{payment.status}</Badge>,
      },
      {
        id: "bank",
        label: "Bank Account",
        sortKey: "bankAccountName",
        render: payment => <div className="text-sm text-foreground">{payment.bankAccountName}</div>,
      },
      {
        id: "amount",
        label: "Amount",
        sortKey: "amount",
        align: "right",
        render: payment => <div className="font-medium text-foreground">{formatCurrency(payment.amount, payment.currency)}</div>,
      },
    ],
    []
  )

  const filters = useMemo<Array<WorkspaceFilterDefinition & { value: string; onChange: (value: string) => void }>>(
    () => {
      const base = workspace?.filters ?? []
      return base.map(filter =>
        filter.id === "method"
          ? { ...filter, value: method, onChange: (value: string) => { setMethod(value); setPage(1) } }
          : { ...filter, value: status, onChange: (value: string) => { setStatus(value); setPage(1) } }
      )
    },
    [method, status, workspace?.filters]
  )

  const currentFilters = {
    search,
    status,
    method,
    sortKey: sort.key,
    sortDirection: sort.direction,
    pageSize,
  }

  function applySavedView(filters: Record<string, unknown>) {
    setSearch(String(filters.search ?? ""))
    setStatus(String(filters.status ?? "all"))
    setMethod(String(filters.method ?? "all"))
    setSort({
      key: String(filters.sortKey ?? "date"),
      direction: filters.sortDirection === "asc" ? "asc" : "desc",
    })
    setPageSize(Number(filters.pageSize ?? 15))
    setPage(1)
  }

  async function openDetail(payment: Payment) {
    setDetailOpen(true)
    setDetailLoading(true)
    const nextDetail = await getPaymentWorkspaceDetail(payment.id)
    setDetail(nextDetail)
    setDetailLoading(false)
  }

  async function handleDetailAction(action: WorkspaceDetailAction) {
    if (!detail) {
      return
    }

    if (action.id === "process-payment") {
      await processPayment(detail.id)
      toast.success("Payment processing started")
    }

    if (action.id === "complete-payment") {
      await completePayment(detail.id)
      toast.success("Payment completed")
    }

    if (action.id === "void-payment") {
      await voidPayment(detail.id)
      toast.success("Payment voided")
    }

    setRefreshKey(previous => previous + 1)
    setDetail(await getPaymentWorkspaceDetail(detail.id))
  }

  async function runBulk(action: "process" | "complete" | "void") {
    const eligible = workspace?.data.filter(payment => selectedIds.includes(payment.id)) ?? []
    for (const payment of eligible) {
      if (action === "process" && payment.status === "pending") {
        await processPayment(payment.id)
      }
      if (action === "complete" && payment.status === "processing") {
        await completePayment(payment.id)
      }
      if (action === "void" && payment.status !== "completed" && payment.status !== "voided") {
        await voidPayment(payment.id)
      }
    }
    toast.success("Payment batch updated")
    setSelectedIds([])
    setRefreshKey(previous => previous + 1)
  }

  if (!workspace) {
    return null
  }

  return (
    <OperatorListWorkspace
      moduleKey="accounts-payable-payments"
      eyebrow="Disbursement Control"
      title="Payments"
      description="Release, track, and complete vendor disbursements with shell-driven entity and period context."
      metrics={workspace.metrics}
      actions={workspace.actions}
      actionHandlers={{
        "new-payment": () => toast.info("Interactive payment creation will be expanded in a later milestone."),
        "export-payments": () => toast.info("Payment export will connect to the export service in a later milestone."),
      }}
      currentFilters={currentFilters}
      onApplySavedView={applySavedView}
      search={search}
      onSearchChange={value => {
        setSearch(value)
        setPage(1)
      }}
      searchPlaceholder="Search payment number, vendor, or reference..."
      filters={filters}
      bulkActions={[
        {
          id: "process",
          label: "Start Processing",
          icon: "Play",
          disabled: !workspace.data.some(payment => selectedIds.includes(payment.id) && payment.status === "pending"),
          onClick: () => runBulk("process"),
        },
        {
          id: "complete",
          label: "Mark Complete",
          icon: "CheckSquare",
          disabled: !workspace.data.some(payment => selectedIds.includes(payment.id) && payment.status === "processing"),
          onClick: () => runBulk("complete"),
        },
      ]}
      rows={workspace.data}
      columns={columns}
      rowId={payment => payment.id}
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
  )
}
