"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  CheckCircle, 
  XCircle,
  Printer, 
  Download,
  FileText,
  Clock,
  Building,
  CreditCard,
  Paperclip,
  DollarSign,
} from "lucide-react"
import type { Bill } from "@/lib/types"
import { getBillById, approveBill, voidBill } from "@/lib/services"

interface BillDrawerProps {
  billId: string | null
  open: boolean
  onClose: () => void
  onApprove?: (id: string) => void
  onPay?: (id: string) => void
  onVoid?: (id: string) => void
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  voided: "bg-red-100 text-red-800",
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export function BillDrawer({ 
  billId, 
  open, 
  onClose,
  onApprove,
  onPay,
  onVoid,
}: BillDrawerProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [loading, setLoading] = useState(false)
  const [bill, setBill] = useState<Bill | null>(null)

  useEffect(() => {
    if (open && billId) {
      setLoading(true)
      getBillById(billId).then((data) => {
        setBill(data)
        setLoading(false)
      })
    } else {
      setBill(null)
    }
  }, [open, billId])

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-lg font-semibold">
                {loading ? <Skeleton className="h-6 w-32" /> : bill?.number}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {loading ? (
                  <Skeleton className="h-4 w-48" />
                ) : (
                  bill?.vendorName
                )}
              </p>
            </div>
            {bill && (
              <Badge variant="secondary" className={statusColors[bill.status]}>
                {bill.status}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b">
            <TabsList className="h-10 w-full justify-start bg-transparent p-0 gap-6">
              <TabsTrigger 
                value="details" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0"
              >
                Details
              </TabsTrigger>
              <TabsTrigger 
                value="lines" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0"
              >
                Line Items
              </TabsTrigger>
              <TabsTrigger 
                value="payments" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0"
              >
                Payments
              </TabsTrigger>
              <TabsTrigger 
                value="attachments" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0"
              >
                Attachments
              </TabsTrigger>
              <TabsTrigger 
                value="approval" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0"
              >
                Approval
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0"
              >
                Activity
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="details" className="p-6 m-0">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              ) : bill ? (
                <div className="space-y-6">
                  {/* Header Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Bill Number</p>
                        <p className="font-medium">{bill.number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Building className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Vendor</p>
                        <p className="font-medium">{bill.vendorName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Bill Date</p>
                        <p className="font-medium">{format(new Date(bill.date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Due Date</p>
                        <p className="font-medium">{format(new Date(bill.dueDate), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="text-sm font-medium">{bill.departmentName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium">{bill.locationName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Terms</p>
                      <p className="text-sm font-medium">{bill.terms || '-'}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Description */}
                  {bill.description && (
                    <>
                      <div>
                        <p className="text-sm font-medium mb-2">Description</p>
                        <p className="text-sm text-muted-foreground">{bill.description}</p>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Amount Summary */}
                  <div>
                    <p className="text-sm font-medium mb-3">Amount Summary</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Subtotal</p>
                        <p className="text-lg font-semibold">{formatCurrency(bill.amount)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Tax</p>
                        <p className="text-lg font-semibold">{formatCurrency(0)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-xs text-muted-foreground">Total Due</p>
                        <p className="text-lg font-semibold text-primary">{formatCurrency(bill.amount)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                    <p>Created: {format(new Date(bill.createdAt), 'MMM d, yyyy h:mm a')}</p>
                    <p>Currency: {bill.currency}</p>
                  </div>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="lines" className="p-6 m-0">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : bill?.lineItems && bill.lineItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right w-[80px]">Qty</TableHead>
                      <TableHead className="text-right w-[100px]">Unit Price</TableHead>
                      <TableHead className="text-right w-[120px]">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bill.lineItems.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.description}</TableCell>
                        <TableCell className="text-muted-foreground">{line.accountName}</TableCell>
                        <TableCell className="text-right font-mono">{line.quantity}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(line.unitPrice)}</TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(line.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="font-medium">Total</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(bill.amount)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No line items</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="p-6 m-0">
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No payments recorded</p>
                {bill?.status === 'approved' && (
                  <Button variant="outline" size="sm" className="mt-3">
                    <DollarSign className="h-4 w-4 mr-1.5" />
                    Record Payment
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="attachments" className="p-6 m-0">
              <div className="text-center py-8 text-muted-foreground">
                <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No attachments</p>
                <Button variant="outline" size="sm" className="mt-3">
                  Add Attachment
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="approval" className="p-6 m-0">
              {bill && (
                <div className="space-y-6">
                  {/* Approval Status */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">Approval Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        {bill.approvalStatus === 'not_submitted' && (
                          <Badge variant="outline" className="bg-muted">Not Submitted</Badge>
                        )}
                        {bill.approvalStatus === 'pending_approval' && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending Approval</Badge>
                        )}
                        {bill.approvalStatus === 'approved' && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge>
                        )}
                        {bill.approvalStatus === 'rejected' && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Payment Status</p>
                      <div className="flex items-center gap-2 mt-1 justify-end">
                        {bill.paymentStatus === 'unpaid' && (
                          <Badge variant="outline">Unpaid</Badge>
                        )}
                        {bill.paymentStatus === 'partial' && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Partial</Badge>
                        )}
                        {bill.paymentStatus === 'paid' && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Paid</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Approval Timeline */}
                  <div>
                    <h4 className="text-sm font-medium mb-4">Approval Timeline</h4>
                    <div className="space-y-4">
                      {bill.submittedAt && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Submitted for Approval</p>
                            <p className="text-xs text-muted-foreground">
                              by {bill.submittedBy} on {format(new Date(bill.submittedAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                      )}
                      {bill.approvedAt && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Approved</p>
                            <p className="text-xs text-muted-foreground">
                              by {bill.approvedBy} on {format(new Date(bill.approvedAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                      )}
                      {bill.rejectedAt && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <XCircle className="h-4 w-4 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Rejected</p>
                            <p className="text-xs text-muted-foreground">
                              by {bill.rejectedBy} on {format(new Date(bill.rejectedAt), 'MMM d, yyyy h:mm a')}
                            </p>
                            {bill.rejectionReason && (
                              <p className="text-sm mt-1 text-red-600 bg-red-50 p-2 rounded">{bill.rejectionReason}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {!bill.submittedAt && !bill.approvedAt && !bill.rejectedAt && (
                        <p className="text-sm text-muted-foreground">No approval history yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="p-6 m-0">
              {bill && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Activity & Comments</h4>
                  
                  {/* Activity Feed */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">Bill created</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(bill.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    
                    {bill.submittedAt && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{bill.submittedBy} submitted bill for approval</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(bill.submittedAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {bill.approvedAt && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{bill.approvedBy} approved the bill</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(bill.approvedAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {bill.rejectedAt && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <XCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{bill.rejectedBy} rejected the bill</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(bill.rejectedAt), 'MMM d, yyyy h:mm a')}
                          </p>
                          {bill.rejectionReason && (
                            <p className="text-sm mt-1 italic">&quot;{bill.rejectionReason}&quot;</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Add Comment</p>
                    <div className="flex items-end gap-2">
                      <textarea
                        className="flex-1 min-h-[80px] p-3 text-sm border rounded-md resize-none"
                        placeholder="Write a comment..."
                      />
                      <Button size="sm">Post</Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-1.5" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {bill?.status === 'pending' && onApprove && (
              <Button 
                size="sm" 
                onClick={() => {
                  onApprove(bill.id)
                  onClose()
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Approve
              </Button>
            )}
            {bill?.status === 'approved' && onPay && (
              <Button 
                size="sm"
                onClick={() => {
                  onPay(bill.id)
                  onClose()
                }}
              >
                <DollarSign className="h-4 w-4 mr-1.5" />
                Pay Bill
              </Button>
            )}
            {(bill?.status === 'draft' || bill?.status === 'pending') && onVoid && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  onVoid(bill.id)
                  onClose()
                }}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Void
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
