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
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  CreditCard,
  DollarSign,
  Edit,
  ExternalLink,
  User,
  Calendar,
  TrendingUp,
  AlertCircle,
  Clock,
} from "lucide-react"
import type { Customer } from "@/lib/types"

interface CustomerDrawerProps {
  customer: Customer | null
  open: boolean
  onClose: () => void
  onUpdate?: () => void
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    active: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Active' },
    inactive: { className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Inactive' },
    pending: { className: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Pending' },
    hold: { className: 'bg-red-100 text-red-700 border-red-200', label: 'On Hold' },
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

export function CustomerDrawer({ customer, open, onClose, onUpdate }: CustomerDrawerProps) {
  if (!customer) return null

  const creditUsage = customer.creditLimit > 0 
    ? Math.round((customer.balance / customer.creditLimit) * 100) 
    : 0
  const isOverCreditLimit = customer.balance > customer.creditLimit

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">{customer.name}</SheetTitle>
            <StatusBadge status={customer.status} />
          </div>
          <SheetDescription className="text-left font-mono">
            {customer.customerId || customer.code}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            {/* Contact Information */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium mb-3">Contact Information</h3>
              
              {(customer.contactEmail || customer.email) && (
                <DetailRow
                  icon={Mail}
                  label="Email"
                  value={
                    <a href={`mailto:${customer.contactEmail || customer.email}`} className="text-primary hover:underline">
                      {customer.contactEmail || customer.email}
                    </a>
                  }
                />
              )}
              
              {customer.phone && (
                <DetailRow
                  icon={Phone}
                  label="Phone"
                  value={customer.phone}
                />
              )}
              
              {customer.address && (
                <DetailRow
                  icon={MapPin}
                  label="Address"
                  value={customer.address}
                />
              )}

              {customer.contactName && (
                <DetailRow
                  icon={User}
                  label="Primary Contact"
                  value={customer.contactName}
                />
              )}
            </div>

            <Separator />

            {/* Account Information */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium mb-3">Account Settings</h3>
              
              <DetailRow
                icon={FileText}
                label="Payment Terms"
                value={customer.paymentTerms}
              />
              
              <DetailRow
                icon={DollarSign}
                label="Currency"
                value={customer.currency || 'USD'}
              />

              {customer.taxId && (
                <DetailRow
                  icon={Building2}
                  label="Tax ID"
                  value={customer.taxId}
                />
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium mb-3">Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Customer
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View Invoices
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <CreditCard className="h-4 w-4 mr-2" />
                  View Payments
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in AR
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6 mt-4">
            {/* Balance Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Outstanding Balance</p>
                  <p className={`text-2xl font-semibold tabular-nums ${customer.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {formatCurrency(customer.balance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Credit Limit</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {formatCurrency(customer.creditLimit)}
                  </p>
                </div>
              </div>
              
              {/* Credit Usage Bar */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Credit Usage</span>
                  <span className={isOverCreditLimit ? 'text-red-600 font-medium' : ''}>
                    {creditUsage}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(creditUsage, 100)} 
                  className={`h-2 ${isOverCreditLimit ? '[&>div]:bg-red-500' : ''}`}
                />
                {isOverCreditLimit && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>Over credit limit by {formatCurrency(customer.balance - customer.creditLimit)}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* YTD Stats */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Year-to-Date Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">YTD Sales</p>
                  <p className="text-lg font-semibold tabular-nums mt-1">
                    {formatCurrency(customer.ytdSales || 0)}
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">YTD Payments</p>
                  <p className="text-lg font-semibold tabular-nums mt-1 text-emerald-600">
                    {formatCurrency(customer.ytdPayments || 0)}
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Open Invoices</p>
                  <p className="text-lg font-semibold mt-1">
                    {customer.openInvoices || 0}
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Avg Days to Pay</p>
                  <p className="text-lg font-semibold mt-1">
                    {customer.avgDaysToPay || 0} days
                  </p>
                </div>
              </div>
            </div>

            {/* Aging */}
            {customer.aging && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Aging Summary</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2 font-medium">Current</th>
                          <th className="text-right p-2 font-medium">1-30</th>
                          <th className="text-right p-2 font-medium">31-60</th>
                          <th className="text-right p-2 font-medium">61-90</th>
                          <th className="text-right p-2 font-medium">90+</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-2 tabular-nums">{formatCurrency(customer.aging.current || 0)}</td>
                          <td className="p-2 text-right tabular-nums">{formatCurrency(customer.aging.days30 || 0)}</td>
                          <td className="p-2 text-right tabular-nums">{formatCurrency(customer.aging.days60 || 0)}</td>
                          <td className="p-2 text-right tabular-nums">{formatCurrency(customer.aging.days90 || 0)}</td>
                          <td className="p-2 text-right tabular-nums text-red-600">{formatCurrency(customer.aging.over90 || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="collections" className="space-y-6 mt-4">
            {/* Collection Status */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Collection Status</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Priority</p>
                  <p className="text-sm font-medium mt-1">
                    {customer.collectionPriority ? (
                      <Badge variant="outline" className={`${
                        customer.collectionPriority === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                        customer.collectionPriority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        customer.collectionPriority === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {customer.collectionPriority.charAt(0).toUpperCase() + customer.collectionPriority.slice(1)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Assigned Collector</p>
                  <p className="text-sm font-medium mt-1">
                    {customer.assignedCollector || <span className="text-muted-foreground">Unassigned</span>}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Collection Notes */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Collection Notes</h3>
              {customer.collectionNotes ? (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-sm whitespace-pre-wrap">{customer.collectionNotes}</p>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No collection notes</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Collection Actions */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium mb-3">Collection Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Log Call
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Escalate
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <div className="space-y-3">
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Recent activity will appear here</p>
                <p className="text-xs mt-1">Invoices, payments, and communications</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
