"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OperatorListWorkspace } from "@/components/finance/operator-list-workspace"
import { RecordDetailDrawer } from "@/components/finance/record-detail-drawer"
import { CreateJournalEntryModal } from "@/components/general-ledger/create-journal-entry-modal"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import {
  deleteSavedView,
  getDepartments,
  getJournalEntriesWorkspace,
  getJournalEntryWorkspaceDetail,
  getProjects,
  getSavedViews,
  postJournalEntry,
  reverseJournalEntry,
  saveView,
  setDefaultView,
} from "@/lib/services"
import type {
  Department,
  JournalEntry,
  Project,
  SavedView,
  SortConfig,
  WorkspaceDetailAction,
  WorkspaceDetailData,
  WorkspaceFilterDefinition,
} from "@/lib/types"
import type { OperatorTableColumn } from "@/components/finance/operator-data-table"
import { formatDate, formatCurrency } from "@/lib/utils"

const toneClasses = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const

function getStatusTone(status: string) {
  switch (status) {
    case "posted":
      return "positive"
    case "draft":
    case "pending":
      return "warning"
    case "reversed":
      return "critical"
    default:
      return "neutral"
  }
}

export default function JournalEntriesPage() {
  const { activeEntity, activeRole, dateRange } = useWorkspaceShell()
  const [departments, setDepartments] = useState<Department[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof getJournalEntriesWorkspace>> | null>(null)
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [didApplyDefaultView, setDidApplyDefaultView] = useState(false)
  const [isViewsLoading, setIsViewsLoading] = useState(true)
  const [isSavingView, setIsSavingView] = useState(false)
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [departmentId, setDepartmentId] = useState("all")
  const [projectId, setProjectId] = useState("all")
  const [sort, setSort] = useState<SortConfig>({ key: "date", direction: "desc" })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detail, setDetail] = useState<WorkspaceDetailData | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    Promise.all([getDepartments(), getProjects()]).then(([nextDepartments, nextProjects]) => {
      setDepartments(nextDepartments)
      setProjects(nextProjects)
    })
  }, [])

  useEffect(() => {
    if (!activeEntity || !dateRange) {
      return
    }

    getJournalEntriesWorkspace(
      {
        entityId: activeEntity.id,
        dateRange,
        departmentId: departmentId !== "all" ? departmentId : undefined,
        projectId: projectId !== "all" ? projectId : undefined,
      },
      {
        search: search || undefined,
        statuses: status !== "all" ? [status] : undefined,
        sort,
        page,
        pageSize,
      }
    ).then(data => {
      setWorkspace(data)
      setSelectedIds(previous => previous.filter(id => data.data.some(entry => entry.id === id)))
    })
  }, [activeEntity, dateRange, departmentId, page, pageSize, projectId, refreshKey, search, sort, status])

  const columns = useMemo<OperatorTableColumn<JournalEntry>[]>(
    () => [
      {
        id: "entry",
        label: "Journal Entry",
        sortKey: "number",
        render: entry => (
          <div className="space-y-1">
            <div className="font-medium text-foreground">{entry.number}</div>
            <div className="text-sm text-muted-foreground">{entry.description}</div>
          </div>
        ),
      },
      {
        id: "date",
        label: "Date",
        sortKey: "date",
        render: entry => <div className="text-sm text-foreground">{formatDate(entry.date)}</div>,
      },
      {
        id: "status",
        label: "Status",
        sortKey: "status",
        render: entry => (
          <Badge
            variant="outline"
            className={`rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${toneClasses[getStatusTone(entry.status)]}`}
          >
            {entry.status}
          </Badge>
        ),
      },
      {
        id: "created-by",
        label: "Created By",
        sortKey: "createdBy",
        render: entry => <div className="text-sm text-foreground">{entry.createdBy}</div>,
      },
      {
        id: "lines",
        label: "Lines",
        align: "right",
        render: entry => <div className="text-sm font-medium text-foreground">{entry.lines.length}</div>,
      },
      {
        id: "amount",
        label: "Entry Value",
        align: "right",
        render: entry => (
          <div className="font-medium text-foreground">
            {formatCurrency(
              entry.lines.reduce((sum, line) => sum + Math.max(line.debit, line.credit), 0)
            )}
          </div>
        ),
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

    getSavedViews("general-ledger-journal-entries")
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

  const filterDefinitions = useMemo<Array<WorkspaceFilterDefinition & { value: string; onChange: (value: string) => void }>>(
    () => [
      ...(workspace?.filters.map(filter => ({
        ...filter,
        value: status,
        onChange: (value: string) => {
          setStatus(value)
          setPage(1)
          setActiveViewId(null)
        },
      })) ?? []),
      {
        id: "department",
        label: "Department",
        value: departmentId,
        onChange: value => {
          setDepartmentId(value)
          setPage(1)
          setActiveViewId(null)
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
          setActiveViewId(null)
        },
        options: [{ value: "all", label: "All Projects" }, ...projects.map(project => ({ value: project.id, label: project.name }))],
      },
    ],
    [departmentId, departments, projectId, projects, status, workspace?.filters]
  )

  const currentFilters = {
    search,
    status,
    departmentId,
    projectId,
    sortKey: sort.key,
    sortDirection: sort.direction,
    pageSize,
    visibleColumnIds: visibleColumnIds.length ? visibleColumnIds : allColumnIds,
  }

  const applySavedView = useCallback((view: SavedView) => {
    const filters = view.filters as Record<string, unknown>
    setSearch(String(filters.search ?? ""))
    setStatus(String(filters.status ?? "all"))
    setDepartmentId(String(filters.departmentId ?? "all"))
    setProjectId(String(filters.projectId ?? "all"))
    setSort({
      key: view.sortBy ?? String(filters.sortKey ?? "date"),
      direction: view.sortDirection === "asc" ? "asc" : "desc",
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
    const views = await getSavedViews("general-ledger-journal-entries")
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
        module: "general-ledger-journal-entries",
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

  async function openDetail(entry: JournalEntry) {
    setDetailOpen(true)
    setDetailLoading(true)
    const nextDetail = await getJournalEntryWorkspaceDetail(entry.id)
    setDetail(nextDetail)
    setDetailLoading(false)
  }

  async function handleDetailAction(action: WorkspaceDetailAction) {
    if (!detail) {
      return
    }

    if (action.id === "post") {
      await postJournalEntry(detail.id)
      toast.success("Journal entry posted")
    }

    if (action.id === "reverse") {
      await reverseJournalEntry(detail.id)
      toast.success("Journal entry reversed")
    }

    setRefreshKey(previous => previous + 1)
    setDetail(await getJournalEntryWorkspaceDetail(detail.id))
  }

  async function postSelectedDrafts() {
    const draftIds = workspace?.data.filter(entry => selectedIds.includes(entry.id) && entry.status === "draft").map(entry => entry.id) ?? []
    for (const id of draftIds) {
      await postJournalEntry(id)
    }
    toast.success(`${draftIds.length} journal entries posted`)
    setSelectedIds([])
    setRefreshKey(previous => previous + 1)
  }

  async function reverseSelectedPosted() {
    const postedIds = workspace?.data.filter(entry => selectedIds.includes(entry.id) && entry.status === "posted").map(entry => entry.id) ?? []
    for (const id of postedIds) {
      await reverseJournalEntry(id)
    }
    toast.success(`${postedIds.length} journal entries reversed`)
    setSelectedIds([])
    setRefreshKey(previous => previous + 1)
  }

  if (!workspace) {
    return null
  }

  return (
    <>
      <OperatorListWorkspace
        moduleKey="general-ledger-journal-entries"
        moduleLabel="Journal Entries"
        eyebrow="Ledger Execution"
        title="Journal Entries"
        description="Review, post, and reverse journals with shell-driven entity and period context."
        metrics={workspace.metrics}
        actions={workspace.actions}
        actionHandlers={{
          "new-entry": () => setCreateOpen(true),
          "import-journal": () => toast.info("Journal import is prepared for a later integration milestone."),
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
        searchPlaceholder="Search journal number, description, or creator..."
        filters={filterDefinitions}
        visibleColumnIds={visibleColumnIds}
        onToggleColumn={toggleVisibleColumn}
        columnOptions={columnOptions}
        bulkActions={[
          {
            id: "bulk-post",
            label: "Post Drafts",
            icon: "CheckSquare",
            disabled: !workspace.data.some(entry => selectedIds.includes(entry.id) && entry.status === "draft"),
            onClick: postSelectedDrafts,
          },
          {
            id: "bulk-reverse",
            label: "Reverse Posted",
            icon: "RefreshCcw",
            disabled: !workspace.data.some(entry => selectedIds.includes(entry.id) && entry.status === "posted"),
            onClick: reverseSelectedPosted,
          },
        ]}
        rows={workspace.data}
        columns={columns}
        rowId={entry => entry.id}
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
      <CreateJournalEntryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false)
          setRefreshKey(previous => previous + 1)
        }}
        entityId={activeEntity?.id}
      />
    </>
  )
}
