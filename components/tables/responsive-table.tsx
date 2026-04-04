"use client"

import { type ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/components/ui/use-mobile"

export interface Column<T> {
  id: string
  header: string
  accessor: keyof T | ((row: T) => ReactNode)
  className?: string
  mobileHidden?: boolean // Hide on mobile
  mobilePriority?: number // Higher = shown on mobile card, lower = hidden
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  keyExtractor: (row: T) => string
  emptyMessage?: string
  className?: string
  mobileCardRender?: (row: T) => ReactNode // Custom mobile card render
}

export function ResponsiveTable<T>({
  data,
  columns,
  onRowClick,
  keyExtractor,
  emptyMessage = "No data available",
  className,
  mobileCardRender,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile()

  const getCellValue = (row: T, column: Column<T>): ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row)
    }
    const value = row[column.accessor]
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    return String(value)
  }

  // Mobile card view
  if (isMobile) {
    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      )
    }

    // Custom mobile render
    if (mobileCardRender) {
      return (
        <div className={cn("space-y-3", className)}>
          {data.map((row) => (
            <div key={keyExtractor(row)} onClick={() => onRowClick?.(row)}>
              {mobileCardRender(row)}
            </div>
          ))}
        </div>
      )
    }

    // Default mobile card view
    const primaryColumns = columns
      .filter(c => !c.mobileHidden)
      .sort((a, b) => (b.mobilePriority || 0) - (a.mobilePriority || 0))
      .slice(0, 4)

    return (
      <div className={cn("space-y-3", className)}>
        {data.map((row) => (
          <Card 
            key={keyExtractor(row)}
            className={cn(
              "transition-colors",
              onRowClick && "cursor-pointer hover:bg-muted/50"
            )}
            onClick={() => onRowClick?.(row)}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                {primaryColumns.map((column, index) => (
                  <div 
                    key={column.id}
                    className={cn(
                      "flex items-center justify-between",
                      index === 0 && "font-medium"
                    )}
                  >
                    <span className="text-sm text-muted-foreground">
                      {column.header}
                    </span>
                    <span className="text-sm">
                      {getCellValue(row, column)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Desktop table view
  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.filter(c => !c.mobileHidden).map((column) => (
              <TableHead key={column.id} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={columns.length} 
                className="text-center py-8 text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow 
                key={keyExtractor(row)}
                className={cn(onRowClick && "cursor-pointer")}
                onClick={() => onRowClick?.(row)}
              >
                {columns.filter(c => !c.mobileHidden).map((column) => (
                  <TableCell key={column.id} className={column.className}>
                    {getCellValue(row, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// Mobile-aware drawer that becomes a sheet on mobile
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

interface ResponsiveDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  side?: "left" | "right"
  className?: string
}

export function ResponsiveDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = "right",
  className,
}: ResponsiveDrawerProps) {
  const isMobile = useIsMobile()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={isMobile ? "bottom" : side}
        className={cn(
          isMobile ? "h-[90vh] rounded-t-xl" : "w-[500px] sm:w-[600px] sm:max-w-xl",
          className
        )}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className={cn("mt-4 overflow-y-auto", isMobile ? "max-h-[calc(90vh-100px)]" : "max-h-[calc(100vh-100px)]")}>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
