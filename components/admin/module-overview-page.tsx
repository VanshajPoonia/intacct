"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
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
import type { FinanceFilters, ModuleOverviewData, RoleId } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getShellIcon } from "@/lib/utils/shell-icons"

interface ModuleOverviewPageProps {
  eyebrow?: string
  loadOverview: (filters: FinanceFilters, roleId?: RoleId) => Promise<ModuleOverviewData>
}

const toneClasses = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const

export function ModuleOverviewPage({ eyebrow, loadOverview }: ModuleOverviewPageProps) {
  const { activeEntity, activeRole, dateRange } = useWorkspaceShell()
  const [overview, setOverview] = useState<ModuleOverviewData | null>(null)

  const scopedFilters = useMemo<FinanceFilters | null>(() => {
    if (!activeEntity || !dateRange) {
      return null
    }

    return {
      entityId: activeEntity.id,
      dateRange,
    }
  }, [activeEntity, dateRange])

  useEffect(() => {
    if (!scopedFilters) {
      return
    }

    let cancelled = false

    loadOverview(scopedFilters, activeRole?.id).then(nextOverview => {
      if (!cancelled) {
        setOverview(nextOverview)
      }
    })

    return () => {
      cancelled = true
    }
  }, [activeRole?.id, loadOverview, scopedFilters])

  if (!overview) {
    return null
  }

  return (
    <WorkspaceContentContainer className="gap-5">
      <WorkspacePageToolbar>
        <WorkspaceBreadcrumbRow>
          <Breadcrumbs />
        </WorkspaceBreadcrumbRow>
      </WorkspacePageToolbar>

      <DenseSectionHeader
        eyebrow={eyebrow}
        title={overview.title}
        description={overview.subtitle}
        actions={
          <>
            {overview.actions.map(action => {
              const Icon = action.icon ? getShellIcon(action.icon) : null
              return (
                <Button key={action.id} asChild={Boolean(action.href)} variant={action.tone === "accent" ? "default" : "outline"} size="sm" className="rounded-sm">
                  {action.href ? (
                    <Link href={action.href}>
                      {Icon ? <Icon className="mr-1.5 h-4 w-4" /> : null}
                      {action.label}
                    </Link>
                  ) : (
                    <span>
                      {Icon ? <Icon className="mr-1.5 inline h-4 w-4" /> : null}
                      {action.label}
                    </span>
                  )}
                </Button>
              )
            })}
          </>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {overview.metrics.map(metric => (
          <div key={metric.id} className="border border-border/80 bg-card/95 px-4 py-4 shadow-sm">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{metric.label}</div>
              <div className="text-2xl font-semibold tracking-tight text-foreground">{metric.value}</div>
              {metric.detail ? <div className="text-sm text-muted-foreground">{metric.detail}</div> : null}
              {metric.tone ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "mt-2 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                    toneClasses[metric.tone]
                  )}
                >
                  {metric.tone}
                </Badge>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {overview.sections.map(section => (
          <div key={section.id} className="space-y-4 border border-border/80 bg-card/95 px-4 py-4 shadow-sm">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{section.title}</div>
              {section.description ? <div className="text-sm text-muted-foreground">{section.description}</div> : null}
            </div>
            <div className="space-y-2">
              {section.rows.map(row => (
                <Link
                  key={row.id}
                  href={row.href ?? "#"}
                  className="flex items-start justify-between gap-4 border-b border-border/70 py-3 last:border-b-0"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{row.title}</div>
                    {row.description ? <div className="text-xs text-muted-foreground">{row.description}</div> : null}
                    {row.meta?.length ? <div className="text-xs text-muted-foreground">{row.meta.join(" · ")}</div> : null}
                  </div>
                  <div className="space-y-1 text-right">
                    {row.value ? <div className="text-sm font-medium text-foreground">{row.value}</div> : null}
                    {row.status ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                          toneClasses[row.statusTone ?? "neutral"]
                        )}
                      >
                        {row.status}
                      </Badge>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </WorkspaceContentContainer>
  )
}
