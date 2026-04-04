"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Lightbulb,
  Copy,
  FileWarning,
  TrendingDown,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import type { AIInsight } from "@/lib/types"

interface DashboardInsightsProps {
  insights: AIInsight[]
  loading: boolean
}

const typeIcons: Record<AIInsight['type'], React.ReactNode> = {
  anomaly: <AlertTriangle className="h-4 w-4" />,
  duplicate: <Copy className="h-4 w-4" />,
  missing_receipt: <FileWarning className="h-4 w-4" />,
  budget_variance: <TrendingDown className="h-4 w-4" />,
  recommendation: <Lightbulb className="h-4 w-4" />,
}

const severityColors: Record<AIInsight['severity'], string> = {
  critical: 'text-red-600 bg-red-50 border-red-200',
  warning: 'text-amber-600 bg-amber-50 border-amber-200',
  info: 'text-blue-600 bg-blue-50 border-blue-200',
}

const severityBadgeColors: Record<AIInsight['severity'], string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
}

function InsightSkeleton() {
  return (
    <div className="p-3 border rounded-lg space-y-2">
      <div className="flex items-start gap-2">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  )
}

function InsightCard({ insight }: { insight: AIInsight }) {
  return (
    <div className={`p-3 border rounded-lg transition-all hover:shadow-sm ${severityColors[insight.severity]}`}>
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded ${severityColors[insight.severity]}`}>
          {typeIcons[insight.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-foreground truncate">{insight.title}</h4>
            <Badge 
              variant="outline" 
              className={`text-[10px] px-1.5 py-0 h-4 ${severityBadgeColors[insight.severity]}`}
            >
              {insight.severity}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            {insight.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(insight.createdAt, { addSuffix: true })}
            </span>
            {insight.actionLabel && insight.actionHref && (
              <Link href={insight.actionHref}>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  {insight.actionLabel}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardInsights({ insights, loading }: DashboardInsightsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <InsightSkeleton />
            <InsightSkeleton />
            <InsightSkeleton />
          </div>
        </CardContent>
      </Card>
    )
  }

  const criticalCount = insights.filter(i => i.severity === 'critical').length
  const warningCount = insights.filter(i => i.severity === 'warning').length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <CardTitle className="text-base font-semibold">AI Insights</CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            {criticalCount > 0 && (
              <Badge variant="outline" className={`text-[10px] h-5 ${severityBadgeColors.critical}`}>
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className={`text-[10px] h-5 ${severityBadgeColors.warning}`}>
                {warningCount} Warning
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[400px] pr-2">
          <div className="space-y-3">
            {insights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Info className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No insights available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  AI analysis will appear here when anomalies or recommendations are detected
                </p>
              </div>
            ) : (
              insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
