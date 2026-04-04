"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"
import { format, isAfter, isBefore, addDays } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getTasks, createTask, updateTaskStatus, getUsers } from "@/lib/services"
import type { Task, User, PaginatedResponse } from "@/lib/types"

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
  }
  
  const variant = variants[status] || { className: 'bg-gray-100 text-gray-700', label: status }
  
  return (
    <Badge variant="outline" className={`text-xs font-medium ${variant.className}`}>
      {variant.label}
    </Badge>
  )
}

function TypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    approval: 'Approval',
    review: 'Review',
    data_entry: 'Data Entry',
    reconciliation: 'Reconciliation',
    follow_up: 'Follow Up',
    other: 'Other',
  }
  
  return (
    <Badge variant="secondary" className="text-xs font-medium">
      {labels[type] || type}
    </Badge>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<PaginatedResponse<Task> | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<string>("active")
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  
  // New task form
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    type: "other" as Task['type'],
    priority: "medium" as Task['priority'],
    assigneeId: "",
    dueDate: "",
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

  const fetchUsers = useCallback(async () => {
    const result = await getUsers(undefined, undefined, ["active"])
    setUsers(result.data)
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchUsers()
  }, [fetchTasks, fetchUsers])

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    await updateTaskStatus(taskId, newStatus)
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
      })
      setCreateOpen(false)
      setNewTask({
        title: "",
        description: "",
        type: "other",
        priority: "medium",
        assigneeId: "",
        dueDate: "",
      })
      fetchTasks()
    } finally {
      setCreating(false)
    }
  }

  // Filter by search
  const filteredTasks = tasks?.data.filter(task => {
    if (!search) return true
    const s = search.toLowerCase()
    return task.title.toLowerCase().includes(s) ||
           task.description?.toLowerCase().includes(s) ||
           task.assigneeName.toLowerCase().includes(s)
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
            <h1 className="text-2xl font-semibold text-foreground">Tasks</h1>
            <p className="text-sm text-muted-foreground">Manage and track your workflow tasks</p>
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
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="active">Active</TabsTrigger>
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
                      className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                        isOverdue ? 'border-red-200 bg-red-50/50' : ''
                      }`}
                    >
                      <Checkbox 
                        checked={task.status === 'completed'}
                        onCheckedChange={(checked) => {
                          handleStatusChange(task.id, checked ? 'completed' : 'todo')
                        }}
                        disabled={task.status === 'cancelled'}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium truncate ${
                            task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                          }`}>
                            {task.title}
                          </p>
                          {task.relatedNumber && (
                            <Badge variant="outline" className="text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {task.relatedNumber}
                            </Badge>
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
                        </div>
                      </div>
                      <TypeBadge type={task.type} />
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
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
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Task Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
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
                <Label>Due Date</Label>
                <Input 
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={!newTask.title.trim() || creating}>
              {creating ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
