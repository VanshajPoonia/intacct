"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { OperatorListWorkspace } from "@/components/finance/operator-list-workspace"
import { RecordDetailDrawer } from "@/components/finance/record-detail-drawer"
import { AccountModal } from "@/components/general-ledger/account-modal"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import {
  deleteAccount,
  getChartAccountWorkspaceDetail,
  getChartOfAccountsWorkspace,
  saveAccount,
} from "@/lib/services"
import type { Account, SortConfig, WorkspaceDetailAction, WorkspaceDetailData, WorkspaceFilterDefinition } from "@/lib/types"
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
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof getChartOfAccountsWorkspace>> | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sort, setSort] = useState<SortConfig>({ key: "number", direction: "asc" })
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
      }
    ).then(setWorkspace)
  }, [activeEntity, dateRange, refreshKey, search, sort, typeFilter])

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

  const currentFilters = {
    search,
    typeFilter,
    sortKey: sort.key,
    sortDirection: sort.direction,
  }

  function applySavedView(filters: Record<string, unknown>) {
    setSearch(String(filters.search ?? ""))
    setTypeFilter(String(filters.typeFilter ?? "all"))
    setSort({
      key: String(filters.sortKey ?? "number"),
      direction: filters.sortDirection === "desc" ? "desc" : "asc",
    })
  }

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
        onChange: setTypeFilter,
      })) ?? []),
    [typeFilter, workspace?.filters]
  )

  if (!workspace) {
    return null
  }

  return (
    <>
      <OperatorListWorkspace
        moduleKey="general-ledger-chart-of-accounts"
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
        currentFilters={currentFilters}
        onApplySavedView={applySavedView}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search account number, name, or category..."
        filters={filters}
        rows={workspace.data}
        columns={columns}
        rowId={account => account.id}
        sort={sort}
        selectedIds={selectedIds}
        page={1}
        pageSize={workspace.total}
        total={workspace.total}
        totalPages={1}
        emptyMessage={workspace.emptyMessage}
        onRowClick={openDetail}
        onSortChange={setSort}
        onSelectedIdsChange={setSelectedIds}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
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
