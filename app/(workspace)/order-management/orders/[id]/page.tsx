"use client"

import { useState, useEffect, use, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/finance/page-header"
import { StatusBadge } from "@/components/finance/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  CheckCircle, 
  Truck, 
  Receipt, 
  Printer,
  Building2,
  Calendar,
  User
} from "lucide-react"
import { 
  getSalesOrderById, 
  confirmSalesOrder, 
  shipSalesOrder,
  invoiceSalesOrder
} from "@/lib/services"
import type { SalesOrder } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function SalesOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [so, setSO] = useState<SalesOrder | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const result = await getSalesOrderById(id)
    setSO(result)
    setLoading(false)
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleConfirm = async () => {
    await confirmSalesOrder(id)
    loadData()
  }

  const handleShip = async () => {
    await shipSalesOrder(id)
    loadData()
  }

  const handleInvoice = async () => {
    await invoiceSalesOrder(id)
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

  if (!so) {
    return (
      <AppShell>
        <div className="flex-1 p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Sales order not found</p>
              <Button asChild className="mt-4">
                <Link href="/order-management">Back to Order Management</Link>
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
          title={so.number}
          description={`Sales order for ${so.customerName}`}
          breadcrumbs={[
            { label: "Order Management", href: "/order-management" },
            { label: so.number },
          ]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              {(so.status === 'draft' || so.status === 'approved') && (
                <Button size="sm" onClick={handleConfirm}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Order
                </Button>
              )}
              {so.status === 'confirmed' && (
                <Button size="sm" onClick={handleShip}>
                  <Truck className="h-4 w-4 mr-2" />
                  Mark Shipped
                </Button>
              )}
              {so.status === 'shipped' && (
                <Button size="sm" onClick={handleInvoice}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Create Invoice
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
                <StatusBadge status={so.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <Link href={`/accounts-receivable/customers/${so.customerId}`} className="font-medium hover:underline">
                      {so.customerName}
                    </Link>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-medium">{formatDate(so.orderDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Requested Date</p>
                    <p className="font-medium">{so.requestedDate ? formatDate(so.requestedDate) : 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created By</p>
                    <p className="font-medium">{so.createdBy}</p>
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
                      <TableHead className="text-right">Shipped</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {so.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.description}</TableCell>
                        <TableCell className="text-right">{line.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(line.amount)}</TableCell>
                        <TableCell className="text-right">
                          {line.shippedQuantity} / {line.quantity}
                        </TableCell>
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
                <span>{formatCurrency(so.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(so.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>{formatCurrency(so.total)}</span>
              </div>

              {so.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{so.notes}</p>
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
