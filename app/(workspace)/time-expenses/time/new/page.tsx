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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createTimeEntry, getProjectDetails, submitTimeEntry } from "@/lib/services"
import type { ProjectDetail } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

const today = format(new Date(), "yyyy-MM-dd")

export default function NewTimeEntryPage() {
  const router = useRouter()
  const { activeEntity } = useWorkspaceShell()
  const [projects, setProjects] = useState<ProjectDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectId, setProjectId] = useState("none")
  const [entryDate, setEntryDate] = useState(today)
  const [hours, setHours] = useState("1")
  const [rate, setRate] = useState("150")
  const [billable, setBillable] = useState(true)
  const [taskDescription, setTaskDescription] = useState("")
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
  const totalAmount = useMemo(() => (Number(hours) || 0) * (billable ? Number(rate) || 0 : 0), [billable, hours, rate])
  const isValid = Boolean(taskDescription.trim()) && Number(hours) > 0

  async function handleSave(submitAfterSave: boolean) {
    if (!isValid) {
      setError("Task description and hours are required.")
      return
    }

    setSaving(true)
    setError(null)

    const result = await createTimeEntry({
      entityId: activeEntity?.id ?? "e1",
      projectId: selectedProject?.id,
      projectName: selectedProject?.name,
      date: new Date(entryDate),
      hours: Number(hours),
      billable,
      rate: billable ? Number(rate) : 0,
      taskDescription,
      notes,
    })

    if (result.success && result.timeEntry) {
      if (submitAfterSave) {
        await submitTimeEntry(result.timeEntry.id)
      }
      router.push("/time-expenses")
      return
    }

    setSaving(false)
    setError("The time entry could not be created.")
  }

  return (
    <CreateRecordPage
      title="Log Time"
      description="Capture billable and non-billable time against customer work and internal initiatives."
      breadcrumbs={[
        { label: "Time & Expenses", href: "/time-expenses" },
        { label: "Log Time" },
      ]}
      backHref="/time-expenses"
      backLabel="Back to Time & Expenses"
      formTitle="Time Entry"
      formDescription="Create a draft time entry or submit it directly into the approval queue."
      rail={
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entry Value</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Hours</span>
                <span className="font-medium">{hours}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Billable Rate</span>
                <span className="font-medium">{billable ? formatCurrency(Number(rate) || 0) : "Non-billable"}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Entry Amount</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connected Demo Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Submitted time rolls back into the time and expense queue immediately after save.</p>
              <p>Project-linked entries help demonstrate downstream project profitability and billing readiness.</p>
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
              <Label htmlFor="time-project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="time-project">
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
              <Label htmlFor="time-date">Entry Date</Label>
              <Input id="time-date" type="date" value={entryDate} onChange={event => setEntryDate(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-hours">Hours</Label>
              <Input id="time-hours" type="number" min="0.25" step="0.25" value={hours} onChange={event => setHours(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-rate">Billable Rate</Label>
              <Input id="time-rate" type="number" min="0" step="0.01" value={rate} onChange={event => setRate(event.target.value)} disabled={!billable} />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="time-billable" checked={billable} onCheckedChange={value => setBillable(Boolean(value))} />
            <Label htmlFor="time-billable">Billable time</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time-task">Task Description</Label>
            <Input
              id="time-task"
              value={taskDescription}
              onChange={event => setTaskDescription(event.target.value)}
              placeholder="Month-end review, implementation workshop, forecast modeling…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time-notes">Notes</Label>
            <Textarea
              id="time-notes"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              placeholder="Capture context the approver or project manager should see."
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
