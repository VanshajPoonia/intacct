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
import { createSalesOrder, getAccounts, getCustomers, getEntities } from "@/lib/services"
import type { Account, Customer, Entity } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface DraftLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  accountId: string
}

const today = format(new Date(), "yyyy-MM-dd")

export default function NewSalesOrderPage() {
  const router = useRouter()
  const { activeEntity } = useWorkspaceShell()
  const [entities, setEntities] = useState<Entity[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entityId, setEntityId] = useState(activeEntity?.id ?? "e1")
  const [customerId, setCustomerId] = useState("")
  const [requestedDate, setRequestedDate] = useState(today)
  const [notes, setNotes] = useState("")
  const [lines, setLines] = useState<DraftLineItem[]>([
    { id: "line-1", description: "", quantity: 1, unitPrice: 0, accountId: "" },
  ])

  useEffect(() => {
    let cancelled = false

    async function loadOptions() {
      setLoading(true)
      const [entityData, customerResponse, accountData] = await Promise.all([
        getEntities(),
        getCustomers(),
        getAccounts(),
      ])

      if (!cancelled) {
        setEntities(entityData)
        setCustomers(customerResponse.data)
        setAccounts(accountData.filter(account => account.type === "revenue" && account.status === "active"))
        setLoading(false)
      }
    }

    void loadOptions()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedCustomer = customers.find(customer => customer.id === customerId)
  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
    [lines]
  )
  const tax = subtotal * 0.08
  const total = subtotal + tax
  const isValid =
    Boolean(entityId) &&
    Boolean(customerId) &&
    lines.some(line => line.description.trim() && line.accountId && line.quantity > 0 && line.unitPrice > 0)

  function updateLine(id: string, field: keyof DraftLineItem, value: string | number) {
    setLines(previous =>
      previous.map(line => (line.id === id ? { ...line, [field]: value } : line))
    )
  }

  function addLine() {
    setLines(previous => [
      ...previous,
      { id: `line-${previous.length + 1}`, description: "", quantity: 1, unitPrice: 0, accountId: "" },
    ])
  }

  function removeLine(id: string) {
    setLines(previous => (previous.length === 1 ? previous : previous.filter(line => line.id !== id)))
  }

  async function handleSubmit() {
    if (!isValid || !selectedCustomer) {
      setError("Customer, entity, and at least one complete order line are required.")
      return
    }

    setSaving(true)
    setError(null)

    const payloadLines = lines
      .filter(line => line.description.trim() && line.accountId && line.quantity > 0 && line.unitPrice > 0)
      .map(line => ({
        id: line.id,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        amount: line.quantity * line.unitPrice,
        shippedQuantity: 0,
        accountId: line.accountId,
      }))

    const result = await createSalesOrder({
      customerId,
      customerName: selectedCustomer.name,
      requestedDate: new Date(requestedDate),
      lines: payloadLines,
      subtotal,
      tax,
      total,
      entityId,
      notes,
    })

    if (result.success && result.salesOrder) {
      router.push(`/order-management/orders/${result.salesOrder.id}`)
      return
    }

    setSaving(false)
    setError("The sales order could not be created.")
  }

  return (
    <CreateRecordPage
      title="New Sales Order"
      description="Create a draft sales order and route it into fulfillment and invoicing."
      breadcrumbs={[
        { label: "Order Management", href: "/order-management" },
        { label: "New Sales Order" },
      ]}
      backHref="/order-management"
      backLabel="Back to Orders"
      formTitle="Sales Order Setup"
      formDescription="Define the customer, requested fulfillment timing, and revenue lines for this order."
      rail={
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estimated Tax</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>New orders land in draft and can then be confirmed, shipped, and invoiced from the main workspace.</p>
              <p>Using a revenue account on each line keeps the downstream order-to-cash demo connected to AR and revenue reporting.</p>
            </CardContent>
          </Card>
        </>
      }
    >
      {loading ? (
        <div className="py-12 text-sm text-muted-foreground">Loading order options…</div>
      ) : (
        <div className="space-y-6">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="so-entity">Entity</Label>
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger id="so-entity">
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
              <Label htmlFor="so-customer">Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="so-customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="so-requested-date">Requested Date</Label>
              <Input id="so-requested-date" type="date" value={requestedDate} onChange={event => setRequestedDate(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Customer Link</Label>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {selectedCustomer ? (
                  <Link href={`/accounts-receivable/customers/${selectedCustomer.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                    {selectedCustomer.name}
                  </Link>
                ) : (
                  "Choose a customer to connect this order into AR."
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Order Lines</h3>
                <p className="text-sm text-muted-foreground">Each line drives fulfillment and downstream invoicing.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="mr-2 h-4 w-4" />
                Add Line
              </Button>
            </div>

            <div className="space-y-3">
              {lines.map(line => (
                <div key={line.id} className="grid gap-3 rounded-md border p-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_100px_120px_44px]">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={line.description}
                      onChange={event => updateLine(line.id, "description", event.target.value)}
                      placeholder="Subscription renewal, onboarding package, consulting block…"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Revenue Account</Label>
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
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={event => updateLine(line.id, "quantity", Number(event.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={event => updateLine(line.id, "unitPrice", Number(event.target.value))}
                    />
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

          <div className="space-y-2">
            <Label htmlFor="so-notes">Internal Notes</Label>
            <Textarea
              id="so-notes"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              placeholder="Capture shipping terms, approval notes, or customer-specific instructions."
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button variant="outline" asChild>
              <Link href="/order-management">Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !isValid}>
              {saving ? "Creating…" : "Create Sales Order"}
            </Button>
          </div>
        </div>
      )}
    </CreateRecordPage>
  )
}
