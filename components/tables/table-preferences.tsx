"use client"

import { useEffect, useState } from "react"
import { GripVertical, RotateCcw, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export interface ColumnConfig {
  id: string
  label: string
  visible: boolean
  locked?: boolean
  width?: number
}

interface TablePreferencesProps {
  columns: ColumnConfig[]
  onColumnsChange: (columns: ColumnConfig[]) => void
  tableId?: string
}

export function TablePreferences({ columns, onColumnsChange }: TablePreferencesProps) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setLocalColumns(columns)
  }, [columns])

  const handleToggleColumn = (columnId: string) => {
    const updated = localColumns.map(column =>
      column.id === columnId && !column.locked
        ? { ...column, visible: !column.visible }
        : column
    )

    setLocalColumns(updated)
    onColumnsChange(updated)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (event: React.DragEvent, targetIndex: number) => {
    event.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) {
      return
    }

    const nextColumns = [...localColumns]
    const [draggedItem] = nextColumns.splice(draggedIndex, 1)
    nextColumns.splice(targetIndex, 0, draggedItem)

    setLocalColumns(nextColumns)
    setDraggedIndex(targetIndex)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    onColumnsChange(localColumns)
  }

  const handleReset = () => {
    setLocalColumns(columns)
    onColumnsChange(columns)
  }

  const visibleCount = localColumns.filter(column => column.visible).length
  const totalCount = localColumns.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Columns
          <span className="text-muted-foreground">
            ({visibleCount}/{totalCount})
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="border-b p-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Table Columns</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleReset}
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Drag to reorder, toggle to show or hide.
          </p>
        </div>
        <ScrollArea className="h-64">
          <div className="space-y-1 p-2">
            {localColumns.map((column, index) => (
              <div
                key={column.id}
                draggable={!column.locked}
                onDragStart={() => handleDragStart(index)}
                onDragOver={event => handleDragOver(event, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted/50",
                  draggedIndex === index && "bg-muted opacity-50",
                  column.locked && "opacity-60"
                )}
              >
                {!column.locked ? (
                  <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                ) : (
                  <div className="w-4" />
                )}
                <Checkbox
                  id={`col-${column.id}`}
                  checked={column.visible}
                  onCheckedChange={() => handleToggleColumn(column.id)}
                  disabled={column.locked}
                />
                <Label
                  htmlFor={`col-${column.id}`}
                  className={cn(
                    "flex-1 cursor-pointer text-sm font-normal",
                    !column.visible && "text-muted-foreground"
                  )}
                >
                  {column.label}
                  {column.locked ? (
                    <span className="ml-1 text-xs text-muted-foreground">(required)</span>
                  ) : null}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
