"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { ReactNode } from "react"
import type { ShellRouteLink, ShellStubPage } from "@/lib/types"
import { cn } from "@/lib/utils"

export function WorkspaceFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("flex min-h-screen flex-col bg-background", className)}>{children}</div>
}

export function WorkspaceContentContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[1680px] flex-1 flex-col px-4 py-4 sm:px-5 lg:px-6",
        className
      )}
    >
      {children}
    </div>
  )
}

export function WorkspacePageToolbar({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6",
        className
      )}
    >
      {children}
    </div>
  )
}

export function WorkspaceBreadcrumbRow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("flex items-center justify-between gap-4", className)}>{children}</div>
}

export function DenseSectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="space-y-1.5">
        {eyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </div>
        ) : null}
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          {description ? <p className="max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}

function StubLink({ link }: { link: ShellRouteLink }) {
  return (
    <Link
      href={link.href}
      className="group flex items-center justify-between gap-4 border-b border-border/70 py-3 text-sm transition-colors hover:text-foreground"
    >
      <div className="min-w-0 space-y-0.5">
        <div className="font-medium text-foreground">{link.label}</div>
        {link.description ? <div className="text-xs text-muted-foreground">{link.description}</div> : null}
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export function StubModuleSurface({
  page,
  className,
}: {
  page: ShellStubPage
  className?: string
}) {
  return (
    <div className={cn("grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]", className)}>
      <section className="space-y-5 border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="rounded-sm border-border bg-background text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {page.status}
          </Badge>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Module Landing</div>
        </div>
        <DenseSectionHeader title={page.title} description={page.subtitle} />
        <Separator />
        <div className="space-y-1">
          {page.primaryLinks.map(link => (
            <StubLink key={link.id} link={link} />
          ))}
        </div>
      </section>

      <aside className="space-y-4 border border-border/80 bg-card/70 px-5 py-5 shadow-sm">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Coming In Later Milestones
        </div>
        <div className="space-y-2">
          {page.upcoming.map(item => (
            <div key={item} className="border-b border-border/70 pb-2 text-sm text-foreground/90 last:border-b-0 last:pb-0">
              {item}
            </div>
          ))}
        </div>
        <Button asChild variant="outline" className="w-full justify-between rounded-sm">
          <Link href="/reports">Open Reporting Context</Link>
        </Button>
      </aside>
    </div>
  )
}

export function WorkspaceRightRail({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <aside className={cn("border-l border-border/80 bg-card/50", className)}>
      <div className="sticky top-[7rem] p-4">{children}</div>
    </aside>
  )
}
