"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
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
import { Input } from "@/components/ui/input"
import { 
  Workflow, 
  Plus,
  CheckCircle2,
  Bell,
  Zap,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  Edit,
  Clock,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getWorkflows, createWorkflow, updateWorkflowStatus } from "@/lib/services"
import type { Workflow as WorkflowType } from "@/lib/types"

const workflowTypes = [
  { value: "approval", label: "Approval", icon: CheckCircle2, description: "Require approval for transactions" },
  { value: "notification", label: "Notification", icon: Bell, description: "Send alerts and notifications" },
  { value: "automation", label: "Automation", icon: Zap, description: "Automate repetitive tasks" },
]

const triggers = [
  { value: "bill.created", label: "Bill Created" },
  { value: "bill.approved", label: "Bill Approved" },
  { value: "invoice.created", label: "Invoice Created" },
  { value: "invoice.overdue", label: "Invoice Overdue" },
  { value: "invoice.paid", label: "Invoice Paid" },
  { value: "journal_entry.created", label: "Journal Entry Created" },
  { value: "journal_entry.approved", label: "Journal Entry Approved" },
  { value: "payment.completed", label: "Payment Completed" },
  { value: "expense.submitted", label: "Expense Submitted" },
]

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowType[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "approval" as WorkflowType["type"],
    trigger: "bill.created",
  })

  useEffect(() => {
    fetchWorkflows()
  }, [typeFilter])

  const fetchWorkflows = async () => {
    setLoading(true)
    const data = await getWorkflows(typeFilter || undefined)
    setWorkflows(data)
    setLoading(false)
  }

  const handleCreate = async () => {
    await createWorkflow({
      name: formData.name,
      type: formData.type,
      trigger: formData.trigger,
      steps: [],
      entityIds: [],
    })
    setCreateModalOpen(false)
    setFormData({ name: "", type: "approval", trigger: "bill.created" })
    fetchWorkflows()
  }

  const handleToggleStatus = async (workflow: WorkflowType) => {
    const newStatus = workflow.status === "active" ? "inactive" : "active"
    await updateWorkflowStatus(workflow.id, newStatus)
    fetchWorkflows()
  }

  const handleDelete = async (id: string) => {
    await updateWorkflowStatus(id, "inactive")
    fetchWorkflows()
  }

  const getTypeIcon = (type: WorkflowType["type"]) => {
    const found = workflowTypes.find(t => t.value === type)
    return found ? found.icon : Workflow
  }

  const getStatusBadge = (status: WorkflowType["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <Play className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <Pause className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        )
      case "draft":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        )
      default:
        return null
    }
  }

  const activeCount = workflows.filter(w => w.status === "active").length
  const approvalCount = workflows.filter(w => w.type === "approval").length
  const automationCount = workflows.filter(w => w.type === "automation").length

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Workflows</h1>
            <p className="text-sm text-muted-foreground">
              Automate approvals, notifications, and business processes
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Workflow className="h-4 w-4" />
                Total Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : workflows.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Play className="h-4 w-4" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loading ? <Skeleton className="h-8 w-16" /> : activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : approvalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Automations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : automationCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Button 
            variant={typeFilter === null ? "default" : "outline"} 
            size="sm"
            onClick={() => setTypeFilter(null)}
          >
            All
          </Button>
          {workflowTypes.map((type) => {
            const Icon = type.icon
            return (
              <Button
                key={type.value}
                variant={typeFilter === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(type.value)}
              >
                <Icon className="h-4 w-4 mr-1" />
                {type.label}
              </Button>
            )
          })}
        </div>

        {/* Workflows List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <Workflow className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No workflows found</p>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {workflows.map((workflow) => {
              const Icon = getTypeIcon(workflow.type)
              const typeInfo = workflowTypes.find(t => t.value === workflow.type)
              return (
                <Card key={workflow.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${
                          workflow.type === "approval" ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200" :
                          workflow.type === "notification" ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200" :
                          "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200"
                        }`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{workflow.name}</h3>
                            {getStatusBadge(workflow.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {typeInfo?.label} &bull; Trigger: {triggers.find(t => t.value === workflow.trigger)?.label || workflow.trigger}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{workflow.steps.length} step{workflow.steps.length !== 1 ? "s" : ""}</span>
                            <span>&bull;</span>
                            <span>Created by {workflow.createdBy}</span>
                            <span>&bull;</span>
                            <span>{new Date(workflow.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`toggle-${workflow.id}`} className="text-sm text-muted-foreground">
                            {workflow.status === "active" ? "Active" : "Inactive"}
                          </Label>
                          <Switch
                            id={`toggle-${workflow.id}`}
                            checked={workflow.status === "active"}
                            onCheckedChange={() => handleToggleStatus(workflow)}
                          />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(workflow.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workflow</DialogTitle>
              <DialogDescription>
                Set up a new automated workflow
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Workflow Name</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Bill Approval > $10,000"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {workflowTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <Card 
                        key={type.value}
                        className={`cursor-pointer transition-colors ${formData.type === type.value ? "border-primary bg-primary/5" : "hover:border-muted-foreground/50"}`}
                        onClick={() => setFormData({ ...formData, type: type.value as WorkflowType["type"] })}
                      >
                        <CardContent className="p-4 text-center">
                          <Icon className="h-6 w-6 mx-auto mb-2" />
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select value={formData.trigger} onValueChange={(v) => setFormData({ ...formData, trigger: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggers.map((trigger) => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        {trigger.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Workflow</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
