"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Shield, 
  Users,
  Settings2,
  Key,
  Eye,
  Edit,
  FileText,
  DollarSign,
  Building2,
  Check,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react"
import type { User, Entity } from "@/lib/types"

interface RoleDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: string | null
  users: User[]
  entities: Entity[]
  onSave: (roleData: RoleData) => void
}

interface RoleData {
  name: string
  description: string
  permissions: string[]
}

// Permission categories
const permissionCategories = [
  {
    id: 'general_ledger',
    label: 'General Ledger',
    icon: FileText,
    permissions: [
      { id: 'gl.view', label: 'View Journal Entries', description: 'View journal entries and reports' },
      { id: 'gl.create', label: 'Create Journal Entries', description: 'Create new journal entries' },
      { id: 'gl.post', label: 'Post Journal Entries', description: 'Post journal entries to ledger' },
      { id: 'gl.reverse', label: 'Reverse Journal Entries', description: 'Reverse posted journal entries' },
      { id: 'gl.close_period', label: 'Close Accounting Periods', description: 'Close and lock accounting periods' },
    ]
  },
  {
    id: 'accounts_payable',
    label: 'Accounts Payable',
    icon: DollarSign,
    permissions: [
      { id: 'ap.view', label: 'View Bills', description: 'View bills and AP reports' },
      { id: 'ap.create', label: 'Create Bills', description: 'Create new bills' },
      { id: 'ap.approve', label: 'Approve Bills', description: 'Approve bills for payment' },
      { id: 'ap.pay', label: 'Process Payments', description: 'Create and process payments' },
      { id: 'ap.void', label: 'Void Payments', description: 'Void payments and bills' },
    ]
  },
  {
    id: 'accounts_receivable',
    label: 'Accounts Receivable',
    icon: DollarSign,
    permissions: [
      { id: 'ar.view', label: 'View Invoices', description: 'View invoices and AR reports' },
      { id: 'ar.create', label: 'Create Invoices', description: 'Create new invoices' },
      { id: 'ar.apply_payments', label: 'Apply Payments', description: 'Apply customer payments to invoices' },
      { id: 'ar.write_off', label: 'Write Off', description: 'Write off bad debt' },
      { id: 'ar.credit_memo', label: 'Issue Credit Memos', description: 'Issue credit memos to customers' },
    ]
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: Settings2,
    permissions: [
      { id: 'admin.users', label: 'Manage Users', description: 'Create, edit, and deactivate users' },
      { id: 'admin.roles', label: 'Manage Roles', description: 'Create and modify roles' },
      { id: 'admin.entities', label: 'Manage Entities', description: 'Add and configure entities' },
      { id: 'admin.integrations', label: 'Manage Integrations', description: 'Configure third-party integrations' },
      { id: 'admin.audit', label: 'View Audit Logs', description: 'Access audit trail and logs' },
    ]
  },
]

// Default role permissions
const defaultRolePermissions: Record<string, string[]> = {
  admin: permissionCategories.flatMap(c => c.permissions.map(p => p.id)),
  controller: [
    'gl.view', 'gl.create', 'gl.post', 'gl.reverse', 'gl.close_period',
    'ap.view', 'ap.create', 'ap.approve', 'ap.pay', 'ap.void',
    'ar.view', 'ar.create', 'ar.apply_payments', 'ar.write_off', 'ar.credit_memo',
    'admin.audit',
  ],
  accountant: [
    'gl.view', 'gl.create', 'gl.post',
    'ap.view', 'ap.create',
    'ar.view', 'ar.create', 'ar.apply_payments',
  ],
  ap_clerk: [
    'ap.view', 'ap.create',
  ],
  ar_clerk: [
    'ar.view', 'ar.create', 'ar.apply_payments',
  ],
  viewer: [
    'gl.view', 'ap.view', 'ar.view',
  ],
}

const roleDescriptions: Record<string, string> = {
  admin: 'Full access to all features and settings',
  controller: 'Financial oversight and approvals across all modules',
  accountant: 'Standard accounting functions for day-to-day operations',
  ap_clerk: 'Accounts payable data entry and management',
  ar_clerk: 'Accounts receivable data entry and management',
  viewer: 'Read-only access to financial data',
}

export function RoleDrawer({ 
  open, 
  onOpenChange, 
  role,
  users,
  entities,
  onSave,
}: RoleDrawerProps) {
  const [activeTab, setActiveTab] = useState("permissions")
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (role) {
      const perms = defaultRolePermissions[role] || []
      setSelectedPermissions(new Set(perms))
      setIsEditing(false)
    }
  }, [role])

  if (!role) return null

  const roleUsers = users.filter(u => u.role === role)
  const roleLabel = role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())

  const togglePermission = (permId: string) => {
    if (!isEditing) return
    const next = new Set(selectedPermissions)
    if (next.has(permId)) {
      next.delete(permId)
    } else {
      next.add(permId)
    }
    setSelectedPermissions(next)
  }

  const toggleAllInCategory = (categoryId: string) => {
    if (!isEditing) return
    const category = permissionCategories.find(c => c.id === categoryId)
    if (!category) return
    
    const categoryPermIds = category.permissions.map(p => p.id)
    const allSelected = categoryPermIds.every(id => selectedPermissions.has(id))
    
    const next = new Set(selectedPermissions)
    if (allSelected) {
      categoryPermIds.forEach(id => next.delete(id))
    } else {
      categoryPermIds.forEach(id => next.add(id))
    }
    setSelectedPermissions(next)
  }

  const handleSave = () => {
    onSave({
      name: role,
      description: roleDescriptions[role] || '',
      permissions: Array.from(selectedPermissions),
    })
    setIsEditing(false)
  }

  const getRoleBadgeColor = (r: string) => {
    switch (r) {
      case "admin": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "controller": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "accountant": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "ap_clerk": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "ar_clerk": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "viewer": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">{roleLabel}</SheetTitle>
                <SheetDescription>{roleDescriptions[role] || 'Custom role'}</SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedPermissions(new Set(defaultRolePermissions[role] || []))
                    setIsEditing(false)
                  }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="outline" className={getRoleBadgeColor(role)}>
              {roleLabel}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {roleUsers.length} user{roleUsers.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Key className="h-4 w-4" />
              {selectedPermissions.size} permission{selectedPermissions.size !== 1 ? 's' : ''}
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="users">Users ({roleUsers.length})</TabsTrigger>
          </TabsList>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-4 pr-4">
                {role === 'admin' && (
                  <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">Admin Role</p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            This role has full access to all features. Permissions cannot be restricted.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {permissionCategories.map((category) => {
                  const Icon = category.icon
                  const categoryPermIds = category.permissions.map(p => p.id)
                  const selectedCount = categoryPermIds.filter(id => selectedPermissions.has(id)).length
                  const allSelected = selectedCount === categoryPermIds.length
                  const someSelected = selectedCount > 0 && !allSelected

                  return (
                    <Card key={category.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {category.label}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {selectedCount}/{categoryPermIds.length}
                            </span>
                            {isEditing && role !== 'admin' && (
                              <Checkbox
                                checked={allSelected}
                                className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                                onCheckedChange={() => toggleAllInCategory(category.id)}
                              />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {category.permissions.map((perm) => {
                          const isSelected = selectedPermissions.has(perm.id)
                          return (
                            <div 
                              key={perm.id} 
                              className={`flex items-start justify-between p-3 rounded-lg border transition-colors ${
                                isSelected 
                                  ? 'bg-primary/5 border-primary/20' 
                                  : 'bg-muted/30 border-transparent'
                              } ${isEditing && role !== 'admin' ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                              onClick={() => role !== 'admin' && togglePermission(perm.id)}
                            >
                              <div className="flex items-start gap-3">
                                {isSelected ? (
                                  <Unlock className="h-4 w-4 text-green-600 mt-0.5" />
                                ) : (
                                  <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
                                )}
                                <div>
                                  <p className="font-medium text-sm">{perm.label}</p>
                                  <p className="text-xs text-muted-foreground">{perm.description}</p>
                                </div>
                              </div>
                              {isEditing && role !== 'admin' ? (
                                <Checkbox checked={isSelected} />
                              ) : (
                                isSelected && <Check className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-3 pr-4">
                {roleUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No users with this role</p>
                  </div>
                ) : (
                  roleUsers.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                              {user.status}
                            </Badge>
                            <div className="flex -space-x-1">
                              {user.entityIds.slice(0, 3).map((entityId) => {
                                const entity = entities.find(e => e.id === entityId)
                                return entity ? (
                                  <div 
                                    key={entityId}
                                    className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background"
                                    title={entity.name}
                                  >
                                    {entity.code.substring(0, 2)}
                                  </div>
                                ) : null
                              })}
                              {user.entityIds.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                                  +{user.entityIds.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
