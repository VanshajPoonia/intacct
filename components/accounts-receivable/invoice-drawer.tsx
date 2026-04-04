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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Download,
  Send,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban
} from "lucide-react"
import type { Invoice } from "@/lib/types"

interface InvoiceDrawerProps {
  invoice: Invoice | null
  open: boolean
  onClose: () => void
  onUpdate?: () => void
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string; icon: React.ReactNode }> = {
    draft: { className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Draft', icon: <FileText className="h-3 w-3" /> },
    sent: { className: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Sent', icon: <Send className="h-3 w-3" /> },
    partial: { className: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Partial', icon: <Clock className="h-3 w-3" /> },
    paid: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Paid', icon: <CheckCircle className="h-3 w-3" /> },
    overdue: { className: 'bg-red-100 text-red-700 border-red-200', label: 'Overdue', icon: <AlertCircle className="h-3 w-3" /> },
    void: { className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Void', icon: <Ban className="h-3 w-3" /> },
  }
  
  const variant = variants[status] || { className: 'bg-gray-100 text-gray-700', label: status, icon: null }
  
  return (
    <Badge variant="outline" className={`text-xs font-medium gap-1 ${variant.className}`}>
      {variant.icon}
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

export function InvoiceDrawer({ invoice, open, onClose, onUpdate }: InvoiceDrawerProps) {
  if (!invoice) return null

  const isOverdue = invoice.status !== 'paid' && invoice.status !== 'void' && new Date(invoice.dueDate) < new Date()
  const amountDue = invoice.amount - (invoice.amountPaid || 0)
  const daysOverdue = isOverdue ? Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Invoice Details</SheetTitle>
            <StatusBadge status={isOverdue && invoice.status !== 'paid' ? 'overdue' : invoice.status} />
          </div>
          <SheetDescription className="text-left font-mono">
            {invoice.number}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="lines">Line Items</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            {/* Amount Section */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-xl font-semibold tabular-nums">{formatCurrency(invoice.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Amount Paid</p>
                  <p className="text-xl font-semibold tabular-nums text-emerald-600">
                    {formatCurrency(invoice.amountPaid || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Amount Due</p>
                  <p className={`text-xl font-semibold tabular-nums ${amountDue > 0 && isOverdue ? 'text-red-600' : ''}`}>
                    {formatCurrency(amountDue)}
                  </p>
                </div>
              </div>
              {isOverdue && amountDue > 0 && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-center">
                  <p className="text-xs text-red-700 font-medium">
                    {daysOverdue} days overdue
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Customer & Dates */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium mb-3">Invoice Information</h3>
              
              <DetailRow
                icon={Building2}
                label="Customer"
                value={invoice.customerName}
              />
              
              <DetailRow
                icon={Calendar}
                label="Invoice Date"
                value={format(invoice.date, 'MMMM d, yyyy')}
              />
              
              <DetailRow
                icon={Calendar}
                label="Due Date"
                value={
                  <span className={isOverdue && amountDue > 0 ? 'text-red-600' : ''}>
                    {format(invoice.dueDate, 'MMMM d, yyyy')}
                  </span>
                }
              />

              {invoice.terms && (
                <DetailRow
                  icon={FileText}
                  label="Payment Terms"
                  value={invoice.terms}
                />
              )}
              
              <DetailRow
                icon={Hash}
                label="Entity"
                value={invoice.entityId === 'e1' ? 'Acme Corporation' : 
                       invoice.entityId === 'e2' ? 'Acme West' : 
                       invoice.entityId === 'e3' ? 'Acme Europe' : 'Unknown'}
              />
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium mb-3">Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {invoice.status === 'draft' && (
                  <Button variant="default" size="sm" className="justify-start">
                    <Send className="h-4 w-4 mr-2" />
                    Send Invoice
                  </Button>
                )}
                {amountDue > 0 && invoice.status !== 'void' && (
                  <Button variant="outline" size="sm" className="justify-start">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                )}
                <Button variant="outline" size="sm" className="justify-start">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in AR
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lines" className="mt-4">
            <div className="space-y-3">
              {invoice.lines && invoice.lines.length > 0 ? (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2 font-medium">Description</th>
                          <th className="text-right p-2 font-medium">Qty</th>
                          <th className="text-right p-2 font-medium">Rate</th>
                          <th className="text-right p-2 font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.lines.map((line, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{line.description}</td>
                            <td className="p-2 text-right tabular-nums">{line.quantity}</td>
                            <td className="p-2 text-right tabular-nums">{formatCurrency(line.rate)}</td>
                            <td className="p-2 text-right tabular-nums font-medium">{formatCurrency(line.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t bg-muted/50">
                        <tr>
                          <td colSpan={3} className="p-2 text-right font-medium">Total</td>
                          <td className="p-2 text-right tabular-nums font-semibold">{formatCurrency(invoice.amount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No line items</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <div className="space-y-3">
              {invoice.payments && invoice.payments.length > 0 ? (
                <div className="space-y-2">
                  {invoice.payments.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{payment.method}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(payment.date, 'MMM d, yyyy')} - {payment.reference}
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-emerald-600">
                        +{formatCurrency(payment.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No payments recorded</p>
                  {amountDue > 0 && (
                    <Button variant="outline" size="sm" className="mt-3">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Record Payment
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
