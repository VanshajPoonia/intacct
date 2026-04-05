"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import {
  DenseSectionHeader,
  WorkspaceBreadcrumbRow,
  WorkspaceContentContainer,
  WorkspacePageToolbar,
} from "@/components/layout/workspace-primitives"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  MessageSquare,
  RefreshCcw,
  Search,
  Send,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react"
import { getAIInsights } from "@/lib/services"
import type { AIInsight, FinanceFilters } from "@/lib/types"
import { cn } from "@/lib/utils"

const toneClasses = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const

interface AnomalyItem {
  id: string
  title: string
  description: string
  severity: "critical" | "warning" | "info"
  category: string
  detectedAt: Date
  affectedAmount: number
  trend: "up" | "down" | "neutral"
}

interface ForecastItem {
  id: string
  metric: string
  currentValue: number
  predictedValue: number
  confidence: number
  period: string
  trend: "up" | "down" | "neutral"
}

interface SuggestedQuery {
  id: string
  query: string
  category: string
}

const mockAnomalies: AnomalyItem[] = [
  {
    id: "anomaly-001",
    title: "Unusual expense spike in Marketing",
    description: "Marketing expenses increased by 45% compared to the 3-month average, primarily driven by increased advertising spend.",
    severity: "warning",
    category: "Expense Management",
    detectedAt: new Date("2024-03-15T10:30:00"),
    affectedAmount: 125000,
    trend: "up",
  },
  {
    id: "anomaly-002",
    title: "Revenue collection delays detected",
    description: "Average days to collect receivables has increased from 32 to 41 days over the past quarter.",
    severity: "critical",
    category: "Accounts Receivable",
    detectedAt: new Date("2024-03-14T14:22:00"),
    affectedAmount: 850000,
    trend: "down",
  },
  {
    id: "anomaly-003",
    title: "Duplicate vendor payment pattern",
    description: "Potential duplicate payments identified for vendor Acme Corp totaling $15,450 across 3 transactions.",
    severity: "critical",
    category: "Accounts Payable",
    detectedAt: new Date("2024-03-13T09:15:00"),
    affectedAmount: 15450,
    trend: "neutral",
  },
  {
    id: "anomaly-004",
    title: "Budget variance in R&D exceeds threshold",
    description: "R&D spending is 28% over budget for the current period, driven by contractor costs.",
    severity: "warning",
    category: "Budget Management",
    detectedAt: new Date("2024-03-12T16:45:00"),
    affectedAmount: 75000,
    trend: "up",
  },
]

const mockForecasts: ForecastItem[] = [
  {
    id: "forecast-001",
    metric: "Total Revenue",
    currentValue: 2450000,
    predictedValue: 2680000,
    confidence: 87,
    period: "Q2 2024",
    trend: "up",
  },
  {
    id: "forecast-002",
    metric: "Operating Expenses",
    currentValue: 1850000,
    predictedValue: 1920000,
    confidence: 92,
    period: "Q2 2024",
    trend: "up",
  },
  {
    id: "forecast-003",
    metric: "Cash Position",
    currentValue: 1200000,
    predictedValue: 1380000,
    confidence: 78,
    period: "End of Q2",
    trend: "up",
  },
  {
    id: "forecast-004",
    metric: "Net Income",
    currentValue: 320000,
    predictedValue: 385000,
    confidence: 72,
    period: "Q2 2024",
    trend: "up",
  },
]

const suggestedQueries: SuggestedQuery[] = [
  { id: "sq-001", query: "What is my current cash runway?", category: "Cash Management" },
  { id: "sq-002", query: "Show me top vendors by spend this quarter", category: "Accounts Payable" },
  { id: "sq-003", query: "Which customers have overdue invoices?", category: "Accounts Receivable" },
  { id: "sq-004", query: "Compare this month's expenses to last month", category: "Expense Analysis" },
  { id: "sq-005", query: "What journal entries need my approval?", category: "General Ledger" },
  { id: "sq-006", query: "Show revenue by product line", category: "Revenue Analysis" },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value)
}

function getSeverityIcon(severity: AnomalyItem["severity"]) {
  switch (severity) {
    case "critical":
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-600" />
    default:
      return <Lightbulb className="h-4 w-4 text-blue-600" />
  }
}

function getTrendIcon(trend: "up" | "down" | "neutral") {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-emerald-600" />
    case "down":
      return <TrendingDown className="h-4 w-4 text-red-600" />
    default:
      return <BarChart3 className="h-4 w-4 text-muted-foreground" />
  }
}

export default function AIPage() {
  const { activeEntity, activeRole, dateRange } = useWorkspaceShell()
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [anomalies] = useState<AnomalyItem[]>(mockAnomalies)
  const [forecasts] = useState<ForecastItem[]>(mockForecasts)
  const [query, setQuery] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("insights")

  useEffect(() => {
    if (!activeEntity || !dateRange) {
      return
    }

    const filters: FinanceFilters = {
      entityId: activeEntity.id,
      dateRange,
    }

    getAIInsights(filters).then(setInsights)
  }, [activeEntity?.id, dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime()])

  const handleQuerySubmit = () => {
    if (!query.trim()) {
      return
    }

    setIsProcessing(true)
    setTimeout(() => {
      toast.info(`Processing: "${query}"`)
      setIsProcessing(false)
      setQuery("")
    }, 1500)
  }

  if (!activeEntity || !dateRange) {
    return null
  }

  const criticalInsights = insights.filter(i => i.severity === "critical")
  const warningInsights = insights.filter(i => i.severity === "warning")

  return (
    <WorkspaceContentContainer className="gap-5">
      <WorkspacePageToolbar>
        <WorkspaceBreadcrumbRow>
          <Breadcrumbs />
        </WorkspaceBreadcrumbRow>
      </WorkspacePageToolbar>

      <DenseSectionHeader
        eyebrow="AI-Powered Finance"
        title="AI Assistant"
        description="Natural language queries, anomaly detection, predictive forecasting, and AI-generated insights for your financial data."
        actions={
          <>
            <Button variant="outline" size="sm" className="rounded-sm" onClick={() => toast.info("Refreshing AI insights...")}>
              <RefreshCcw className="mr-1.5 h-4 w-4" />
              Refresh Insights
            </Button>
            <Button size="sm" className="rounded-sm">
              <Sparkles className="mr-1.5 h-4 w-4" />
              AI Settings
            </Button>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Total Insights</div>
                <div className="text-2xl font-semibold">{insights.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Critical Alerts</div>
                <div className="text-2xl font-semibold">{criticalInsights.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-amber-50">
                <Zap className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Anomalies</div>
                <div className="text-2xl font-semibold">{anomalies.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Forecasts</div>
                <div className="text-2xl font-semibold">{forecasts.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4 border border-border/80 bg-card/95 px-5 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-primary" />
          <div className="space-y-0.5">
            <div className="font-medium text-foreground">Ask AI About Your Finances</div>
            <div className="text-sm text-muted-foreground">Ask questions in plain language and get instant answers from your financial data.</div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleQuerySubmit()}
              placeholder="Ask a question about your financial data..."
              className="h-11 rounded-sm pl-10 pr-4"
            />
          </div>
          <Button onClick={handleQuerySubmit} disabled={!query.trim() || isProcessing} className="h-11 rounded-sm px-6">
            {isProcessing ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Ask
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedQueries.slice(0, 4).map(sq => (
            <Button key={sq.id} variant="outline" size="sm" className="h-7 rounded-sm text-xs" onClick={() => setQuery(sq.query)}>
              {sq.query}
            </Button>
          ))}
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto gap-4 bg-transparent p-0">
          <TabsTrigger
            value="insights"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
          >
            AI Insights
          </TabsTrigger>
          <TabsTrigger
            value="anomalies"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
          >
            Anomaly Detection
            {anomalies.length > 0 && (
              <Badge variant="outline" className="ml-2 rounded-sm bg-amber-50 text-amber-700 text-[10px]">
                {anomalies.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="forecasts"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
          >
            Predictive Forecasts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-4">
          <section className="space-y-4 border border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold">AI-Generated Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No AI insights available for the current scope.
                </div>
              ) : (
                insights.slice(0, 6).map(insight => (
                  <Link
                    key={insight.id}
                    href={insight.actionHref ?? "#"}
                    className="flex items-start justify-between gap-4 border-b border-border/70 py-3 last:border-b-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {insight.severity === "critical" ? (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        ) : insight.severity === "warning" ? (
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                        ) : (
                          <Sparkles className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{insight.title}</div>
                        <div className="text-sm text-muted-foreground">{insight.description}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{insight.type.replace(/_/g, " ")}</span>
                          <span>-</span>
                          <span>{formatDate(insight.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                        toneClasses[insight.severity === "critical" ? "critical" : insight.severity === "warning" ? "warning" : "accent"]
                      )}
                    >
                      {insight.severity}
                    </Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </section>
        </TabsContent>

        <TabsContent value="anomalies" className="mt-4">
          <section className="space-y-4 border border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold">Anomaly Detection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {anomalies.map(anomaly => (
                <div
                  key={anomaly.id}
                  className="flex items-start justify-between gap-4 border-b border-border/70 py-3 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getSeverityIcon(anomaly.severity)}</div>
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">{anomaly.title}</div>
                      <div className="text-sm text-muted-foreground">{anomaly.description}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{anomaly.category}</span>
                        <span>-</span>
                        <span>{formatDate(anomaly.detectedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(anomaly.trend)}
                      <span className="font-medium text-foreground">{formatCurrency(anomaly.affectedAmount)}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                        toneClasses[anomaly.severity === "critical" ? "critical" : anomaly.severity === "warning" ? "warning" : "accent"]
                      )}
                    >
                      {anomaly.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </section>
        </TabsContent>

        <TabsContent value="forecasts" className="mt-4">
          <section className="space-y-4 border border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold">Predictive Forecasts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {forecasts.map(forecast => (
                  <div key={forecast.id} className="space-y-3 border border-border/70 bg-background px-4 py-4 rounded-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-foreground">{forecast.metric}</div>
                      {getTrendIcon(forecast.trend)}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Current</div>
                        <div className="text-lg font-semibold">{formatCurrency(forecast.currentValue)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Predicted</div>
                        <div className="text-lg font-semibold text-primary">{formatCurrency(forecast.predictedValue)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{forecast.period}</span>
                      <Badge variant="outline" className="rounded-sm text-[10px]">
                        {forecast.confidence}% confidence
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </section>
        </TabsContent>
      </Tabs>
    </WorkspaceContentContainer>
  )
}
