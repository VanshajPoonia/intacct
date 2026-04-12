"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Building2,
  Calendar,
  CreditCard,
  ExternalLink,
  FileText,
  Mail,
  Receipt,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getInvoiceDetailRouteData, type InvoiceDetailRouteData } from "@/lib/services"
import { formatCurrency, formatDate } from "@/lib/utils"
import { StatusBadge } from "../finance/status-badge"

interface InvoiceDrawerProps {
  invoiceId: string | null
  open: boolean
  onClose: () => void
  onUpdate?: () => void
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="rounded-sm bg-muted p-1.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  )
}

export function InvoiceDrawer({ invoiceId, open, onClose }: InvoiceDrawerProps) {
  const [detail, setDetail] = useState<InvoiceDetailRouteData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !invoiceId) {
      setDetail(null)
      return
    }

    let cancelled = false
    setLoading(true)

    getInvoiceDetailRouteData(invoiceId)
      .then(result => {
        if (!cancelled) {
          setDetail(result)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(null)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [invoiceId, open])

  const invoice = detail?.invoice
  const customer = detail?.customer
  const receipts = detail?.receipts ?? []
  const documents = detail?.documents ?? []
  const receivedAmount = receipts.reduce((sum, receipt) => sum + receipt.amount, 0) || invoice?.amountPaid || 0
  const balanceDue = invoice ? Math.max(invoice.openBalance ?? invoice.amount - receivedAmount, 0) : 0

  return (
    <Sheet open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <SheetContent className="w-full p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-6 py-4">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          ) : invoice ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <SheetTitle className="text-lg">{invoice.number}</SheetTitle>
                  <SheetDescription className="mt-1 text-left">
                    {invoice.customerName} · Due {formatDate(invoice.dueDate)}
                  </SheetDescription>
                </div>
                <StatusBadge status={invoice.status === "sent" && balanceDue > 0 && new Date(invoice.dueDate) < new Date() ? "overdue" : invoice.status} />
              </div>
            </>
          ) : (
            <>
              <SheetTitle className="text-lg">Invoice unavailable</SheetTitle>
              <SheetDescription className="text-left">This invoice could not be loaded from the current demo dataset.</SheetDescription>
            </>
          )}
        </SheetHeader>

        {loading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : invoice ? (
          <Tabs defaultValue="details" className="flex h-full flex-col">
            <div className="border-b px-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="lines">Lines</TabsTrigger>
                <TabsTrigger value="receipts">Receipts</TabsTrigger>
                <TabsTrigger value="documents">Docs</TabsTrigger>
              </TabsList>
            </div>

            <div className="max-h-[calc(100vh-180px)] overflow-y-auto px-6 py-5">
              <TabsContent value="details" className="space-y-5">
                <div className="grid grid-cols-3 gap-4 rounded-sm border border-border/70 bg-muted/30 px-4 py-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Invoice Amount</div>
                    <div className="mt-1 text-xl font-semibold">{formatCurrency(invoice.amount, invoice.currency)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Cash Applied</div>
                    <div className="mt-1 text-xl font-semibold text-emerald-600">{formatCurrency(receivedAmount, invoice.currency)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Open Balance</div>
                    <div className="mt-1 text-xl font-semibold">{formatCurrency(balanceDue, invoice.currency)}</div>
                  </div>
                </div>

                <div>
                  <DetailRow icon={Building2} label="Customer" value={customer?.name ?? invoice.customerName} />
                  <DetailRow icon={Calendar} label="Invoice Date" value={formatDate(invoice.date)} />
                  <DetailRow icon={Calendar} label="Due Date" value={formatDate(invoice.dueDate)} />
                  <DetailRow icon={Mail} label="Collection Status" value={invoice.collectionStatus.replace(/_/g, " ")} />
                  <DetailRow icon={FileText} label="Billing Address" value={invoice.billingAddress ?? customer?.billingAddress ?? "Not captured"} />
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="rounded-sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reminder
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-sm" asChild>
                    <Link href={`/accounts-receivable/customers/${invoice.customerId}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Customer
                    </Link>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="lines">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.lineItems.map(line => (
                        <TableRow key={line.id}>
                          <TableCell className="font-medium text-foreground">{line.description}</TableCell>
                          <TableCell>{line.accountName}</TableCell>
                          <TableCell>{line.projectName ?? "None"}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(line.amount, invoice.currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="receipts">
                {receipts.length ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receipts.map(receipt => (
                          <TableRow key={receipt.id}>
                            <TableCell className="font-medium text-foreground">{receipt.number}</TableCell>
                            <TableCell>{formatDate(receipt.date)}</TableCell>
                            <TableCell className="uppercase">{receipt.method}</TableCell>
                            <TableCell>
                              <StatusBadge status={receipt.status} />
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(receipt.amount, receipt.currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-sm border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    No receipts have been applied to this invoice yet.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents">
                {documents.length ? (
                  <div className="space-y-3">
                    {documents.map(document => (
                      <div key={document.id} className="flex items-start justify-between gap-4 rounded-sm border border-border/70 bg-background px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm font-medium text-foreground">{document.title}</div>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {document.fileName ?? document.number} · Updated {formatDate(document.updatedAt)}
                          </div>
                        </div>
                        <StatusBadge status={document.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-sm border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    No invoice documents are attached yet.
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
