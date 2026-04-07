"use client"

import type { ReactNode } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { WorkspaceFrame } from "@/components/layout/workspace-primitives"
import { CommandPalette } from "@/components/navigation/command-palette"
import { ModuleNav } from "@/components/navigation/module-nav"

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceFrame>
      <AppHeader />
      <ModuleNav />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
      <CommandPalette />
    </WorkspaceFrame>
  )
}
