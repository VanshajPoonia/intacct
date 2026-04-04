"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Settings2, 
  Plus, 
  Search, 
  Edit, 
  MoreHorizontal,
  Trash2,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  FileText,
  Receipt,
  CreditCard,
  Users,
  FolderKanban,
  GripVertical,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CustomField {
  id: string
  name: string
  code: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'dropdown' | 'textarea'
  module: 'bill' | 'invoice' | 'customer' | 'vendor' | 'project' | 'journal_entry'
  required: boolean
  status: 'active' | 'inactive'
  options?: string[]
  createdAt: Date
}

const mockCustomFields: CustomField[] = [
  { id: 'cf1', name: 'Purchase Order Number', code: 'PO_NUM', type: 'text', module: 'bill', required: false, status: 'active', createdAt: new Date('2024-01-15') },
  { id: 'cf2', name: 'Contract Reference', code: 'CONTRACT_REF', type: 'text', module: 'invoice', required: false, status: 'active', createdAt: new Date('2024-02-01') },
  { id: 'cf3', name: 'Sales Region', code: 'SALES_REGION', type: 'dropdown', module: 'customer', required: true, status: 'active', options: ['North', 'South', 'East', 'West'], createdAt: new Date('2024-02-15') },
  { id: 'cf4', name: 'Tax Exempt', code: 'TAX_EXEMPT', type: 'boolean', module: 'vendor', required: false, status: 'active', createdAt: new Date('2024-03-01') },
  { id: 'cf5', name: 'Project Start Date', code: 'PROJ_START', type: 'date', module: 'project', required: true, status: 'active', createdAt: new Date('2024-03-05') },
  { id: 'cf6', name: 'Internal Notes', code: 'INTERNAL_NOTES', type: 'textarea', module: 'journal_entry', required: false, status: 'inactive', createdAt: new Date('2024-03-10') },
]

const fieldTypes = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'boolean', label: 'Yes/No', icon: ToggleLeft },
  { value: 'dropdown', label: 'Dropdown', icon: List },
  { value: 'textarea', label: 'Long Text', icon: FileText },
]

const modules = [
  { value: 'bill', label: 'Bills', icon: Receipt },
  { value: 'invoice', label: 'Invoices', icon: FileText },
  { value: 'customer', label: 'Customers', icon: Users },
  { value: 'vendor', label: 'Vendors', icon: Users },
  { value: 'project', label: 'Projects', icon: FolderKanban },
  { value: 'journal_entry', label: 'Journal Entries', icon: CreditCard },
]

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeModule, setActiveModule] = useState<string>("all")
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editField, setEditField] = useState<CustomField | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "text" as CustomField["type"],
    module: "bill" as CustomField["module"],
    required: false,
    options: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    setFields(mockCustomFields)
    setLoading(false)
  }

  const filteredFields = fields.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase())
    const matchesModule = activeModule === 'all' || f.module === activeModule
    return matchesSearch && matchesModule
  })

  const handleCreate = () => {
    const newField: CustomField = {
      id: `cf${fields.length + 1}`,
      name: formData.name,
      code: formData.code,
      type: formData.type,
      module: formData.module,
      required: formData.required,
      status: 'active',
      options: formData.type === 'dropdown' ? formData.options.split(',').map(o => o.trim()) : undefined,
      createdAt: new Date(),
    }
    setFields([...fields, newField])
    setCreateModalOpen(false)
    setFormData({ name: "", code: "", type: "text", module: "bill", required: false, options: "" })
  }

  const handleEdit = (field: CustomField) => {
    setEditField(field)
    setFormData({
      name: field.name,
      code: field.code,
      type: field.type,
      module: field.module,
      required: field.required,
      options: field.options?.join(', ') || "",
    })
  }

  const handleSaveEdit = () => {
    if (editField) {
      setFields(fields.map(f => 
        f.id === editField.id 
          ? { 
              ...f, 
              ...formData,
              options: formData.type === 'dropdown' ? formData.options.split(',').map(o => o.trim()) : undefined,
            }
          : f
      ))
    }
    setEditField(null)
    setFormData({ name: "", code: "", type: "text", module: "bill", required: false, options: "" })
  }

  const handleToggleStatus = (field: CustomField) => {
    setFields(fields.map(f => 
      f.id === field.id 
        ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' }
        : f
    ))
  }

  const handleDelete = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId))
  }

  const getTypeIcon = (type: CustomField["type"]) => {
    const found = fieldTypes.find(t => t.value === type)
    return found ? found.icon : Type
  }

  const getModuleIcon = (module: CustomField["module"]) => {
    const found = modules.find(m => m.value === module)
    return found ? found.icon : FileText
  }

  const activeFields = fields.filter(f => f.status === 'active').length

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Custom Fields</h1>
            <p className="text-sm text-muted-foreground">
              Define custom fields for transactions and master data
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Field
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Total Fields
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : fields.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ToggleLeft className="h-4 w-4" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loading ? <Skeleton className="h-8 w-16" /> : activeFields}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Transaction Fields
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : fields.filter(f => ['bill', 'invoice', 'journal_entry'].includes(f.module)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Master Data Fields
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : fields.filter(f => ['customer', 'vendor', 'project'].includes(f.module)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Tabs value={activeModule} onValueChange={setActiveModule}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  {modules.map((mod) => {
                    const Icon = mod.icon
                    const count = fields.filter(f => f.module === mod.value).length
                    return (
                      <TabsTrigger key={mod.value} value={mod.value} className="flex items-center gap-1">
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{mod.label}</span>
                        <span className="text-xs text-muted-foreground">({count})</span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </Tabs>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search fields..." 
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
            ) : filteredFields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No custom fields found</p>
                <Button variant="outline" className="mt-4" onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Field
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFields.map((field) => {
                    const TypeIcon = getTypeIcon(field.type)
                    const ModuleIcon = getModuleIcon(field.module)
                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{field.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{field.code}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {fieldTypes.find(t => t.value === field.type)?.label || field.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <ModuleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{modules.find(m => m.value === field.module)?.label || field.module}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {field.required ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                              Required
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Optional</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={field.status === 'active' ? 'default' : 'secondary'}>
                            {field.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(field)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(field)}>
                                {field.status === 'active' ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(field.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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
              <DialogTitle>Add Custom Field</DialogTitle>
              <DialogDescription>
                Create a new custom field for your data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field Name</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter field name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Field Code</Label>
                  <Input 
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                    placeholder="e.g., PO_NUMBER"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as CustomField["type"] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Module</Label>
                  <Select value={formData.module} onValueChange={(v) => setFormData({ ...formData, module: v as CustomField["module"] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((mod) => {
                        const Icon = mod.icon
                        return (
                          <SelectItem key={mod.value} value={mod.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {mod.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.type === 'dropdown' && (
                <div className="space-y-2">
                  <Label>Options (comma-separated)</Label>
                  <Input 
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Required Field</Label>
                  <p className="text-xs text-muted-foreground">Make this field mandatory</p>
                </div>
                <Switch 
                  checked={formData.required}
                  onCheckedChange={(v) => setFormData({ ...formData, required: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Field</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={!!editField} onOpenChange={() => setEditField(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Custom Field</DialogTitle>
              <DialogDescription>
                Update field settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field Name</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Field Code</Label>
                  <Input 
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as CustomField["type"] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Module</Label>
                  <Select value={formData.module} onValueChange={(v) => setFormData({ ...formData, module: v as CustomField["module"] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((mod) => (
                        <SelectItem key={mod.value} value={mod.value}>{mod.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.type === 'dropdown' && (
                <div className="space-y-2">
                  <Label>Options (comma-separated)</Label>
                  <Input 
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Required Field</Label>
                  <p className="text-xs text-muted-foreground">Make this field mandatory</p>
                </div>
                <Switch 
                  checked={formData.required}
                  onCheckedChange={(v) => setFormData({ ...formData, required: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditField(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
