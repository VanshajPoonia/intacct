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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import type { Account } from "@/lib/types"

interface AccountModalProps {
  account: Account | null
  open: boolean
  mode: 'create' | 'edit' | 'view'
  onClose: () => void
  onSave: (data: Partial<Account>) => Promise<void>
}

const typeColors: Record<string, string> = {
  asset: "bg-blue-100 text-blue-800",
  liability: "bg-purple-100 text-purple-800",
  equity: "bg-green-100 text-green-800",
  revenue: "bg-emerald-100 text-emerald-800",
  expense: "bg-orange-100 text-orange-800",
}

const categoryOptions: Record<string, string[]> = {
  asset: ['Current Assets', 'Fixed Assets', 'Other Assets', 'Bank', 'Accounts Receivable'],
  liability: ['Current Liabilities', 'Long-term Liabilities', 'Accounts Payable'],
  equity: ['Retained Earnings', 'Capital Stock', 'Other Equity'],
  revenue: ['Operating Revenue', 'Other Revenue', 'Interest Income'],
  expense: ['Cost of Goods Sold', 'Operating Expenses', 'Payroll', 'Travel', 'Utilities'],
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export function AccountModal({
  account,
  open,
  mode,
  onClose,
  onSave,
}: AccountModalProps) {
  const [number, setNumber] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState<string>("expense")
  const [category, setCategory] = useState("")
  const [subCategory, setSubCategory] = useState("")
  const [saving, setSaving] = useState(false)

  // Populate form when editing/viewing
  useEffect(() => {
    if (account && (mode === 'edit' || mode === 'view')) {
      setNumber(account.number)
      setName(account.name)
      setType(account.type)
      setCategory(account.category)
      setSubCategory(account.subCategory || '')
    } else if (mode === 'create') {
      setNumber("")
      setName("")
      setType("expense")
      setCategory("")
      setSubCategory("")
    }
  }, [account, mode, open])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        id: account?.id,
        number,
        name,
        type: type as Account['type'],
        category,
        subCategory: subCategory || undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  const isReadOnly = mode === 'view'
  const title = mode === 'create' ? 'Create Account' : mode === 'edit' ? 'Edit Account' : 'Account Details'

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* View Mode Header */}
          {mode === 'view' && account && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-2xl font-semibold">{account.number}</p>
                <p className="text-sm text-muted-foreground">{account.name}</p>
              </div>
              <Badge variant="secondary" className={typeColors[account.type]}>
                {account.type}
              </Badge>
            </div>
          )}

          {mode === 'view' && account && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">{account.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                    {account.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <p className="font-medium">{account.currency}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="font-medium font-mono">{formatCurrency(account.balance)}</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Form Fields */}
          {!isReadOnly && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Account Number</Label>
                  <Input
                    id="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="e.g., 1000"
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Account Type</Label>
                  <Select value={type} onValueChange={setType} disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asset">Asset</SelectItem>
                      <SelectItem value="liability">Liability</SelectItem>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Cash and Cash Equivalents"
                  disabled={isReadOnly}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory} disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(categoryOptions[type] || []).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subCategory">Sub-category (optional)</Label>
                  <Input
                    id="subCategory"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="Optional"
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isReadOnly && (
            <Button onClick={handleSave} disabled={saving || !number || !name || !category}>
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {mode === 'create' ? 'Create Account' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
