"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { DashboardMetricsResponse, DashboardMetric } from "@/lib/types"

interface DashboardMetricsProps {
  metrics: DashboardMetricsResponse | null
  loading: boolean
}

function formatValue(metric: DashboardMetric): string {
  if (metric.format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: metric.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(metric.value)
  }
  if (metric.format === 'percentage') {
    return `${metric.value.toFixed(1)}%`
  }
  return metric.value.toLocaleString()
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-20" />
      </CardContent>
    </Card>
  )
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const isPositive = metric.changeType === 'positive'
  const isNeutral = metric.changeType === 'neutral'
  
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="pt-4 pb-4">
        <p className="text-sm font-medium text-muted-foreground mb-1">
          {metric.label}
        </p>
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {formatValue(metric)}
        </p>
        {metric.change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {isNeutral ? (
              <Minus className="h-3.5 w-3.5 text-muted-foreground" />
            ) : isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-600" />
            )}
            <span className={cn(
              "text-xs font-medium",
              isNeutral && "text-muted-foreground",
              isPositive && "text-emerald-600",
              !isPositive && !isNeutral && "text-red-600"
            )}>
              {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">vs prev period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardMetrics({ metrics, loading }: DashboardMetricsProps) {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const metricsList = [
    metrics.totalRevenue,
    metrics.totalExpenses,
    metrics.netIncome,
    metrics.cashBalance,
    metrics.arOutstanding,
    metrics.apOutstanding,
    metrics.budgetVariance,
    metrics.pendingApprovals,
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {metricsList.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  )
}
