"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import {
  DenseSectionHeader,
  WorkspaceBreadcrumbRow,
  WorkspaceContentContainer,
  WorkspacePageToolbar,
} from "@/components/layout/workspace-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Edit,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
  WalletCards,
} from "lucide-react"
import { getCustomerById, getInvoices, getReceipts } from "@/lib/services"
import type { Customer, Invoice, Receipt } from "@/lib/types"
import { cn } from "@/lib/utils"

const toneClasses = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const

function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value)
}

function getStatusTone(status: string) {
  switch (status) {
    case "active":
    case "paid":
    case "applied":
    case "completed":
      return "positive"
    case "pending":
    case "sent":
    case "draft":
      return "warning"
    case "overdue":
    case "inactive":
    case "voided":
      return "critical"
    default:
      return "neutral"
  }
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    setIsLoading(true)

    Promise.all([
      getCustomerById(id),
      getInvoices(undefined, undefined, undefined, { key: "dueDate", direction: "desc" }, 1, 20),
      getReceipts(undefined, undefined, undefined, undefined, { key: "date", direction: "desc" }, 1, 20),
    ])
      .then(([customerData, invoicesData, receiptsData]) => {
        setCustomer(customerData)
        setInvoices(invoicesData.data.filter(invoice => invoice.customerId === id))
        setReceipts(receiptsData.data.filter(receipt => receipt.customerId === id))
        setIsLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load customer details")
        setIsLoading(false)
      })
  }, [id])

  if (isLoading) {
    return (
      <WorkspaceContentContainer className="gap-5">
        <WorkspacePageToolbar>
          <WorkspaceBreadcrumbRow>
            <Breadcrumbs />
          </WorkspaceBreadcrumbRow>
        </WorkspacePageToolbar>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-sm border border-border/80 bg-muted" />
          ))}
        </div>
      </WorkspaceContentContainer>
    )
  }

  if (!customer) {
    return (
      <WorkspaceContentContainer className="gap-5">
        <WorkspacePageToolbar>
          <WorkspaceBreadcrumbRow>
            <Breadcrumbs />
          </WorkspaceBreadcrumbRow>
        </WorkspacePageToolbar>
        <Card className="border-border/80">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">Customer not found</p>
            <Button asChild className="mt-4">
              <Link href="/accounts-receivable/customers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Customers
              </Link>
            </Button>
          </CardContent>
        </Card>
      </WorkspaceContentContainer>
    )
  }

  const openInvoices = invoices.filter(invoice => invoice.status !== "paid" && invoice.status !== "voided")
  const overdueInvoices = invoices.filter(invoice => invoice.status === "overdue")
  const totalReceivable = openInvoices.reduce((sum, invoice) => sum + invoice.openBalance, 0)
  const totalReceived = receipts.reduce((sum, receipt) => sum + receipt.amount, 0)

  return (
    <WorkspaceContentContainer className="gap-5">
      <WorkspacePageToolbar>
        <WorkspaceBreadcrumbRow>
          <Breadcrumbs />
        </WorkspaceBreadcrumbRow>
      </WorkspacePageToolbar>

      <DenseSectionHeader
        eyebrow="Customer Detail"
        title={customer.name}
        description={`Customer ID: ${customer.id} | ${customer.category || "General"}`}
        actions={
          <>
            <Button variant="outline" size="sm" className="rounded-sm" asChild>
              <Link href="/accounts-receivable/customers">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-sm" onClick={() => toast.info("Edit customer")}>
              <Edit className="mr-1.5 h-4 w-4" />
              Edit Customer
            </Button>
            <Button size="sm" className="rounded-sm" onClick={() => toast.info("Create new invoice")}>
              <WalletCards className="mr-1.5 h-4 w-4" />
              New Invoice
            </Button>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted">
                <DollarSign className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Open Balance</div>
                <div className="text-xl font-semibold">{formatCurrency(totalReceivable)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Overdue</div>
                <div className="text-xl font-semibold">{overdueInvoices.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Total Received</div>
                <div className="text-xl font-semibold">{formatCurrency(totalReceived)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Open Invoices</div>
                <div className="text-xl font-semibold">{openInvoices.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto gap-4 bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
          >
            Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger
            value="receipts"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
          >
            Receipts ({receipts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Company</div>
                      <div className="font-medium">{customer.name}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Contact</div>
                      <div className="font-medium">{customer.contactName || "Not specified"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{customer.email || "Not specified"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium">{customer.phone || "Not specified"}</div>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Address</div>
                      <div className="font-medium">{customer.address || "Not specified"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Payment Terms</div>
                      <div className="font-medium">{customer.paymentTerms}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                      toneClasses[getStatusTone(customer.status)]
                    )}
                  >
                    {customer.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Credit Limit</span>
                  <span className="font-medium">{formatCurrency(customer.creditLimit || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Balance</span>
                  <span className="font-medium">{formatCurrency(customer.balance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Currency</span>
                  <span className="font-medium">{customer.currency}</span>
                </div>
                {customer.collectionPriority ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Collection Priority</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                        toneClasses[customer.collectionPriority === "high" ? "critical" : customer.collectionPriority === "medium" ? "warning" : "neutral"]
                      )}
                    >
                      {customer.collectionPriority}
                    </Badge>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card className="border-border/80">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/80 bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Invoice #</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Due Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        No invoices found for this customer.
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map(invoice => (
                      <TableRow key={invoice.id} className="border-b border-border/60">
                        <TableCell className="font-medium">{invoice.number}</TableCell>
                        <TableCell>{formatDate(invoice.date)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                              toneClasses[getStatusTone(invoice.status)]
                            )}
                          >
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(invoice.openBalance, invoice.currency)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="mt-4">
          <Card className="border-border/80">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/80 bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Receipt #</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Method</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        No receipts found for this customer.
                      </TableCell>
                    </TableRow>
                  ) : (
                    receipts.map(receipt => (
                      <TableRow key={receipt.id} className="border-b border-border/60">
                        <TableCell className="font-medium">{receipt.number}</TableCell>
                        <TableCell>{formatDate(receipt.date)}</TableCell>
                        <TableCell className="capitalize">{receipt.paymentMethod.replace("_", " ")}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                              toneClasses[getStatusTone(receipt.status)]
                            )}
                          >
                            {receipt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(receipt.amount, receipt.currency)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </WorkspaceContentContainer>
  )
}
