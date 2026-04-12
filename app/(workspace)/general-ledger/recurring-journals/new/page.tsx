"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
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
import { createRecurringJournal, getAccounts, getEntities } from "@/lib/services"
import type { Account, Entity } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface DraftJournalLine {
  id: string
  accountId: string
  description: string
  debit: string
  credit: string
}

const today = format(new Date(), "yyyy-MM-dd")

export default function NewRecurringJournalPage() {
  const router = useRouter()
  const { activeEntity } = useWorkspaceShell()
  const [entities, setEntities] = useState<Entity[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [entityId, setEntityId] = useState(activeEntity?.id ?? "e1")
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly" | "quarterly" | "yearly">("monthly")
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState("")
  const [lines, setLines] = useState<DraftJournalLine[]>([
    { id: "line-1", accountId: "", description: "", debit: "0", credit: "0" },
    { id: "line-2", accountId: "", description: "", debit: "0", credit: "0" },
  ])

  useEffect(() => {
    let cancelled = false

    async function loadOptions() {
      setLoading(true)
      const [entityData, accountData] = await Promise.all([getEntities(), getAccounts()])
      if (!cancelled) {
        setEntities(entityData)
        setAccounts(accountData.filter(account => account.status === "active"))
        setLoading(false)
      }
    }

    void loadOptions()

    return () => {
      cancelled = true
    }
  }, [])

  const totals = useMemo(
    () =>
      lines.reduce(
        (sum, line) => ({
          debit: sum.debit + (Number(line.debit) || 0),
          credit: sum.credit + (Number(line.credit) || 0),
        }),
        { debit: 0, credit: 0 }
      ),
    [lines]
  )
  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01
  const isValid = Boolean(name.trim()) && Boolean(entityId) && lines.some(line => line.accountId && (Number(line.debit) > 0 || Number(line.credit) > 0)) && isBalanced

  function addLine() {
    setLines(previous => [
      ...previous,
      { id: `line-${previous.length + 1}`, accountId: "", description: "", debit: "0", credit: "0" },
    ])
  }

  function updateLine(id: string, field: keyof DraftJournalLine, value: string) {
    setLines(previous => previous.map(line => (line.id === id ? { ...line, [field]: value } : line)))
  }

  function removeLine(id: string) {
    setLines(previous => (previous.length <= 2 ? previous : previous.filter(line => line.id !== id)))
  }

  async function handleSubmit() {
    if (!isValid) {
      setError("Name, balanced lines, and an entity are required.")
      return
    }

    setSaving(true)
    setError(null)

    const templateLines = lines
      .filter(line => line.accountId && (Number(line.debit) > 0 || Number(line.credit) > 0))
      .map(line => {
        const account = accounts.find(item => item.id === line.accountId)
        return {
          accountId: line.accountId,
          accountName: account?.name || "",
          description: line.description,
          debit: Number(line.debit) || 0,
          credit: Number(line.credit) || 0,
        }
      })

    const result = await createRecurringJournal({
      name,
      description,
      entityId,
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      templateLines,
    })

    if (result.success) {
      router.push("/general-ledger/recurring-journals")
      return
    }

    setSaving(false)
    setError("The recurring journal could not be created.")
  }

  return (
    <CreateRecordPage
      title="New Recurring Journal"
      description="Create a reusable journal template for period-close automation and scheduled posting."
      breadcrumbs={[
        { label: "General Ledger", href: "/general-ledger" },
        { label: "Recurring Journals", href: "/general-ledger/recurring-journals" },
        { label: "New Recurring Journal" },
      ]}
      backHref="/general-ledger/recurring-journals"
      backLabel="Back to Recurring Journals"
      formTitle="Recurring Journal Template"
      formDescription="Define the cadence and balanced journal lines the system should generate automatically."
      rail={
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Debits</span>
                <span className="font-medium">{formatCurrency(totals.debit)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Credits</span>
                <span className="font-medium">{formatCurrency(totals.credit)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{isBalanced ? "Balanced" : "Out of balance"}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connected Demo Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Recurring templates flow directly into the recurring journal workspace, where operators can run, pause, or resume them.</p>
              <p>Balanced lines keep the double-entry concepts visible even in automation-driven workflows.</p>
            </CardContent>
          </Card>
        </>
      }
    >
      {loading ? (
        <div className="py-12 text-sm text-muted-foreground">Loading recurring journal options…</div>
      ) : (
        <div className="space-y-6">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recurring-name">Template Name</Label>
              <Input id="recurring-name" value={name} onChange={event => setName(event.target.value)} placeholder="Monthly prepaid amortization, payroll accrual, depreciation…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-entity">Entity</Label>
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger id="recurring-entity">
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
              <Label htmlFor="recurring-frequency">Frequency</Label>
              <Select value={frequency} onValueChange={value => setFrequency(value as typeof frequency)}>
                <SelectTrigger id="recurring-frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-start">Start Date</Label>
              <Input id="recurring-start" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-end">End Date</Label>
              <Input id="recurring-end" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurring-description">Description</Label>
            <Textarea
              id="recurring-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Explain why this journal repeats and what operators should validate before scheduled runs."
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Template Lines</h3>
                <p className="text-sm text-muted-foreground">Keep the journal balanced so it can be scheduled safely.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="mr-2 h-4 w-4" />
                Add Line
              </Button>
            </div>

            <div className="space-y-3">
              {lines.map(line => (
                <div key={line.id} className="grid gap-3 rounded-md border p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_120px_120px_44px]">
                  <div className="space-y-2">
                    <Label>Account</Label>
                    <Select value={line.accountId} onValueChange={value => updateLine(line.id, "accountId", value)}>
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
                    <Label>Description</Label>
                    <Input value={line.description} onChange={event => updateLine(line.id, "description", event.target.value)} placeholder="Line memo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Debit</Label>
                    <Input type="number" min="0" step="0.01" value={line.debit} onChange={event => updateLine(line.id, "debit", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Credit</Label>
                    <Input type="number" min="0" step="0.01" value={line.credit} onChange={event => updateLine(line.id, "credit", event.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(line.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button variant="outline" asChild>
              <Link href="/general-ledger/recurring-journals">Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !isValid}>
              {saving ? "Creating…" : "Create Recurring Journal"}
            </Button>
          </div>
        </div>
      )}
    </CreateRecordPage>
  )
}
