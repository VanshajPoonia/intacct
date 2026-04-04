import type { ReactNode } from "react"
import { WorkspaceShell } from "@/components/layout/workspace-shell"
import { WorkspaceShellProvider } from "@/components/layout/workspace-shell-provider"

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceShellProvider>
      <WorkspaceShell>{children}</WorkspaceShell>
    </WorkspaceShellProvider>
  )
}
