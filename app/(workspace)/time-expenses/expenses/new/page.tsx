"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CreateRecordPage } from "@/components/finance/create-record-page"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createExpenseEntry, getProjectDetails, submitExpenseEntry } from "@/lib/services"
import type { ProjectDetail } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

const today = format(new Date(), "yyyy-MM-dd")
const expenseCategories = ["Travel", "Meals", "Software", "Supplies", "Training", "Other"]

export default function NewExpenseEntryPage() {
  const router = useRouter()
  const { activeEntity } = useWorkspaceShell()
  const [projects, setProjects] = useState<ProjectDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState("Travel")
  const [projectId, setProjectId] = useState("none")
  const [entryDate, setEntryDate] = useState(today)
  const [amount, setAmount] = useState("0")
  const [description, setDescription] = useState("")
  const [billable, setBillable] = useState(true)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadProjects() {
      setLoading(true)
      const response = await getProjectDetails(undefined, undefined, undefined, undefined, 1, 100)
      if (!cancelled) {
        setProjects(response.data)
        setLoading(false)
      }
    }

    void loadProjects()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedProject = projectId === "none" ? null : projects.find(project => project.id === projectId)
  const numericAmount = Number(amount) || 0
  const isValid = Boolean(description.trim()) && numericAmount > 0

  async function handleSave(submitAfterSave: boolean) {
    if (!isValid) {
      setError("Category, description, and amount are required.")
      return
    }

    setSaving(true)
    setError(null)

    const result = await createExpenseEntry({
      entityId: activeEntity?.id ?? "e1",
      category,
      date: new Date(entryDate),
      amount: numericAmount,
      description,
      billable,
      projectId: selectedProject?.id,
      projectName: selectedProject?.name,
      notes,
    })

    if (result.success && result.expense) {
      if (submitAfterSave) {
        await submitExpenseEntry(result.expense.id)
      }
      router.push("/time-expenses")
      return
    }

    setSaving(false)
    setError("The expense entry could not be created.")
  }

  return (
    <CreateRecordPage
      title="New Expense"
      description="Capture reimbursable and billable spend with project context and approval-ready notes."
      breadcrumbs={[
        { label: "Time & Expenses", href: "/time-expenses" },
        { label: "New Expense" },
      ]}
      backHref="/time-expenses"
      backLabel="Back to Time & Expenses"
      formTitle="Expense Entry"
      formDescription="Draft an expense or send it directly to the approval queue."
      rail={
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expense Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{formatCurrency(numericAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Billing</span>
                <span className="font-medium">{billable ? "Billable" : "Internal"}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connected Demo Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Submitted expenses appear back in the time and expense workspace for approval and reimbursement tracking.</p>
              <p>Project-linked expenses help the project profitability views feel connected during demos.</p>
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
              <Label htmlFor="expense-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="expense-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="expense-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Internal / No project</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.code} · {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-date">Expense Date</Label>
              <Input id="expense-date" type="date" value={entryDate} onChange={event => setEntryDate(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount</Label>
              <Input id="expense-amount" type="number" min="0" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="expense-billable" checked={billable} onCheckedChange={value => setBillable(Boolean(value))} />
            <Label htmlFor="expense-billable">Billable to customer</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-description">Description</Label>
            <Input
              id="expense-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Hotel for controller summit, meal with customer, project software renewal…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-notes">Notes</Label>
            <Textarea
              id="expense-notes"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              placeholder="Capture reimbursement context, receipt notes, or billing guidance."
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button variant="outline" asChild>
              <Link href="/time-expenses">Cancel</Link>
            </Button>
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving || !isValid}>
              Save Draft
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving || !isValid}>
              Save & Submit
            </Button>
          </div>
        </div>
      )}
    </CreateRecordPage>
  )
}
