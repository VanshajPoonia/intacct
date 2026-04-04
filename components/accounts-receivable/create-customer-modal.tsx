"use client"

import { useState, useEffect } from "react"
import { X, Building2 } from "lucide-react"
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
import type { Customer } from "@/lib/types"
import { toast } from "sonner"

interface CreateCustomerModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  customer?: Customer | null // For edit mode
}

const paymentTermsOptions = [
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
  'Due on Receipt',
]

const currencyOptions = ['USD', 'EUR', 'GBP', 'CAD']
const statusOptions = ['active', 'inactive', 'pending', 'hold']

export function CreateCustomerModal({ open, onClose, onSuccess, customer }: CreateCustomerModalProps) {
  const isEditing = !!customer
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [billingAddress, setBillingAddress] = useState("")
  const [creditLimit, setCreditLimit] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("Net 30")
  const [currency, setCurrency] = useState("USD")
  const [status, setStatus] = useState("active")

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (customer) {
        setName(customer.name)
        setCode(customer.code)
        setEmail(customer.email)
        setPhone(customer.phone || "")
        setAddress(customer.address || "")
        setBillingAddress(customer.billingAddress || "")
        setCreditLimit(customer.creditLimit.toString())
        setPaymentTerms(customer.paymentTerms)
        setCurrency(customer.currency)
        setStatus(customer.status)
      } else {
        setName("")
        setCode("")
        setEmail("")
        setPhone("")
        setAddress("")
        setBillingAddress("")
        setCreditLimit("")
        setPaymentTerms("Net 30")
        setCurrency("USD")
        setStatus("active")
      }
    }
  }, [open, customer])

  // Auto-generate code from name
  useEffect(() => {
    if (!isEditing && name && !code) {
      const initials = name.split(' ').map(w => w[0]?.toUpperCase()).join('').slice(0, 3)
      const num = Math.floor(Math.random() * 900) + 100
      setCode(`${initials}${num}`)
    }
  }, [name, code, isEditing])

  const handleClose = () => {
    onClose()
  }

  const isValid = name.trim() !== '' && email.trim() !== '' && creditLimit !== ''

  const handleSubmit = async () => {
    if (!isValid) return
    
    setSaving(true)
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast.success(isEditing ? 'Customer updated successfully' : 'Customer created successfully')
      onSuccess?.()
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isEditing ? 'Edit Customer' : 'Create Customer'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Customer Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Auto-generated"
                  disabled={isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="billing@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, city, state, zip"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingAddress">Billing Address (if different)</Label>
              <Textarea
                id="billingAddress"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="Billing address"
                rows={2}
              />
            </div>
          </div>

          {/* Account Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Account Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit *</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTermsOptions.map((term) => (
                      <SelectItem key={term} value={term}>{term}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((curr) => (
                      <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || saving}>
              {saving ? 'Saving...' : isEditing ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
