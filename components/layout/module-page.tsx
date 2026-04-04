"use client"

import { AppShell } from "./app-shell"
import { Breadcrumbs, type BreadcrumbItem } from "@/components/navigation/breadcrumbs"
import { PageHeader } from "@/components/finance/page-header"

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
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbs} />
        <PageHeader title={title} description={description}>
          {actions}
        </PageHeader>
        {children}
      </div>
    </AppShell>
  )
}
