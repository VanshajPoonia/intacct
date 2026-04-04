"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import type { DashboardMetric } from "@/lib/types"

interface MetricCardProps {
  metric: DashboardMetric
  className?: string
}

export function MetricCard({ metric, className }: MetricCardProps) {
  const formatValue = (value: number, format: string, currency?: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency || 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      case 'percentage':
        return `${value.toFixed(1)}%`
      default:
        return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
    }
  }

  const getChangeIcon = () => {
    if (!metric.change || metric.change === 0) return <Minus className="h-3 w-3" />
    return metric.change > 0 
      ? <ArrowUpRight className="h-3 w-3" /> 
      : <ArrowDownRight className="h-3 w-3" />
  }

  const getChangeColor = () => {
    if (!metric.changeType || metric.changeType === 'neutral') return 'text-muted-foreground'
    return metric.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
  }

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {metric.label}
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold text-foreground tabular-nums">
              {formatValue(metric.value, metric.format, metric.currency)}
            </span>
            {metric.change !== undefined && (
              <div className={cn("flex items-center gap-0.5 text-xs font-medium", getChangeColor())}>
                {getChangeIcon()}
                <span>{Math.abs(metric.change).toFixed(1)}%</span>
              </div>
            )}
          </div>
          {metric.previousValue !== undefined && (
            <span className="text-xs text-muted-foreground">
              vs {formatValue(metric.previousValue, metric.format, metric.currency)} prior
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
