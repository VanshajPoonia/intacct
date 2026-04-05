"use client"

import { use, useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, Calendar, Check, CreditCard, Download, Edit, FileText, Mail, MoreHorizontal, Paperclip, Plus, Receipt, Send, Trash2, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { mockInvoices, mockCustomers, mockReceipts } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/services"

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [comment, setComment] = useState("")

  const invoice = useMemo(() => mockInvoices.find(i => i.id === id) || mockInvoices[0], [id])
  const customer = useMemo(() => mockCustomers.find(c => c.id === invoice.customerId) || mockCustomers[0], [invoice.customerId])
  const relatedReceipts = useMemo(() => mockReceipts.filter(r => r.invoiceId === invoice.id), [invoice.id])

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    viewed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  }

  const paidAmount = relatedReceipts.reduce((sum, r) => sum + r.amount, 0)
  const balanceDue = invoice.amount - paidAmount

  const timeline = [
    { id: 1, type: "created", user: "Alex Johnson", date: invoice.createdAt, description: "Invoice created" },
    { id: 2, type: "sent", user: "Alex Johnson", date: invoice.createdAt, description: `Sent to ${customer.email}` },
    ...(invoice.status !== "draft"
      ? [{ id: 3, type: "viewed", user: customer.name, date: invoice.createdAt, description: "Invoice viewed by customer" }]
      : []),
    ...(paidAmount > 0
      ? [{ id: 4, type: "payment", user: "System", date: invoice.dueDate, description: `Payment received - ${formatCurrency(paidAmount)}` }]
      : []),
  ]

  const lineItems = [
    { id: 1, description: "Consulting Services - Phase 1", quantity: 40, rate: invoice.amount * 0.015, amount: invoice.amount * 0.6 },
    { id: 2, description: "Project Management", quantity: 20, rate: invoice.amount * 0.01, amount: invoice.amount * 0.2 },
    { id: 3, description: "Technical Support", quantity: 15, rate: invoice.amount * 0.0133, amount: invoice.amount * 0.2 },
  ]

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/accounts-receivable/invoices">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{invoice.invoiceNumber}</h1>
                <Badge className={statusColors[invoice.status]}>{invoice.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                <Link href={`/accounts-receivable/customers/${customer.id}`} className="hover:underline">
                  {customer.name}
                </Link>
                {" "}&middot; Due {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {invoice.status === "draft" && (
              <Button size="sm">
                <Send className="mr-2 h-4 w-4" />
                Send Invoice
              </Button>
            )}
            {(invoice.status === "sent" || invoice.status === "overdue") && (
              <>
                <Button variant="outline" size="sm">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reminder
                </Button>
                <Button size="sm">
                  <Receipt className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Invoice
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Paperclip className="mr-2 h-4 w-4" />
                  Add Attachment
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Void Invoice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Invoice Amount</p>
                      <p className="text-2xl font-bold">{formatCurrency(invoice.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Received</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Balance Due</p>
                      <p className="text-2xl font-bold">{formatCurrency(balanceDue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Days Outstanding</p>
                      <p className="text-2xl font-bold">
                        {Math.max(0, Math.ceil((Date.now() - new Date(invoice.createdAt).getTime()) / (1000 * 60 * 60 * 24)))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="lines" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="lines">Line Items</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                  <TabsTrigger value="emails">Email History</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="lines">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Line Items</CardTitle>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Line
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Rate</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lineItems.map(item => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.description}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={3} className="font-semibold">Subtotal</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                          </TableRow>
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={3} className="font-semibold">Tax (0%)</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(0)}</TableCell>
                          </TableRow>
                          <TableRow className="bg-primary/5">
                            <TableCell colSpan={3} className="font-bold">Total</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(invoice.amount)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="payments">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Payment History</CardTitle>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Record Payment
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {relatedReceipts.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Method</TableHead>
                              <TableHead>Reference</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {relatedReceipts.map(receipt => (
                              <TableRow key={receipt.id}>
                                <TableCell>{formatDate(receipt.receiptDate)}</TableCell>
                                <TableCell className="capitalize">{receipt.method}</TableCell>
                                <TableCell>{receipt.referenceNumber || "-"}</TableCell>
                                <TableCell className="text-right">{formatCurrency(receipt.amount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground">
                          <Receipt className="mx-auto h-8 w-8 mb-2 opacity-50" />
                          <p>No payments recorded yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="emails">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Email History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 rounded-lg border p-4">
                          <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">Invoice Sent</p>
                              <Badge variant="outline" className="text-green-600">Delivered</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">To: {customer.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(invoice.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Activity Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {timeline.map((event, index) => (
                          <div key={event.id} className="flex gap-3">
                            <div className="relative">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                {event.type === "payment" ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : event.type === "sent" ? (
                                  <Send className="h-4 w-4" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                              </div>
                              {index < timeline.length - 1 && (
                                <div className="absolute left-4 top-8 h-full w-px bg-border" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="font-medium">{event.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {event.user} &middot; {formatDate(event.date)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Customer</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/accounts-receivable/customers/${customer.id}`} className="block group">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{customer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium group-hover:underline">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
                  </Link>
                  <Separator className="my-4" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Terms</span>
                      <span>{customer.paymentTerms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Credit Limit</span>
                      <span>{formatCurrency(customer.creditLimit)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Number</span>
                    <span className="font-medium">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Date</span>
                    <span>{formatDate(invoice.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date</span>
                    <span>{formatDate(invoice.dueDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entity</span>
                    <span>Acme Corp</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency</span>
                    <span>USD</span>
                  </div>
                </CardContent>
              </Card>

              {/* Comments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Internal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>You</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Add an internal note..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="mt-2 flex justify-end">
                          <Button size="sm" disabled={!comment.trim()}>
                            Add Note
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
