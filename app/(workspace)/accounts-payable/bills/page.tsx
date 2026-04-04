"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { OperatorListWorkspace } from "@/components/finance/operator-list-workspace"
import { RecordDetailDrawer } from "@/components/finance/record-detail-drawer"
import { CreateBillModal } from "@/components/accounts-payable/create-bill-modal"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import {
  approveBill,
  getBillsWorkspace,
  getBillWorkspaceDetail,
  getDepartments,
  getProjects,
  getVendors,
  submitBillForApproval,
  voidBill,
} from "@/lib/services"
import type {
  Bill,
  Department,
  Project,
  SortConfig,
  Vendor,
  WorkspaceDetailAction,
  WorkspaceDetailData,
  WorkspaceFilterDefinition,
} from "@/lib/types"
import type { OperatorTableColumn } from "@/components/finance/operator-data-table"
import { formatCurrency, formatDate } from "@/lib/utils"

function getStatusTone(status: string) {
  switch (status) {
    case "approved":
      return "accent"
    case "paid":
      return "positive"
    case "pending":
    case "draft":
      return "warning"
    case "voided":
      return "critical"
    default:
      return "neutral"
  }
}

const toneClasses = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const

export default function BillsPage() {
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof getBillsWorkspace>> | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [vendorId, setVendorId] = useState("all")
  const [departmentId, setDepartmentId] = useState("all")
  const [projectId, setProjectId] = useState("all")
  const [sort, setSort] = useState<SortConfig>({ key: "dueDate", direction: "asc" })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detail, setDetail] = useState<WorkspaceDetailData | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    Promise.all([
      getVendors(undefined, undefined, { key: "name", direction: "asc" }, 1, 100),
      getDepartments(),
      getProjects(),
    ]).then(([vendorData, departmentData, projectData]) => {
      setVendors(vendorData.data)
      setDepartments(departmentData)
      setProjects(projectData)
    })
  }, [])

  useEffect(() => {
    if (!activeEntity || !dateRange) {
      return
    }

    getBillsWorkspace(
      {
        entityId: activeEntity.id,
        dateRange,
        departmentId: departmentId !== "all" ? departmentId : undefined,
        projectId: projectId !== "all" ? projectId : undefined,
      },
      {
        search: search || undefined,
        vendorId: vendorId !== "all" ? vendorId : undefined,
        statuses: status !== "all" ? [status] : undefined,
        sort,
        page,
        pageSize,
      }
    ).then(data => {
      setWorkspace(data)
      setSelectedIds(previous => previous.filter(id => data.data.some(bill => bill.id === id)))
    })
  }, [activeEntity, dateRange, departmentId, page, pageSize, projectId, refreshKey, search, sort, status, vendorId])

  const columns = useMemo<OperatorTableColumn<Bill>[]>(
    () => [
      {
        id: "bill",
        label: "Bill",
        sortKey: "number",
        render: bill => (
          <div className="space-y-1">
            <div className="font-medium text-foreground">{bill.number}</div>
            <div className="text-sm text-muted-foreground">{bill.description ?? bill.vendorName}</div>
          </div>
        ),
      },
      {
        id: "vendor",
        label: "Vendor",
        sortKey: "vendorName",
        render: bill => <div className="text-sm text-foreground">{bill.vendorName}</div>,
      },
      {
        id: "due-date",
        label: "Due Date",
        sortKey: "dueDate",
        render: bill => <div className="text-sm text-foreground">{formatDate(bill.dueDate)}</div>,
      },
      {
        id: "status",
        label: "Status",
        sortKey: "status",
        render: bill => (
          <Badge
            variant="outline"
            className={`rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${toneClasses[getStatusTone(bill.status)]}`}
          >
            {bill.status}
          </Badge>
        ),
      },
      {
        id: "department",
        label: "Department",
        sortKey: "departmentName",
        render: bill => <div className="text-sm text-foreground">{bill.departmentName ?? "Unassigned"}</div>,
      },
      {
        id: "amount",
        label: "Amount",
        sortKey: "amount",
        align: "right",
        render: bill => <div className="font-medium text-foreground">{formatCurrency(bill.amount, bill.currency)}</div>,
      },
    ],
    []
  )

  const filters = useMemo<Array<WorkspaceFilterDefinition & { value: string; onChange: (value: string) => void }>>(
    () => [
      ...(workspace?.filters.map(filter => ({
        ...filter,
        value: status,
        onChange: (value: string) => {
          setStatus(value)
          setPage(1)
        },
      })) ?? []),
      {
        id: "vendor",
        label: "Vendor",
        value: vendorId,
        onChange: value => {
          setVendorId(value)
          setPage(1)
        },
        options: [{ value: "all", label: "All Vendors" }, ...vendors.map(vendor => ({ value: vendor.id, label: vendor.name }))],
      },
      {
        id: "department",
        label: "Department",
        value: departmentId,
        onChange: value => {
          setDepartmentId(value)
          setPage(1)
        },
        options: [{ value: "all", label: "All Departments" }, ...departments.map(department => ({ value: department.id, label: department.name }))],
      },
      {
        id: "project",
        label: "Project",
        value: projectId,
        onChange: value => {
          setProjectId(value)
          setPage(1)
        },
        options: [{ value: "all", label: "All Projects" }, ...projects.map(project => ({ value: project.id, label: project.name }))],
      },
    ],
    [departmentId, departments, projectId, projects, status, vendorId, vendors, workspace?.filters]
  )

  const currentFilters = {
    search,
    status,
    vendorId,
    departmentId,
    projectId,
    sortKey: sort.key,
    sortDirection: sort.direction,
    pageSize,
  }

  function applySavedView(filters: Record<string, unknown>) {
    setSearch(String(filters.search ?? ""))
    setStatus(String(filters.status ?? "all"))
    setVendorId(String(filters.vendorId ?? "all"))
    setDepartmentId(String(filters.departmentId ?? "all"))
    setProjectId(String(filters.projectId ?? "all"))
    setSort({
      key: String(filters.sortKey ?? "dueDate"),
      direction: filters.sortDirection === "desc" ? "desc" : "asc",
    })
    setPageSize(Number(filters.pageSize ?? 15))
    setPage(1)
  }

  async function openDetail(bill: Bill) {
    setDetailOpen(true)
    setDetailLoading(true)
    const nextDetail = await getBillWorkspaceDetail(bill.id)
    setDetail(nextDetail)
    setDetailLoading(false)
  }

  async function handleDetailAction(action: WorkspaceDetailAction) {
    if (!detail) {
      return
    }

    if (action.id === "approve-bill") {
      await approveBill(detail.id)
      toast.success("Bill approved")
    }

    if (action.id === "void-bill") {
      await voidBill(detail.id)
      toast.success("Bill voided")
    }

    setRefreshKey(previous => previous + 1)
    setDetail(await getBillWorkspaceDetail(detail.id))
  }

  async function approveSelected() {
    const pendingIds = workspace?.data.filter(bill => selectedIds.includes(bill.id) && bill.status === "pending").map(bill => bill.id) ?? []
    for (const id of pendingIds) {
      await approveBill(id)
    }
    toast.success(`${pendingIds.length} bills approved`)
    setSelectedIds([])
    setRefreshKey(previous => previous + 1)
  }

  async function submitSelectedDrafts() {
    const draftIds = workspace?.data.filter(bill => selectedIds.includes(bill.id) && bill.status === "draft").map(bill => bill.id) ?? []
    for (const id of draftIds) {
      await submitBillForApproval(id)
    }
    toast.success(`${draftIds.length} bills submitted`)
    setSelectedIds([])
    setRefreshKey(previous => previous + 1)
  }

  if (!workspace) {
    return null
  }

  return (
    <>
      <OperatorListWorkspace
        moduleKey="accounts-payable-bills"
        eyebrow="Bill Operations"
        title="Bills"
        description="Review coding, approval readiness, and due-date exposure with shared shell filters."
        metrics={workspace.metrics}
        actions={workspace.actions}
        actionHandlers={{
          "new-bill": () => setCreateOpen(true),
          "export-bills": () => toast.info("Bill export will connect to the export service in a later milestone."),
        }}
        currentFilters={currentFilters}
        onApplySavedView={applySavedView}
        search={search}
        onSearchChange={value => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder="Search bill number, vendor, or description..."
        filters={filters}
        bulkActions={[
          {
            id: "approve-bills",
            label: "Approve Selected",
            icon: "CheckSquare",
            disabled: !workspace.data.some(bill => selectedIds.includes(bill.id) && bill.status === "pending"),
            onClick: approveSelected,
          },
          {
            id: "submit-bills",
            label: "Submit Drafts",
            icon: "Play",
            disabled: !workspace.data.some(bill => selectedIds.includes(bill.id) && bill.status === "draft"),
            onClick: submitSelectedDrafts,
          },
        ]}
        rows={workspace.data}
        columns={columns}
        rowId={bill => bill.id}
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
      <CreateBillModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false)
          setRefreshKey(previous => previous + 1)
        }}
      />
    </>
  )
}
