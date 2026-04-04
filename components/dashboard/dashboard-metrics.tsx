"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowRight,
  DollarSign,
  Receipt,
  Wallet,
  CreditCard,
  FileText,
  PiggyBank,
  Target,
  Clock,
} from "lucide-react"
import type { DashboardMetricsResponse, DashboardMetric } from "@/lib/types"

interface DashboardMetricsProps {
  metrics: DashboardMetricsResponse | null
  loading: boolean
}

// Map metric IDs to icons and routes
const metricConfig: Record<string, { icon: typeof DollarSign; route: string; tooltip: string }> = {
  totalRevenue: { icon: DollarSign, route: "/reports/income-statement", tooltip: "View income statement" },
  totalExpenses: { icon: Receipt, route: "/accounts-payable/bills", tooltip: "View expenses" },
  netIncome: { icon: PiggyBank, route: "/reports/income-statement", tooltip: "View income statement" },
  cashBalance: { icon: Wallet, route: "/cash-management", tooltip: "View cash management" },
  arOutstanding: { icon: FileText, route: "/accounts-receivable/aging", tooltip: "View AR aging" },
  apOutstanding: { icon: CreditCard, route: "/accounts-payable/aging", tooltip: "View AP aging" },
  budgetVariance: { icon: Target, route: "/reports/budget-vs-actual", tooltip: "View budget report" },
  pendingApprovals: { icon: Clock, route: "/approvals", tooltip: "View pending approvals" },
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
  const router = useRouter()
  const isPositive = metric.changeType === 'positive'
  const isNeutral = metric.changeType === 'neutral'
  const config = metricConfig[metric.id]
  const Icon = config?.icon || DollarSign

  const handleClick = () => {
    if (config?.route) {
      router.push(config.route)
    }
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={cn(
              "transition-all hover:shadow-md group",
              config?.route && "cursor-pointer hover:border-primary/50"
            )}
            onClick={handleClick}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </p>
                <div className="rounded-full p-1.5 bg-muted group-hover:bg-primary/10 transition-colors">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
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
                  <span className="text-xs text-muted-foreground">vs prev</span>
                </div>
              )}
              {config?.route && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>View details</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        {config?.tooltip && (
          <TooltipContent>
            <p>{config.tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
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
