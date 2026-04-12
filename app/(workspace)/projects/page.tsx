// @ts-nocheck
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { PageHeader } from "@/components/finance/page-header"
import { MetricCard } from "@/components/finance/metric-card"
import { StatusBadge } from "@/components/finance/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
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
  FolderKanban, 
  Plus, 
  Search, 
  MoreHorizontal, 
  FileText, 
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  PlayCircle,
  PauseCircle,
  CheckCircle2
} from "lucide-react"
import { getProjectsWorkspace, updateProjectStatus } from "@/lib/services"
import type { FinanceFilters, ProjectDetail } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function ProjectsPage() {
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof getProjectsWorkspace>> | null>(null)
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
    const result = await getProjectsWorkspace(shellFilters, {
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

  const handleStatusChange = async (id: string, status: ProjectDetail['status']) => {
    await updateProjectStatus(id, status)
    loadData()
  }

  const projects = workspace?.data ?? []
  const metrics = workspace?.metrics ?? []
  const tabs = workspace?.tabs ?? []
  const headerActions = workspace?.actions ?? []

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Projects"
          description={activeEntity ? `Manage projects, budgets, and profitability for ${activeEntity.name}` : "Manage projects, budgets, and profitability"}
          actions={
            <div className="flex gap-2">
              {headerActions.slice(1).map(action => (
                <Button key={action.id} variant="outline" asChild>
                  <Link href={action.href ?? "/projects"}>{action.label}</Link>
                </Button>
              ))}
              <Button asChild>
                <Link href="/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Link>
              </Button>
            </div>
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
                index === 0 ? <FolderKanban className="h-4 w-4" /> :
                index === 1 ? <DollarSign className="h-4 w-4" /> :
                index === 2 ? <TrendingUp className="h-4 w-4" /> :
                <Users className="h-4 w-4" />
              }
              trend={metric.tone === "positive" ? "up" : metric.tone === "critical" ? "down" : metric.tone === "warning" ? "attention" : undefined}
            />
          ))}
        </div>

        {/* Projects Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">All Projects</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
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
                  <TableHead>Project</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
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
                ) : projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => (
                    <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                            {project.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{project.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.customerId ? (
                          <Link href={`/accounts-receivable/customers/${project.customerId}`} className="text-muted-foreground transition-colors hover:text-foreground hover:underline">
                            {project.customerName}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{project.managerName}</TableCell>
                      <TableCell>
                        <StatusBadge status={project.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={project.percentComplete} className="h-2 w-16" />
                          <span className="text-xs text-muted-foreground">{project.percentComplete}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(project.budget)}</TableCell>
                      <TableCell className="text-right">
                        <span className={project.profitMargin >= 20 ? "text-green-600" : project.profitMargin >= 10 ? "text-amber-600" : "text-muted-foreground"}>
                          {project.profitMargin.toFixed(1)}%
                        </span>
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
                              <Link href={`/projects/${project.id}`}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {project.status === 'planning' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'active')}>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Start Project
                              </DropdownMenuItem>
                            )}
                            {project.status === 'active' && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'on_hold')}>
                                  <PauseCircle className="h-4 w-4 mr-2" />
                                  Put On Hold
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'completed')}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Mark Complete
                                </DropdownMenuItem>
                              </>
                            )}
                            {project.status === 'on_hold' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'active')}>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Resume Project
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
