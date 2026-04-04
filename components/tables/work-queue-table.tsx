"use client"

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  SortConfig,
  WorkQueueColumnDefinition,
  WorkQueueColumnId,
  WorkQueueItem,
} from "@/lib/types"
import { cn } from "@/lib/utils"

const toneClasses = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const

function formatCurrency(value?: number, currency: string = "USD") {
  if (value === undefined) {
    return "None"
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
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
    hour: "numeric",
    minute: "2-digit",
  }).format(value)
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ")
}

function SortIndicator({
  columnId,
  sort,
}: {
  columnId: string
  sort: SortConfig
}) {
  if (sort.key !== columnId) {
    return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
  }

  return sort.direction === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-foreground" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-foreground" />
  )
}

function getSortKey(columnId: WorkQueueColumnId) {
  const sortKeyMap: Record<WorkQueueColumnId, string> = {
    item: "title",
    reference: "reference",
    source: "sourceLabel",
    entity: "entityName",
    department: "departmentName",
    project: "projectName",
    assignee: "assigneeName",
    status: "status",
    priority: "priority",
    amount: "amount",
    dueDate: "dueDate",
    age: "ageInDays",
    updatedAt: "updatedAt",
  }

  return sortKeyMap[columnId]
}

function ItemCell({ item }: { item: WorkQueueItem }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="font-medium text-foreground">{item.title}</div>
        {item.badges.slice(0, 2).map(badge => (
          <Badge
            key={badge.id}
            variant="outline"
            className={cn(
              "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
              toneClasses[badge.tone ?? "neutral"]
            )}
          >
            {badge.label}
          </Badge>
        ))}
      </div>
      {item.description ? <div className="text-sm text-muted-foreground">{item.description}</div> : null}
      {item.meta.length ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {item.meta.map(meta => (
            <span key={meta}>{meta}</span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function renderCell(item: WorkQueueItem, column: WorkQueueColumnDefinition) {
  switch (column.id) {
    case "item":
      return <ItemCell item={item} />
    case "reference":
      return <div className="font-medium text-foreground">{item.reference ?? "None"}</div>
    case "source":
      return <div className="text-sm text-foreground">{item.sourceLabel}</div>
    case "entity":
      return <div className="text-sm text-foreground">{item.entityName ?? item.entityId}</div>
    case "department":
      return <div className="text-sm text-foreground">{item.departmentName ?? "Unassigned"}</div>
    case "project":
      return <div className="text-sm text-foreground">{item.projectName ?? "None"}</div>
    case "assignee":
      return <div className="text-sm text-foreground">{item.assigneeName ?? "Unassigned"}</div>
    case "status":
      return (
        <Badge
          variant="outline"
          className={cn(
            "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
            toneClasses[item.badges[0]?.tone ?? "neutral"]
          )}
        >
          {formatLabel(item.status)}
        </Badge>
      )
    case "priority":
      return (
        <Badge
          variant="outline"
          className={cn(
            "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
            toneClasses[item.priority === "critical" ? "critical" : item.priority === "high" ? "warning" : "neutral"]
          )}
        >
          {item.priority}
        </Badge>
      )
    case "amount":
      return <div className="font-medium text-foreground">{formatCurrency(item.amount, item.currency ?? "USD")}</div>
    case "dueDate":
      return <div className="text-sm text-foreground">{formatDate(item.dueDate)}</div>
    case "age":
      return <div className="text-sm text-foreground">{item.ageInDays}d</div>
    case "updatedAt":
      return <div className="text-sm text-foreground">{formatDate(item.updatedAt)}</div>
    default:
      return null
  }
}

interface WorkQueueTableProps {
  columns: WorkQueueColumnDefinition[]
  visibleColumnIds: WorkQueueColumnId[]
  data: WorkQueueItem[]
  selectedIds: string[]
  sort: SortConfig
  page: number
  pageSize: number
  total: number
  totalPages: number
  isLoading?: boolean
  emptyMessage?: string
  onSelectedIdsChange: (ids: string[]) => void
  onSortChange: (sort: SortConfig) => void
  onRowClick: (item: WorkQueueItem) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function WorkQueueTable({
  columns,
  visibleColumnIds,
  data,
  selectedIds,
  sort,
  page,
  pageSize,
  total,
  totalPages,
  isLoading = false,
  emptyMessage = "No queue items match the current filters.",
  onSelectedIdsChange,
  onSortChange,
  onRowClick,
  onPageChange,
  onPageSizeChange,
}: WorkQueueTableProps) {
  const visibleColumns = columns.filter(column => visibleColumnIds.includes(column.id))
  const pageRowIds = data.map(item => item.id)
  const allSelected = pageRowIds.length > 0 && pageRowIds.every(id => selectedIds.includes(id))

  function toggleRowSelection(rowId: string, checked: boolean) {
    if (checked) {
      onSelectedIdsChange([...new Set([...selectedIds, rowId])])
      return
    }

    onSelectedIdsChange(selectedIds.filter(id => id !== rowId))
  }

  function toggleAllRows(checked: boolean) {
    if (checked) {
      onSelectedIdsChange([...new Set([...selectedIds, ...pageRowIds])])
      return
    }

    onSelectedIdsChange(selectedIds.filter(id => !pageRowIds.includes(id)))
  }

  const rowRangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rowRangeEnd = Math.min(total, page * pageSize)

  return (
    <section className="overflow-hidden border border-border/80 bg-card/90 shadow-sm">
      <div className="max-h-[calc(100vh-22rem)] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/80 bg-muted/40 hover:bg-muted/40">
              <TableHead className="sticky top-0 z-10 w-10 bg-background/95 px-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={value => toggleAllRows(Boolean(value))}
                  aria-label="Select all rows"
                />
              </TableHead>
              {visibleColumns.map(column => {
                const sortKey = getSortKey(column.id)
                return (
                <TableHead
                  key={column.id}
                  className={cn(
                    "sticky top-0 z-10 bg-background/95 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
                    column.align === "right" && "text-right",
                    column.className
                  )}
                >
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "-ml-2 h-7 rounded-sm px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:bg-transparent hover:text-foreground",
                        column.align === "right" && "ml-auto flex"
                      )}
                      onClick={() =>
                        onSortChange({
                          key: sortKey,
                          direction: sort.key === sortKey && sort.direction === "asc" ? "desc" : "asc",
                        })
                      }
                    >
                      {column.label}
                      <SortIndicator columnId={sortKey} sort={sort} />
                    </Button>
                  ) : (
                    column.label
                  )}
                </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell className="px-3 py-3">
                      <div className="h-4 w-4 animate-pulse rounded-sm bg-muted" />
                    </TableCell>
                    {visibleColumns.map(column => (
                      <TableCell key={`loading-${column.id}-${index}`} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded-sm bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
            {!isLoading && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading
              ? data.map(item => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/30"
                    onClick={() => onRowClick(item)}
                  >
                    <TableCell
                      className="px-3 py-3"
                      onClick={event => {
                        event.stopPropagation()
                      }}
                    >
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={value => toggleRowSelection(item.id, Boolean(value))}
                        aria-label={`Select ${item.title}`}
                      />
                    </TableCell>
                    {visibleColumns.map(column => (
                      <TableCell
                        key={`${item.id}-${column.id}`}
                        className={cn(
                          "px-4 py-3 align-top text-sm",
                          column.align === "right" && "text-right"
                        )}
                      >
                        {renderCell(item, column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/80 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground">
          Showing {rowRangeStart}-{rowRangeEnd} of {total}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={pageSize}
            onChange={event => onPageSizeChange(Number(event.target.value))}
            className="h-8 rounded-sm border border-border bg-background px-2 text-sm"
          >
            {[10, 15, 25, 50].map(size => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            className="rounded-sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <div className="min-w-[84px] text-center text-muted-foreground">
            Page {page} of {Math.max(totalPages, 1)}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  )
}
