"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface SideDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  side?: 'left' | 'right'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function SideDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = 'right',
  size = 'md',
  className,
}: SideDrawerProps) {
  const sizeClasses = {
    sm: 'w-[320px]',
    md: 'w-[440px]',
    lg: 'w-[560px]',
    xl: 'w-[720px]',
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={cn(sizeClasses[size], "p-0", className)}>
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="px-6 py-4 overflow-y-auto h-[calc(100vh-5rem)]">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
