"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Layers, 
  Plus, 
  Search, 
  Edit, 
  MoreHorizontal,
  Building2,
  MapPin,
  FolderKanban,
  Tag,
  Settings2,
  ChevronRight,
  Palette,
  Star,
  Zap,
  Target,
  Briefcase,
  Users,
  CircleDot,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getDimensions, createDimension, updateDimension, getEntities } from "@/lib/services"
import type { Dimension, Entity } from "@/lib/types"

const dimensionTypes = [
  { value: "department", label: "Departments", icon: Building2 },
  { value: "location", label: "Locations", icon: MapPin },
  { value: "project", label: "Projects", icon: FolderKanban },
  { value: "class", label: "Classes", icon: Tag },
  { value: "custom", label: "Custom", icon: Settings2 },
]

const colorOptions = [
  { value: "gray", label: "Gray", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-500" },
  { value: "red", label: "Red", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", dot: "bg-red-500" },
  { value: "orange", label: "Orange", bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", dot: "bg-orange-500" },
  { value: "amber", label: "Amber", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  { value: "green", label: "Green", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", dot: "bg-green-500" },
  { value: "blue", label: "Blue", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  { value: "purple", label: "Purple", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", dot: "bg-purple-500" },
  { value: "pink", label: "Pink", bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300", dot: "bg-pink-500" },
]

const iconOptions = [
  { value: "circle", label: "Circle", icon: CircleDot },
  { value: "star", label: "Star", icon: Star },
  { value: "zap", label: "Zap", icon: Zap },
  { value: "target", label: "Target", icon: Target },
  { value: "briefcase", label: "Briefcase", icon: Briefcase },
  { value: "users", label: "Users", icon: Users },
  { value: "tag", label: "Tag", icon: Tag },
  { value: "folder", label: "Folder", icon: FolderKanban },
]

// Enhanced dimension type with color and icon
interface EnhancedDimension extends Dimension {
  color?: string
  icon?: string
  children?: EnhancedDimension[]
}

export default function DimensionsPage() {
  const [dimensions, setDimensions] = useState<Dimension[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("department")
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editDimension, setEditDimension] = useState<Dimension | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "department" as Dimension["type"],
    entityIds: [] as string[],
    parentId: "",
    color: "blue",
    icon: "circle",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [dims, ents] = await Promise.all([
      getDimensions(),
      getEntities(),
    ])
    setDimensions(dims)
    setEntities(ents)
    setLoading(false)
  }

  const filteredDimensions = dimensions
    .filter(d => d.type === activeTab)
    .filter(d => 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
    )

  const handleCreate = async () => {
    await createDimension({
      ...formData,
      parentId: formData.parentId || undefined,
    })
    setCreateModalOpen(false)
    setFormData({ name: "", code: "", type: activeTab as Dimension["type"], entityIds: [], parentId: "", color: "blue", icon: "circle" })
    fetchData()
  }

  const handleEdit = (dimension: Dimension) => {
    setEditDimension(dimension)
    const enhanced = dimension as EnhancedDimension
    setFormData({
      name: dimension.name,
      code: dimension.code,
      type: dimension.type,
      entityIds: dimension.entityIds,
      parentId: dimension.parentId || "",
      color: enhanced.color || "blue",
      icon: enhanced.icon || "circle",
    })
  }

  const handleSaveEdit = async () => {
    if (editDimension) {
      await updateDimension(editDimension.id, {
        ...formData,
        parentId: formData.parentId || undefined,
      })
    }
    setEditDimension(null)
    setFormData({ name: "", code: "", type: activeTab as Dimension["type"], entityIds: [], parentId: "", color: "blue", icon: "circle" })
    fetchData()
  }

  const getColorConfig = (color?: string) => {
    return colorOptions.find(c => c.value === color) || colorOptions[5] // default blue
  }

  const getIconComponent = (iconValue?: string) => {
    const found = iconOptions.find(i => i.value === iconValue)
    return found ? found.icon : CircleDot
  }

  const getParentDimension = (parentId?: string) => {
    if (!parentId) return null
    return dimensions.find(d => d.id === parentId)
  }

  const handleToggleStatus = async (dimension: Dimension) => {
    await updateDimension(dimension.id, { 
      status: dimension.status === "active" ? "inactive" : "active" 
    })
    fetchData()
  }

  const getTabIcon = (type: string) => {
    const found = dimensionTypes.find(t => t.value === type)
    return found ? found.icon : Layers
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dimensions</h1>
            <p className="text-sm text-muted-foreground">
              Manage departments, locations, projects, and custom dimensions
            </p>
          </div>
          <Button onClick={() => {
            setFormData({ ...formData, type: activeTab as Dimension["type"] })
            setCreateModalOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Dimension
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4">
          {dimensionTypes.map((type) => {
            const Icon = type.icon
            const count = dimensions.filter(d => d.type === type.value).length
            const activeCount = dimensions.filter(d => d.type === type.value && d.status === "active").length
            return (
              <Card 
                key={type.value}
                className={`cursor-pointer transition-colors ${activeTab === type.value ? "border-primary" : "hover:border-muted-foreground/50"}`}
                onClick={() => setActiveTab(type.value)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : count}</div>
                  <p className="text-xs text-muted-foreground">{activeCount} active</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tabs and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  {dimensionTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <TabsTrigger key={type.value} value={type.value} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </Tabs>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search dimensions..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredDimensions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No {activeTab}s found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setFormData({ ...formData, type: activeTab as Dimension["type"] })
                    setCreateModalOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {activeTab}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Entities</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDimensions.map((dimension) => {
                    const enhanced = dimension as EnhancedDimension
                    const colorConfig = getColorConfig(enhanced.color)
                    const IconComponent = getIconComponent(enhanced.icon)
                    const parent = getParentDimension(dimension.parentId)
                    return (
                      <TableRow key={dimension.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${colorConfig.bg}`}>
                              <IconComponent className={`h-3.5 w-3.5 ${colorConfig.text}`} />
                            </div>
                            <div>
                              <span className="font-medium">{dimension.name}</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <div className={`h-2 w-2 rounded-full ${colorConfig.dot}`} />
                                <span className="text-xs text-muted-foreground capitalize">{enhanced.color || 'blue'}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{dimension.code}</TableCell>
                        <TableCell>
                          {parent ? (
                            <div className="flex items-center gap-1">
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{parent.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={dimension.status === "active" ? "default" : "secondary"}>
                            {dimension.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {dimension.entityIds.slice(0, 2).map((entityId) => {
                              const entity = entities.find(e => e.id === entityId)
                              return entity ? (
                                <Badge key={entityId} variant="outline" className="text-xs">
                                  {entity.code}
                                </Badge>
                              ) : null
                            })}
                            {dimension.entityIds.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{dimension.entityIds.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(dimension)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(dimension)}>
                                {dimension.status === "active" ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</DialogTitle>
              <DialogDescription>
                Create a new dimension value
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={`Enter ${activeTab} name`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input 
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SALES"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Parent {activeTab}</Label>
                <Select 
                  value={formData.parentId || "none"}
                  onValueChange={(v) => setFormData({ ...formData, parentId: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent (top-level)</SelectItem>
                    {dimensions.filter(d => d.type === activeTab).map((dim) => (
                      <SelectItem key={dim.id} value={dim.id}>{dim.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Color
                </Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        formData.color === color.value 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-transparent hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${color.dot}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((iconOpt) => {
                    const IconComp = iconOpt.icon
                    return (
                      <button
                        key={iconOpt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconOpt.value })}
                        className={`p-2 rounded-lg border transition-all ${
                          formData.icon === iconOpt.value 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted hover:border-muted-foreground/30'
                        }`}
                      >
                        <IconComp className="h-4 w-4" />
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Applies to Entities</Label>
                <Select 
                  value={formData.entityIds.length > 0 ? formData.entityIds[0] : "all"}
                  onValueChange={(v) => setFormData({ ...formData, entityIds: v === "all" ? entities.map(e => e.id) : [v] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    {entities.filter(e => e.id !== "e4").map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={!!editDimension} onOpenChange={() => setEditDimension(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Dimension</DialogTitle>
              <DialogDescription>
                Update dimension details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input 
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDimension(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
