"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { ResponsiveDrawer } from "@/components/tables/responsive-table"
import { getShellIcon } from "@/lib/utils/shell-icons"
import { cn } from "@/lib/utils"
import type { WorkQueueActionId, WorkQueueDetail, WorkQueueFilterOption } from "@/lib/types"

const toneClasses = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value)
}

interface WorkQueueDetailDrawerProps {
  detail: WorkQueueDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  assignees: WorkQueueFilterOption[]
  isSubmitting?: boolean
  onAction: (actionId: WorkQueueActionId, payload?: { assigneeId?: string; assigneeName?: string }) => void
}

export function WorkQueueDetailDrawer({
  detail,
  open,
  onOpenChange,
  assignees,
  isSubmitting = false,
  onAction,
}: WorkQueueDetailDrawerProps) {
  const title = detail?.item.title ?? "Work Queue Detail"
  const description = detail?.item.reference
    ? `${detail.item.sourceLabel} · ${detail.item.reference}`
    : detail?.item.sourceLabel ?? "Queue detail"

  return (
    <ResponsiveDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className="sm:w-[640px] sm:max-w-2xl"
    >
      {!detail ? null : (
        <div className="space-y-6 px-1 pb-6">
          <section className="space-y-4 border border-border/80 bg-card/85 px-4 py-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                  toneClasses[detail.summary[0]?.tone ?? "neutral"]
                )}
              >
                {detail.item.status.replace(/_/g, " ")}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                  toneClasses[detail.item.priority === "critical" ? "critical" : detail.item.priority === "high" ? "warning" : "neutral"]
                )}
              >
                {detail.item.priority}
              </Badge>
              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-sm" disabled={isSubmitting}>
                      Queue Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Available Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {detail.availableActions.map(action => {
                      const Icon = getShellIcon(action.icon)

                      if (action.id === "assign") {
                        return (
                          <DropdownMenuSub key={action.id}>
                            <DropdownMenuSubTrigger>
                              <Icon className="h-4 w-4" />
                              {action.label}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-56">
                              {assignees.map(assignee => (
                                <DropdownMenuItem
                                  key={assignee.id}
                                  onClick={() => onAction("assign", { assigneeId: assignee.id, assigneeName: assignee.label })}
                                >
                                  {assignee.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )
                      }

                      return (
                        <DropdownMenuItem key={action.id} onClick={() => onAction(action.id)}>
                          <Icon className="h-4 w-4" />
                          {action.label}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-lg font-semibold tracking-tight text-foreground">{detail.item.title}</div>
              {detail.item.description ? <div className="text-sm text-muted-foreground">{detail.item.description}</div> : null}
            </div>

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
          </section>

          {detail.sections.map(section => (
            <section key={section.id} className="space-y-4 border border-border/80 bg-card/85 px-4 py-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {section.title}
              </div>
              <div className="space-y-3">
                {section.fields.map(field => (
                  <div key={field.id} className="flex items-start justify-between gap-4 border-b border-border/70 pb-3 last:border-b-0 last:pb-0">
                    <div className="text-sm text-muted-foreground">{field.label}</div>
                    <div className="max-w-[60%] text-right text-sm font-medium text-foreground">{field.value}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {detail.links.length ? (
            <section className="space-y-4 border border-border/80 bg-card/85 px-4 py-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Related Links
              </div>
              <div className="space-y-2">
                {detail.links.map(link => {
                  const Icon = getShellIcon(link.icon)
                  return (
                    <Button key={link.id} asChild variant="outline" className="h-auto w-full justify-between rounded-sm px-3 py-3">
                      <Link href={link.href} className="flex items-center gap-3">
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {link.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{link.description}</span>
                      </Link>
                    </Button>
                  )
                })}
              </div>
            </section>
          ) : null}

          <section className="space-y-4 border border-border/80 bg-card/85 px-4 py-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Timeline
              </div>
              <div className="text-xs text-muted-foreground">{detail.timeline.length} events</div>
            </div>
            <Separator />
            <div className="space-y-4">
              {detail.timeline.length ? (
                detail.timeline.map(event => (
                  <div key={event.id} className="space-y-1 border-l border-border pl-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium text-foreground">{event.label}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(event.occurredAt)}</div>
                    </div>
                    {event.description ? <div className="text-sm text-muted-foreground">{event.description}</div> : null}
                    {event.userName ? <div className="text-xs text-muted-foreground">{event.userName}</div> : null}
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No timeline activity is available for this queue item yet.</div>
              )}
            </div>
          </section>
        </div>
      )}
    </ResponsiveDrawer>
  )
}
