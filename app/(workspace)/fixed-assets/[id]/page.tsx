"use client"

import { startTransition, use, useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Download, Landmark, TrendingDown } from "lucide-react"
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
import { getFixedAssetDetailRouteData, type FixedAssetDetailRouteData } from "@/lib/services"
import { formatCurrency, formatDate } from "@/lib/utils"

function getTone(status: string): RecordDetailBadgeItem["tone"] {
  switch (status) {
    case "active":
    case "in_service":
    case "capitalized":
      return "positive"
    case "draft":
    case "queued":
      return "warning"
    case "hold":
    case "disposed":
    case "needs_review":
      return "critical"
    default:
      return "neutral"
  }
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [detail, setDetail] = useState<FixedAssetDetailRouteData | null>(null)
  const [loading, setLoading] = useState(true)
  const dateRangeStart = dateRange?.startDate.getTime() ?? null
  const dateRangeEnd = dateRange?.endDate.getTime() ?? null

  useEffect(() => {
    if (!dateRange) {
      return
    }

    let cancelled = false
    setLoading(true)

    getFixedAssetDetailRouteData(id, {
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
          title="Asset not found"
          description="This fixed asset could not be found in the current demo dataset."
        />
      </div>
    )
  }

  const { asset, book, depreciationLines, lifecycleEvents } = detail
  const depreciationPercent = asset.cost ? (asset.accumulatedDepreciation / asset.cost) * 100 : 0

  const chartConfig: ChartConfig = {
    depreciationAmount: { label: "Depreciation", color: "hsl(var(--chart-1))" },
  }

  const chartData =
    depreciationLines.length > 0
      ? depreciationLines.map(line => ({
          period: line.periodLabel,
          depreciationAmount: line.depreciationAmount,
        }))
      : [
          {
            period: "No lines",
            depreciationAmount: 0,
          },
        ]

  const badges: RecordDetailBadgeItem[] = [
    { id: "status", label: asset.status, tone: getTone(asset.status) },
    { id: "capitalization", label: asset.capitalizationStatus, tone: getTone(asset.capitalizationStatus) },
    { id: "category", label: asset.category, tone: "accent" },
  ]

  const metrics: RecordDetailMetricItem[] = [
    { id: "cost", label: "Acquisition Cost", value: formatCurrency(asset.cost), detail: asset.vendorName ?? "No vendor recorded", tone: "accent" },
    { id: "accumulated", label: "Accumulated Depreciation", value: formatCurrency(asset.accumulatedDepreciation), detail: `${depreciationPercent.toFixed(1)}% depreciated`, tone: "warning" },
    { id: "net-book", label: "Net Book Value", value: formatCurrency(asset.netBookValue), detail: asset.bookName, tone: "positive" },
    {
      id: "life",
      label: "Useful Life",
      value: `${asset.usefulLifeMonths} months`,
      detail: asset.inServiceDate ? `In service ${formatDate(asset.inServiceDate)}` : "Not yet in service",
      tone: "neutral",
    },
  ]

  return (
    <RecordDetailPage
      backHref="/fixed-assets"
      title={`${asset.assetNumber} · ${asset.name}`}
      subtitle={`${asset.category} asset · ${asset.locationName ?? "Location pending"} · Acquired ${formatDate(asset.acquisitionDate)}`}
      badges={badges}
      metrics={metrics}
      actions={
        <>
          <Button variant="outline" size="sm" className="rounded-sm">
            <TrendingDown className="mr-2 h-4 w-4" />
            Preview Impairment
          </Button>
          <Button variant="outline" size="sm" className="rounded-sm">
            <Download className="mr-2 h-4 w-4" />
            Export Asset
          </Button>
        </>
      }
      rightRail={
        <>
          <RecordDetailPanel title="Asset Attributes">
            <dl className="space-y-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Book</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{asset.bookName}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Method</dt>
                <dd className="mt-1 text-sm text-foreground">{asset.depreciationMethod.replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Serial Number</dt>
                <dd className="mt-1 text-sm text-foreground">{asset.serialNumber ?? "Not captured"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Updated</dt>
                <dd className="mt-1 text-sm text-foreground">{formatDate(asset.updatedAt)}</dd>
              </div>
            </dl>
          </RecordDetailPanel>

          <RecordDetailPanel title="Book Record">
            {book ? (
              <dl className="space-y-3">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Book Type</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{book.bookType}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Cost Basis</dt>
                  <dd className="mt-1 text-sm text-foreground">{formatCurrency(book.costBasis)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Book Status</dt>
                  <dd className="mt-1">
                    <StatusBadge status={book.status} />
                  </dd>
                </div>
              </dl>
            ) : (
              <EmptyState
                type="default"
                title="No book record"
                description="This asset does not currently have an active book record."
              />
            )}
          </RecordDetailPanel>
        </>
      }
    >
      <RecordDetailPanel title="Depreciation Trend" description="Scheduled depreciation in the active shell reporting range.">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={value => `$${Math.round(Number(value) / 1000)}k`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="depreciationAmount" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </RecordDetailPanel>

      <RecordDetailPanel title="Depreciation Schedule" description="Posted, scheduled, and exception depreciation lines for this asset.">
        {depreciationLines.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Depreciation</TableHead>
                  <TableHead className="text-right">Ending Book Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depreciationLines.map(line => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium text-foreground">{line.periodLabel}</TableCell>
                    <TableCell>{formatDate(line.scheduledDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={line.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(line.depreciationAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.endingBookValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            type="default"
            title="No depreciation lines in scope"
            description="No depreciation lines for this asset were found in the active shell date range."
          />
        )}
      </RecordDetailPanel>

      <RecordDetailPanel title="Lifecycle Events" description="Capitalization, transfer, reclass, and disposal activity for the asset.">
        {lifecycleEvents.length ? (
          <div className="space-y-3">
            {lifecycleEvents.map(event => (
              <div key={event.id} className="rounded-sm border border-border/70 bg-background px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">{event.eventType.replace(/_/g, " ")}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{event.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{formatDate(event.eventDate)}</div>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <StatusBadge status={event.status} />
                      {event.amount ? <span className="text-sm font-medium text-foreground">{formatCurrency(event.amount)}</span> : null}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">Owner: {event.userName}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            type="default"
            title="No lifecycle events"
            description="Lifecycle activity for this asset will appear here as events are posted."
          />
        )}
      </RecordDetailPanel>

      <RecordDetailPanel title="Value Snapshot" description="Cost basis and net book value position for the current asset record.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-sm border border-border/70 bg-background px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Cost Basis</div>
            <div className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(book?.costBasis ?? asset.cost)}</div>
          </div>
          <div className="rounded-sm border border-border/70 bg-background px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Salvage Value</div>
            <div className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(asset.salvageValue)}</div>
          </div>
          <div className="rounded-sm border border-border/70 bg-background px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Net Book Value</div>
            <div className="mt-2 flex items-center gap-2 text-xl font-semibold text-foreground">
              <Landmark className="h-5 w-5 text-muted-foreground" />
              {formatCurrency(asset.netBookValue)}
            </div>
          </div>
        </div>
      </RecordDetailPanel>
    </RecordDetailPage>
  )
}
