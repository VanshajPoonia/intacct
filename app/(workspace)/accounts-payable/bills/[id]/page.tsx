"use client"

import { use, useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, Calendar, Check, CreditCard, Download, Edit, FileText, MoreHorizontal, Paperclip, Plus, Receipt, Send, Trash2, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { mockBills, mockVendors, mockPayments } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/services"

export default function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [comment, setComment] = useState("")

  const bill = useMemo(() => mockBills.find(b => b.id === id) || mockBills[0], [id])
  const vendor = useMemo(() => mockVendors.find(v => v.id === bill.vendorId) || mockVendors[0], [bill.vendorId])
  const relatedPayments = useMemo(() => mockPayments.filter(p => p.billId === bill.id), [bill.id])

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  }

  const timeline = [
    { id: 1, type: "created", user: "Sarah Chen", date: bill.createdAt, description: "Bill created" },
    { id: 2, type: "submitted", user: "Sarah Chen", date: bill.createdAt, description: "Submitted for approval" },
    ...(bill.status !== "draft" && bill.status !== "pending"
      ? [{ id: 3, type: "approved", user: "Mike Wilson", date: bill.dueDate, description: "Approved by manager" }]
      : []),
    ...(bill.status === "paid"
      ? [{ id: 4, type: "paid", user: "System", date: bill.dueDate, description: `Payment processed - ${formatCurrency(bill.amount)}` }]
      : []),
  ]

  const lineItems = [
    { id: 1, description: "Professional Services - Q4", account: "6000 - Professional Fees", department: "Engineering", amount: bill.amount * 0.6 },
    { id: 2, description: "Software Licenses", account: "6100 - Software & Subscriptions", department: "Engineering", amount: bill.amount * 0.25 },
    { id: 3, description: "Consulting Fees", account: "6000 - Professional Fees", department: "Operations", amount: bill.amount * 0.15 },
  ]

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/accounts-payable/bills">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{bill.billNumber}</h1>
                <Badge className={statusColors[bill.status]}>{bill.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                <Link href={`/accounts-payable/vendors/${vendor.id}`} className="hover:underline">
                  {vendor.name}
                </Link>
                {" "}&middot; Due {formatDate(bill.dueDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {bill.status === "pending" && (
              <>
                <Button variant="outline" size="sm">
                  <Send className="mr-2 h-4 w-4" />
                  Request Info
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            {bill.status === "approved" && (
              <Button size="sm">
                <CreditCard className="mr-2 h-4 w-4" />
                Schedule Payment
              </Button>
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
                  Edit Bill
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
                  Delete Bill
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
                  <CardTitle>Bill Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Bill Amount</p>
                      <p className="text-2xl font-bold">{formatCurrency(bill.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Paid</p>
                      <p className="text-2xl font-bold">{formatCurrency(bill.status === "paid" ? bill.amount : 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Balance Due</p>
                      <p className="text-2xl font-bold">{formatCurrency(bill.status === "paid" ? 0 : bill.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Days Until Due</p>
                      <p className="text-2xl font-bold">
                        {Math.max(0, Math.ceil((new Date(bill.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
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
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
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
                            <TableHead>Account</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lineItems.map(item => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.description}</TableCell>
                              <TableCell>{item.account}</TableCell>
                              <TableCell>{item.department}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={3} className="font-semibold">Total</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(bill.amount)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="payments">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {relatedPayments.length > 0 ? (
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
                            {relatedPayments.map(payment => (
                              <TableRow key={payment.id}>
                                <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                                <TableCell className="capitalize">{payment.method}</TableCell>
                                <TableCell>{payment.referenceNumber || "-"}</TableCell>
                                <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
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

                <TabsContent value="attachments">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Attachments</CardTitle>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Upload
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        <div className="flex items-center gap-3 rounded-lg border p-3">
                          <div className="rounded bg-red-100 p-2 dark:bg-red-900/30">
                            <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">invoice_{bill.billNumber}.pdf</p>
                            <p className="text-sm text-muted-foreground">245 KB &middot; Uploaded {formatDate(bill.createdAt)}</p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
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
                                {event.type === "paid" ? (
                                  <Check className="h-4 w-4 text-green-600" />
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
              {/* Vendor Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vendor</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/accounts-payable/vendors/${vendor.id}`} className="block group">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{vendor.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium group-hover:underline">{vendor.name}</p>
                        <p className="text-sm text-muted-foreground">{vendor.email}</p>
                      </div>
                    </div>
                  </Link>
                  <Separator className="my-4" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Terms</span>
                      <span>{vendor.paymentTerms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Default Account</span>
                      <span>6000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bill Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bill Number</span>
                    <span className="font-medium">{bill.billNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bill Date</span>
                    <span>{formatDate(bill.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date</span>
                    <span>{formatDate(bill.dueDate)}</span>
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
                  <CardTitle className="text-base">Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>SC</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium">Sarah Chen</p>
                        <p className="text-sm text-muted-foreground">Please review the attached invoice for accuracy.</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(bill.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>You</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Add a comment..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="mt-2 flex justify-end">
                          <Button size="sm" disabled={!comment.trim()}>
                            Post Comment
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
