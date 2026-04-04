"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { OrgSwitcher } from "@/components/layout/org-switcher"
import { useWorkspaceShellOptional } from "@/components/layout/workspace-shell-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getShellIcon } from "@/lib/utils/shell-icons"
import { cn } from "@/lib/utils"

interface AppSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

function isItemActive(pathname: string, href: string, matchers?: string[]) {
  const targets = matchers?.length ? matchers : [href]
  return targets.some(target => (target === "/" ? pathname === "/" : pathname.startsWith(target)))
}

export function AppSidebar({ collapsed, onToggle, className }: AppSidebarProps) {
  const pathname = usePathname()
  const shell = useWorkspaceShellOptional()

  const isCollapsed = collapsed ?? shell?.sidebarCollapsed ?? false
  const handleToggle = onToggle ?? shell?.toggleSidebar ?? (() => {})
  const sections = shell?.sidebarSections ?? []
  const counts = shell?.counts ?? { notifications: 0, tasks: 0 }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border/80 bg-sidebar/95 transition-[width] duration-200 lg:flex lg:flex-col",
          isCollapsed ? "w-[76px]" : "w-[272px]",
          className
        )}
      >
        <div className="border-b border-sidebar-border/80 px-3 py-3">
          <OrgSwitcher collapsed={isCollapsed} />
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {sections.map(section => (
            <div key={section.id} className="mb-4 last:mb-0">
              {!isCollapsed ? (
                <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {section.label}
                </div>
              ) : null}
              <div className="space-y-1">
                {section.items.map(item => {
                  const Icon = getShellIcon(item.icon)
                  const isActive = isItemActive(pathname, item.href, item.matchers)
                  const countValue =
                    item.countKey === "notifications"
                      ? counts.notifications
                      : item.countKey === "tasks"
                        ? counts.tasks
                        : undefined

                  const button = (
                    <Button
                      variant="ghost"
                      className={cn(
                        "h-10 w-full rounded-sm border border-transparent text-sidebar-foreground/90 hover:border-sidebar-border hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                        isCollapsed ? "justify-center px-0" : "justify-start gap-3 px-2.5",
                        isActive && "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed ? <span className="truncate text-sm">{item.label}</span> : null}
                      {!isCollapsed && typeof countValue === "number" && countValue > 0 ? (
                        <Badge className="ml-auto h-5 rounded-sm px-1.5 text-[10px]">{countValue}</Badge>
                      ) : null}
                    </Button>
                  )

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                          <Link href={item.href}>{button}</Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-2 rounded-sm">
                          <span>{item.label}</span>
                          {typeof countValue === "number" && countValue > 0 ? (
                            <Badge className="h-5 rounded-sm px-1.5 text-[10px]">{countValue}</Badge>
                          ) : null}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return (
                    <Link key={item.id} href={item.href}>
                      {button}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            onClick={handleToggle}
            className={cn(
              "h-10 w-full rounded-sm border border-transparent hover:border-sidebar-border hover:bg-sidebar-accent/70",
              isCollapsed ? "justify-center px-0" : "justify-start gap-3 px-2.5"
            )}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!isCollapsed ? <span className="text-sm">Collapse Sidebar</span> : null}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
