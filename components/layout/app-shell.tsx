"use client"

import type { ReactNode } from "react"
import { WorkspaceShell } from "@/components/layout/workspace-shell"
import { WorkspaceShellProvider, useWorkspaceShellOptional } from "@/components/layout/workspace-shell-provider"
import { WorkspaceContentContainer } from "@/components/layout/workspace-primitives"

interface AppShellProps {
  children: ReactNode
  showUtilityRail?: boolean
}

function AppShellContent({ children }: { children: ReactNode }) {
  const shell = useWorkspaceShellOptional()

  if (shell?.isInsideSharedShell) {
    return <WorkspaceContentContainer>{children}</WorkspaceContentContainer>
  }

  return (
    <WorkspaceShellProvider>
      <WorkspaceShell>
        <WorkspaceContentContainer>{children}</WorkspaceContentContainer>
      </WorkspaceShell>
    </WorkspaceShellProvider>
  )
}

export function AppShell({ children }: AppShellProps) {
  return <AppShellContent>{children}</AppShellContent>
}
