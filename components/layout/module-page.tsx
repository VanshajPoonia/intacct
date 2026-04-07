"use client"

import { AppShell } from "./app-shell"
import { Breadcrumbs, type BreadcrumbItem } from "@/components/navigation/breadcrumbs"
import {
  DenseSectionHeader,
  WorkspaceBreadcrumbRow,
  WorkspacePageToolbar,
} from "@/components/layout/workspace-primitives"

interface ModulePageProps {
  title: string
  description?: string
  breadcrumbs: BreadcrumbItem[]
  children: React.ReactNode
  actions?: React.ReactNode
}

export function ModulePage({ 
  title, 
  description, 
  breadcrumbs, 
  children, 
  actions 
}: ModulePageProps) {
  return (
    <AppShell>
      <div className="space-y-5">
        <WorkspacePageToolbar>
          <WorkspaceBreadcrumbRow>
            <Breadcrumbs items={breadcrumbs} />
          </WorkspaceBreadcrumbRow>
        </WorkspacePageToolbar>
        <DenseSectionHeader title={title} description={description} actions={actions} />
        {children}
      </div>
    </AppShell>
  )
}
