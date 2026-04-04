"use client"

import { AppShell } from "@/components/layout/app-shell"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default function DashboardPage() {
  return (
    <AppShell showUtilityRail>
      <DashboardContent />
    </AppShell>
  )
}
