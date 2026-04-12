"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"
import { CreateRecordPage } from "@/components/finance/create-record-page"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createAllocation, getAccounts, getDimensions, getEntities } from "@/lib/services"
import type { Account, Dimension, Entity } from "@/lib/types"

interface DraftAllocationTarget {
  id: string
  accountId: string
  departmentId: string
  percentage: string
  fixedAmount: string
}

export default function NewAllocationPage() {
  const router = useRouter()
  const { activeEntity } = useWorkspaceShell()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [departments, setDepartments] = useState<Dimension[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [entityId, setEntityId] = useState(activeEntity?.id ?? "e1")
  const [sourceAccountId, setSourceAccountId] = useState("")
  const [method, setMethod] = useState<"fixed" | "percentage" | "statistical">("percentage")
  const [frequency, setFrequency] = useState<"monthly" | "quarterly" | "yearly" | "on_demand">("monthly")
  const [basis, setBasis] = useState("headcount")
  const [targets, setTargets] = useState<DraftAllocationTarget[]>([
    { id: "target-1", accountId: "", departmentId: "", percentage: "100", fixedAmount: "0" },
  ])

  useEffect(() => {
    let cancelled = false

    async function loadOptions() {
      setLoading(true)
      const [accountData, dimensionData, entityData] = await Promise.all([getAccounts(), getDimensions(), getEntities()])
      if (!cancelled) {
        setAccounts(accountData.filter(account => account.status === "active"))
        setDepartments(dimensionData.filter(dimension => dimension.type === "department" && dimension.status === "active"))
        setEntities(entityData)
        setLoading(false)
      }
    }

    void loadOptions()

    return () => {
      cancelled = true
    }
  }, [])

  const sourceAccount = accounts.find(account => account.id === sourceAccountId)
  const percentageTotal = useMemo(
    () => targets.reduce((sum, target) => sum + (Number(target.percentage) || 0), 0),
    [targets]
  )
  const isValid =
    Boolean(name.trim()) &&
    Boolean(sourceAccountId) &&
    targets.some(target => target.accountId && target.departmentId) &&
    (method !== "percentage" || percentageTotal > 0)

  function addTarget() {
    setTargets(previous => [
      ...previous,
      { id: `target-${previous.length + 1}`, accountId: "", departmentId: "", percentage: "0", fixedAmount: "0" },
    ])
  }

  function updateTarget(id: string, field: keyof DraftAllocationTarget, value: string) {
    setTargets(previous => previous.map(target => (target.id === id ? { ...target, [field]: value } : target)))
  }

  function removeTarget(id: string) {
    setTargets(previous => (previous.length === 1 ? previous : previous.filter(target => target.id !== id)))
  }

  async function handleSubmit() {
    if (!isValid || !sourceAccount) {
      setError("Name, source account, and at least one target are required.")
      return
    }

    setSaving(true)
    setError(null)

    const payloadTargets = targets
      .filter(target => target.accountId && target.departmentId)
      .map(target => {
        const targetAccount = accounts.find(account => account.id === target.accountId)
        const department = departments.find(item => item.id === target.departmentId)
        return {
          id: target.id,
          accountId: target.accountId,
          accountName: targetAccount?.name || "",
          departmentId: target.departmentId,
          departmentName: department?.name,
          percentage: method === "percentage" || method === "statistical" ? Number(target.percentage) || 0 : undefined,
          fixedAmount: method === "fixed" ? Number(target.fixedAmount) || 0 : undefined,
        }
      })

    const result = await createAllocation({
      name,
      description,
      entityId,
      sourceAccountId,
      sourceAccountName: sourceAccount.name,
      method,
      frequency,
      basis: method === "statistical" ? basis : undefined,
      targets: payloadTargets,
    })

    if (result.success) {
      router.push("/general-ledger/allocations")
      return
    }

    setSaving(false)
    setError("The allocation rule could not be created.")
  }

  return (
    <CreateRecordPage
      title="New Allocation Rule"
      description="Define recurring cost allocations across departments and posting targets."
      breadcrumbs={[
        { label: "General Ledger", href: "/general-ledger" },
        { label: "Allocations", href: "/general-ledger/allocations" },
        { label: "New Allocation Rule" },
      ]}
      backHref="/general-ledger/allocations"
      backLabel="Back to Allocations"
      formTitle="Allocation Rule"
      formDescription="Set the source account, allocation method, and target breakdown."
      rail={
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Target Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Targets</span>
                <span className="font-medium">{targets.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium capitalize">{method.replace(/_/g, " ")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Percentage Total</span>
                <span className="font-medium">{percentageTotal.toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Demo Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>New rules land as drafts in the allocation workspace so controllers can review them before activation.</p>
              <p>Allocation output stays connected to journals and audit views through the existing GL workflow.</p>
            </CardContent>
          </Card>
        </>
      }
    >
      {loading ? (
        <div className="py-12 text-sm text-muted-foreground">Loading allocation options…</div>
      ) : (
        <div className="space-y-6">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="allocation-name">Rule Name</Label>
              <Input id="allocation-name" value={name} onChange={event => setName(event.target.value)} placeholder="IT shared services, rent spread, admin overhead…" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocation-entity">Entity</Label>
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger id="allocation-entity">
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
              <Label htmlFor="allocation-source">Source Account</Label>
              <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
                <SelectTrigger id="allocation-source">
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.number} · {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocation-method">Method</Label>
              <Select value={method} onValueChange={value => setMethod(value as typeof method)}>
                <SelectTrigger id="allocation-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="statistical">Statistical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocation-frequency">Frequency</Label>
              <Select value={frequency} onValueChange={value => setFrequency(value as typeof frequency)}>
                <SelectTrigger id="allocation-frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="on_demand">On Demand</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {method === "statistical" ? (
              <div className="space-y-2">
                <Label htmlFor="allocation-basis">Statistical Basis</Label>
                <Input id="allocation-basis" value={basis} onChange={event => setBasis(event.target.value)} placeholder="headcount, square footage, tickets…" />
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="allocation-description">Description</Label>
            <Textarea
              id="allocation-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Explain the logic finance operators should recognize when they review or run this rule."
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Targets</h3>
                <p className="text-sm text-muted-foreground">Add the departments and destination accounts that receive the allocation.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addTarget}>
                <Plus className="mr-2 h-4 w-4" />
                Add Target
              </Button>
            </div>

            <div className="space-y-3">
              {targets.map(target => (
                <div key={target.id} className="grid gap-3 rounded-md border p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_140px_44px]">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={target.departmentId} onValueChange={value => updateTarget(target.id, "departmentId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(department => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Destination Account</Label>
                    <Select value={target.accountId} onValueChange={value => updateTarget(target.id, "accountId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.number} · {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{method === "fixed" ? "Fixed Amount" : "Percentage"}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={method === "fixed" ? target.fixedAmount : target.percentage}
                      onChange={event =>
                        updateTarget(target.id, method === "fixed" ? "fixedAmount" : "percentage", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Type</Label>
                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm capitalize text-muted-foreground">
                      {method === "fixed" ? "Fixed amount" : method}
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTarget(target.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button variant="outline" asChild>
              <Link href="/general-ledger/allocations">Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !isValid}>
              {saving ? "Creating…" : "Create Allocation"}
            </Button>
          </div>
        </div>
      )}
    </CreateRecordPage>
  )
}
