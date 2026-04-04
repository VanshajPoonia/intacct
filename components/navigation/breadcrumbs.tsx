"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { useWorkspaceShellOptional } from "@/components/layout/workspace-shell-provider"
import type { ShellBreadcrumbItem } from "@/lib/types"
import { cn } from "@/lib/utils"

export type BreadcrumbItem = ShellBreadcrumbItem

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const shell = useWorkspaceShellOptional()
  const breadcrumbItems = items ?? shell?.breadcrumbs ?? []

  if (!breadcrumbItems.length) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1.5 text-sm">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" /> : null}
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground",
                  index === 0 && "font-medium"
                )}
              >
                {index === 0 ? <Home className="h-3.5 w-3.5" /> : null}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className={cn("flex items-center gap-1.5 font-medium text-foreground", index === 0 && "text-muted-foreground")}>
                {index === 0 ? <Home className="h-3.5 w-3.5" /> : null}
                <span>{item.label}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
