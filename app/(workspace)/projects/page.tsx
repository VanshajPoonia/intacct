// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/finance/page-header"
import { MetricCard } from "@/components/finance/metric-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { getProjectDetails, updateProjectStatus } from "@/lib/services"
import type { ProjectDetail } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

const statusColors: Record<string, string> = {
  planning: "bg-muted text-muted-foreground",
  active: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  on_hold: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const loadData = async () => {
    setLoading(true)
    const statusFilterValues = activeTab === "all" ? undefined : [activeTab]
    const result = await getProjectDetails(statusFilterValues, undefined, search || undefined)
    setProjects(result.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [activeTab, search])

  const handleStatusChange = async (id: string, status: ProjectDetail['status']) => {
    await updateProjectStatus(id, status)
    loadData()
  }

  const metrics = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
    totalRevenue: projects.reduce((sum, p) => sum + p.revenue, 0),
    avgMargin: projects.length > 0 
      ? projects.reduce((sum, p) => sum + p.profitMargin, 0) / projects.length 
      : 0,
  }

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Projects"
          description="Manage projects, budgets, and profitability"
          actions={
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Link>
            </Button>
          }
        />

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Projects"
            value={metrics.total}
            icon={<FolderKanban className="h-4 w-4" />}
          />
          <MetricCard
            title="Active Projects"
            value={metrics.active}
            icon={<PlayCircle className="h-4 w-4" />}
          />
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <MetricCard
            title="Avg Profit Margin"
            value={`${metrics.avgMargin.toFixed(1)}%`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
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
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="planning">Planning</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="on_hold">On Hold</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
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
                      <TableCell>{project.customerName || '-'}</TableCell>
                      <TableCell>{project.managerName}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[project.status]} variant="secondary">
                          {project.status.replace(/_/g, ' ')}
                        </Badge>
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
