"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Plus, Trash2, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { Entity, Customer, Account, InvoiceLineItem } from "@/lib/types"
import { 
  getEntities, 
  getCustomers, 
  getAccounts,
  createInvoice,
} from "@/lib/services"

interface CreateInvoiceModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateInvoiceModal({ open, onClose, onSuccess }: CreateInvoiceModalProps) {
  // Reference data
  const [entities, setEntities] = useState<Entity[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [entityId, setEntityId] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date())
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  const [description, setDescription] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [billingAddress, setBillingAddress] = useState("")
  const [memo, setMemo] = useState("")
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { id: "1", description: "", accountId: "", accountName: "", amount: 0, quantity: 1, unitPrice: 0, taxAmount: 0 }
  ])

  // Departments mock data
  const departments = [
    { id: 'd1', name: 'Operations' },
    { id: 'd2', name: 'Engineering' },
    { id: 'd3', name: 'HR' },
    { id: 'd4', name: 'Marketing' },
    { id: 'd5', name: 'Finance' },
  ]

  // Load reference data
  useEffect(() => {
    if (open) {
      setLoading(true)
      Promise.all([
        getEntities(),
        getCustomers(),
        getAccounts(),
      ]).then(([entitiesData, customersData, accountsData]) => {
        setEntities(entitiesData)
        setCustomers(customersData.data)
        setAccounts(accountsData.filter(a => a.type === 'revenue' && a.status === 'active'))
        setLoading(false)
      })
    }
  }, [open])

  // Update customer name and billing address when customer changes
  useEffect(() => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setCustomerName(customer.name)
      setBillingAddress(customer.billingAddress || customer.address || '')
    }
  }, [customerId, customers])

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const total = subtotal

  // Add line item
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: String(lineItems.length + 1), description: "", accountId: "", accountName: "", amount: 0, quantity: 1, unitPrice: 0, taxAmount: 0, departmentId: departmentId }
    ])
  }

  // Remove line item
  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  // Update line item
  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    
    // Auto-calculate amount from quantity * unitPrice
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].amount = updated[index].quantity * updated[index].unitPrice
    }
    
    // Update account name when account changes
    if (field === 'accountId') {
      const account = accounts.find(a => a.id === value)
      if (account) {
        updated[index].accountName = account.name
      }
    }
    
    setLineItems(updated)
  }

  // Reset form
  const resetForm = useCallback(() => {
    setEntityId("")
    setCustomerId("")
    setCustomerName("")
    setInvoiceDate(new Date())
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    setDescription("")
    setDepartmentId("")
    setBillingAddress("")
    setMemo("")
    setLineItems([
      { id: "1", description: "", accountId: "", accountName: "", amount: 0, quantity: 1, unitPrice: 0, taxAmount: 0 }
    ])
  }, [])

  // Handle save
  const handleSave = async (action: 'draft' | 'send') => {
    if (!entityId || !customerId || lineItems.every(l => l.amount === 0)) {
      return
    }

    const selectedDepartment = departments.find(dept => dept.id === departmentId)
    setSaving(true)
    const result = await createInvoice({
      customerId,
      customerName,
      date: invoiceDate,
      dueDate,
      amount: total,
      status: action === 'send' ? 'sent' : 'draft',
      sentAt: action === 'send' ? new Date() : undefined,
      description,
      lineItems: lineItems.filter(l => l.amount > 0),
      entityId,
      departmentId: departmentId || undefined,
      departmentName: selectedDepartment?.name,
      billingAddress: billingAddress || undefined,
      memo: memo || undefined,
    })

    if (result.success) {
      resetForm()
      onSuccess()
      onClose()
    }
    setSaving(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Create Invoice</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entity</Label>
                <Select value={entityId} onValueChange={setEntityId}>
                  <SelectTrigger>
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
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
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
                <Label>Invoice Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(invoiceDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={invoiceDate}
                      onSelect={(date) => date && setInvoiceDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dueDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => date && setDueDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Billing Address</Label>
                <Input
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Customer billing address"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Invoice description or notes"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Memo (Internal)</Label>
                <Textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Internal memo"
                  rows={2}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Line
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[200px]">Description</TableHead>
                      <TableHead className="w-[180px]">Revenue Account</TableHead>
                      <TableHead className="w-[80px] text-right">Qty</TableHead>
                      <TableHead className="w-[100px] text-right">Unit Price</TableHead>
                      <TableHead className="w-[100px] text-right">Amount</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="p-1">
                          <Input
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Select
                            value={item.accountId}
                            onValueChange={(value) => updateLineItem(index, 'accountId', value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map(account => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.number} - {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="h-8 text-right"
                            min={0}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="h-8 text-right"
                            min={0}
                            step={0.01}
                          />
                        </TableCell>
                        <TableCell className="p-1 text-right font-medium">
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell className="p-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                            disabled={lineItems.length === 1}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={saving}>
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSave('draft')} 
                disabled={saving || !entityId || !customerId}
              >
                Save as Draft
              </Button>
              <Button 
                onClick={() => handleSave('send')} 
                disabled={saving || !entityId || !customerId}
              >
                {saving ? "Saving..." : "Create & Send"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
