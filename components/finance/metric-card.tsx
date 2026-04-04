"use client"

import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import type { DashboardMetric } from "@/lib/types"

interface LegacyMetricCardProps {
  title: string
  value: number | string
  icon?: ReactNode
  trend?: "up" | "down" | "attention"
  className?: string
}

interface StructuredMetricCardProps {
  metric: DashboardMetric
  className?: string
}

type MetricCardProps = StructuredMetricCardProps | LegacyMetricCardProps

function isStructuredMetricCard(props: MetricCardProps): props is StructuredMetricCardProps {
  return "metric" in props
}

export function MetricCard(props: MetricCardProps) {
  const className = props.className
  const metric = isStructuredMetricCard(props)
    ? props.metric
    : ({
        id: props.title.toLowerCase().replace(/\s+/g, "-"),
        label: props.title,
        value: typeof props.value === "number" ? props.value : Number(props.value),
        format: "number",
        changeType:
          props.trend === "up"
            ? "positive"
            : props.trend === "down" || props.trend === "attention"
              ? "negative"
              : "neutral",
      } satisfies DashboardMetric)

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
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {metric.label}
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-semibold text-foreground tabular-nums">
                {isStructuredMetricCard(props)
                  ? formatValue(metric.value, metric.format, metric.currency)
                  : props.value}
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
          {!isStructuredMetricCard(props) && props.icon ? (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border bg-muted/50 text-muted-foreground">
              {props.icon}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
