"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CalendarIcon, 
  Plus, 
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Account, JournalEntryLine, Entity } from "@/lib/types"
import { getAccounts, getEntities, saveJournalEntry } from "@/lib/services"

interface CreateJournalEntryModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  entityId?: string
}

interface LineItem {
  id: string
  accountId: string
  accountNumber: string
  accountName: string
  description: string
  debit: number
  credit: number
  departmentId?: string
  locationId?: string
  projectId?: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export function CreateJournalEntryModal({
  open,
  onClose,
  onSuccess,
  entityId: initialEntityId,
}: CreateJournalEntryModalProps) {
  // Form state
  const [date, setDate] = useState<Date>(new Date())
  const [reference, setReference] = useState("")
  const [description, setDescription] = useState("")
  const [entityId, setEntityId] = useState(initialEntityId || 'e1')
  const [lines, setLines] = useState<LineItem[]>([
    { id: '1', accountId: '', accountNumber: '', accountName: '', description: '', debit: 0, credit: 0 },
    { id: '2', accountId: '', accountNumber: '', accountName: '', description: '', debit: 0, credit: 0 },
  ])
  
  // Data state
  const [accounts, setAccounts] = useState<Account[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load accounts and entities
  useEffect(() => {
    if (open) {
      setLoading(true)
      Promise.all([
        getAccounts(),
        getEntities(),
      ]).then(([accountsData, entitiesData]) => {
        setAccounts(accountsData)
        setEntities(entitiesData)
        setLoading(false)
      })
    }
  }, [open])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setDate(new Date())
      setReference("")
      setDescription("")
      setEntityId(initialEntityId || 'e1')
      setLines([
        { id: '1', accountId: '', accountNumber: '', accountName: '', description: '', debit: 0, credit: 0 },
        { id: '2', accountId: '', accountNumber: '', accountName: '', description: '', debit: 0, credit: 0 },
      ])
      setError(null)
    }
  }, [open, initialEntityId])

  // Calculate totals
  const totals = lines.reduce(
    (acc, line) => ({
      debit: acc.debit + (line.debit || 0),
      credit: acc.credit + (line.credit || 0),
    }),
    { debit: 0, credit: 0 }
  )

  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01
  const hasLines = lines.some(line => line.accountId && (line.debit > 0 || line.credit > 0))

  // Add line
  const addLine = () => {
    setLines(prev => [
      ...prev,
      { id: String(Date.now()), accountId: '', accountNumber: '', accountName: '', description: '', debit: 0, credit: 0 }
    ])
  }

  // Remove line
  const removeLine = (id: string) => {
    if (lines.length <= 2) return
    setLines(prev => prev.filter(line => line.id !== id))
  }

  // Update line
  const updateLine = (id: string, field: keyof LineItem, value: string | number) => {
    setLines(prev => prev.map(line => {
      if (line.id !== id) return line
      
      if (field === 'accountId') {
        const account = accounts.find(a => a.id === value)
        return {
          ...line,
          accountId: value as string,
          accountNumber: account?.number || '',
          accountName: account?.name || '',
        }
      }
      
      // If setting debit, clear credit and vice versa
      if (field === 'debit' && value) {
        return { ...line, debit: Number(value), credit: 0 }
      }
      if (field === 'credit' && value) {
        return { ...line, credit: Number(value), debit: 0 }
      }
      
      return { ...line, [field]: value }
    }))
  }

  // Handle save
  const handleSave = async (post: boolean = false) => {
    setError(null)
    
    // Validation
    if (!description.trim()) {
      setError('Description is required')
      return
    }
    
    if (!hasLines) {
      setError('At least one line with an account and amount is required')
      return
    }
    
    if (!isBalanced) {
      setError('Entry must be balanced (debits must equal credits)')
      return
    }

    setSaving(true)
    
    try {
      const entryLines: JournalEntryLine[] = lines
        .filter(line => line.accountId && (line.debit > 0 || line.credit > 0))
        .map(line => ({
          id: line.id,
          accountId: line.accountId,
          accountNumber: line.accountNumber,
          accountName: line.accountName,
          debit: line.debit,
          credit: line.credit,
          description: line.description,
        }))

      const result = await saveJournalEntry({
        date,
        description,
        entityId,
        lines: entryLines,
      })

      if (result.success) {
        toast.success('Journal entry saved as draft')
        onSuccess()
      } else {
        setError('Failed to save journal entry')
      }
    } catch (err) {
      setError('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Create Journal Entry</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-6">
            {/* Header Fields */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Entry Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entity">Entity</Label>
                <Select value={entityId} onValueChange={setEntityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.filter(e => e.type !== 'consolidated').map(entity => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Reference #</Label>
                <Input
                  id="reference"
                  placeholder="Optional reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted text-muted-foreground text-sm">
                  Draft
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter journal entry description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Journal Lines</Label>
                <Button variant="outline" size="sm" onClick={addLine}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Line
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[140px] text-right">Debit</TableHead>
                      <TableHead className="w-[140px] text-right">Credit</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell className="p-2">
                          <Select 
                            value={line.accountId} 
                            onValueChange={(v) => updateLine(line.id, 'accountId', v)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.filter(a => a.status === 'active').map(account => (
                                <SelectItem key={account.id} value={account.id}>
                                  <span className="font-mono text-xs mr-2">{account.number}</span>
                                  {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            value={line.description}
                            onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                            placeholder="Line description"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.debit || ''}
                            onChange={(e) => updateLine(line.id, 'debit', e.target.value)}
                            placeholder="0.00"
                            className="h-9 text-right font-mono"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.credit || ''}
                            onChange={(e) => updateLine(line.id, 'credit', e.target.value)}
                            placeholder="0.00"
                            className="h-9 text-right font-mono"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={lines.length <= 2}
                            onClick={() => removeLine(line.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="font-medium">
                        Total
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(totals.debit)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(totals.credit)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>

              {/* Balance Indicator */}
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-lg text-sm",
                isBalanced && hasLines ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
              )}>
                {isBalanced && hasLines ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Entry is balanced</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      {!hasLines 
                        ? "Add at least one line with an account and amount" 
                        : `Entry is out of balance by ${formatCurrency(Math.abs(totals.debit - totals.credit))}`
                      }
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleSave(false)} 
            disabled={saving || !isBalanced || !hasLines || !description.trim()}
          >
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Save as Draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
