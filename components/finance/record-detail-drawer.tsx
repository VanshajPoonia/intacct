"use client"

import Link from "next/link"
import { ResponsiveDrawer } from "@/components/tables/responsive-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { WorkspaceDetailAction, WorkspaceDetailData, WorkspaceTone } from "@/lib/types"
import { getShellIcon } from "@/lib/utils/shell-icons"
import { cn } from "@/lib/utils"

const toneClasses: Record<WorkspaceTone, string> = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
}

interface RecordDetailDrawerProps {
  detail: WorkspaceDetailData | null
  open: boolean
  isLoading?: boolean
  onOpenChange: (open: boolean) => void
  onAction?: (action: WorkspaceDetailAction) => void
}

export function RecordDetailDrawer({
  detail,
  open,
  isLoading = false,
  onOpenChange,
  onAction,
}: RecordDetailDrawerProps) {
  return (
    <ResponsiveDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={detail?.title ?? "Record detail"}
      description={detail?.subtitle ?? "Operator detail"}
      className="sm:w-[640px] sm:max-w-2xl"
    >
      {isLoading ? (
        <div className="space-y-4 px-1 pb-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-sm border border-border/70 bg-muted/50" />
          ))}
        </div>
      ) : detail ? (
        <div className="space-y-6 px-1 pb-6">
          <section className="space-y-4 border border-border/80 bg-card/90 px-4 py-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {detail.badges.map(badge => (
                <Badge
                  key={badge.id}
                  variant="outline"
                  className={cn(
                    "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                    toneClasses[badge.tone ?? "neutral"]
                  )}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold tracking-tight text-foreground">{detail.title}</div>
              <div className="text-sm text-muted-foreground">{detail.subtitle}</div>
            </div>
            {detail.summary.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {detail.summary.map(field => (
                  <div key={field.id} className="space-y-1 border border-border/70 bg-background px-3 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {field.label}
                    </div>
                    <div className="text-sm font-medium text-foreground">{field.value}</div>
                  </div>
                ))}
              </div>
            ) : null}
            {detail.actions.length ? (
              <div className="flex flex-wrap gap-2">
                {detail.actions.map(action => {
                  const Icon = action.icon ? getShellIcon(action.icon) : null
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      className="rounded-sm"
                      onClick={() => onAction?.(action)}
                    >
                      {Icon ? <Icon className="mr-1.5 h-4 w-4" /> : null}
                      {action.label}
                    </Button>
                  )
                })}
              </div>
            ) : null}
          </section>

          {detail.sections.map(section => (
            <section key={section.id} className="space-y-4 border border-border/80 bg-card/90 px-4 py-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {section.title}
              </div>
              <div className="space-y-3">
                {section.fields.map(field => (
                  <div
                    key={field.id}
                    className="flex items-start justify-between gap-4 border-b border-border/70 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="text-sm text-muted-foreground">{field.label}</div>
                    <div className="max-w-[60%] text-right text-sm font-medium text-foreground">{field.value}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {detail.links?.length ? (
            <section className="space-y-4 border border-border/80 bg-card/90 px-4 py-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Related Links
              </div>
              <Separator />
              <div className="space-y-2">
                {detail.links.map(link => (
                  <Button key={link.id} asChild variant="outline" className="h-auto w-full justify-between rounded-sm px-3 py-3">
                    <Link href={link.href}>
                      <span className="text-sm font-medium">{link.label}</span>
                      <span className="text-xs text-muted-foreground">{link.description}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </ResponsiveDrawer>
  )
}
