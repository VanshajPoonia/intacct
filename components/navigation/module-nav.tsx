"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { Button } from "@/components/ui/button"
import { getShellIcon } from "@/lib/utils/shell-icons"
import { cn } from "@/lib/utils"
import { MegaMenu } from "./mega-menu"

function matchesModulePath(matchers: string[], pathname: string) {
  return matchers.some(matcher => (matcher === "/" ? pathname === "/" : pathname.startsWith(matcher)))
}

export function ModuleNav() {
  const pathname = usePathname()
  const { isLoading, topModules } = useWorkspaceShell()
  const [openModuleId, setOpenModuleId] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpenModuleId(null)
  }, [pathname])

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenModuleId(null)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenModuleId(null)
      }
    }

    document.addEventListener("mousedown", handleDocumentClick)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  const activeModule = useMemo(
    () => topModules.find(module => matchesModulePath(module.matchers, pathname)) ?? null,
    [pathname, topModules]
  )

  if (!isLoading && !topModules.length) {
    return null
  }

  return (
    <div ref={navRef} className="relative border-b border-border/80 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <nav className="mx-auto flex max-w-[1680px] items-center gap-0.5 overflow-x-auto px-3 py-1.5 sm:px-4 lg:px-6">
        {topModules.map(module => {
          const Icon = getShellIcon(module.icon)
          const hasMenu = Boolean(module.groups?.length || module.megaMenu?.length)
          const isActive = activeModule?.id === module.id
          const isOpen = openModuleId === module.id
          const groups = module.groups ?? module.megaMenu ?? []

          if (!hasMenu) {
            return (
              <Link key={module.id} href={module.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 gap-2 rounded-sm border border-transparent px-3 text-xs font-medium tracking-[0.02em] text-muted-foreground",
                    "hover:border-border hover:bg-muted/60 hover:text-foreground",
                    isActive && "border-border bg-muted/70 text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{module.label}</span>
                </Button>
              </Link>
            )
          }

          return (
            <Button
              key={module.id}
              variant="ghost"
              size="sm"
              onClick={() => setOpenModuleId(current => (current === module.id ? null : module.id))}
              className={cn(
                "h-9 gap-2 rounded-sm border border-transparent px-3 text-xs font-medium tracking-[0.02em] text-muted-foreground",
                "hover:border-border hover:bg-muted/60 hover:text-foreground",
                isActive && "border-border bg-muted/70 text-foreground",
                isOpen && "border-border bg-background text-foreground"
              )}
              aria-expanded={isOpen}
              aria-haspopup="dialog"
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{module.label}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
            </Button>
          )
        })}
      </nav>

      {openModuleId ? (
        (() => {
          const openModule = topModules.find(module => module.id === openModuleId)
          const groups = openModule?.groups ?? openModule?.megaMenu ?? []

          if (!openModule || !groups.length) {
            return null
          }

          return <MegaMenu groups={groups} moduleLabel={openModule.label} onClose={() => setOpenModuleId(null)} />
        })()
      ) : null}
    </div>
  )
}
