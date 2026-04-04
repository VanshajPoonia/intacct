"use client"

import { type ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/ui/error-boundary"
import { EmptyState } from "@/components/finance/empty-state"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AsyncBoundaryProps {
  children: ReactNode
  loading?: boolean
  error?: Error | string | null
  empty?: boolean
  loadingFallback?: ReactNode
  errorFallback?: ReactNode
  emptyFallback?: ReactNode
  onRetry?: () => void
  className?: string
  // For empty state
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: { label: string; onClick: () => void }
}

export function AsyncBoundary({
  children,
  loading = false,
  error = null,
  empty = false,
  loadingFallback,
  errorFallback,
  emptyFallback,
  onRetry,
  className,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: AsyncBoundaryProps) {
  // Loading state
  if (loading) {
    return (
      <div className={className}>
        {loadingFallback || <LoadingFallback />}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        {errorFallback || (
          <ErrorState
            title="Failed to load"
            description={typeof error === 'string' ? error : error.message}
            onRetry={onRetry}
          />
        )}
      </div>
    )
  }

  // Empty state
  if (empty) {
    return (
      <div className={className}>
        {emptyFallback || (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        )}
      </div>
    )
  }

  return <>{children}</>
}

// Default loading fallback with skeleton
function LoadingFallback() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  )
}

// Table loading skeleton
export function TableLoadingSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Card grid loading skeleton
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}

// Inline loading spinner
interface InlineLoaderProps {
  className?: string
  size?: "sm" | "md" | "lg"
  text?: string
}

export function InlineLoader({ className, size = "md", text }: InlineLoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {text && <span className="text-sm">{text}</span>}
    </div>
  )
}

// Page loading overlay
export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
