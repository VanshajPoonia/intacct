// @ts-nocheck
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { PageHeader } from "@/components/finance/page-header"
import { MetricCard } from "@/components/finance/metric-card"
import { StatusBadge } from "@/components/finance/status-badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  GitBranch, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Play,
  CheckCircle,
  XCircle,
  FileText,
  Percent,
  DollarSign,
  BarChart3
} from "lucide-react"
import { 
  getAllocationsWorkspaceList,
  runAllocation,
  activateAllocation,
  deactivateAllocation
} from "@/lib/services"
import type { Allocation, FinanceFilters } from "@/lib/types"
import { formatDate } from "@/lib/utils"

const methodLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  fixed: { label: "Fixed Amount", icon: <DollarSign className="h-3 w-3" /> },
  percentage: { label: "Percentage", icon: <Percent className="h-3 w-3" /> },
  statistical: { label: "Statistical", icon: <BarChart3 className="h-3 w-3" /> },
}

const frequencyLabels: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  on_demand: "On Demand",
}

export default function AllocationsPage() {
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof getAllocationsWorkspaceList>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const shellFilters = useMemo<FinanceFilters | null>(() => {
    if (!activeEntity || !dateRange) {
      return null
    }

    return {
      entityId: activeEntity.id,
      dateRange,
    }
  }, [activeEntity, dateRange])

  const loadData = useCallback(async () => {
    if (!shellFilters) {
      return
    }

    setLoading(true)
    const result = await getAllocationsWorkspaceList(shellFilters, {
      status: activeTab,
      search,
      page: 1,
      pageSize: 50,
    })
    setWorkspace(result)
    setLoading(false)
  }, [activeTab, search, shellFilters])

  useEffect(() => {
    if (!shellFilters) {
      return
    }

    loadData()
  }, [loadData, shellFilters])

  const handleRun = async (id: string) => {
    await runAllocation(id)
    loadData()
  }

  const handleActivate = async (id: string) => {
    await activateAllocation(id)
    loadData()
  }

  const handleDeactivate = async (id: string) => {
    await deactivateAllocation(id)
    loadData()
  }

  const allocations = workspace?.data ?? []
  const metrics = workspace?.metrics ?? []
  const tabs = workspace?.tabs ?? []

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Allocations"
          description="Manage cost allocation rules and run allocations"
          breadcrumbs={[
            { label: "General Ledger", href: "/general-ledger" },
            { label: "Allocations" },
          ]}
          actions={
            <Button asChild>
              <Link href="/general-ledger/allocations/new">
                <Plus className="h-4 w-4 mr-2" />
                New Allocation
              </Link>
            </Button>
          }
        />

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric, index) => (
            <MetricCard
              key={metric.id}
              title={metric.label}
              value={metric.value}
              icon={
                index === 0 ? <GitBranch className="h-4 w-4" /> :
                index === 1 ? <CheckCircle className="h-4 w-4" /> :
                index === 2 ? <FileText className="h-4 w-4" /> :
                <Percent className="h-4 w-4" />
              }
              trend={metric.tone === "positive" ? "up" : metric.tone === "warning" ? "attention" : undefined}
            />
          ))}
        </div>

        {/* Allocations Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Allocation Rules</CardTitle>
                <CardDescription>Define how costs are distributed across departments</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                    {typeof tab.count === "number" ? ` (${tab.count})` : ""}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source Account</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Targets</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : allocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No allocations found
                    </TableCell>
                  </TableRow>
                ) : (
                  allocations.map((allocation) => (
                    <TableRow key={allocation.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{allocation.name}</span>
                          {allocation.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {allocation.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{allocation.sourceAccountName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {methodLabels[allocation.method].icon}
                          {methodLabels[allocation.method].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {allocation.targets.slice(0, 2).map((target) => (
                            <Badge key={target.id} variant="secondary" className="text-xs">
                              {target.departmentName || target.accountName}
                            </Badge>
                          ))}
                          {allocation.targets.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{allocation.targets.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{frequencyLabels[allocation.frequency]}</TableCell>
                      <TableCell>
                        {allocation.lastRunDate ? formatDate(allocation.lastRunDate) : '-'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={allocation.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/general-ledger/allocations/${allocation.id}`}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {allocation.status === 'active' && (
                              <>
                                <DropdownMenuItem onClick={() => handleRun(allocation.id)}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Run Now
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeactivate(allocation.id)}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              </>
                            )}
                            {allocation.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleActivate(allocation.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {allocation.status === 'inactive' && (
                              <DropdownMenuItem onClick={() => handleActivate(allocation.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
