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
  getAllocations, 
  runAllocation,
  activateAllocation,
  deactivateAllocation
} from "@/lib/services"
import type { Allocation } from "@/lib/types"
import { formatDate } from "@/lib/utils"

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
}

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
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const loadData = async () => {
    setLoading(true)
    const statusFilter = activeTab === "all" ? undefined : [activeTab]
    const result = await getAllocations(statusFilter)
    setAllocations(result)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [activeTab])

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

  const metrics = {
    total: allocations.length,
    active: allocations.filter(a => a.status === 'active').length,
    draft: allocations.filter(a => a.status === 'draft').length,
    byPercentage: allocations.filter(a => a.method === 'percentage').length,
  }

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
          <MetricCard
            title="Total Rules"
            value={metrics.total}
            icon={<GitBranch className="h-4 w-4" />}
          />
          <MetricCard
            title="Active"
            value={metrics.active}
            icon={<CheckCircle className="h-4 w-4" />}
          />
          <MetricCard
            title="Draft"
            value={metrics.draft}
            icon={<FileText className="h-4 w-4" />}
          />
          <MetricCard
            title="Percentage Based"
            value={metrics.byPercentage}
            icon={<Percent className="h-4 w-4" />}
          />
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
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
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
                        <Badge className={statusColors[allocation.status]} variant="secondary">
                          {allocation.status}
                        </Badge>
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
