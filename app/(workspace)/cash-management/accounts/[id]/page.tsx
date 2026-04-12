"use client"

import { startTransition, use, useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { CheckCheck, Download, RefreshCw } from "lucide-react"
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
import { getBankAccountDetailRouteData, type BankAccountDetailRouteData } from "@/lib/services"
import { formatCurrency, formatDate } from "@/lib/utils"

function getTone(status: string): RecordDetailBadgeItem["tone"] {
  switch (status) {
    case "active":
      return "positive"
    case "frozen":
      return "critical"
    case "inactive":
      return "warning"
    default:
      return "neutral"
  }
}

function getSignedAmountLabel(type: string, amount: number, currency: string) {
  const negativeTypes = new Set(["withdrawal", "payment", "fee", "debit", "transfer"])
  const signedAmount = negativeTypes.has(type) ? -Math.abs(amount) : amount
  return formatCurrency(signedAmount, currency)
}

export default function BankAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [detail, setDetail] = useState<BankAccountDetailRouteData | null>(null)
  const [loading, setLoading] = useState(true)
  const dateRangeStart = dateRange?.startDate.getTime() ?? null
  const dateRangeEnd = dateRange?.endDate.getTime() ?? null

  useEffect(() => {
    if (!dateRange) {
      return
    }

    let cancelled = false
    setLoading(true)

    getBankAccountDetailRouteData(id, {
      entityId: activeEntity?.id ?? "e4",
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
          type="default"
          title="Bank account not found"
          description="This bank account could not be found in the current demo dataset."
        />
      </div>
    )
  }

  const { account, transactions, reconciliationItems, reconciliationSummary, balanceTrend } = detail
  const unmatchedCount = reconciliationItems.filter(item => item.status === "unmatched").length
  const totalInflows = balanceTrend.reduce((sum, point) => sum + point.inflows, 0)
  const totalOutflows = balanceTrend.reduce((sum, point) => sum + point.outflows, 0)

  const chartConfig: ChartConfig = {
    balance: { label: "Balance", color: "hsl(var(--chart-1))" },
  }

  const badges: RecordDetailBadgeItem[] = [
    { id: "type", label: account.type.replace(/_/g, " "), tone: "accent" },
    { id: "status", label: account.status, tone: getTone(account.status) },
    { id: "entity", label: account.entityId.toUpperCase(), tone: "neutral" },
  ]

  const metrics: RecordDetailMetricItem[] = [
    { id: "balance", label: "Current Balance", value: formatCurrency(account.balance, account.currency), detail: account.bankName, tone: "accent" },
    { id: "available", label: "Available Balance", value: formatCurrency(account.availableBalance ?? account.balance, account.currency), detail: "Treasury available liquidity", tone: "positive" },
    { id: "exceptions", label: "Unmatched Items", value: `${unmatchedCount}`, detail: `${reconciliationItems.length} reconciliation rows`, tone: unmatchedCount ? "critical" : "positive" },
    {
      id: "reconciled",
      label: "Reconciled Balance",
      value: formatCurrency(reconciliationSummary.reconciledBalance, account.currency),
      detail: reconciliationSummary.lastReconciledDate ? `Last reconciled ${formatDate(reconciliationSummary.lastReconciledDate)}` : "No completed reconciliation",
      tone: reconciliationSummary.status === "completed" ? "positive" : "warning",
    },
  ]

  return (
    <RecordDetailPage
      backHref="/cash-management/accounts"
      title={account.name}
      subtitle={`${account.bankName} · ${account.accountNumber} · ${account.entityName ?? account.entityId}`}
      badges={badges}
      metrics={metrics}
      actions={
        <>
          <Button variant="outline" size="sm" className="rounded-sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Feed
          </Button>
          <Button size="sm" className="rounded-sm">
            <CheckCheck className="mr-2 h-4 w-4" />
            Reconcile
          </Button>
        </>
      }
      rightRail={
        <>
          <RecordDetailPanel title="Banking Setup">
            <dl className="space-y-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Routing Number</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{account.routingNumber ?? "Not captured"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Currency</dt>
                <dd className="mt-1 text-sm text-foreground">{account.currency}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Last Sync</dt>
                <dd className="mt-1 text-sm text-foreground">{account.lastSyncedAt ? formatDate(account.lastSyncedAt) : "Never"}</dd>
              </div>
            </dl>
          </RecordDetailPanel>

          <RecordDetailPanel title="Reconciliation Summary">
            <dl className="space-y-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Book Balance</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{formatCurrency(reconciliationSummary.bookBalance, account.currency)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Outstanding Deposits</dt>
                <dd className="mt-1 text-sm text-foreground">{formatCurrency(reconciliationSummary.outstandingDeposits, account.currency)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Outstanding Withdrawals</dt>
                <dd className="mt-1 text-sm text-foreground">{formatCurrency(reconciliationSummary.outstandingWithdrawals, account.currency)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <StatusBadge status={reconciliationSummary.status} />
                </dd>
              </div>
            </dl>
          </RecordDetailPanel>
        </>
      }
    >
      <RecordDetailPanel title="Balance History" description="Rolling balance movement across the active shell date range.">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart data={balanceTrend} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={value => `$${Math.round(Number(value) / 1000)}k`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="balance" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.15} />
          </AreaChart>
        </ChartContainer>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-sm border border-border/70 bg-background px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Inflows</div>
            <div className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(totalInflows, account.currency)}</div>
          </div>
          <div className="rounded-sm border border-border/70 bg-background px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Outflows</div>
            <div className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(totalOutflows, account.currency)}</div>
          </div>
        </div>
      </RecordDetailPanel>

      <RecordDetailPanel title="Transactions" description="Feed and treasury activity for this bank account in the active reporting range.">
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
                      <StatusBadge status={transaction.reconciliationStatus ?? transaction.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">{getSignedAmountLabel(transaction.type, transaction.amount, transaction.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            type="transactions"
            title="No transactions in scope"
            description="No bank-feed or treasury transactions were found for this account inside the active shell date range."
          />
        )}
      </RecordDetailPanel>

      <RecordDetailPanel
        title="Reconciliation Exceptions"
        description="Matched, unmatched, and adjusted reconciliation items for this bank account."
        actions={
          <Button variant="outline" size="sm" className="rounded-sm">
            <Download className="mr-2 h-4 w-4" />
            Export Exceptions
          </Button>
        }
      >
        {reconciliationItems.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Bank Amount</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliationItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell className="font-medium text-foreground">{item.description}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.bankAmount, account.currency)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.difference, account.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            type="default"
            title="No reconciliation items"
            description="Reconciliation items for this account will appear here as the feed is matched to books."
          />
        )}
      </RecordDetailPanel>
    </RecordDetailPage>
  )
}
