// @ts-nocheck
"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Calendar,
  User,
  MoreHorizontal,
  Flag,
  ExternalLink,
  Bell,
  BellOff,
  UserPlus,
  ArrowRight,
  Building2,
  FileText,
  Receipt,
  CreditCard,
  MessageSquare,
  Paperclip,
} from "lucide-react"
import { format, isAfter, isBefore, addDays, addHours } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { getTasks, createTask, updateTaskStatus, getUsers, getEntities } from "@/lib/services"
import type { Task, User, Entity, PaginatedResponse } from "@/lib/types"

function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, { className: string; icon: React.ReactNode }> = {
    high: { className: 'bg-red-100 text-red-700 border-red-200', icon: <Flag className="h-3 w-3 mr-1" /> },
    medium: { className: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Flag className="h-3 w-3 mr-1" /> },
    low: { className: 'bg-gray-100 text-gray-600 border-gray-200', icon: <Flag className="h-3 w-3 mr-1" /> },
  }
  
  const variant = variants[priority] || variants.medium
  
  return (
    <Badge variant="outline" className={`text-xs font-medium ${variant.className}`}>
      {variant.icon}
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    todo: { className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'To Do' },
    in_progress: { className: 'bg-blue-100 text-blue-700 border-blue-200', label: 'In Progress' },
    completed: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Completed' },
    cancelled: { className: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelled' },
    snoozed: { className: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Snoozed' },
  }
  
  const variant = variants[status] || { className: 'bg-gray-100 text-gray-700', label: status }
  
  return (
    <Badge variant="outline" className={`text-xs font-medium ${variant.className}`}>
      {variant.label}
    </Badge>
  )
}

function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    approval: { label: 'Approval', icon: <CheckSquare className="h-3 w-3" />, className: 'bg-amber-50 text-amber-700' },
    review: { label: 'Review', icon: <FileText className="h-3 w-3" />, className: 'bg-blue-50 text-blue-700' },
    data_entry: { label: 'Data Entry', icon: <FileText className="h-3 w-3" />, className: 'bg-gray-50 text-gray-700' },
    reconciliation: { label: 'Reconciliation', icon: <Receipt className="h-3 w-3" />, className: 'bg-purple-50 text-purple-700' },
    follow_up: { label: 'Follow Up', icon: <Bell className="h-3 w-3" />, className: 'bg-emerald-50 text-emerald-700' },
    other: { label: 'Other', icon: <FileText className="h-3 w-3" />, className: 'bg-gray-50 text-gray-700' },
  }
  
  const c = config[type] || config.other
  
  return (
    <Badge variant="secondary" className={`text-xs font-medium gap-1 ${c.className}`}>
      {c.icon}
      {c.label}
    </Badge>
  )
}

function RelatedObjectLink({ type, number, id }: { type?: string; number?: string; id?: string }) {
  if (!type || !number) return null

  const config: Record<string, { href: string; icon: React.ReactNode; label: string }> = {
    bill: { href: `/accounts-payable/bills/${id}`, icon: <Receipt className="h-3 w-3" />, label: 'Bill' },
    invoice: { href: `/accounts-receivable/invoices/${id}`, icon: <FileText className="h-3 w-3" />, label: 'Invoice' },
    journal_entry: { href: `/general-ledger/journal-entries/${id}`, icon: <FileText className="h-3 w-3" />, label: 'Journal' },
    payment: { href: `/accounts-payable/payments/${id}`, icon: <CreditCard className="h-3 w-3" />, label: 'Payment' },
    receipt: { href: `/accounts-receivable/receipts/${id}`, icon: <Receipt className="h-3 w-3" />, label: 'Receipt' },
    reconciliation: { href: `/cash-management/reconciliation`, icon: <Receipt className="h-3 w-3" />, label: 'Reconciliation' },
  }

  const c = config[type] || { href: '#', icon: <FileText className="h-3 w-3" />, label: type }

  return (
    <Link href={c.href}>
      <Badge variant="outline" className="text-xs gap-1 cursor-pointer hover:bg-muted">
        {c.icon}
        {number}
        <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
      </Badge>
    </Link>
  )
}

const snoozeOptions = [
  { value: '1h', label: '1 hour', hours: 1 },
  { value: '4h', label: '4 hours', hours: 4 },
  { value: '1d', label: 'Tomorrow', hours: 24 },
  { value: '3d', label: '3 days', hours: 72 },
  { value: '1w', label: '1 week', hours: 168 },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<PaginatedResponse<Task> | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<string>("active")
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  
  // Task detail drawer
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  
  // Snooze dialog
  const [snoozeTask, setSnoozeTask] = useState<Task | null>(null)
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const [snoozeDuration, setSnoozeDuration] = useState("")
  
  // Reassign dialog
  const [reassignTask, setReassignTask] = useState<Task | null>(null)
  const [reassignOpen, setReassignOpen] = useState(false)
  const [reassignUserId, setReassignUserId] = useState("")
  
  // New task form
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    type: "other" as Task['type'],
    priority: "medium" as Task['priority'],
    assigneeId: "",
    dueDate: "",
    relatedType: "",
    relatedNumber: "",
  })

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const statusFilter = tab === "active" ? ["todo", "in_progress"] : 
                          tab === "completed" ? ["completed"] : 
                          tab === "cancelled" ? ["cancelled"] : undefined
      
      const priorityArr = priorityFilter !== "all" ? [priorityFilter] : undefined
      const typeArr = typeFilter !== "all" ? [typeFilter] : undefined
      
      const result = await getTasks(
        undefined,
        statusFilter,
        priorityArr,
        typeArr,
        undefined,
        1,
        50
      )
      setTasks(result)
    } finally {
      setLoading(false)
    }
  }, [tab, priorityFilter, typeFilter])

  const fetchFilters = useCallback(async () => {
    const [usersResult, entitiesResult] = await Promise.all([
      getUsers(undefined, undefined, ["active"]),
      getEntities()
    ])
    setUsers(usersResult.data)
    setEntities(entitiesResult)
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    fetchFilters()
  }, [fetchFilters])

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    await updateTaskStatus(taskId, newStatus)
    fetchTasks()
  }

  const handleSnooze = async () => {
    if (!snoozeTask || !snoozeDuration) return
    const option = snoozeOptions.find(o => o.value === snoozeDuration)
    if (!option) return
    
    console.log(`Snoozing task ${snoozeTask.id} for ${option.label}`)
    // In a real app, this would call an API
    setSnoozeOpen(false)
    setSnoozeTask(null)
    setSnoozeDuration("")
  }

  const handleReassign = async () => {
    if (!reassignTask || !reassignUserId) return
    const user = users.find(u => u.id === reassignUserId)
    console.log(`Reassigning task ${reassignTask.id} to ${user?.firstName} ${user?.lastName}`)
    // In a real app, this would call an API
    setReassignOpen(false)
    setReassignTask(null)
    setReassignUserId("")
    fetchTasks()
  }

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return
    
    setCreating(true)
    try {
      const assignee = users.find(u => u.id === newTask.assigneeId)
      await createTask({
        title: newTask.title,
        description: newTask.description || undefined,
        type: newTask.type,
        priority: newTask.priority,
        assigneeId: newTask.assigneeId || 'u1',
        assigneeName: assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Sarah Chen',
        dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
        relatedType: newTask.relatedType || undefined,
        relatedNumber: newTask.relatedNumber || undefined,
      })
      setCreateOpen(false)
      setNewTask({
        title: "",
        description: "",
        type: "other",
        priority: "medium",
        assigneeId: "",
        dueDate: "",
        relatedType: "",
        relatedNumber: "",
      })
      fetchTasks()
    } finally {
      setCreating(false)
    }
  }

  const openSnooze = (task: Task) => {
    setSnoozeTask(task)
    setSnoozeOpen(true)
  }

  const openReassign = (task: Task) => {
    setReassignTask(task)
    setReassignOpen(true)
  }

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task)
    setDrawerOpen(true)
  }

  // Filter by search and entity
  const filteredTasks = tasks?.data.filter(task => {
    if (entityFilter !== "all" && task.entityId !== entityFilter) return false
    if (!search) return true
    const s = search.toLowerCase()
    return task.title.toLowerCase().includes(s) ||
           task.description?.toLowerCase().includes(s) ||
           task.assigneeName.toLowerCase().includes(s) ||
           task.relatedNumber?.toLowerCase().includes(s)
  }) || []

  // Summary counts
  const todoCount = tasks?.data.filter(t => t.status === 'todo').length || 0
  const inProgressCount = tasks?.data.filter(t => t.status === 'in_progress').length || 0
  const overdueCount = tasks?.data.filter(t => 
    t.status !== 'completed' && 
    t.status !== 'cancelled' && 
    t.dueDate && 
    isBefore(new Date(t.dueDate), new Date())
  ).length || 0
  const dueSoonCount = tasks?.data.filter(t => 
    t.status !== 'completed' && 
    t.status !== 'cancelled' && 
    t.dueDate && 
    isAfter(new Date(t.dueDate), new Date()) &&
    isBefore(new Date(t.dueDate), addDays(new Date(), 3))
  ).length || 0

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Task Center</h1>
            <p className="text-sm text-muted-foreground">Manage and track your workflow tasks across all modules</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <CheckSquare className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{todoCount}</p>
                  <p className="text-xs text-muted-foreground">To Do</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{inProgressCount}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{overdueCount}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{dueSoonCount}</p>
                  <p className="text-xs text-muted-foreground">Due Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Tabs */}
        <Card className="sticky top-0 z-10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="active">
                    Active
                    <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                      {todoCount + inProgressCount}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search tasks..." 
                    className="pl-9 w-[200px]"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Entity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    {entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="approval">Approval</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="data_entry">Data Entry</SelectItem>
                    <SelectItem value="reconciliation">Reconciliation</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-5 w-5" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No tasks found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task) => {
                  const isOverdue = task.dueDate && 
                    task.status !== 'completed' && 
                    task.status !== 'cancelled' && 
                    isBefore(new Date(task.dueDate), new Date())
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                        isOverdue ? 'border-red-200 bg-red-50/50' : ''
                      }`}
                      onClick={() => openTaskDetail(task)}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={task.status === 'completed'}
                          onCheckedChange={(checked) => {
                            handleStatusChange(task.id, checked ? 'completed' : 'todo')
                          }}
                          disabled={task.status === 'cancelled'}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium truncate ${
                            task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                          }`}>
                            {task.title}
                          </p>
                          {task.relatedNumber && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <RelatedObjectLink 
                                type={task.relatedType} 
                                number={task.relatedNumber}
                                id={task.relatedId}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assigneeName}
                          </span>
                          {task.dueDate && (
                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                              <Calendar className="h-3 w-3" />
                              {isOverdue ? 'Overdue: ' : 'Due: '}
                              {format(new Date(task.dueDate), 'MMM d, yyyy')}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {entities.find(e => e.id === task.entityId)?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <TypeBadge type={task.type} />
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {task.status === 'todo' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'in_progress')}>
                                <Clock className="h-4 w-4 mr-2" />
                                Start Task
                              </DropdownMenuItem>
                            )}
                            {task.status === 'in_progress' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'completed')}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Complete
                              </DropdownMenuItem>
                            )}
                            {task.status !== 'completed' && task.status !== 'cancelled' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openSnooze(task)}>
                                  <BellOff className="h-4 w-4 mr-2" />
                                  Snooze
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openReassign(task)}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Reassign
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(task.id, 'cancelled')}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel Task
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Task Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new task to your workflow</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter task description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={newTask.type} 
                  onValueChange={(value) => setNewTask({ ...newTask, type: value as Task['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approval">Approval</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="data_entry">Data Entry</SelectItem>
                    <SelectItem value="reconciliation">Reconciliation</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={newTask.priority} 
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value as Task['priority'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select 
                  value={newTask.assigneeId} 
                  onValueChange={(value) => setNewTask({ ...newTask, assigneeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input 
                  id="dueDate" 
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Link to Related Object (Optional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <Select 
                  value={newTask.relatedType} 
                  onValueChange={(value) => setNewTask({ ...newTask, relatedType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Object type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bill">Bill</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="journal_entry">Journal Entry</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="reconciliation">Reconciliation</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  placeholder="Document number"
                  value={newTask.relatedNumber}
                  onChange={(e) => setNewTask({ ...newTask, relatedNumber: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={creating || !newTask.title.trim()}>
              {creating ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Snooze Dialog */}
      <Dialog open={snoozeOpen} onOpenChange={setSnoozeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Snooze Task</DialogTitle>
            <DialogDescription>
              Choose how long to snooze this task
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {snoozeOptions.map((option) => (
              <Button
                key={option.value}
                variant={snoozeDuration === option.value ? "default" : "outline"}
                className="justify-start"
                onClick={() => setSnoozeDuration(option.value)}
              >
                <BellOff className="h-4 w-4 mr-2" />
                {option.label}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSnoozeOpen(false)}>Cancel</Button>
            <Button onClick={handleSnooze} disabled={!snoozeDuration}>
              Snooze
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reassign Task</DialogTitle>
            <DialogDescription>
              Select a new assignee for this task
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={reassignUserId} onValueChange={setReassignUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select new assignee" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      {user.firstName} {user.lastName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignOpen(false)}>Cancel</Button>
            <Button onClick={handleReassign} disabled={!reassignUserId}>
              <UserPlus className="h-4 w-4 mr-2" />
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          {selectedTask && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2 mb-2">
                  <TypeBadge type={selectedTask.type} />
                  <PriorityBadge priority={selectedTask.priority} />
                  <StatusBadge status={selectedTask.status} />
                </div>
                <SheetTitle>{selectedTask.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {selectedTask.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Assignee</p>
                      <p className="text-sm font-medium">{selectedTask.assigneeName}</p>
                    </div>
                  </div>
                  {selectedTask.dueDate && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Due Date</p>
                        <p className="text-sm font-medium">{format(new Date(selectedTask.dueDate), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Entity</p>
                      <p className="text-sm font-medium">{entities.find(e => e.id === selectedTask.entityId)?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">{format(new Date(selectedTask.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>

                {selectedTask.relatedNumber && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-3">Related Object</h4>
                      <RelatedObjectLink 
                        type={selectedTask.relatedType} 
                        number={selectedTask.relatedNumber}
                        id={selectedTask.relatedId}
                      />
                    </div>
                  </>
                )}

                <Separator />

                {/* Quick Actions */}
                {selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled' && (
                  <div className="flex gap-2">
                    {selectedTask.status === 'todo' && (
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleStatusChange(selectedTask.id, 'in_progress')}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Start Task
                      </Button>
                    )}
                    {selectedTask.status === 'in_progress' && (
                      <Button 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleStatusChange(selectedTask.id, 'completed')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setDrawerOpen(false)
                        openSnooze(selectedTask)
                      }}
                    >
                      <BellOff className="h-4 w-4 mr-2" />
                      Snooze
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setDrawerOpen(false)
                        openReassign(selectedTask)
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Reassign
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}
