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
  MoreHorizontal,
  Phone,
  ReceiptText,
  User,
} from "lucide-react"
import { getVendorById, getBills, getPayments } from "@/lib/services"
import type { Vendor, Bill, Payment } from "@/lib/types"
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
    case "approved":
    case "completed":
      return "positive"
    case "pending":
    case "draft":
      return "warning"
    case "inactive":
    case "voided":
    case "on_hold":
      return "critical"
    default:
      return "neutral"
  }
}

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [bills, setBills] = useState<Bill[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    setIsLoading(true)

    Promise.all([
      getVendorById(id),
      getBills(undefined, undefined, undefined, { key: "dueDate", direction: "desc" }, 1, 20),
      getPayments(undefined, undefined, undefined, undefined, { key: "date", direction: "desc" }, 1, 20),
    ])
      .then(([vendorData, billsData, paymentsData]) => {
        setVendor(vendorData)
        setBills(billsData.data.filter(bill => bill.vendorId === id))
        setPayments(paymentsData.data.filter(payment => payment.vendorId === id))
        setIsLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load vendor details")
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

  if (!vendor) {
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
            <p className="mt-4 text-lg font-medium">Vendor not found</p>
            <Button asChild className="mt-4">
              <Link href="/accounts-payable/vendors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Vendors
              </Link>
            </Button>
          </CardContent>
        </Card>
      </WorkspaceContentContainer>
    )
  }

  const openBills = bills.filter(bill => bill.status !== "paid" && bill.status !== "voided")
  const paidBills = bills.filter(bill => bill.status === "paid")
  const totalOutstanding = openBills.reduce((sum, bill) => sum + bill.amount, 0)
  const totalPaid = paidBills.reduce((sum, bill) => sum + bill.amount, 0)

  return (
    <WorkspaceContentContainer className="gap-5">
      <WorkspacePageToolbar>
        <WorkspaceBreadcrumbRow>
          <Breadcrumbs />
        </WorkspaceBreadcrumbRow>
      </WorkspacePageToolbar>

      <DenseSectionHeader
        eyebrow="Vendor Detail"
        title={vendor.name}
        description={`Vendor ID: ${vendor.id} | ${vendor.category}`}
        actions={
          <>
            <Button variant="outline" size="sm" className="rounded-sm" asChild>
              <Link href="/accounts-payable/vendors">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-sm" onClick={() => toast.info("Edit vendor")}>
              <Edit className="mr-1.5 h-4 w-4" />
              Edit Vendor
            </Button>
            <Button size="sm" className="rounded-sm" onClick={() => toast.info("Create new bill")}>
              <ReceiptText className="mr-1.5 h-4 w-4" />
              New Bill
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
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Outstanding</div>
                <div className="text-xl font-semibold">{formatCurrency(totalOutstanding)}</div>
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
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Total Paid</div>
                <div className="text-xl font-semibold">{formatCurrency(totalPaid)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-amber-50">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Open Bills</div>
                <div className="text-xl font-semibold">{openBills.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Payments</div>
                <div className="text-xl font-semibold">{payments.length}</div>
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
            value="bills"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
          >
            Bills ({bills.length})
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
          >
            Payments ({payments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Vendor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Company</div>
                      <div className="font-medium">{vendor.name}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Contact</div>
                      <div className="font-medium">{vendor.contactName || "Not specified"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{vendor.email || "Not specified"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium">{vendor.phone || "Not specified"}</div>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Address</div>
                      <div className="font-medium">{vendor.address || "Not specified"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Payment Terms</div>
                      <div className="font-medium">{vendor.paymentTerms}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Status & Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                      toneClasses[getStatusTone(vendor.status)]
                    )}
                  >
                    {vendor.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <span className="font-medium">{vendor.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tax ID</span>
                  <span className="font-medium">{vendor.taxId || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Currency</span>
                  <span className="font-medium">{vendor.currency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Default GL Account</span>
                  <span className="font-medium">{vendor.defaultGLAccount || "Not set"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bills" className="mt-4">
          <Card className="border-border/80">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/80 bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Bill #</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Due Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        No bills found for this vendor.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bills.map(bill => (
                      <TableRow key={bill.id} className="border-b border-border/60">
                        <TableCell className="font-medium">{bill.number}</TableCell>
                        <TableCell>{formatDate(bill.date)}</TableCell>
                        <TableCell>{formatDate(bill.dueDate)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                              toneClasses[getStatusTone(bill.status)]
                            )}
                          >
                            {bill.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(bill.amount, bill.currency)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card className="border-border/80">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/80 bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Payment #</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Method</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        No payments found for this vendor.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map(payment => (
                      <TableRow key={payment.id} className="border-b border-border/60">
                        <TableCell className="font-medium">{payment.number}</TableCell>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell className="capitalize">{payment.method.replace("_", " ")}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                              toneClasses[getStatusTone(payment.status)]
                            )}
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(payment.amount, payment.currency)}</TableCell>
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
