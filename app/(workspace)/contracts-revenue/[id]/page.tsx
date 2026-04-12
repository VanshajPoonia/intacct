"use client"

import Link from "next/link"
import { startTransition, use, useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ArrowUpRight, CalendarClock, Download, FileText, Send } from "lucide-react"
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
import { getContractDetailRouteData, type ContractDetailRouteData } from "@/lib/services"
import { formatCurrency, formatDate } from "@/lib/utils"

function getTone(status: string): RecordDetailBadgeItem["tone"] {
  switch (status) {
    case "active":
    case "posted":
    case "ready":
      return "positive"
    case "draft":
    case "queued":
    case "scheduled":
    case "renewal_pending":
      return "warning"
    case "hold":
    case "held":
    case "terminated":
    case "expired":
      return "critical"
    default:
      return "neutral"
  }
}

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [detail, setDetail] = useState<ContractDetailRouteData | null>(null)
  const [loading, setLoading] = useState(true)
  const dateRangeStart = dateRange?.startDate.getTime() ?? null
  const dateRangeEnd = dateRange?.endDate.getTime() ?? null

  useEffect(() => {
    if (!dateRange) {
      return
    }

    let cancelled = false
    setLoading(true)

    getContractDetailRouteData(id, {
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
          type="default"
          title="Contract not found"
          description="This contract could not be found in the current demo dataset."
        />
      </div>
    )
  }

  const { contract, customer, schedule, scheduleLines, obligations, recognitionEvents } = detail
  const recognitionReadyAmount = recognitionEvents
    .filter(event => event.status === "queued")
    .reduce((sum, event) => sum + event.amount, 0)

  const chartData =
    scheduleLines.length > 0
      ? scheduleLines.map(line => ({
          period: line.periodLabel,
          amount: line.amount,
        }))
      : [
          {
            period: "No lines",
            amount: 0,
          },
        ]

  const chartConfig: ChartConfig = {
    amount: { label: "Recognition", color: "hsl(var(--chart-1))" },
  }

  const badges: RecordDetailBadgeItem[] = [
    { id: "status", label: contract.status, tone: getTone(contract.status) },
    ...(schedule ? [{ id: "method", label: schedule.recognitionMethod, tone: "accent" as const }] : []),
    { id: "entity", label: contract.entityId.toUpperCase(), tone: "neutral" },
  ]

  const metrics: RecordDetailMetricItem[] = [
    { id: "value", label: "Contract Value", value: formatCurrency(contract.contractValue), detail: contract.name, tone: "accent" },
    { id: "recognized", label: "Recognized To Date", value: formatCurrency(contract.recognizedRevenue), detail: `${obligations.length} obligations`, tone: "positive" },
    { id: "deferred", label: "Deferred Revenue", value: formatCurrency(contract.deferredRevenue), detail: schedule ? schedule.status : "No linked schedule", tone: contract.deferredRevenue ? "warning" : "positive" },
    {
      id: "queue",
      label: "Queued Recognition",
      value: formatCurrency(recognitionReadyAmount),
      detail: schedule?.nextRecognitionDate ? `Next run ${formatDate(schedule.nextRecognitionDate)}` : "No scheduled run",
      tone: recognitionReadyAmount ? "warning" : "neutral",
    },
  ]

  return (
    <RecordDetailPage
      backHref="/contracts-revenue"
      title={contract.number}
      subtitle={`${contract.name} · ${contract.customerName} · ${formatDate(contract.startDate)} to ${formatDate(contract.endDate)}`}
      badges={badges}
      metrics={metrics}
      actions={
        <>
          <Button size="sm" className="rounded-sm">
            <Send className="mr-2 h-4 w-4" />
            Queue Recognition
          </Button>
          <Button variant="outline" size="sm" className="rounded-sm" asChild>
            <Link href="/reports/income-statement">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Revenue Reporting
            </Link>
          </Button>
        </>
      }
      rightRail={
        <>
          <RecordDetailPanel title="Commercial Context">
            <dl className="space-y-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Customer</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{customer?.name ?? contract.customerName}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Billing Frequency</dt>
                <dd className="mt-1 text-sm text-foreground">{contract.billingFrequency}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Project</dt>
                <dd className="mt-1 text-sm text-foreground">{contract.projectId ?? "None"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Created</dt>
                <dd className="mt-1 text-sm text-foreground">{formatDate(contract.createdAt)}</dd>
              </div>
            </dl>
          </RecordDetailPanel>

          <RecordDetailPanel title="Linked Navigation">
            <div className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start rounded-sm" asChild>
                <Link href={`/accounts-receivable/customers/${contract.customerId}`}>Open Customer</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start rounded-sm" asChild>
                <Link href="/accounts-receivable/invoices">Open Invoices</Link>
              </Button>
            </div>
          </RecordDetailPanel>
        </>
      }
    >
      <RecordDetailPanel title="Recognition Timeline" description="Scheduled and queued revenue events inside the active shell reporting range.">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart data={chartData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={value => `$${Math.round(Number(value) / 1000)}k`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="amount" fill="hsl(var(--chart-1))" stroke="hsl(var(--chart-1))" fillOpacity={0.15} />
          </AreaChart>
        </ChartContainer>
      </RecordDetailPanel>

      <RecordDetailPanel title="Revenue Schedule" description="Recognition lines derived from the contract’s linked revenue schedule.">
        {scheduleLines.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduleLines.map(line => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium text-foreground">{line.periodLabel}</TableCell>
                    <TableCell>{formatDate(line.recognitionDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={line.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(line.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            type="default"
            title="No schedule lines in scope"
            description="No revenue schedule lines were found inside the current shell date range."
          />
        )}
      </RecordDetailPanel>

      <RecordDetailPanel title="Performance Obligations" description="Commercial obligations tied to revenue recognition readiness.">
        {obligations.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Obligation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Allocated Amount</TableHead>
                  <TableHead className="text-right">Satisfied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obligations.map(obligation => (
                  <TableRow key={obligation.id}>
                    <TableCell className="font-medium text-foreground">{obligation.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={obligation.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(obligation.allocatedAmount)}</TableCell>
                    <TableCell className="text-right">{obligation.satisfiedPercent}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            type="default"
            title="No performance obligations"
            description="This contract does not currently have linked obligations in the demo dataset."
          />
        )}
      </RecordDetailPanel>

      <RecordDetailPanel title="Recognition Queue" description="Queued, held, and posted recognition events related to this contract.">
        {recognitionEvents.length ? (
          <div className="space-y-3">
            {recognitionEvents.map(event => (
              <div key={event.id} className="rounded-sm border border-border/70 bg-background px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">{event.description}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDate(event.recognitionDate)} · Created {formatDate(event.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={event.status} />
                    <div className="text-sm font-medium text-foreground">{formatCurrency(event.amount)}</div>
                  </div>
                </div>
                {event.exceptionReason ? (
                  <div className="mt-2 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {event.exceptionReason}
                  </div>
                ) : null}
                {event.journalEntryId ? (
                  <div className="mt-2 text-sm">
                    <Link href={`/general-ledger/journal-entries/${event.journalEntryId}`} className="text-primary hover:underline">
                      Linked journal: {event.journalEntryId}
                    </Link>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            type="default"
            title="No recognition events"
            description="Recognition queue items for this contract will appear here when generated."
          />
        )}
      </RecordDetailPanel>
    </RecordDetailPage>
  )
}
