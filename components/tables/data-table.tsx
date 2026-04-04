"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export interface Column<T> {
  key: string
  header: string
  cell?: (item: T) => React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  className?: string
  compact?: boolean
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  emptyMessage = "No data available",
  onRowClick,
  className,
  compact = false,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("rounded-md border border-border bg-card", className)}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "text-xs font-semibold text-muted-foreground uppercase tracking-wide",
                    compact ? "h-9 px-3" : "h-10 px-4",
                    column.align === 'right' && "text-right",
                    column.align === 'center' && "text-center",
                    column.className
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(compact ? "py-2 px-3" : "py-3 px-4")}
                  >
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={cn("rounded-md border border-border bg-card", className)}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "text-xs font-semibold text-muted-foreground uppercase tracking-wide",
                    compact ? "h-9 px-3" : "h-10 px-4",
                    column.align === 'right' && "text-right",
                    column.align === 'center' && "text-center",
                    column.className
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("rounded-md border border-border bg-card overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  "text-xs font-semibold text-muted-foreground uppercase tracking-wide",
                  compact ? "h-9 px-3" : "h-10 px-4",
                  column.align === 'right' && "text-right",
                  column.align === 'center' && "text-center",
                  column.className
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={cn(
                "transition-colors",
                onRowClick && "cursor-pointer hover:bg-muted/50"
              )}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(
                    "text-sm",
                    compact ? "py-2 px-3" : "py-3 px-4",
                    column.align === 'right' && "text-right",
                    column.align === 'center' && "text-center",
                    column.className
                  )}
                >
                  {column.cell
                    ? column.cell(item)
                    : (item as Record<string, unknown>)[column.key]?.toString()}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
