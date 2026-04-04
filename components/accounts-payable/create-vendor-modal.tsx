"use client"

import { useState, useEffect } from "react"
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
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import type { Vendor } from "@/lib/types"
import { toast } from "sonner"

interface CreateVendorModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  vendor?: Vendor | null // If provided, we're editing
}

const paymentTermsOptions = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt']
const currencies = ['USD', 'EUR', 'GBP', 'CAD']
const paymentMethods = [
  { value: 'check', label: 'Check' },
  { value: 'ach', label: 'ACH Transfer' },
  { value: 'wire', label: 'Wire Transfer' },
]

export function CreateVendorModal({ open, onClose, onSuccess, vendor }: CreateVendorModalProps) {
  const [saving, setSaving] = useState(false)
  const isEditing = !!vendor

  // Form state
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [taxId, setTaxId] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("Net 30")
  const [currency, setCurrency] = useState("USD")
  const [status, setStatus] = useState<'active' | 'inactive' | 'pending'>('active')
  
  // Remittance info
  const [bankName, setBankName] = useState("")
  const [bankAccountNumber, setBankAccountNumber] = useState("")
  const [bankRoutingNumber, setBankRoutingNumber] = useState("")
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<'check' | 'ach' | 'wire'>('check')
  const [remittanceEmail, setRemittanceEmail] = useState("")

  // Load vendor data when editing
  useEffect(() => {
    if (vendor && open) {
      setName(vendor.name)
      setCode(vendor.code)
      setEmail(vendor.email)
      setPhone(vendor.phone || "")
      setAddress(vendor.address || "")
      setTaxId(vendor.taxId || "")
      setPaymentTerms(vendor.paymentTerms)
      setCurrency(vendor.currency)
      setStatus(vendor.status)
      setBankName(vendor.bankName || "")
      setBankAccountNumber(vendor.bankAccountNumber || "")
      setBankRoutingNumber(vendor.bankRoutingNumber || "")
      setPreferredPaymentMethod(vendor.preferredPaymentMethod || 'check')
      setRemittanceEmail(vendor.remittanceEmail || "")
    }
  }, [vendor, open])

  const isValid = name && code && email

  const handleSubmit = async () => {
    if (!isValid) return
    
    setSaving(true)
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast.success(isEditing ? 'Vendor updated successfully' : 'Vendor created successfully')
      onSuccess?.()
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    // Reset form
    setName("")
    setCode("")
    setEmail("")
    setPhone("")
    setAddress("")
    setTaxId("")
    setPaymentTerms("Net 30")
    setCurrency("USD")
    setStatus('active')
    setBankName("")
    setBankAccountNumber("")
    setBankRoutingNumber("")
    setPreferredPaymentMethod('check')
    setRemittanceEmail("")
    onClose()
  }

  // Auto-generate code from name
  const generateCode = () => {
    if (name && !code) {
      const words = name.split(' ')
      const initials = words.map(w => w[0]?.toUpperCase()).join('')
      const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      setCode(`${initials}${num}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Vendor' : 'Create New Vendor'}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Basic Information</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vendor Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter vendor name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={generateCode}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="code">Vendor Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., VND001"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vendor@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="(555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Street address, City, State ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    placeholder="XX-XXXXXXX"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Payment Information</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                    <SelectTrigger id="paymentTerms">
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTermsOptions.map(term => (
                        <SelectItem key={term} value={term}>{term}</SelectItem>
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
                        <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Remittance Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Remittance Information</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="e.g., Chase Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preferredPaymentMethod">Preferred Payment Method</Label>
                  <Select 
                    value={preferredPaymentMethod} 
                    onValueChange={(v) => setPreferredPaymentMethod(v as typeof preferredPaymentMethod)}
                  >
                    <SelectTrigger id="preferredPaymentMethod">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => (
                        <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">Account Number</Label>
                  <Input
                    id="bankAccountNumber"
                    placeholder="****1234"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bankRoutingNumber">Routing Number</Label>
                  <Input
                    id="bankRoutingNumber"
                    placeholder="****5678"
                    value={bankRoutingNumber}
                    onChange={(e) => setBankRoutingNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remittanceEmail">Remittance Email</Label>
                <Input
                  id="remittanceEmail"
                  type="email"
                  placeholder="remittance@vendor.com"
                  value={remittanceEmail}
                  onChange={(e) => setRemittanceEmail(e.target.value)}
                />
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
            {isEditing ? 'Update Vendor' : 'Create Vendor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
