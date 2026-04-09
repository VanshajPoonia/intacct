"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { RecordDetailDrawer } from "@/components/finance/record-detail-drawer"
import { TabbedOperatorWorkspace } from "@/components/finance/tabbed-operator-workspace"
import type { OperatorTableColumn } from "@/components/finance/operator-data-table"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { Badge } from "@/components/ui/badge"
import {
  deleteSavedView,
  getSavedViews,
  saveView,
  setDefaultView,
} from "@/lib/services"
import type {
  FinanceFilters,
  PlatformOverviewData,
  PlatformWorkspaceListResponse,
  PlatformWorkspaceQuery,
  PlatformWorkspaceRecord,
  RoleId,
  SavedView,
  SortConfig,
  WorkspaceAction,
  WorkspaceDetailAction,
  WorkspaceDetailData,
  WorkspaceTabItem,
} from "@/lib/types"
import { cn } from "@/lib/utils"

interface PlatformWorkspaceService<SectionId extends string> {
  getDefaultSection: (roleId?: RoleId) => SectionId
  getTabs: (filters: FinanceFilters, roleId?: RoleId) => Promise<WorkspaceTabItem[]>
  getOverview: (filters: FinanceFilters, roleId?: RoleId) => Promise<PlatformOverviewData>
  getList: (
    sectionId: SectionId,
    filters: FinanceFilters,
    query: PlatformWorkspaceQuery
  ) => Promise<PlatformWorkspaceListResponse>
  getDetail: (sectionId: SectionId, id: string) => Promise<WorkspaceDetailData | null>
  applyAction?: (
    sectionId: SectionId,
    actionId: string,
    recordIds: string[],
    context: { roleId?: RoleId; userId?: string; filters: FinanceFilters }
  ) => Promise<{ success: boolean; message?: string }>
}

interface PlatformWorkspaceViewFilters {
  sectionId?: string
  search?: string
  filterValues?: Record<string, string>
  visibleColumnIds?: string[]
}

interface PlatformWorkspaceProps<SectionId extends string> {
  moduleKey: string
  eyebrow?: string
  lockedSectionId?: SectionId
  service: PlatformWorkspaceService<SectionId>
}

const toneClasses = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const

function parseViewFilters(value: Record<string, unknown> | undefined): PlatformWorkspaceViewFilters {
  return {
    sectionId: typeof value?.sectionId === "string" ? value.sectionId : undefined,
    search: typeof value?.search === "string" ? value.search : "",
    filterValues:
      value?.filterValues && typeof value.filterValues === "object"
        ? Object.entries(value.filterValues).reduce<Record<string, string>>((accumulator, [key, entryValue]) => {
            if (typeof entryValue === "string") {
              accumulator[key] = entryValue
            }
            return accumulator
          }, {})
        : {},
    visibleColumnIds: Array.isArray(value?.visibleColumnIds)
      ? value.visibleColumnIds.filter((columnId): columnId is string => typeof columnId === "string")
      : [],
  }
}

function buildPlatformColumns(columns: PlatformWorkspaceListResponse["columns"]): OperatorTableColumn<PlatformWorkspaceRecord>[] {
  return columns.map(column => ({
    ...column,
    render: row => {
      switch (column.id) {
        case "title":
          return (
            <div className="space-y-1">
              <div className="font-medium text-foreground">{row.title}</div>
              {row.subtitle ? <div className="text-xs text-muted-foreground">{row.subtitle}</div> : null}
              {row.reference ? <div className="text-xs text-muted-foreground">{row.reference}</div> : null}
              {row.meta?.length ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {row.meta.map(item => (
                    <Badge key={item} variant="outline" className="rounded-sm px-1.5 py-0 text-[10px]">
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          )
        case "status":
          return (
            <Badge
              variant="outline"
              className={cn(
                "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                toneClasses[row.statusTone ?? "neutral"]
              )}
            >
              {row.status}
            </Badge>
          )
        case "type":
          return <div className="text-sm text-foreground">{row.typeLabel ?? "None"}</div>
        case "entity":
          return <div className="text-sm text-foreground">{row.entityName ?? "Shared"}</div>
        case "scope":
          return <div className="text-sm text-foreground">{row.scopeLabel ?? "None"}</div>
        case "owner":
          return <div className="text-sm text-foreground">{row.ownerLabel ?? "Unassigned"}</div>
        case "primaryMetric":
          return (
            <div className="space-y-0.5 text-right">
              <div className="font-medium text-foreground">{row.primaryMetricDisplay ?? "None"}</div>
              {row.primaryMetricLabel ? <div className="text-xs text-muted-foreground">{row.primaryMetricLabel}</div> : null}
            </div>
          )
        case "secondaryMetric":
          return (
            <div className="space-y-0.5 text-right">
              <div className="font-medium text-foreground">{row.secondaryMetricDisplay ?? "None"}</div>
              {row.secondaryMetricLabel ? <div className="text-xs text-muted-foreground">{row.secondaryMetricLabel}</div> : null}
            </div>
          )
        case "primaryDate":
          return <div className="text-sm text-foreground">{row.primaryDateDisplay ?? "None"}</div>
        case "secondaryDate":
          return <div className="text-sm text-foreground">{row.secondaryDateDisplay ?? "None"}</div>
        default:
          return <div className="text-sm text-foreground">{row.reference ?? row.title}</div>
      }
    },
  }))
}

export function PlatformWorkspace<SectionId extends string>({
  moduleKey,
  eyebrow,
  lockedSectionId,
  service,
}: PlatformWorkspaceProps<SectionId>) {
  const { toast } = useToast()
  const { activeEntity, activeRole, currentUser, dateRange } = useWorkspaceShell()

  const activeRoleId = activeRole?.id
  const activeEntityId = activeEntity?.id
  const currentUserId = currentUser?.id
  const dateStart = dateRange?.startDate.getTime()
  const dateEnd = dateRange?.endDate.getTime()

  const [overview, setOverview] = useState<PlatformOverviewData | null>(null)
  const [tabs, setTabs] = useState<WorkspaceTabItem[]>([])
  const [rowsResponse, setRowsResponse] = useState<PlatformWorkspaceListResponse | null>(null)
  const [detail, setDetail] = useState<WorkspaceDetailData | null>(null)
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<SectionId | null>(lockedSectionId ?? null)
  const [search, setSearch] = useState("")
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<SortConfig>({ key: "primaryDateValue", direction: "desc" })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>([])
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [isViewsLoading, setIsViewsLoading] = useState(true)
  const [isViewsSaving, setIsViewsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [didApplyDefaultView, setDidApplyDefaultView] = useState(false)

  const scopedFilters = useMemo<FinanceFilters | null>(() => {
    if (!activeEntity || !dateRange) {
      return null
    }

    return {
      entityId: activeEntity.id,
      dateRange,
      departmentId: filterValues.departmentId && filterValues.departmentId !== "all" ? filterValues.departmentId : undefined,
      projectId: filterValues.projectId && filterValues.projectId !== "all" ? filterValues.projectId : undefined,
    }
  }, [activeEntity, dateRange, filterValues.departmentId, filterValues.projectId])

  const applyView = useCallback((view: SavedView, fallbackSection?: SectionId) => {
    const parsed = parseViewFilters(view.filters)
    const nextSection = (lockedSectionId ?? parsed.sectionId ?? fallbackSection ?? activeSection) as SectionId | null
    setActiveViewId(view.id)
    setSearch(parsed.search ?? "")
    setFilterValues(parsed.filterValues ?? {})
    setVisibleColumnIds(parsed.visibleColumnIds ?? [])
    setSort({
      key: view.sortBy ?? "primaryDateValue",
      direction: view.sortDirection ?? "desc",
    })
    setPage(1)
    setSelectedIds([])
    if (!lockedSectionId && nextSection) {
      setActiveSection(nextSection)
    }
  }, [activeSection, lockedSectionId])

  useEffect(() => {
    if (!activeRoleId) {
      return
    }

    const nextSection = lockedSectionId ?? service.getDefaultSection(activeRoleId)
    setActiveSection(nextSection)
    setSearch("")
    setFilterValues({})
    setSort({ key: "primaryDateValue", direction: "desc" })
    setPage(1)
    setPageSize(15)
    setSelectedIds([])
    setVisibleColumnIds([])
    setActiveViewId(null)
    setDidApplyDefaultView(false)
  }, [activeRoleId, lockedSectionId, service])

  useEffect(() => {
    if (!scopedFilters || !activeRoleId) {
      return
    }

    let cancelled = false
    setIsViewsLoading(true)

    Promise.all([
      service.getOverview(scopedFilters, activeRoleId),
      service.getTabs(scopedFilters, activeRoleId),
      getSavedViews(moduleKey),
    ]).then(([nextOverview, nextTabs, nextViews]) => {
      if (cancelled) {
        return
      }

      const scopedTabs = lockedSectionId ? nextTabs.filter(tab => tab.id === lockedSectionId) : nextTabs
      setOverview(nextOverview)
      setTabs(scopedTabs)
      setSavedViews(
        nextViews.filter(view => !view.roleScope?.length || (activeRoleId && view.roleScope.includes(activeRoleId)))
      )
      if (!lockedSectionId && !activeSection && scopedTabs.length) {
        setActiveSection(scopedTabs[0].id as SectionId)
      }
      setIsViewsLoading(false)
    }).catch(() => {
      if (!cancelled) {
        setIsViewsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [activeRoleId, activeSection, lockedSectionId, moduleKey, reloadKey, scopedFilters, service])

  useEffect(() => {
    if (!savedViews.length || didApplyDefaultView) {
      return
    }

    const defaultView = savedViews.find(view => view.isDefault)
    if (!defaultView) {
      setDidApplyDefaultView(true)
      return
    }

    applyView(defaultView, lockedSectionId ?? service.getDefaultSection(activeRoleId))
    setDidApplyDefaultView(true)
  }, [activeRoleId, applyView, didApplyDefaultView, lockedSectionId, savedViews, service])

  useEffect(() => {
    if (!scopedFilters || !activeSection) {
      return
    }

    let cancelled = false
    setIsLoading(true)

    service.getList(activeSection, scopedFilters, {
      search,
      filters: filterValues,
      sort,
      page,
      pageSize,
    }).then(nextRowsResponse => {
      if (cancelled) {
        return
      }

      setRowsResponse(nextRowsResponse)
      setIsLoading(false)
      if (!visibleColumnIds.length && nextRowsResponse.defaultVisibleColumnIds?.length) {
        setVisibleColumnIds(nextRowsResponse.defaultVisibleColumnIds)
      }
      if (page > nextRowsResponse.totalPages) {
        setPage(nextRowsResponse.totalPages)
      }
    }).catch(() => {
      if (!cancelled) {
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [activeSection, filterValues, page, pageSize, scopedFilters, search, service, sort, visibleColumnIds.length])

  useEffect(() => {
    if (!activeSection || !drawerId) {
      setDetail(null)
      return
    }

    let cancelled = false
    setIsDetailLoading(true)

    service.getDetail(activeSection, drawerId).then(nextDetail => {
      if (cancelled) {
        return
      }

      setDetail(nextDetail)
      setIsDetailLoading(false)
    }).catch(() => {
      if (!cancelled) {
        setIsDetailLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [activeSection, drawerId, reloadKey, service])

  const filteredColumns = useMemo(() => {
    if (!rowsResponse) {
      return [] as OperatorTableColumn<PlatformWorkspaceRecord>[]
    }

    const columns = buildPlatformColumns(rowsResponse.columns)
    if (!visibleColumnIds.length) {
      return columns
    }

    return columns.filter(column => visibleColumnIds.includes(column.id))
  }, [rowsResponse, visibleColumnIds])

  const columnOptions = useMemo(
    () =>
      rowsResponse?.columns.map(column => ({
        id: column.id,
        label: column.label,
      })) ?? [],
    [rowsResponse]
  )

  const filterDefinitions = useMemo(
    () =>
      rowsResponse?.filters.map(filter => ({
        ...filter,
        value: filterValues[filter.id] ?? "all",
        onChange: (value: string) => {
          setFilterValues(previousValue => ({
            ...previousValue,
            [filter.id]: value,
          }))
          setPage(1)
          setSelectedIds([])
        },
      })) ?? [],
    [filterValues, rowsResponse]
  )

  const handleAction = useCallback(async (actionId: string, recordIds: string[]) => {
    if (!activeSection || !scopedFilters || !service.applyAction) {
      return
    }

    const result = await service.applyAction(activeSection, actionId, recordIds, {
      roleId: activeRoleId,
      userId: currentUserId,
      filters: scopedFilters,
    })

    if (result.success) {
      toast({
        title: "Workspace updated",
        description: result.message ?? "The service-backed workspace state is now up to date.",
      })
      setSelectedIds([])
      setReloadKey(previousValue => previousValue + 1)
    } else {
      toast({
        title: "Action unavailable",
        description: result.message ?? "This action could not be completed.",
        variant: "destructive",
      })
    }
  }, [activeRoleId, activeSection, currentUserId, scopedFilters, service, toast])

  const pageActionHandlers = useMemo(() => {
    const handlers: Partial<Record<string, () => void>> = {}
    rowsResponse?.actions.forEach(action => {
      if (!action.href) {
        handlers[action.id] = () => {
          void handleAction(action.id, [])
        }
      }
    })
    return handlers
  }, [handleAction, rowsResponse])

  const bulkActions = useMemo(
    () =>
      rowsResponse?.bulkActions?.map(action => ({
        id: action.id,
        label: action.label,
        icon: action.icon,
        disabled: !selectedIds.length,
        onClick: () => {
          void handleAction(action.id, selectedIds)
        },
      })) ?? [],
    [handleAction, rowsResponse, selectedIds]
  )

  const handleSaveView = useCallback(async ({ name, isDefault }: { name: string; isDefault: boolean }) => {
    if (!currentUserId) {
      return
    }

    setIsViewsSaving(true)
    const nextView = await saveView({
      name,
      module: moduleKey,
      filters: {
        sectionId: activeSection,
        search,
        filterValues,
        visibleColumnIds,
      },
      columns: visibleColumnIds,
      sortBy: sort.key,
      sortDirection: sort.direction,
      isDefault,
      roleScope: activeRoleId ? [activeRoleId] : undefined,
      createdBy: currentUserId,
    })

    setSavedViews(previousValue => [nextView, ...previousValue.filter(view => view.id !== nextView.id)])
    setActiveViewId(nextView.id)
    setIsViewsSaving(false)
  }, [activeRoleId, activeSection, currentUserId, filterValues, moduleKey, search, sort.direction, sort.key, visibleColumnIds])

  const handleDeleteView = useCallback(async (view: SavedView) => {
    await deleteSavedView(view.id)
    setSavedViews(previousValue => previousValue.filter(candidate => candidate.id !== view.id))
    if (activeViewId === view.id) {
      setActiveViewId(null)
    }
  }, [activeViewId])

  const handleSetDefaultView = useCallback(async (view: SavedView) => {
    await setDefaultView(view.id, view.module)
    setSavedViews(previousValue =>
      previousValue.map(candidate => ({
        ...candidate,
        isDefault: candidate.id === view.id,
      }))
    )
  }, [])

  const handleDrawerAction = useCallback((action: WorkspaceDetailAction) => {
    void handleAction(action.id, detail ? [detail.id] : [])
  }, [detail, handleAction])

  const filteredTabs = useMemo(
    () => (lockedSectionId ? tabs.filter(tab => tab.id === lockedSectionId) : tabs),
    [lockedSectionId, tabs]
  )

  if (!overview || !rowsResponse || !activeSection || !scopedFilters) {
    return null
  }

  return (
    <TabbedOperatorWorkspace
      moduleLabel={moduleKey}
      eyebrow={eyebrow}
      title={overview.title}
      description={overview.subtitle}
      metrics={rowsResponse.metrics.length ? rowsResponse.metrics : overview.metrics}
      actions={rowsResponse.actions.length ? rowsResponse.actions : overview.actions}
      actionHandlers={pageActionHandlers}
      tabs={filteredTabs}
      activeTabId={activeSection}
      onTabChange={tabId => {
        if (lockedSectionId) {
          return
        }
        setActiveSection(tabId as SectionId)
        setPage(1)
        setSelectedIds([])
        setActiveViewId(null)
        setVisibleColumnIds([])
      }}
      savedViews={savedViews}
      activeViewId={activeViewId}
      viewsLoading={isViewsLoading}
      viewsSaving={isViewsSaving}
      onApplySavedView={view => applyView(view, service.getDefaultSection(activeRoleId))}
      onSaveView={handleSaveView}
      onDeleteView={handleDeleteView}
      onSetDefaultView={handleSetDefaultView}
      search={search}
      onSearchChange={value => {
        setSearch(value)
        setPage(1)
        setSelectedIds([])
      }}
      searchPlaceholder={`Search ${overview.title.toLowerCase()}...`}
      filters={filterDefinitions}
      visibleColumnIds={visibleColumnIds}
      onToggleColumn={(columnId, visible) => {
        setVisibleColumnIds(previousValue => {
          if (visible) {
            return Array.from(new Set([...previousValue, columnId]))
          }

          return previousValue.filter(value => value !== columnId)
        })
      }}
      columnOptions={columnOptions}
      bulkActions={bulkActions}
      rows={rowsResponse.data}
      columns={filteredColumns}
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
          isLoading={isDetailLoading}
          onOpenChange={open => {
            if (!open) {
              setDrawerId(null)
            }
          }}
          onAction={handleDrawerAction}
        />
      }
      onRowClick={row => setDrawerId(row.id)}
      onSortChange={nextSort => {
        setSort(nextSort)
        setPage(1)
      }}
      onSelectedIdsChange={setSelectedIds}
      onPageChange={setPage}
      onPageSizeChange={nextPageSize => {
        setPageSize(nextPageSize)
        setPage(1)
      }}
    />
  )
}
