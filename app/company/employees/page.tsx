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
  Building2,
  MapPin,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { employees as getEmployeesData, departments as getDepartmentsData, locations as getLocationsData } from "@/lib/services/index"
import type { Employee, Department, Location } from "@/lib/types"

// Extended employee type for display
interface ExtendedEmployee extends Employee {
  managerId?: string
  expensePolicyStatus?: 'compliant' | 'needs_review' | 'pending'
  hireDate?: Date
}

const mockExtendedEmployees: ExtendedEmployee[] = [
  { 
    id: 'emp1', 
    name: 'John Smith', 
    email: 'john.smith@acme.com', 
    departmentId: 'dept1', 
    locationId: 'loc1', 
    role: 'Sales Manager', 
    status: 'active',
    managerId: 'emp4',
    expensePolicyStatus: 'compliant',
    hireDate: new Date('2022-03-15')
  },
  { 
    id: 'emp2', 
    name: 'Emily Davis', 
    email: 'emily.davis@acme.com', 
    departmentId: 'dept3', 
    locationId: 'loc1', 
    role: 'Senior Engineer', 
    status: 'active',
    managerId: 'emp4',
    expensePolicyStatus: 'compliant',
    hireDate: new Date('2021-06-01')
  },
  { 
    id: 'emp3', 
    name: 'Michael Johnson', 
    email: 'michael.j@acme.com', 
    departmentId: 'dept4', 
    locationId: 'loc1', 
    role: 'Financial Analyst', 
    status: 'active',
    managerId: 'emp4',
    expensePolicyStatus: 'needs_review',
    hireDate: new Date('2023-01-10')
  },
  { 
    id: 'emp4', 
    name: 'Sarah Chen', 
    email: 'sarah.chen@acme.com', 
    departmentId: 'dept4', 
    locationId: 'loc1', 
    role: 'Controller', 
    status: 'active',
    expensePolicyStatus: 'compliant',
    hireDate: new Date('2020-09-01')
  },
  { 
    id: 'emp5', 
    name: 'David Kim', 
    email: 'david.kim@acme.com', 
    departmentId: 'dept2', 
    locationId: 'loc2', 
    role: 'Marketing Lead', 
    status: 'active',
    managerId: 'emp4',
    expensePolicyStatus: 'pending',
    hireDate: new Date('2023-08-21')
  },
  { 
    id: 'emp6', 
    name: 'Lisa Wong', 
    email: 'lisa.wong@acme.com', 
    departmentId: 'dept6', 
    locationId: 'loc1', 
    role: 'HR Manager', 
    status: 'active',
    managerId: 'emp4',
    expensePolicyStatus: 'compliant',
    hireDate: new Date('2021-11-15')
  },
]

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<ExtendedEmployee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<ExtendedEmployee | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    departmentId: "",
    locationId: "",
    role: "",
    managerId: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    setEmployees(mockExtendedEmployees)
    setDepartments(getDepartmentsData)
    setLocations(getLocationsData)
    setLoading(false)
  }

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase())
    const matchesDepartment = departmentFilter === 'all' || e.departmentId === departmentFilter
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const handleCreate = () => {
    console.log("Creating employee:", formData)
    const newEmp: ExtendedEmployee = {
      id: `emp${employees.length + 1}`,
      name: formData.name,
      email: formData.email,
      departmentId: formData.departmentId,
      locationId: formData.locationId || undefined,
      role: formData.role,
      status: 'active',
      managerId: formData.managerId || undefined,
      expensePolicyStatus: 'pending',
      hireDate: new Date(),
    }
    setEmployees([...employees, newEmp])
    setCreateModalOpen(false)
    setFormData({ name: "", email: "", departmentId: "", locationId: "", role: "", managerId: "" })
  }

  const handleEdit = (emp: ExtendedEmployee) => {
    setEditEmployee(emp)
    setFormData({
      name: emp.name,
      email: emp.email,
      departmentId: emp.departmentId,
      locationId: emp.locationId || "",
      role: emp.role,
      managerId: emp.managerId || "",
    })
  }

  const handleSaveEdit = () => {
    if (editEmployee) {
      setEmployees(employees.map(e => 
        e.id === editEmployee.id 
          ? { ...e, ...formData, locationId: formData.locationId || undefined, managerId: formData.managerId || undefined }
          : e
      ))
    }
    setEditEmployee(null)
    setFormData({ name: "", email: "", departmentId: "", locationId: "", role: "", managerId: "" })
  }

  const handleToggleStatus = (emp: ExtendedEmployee) => {
    setEmployees(employees.map(e => 
      e.id === emp.id 
        ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' }
        : e
    ))
  }

  const getDepartment = (deptId: string) => departments.find(d => d.id === deptId)
  const getLocation = (locId?: string) => locId ? locations.find(l => l.id === locId) : null
  const getManager = (managerId?: string) => managerId ? employees.find(e => e.id === managerId) : null

  const getExpensePolicyBadge = (status?: ExtendedEmployee['expensePolicyStatus']) => {
    switch (status) {
      case 'compliant':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Compliant
          </Badge>
        )
      case 'needs_review':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Needs Review
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const activeEmployees = employees.filter(e => e.status === 'active').length

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Employees</h1>
            <p className="text-sm text-muted-foreground">
              Manage employee directory and expense policies
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : employees.length}</div>
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
              <div className="text-2xl font-bold text-green-600">{loading ? <Skeleton className="h-8 w-16" /> : activeEmployees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Compliant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : employees.filter(e => e.expensePolicyStatus === 'compliant').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Needs Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {loading ? <Skeleton className="h-8 w-16" /> : employees.filter(e => e.expensePolicyStatus === 'needs_review').length}
              </div>
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
              <div className="text-2xl font-bold text-blue-600">
                {loading ? <Skeleton className="h-8 w-16" /> : employees.filter(e => e.expensePolicyStatus === 'pending').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Employee Directory</CardTitle>
              <div className="flex items-center gap-4">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search employees..." 
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
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expense Policy</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp) => {
                    const dept = getDepartment(emp.departmentId)
                    const loc = getLocation(emp.locationId)
                    const manager = getManager(emp.managerId)
                    return (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {emp.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{emp.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {emp.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{dept?.name || '—'}</span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Briefcase className="h-3 w-3" />
                            {emp.role}
                          </div>
                        </TableCell>
                        <TableCell>
                          {manager ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {manager.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{manager.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {loc ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{loc.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={emp.status === 'active' ? 'default' : 'secondary'}>
                            {emp.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getExpensePolicyBadge(emp.expensePolicyStatus)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(emp)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {emp.status === 'active' ? (
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleToggleStatus(emp)}
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleToggleStatus(emp)}>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Employee</DialogTitle>
              <DialogDescription>
                Add a new employee to the directory
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john.smith@company.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={formData.locationId} onValueChange={(v) => setFormData({ ...formData, locationId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role / Title</Label>
                  <Input 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Senior Accountant"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Manager</Label>
                  <Select value={formData.managerId} onValueChange={(v) => setFormData({ ...formData, managerId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No manager</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Add Employee</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={!!editEmployee} onOpenChange={() => setEditEmployee(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update employee details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={formData.locationId || 'none'} onValueChange={(v) => setFormData({ ...formData, locationId: v === 'none' ? '' : v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No location</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role / Title</Label>
                  <Input 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Manager</Label>
                  <Select value={formData.managerId || 'none'} onValueChange={(v) => setFormData({ ...formData, managerId: v === 'none' ? '' : v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No manager</SelectItem>
                      {employees.filter(e => e.id !== editEmployee?.id).map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditEmployee(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
