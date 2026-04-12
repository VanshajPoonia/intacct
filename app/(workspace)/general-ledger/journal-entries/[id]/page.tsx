"use client"

import Link from "next/link"
import { startTransition, use, useEffect, useState } from "react"
import { AlertTriangle, Check, RotateCcw, Send } from "lucide-react"
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
import { getJournalEntryDetailRouteData, type JournalEntryDetailRouteData } from "@/lib/services"
import { formatCurrency, formatDate } from "@/lib/utils"

function getTone(status: string): RecordDetailBadgeItem["tone"] {
  switch (status) {
    case "posted":
      return "positive"
    case "draft":
    case "pending":
      return "warning"
    case "reversed":
      return "critical"
    default:
      return "neutral"
  }
}

function JournalTimeline({ detail }: { detail: JournalEntryDetailRouteData }) {
  const { journal } = detail
  const items = [
    {
      id: "created",
      label: "Journal created",
      detail: `${journal.number} was created by ${journal.createdBy}.`,
      date: journal.createdAt,
    },
    ...(journal.status === "pending"
      ? [
          {
            id: "pending",
            label: "Awaiting approval",
            detail: "This journal is waiting for posting approval before it can hit the ledger.",
            date: journal.createdAt,
          },
        ]
      : []),
    ...(journal.postedAt
      ? [
          {
            id: "posted",
            label: "Posted to ledger",
            detail: `${journal.postedBy ?? "Controller"} posted the journal to the general ledger.`,
            date: journal.postedAt,
          },
        ]
      : []),
    ...(journal.reversedEntryId
      ? [
          {
            id: "reversed",
            label: "Reversed",
            detail: `This journal has a linked reversing entry (${journal.reversedEntryId}).`,
            date: journal.postedAt ?? journal.date,
          },
        ]
      : []),
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

export default function JournalEntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { dateRange } = useWorkspaceShell()
  const [detail, setDetail] = useState<JournalEntryDetailRouteData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const dateRangeStart = dateRange?.startDate.getTime() ?? null
  const dateRangeEnd = dateRange?.endDate.getTime() ?? null

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getJournalEntryDetailRouteData(id)
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
          setError("We couldn’t load this journal entry right now.")
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [dateRangeEnd, dateRangeStart, id])

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
          <AlertTitle>Journal Entry Unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="p-6">
        <EmptyState
          type="default"
          title="Journal entry not found"
          description="This journal entry could not be found in the current demo dataset."
        />
      </div>
    )
  }

  const { journal } = detail
  const totalDebits = journal.lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredits = journal.lines.reduce((sum, line) => sum + line.credit, 0)
  const lineCount = journal.lines.length
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.005

  const badges: RecordDetailBadgeItem[] = [
    { id: "status", label: journal.status, tone: getTone(journal.status) },
    ...(journal.periodId ? [{ id: "period", label: journal.periodId.toUpperCase(), tone: "neutral" as const }] : []),
    { id: "entity", label: journal.entityId.toUpperCase(), tone: "neutral" },
  ]

  const metrics: RecordDetailMetricItem[] = [
    { id: "debits", label: "Total Debits", value: formatCurrency(totalDebits), detail: `${lineCount} journal lines`, tone: "accent" },
    { id: "credits", label: "Total Credits", value: formatCurrency(totalCredits), detail: journal.description, tone: "accent" },
    {
      id: "balance",
      label: "Balance Check",
      value: isBalanced ? "Balanced" : formatCurrency(Math.abs(totalDebits - totalCredits)),
      detail: isBalanced ? "Debits equal credits" : "Debits and credits are out of balance",
      tone: isBalanced ? "positive" : "critical",
    },
    {
      id: "posting",
      label: "Posting State",
      value: journal.postedAt ? formatDate(journal.postedAt) : "Not posted",
      detail: journal.postedBy ? `Posted by ${journal.postedBy}` : "Still in operator workflow",
      tone: journal.postedAt ? "positive" : "warning",
    },
  ]

  return (
    <RecordDetailPage
      backHref="/general-ledger/journal-entries"
      title={journal.number}
      subtitle={`${journal.description} · Entry date ${formatDate(journal.date)}`}
      badges={badges}
      metrics={metrics}
      actions={
        <>
          {journal.status === "draft" ? (
            <Button size="sm" className="rounded-sm">
              <Send className="mr-2 h-4 w-4" />
              Submit for Approval
            </Button>
          ) : null}
          {journal.status === "pending" ? (
            <Button size="sm" className="rounded-sm">
              <Check className="mr-2 h-4 w-4" />
              Approve and Post
            </Button>
          ) : null}
          {journal.status === "posted" ? (
            <Button variant="outline" size="sm" className="rounded-sm">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reverse Entry
            </Button>
          ) : null}
        </>
      }
      rightRail={
        <>
          <RecordDetailPanel title="Posting Metadata">
            <dl className="space-y-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Created By</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{journal.createdBy}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Created At</dt>
                <dd className="mt-1 text-sm text-foreground">{formatDate(journal.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Posted At</dt>
                <dd className="mt-1 text-sm text-foreground">{journal.postedAt ? formatDate(journal.postedAt) : "Not posted"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Posted By</dt>
                <dd className="mt-1 text-sm text-foreground">{journal.postedBy ?? "Pending workflow"}</dd>
              </div>
            </dl>
          </RecordDetailPanel>

          <RecordDetailPanel title="Linked Navigation">
            <div className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start rounded-sm" asChild>
                <Link href="/general-ledger/chart-of-accounts">Open Chart of Accounts</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start rounded-sm" asChild>
                <Link href="/general-ledger/reports/trial-balance">Open Trial Balance</Link>
              </Button>
            </div>
          </RecordDetailPanel>
        </>
      }
    >
      {!isBalanced ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Entry out of balance</AlertTitle>
          <AlertDescription>
            Debits and credits differ by {formatCurrency(Math.abs(totalDebits - totalCredits))}. Review the journal lines before posting.
          </AlertDescription>
        </Alert>
      ) : null}

      <RecordDetailPanel title="Journal Lines" description="Each debit and credit line that will affect the ledger.">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journal.lines.map(line => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Link href={`/general-ledger/chart-of-accounts/${line.accountId}`} className="text-sm font-medium text-primary hover:underline">
                      {line.accountNumber} · {line.accountName}
                    </Link>
                  </TableCell>
                  <TableCell>{line.description ?? "No line memo"}</TableCell>
                  <TableCell>{line.departmentName ?? "Unassigned"}</TableCell>
                  <TableCell>{line.projectName ?? "None"}</TableCell>
                  <TableCell className="text-right font-medium">{line.debit ? formatCurrency(line.debit) : "—"}</TableCell>
                  <TableCell className="text-right font-medium">{line.credit ? formatCurrency(line.credit) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </RecordDetailPanel>

      <RecordDetailPanel title="Activity" description="Workflow and posting milestones for the journal.">
        <JournalTimeline detail={detail} />
      </RecordDetailPanel>
    </RecordDetailPage>
  )
}
