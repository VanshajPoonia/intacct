"use client"

import { useEffect, useState } from "react"
import { ModuleOverview } from "@/components/finance/module-overview"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { getAccountsPayableOverview } from "@/lib/services"
import type { ModuleOverviewData } from "@/lib/types"

export default function AccountsPayableLandingPage() {
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [overview, setOverview] = useState<ModuleOverviewData | null>(null)

  useEffect(() => {
    if (!activeEntity || !dateRange) {
      return
    }

    getAccountsPayableOverview({
      entityId: activeEntity.id,
      dateRange,
    }).then(setOverview)
  }, [activeEntity, dateRange])

  if (!overview) {
    return null
  }

  return <ModuleOverview overview={overview} />
}
