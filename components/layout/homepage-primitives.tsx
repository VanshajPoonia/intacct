"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"
import type {
  HomepageTone,
  RoleHomepageAction,
  RoleHomepageMetric,
  RoleHomepageSection,
  RoleHomepageWidget,
  RoleHomepageWidgetItem,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { getShellIcon } from "@/lib/utils/shell-icons"

const toneClasses: Record<HomepageTone, string> = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
}

function ToneBadge({
  label,
  tone = "neutral",
}: {
  label: string
  tone?: HomepageTone
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
        toneClasses[tone]
      )}
    >
      {label.replace(/_/g, " ")}
    </Badge>
  )
}

function WidgetChrome({
  title,
  description,
  children,
  footerLink,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  footerLink?: RoleHomepageWidget["footerLink"]
  className?: string
}) {
  return (
    <article className={cn("border border-border/80 bg-card/85 shadow-sm", className)}>
      <div className="space-y-5 px-5 py-5">
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </div>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </div>
      {footerLink ? (
        <Link
          href={footerLink.href}
          className="group flex items-center justify-between gap-3 border-t border-border/80 px-5 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>{footerLink.label}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </article>
  )
}

function MetricCell({ metric }: { metric: RoleHomepageMetric }) {
  const Icon = metric.icon ? getShellIcon(metric.icon) : null

  return (
    <div className="space-y-2 border-r border-border/70 pr-4 last:border-r-0 last:pr-0">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {metric.label}
      </div>
      <div className="text-xl font-semibold tracking-tight text-foreground">{metric.value}</div>
      {metric.detail ? <div className="text-xs text-muted-foreground">{metric.detail}</div> : null}
    </div>
  )
}

function EmptyState({ message }: { message?: string }) {
  return <div className="border border-dashed border-border/80 px-4 py-4 text-sm text-muted-foreground">{message ?? "No data available."}</div>
}

function HomepageListItem({ item }: { item: RoleHomepageWidgetItem }) {
  const Icon = getShellIcon(item.icon)
  const content = (
    <div className="group flex items-start justify-between gap-4 border-b border-border/70 py-3 last:border-b-0 last:pb-0">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-medium text-foreground">{item.title}</div>
            {item.status ? <ToneBadge label={item.status} tone={item.statusTone} /> : null}
          </div>
          {item.description ? <div className="text-sm text-muted-foreground">{item.description}</div> : null}
          {item.meta?.length ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {item.meta.map(meta => (
                <span key={meta}>{meta}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="shrink-0 text-right">
        {item.value ? <div className="text-sm font-medium text-foreground">{item.value}</div> : null}
        {item.secondaryValue ? <div className="text-xs text-muted-foreground">{item.secondaryValue}</div> : null}
      </div>
    </div>
  )

  if (!item.href) {
    return content
  }

  return (
    <Link href={item.href} className="block transition-colors hover:text-foreground">
      {content}
    </Link>
  )
}

function HomepageActionRow({ action }: { action: RoleHomepageAction }) {
  const Icon = getShellIcon(action.icon)

  return (
    <Link
      href={action.href}
      className="group flex items-start justify-between gap-3 border-b border-border/70 py-3 text-sm transition-colors hover:text-foreground last:border-b-0 last:pb-0"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="font-medium text-foreground">{action.label}</div>
          {action.description ? <div className="text-xs text-muted-foreground">{action.description}</div> : null}
        </div>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export function HomepageActionStrip({ actions }: { actions: RoleHomepageAction[] }) {
  if (!actions.length) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(action => {
        const Icon = getShellIcon(action.icon)

        return (
          <Button
            key={action.id}
            asChild
            variant={action.tone === "accent" ? "default" : "outline"}
            className="h-9 rounded-sm"
          >
            <Link href={action.href} className="gap-2">
              <Icon className="h-4 w-4" />
              {action.label}
            </Link>
          </Button>
        )
      })}
    </div>
  )
}

export function HomepageMetricStrip({
  metrics,
  loading = false,
}: {
  metrics: RoleHomepageMetric[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <section className="grid gap-0 border border-border/80 bg-card/75 shadow-sm md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-3 border-r border-border/70 px-5 py-4 last:border-r-0">
            <div className="h-3 w-24 animate-pulse rounded-sm bg-muted" />
            <div className="h-7 w-20 animate-pulse rounded-sm bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded-sm bg-muted" />
          </div>
        ))}
      </section>
    )
  }

  if (!metrics.length) {
    return null
  }

  return (
    <section className="grid gap-0 border border-border/80 bg-card/80 shadow-sm md:grid-cols-2 xl:grid-cols-5">
      {metrics.map(metric => (
        <div key={metric.id} className="px-5 py-4">
          <MetricCell metric={metric} />
        </div>
      ))}
    </section>
  )
}

export function HomepageWidgetSurface({
  widget,
  className,
}: {
  widget: RoleHomepageWidget
  className?: string
}) {
  return (
    <WidgetChrome
      title={widget.title}
      description={widget.description}
      footerLink={widget.footerLink}
      className={className}
    >
      {widget.kind === "metrics" ? (
        widget.metrics?.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {widget.metrics.map(metric => (
              <MetricCell key={metric.id} metric={metric} />
            ))}
          </div>
        ) : (
          <EmptyState message={widget.emptyMessage} />
        )
      ) : null}

      {widget.kind === "list" ? (
        widget.items?.length ? (
          <div className="space-y-0">
            {widget.items.map(item => (
              <HomepageListItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState message={widget.emptyMessage} />
        )
      ) : null}

      {widget.kind === "actions" ? (
        widget.actions?.length ? (
          <div className="space-y-0">
            {widget.actions.map(action => (
              <HomepageActionRow key={action.id} action={action} />
            ))}
          </div>
        ) : (
          <EmptyState message={widget.emptyMessage} />
        )
      ) : null}

      {widget.kind === "progress" ? (
        <div className="space-y-5">
          {widget.metrics?.length ? (
            <div className="grid gap-4 border-b border-border/80 pb-4 md:grid-cols-3">
              {widget.metrics.map(metric => (
                <MetricCell key={metric.id} metric={metric} />
              ))}
            </div>
          ) : null}
          {widget.items?.length ? (
            <div className="space-y-0">
              {widget.items.map(item => (
                <HomepageListItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState message={widget.emptyMessage} />
          )}
        </div>
      ) : null}
    </WidgetChrome>
  )
}

export function HomepageSectionGrid({
  section,
  className,
}: {
  section: RoleHomepageSection
  className?: string
}) {
  return (
    <section
      className={cn(
        "grid gap-6",
        section.widgets.length > 1 ? "xl:grid-cols-2" : "grid-cols-1",
        className
      )}
    >
      {section.widgets.map(widget => (
        <HomepageWidgetSurface key={widget.id} widget={widget} />
      ))}
    </section>
  )
}

export function HomepageLoadingState() {
  return (
    <div className="space-y-6">
      <section className="border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
        <div className="space-y-3">
          <div className="h-3 w-28 animate-pulse rounded-sm bg-muted" />
          <div className="h-7 w-64 animate-pulse rounded-sm bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded-sm bg-muted" />
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3 border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <div className="h-3 w-32 animate-pulse rounded-sm bg-muted" />
              <div className="h-4 w-72 animate-pulse rounded-sm bg-muted" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((__, rowIndex) => (
                  <div key={rowIndex} className="h-11 animate-pulse rounded-sm bg-muted" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="space-y-3 border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <div className="h-3 w-24 animate-pulse rounded-sm bg-muted" />
              <div className="h-4 w-48 animate-pulse rounded-sm bg-muted" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((__, rowIndex) => (
                  <div key={rowIndex} className="h-10 animate-pulse rounded-sm bg-muted" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
