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
  const [departmentId, setDepartmentId] = useState("")
  const [locationId, setLocationId] = useState("")
  const [terms, setTerms] = useState("Net 30")
  const [currency, setCurrency] = useState("USD")
  const [billDate, setBillDate] = useState<Date>(new Date())
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  const [description, setDescription] = useState("")
  const [lineItems, setLineItems] = useState<Partial<BillLineItem>[]>([
    { id: '1', description: '', accountId: '', accountName: '', quantity: 1, unitPrice: 0, amount: 0, taxAmount: 0, departmentId: '', departmentName: '' }
  ])
  
  // Departments and locations for dropdowns
  const departments = [
    { id: 'd1', name: 'Operations' },
    { id: 'd2', name: 'Engineering' },
    { id: 'd3', name: 'HR' },
    { id: 'd4', name: 'Marketing' },
    { id: 'd5', name: 'Finance' },
  ]
  
  const locations = [
    { id: 'l1', name: 'San Francisco HQ' },
    { id: 'l2', name: 'New York Office' },
    { id: 'l3', name: 'Chicago Branch' },
    { id: 'l4', name: 'Remote' },
  ]
  
  const termsOptions = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt']
  const currencies = ['USD', 'EUR', 'GBP', 'CAD']
  
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
        amount: 0,
        taxAmount: 0,
        departmentId: departmentId,
        departmentName: departments.find(d => d.id === departmentId)?.name || '',
        locationId: locationId,
        locationName: locations.find(l => l.id === locationId)?.name || '',
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
    setDepartmentId("")
    setLocationId("")
    setTerms("Net 30")
    setCurrency("USD")
    setBillDate(new Date())
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    setDescription("")
    setLineItems([
      { id: '1', description: '', accountId: '', accountName: '', quantity: 1, unitPrice: 0, amount: 0, taxAmount: 0, departmentId: '', departmentName: '' }
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
            
            {/* Department, Location, Terms, Currency */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select dept" />
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
                <Label htmlFor="location">Location</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="terms">Terms</Label>
                <Select value={terms} onValueChange={setTerms}>
                  <SelectTrigger id="terms">
                    <SelectValue placeholder="Select terms" />
                  </SelectTrigger>
                  <SelectContent>
                    {termsOptions.map(term => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(curr => (
                      <SelectItem key={curr} value={curr}>
                        {curr}
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
              
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Account</TableHead>
                      <TableHead className="min-w-[140px]">Description</TableHead>
                      <TableHead className="min-w-[100px]">Department</TableHead>
                      <TableHead className="w-[70px] text-right">Qty</TableHead>
                      <TableHead className="w-[90px] text-right">Unit Price</TableHead>
                      <TableHead className="w-[80px] text-right">Tax</TableHead>
                      <TableHead className="w-[100px] text-right">Amount</TableHead>
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
                          <Select 
                            value={item.departmentId || ''} 
                            onValueChange={(value) => {
                              updateLineItem(index, 'departmentId', value)
                              const dept = departments.find(d => d.id === value)
                              if (dept) {
                                updateLineItem(index, 'departmentName', dept.name)
                              }
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Dept" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map(dept => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 text-right"
                            min={0}
                            step={0.01}
                            placeholder="0.00"
                            value={item.taxAmount || ''}
                            onChange={(e) => updateLineItem(index, 'taxAmount', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency((item.amount || 0) + (item.taxAmount || 0))}
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
                      <TableCell colSpan={5} className="text-right font-medium">
                        Subtotal
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(lineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0))}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(totalAmount + lineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0))}
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
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleSubmit} disabled={!isValid || saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save as Draft
              </Button>
              <Button onClick={() => { /* Save and submit for approval */ handleSubmit() }} disabled={!isValid || saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit for Approval
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
