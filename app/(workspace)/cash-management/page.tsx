"use client"

import { useEffect, useState } from "react"
import { ModuleOverview } from "@/components/finance/module-overview"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { getCashManagementOverview } from "@/lib/services"
import type { ModuleOverviewData } from "@/lib/types"

export default function CashManagementLandingPage() {
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [overview, setOverview] = useState<ModuleOverviewData | null>(null)

  useEffect(() => {
    if (!activeEntity || !dateRange) {
      return
    }

    getCashManagementOverview({
      entityId: activeEntity.id,
      dateRange,
    }).then(setOverview)
  }, [activeEntity, dateRange])

  if (!overview) {
    return null
  }

  return <ModuleOverview overview={overview} />
}
