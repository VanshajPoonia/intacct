"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Settings2, 
  GripVertical,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface ColumnConfig {
  id: string
  label: string
  visible: boolean
  locked?: boolean // locked columns cannot be hidden
  width?: number
}

interface TablePreferencesProps {
  columns: ColumnConfig[]
  onColumnsChange: (columns: ColumnConfig[]) => void
  tableId: string // Used for localStorage persistence
}

const STORAGE_PREFIX = 'table_prefs_'

export function TablePreferences({ columns, onColumnsChange, tableId }: TablePreferencesProps) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [open, setOpen] = useState(false)

  // Load saved preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${tableId}`)
    if (saved) {
      try {
        const savedColumns = JSON.parse(saved) as ColumnConfig[]
        // Merge saved with current (in case columns changed)
        const merged = columns.map(col => {
          const savedCol = savedColumns.find(s => s.id === col.id)
          return savedCol ? { ...col, visible: savedCol.visible } : col
        })
        setLocalColumns(merged)
        onColumnsChange(merged)
      } catch {
        // Invalid saved data, use defaults
      }
    }
  }, [tableId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleColumn = (columnId: string) => {
    const updated = localColumns.map(col => 
      col.id === columnId && !col.locked 
        ? { ...col, visible: !col.visible }
        : col
    )
    setLocalColumns(updated)
    onColumnsChange(updated)
    localStorage.setItem(`${STORAGE_PREFIX}${tableId}`, JSON.stringify(updated))
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return

    const newColumns = [...localColumns]
    const [draggedItem] = newColumns.splice(draggedIndex, 1)
    newColumns.splice(targetIndex, 0, draggedItem)
    
    setLocalColumns(newColumns)
    setDraggedIndex(targetIndex)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    onColumnsChange(localColumns)
    localStorage.setItem(`${STORAGE_PREFIX}${tableId}`, JSON.stringify(localColumns))
  }

  const handleReset = () => {
    setLocalColumns(columns.map(col => ({ ...col, visible: true })))
    onColumnsChange(columns.map(col => ({ ...col, visible: true })))
    localStorage.removeItem(`${STORAGE_PREFIX}${tableId}`)
  }

  const visibleCount = localColumns.filter(c => c.visible).length
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
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Table Columns</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs"
              onClick={handleReset}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Drag to reorder, toggle to show/hide
          </p>
        </div>
        <ScrollArea className="h-64">
          <div className="p-2 space-y-1">
            {localColumns.map((column, index) => (
              <div
                key={column.id}
                draggable={!column.locked}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors",
                  draggedIndex === index && "bg-muted opacity-50",
                  column.locked && "opacity-60"
                )}
              >
                {!column.locked && (
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                )}
                {column.locked && <div className="w-4" />}
                <Checkbox
                  id={`col-${column.id}`}
                  checked={column.visible}
                  onCheckedChange={() => handleToggleColumn(column.id)}
                  disabled={column.locked}
                />
                <Label 
                  htmlFor={`col-${column.id}`} 
                  className={cn(
                    "flex-1 text-sm font-normal cursor-pointer",
                    !column.visible && "text-muted-foreground"
                  )}
                >
                  {column.label}
                  {column.locked && (
                    <span className="text-xs text-muted-foreground ml-1">(required)</span>
                  )}
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
