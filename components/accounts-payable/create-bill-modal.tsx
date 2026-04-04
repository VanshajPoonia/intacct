"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  TableFooter,
} from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  CalendarIcon, 
  Plus, 
  Trash2,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Vendor, Account, Entity, BillLineItem } from "@/lib/types"
import { 
  getVendors, 
  getAccounts, 
  getEntities,
  createBill,
} from "@/lib/services"

interface CreateBillModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export function CreateBillModal({ open, onClose, onSuccess }: CreateBillModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Reference data
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  
  // Form state
  const [vendorId, setVendorId] = useState("")
  const [entityId, setEntityId] = useState("e1")
  const [billDate, setBillDate] = useState<Date>(new Date())
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  const [description, setDescription] = useState("")
  const [lineItems, setLineItems] = useState<Partial<BillLineItem>[]>([
    { id: '1', description: '', accountId: '', accountName: '', quantity: 1, unitPrice: 0, amount: 0 }
  ])
  
  useEffect(() => {
    if (open) {
      loadReferenceData()
    }
  }, [open])
  
  const loadReferenceData = async () => {
    setLoading(true)
    try {
      const [vendorsRes, accountsRes, entitiesRes] = await Promise.all([
        getVendors(),
        getAccounts(),
        getEntities(),
      ])
      setVendors(vendorsRes.data || [])
      setAccounts(accountsRes)
      setEntities(entitiesRes)
    } finally {
      setLoading(false)
    }
  }
  
  const selectedVendor = vendors.find(v => v.id === vendorId)
  
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { 
        id: String(lineItems.length + 1), 
        description: '', 
        accountId: '', 
        accountName: '',
        quantity: 1, 
        unitPrice: 0, 
        amount: 0 
      }
    ])
  }
  
  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }
  
  const updateLineItem = (index: number, field: string, value: string | number) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    
    // Update account name when account changes
    if (field === 'accountId') {
      const account = accounts.find(a => a.id === value)
      updated[index].accountName = account?.name || ''
    }
    
    // Recalculate amount
    const qty = Number(updated[index].quantity) || 0
    const price = Number(updated[index].unitPrice) || 0
    updated[index].amount = qty * price
    
    setLineItems(updated)
  }
  
  const totalAmount = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  
  const isValid = vendorId && entityId && lineItems.some(item => 
    item.accountId && item.quantity && item.unitPrice
  )
  
  const handleSubmit = async () => {
    if (!isValid) return
    
    setSaving(true)
    try {
      const result = await createBill({
        vendorId,
        vendorName: selectedVendor?.name || '',
        date: billDate,
        dueDate,
        amount: totalAmount,
        description,
        lineItems: lineItems.filter(item => item.accountId) as BillLineItem[],
        entityId,
      })
      
      if (result.success) {
        onSuccess?.()
        handleClose()
      }
    } finally {
      setSaving(false)
    }
  }
  
  const handleClose = () => {
    // Reset form
    setVendorId("")
    setEntityId("e1")
    setBillDate(new Date())
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    setDescription("")
    setLineItems([
      { id: '1', description: '', accountId: '', accountName: '', quantity: 1, unitPrice: 0, amount: 0 }
    ])
    onClose()
  }
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Bill</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Header Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor *</Label>
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger id="vendor">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="entity">Entity *</Label>
                <Select value={entityId} onValueChange={setEntityId}>
                  <SelectTrigger id="entity">
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bill Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !billDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {billDate ? format(billDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={billDate}
                      onSelect={(date) => date && setBillDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter bill description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            
            <Separator />
            
            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Line Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Line
                </Button>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">Account</TableHead>
                      <TableHead className="w-[30%]">Description</TableHead>
                      <TableHead className="w-[12%] text-right">Qty</TableHead>
                      <TableHead className="w-[14%] text-right">Unit Price</TableHead>
                      <TableHead className="w-[14%] text-right">Amount</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Select 
                            value={item.accountId || ''} 
                            onValueChange={(value) => updateLineItem(index, 'accountId', value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.filter(a => a.type === 'expense').map(account => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.number} - {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            placeholder="Description"
                            value={item.description || ''}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 text-right"
                            min={0}
                            value={item.quantity || ''}
                            onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 text-right"
                            min={0}
                            step={0.01}
                            value={item.unitPrice || ''}
                            onChange={(e) => updateLineItem(index, 'unitPrice', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.amount || 0)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeLineItem(index)}
                            disabled={lineItems.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-medium">
                        Total
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(totalAmount)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
