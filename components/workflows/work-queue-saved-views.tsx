"use client"

import { useState } from "react"
import { BookmarkPlus, ChevronDown, Loader2, Star, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SavedView } from "@/lib/types"

interface WorkQueueSavedViewsProps {
  views: SavedView[]
  activeViewId: string | null
  isLoading?: boolean
  isSaving?: boolean
  onApplyView: (view: SavedView) => void
  onSaveView: (payload: { name: string; isDefault: boolean }) => void
  onDeleteView: (view: SavedView) => void
  onSetDefaultView: (view: SavedView) => void
}

export function WorkQueueSavedViews({
  views,
  activeViewId,
  isLoading = false,
  isSaving = false,
  onApplyView,
  onSaveView,
  onDeleteView,
  onSetDefaultView,
}: WorkQueueSavedViewsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [isDefault, setIsDefault] = useState(false)

  const activeView = views.find(view => view.id === activeViewId)
  const defaultView = views.find(view => view.isDefault)
  const triggerLabel = activeView?.name ?? defaultView?.name ?? "Saved Views"

  function handleSave() {
    if (!name.trim()) {
      return
    }

    onSaveView({ name: name.trim(), isDefault })
    setDialogOpen(false)
    setName("")
    setIsDefault(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-sm" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4 mr-2" />}
            {triggerLabel}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {views.length ? (
            views.map(view => (
              <DropdownMenuItem
                key={view.id}
                className="flex items-center justify-between gap-3"
                onClick={() => onApplyView(view)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {view.isDefault ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : null}
                  <span className="truncate">{view.name}</span>
                </span>
                <span
                  className="flex items-center gap-1"
                  onClick={event => {
                    event.stopPropagation()
                  }}
                >
                  {!view.isDefault ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onSetDefaultView(view)}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDeleteView(view)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </span>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-2 py-3 text-sm text-muted-foreground">No saved views yet.</div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDialogOpen(true)}>
            <BookmarkPlus className="h-4 w-4 mr-2" />
            Save Current View
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Work Queue View</DialogTitle>
            <DialogDescription>
              Save the current queue filters, sort, and visible columns for reuse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="queue-view-name">View Name</Label>
              <Input
                id="queue-view-name"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Month-End Triage"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="queue-view-default"
                checked={isDefault}
                onCheckedChange={value => setIsDefault(Boolean(value))}
              />
              <Label htmlFor="queue-view-default" className="font-normal">
                Set as default view for the work queue
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
