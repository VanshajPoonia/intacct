"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
  children,
  className,
}: PageHeaderProps) {
  const renderedActions = actions ?? children

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="space-y-1">
        {breadcrumbs.length ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {breadcrumbs.map((breadcrumb, index) => (
              <span key={`${breadcrumb.label}-${index}`} className="flex items-center gap-2">
                {breadcrumb.href ? (
                  <Link href={breadcrumb.href} className="transition-colors hover:text-foreground">
                    {breadcrumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{breadcrumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 ? <span>/</span> : null}
              </span>
            ))}
          </div>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {renderedActions && (
        <div className="flex items-center gap-2">
          {renderedActions}
        </div>
      )}
    </div>
  )
}
