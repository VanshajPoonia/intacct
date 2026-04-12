"use client"

import { startTransition, useEffect, useMemo, useState, type ReactNode } from "react"
import { Building2, CalendarDays, RefreshCcw, ShieldCheck } from "lucide-react"
import { AccountantHomepage } from "@/components/layout/accountant-homepage"
import {
  DenseSectionHeader,
  WorkspaceBreadcrumbRow,
  WorkspaceContentContainer,
  WorkspacePageToolbar,
} from "@/components/layout/workspace-primitives"
import {
  HomepageActionStrip,
  HomepageLoadingState,
  HomepageMetricStrip,
} from "@/components/layout/homepage-primitives"
import { SharedRoleHomepage } from "@/components/layout/shared-role-homepage"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getRoleHomepageData } from "@/lib/services"
import type { FinanceFilters, RoleHomepageData } from "@/lib/types"

function formatDateWindow(startDate: Date, endDate: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(startDate) + " - " +
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(endDate)
}

function formatRefreshTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value)
}

function getHomepageBadgeLabel(roleId: string) {
  switch (roleId) {
    case "accountant":
      return "Queue-First Home"
    case "ap_specialist":
      return "AP Operations Home"
    case "ar_specialist":
      return "AR Operations Home"
    case "controller":
      return "Close Control Home"
    case "cfo":
      return "Executive Performance Home"
    case "admin":
      return "Governance Console"
    default:
      return "Role Workspace"
  }
}

export function RoleHomepageResolver() {
  const { activeEntity, activeRole, dateRange } = useWorkspaceShell()
  const [homepageData, setHomepageData] = useState<RoleHomepageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const activeEntityId = activeEntity?.id ?? null
  const activeRoleId = activeRole?.id ?? null
  const homepageFilters = useMemo<FinanceFilters | null>(() => {
    if (!activeEntityId || !dateRange) {
      return null
    }

    return {
      entityId: activeEntityId,
      dateRange,
    }
  }, [activeEntityId, dateRange])

  useEffect(() => {
    if (!activeRoleId || !homepageFilters) {
      return
    }

    let cancelled = false

    setIsLoading(true)
    setError(null)
    setHomepageData(null)

    getRoleHomepageData(activeRoleId, homepageFilters)
      .then(result => {
        if (cancelled) {
          return
        }

        startTransition(() => {
          setHomepageData(result)
          setIsLoading(false)
        })
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setError("Unable to load the role homepage.")
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeRoleId, homepageFilters])

  if (!activeRole || !activeEntity || !dateRange) {
    return null
  }

  const data = homepageData
  let homepageContent: ReactNode = null

  if (isLoading) {
    homepageContent = <HomepageLoadingState />
  } else if (data) {
    homepageContent =
      activeRole.id === "accountant" ? <AccountantHomepage data={data} /> : <SharedRoleHomepage data={data} />
  }

  return (
    <WorkspaceContentContainer>
      <div className="space-y-5">
        <WorkspacePageToolbar>
          <WorkspaceBreadcrumbRow>
            <Breadcrumbs />
          </WorkspaceBreadcrumbRow>
        </WorkspacePageToolbar>

        <section className="space-y-5 border border-border/80 bg-card/90 px-5 py-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-sm border-border bg-background text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
            >
              {activeRole.name}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-sm border-border bg-background text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
            >
              {getHomepageBadgeLabel(activeRole.id)}
            </Badge>
            {data ? (
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCcw className="h-3.5 w-3.5" />
                Updated {formatRefreshTime(data.refreshedAt)}
              </div>
            ) : null}
          </div>

          <DenseSectionHeader
            eyebrow="Role Workspace"
            title={data?.title ?? activeRole.name}
            description={data?.subtitle ?? activeRole.description}
          />

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                Entity
              </div>
              <div className="text-sm font-medium text-foreground">{activeEntity.name}</div>
              <div className="text-xs text-muted-foreground">
                {activeEntity.code} · {activeEntity.currency}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Reporting Window
              </div>
              <div className="text-sm font-medium text-foreground">
                {formatDateWindow(dateRange.startDate, dateRange.endDate)}
              </div>
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {dateRange.preset?.replace(/_/g, " ") ?? "custom"}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Role Focus
              </div>
              <div className="text-sm font-medium text-foreground">{data?.roleLabel ?? activeRole.name}</div>
              <div className="text-xs text-muted-foreground">{data?.accentLabel ?? activeRole.description}</div>
            </div>
          </div>

          <HomepageActionStrip actions={data?.primaryActions ?? []} />
        </section>

        <HomepageMetricStrip metrics={data?.summaryMetrics ?? []} loading={isLoading} />

        {error ? (
          <section className="border border-red-200 bg-red-50 px-5 py-5 text-sm text-red-700 shadow-sm">
            {error}
          </section>
        ) : null}

        {homepageContent}
      </div>
    </WorkspaceContentContainer>
  )
}
