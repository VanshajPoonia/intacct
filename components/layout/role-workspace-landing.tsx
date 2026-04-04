"use client"

import Link from "next/link"
import { ArrowRight, Building2, CalendarDays, UserRoundCog } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"

function humanizeToken(value: string) {
  return value
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function RoleWorkspaceLanding() {
  const { activeEntity, activeRole, dateRange, roleHomeConfig, topModules } = useWorkspaceShell()

  if (!activeRole || !roleHomeConfig || !activeEntity || !dateRange) {
    return null
  }

  const launchModules = topModules.filter(module => module.id !== "home")

  return (
    <WorkspaceContentContainer>
      <div className="space-y-5">
        <WorkspacePageToolbar>
          <WorkspaceBreadcrumbRow>
            <Breadcrumbs />
          </WorkspaceBreadcrumbRow>
        </WorkspacePageToolbar>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5 border border-border/80 bg-card/90 px-5 py-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-sm border-border bg-background text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {activeRole.name}
              </Badge>
              <Badge variant="outline" className="rounded-sm border-border bg-background text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Shared Workspace
              </Badge>
            </div>
            <DenseSectionHeader
              eyebrow="Workspace"
              title={roleHomeConfig.title}
              description={roleHomeConfig.subtitle}
              actions={
                roleHomeConfig.quickActions[0] ? (
                  <Button asChild className="rounded-sm">
                    <Link href={roleHomeConfig.quickActions[0].href}>{roleHomeConfig.quickActions[0].label}</Link>
                  </Button>
                ) : null
              }
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
                  {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
                </div>
                <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {dateRange.preset?.replace(/_/g, " ") ?? "custom"}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <UserRoundCog className="h-3.5 w-3.5" />
                  Role Emphasis
                </div>
                <div className="text-sm font-medium text-foreground">{activeRole.accentLabel}</div>
                <div className="text-xs text-muted-foreground">{activeRole.description}</div>
              </div>
            </div>
          </div>

          <aside className="space-y-4 border border-border/80 bg-card/70 px-5 py-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Priority Focus
            </div>
            <div className="space-y-2">
              {roleHomeConfig.emphasis.map(item => (
                <div key={item} className="border-b border-border/70 pb-2 text-sm text-foreground/90 last:border-b-0 last:pb-0">
                  {humanizeToken(item)}
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4 border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Quick Actions
            </div>
            <div className="space-y-1">
              {roleHomeConfig.quickActions.map(action => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="group flex items-center justify-between gap-4 border-b border-border/70 py-3 text-sm transition-colors hover:text-foreground"
                >
                  <div className="font-medium text-foreground">{action.label}</div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4 border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Navigation Emphasis
            </div>
            <div className="space-y-1">
              {launchModules.map(module => (
                <Link
                  key={module.id}
                  href={module.href}
                  className="group flex items-center justify-between gap-4 border-b border-border/70 py-3 text-sm transition-colors hover:text-foreground"
                >
                  <div className="space-y-0.5">
                    <div className="font-medium text-foreground">{module.label}</div>
                    {module.description ? <div className="text-xs text-muted-foreground">{module.description}</div> : null}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </WorkspaceContentContainer>
  )
}
