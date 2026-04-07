"use client"

import { useEffect, useState } from "react"
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import {
  StubModuleSurface,
  WorkspaceBreadcrumbRow,
  WorkspaceContentContainer,
  WorkspacePageToolbar,
} from "@/components/layout/workspace-primitives"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { getStubPage } from "@/lib/services"
import type { ShellStubPage } from "@/lib/types"

export function ShellStubRoute({ pathname }: { pathname: string }) {
  const { activeRole } = useWorkspaceShell()
  const [page, setPage] = useState<ShellStubPage | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPage() {
      if (!activeRole) {
        return
      }

      const stubPage = await getStubPage(pathname, activeRole.id)
      if (!cancelled) {
        setPage(stubPage)
      }
    }

    loadPage()

    return () => {
      cancelled = true
    }
  }, [activeRole, pathname])

  if (!page) {
    return null
  }

  return (
    <WorkspaceContentContainer>
      <div className="space-y-5">
        <WorkspacePageToolbar>
          <WorkspaceBreadcrumbRow>
            <Breadcrumbs />
          </WorkspaceBreadcrumbRow>
        </WorkspacePageToolbar>
        <StubModuleSurface page={page} />
      </div>
    </WorkspaceContentContainer>
  )
}
