"use client"

import Link from "next/link"
import { startTransition, use, useEffect, useState } from "react"
import { differenceInCalendarDays } from "date-fns"
import { AlertTriangle, CreditCard, ExternalLink, Mail, Receipt, Send } from "lucide-react"
import { EmptyState } from "@/components/finance/empty-state"
import { LoadingSkeleton } from "@/components/finance/loading-skeleton"
import {
  type RecordDetailBadgeItem,
  type RecordDetailMetricItem,
  RecordDetailPage,
  RecordDetailPanel,
} from "@/components/finance/record-detail-page"
import { StatusBadge } from "@/components/finance/status-badge"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getInvoiceDetailRouteData, type InvoiceDetailRouteData } from "@/lib/services"
import { formatCurrency, formatDate } from "@/lib/utils"

function getTone(status: string): RecordDetailBadgeItem["tone"] {
  switch (status) {
    case "paid":
      return "positive"
    case "sent":
    case "partial":
    case "reminder_sent":
      return "warning"
    case "overdue":
    case "voided":
    case "written_off":
      return "critical"
    default:
      return "neutral"
  }
}

function InvoiceTimeline({ detail }: { detail: InvoiceDetailRouteData }) {
  const { invoice, receipts, customer } = detail
  const items = [
    {
      id: "created",
      label: "Invoice created",
      detail: `${invoice.number} was generated for ${customer?.name ?? invoice.customerName}.`,
      date: invoice.createdAt,
    },
    ...(invoice.sentAt
      ? [
          {
            id: "sent",
            label: "Invoice sent",
            detail: `Delivery completed on ${formatDate(invoice.sentAt)}.`,
            date: invoice.sentAt,
          },
        ]
      : []),
    ...(invoice.collectionStatus !== "none"
      ? [
          {
            id: "collections",
            label: "Collections updated",
            detail: `Collection status is ${invoice.collectionStatus.replace(/_/g, " ")}.`,
            date: invoice.sentAt ?? invoice.createdAt,
          },
        ]
      : []),
    ...receipts.map(receipt => ({
      id: receipt.id,
      label: `Receipt ${receipt.number}`,
      detail: `${receipt.method.toUpperCase()} payment applied for ${formatCurrency(receipt.amount, receipt.currency)}.`,
      date: receipt.date,
    })),
  ].sort((left, right) => right.date.getTime() - left.date.getTime())

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="rounded-sm border border-border/70 bg-background px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-foreground">{item.label}</div>
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{formatDate(item.date)}</div>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{item.detail}</div>
        </div>
      ))}
    </div>
  )
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [detail, setDetail] = useState<InvoiceDetailRouteData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const dateRangeStart = dateRange?.startDate.getTime() ?? null
  const dateRangeEnd = dateRange?.endDate.getTime() ?? null

  useEffect(() => {
    if (!dateRange) {
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getInvoiceDetailRouteData(id, {
      entityId: activeEntity?.id,
      dateRange,
    })
      .then(result => {
        if (cancelled) {
          return
        }

        startTransition(() => {
          setDetail(result)
          setLoading(false)
        })
      })
      .catch(() => {
        if (!cancelled) {
          setError("We couldn’t load this invoice right now.")
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeEntity?.id, dateRange, dateRangeEnd, dateRangeStart, id])

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton type="page" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invoice Unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="p-6">
        <EmptyState
          type="invoices"
          title="Invoice not found"
          description="This invoice could not be found in the current demo dataset."
        />
      </div>
    )
  }

  const { invoice, customer, receipts, documents } = detail
  const receivedAmount = receipts.reduce((sum, receipt) => sum + receipt.amount, 0) || invoice.amountPaid || 0
  const balanceDue = Math.max(invoice.openBalance ?? invoice.amount - receivedAmount, 0)
  const daysPastDue = differenceInCalendarDays(new Date(), invoice.dueDate)
  const isOverdue = daysPastDue > 0 && balanceDue > 0 && invoice.status !== "paid"

  const badges: RecordDetailBadgeItem[] = [
    { id: "status", label: isOverdue ? "overdue" : invoice.status, tone: getTone(isOverdue ? "overdue" : invoice.status) },
    { id: "collections", label: invoice.collectionStatus.replace(/_/g, " "), tone: getTone(invoice.collectionStatus) },
    { id: "entity", label: invoice.entityId.toUpperCase(), tone: "neutral" },
  ]

  const metrics: RecordDetailMetricItem[] = [
    { id: "amount", label: "Invoice Amount", value: formatCurrency(invoice.amount, invoice.currency), detail: invoice.description ?? invoice.customerName, tone: "accent" },
    { id: "received", label: "Cash Applied", value: formatCurrency(receivedAmount, invoice.currency), detail: `${receipts.length} receipt event${receipts.length === 1 ? "" : "s"}`, tone: receivedAmount ? "positive" : "neutral" },
    { id: "balance", label: "Open Balance", value: formatCurrency(balanceDue, invoice.currency), detail: invoice.collectionStatus.replace(/_/g, " "), tone: balanceDue ? "warning" : "positive" },
    {
      id: "due",
      label: "Due Window",
      value: isOverdue ? `${daysPastDue} days overdue` : `${Math.max(differenceInCalendarDays(invoice.dueDate, new Date()), 0)} days remaining`,
      detail: `Due ${formatDate(invoice.dueDate)}`,
      tone: isOverdue ? "critical" : "neutral",
    },
  ]

  return (
    <RecordDetailPage
      backHref="/accounts-receivable/invoices"
      title={invoice.number}
      subtitle={`${invoice.customerName} · ${invoice.description ?? "Customer billing"} · Issued ${formatDate(invoice.date)}`}
      badges={badges}
      metrics={metrics}
      actions={
        <>
          {invoice.status === "draft" ? (
            <Button size="sm" className="rounded-sm">
              <Send className="mr-2 h-4 w-4" />
              Send Invoice
            </Button>
          ) : null}
          {(invoice.status === "sent" || isOverdue) && balanceDue > 0 ? (
            <Button variant="outline" size="sm" className="rounded-sm">
              <Mail className="mr-2 h-4 w-4" />
              Send Reminder
            </Button>
          ) : null}
          {balanceDue > 0 ? (
            <Button size="sm" className="rounded-sm" asChild>
              <Link href="/accounts-receivable/receipts">
                <CreditCard className="mr-2 h-4 w-4" />
                Record Receipt
              </Link>
            </Button>
          ) : null}
          <Button variant="outline" size="sm" className="rounded-sm" asChild>
            <Link href={`/accounts-receivable/customers/${invoice.customerId}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Customer
            </Link>
          </Button>
        </>
      }
      rightRail={
        <>
          <RecordDetailPanel title="Customer Context">
            <dl className="space-y-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Customer</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{customer?.name ?? invoice.customerName}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Payment Terms</dt>
                <dd className="mt-1 text-sm text-foreground">{customer?.paymentTerms ?? "Standard"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Credit Limit</dt>
                <dd className="mt-1 text-sm text-foreground">{customer ? formatCurrency(customer.creditLimit, customer.currency) : "Unavailable"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Customer Balance</dt>
                <dd className="mt-1 text-sm text-foreground">{customer ? formatCurrency(customer.balance, customer.currency) : "Unavailable"}</dd>
              </div>
            </dl>
          </RecordDetailPanel>

          <RecordDetailPanel title="Collections Snapshot">
            <dl className="space-y-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Collection Status</dt>
                <dd className="mt-1 text-sm text-foreground">{invoice.collectionStatus.replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Billing Address</dt>
                <dd className="mt-1 text-sm text-foreground">{invoice.billingAddress ?? customer?.billingAddress ?? "Not captured"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Memo</dt>
                <dd className="mt-1 text-sm text-foreground">{invoice.memo ?? customer?.collectionNotes ?? "None"}</dd>
              </div>
            </dl>
          </RecordDetailPanel>
        </>
      }
    >
      {isOverdue ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Collections follow-up required</AlertTitle>
          <AlertDescription>
            This invoice has been overdue for {daysPastDue} days and still has {formatCurrency(balanceDue, invoice.currency)} outstanding.
          </AlertDescription>
        </Alert>
      ) : null}

      <RecordDetailPanel title="Invoice Lines" description="Revenue lines and dimensional tags included on the customer invoice.">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Revenue Account</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map(line => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium text-foreground">{line.description}</TableCell>
                  <TableCell>
                    <Link href={`/general-ledger/chart-of-accounts/${line.accountId}`} className="text-sm text-primary hover:underline">
                      {line.accountName}
                    </Link>
                  </TableCell>
                  <TableCell>{line.departmentName ?? "Unassigned"}</TableCell>
                  <TableCell>{line.projectName ?? "None"}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(line.amount, invoice.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </RecordDetailPanel>

      <RecordDetailPanel title="Receipts" description="Applied customer cash against this invoice.">
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
          <EmptyState
            type="default"
            title="No receipts applied yet"
            description="Customer payments will appear here after cash is logged or matched."
          />
        )}
      </RecordDetailPanel>

      <RecordDetailPanel title="Documents" description="Invoice PDFs and customer-facing packet history.">
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
                    {document.fileName ?? document.number} · Version {document.version} · Updated {formatDate(document.updatedAt)}
                  </div>
                </div>
                <StatusBadge status={document.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            type="default"
            title="No invoice documents"
            description="Generated invoice files and supporting attachments will appear here."
          />
        )}
      </RecordDetailPanel>

      <RecordDetailPanel title="Activity" description="Customer delivery, collections, and cash application milestones.">
        <InvoiceTimeline detail={detail} />
      </RecordDetailPanel>
    </RecordDetailPage>
  )
}
