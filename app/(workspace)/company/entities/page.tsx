// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Building2, 
  Plus, 
  Search, 
  Edit, 
  MoreHorizontal,
  Globe,
  DollarSign,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getEntities } from "@/lib/services"
import type { Entity } from "@/lib/types"
import { EntityDetailDrawer } from "@/components/company/entity-detail-drawer"

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editEntity, setEditEntity] = useState<Entity | null>(null)
  const [drawerEntity, setDrawerEntity] = useState<Entity | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "subsidiary" as Entity["type"],
    currency: "USD",
    country: "United States",
  })

  useEffect(() => {
    fetchEntities()
  }, [])

  const fetchEntities = async () => {
    setLoading(true)
    const data = await getEntities()
    setEntities(data)
    setLoading(false)
  }

  const filteredEntities = entities.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = () => {
    // Simulate creating entity
    console.log("Creating entity:", formData)
    setCreateModalOpen(false)
    setFormData({ name: "", code: "", type: "subsidiary", currency: "USD", country: "United States" })
    fetchEntities()
  }

  const handleEdit = (entity: Entity) => {
    setEditEntity(entity)
    setFormData({
      name: entity.name,
      code: entity.code,
      type: entity.type,
      currency: entity.currency,
      country: entity.country || "United States",
    })
  }

  const handleViewDetail = (entity: Entity) => {
    setDrawerEntity(entity)
    setDrawerOpen(true)
  }

  const handleDrawerSave = (updatedEntity: Entity) => {
    console.log("Saving entity:", updatedEntity)
    fetchEntities()
  }

  const handleSaveEdit = () => {
    // Simulate saving edit
    console.log("Saving entity:", editEntity?.id, formData)
    setEditEntity(null)
    setFormData({ name: "", code: "", type: "subsidiary", currency: "USD", country: "United States" })
    fetchEntities()
  }

  const getTypeColor = (type: Entity["type"]) => {
    switch (type) {
      case "parent": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "subsidiary": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "branch": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "department": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Entities</h1>
            <p className="text-sm text-muted-foreground">
              Manage your organizational structure and legal entities
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entity
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Entities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : entities.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Parent Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : entities.filter(e => e.type === "parent").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Subsidiaries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : entities.filter(e => e.type === "subsidiary").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Currencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : new Set(entities.map(e => e.currency)).size}</div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Entities</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search entities..." 
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
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntities.map((entity) => (
                    <TableRow 
                      key={entity.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewDetail(entity)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{entity.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{entity.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeColor(entity.type)}>
                          {entity.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {entity.currency}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          {entity.country || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {entity.parentId ? entities.find(e => e.id === entity.parentId)?.name || "—" : "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(entity)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Entity</DialogTitle>
              <DialogDescription>
                Create a new legal entity in your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Entity Name</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter entity name"
                />
              </div>
              <div className="space-y-2">
                <Label>Entity Code</Label>
                <Input 
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., US-HQ"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as Entity["type"] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="subsidiary">Subsidiary</SelectItem>
                      <SelectItem value="branch">Branch</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input 
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Enter country"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Entity</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={!!editEntity} onOpenChange={() => setEditEntity(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Entity</DialogTitle>
              <DialogDescription>
                Update entity details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Entity Name</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Entity Code</Label>
                <Input 
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as Entity["type"] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="subsidiary">Subsidiary</SelectItem>
                      <SelectItem value="branch">Branch</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input 
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditEntity(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Entity Detail Drawer */}
        <EntityDetailDrawer
          entity={drawerEntity}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onSave={handleDrawerSave}
          entities={entities}
        />
      </div>
    </AppShell>
  )
}
