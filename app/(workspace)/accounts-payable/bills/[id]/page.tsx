"use client"

import Link from "next/link"
import { startTransition, use, useEffect, useState } from "react"
import { differenceInCalendarDays } from "date-fns"
import { AlertTriangle, Check, CreditCard, Download, ExternalLink, FileText, Send } from "lucide-react"
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
import { getBillDetailRouteData, type BillDetailRouteData } from "@/lib/services"
import { formatCurrency, formatDate } from "@/lib/utils"

function getTone(status: string): RecordDetailBadgeItem["tone"] {
  switch (status) {
    case "paid":
    case "approved":
      return "positive"
    case "pending":
    case "draft":
      return "warning"
    case "voided":
    case "rejected":
      return "critical"
    default:
      return "neutral"
  }
}

function TimelineList({
  detail,
}: {
  detail: BillDetailRouteData
}) {
  const { bill, payments } = detail
  const timeline = [
    {
      id: "created",
      label: "Bill created",
      detail: `${bill.number} was entered${bill.createdAt ? ` on ${formatDate(bill.createdAt)}` : ""}.`,
      date: bill.createdAt,
    },
    ...(bill.submittedAt
      ? [
          {
            id: "submitted",
            label: "Submitted for approval",
            detail: `${bill.submittedBy ?? "Finance"} submitted the bill for workflow review.`,
            date: bill.submittedAt,
          },
        ]
      : []),
    ...(bill.approvedAt
      ? [
          {
            id: "approved",
            label: "Approved for payment",
            detail: `${bill.approvedBy ?? "Controller"} approved the bill for disbursement.`,
            date: bill.approvedAt,
          },
        ]
      : []),
    ...(bill.rejectedAt
      ? [
          {
            id: "rejected",
            label: "Returned for rework",
            detail: bill.rejectionReason ?? `${bill.rejectedBy ?? "Controller"} sent the bill back for correction.`,
            date: bill.rejectedAt,
          },
        ]
      : []),
    ...payments.map(payment => ({
      id: payment.id,
      label: `Payment ${payment.number}`,
      detail: `${payment.method.toUpperCase()} payment ${payment.reference ? `(${payment.reference}) ` : ""}for ${formatCurrency(payment.amount, payment.currency)}.`,
      date: payment.date,
    })),
  ]
    .sort((left, right) => right.date.getTime() - left.date.getTime())

  return (
    <div className="space-y-3">
      {timeline.map(item => (
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

export default function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [detail, setDetail] = useState<BillDetailRouteData | null>(null)
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

    getBillDetailRouteData(id, {
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
          setError("We couldn’t load this bill right now.")
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
          <AlertTitle>Bill Unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="p-6">
        <EmptyState
          type="bills"
          title="Bill not found"
          description="This bill could not be found in the current demo dataset."
        />
      </div>
    )
  }

  const { bill, vendor, payments, documents } = detail
  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0) || bill.amountPaid || 0
  const balanceDue = Math.max(bill.amount - paidAmount, 0)
  const daysUntilDue = differenceInCalendarDays(bill.dueDate, new Date())
  const isOverdue = daysUntilDue < 0 && bill.status !== "paid" && bill.status !== "voided"

  const badges: RecordDetailBadgeItem[] = [
    { id: "status", label: bill.status, tone: getTone(bill.status) },
    { id: "approval", label: bill.approvalStatus.replace(/_/g, " "), tone: getTone(bill.approvalStatus) },
    { id: "entity", label: bill.entityId.toUpperCase(), tone: "neutral" },
  ]

  const metrics: RecordDetailMetricItem[] = [
    { id: "amount", label: "Bill Amount", value: formatCurrency(bill.amount, bill.currency), detail: bill.description ?? bill.vendorName, tone: "accent" },
    { id: "paid", label: "Amount Paid", value: formatCurrency(paidAmount, bill.currency), detail: `${payments.length} payment event${payments.length === 1 ? "" : "s"}`, tone: paidAmount ? "positive" : "neutral" },
    { id: "balance", label: "Open Balance", value: formatCurrency(balanceDue, bill.currency), detail: bill.paymentStatus.replace(/_/g, " "), tone: balanceDue ? "warning" : "positive" },
    {
      id: "due",
      label: "Due Window",
      value: isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${Math.max(daysUntilDue, 0)} days remaining`,
      detail: `Due ${formatDate(bill.dueDate)}`,
      tone: isOverdue ? "critical" : "neutral",
    },
  ]

  return (
    <RecordDetailPage
      backHref="/accounts-payable/bills"
      title={bill.number}
      subtitle={`${bill.vendorName} · ${bill.terms ?? "Standard terms"} · Entered ${formatDate(bill.date)}`}
      badges={badges}
      metrics={metrics}
      actions={
        <>
          {bill.status === "pending" ? (
            <Button variant="outline" size="sm" className="rounded-sm">
              <Send className="mr-2 h-4 w-4" />
              Request Info
            </Button>
          ) : null}
          {bill.status === "approved" ? (
            <Button size="sm" className="rounded-sm" asChild>
              <Link href="/accounts-payable/payments">
                <CreditCard className="mr-2 h-4 w-4" />
                Schedule Payment
              </Link>
            </Button>
          ) : null}
          <Button variant="outline" size="sm" className="rounded-sm" asChild>
            <Link href={`/accounts-payable/vendors/${bill.vendorId}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Vendor
            </Link>
          </Button>
        </>
      }
      rightRail={
        <>
          <RecordDetailPanel title="Vendor Context">
            <dl className="space-y-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Vendor</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{vendor?.name ?? bill.vendorName}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Payment Terms</dt>
                <dd className="mt-1 text-sm text-foreground">{vendor?.paymentTerms ?? bill.terms ?? "Standard"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Preferred Method</dt>
                <dd className="mt-1 text-sm text-foreground">{vendor?.preferredPaymentMethod?.toUpperCase() ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Vendor Balance</dt>
                <dd className="mt-1 text-sm text-foreground">{vendor ? formatCurrency(vendor.balance, vendor.currency) : "Unavailable"}</dd>
              </div>
            </dl>
          </RecordDetailPanel>

          <RecordDetailPanel title="Approval State">
            <dl className="space-y-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Submitted</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {bill.submittedAt ? `${formatDate(bill.submittedAt)} by ${bill.submittedBy ?? "Finance"}` : "Not submitted"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Approved</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {bill.approvedAt ? `${formatDate(bill.approvedAt)} by ${bill.approvedBy ?? "Controller"}` : "Awaiting approval"}
                </dd>
              </div>
              {bill.rejectionReason ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Rejection Note</dt>
                  <dd className="mt-1 text-sm text-foreground">{bill.rejectionReason}</dd>
                </div>
              ) : null}
            </dl>
          </RecordDetailPanel>
        </>
      }
    >
      {isOverdue ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Payment attention needed</AlertTitle>
          <AlertDescription>
            This bill is past due and still carries an open balance of {formatCurrency(balanceDue, bill.currency)}.
          </AlertDescription>
        </Alert>
      ) : null}

      <RecordDetailPanel title="Line Items" description="Coding and dimensional detail that will post to the ledger.">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bill.lineItems.map(line => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium text-foreground">{line.description}</TableCell>
                  <TableCell>
                    <Link href={`/general-ledger/chart-of-accounts/${line.accountId}`} className="text-sm text-primary hover:underline">
                      {line.accountName}
                    </Link>
                  </TableCell>
                  <TableCell>{line.departmentName ?? "Unassigned"}</TableCell>
                  <TableCell>{line.projectName ?? "None"}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(line.amount, bill.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </RecordDetailPanel>

      <RecordDetailPanel title="Payments" description="Cleared and scheduled payment activity linked to this bill.">
        {payments.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium text-foreground">{payment.number}</TableCell>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell className="uppercase">{payment.method}</TableCell>
                    <TableCell>
                      <StatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(payment.amount, payment.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            type="default"
            title="No payments linked yet"
            description="Approved bills will show scheduled or completed payments here."
          />
        )}
      </RecordDetailPanel>

      <RecordDetailPanel
        title="Supporting Documents"
        description="Bill packet, attachments, and scan metadata used during review."
        actions={
          <Button variant="outline" size="sm" className="rounded-sm">
            <Download className="mr-2 h-4 w-4" />
            Download Packet
          </Button>
        }
      >
        {documents.length ? (
          <div className="space-y-3">
            {documents.map(document => (
              <div key={document.id} className="flex items-start justify-between gap-4 rounded-sm border border-border/70 bg-background px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
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
            title="No documents attached"
            description="Receipts, invoices, and supporting files will appear here when attached to the bill."
          />
        )}
      </RecordDetailPanel>

      <RecordDetailPanel title="Activity" description="Workflow and payment milestones for this document.">
        <TimelineList detail={detail} />
      </RecordDetailPanel>
    </RecordDetailPage>
  )
}
