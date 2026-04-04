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
    await createDimension(formData)
    setCreateModalOpen(false)
    setFormData({ name: "", code: "", type: activeTab as Dimension["type"], entityIds: [] })
    fetchData()
  }

  const handleEdit = (dimension: Dimension) => {
    setEditDimension(dimension)
    setFormData({
      name: dimension.name,
      code: dimension.code,
      type: dimension.type,
      entityIds: dimension.entityIds,
    })
  }

  const handleSaveEdit = async () => {
    if (editDimension) {
      await updateDimension(editDimension.id, formData)
    }
    setEditDimension(null)
    setFormData({ name: "", code: "", type: activeTab as Dimension["type"], entityIds: [] })
    fetchData()
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
                    <TableHead>Status</TableHead>
                    <TableHead>Entities</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDimensions.map((dimension) => {
                    const Icon = getTabIcon(dimension.type)
                    return (
                      <TableRow key={dimension.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{dimension.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{dimension.code}</TableCell>
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
                        <TableCell className="text-muted-foreground">
                          {new Date(dimension.createdAt).toLocaleDateString()}
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
