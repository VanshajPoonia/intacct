"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/finance/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  ArrowLeft, 
  Send, 
  Check, 
  Package, 
  Printer,
  Building2,
  Calendar,
  User
} from "lucide-react"
import { 
  getPurchaseOrderById, 
  approvePurchaseOrder, 
  sendPurchaseOrder,
  receivePurchaseOrder
} from "@/lib/services"
import type { PurchaseOrder } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  sent: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  partially_received: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  received: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [po, setPO] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const result = await getPurchaseOrderById(id)
    setPO(result)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleApprove = async () => {
    await approvePurchaseOrder(id)
    loadData()
  }

  const handleSend = async () => {
    await sendPurchaseOrder(id)
    loadData()
  }

  const handleReceive = async (lineId: string, quantity: number) => {
    await receivePurchaseOrder(id, lineId, quantity)
    loadData()
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!po) {
    return (
      <AppShell>
        <div className="flex-1 p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Purchase order not found</p>
              <Button asChild className="mt-4">
                <Link href="/purchasing">Back to Purchasing</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title={po.number}
          description={`Purchase order for ${po.vendorName}`}
          breadcrumbs={[
            { label: "Purchasing", href: "/purchasing" },
            { label: po.number },
          ]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              {(po.status === 'draft' || po.status === 'pending_approval') && (
                <Button size="sm" onClick={handleApprove}>
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              )}
              {po.status === 'approved' && (
                <Button size="sm" onClick={handleSend}>
                  <Send className="h-4 w-4 mr-2" />
                  Send to Vendor
                </Button>
              )}
            </div>
          }
        />

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Details */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Details</CardTitle>
                <Badge className={statusColors[po.status]} variant="secondary">
                  {po.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor</p>
                    <p className="font-medium">{po.vendorName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-medium">{formatDate(po.orderDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Delivery</p>
                    <p className="font-medium">{po.expectedDate ? formatDate(po.expectedDate) : 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created By</p>
                    <p className="font-medium">{po.createdBy}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Line Items */}
              <div>
                <h3 className="font-medium mb-3">Line Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      {(po.status === 'sent' || po.status === 'partially_received') && (
                        <TableHead></TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {po.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.description}</TableCell>
                        <TableCell className="text-right">{line.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(line.amount)}</TableCell>
                        <TableCell className="text-right">
                          {line.receivedQuantity} / {line.quantity}
                        </TableCell>
                        {(po.status === 'sent' || po.status === 'partially_received') && (
                          <TableCell>
                            {line.receivedQuantity < line.quantity && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleReceive(line.id, line.quantity - line.receivedQuantity)}
                              >
                                Receive
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(po.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(po.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>{formatCurrency(po.total)}</span>
              </div>

              {po.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{po.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
