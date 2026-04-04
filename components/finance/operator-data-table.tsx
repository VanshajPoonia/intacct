"use client"

import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ReactNode } from "react"
import type { SortConfig, WorkspaceColumnDefinition } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface OperatorTableColumn<Row> extends WorkspaceColumnDefinition {
  render: (row: Row) => ReactNode
}

interface OperatorDataTableProps<Row> {
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
  onSortChange: (sort: SortConfig) => void
  onRowClick?: (row: Row) => void
  onSelectedIdsChange?: (ids: string[]) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

function SortIndicator({ sort, sortKey }: { sort: SortConfig; sortKey?: string }) {
  if (!sortKey || sort.key !== sortKey) {
    return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
  }

  return sort.direction === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-foreground" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-foreground" />
  )
}

export function OperatorDataTable<Row>({
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
  onSortChange,
  onRowClick,
  onSelectedIdsChange,
  onPageChange,
  onPageSizeChange,
}: OperatorDataTableProps<Row>) {
  const rowIds = rows.map(row => rowId(row))
  const allSelected = rowIds.length > 0 && rowIds.every(id => selectedIds.includes(id))

  function toggleAllRows(checked: boolean) {
    if (!onSelectedIdsChange) {
      return
    }

    if (checked) {
      onSelectedIdsChange([...new Set([...selectedIds, ...rowIds])])
      return
    }

    onSelectedIdsChange(selectedIds.filter(id => !rowIds.includes(id)))
  }

  function toggleRow(id: string, checked: boolean) {
    if (!onSelectedIdsChange) {
      return
    }

    if (checked) {
      onSelectedIdsChange([...new Set([...selectedIds, id])])
      return
    }

    onSelectedIdsChange(selectedIds.filter(selectedId => selectedId !== id))
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(total, page * pageSize)

  return (
    <section className="overflow-hidden border border-border/80 bg-card/95 shadow-sm">
      <div className="max-h-[calc(100vh-21rem)] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/80 bg-muted/35 hover:bg-muted/35">
              {onSelectedIdsChange ? (
                <TableHead className="sticky top-0 z-10 w-10 bg-background/95 px-3">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={value => toggleAllRows(Boolean(value))}
                    aria-label="Select all rows"
                  />
                </TableHead>
              ) : null}
              {columns.map(column => (
                <TableHead
                  key={column.id}
                  className={cn(
                    "sticky top-0 z-10 bg-background/95 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
                    column.widthClassName,
                    column.align === "right" && "text-right"
                  )}
                >
                  {column.sortKey ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "-ml-2 h-8 rounded-sm px-2 text-[11px] font-semibold uppercase tracking-[0.16em]",
                        column.align === "right" && "ml-auto flex"
                      )}
                      onClick={() =>
                        onSortChange({
                          key: column.sortKey ?? column.id,
                          direction:
                            sort.key === column.sortKey && sort.direction === "asc"
                              ? "desc"
                              : "asc",
                        })
                      }
                    >
                      <span>{column.label}</span>
                      <SortIndicator sort={sort} sortKey={column.sortKey} />
                    </Button>
                  ) : (
                    <span>{column.label}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.max(pageSize, 8) }).map((_, index) => (
                <TableRow key={`loading-${index}`} className="h-12">
                  {onSelectedIdsChange ? <TableCell className="px-3" /> : null}
                  {columns.map(column => (
                    <TableCell key={`${column.id}-${index}`} className="px-3">
                      <div className="h-4 w-full animate-pulse rounded bg-muted/70" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map(row => {
                const id = rowId(row)
                const selected = selectedIds.includes(id)

                return (
                  <TableRow
                    key={id}
                    className={cn(
                      "border-b border-border/70",
                      onRowClick && "cursor-pointer transition-colors hover:bg-muted/20",
                      selected && "bg-primary/5"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {onSelectedIdsChange ? (
                      <TableCell className="px-3" onClick={event => event.stopPropagation()}>
                        <Checkbox
                          checked={selected}
                          onCheckedChange={value => toggleRow(id, Boolean(value))}
                          aria-label={`Select row ${id}`}
                        />
                      </TableCell>
                    ) : null}
                    {columns.map(column => (
                      <TableCell
                        key={`${id}-${column.id}`}
                        className={cn(
                          "px-3 py-3 align-top",
                          column.align === "right" && "text-right"
                        )}
                      >
                        {column.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onSelectedIdsChange ? 1 : 0)}
                  className="px-3 py-12 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/80 bg-background/95 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {rangeStart}-{rangeEnd} of {total}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={String(pageSize)} onValueChange={value => onPageSizeChange(Number(value))}>
            <SelectTrigger className="h-8 w-[110px] rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 15, 25, 50].map(size => (
                <SelectItem key={size} value={String(size)}>
                  {size} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[88px] text-center text-sm text-muted-foreground">
              Page {page} of {Math.max(totalPages, 1)}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
