"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import {
  DenseSectionHeader,
  WorkspaceBreadcrumbRow,
  WorkspaceContentContainer,
  WorkspacePageToolbar,
} from "@/components/layout/workspace-primitives"
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type RecordDetailTone = "neutral" | "accent" | "positive" | "warning" | "critical"

export interface RecordDetailBadgeItem {
  id: string
  label: string
  tone?: RecordDetailTone
}

export interface RecordDetailMetricItem {
  id: string
  label: string
  value: string
  detail?: string
  tone?: RecordDetailTone
}

const badgeToneClasses: Record<RecordDetailTone, string> = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
}

const metricToneClasses: Record<RecordDetailTone, string> = {
  neutral: "border-border/80 bg-card/90",
  accent: "border-primary/15 bg-primary/5",
  positive: "border-emerald-200/80 bg-emerald-50/70",
  warning: "border-amber-200/80 bg-amber-50/70",
  critical: "border-red-200/80 bg-red-50/70",
}

export function RecordDetailPanel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("border border-border/80 bg-card/90 shadow-sm", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  )
}

export function RecordDetailPage({
  backHref,
  title,
  subtitle,
  badges = [],
  metrics = [],
  actions,
  children,
  rightRail,
}: {
  backHref: string
  title: string
  subtitle?: string
  badges?: RecordDetailBadgeItem[]
  metrics?: RecordDetailMetricItem[]
  actions?: ReactNode
  children: ReactNode
  rightRail?: ReactNode
}) {
  return (
    <WorkspaceContentContainer>
      <div className="space-y-5">
        <WorkspacePageToolbar>
          <WorkspaceBreadcrumbRow>
            <Breadcrumbs />
          </WorkspaceBreadcrumbRow>
        </WorkspacePageToolbar>

        <section className="space-y-5 border border-border/80 bg-card/90 px-5 py-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-sm" asChild>
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>

            <div className="min-w-0 flex-1 space-y-4">
              {badges.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  {badges.map(badge => (
                    <Badge
                      key={badge.id}
                      variant="outline"
                      className={cn(
                        "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
                        badgeToneClasses[badge.tone ?? "neutral"]
                      )}
                    >
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <DenseSectionHeader title={title} description={subtitle} actions={actions} />
            </div>
          </div>

          {metrics.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map(metric => (
                <Card
                  key={metric.id}
                  className={cn("rounded-sm border shadow-none", metricToneClasses[metric.tone ?? "neutral"])}
                >
                  <CardContent className="space-y-2 px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {metric.label}
                    </div>
                    <div className="text-2xl font-semibold tracking-tight text-foreground">{metric.value}</div>
                    {metric.detail ? <div className="text-xs text-muted-foreground">{metric.detail}</div> : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </section>

        <div className={cn("grid gap-5", rightRail ? "xl:grid-cols-[minmax(0,1fr)_340px]" : "")}>
          <div className="space-y-5">{children}</div>
          {rightRail ? <div className="space-y-5">{rightRail}</div> : null}
        </div>
      </div>
    </WorkspaceContentContainer>
  )
}
