"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { getSavedViews, createSavedView, deleteSavedView, setDefaultView } from "@/lib/services"
import type { SavedView } from "@/lib/types"
import { 
  BookmarkPlus, 
  ChevronDown, 
  Star, 
  Trash2,
  Loader2,
} from "lucide-react"

interface SavedViewsProps {
  module: string
  currentFilters: Record<string, unknown>
  onApplyView: (filters: Record<string, unknown>) => void
}

export function SavedViews({ module, currentFilters, onApplyView }: SavedViewsProps) {
  const { toast } = useToast()
  const [views, setViews] = useState<SavedView[]>([])
  const [loading, setLoading] = useState(true)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newViewName, setNewViewName] = useState("")
  const [makeDefault, setMakeDefault] = useState(false)

  useEffect(() => {
    const loadViews = async () => {
      setLoading(true)
      const data = await getSavedViews(module)
      setViews(data)
      setLoading(false)
    }
    loadViews()
  }, [module])

  const handleSaveView = async () => {
    if (!newViewName.trim()) return
    
    setSaving(true)
    const result = await createSavedView({
      name: newViewName,
      module,
      filters: currentFilters,
      isDefault: makeDefault,
    })

    if (result.success && result.view) {
      setViews([...views, result.view])
      if (makeDefault) {
        await setDefaultView(result.view.id, module)
        // Update local state to reflect new default
        setViews(prev => prev.map(v => ({
          ...v,
          isDefault: v.id === result.view!.id,
        })))
      }
      toast({ title: "View saved", description: `"${newViewName}" has been saved.` })
      setSaveDialogOpen(false)
      setNewViewName("")
      setMakeDefault(false)
    } else {
      toast({ title: "Error", description: "Failed to save view.", variant: "destructive" })
    }
    setSaving(false)
  }

  const handleDeleteView = async (id: string, name: string) => {
    const result = await deleteSavedView(id)
    if (result.success) {
      setViews(views.filter(v => v.id !== id))
      toast({ title: "View deleted", description: `"${name}" has been removed.` })
    }
  }

  const handleSetDefault = async (id: string) => {
    await setDefaultView(id, module)
    setViews(views.map(v => ({
      ...v,
      isDefault: v.id === id,
    })))
    toast({ title: "Default view set" })
  }

  const defaultView = views.find(v => v.isDefault)

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  {defaultView ? defaultView.name : "Saved Views"}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {views.length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                No saved views yet
              </div>
            ) : (
              views.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => onApplyView(view.filters)}
                >
                  <span className="flex items-center gap-2">
                    {view.isDefault && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                    {view.name}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {!view.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSetDefault(view.id)
                        }}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteView(view.id, view.name)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Save Current View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Save View Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save View</DialogTitle>
            <DialogDescription>
              Save the current filter settings as a reusable view.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="viewName">View Name</Label>
              <Input
                id="viewName"
                placeholder="e.g., Overdue Invoices"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="makeDefault"
                checked={makeDefault}
                onCheckedChange={(checked) => setMakeDefault(checked as boolean)}
              />
              <Label htmlFor="makeDefault" className="font-normal cursor-pointer">
                Set as default view for this module
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveView} disabled={!newViewName.trim() || saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
