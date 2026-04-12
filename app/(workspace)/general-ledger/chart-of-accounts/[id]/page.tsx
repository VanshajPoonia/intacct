"use client"

import Link from "next/link"
import { startTransition, use, useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ArrowUpRight, BookOpenText, Download, Plus } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAccountDetailRouteData, type AccountDetailRouteData } from "@/lib/services"
import { formatCurrency, formatDate } from "@/lib/utils"

function getTone(status: string): RecordDetailBadgeItem["tone"] {
  return status === "active" ? "positive" : "critical"
}

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [detail, setDetail] = useState<AccountDetailRouteData | null>(null)
  const [loading, setLoading] = useState(true)
  const dateRangeStart = dateRange?.startDate.getTime() ?? null
  const dateRangeEnd = dateRange?.endDate.getTime() ?? null

  useEffect(() => {
    if (!dateRange) {
      return
    }

    let cancelled = false
    setLoading(true)

    getAccountDetailRouteData(id, {
      entityId: activeEntity?.id,
      dateRange,
    }).then(result => {
      if (cancelled) {
        return
      }

      startTransition(() => {
        setDetail(result)
        setLoading(false)
      })
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

  if (!detail) {
    return (
      <div className="p-6">
        <EmptyState
          type="accounts"
          title="Account not found"
          description="This GL account could not be found in the current demo dataset."
        />
      </div>
    )
  }

  const { account, journals, transactions, balanceTrend } = detail
  const debitTotal = balanceTrend.reduce((sum, point) => sum + point.debits, 0)
  const creditTotal = balanceTrend.reduce((sum, point) => sum + point.credits, 0)
  const latestActivity = transactions[0]?.date ?? journals[0]?.date ?? null

  const badges: RecordDetailBadgeItem[] = [
    { id: "type", label: account.type, tone: "accent" },
    { id: "status", label: account.status, tone: getTone(account.status) },
    { id: "category", label: account.category, tone: "neutral" },
  ]

  const metrics: RecordDetailMetricItem[] = [
    { id: "balance", label: "Current Balance", value: formatCurrency(account.balance, account.currency), detail: `${account.number} · ${account.name}`, tone: "accent" },
    { id: "debits", label: "Debits In Scope", value: formatCurrency(debitTotal, account.currency), detail: `${balanceTrend.length} monthly buckets`, tone: "positive" },
    { id: "credits", label: "Credits In Scope", value: formatCurrency(creditTotal, account.currency), detail: `${journals.length} journal entries`, tone: "warning" },
    {
      id: "activity",
      label: "Latest Activity",
      value: latestActivity ? formatDate(latestActivity) : "No recent activity",
      detail: `${transactions.length} transaction rows`,
      tone: latestActivity ? "neutral" : "warning",
    },
  ]

  const chartConfig: ChartConfig = {
    balance: { label: "Balance", color: "hsl(var(--chart-1))" },
  }

  return (
    <RecordDetailPage
      backHref="/general-ledger/chart-of-accounts"
      title={`${account.number} · ${account.name}`}
      subtitle={`${account.category}${account.subCategory ? ` · ${account.subCategory}` : ""}`}
      badges={badges}
      metrics={metrics}
      actions={
        <>
          <Button size="sm" className="rounded-sm" asChild>
            <Link href="/general-ledger/journal-entries">
              <Plus className="mr-2 h-4 w-4" />
              New Journal
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-sm">
            <Download className="mr-2 h-4 w-4" />
            Export Ledger
          </Button>
        </>
      }
      rightRail={
        <>
          <RecordDetailPanel title="Account Attributes">
            <dl className="space-y-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Account Number</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{account.number}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Type</dt>
                <dd className="mt-1 text-sm text-foreground">{account.type}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Category</dt>
                <dd className="mt-1 text-sm text-foreground">{account.category}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Currency</dt>
                <dd className="mt-1 text-sm text-foreground">{account.currency}</dd>
              </div>
            </dl>
          </RecordDetailPanel>

          <RecordDetailPanel title="Connected Views">
            <div className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start rounded-sm" asChild>
                <Link href="/general-ledger/journal-entries">
                  <BookOpenText className="mr-2 h-4 w-4" />
                  Journal Workspace
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start rounded-sm" asChild>
                <Link href="/general-ledger/reports/trial-balance">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Trial Balance
                </Link>
              </Button>
            </div>
          </RecordDetailPanel>
        </>
      }
    >
      <RecordDetailPanel title="Balance Trend" description="Rolling monthly balance movement based on journals in the current shell date range.">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart data={balanceTrend} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={value => `$${Math.round(Number(value) / 1000)}k`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="balance" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.15} type="monotone" />
          </AreaChart>
        </ChartContainer>
      </RecordDetailPanel>

      <RecordDetailPanel title="Ledger Activity" description="Transactions and system movements mapped to this account in the selected reporting range.">
        {transactions.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell className="font-medium text-foreground">{transaction.description}</TableCell>
                    <TableCell>{transaction.reference ?? transaction.type}</TableCell>
                    <TableCell>
                      <StatusBadge status={transaction.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(transaction.amount, transaction.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            type="transactions"
            title="No direct transaction rows"
            description="This account has no cash or transaction movements inside the active shell date range."
          />
        )}
      </RecordDetailPanel>

      <RecordDetailPanel title="Related Journal Entries" description="Journal entries that posted against this account.">
        {journals.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Journal</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journals.map(journal => (
                  <TableRow key={journal.id}>
                    <TableCell>
                      <Link href={`/general-ledger/journal-entries/${journal.id}`} className="text-sm font-medium text-primary hover:underline">
                        {journal.number}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(journal.date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={journal.status} />
                    </TableCell>
                    <TableCell>{journal.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            type="default"
            title="No journals in scope"
            description="No journal lines for this account were found inside the active shell date range."
          />
        )}
      </RecordDetailPanel>
    </RecordDetailPage>
  )
}
