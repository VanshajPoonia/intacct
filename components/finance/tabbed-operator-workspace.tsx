"use client"

import { Search, Settings2 } from "lucide-react"
import type { ReactNode } from "react"
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import {
  DenseSectionHeader,
  WorkspaceBreadcrumbRow,
  WorkspaceContentContainer,
  WorkspacePageToolbar,
} from "@/components/layout/workspace-primitives"
import { OperatorDataTable, type OperatorTableColumn } from "@/components/finance/operator-data-table"
import { WorkspaceSavedViews } from "@/components/finance/workspace-saved-views"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  SavedView,
  SortConfig,
  WorkspaceAction,
  WorkspaceFilterDefinition,
  WorkspaceMetricCard,
  WorkspaceTabItem,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { getShellIcon } from "@/lib/utils/shell-icons"

interface TabbedOperatorWorkspaceProps<Row> {
  moduleLabel: string
  eyebrow?: string
  title: string
  description: string
  metrics: WorkspaceMetricCard[]
  actions?: WorkspaceAction[]
  actionHandlers?: Partial<Record<string, () => void>>
  tabs: WorkspaceTabItem[]
  activeTabId: string
  onTabChange: (tabId: string) => void
  savedViews: SavedView[]
  activeViewId: string | null
  viewsLoading?: boolean
  viewsSaving?: boolean
  onApplySavedView: (view: SavedView) => void
  onSaveView: (payload: { name: string; isDefault: boolean }) => void
  onDeleteView: (view: SavedView) => void
  onSetDefaultView: (view: SavedView) => void
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: Array<WorkspaceFilterDefinition & {
    value: string
    onChange: (value: string) => void
  }>
  visibleColumnIds?: string[]
  onToggleColumn?: (columnId: string, visible: boolean) => void
  columnOptions?: Array<{ id: string; label: string }>
  bulkActions?: Array<{
    id: string
    label: string
    icon?: string
    disabled?: boolean
    onClick: () => void
  }>
  rows: Row[]
  columns: OperatorTableColumn<Row>[]
  rowId: (row: Row) => string
  sort: SortConfig
  selectedIds?: string[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  emptyMessage: string
  isLoading?: boolean
  drawer?: ReactNode
  onRowClick?: (row: Row) => void
  onSortChange: (sort: SortConfig) => void
  onSelectedIdsChange?: (ids: string[]) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const toneClasses = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const

export function TabbedOperatorWorkspace<Row>({
  moduleLabel,
  eyebrow,
  title,
  description,
  metrics,
  actions = [],
  actionHandlers,
  tabs,
  activeTabId,
  onTabChange,
  savedViews,
  activeViewId,
  viewsLoading = false,
  viewsSaving = false,
  onApplySavedView,
  onSaveView,
  onDeleteView,
  onSetDefaultView,
  search,
  onSearchChange,
  searchPlaceholder = "Search records...",
  filters = [],
  visibleColumnIds = [],
  onToggleColumn,
  columnOptions = [],
  bulkActions = [],
  rows,
  columns,
  rowId,
  sort,
  selectedIds = [],
  page,
  pageSize,
  total,
  totalPages,
  emptyMessage,
  isLoading = false,
  drawer,
  onRowClick,
  onSortChange,
  onSelectedIdsChange,
  onPageChange,
  onPageSizeChange,
}: TabbedOperatorWorkspaceProps<Row>) {
  return (
    <WorkspaceContentContainer className="gap-5">
      <WorkspacePageToolbar>
        <WorkspaceBreadcrumbRow>
          <Breadcrumbs />
          <div className="flex items-center gap-2">
            <WorkspaceSavedViews
              moduleLabel={moduleLabel}
              views={savedViews}
              activeViewId={activeViewId}
              isLoading={viewsLoading}
              isSaving={viewsSaving}
              onApplyView={onApplySavedView}
              onSaveView={onSaveView}
              onDeleteView={onDeleteView}
              onSetDefaultView={onSetDefaultView}
            />
          </div>
        </WorkspaceBreadcrumbRow>
      </WorkspacePageToolbar>

      <DenseSectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            {actions.map(action => {
              const Icon = action.icon ? getShellIcon(action.icon) : null
              return (
                <Button
                  key={action.id}
                  asChild={Boolean(action.href)}
                  variant={action.tone === "accent" ? "default" : "outline"}
                  size="sm"
                  className="rounded-sm"
                  onClick={action.href ? undefined : actionHandlers?.[action.id]}
                >
                  {action.href ? (
                    <a href={action.href}>
                      {Icon ? <Icon className="mr-1.5 h-4 w-4" /> : null}
                      {action.label}
                    </a>
                  ) : (
                    <>
                      {Icon ? <Icon className="mr-1.5 h-4 w-4" /> : null}
                      {action.label}
                    </>
                  )}
                </Button>
              )
            })}
          </>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(metric => (
          <div key={metric.id} className="border border-border/80 bg-card/95 px-4 py-4 shadow-sm">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {metric.label}
              </div>
              <div className="text-2xl font-semibold tracking-tight text-foreground">{metric.value}</div>
              {metric.detail ? <div className="text-sm text-muted-foreground">{metric.detail}</div> : null}
              {metric.tone ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "mt-2 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                    toneClasses[metric.tone]
                  )}
                >
                  {metric.tone}
                </Badge>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-0 border border-border/80 bg-card/95 shadow-sm">
        <div className="sticky top-[6.35rem] z-20 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => {
                const isActive = tab.id === activeTabId

                return (
                  <Button
                    key={tab.id}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className="h-9 rounded-sm"
                    onClick={() => onTabChange(tab.id)}
                  >
                    <span>{tab.label}</span>
                    {typeof tab.count === "number" ? (
                      <span className={cn("ml-2 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold", isActive ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        {tab.count}
                      </span>
                    ) : null}
                  </Button>
                )
              })}
            </div>
            {columnOptions.length && onToggleColumn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-sm">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {columnOptions.map(option => (
                    <DropdownMenuCheckboxItem
                      key={option.id}
                      checked={visibleColumnIds.includes(option.id)}
                      onCheckedChange={value => onToggleColumn(option.id, Boolean(value))}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={event => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 rounded-sm pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {filters.map(filter => (
                <Select key={filter.id} value={filter.value} onValueChange={filter.onChange}>
                  <SelectTrigger className="h-9 min-w-[160px] rounded-sm">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          </div>
          {selectedIds.length && bulkActions.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-2">
              <div className="text-sm font-medium text-foreground">{selectedIds.length} selected</div>
              {bulkActions.map(action => {
                const Icon = action.icon ? getShellIcon(action.icon) : null
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    className="rounded-sm"
                    disabled={action.disabled}
                    onClick={action.onClick}
                  >
                    {Icon ? <Icon className="mr-1.5 h-4 w-4" /> : null}
                    {action.label}
                  </Button>
                )
              })}
            </div>
          ) : null}
        </div>

        <OperatorDataTable
          rows={rows}
          columns={columns}
          rowId={rowId}
          sort={sort}
          selectedIds={selectedIds}
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          emptyMessage={emptyMessage}
          isLoading={isLoading}
          onSortChange={onSortChange}
          onRowClick={onRowClick}
          onSelectedIdsChange={onSelectedIdsChange}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </section>

      {drawer}
    </WorkspaceContentContainer>
  )
}
