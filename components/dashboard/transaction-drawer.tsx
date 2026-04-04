"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { 
  Calendar, 
  FileText, 
  Building2, 
  User, 
  Hash,
  DollarSign,
  ExternalLink,
  Printer,
  Download
} from "lucide-react"
import type { Transaction } from "@/lib/types"

interface TransactionDrawerProps {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    posted: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Posted' },
    pending: { className: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Pending' },
    voided: { className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Voided' },
  }
  
  const variant = variants[status] || { className: 'bg-gray-100 text-gray-700', label: status }
  
  return (
    <Badge variant="outline" className={`text-xs font-medium ${variant.className}`}>
      {variant.label}
    </Badge>
  )
}

function DetailRow({ 
  icon: Icon, 
  label, 
  value, 
  valueClassName 
}: { 
  icon: React.ElementType
  label: string
  value: string | React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="p-1.5 bg-muted rounded">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${valueClassName || ''}`}>{value}</p>
      </div>
    </div>
  )
}

export function TransactionDrawer({ transaction, open, onClose }: TransactionDrawerProps) {
  if (!transaction) return null

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Transaction Details</SheetTitle>
            <StatusBadge status={transaction.status} />
          </div>
          <SheetDescription className="text-left">
            {transaction.reference || transaction.id}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Amount Section */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              {transaction.type === 'credit' ? 'Credit' : 'Debit'} Amount
            </p>
            <p className={`text-3xl font-semibold tabular-nums ${transaction.type === 'credit' ? 'text-emerald-600' : 'text-foreground'}`}>
              {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </p>
          </div>

          <Separator />

          {/* Details Section */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium mb-3">Transaction Information</h3>
            
            <DetailRow
              icon={FileText}
              label="Description"
              value={transaction.description}
            />
            
            <DetailRow
              icon={Calendar}
              label="Transaction Date"
              value={format(transaction.date, 'MMMM d, yyyy')}
            />
            
            <DetailRow
              icon={Hash}
              label="Account"
              value={transaction.accountName}
            />
            
            {transaction.reference && (
              <DetailRow
                icon={FileText}
                label="Reference"
                value={transaction.reference}
              />
            )}
            
            <DetailRow
              icon={Building2}
              label="Entity"
              value={transaction.entityId === 'e1' ? 'Acme Corporation' : 
                     transaction.entityId === 'e2' ? 'Acme West' : 
                     transaction.entityId === 'e3' ? 'Acme Europe' : 'Unknown'}
            />
            
            <DetailRow
              icon={User}
              label="Created By"
              value={
                <div>
                  <span>{transaction.createdBy === 'u1' ? 'Sarah Chen' : transaction.createdBy}</span>
                  <span className="text-xs text-muted-foreground block">
                    {format(transaction.createdAt, 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              }
            />
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium mb-3">Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start">
                <ExternalLink className="h-4 w-4 mr-2" />
                View in GL
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Audit Trail
              </Button>
            </div>
          </div>

          {/* Related Documents */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium mb-3">Related Documents</h3>
            <div className="border rounded-lg p-3 text-center text-sm text-muted-foreground">
              No related documents found
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
