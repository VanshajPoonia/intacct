"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Users, 
  Plus, 
  Search, 
  Edit, 
  MoreHorizontal,
  Mail,
  Shield,
  Clock,
  UserX,
  UserCheck,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUsers, createUser, updateUser, deactivateUser, getEntities } from "@/lib/services"
import type { User, Entity } from "@/lib/types"
import { RoleDrawer } from "@/components/admin/role-drawer"

const roles = [
  { value: "admin", label: "Administrator", description: "Full access to all features" },
  { value: "controller", label: "Controller", description: "Financial oversight and approvals" },
  { value: "accountant", label: "Accountant", description: "Standard accounting functions" },
  { value: "ap_clerk", label: "AP Clerk", description: "Accounts payable management" },
  { value: "ar_clerk", label: "AR Clerk", description: "Accounts receivable management" },
  { value: "viewer", label: "Viewer", description: "Read-only access" },
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [totalUsers, setTotalUsers] = useState(0)
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "accountant" as User["role"],
    entityIds: [] as string[],
  })

  useEffect(() => {
    fetchData()
  }, [search, roleFilter, statusFilter])

  const fetchData = async () => {
    setLoading(true)
    const [usersRes, ents] = await Promise.all([
      getUsers(search || undefined, roleFilter.length > 0 ? roleFilter : undefined, statusFilter.length > 0 ? statusFilter : undefined),
      getEntities(),
    ])
    setUsers(usersRes.data)
    setTotalUsers(usersRes.total)
    setEntities(ents)
    setLoading(false)
  }

  const handleCreate = async () => {
    await createUser(formData)
    setCreateModalOpen(false)
    setFormData({ email: "", firstName: "", lastName: "", role: "accountant", entityIds: [] })
    fetchData()
  }

  const handleEdit = (user: User) => {
    setEditUser(user)
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      entityIds: user.entityIds,
    })
  }

  const handleSaveEdit = async () => {
    if (editUser) {
      await updateUser(editUser.id, formData)
    }
    setEditUser(null)
    setFormData({ email: "", firstName: "", lastName: "", role: "accountant", entityIds: [] })
    fetchData()
  }

  const handleDeactivate = async (userId: string) => {
    await deactivateUser(userId)
    fetchData()
  }

  const handleReactivate = async (userId: string) => {
    await updateUser(userId, { status: "active" })
    fetchData()
  }

  const handleRoleClick = (role: string) => {
    setSelectedRole(role)
    setRoleDrawerOpen(true)
  }

  const handleRoleSave = (roleData: { name: string; description: string; permissions: string[] }) => {
    console.log("Saving role:", roleData)
    // In a real app, this would save to the backend
  }

  const getRoleColor = (role: User["role"]) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "controller": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "accountant": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "ap_clerk": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "ar_clerk": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "viewer": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "inactive": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const activeUsers = users.filter(u => u.status === "active").length
  const pendingUsers = users.filter(u => u.status === "pending").length

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Users</h1>
            <p className="text-sm text-muted-foreground">
              Manage user accounts and permissions
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loading ? <Skeleton className="h-8 w-16" /> : activeUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{loading ? <Skeleton className="h-8 w-16" /> : pendingUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : users.filter(u => u.role === "admin").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Users</CardTitle>
              <div className="flex items-center gap-4">
                <Select 
                  value={roleFilter.length === 1 ? roleFilter[0] : "all"}
                  onValueChange={(v) => setRoleFilter(v === "all" ? [] : [v])}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={statusFilter.length === 1 ? statusFilter[0] : "all"}
                  onValueChange={(v) => setStatusFilter(v === "all" ? [] : [v])}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search users..." 
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Entities</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {user.firstName[0]}{user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
<TableCell>
                                        <Badge 
                                          variant="outline" 
                                          className={`${getRoleColor(user.role)} cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all`}
                                          onClick={() => handleRoleClick(user.role)}
                                        >
                                          {roles.find(r => r.value === user.role)?.label || user.role}
                                        </Badge>
                                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {user.entityIds.slice(0, 2).map((entityId) => {
                            const entity = entities.find(e => e.id === entityId)
                            return entity ? (
                              <Badge key={entityId} variant="outline" className="text-xs">
                                {entity.code}
                              </Badge>
                            ) : null
                          })}
                          {user.entityIds.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.entityIds.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : "Never"
                        }
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === "active" ? (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeactivate(user.id)}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleReactivate(user.id)}>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@company.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input 
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input 
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as User["role"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div>{role.label}</div>
                          <div className="text-xs text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entity Access</Label>
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
              <Button onClick={handleCreate}>Send Invitation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details and permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input 
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input 
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as User["role"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Role Drawer */}
        <RoleDrawer
          open={roleDrawerOpen}
          onOpenChange={setRoleDrawerOpen}
          role={selectedRole}
          users={users}
          entities={entities}
          onSave={handleRoleSave}
        />
      </div>
    </AppShell>
  )
}
