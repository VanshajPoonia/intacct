"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CreateRecordPage } from "@/components/finance/create-record-page"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createProject, getCustomers, getEntities, getUsers } from "@/lib/services"
import type { Customer, Entity, User } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

const today = format(new Date(), "yyyy-MM-dd")

export default function NewProjectPage() {
  const router = useRouter()
  const { activeEntity } = useWorkspaceShell()
  const [entities, setEntities] = useState<Entity[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [entityId, setEntityId] = useState(activeEntity?.id ?? "e1")
  const [customerId, setCustomerId] = useState("none")
  const [managerId, setManagerId] = useState("")
  const [budget, setBudget] = useState("0")
  const [revenue, setRevenue] = useState("0")
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadOptions() {
      setLoading(true)
      const [entityData, customerResponse, usersData] = await Promise.all([
        getEntities(),
        getCustomers(),
        getUsers(),
      ])

      if (!cancelled) {
        setEntities(entityData)
        setCustomers(customerResponse.data)
        setUsers(usersData.filter(user => user.status === "active"))
        setManagerId(usersData.find(user => user.status === "active")?.id ?? "")
        setLoading(false)
      }
    }

    void loadOptions()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedCustomer = customerId === "none" ? null : customers.find(customer => customer.id === customerId)
  const selectedManager = users.find(user => user.id === managerId)
  const numericBudget = Number(budget) || 0
  const numericRevenue = Number(revenue) || 0
  const projectedMargin = numericRevenue > 0 ? ((numericRevenue - numericBudget) / numericRevenue) * 100 : 0
  const isValid = Boolean(name.trim()) && Boolean(code.trim()) && Boolean(entityId) && Boolean(managerId)

  async function handleSubmit() {
    if (!isValid || !selectedManager) {
      setError("Project name, code, entity, and manager are required.")
      return
    }

    setSaving(true)
    setError(null)

    const result = await createProject({
      name,
      code,
      entityId,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      managerId,
      managerName: `${selectedManager.firstName} ${selectedManager.lastName}`.trim(),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      budget: numericBudget,
      revenue: numericRevenue,
      description,
    })

    if (result.success && result.project) {
      router.push(`/projects/${result.project.id}`)
      return
    }

    setSaving(false)
    setError("The project could not be created.")
  }

  return (
    <CreateRecordPage
      title="New Project"
      description="Create a project record that ties customer work, time capture, and margin tracking together."
      breadcrumbs={[
        { label: "Projects", href: "/projects" },
        { label: "New Project" },
      ]}
      backHref="/projects"
      backLabel="Back to Projects"
      formTitle="Project Setup"
      formDescription="Set the commercial owner, scope timing, and baseline financial targets."
      rail={
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Projected Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-medium">{formatCurrency(numericBudget)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expected Revenue</span>
                <span className="font-medium">{formatCurrency(numericRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Projected Margin</span>
                <span className="font-medium">{projectedMargin.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connected Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Projects appear immediately in time and expense entry pickers once they’re created.</p>
              <p>Customer-linked projects also connect into AR collections and contract/revenue views for the demo.</p>
            </CardContent>
          </Card>
        </>
      }
    >
      {loading ? (
        <div className="py-12 text-sm text-muted-foreground">Loading project options…</div>
      ) : (
        <div className="space-y-6">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input id="project-name" value={name} onChange={event => setName(event.target.value)} placeholder="Customer rollout, modernization program, campaign launch…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-code">Project Code</Label>
              <Input id="project-code" value={code} onChange={event => setCode(event.target.value)} placeholder="ALPHA-2026" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-entity">Entity</Label>
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger id="project-entity">
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-manager">Project Manager</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger id="project-manager">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-customer">Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="project-customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Internal / No customer</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-start">Start Date</Label>
              <Input id="project-start" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-end">End Date</Label>
              <Input id="project-end" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-budget">Budget</Label>
              <Input id="project-budget" type="number" min="0" step="0.01" value={budget} onChange={event => setBudget(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-revenue">Expected Revenue</Label>
              <Input id="project-revenue" type="number" min="0" step="0.01" value={revenue} onChange={event => setRevenue(event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Summarize scope, delivery milestones, and the operator workflow this project should support."
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button variant="outline" asChild>
              <Link href="/projects">Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !isValid}>
              {saving ? "Creating…" : "Create Project"}
            </Button>
          </div>
        </div>
      )}
    </CreateRecordPage>
  )
}
