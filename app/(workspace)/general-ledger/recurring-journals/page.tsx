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
  RefreshCcw, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Play,
  Pause,
  PlayCircle,
  Calendar,
  Clock,
  FileText
} from "lucide-react"
import { 
  getRecurringJournalsWorkspaceList, 
  runRecurringJournal,
  pauseRecurringJournal,
  resumeRecurringJournal
} from "@/lib/services"
import type { FinanceFilters, RecurringJournal } from "@/lib/types"
import { formatDate, formatCurrency } from "@/lib/utils"

const frequencyLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
}

export default function RecurringJournalsPage() {
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof getRecurringJournalsWorkspaceList>> | null>(null)
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
    const result = await getRecurringJournalsWorkspaceList(shellFilters, {
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
    await runRecurringJournal(id)
    loadData()
  }

  const handlePause = async (id: string) => {
    await pauseRecurringJournal(id)
    loadData()
  }

  const handleResume = async (id: string) => {
    await resumeRecurringJournal(id)
    loadData()
  }

  const journals = workspace?.data ?? []
  const metrics = workspace?.metrics ?? []
  const tabs = workspace?.tabs ?? []

  const getTotalAmount = (journal: RecurringJournal) => {
    return journal.templateLines.reduce((sum, line) => sum + line.debit, 0)
  }

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Recurring Journals"
          description="Manage automated journal entries"
          breadcrumbs={[
            { label: "General Ledger", href: "/general-ledger" },
            { label: "Recurring Journals" },
          ]}
          actions={
            <Button asChild>
              <Link href="/general-ledger/recurring-journals/new">
                <Plus className="h-4 w-4 mr-2" />
                New Recurring Journal
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
                index === 0 ? <RefreshCcw className="h-4 w-4" /> :
                index === 1 ? <PlayCircle className="h-4 w-4" /> :
                index === 2 ? <Pause className="h-4 w-4" /> :
                <Calendar className="h-4 w-4" />
              }
              trend={metric.tone === "positive" ? "up" : metric.tone === "warning" ? "attention" : undefined}
            />
          ))}
        </div>

        {/* Journals Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Recurring Journal Templates</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
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
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Run Count</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
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
                ) : journals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No recurring journals found
                    </TableCell>
                  </TableRow>
                ) : (
                  journals.map((journal) => (
                    <TableRow key={journal.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{journal.name}</span>
                          {journal.description && (
                            <p className="text-xs text-muted-foreground">{journal.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{frequencyLabels[journal.frequency]}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(journal.nextRunDate)}</TableCell>
                      <TableCell>{journal.lastRunDate ? formatDate(journal.lastRunDate) : '-'}</TableCell>
                      <TableCell>{journal.runCount}</TableCell>
                      <TableCell>
                        <StatusBadge status={journal.status} />
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(getTotalAmount(journal))}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/general-ledger/recurring-journals/${journal.id}`}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {journal.status === 'active' && (
                              <>
                                <DropdownMenuItem onClick={() => handleRun(journal.id)}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Run Now
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePause(journal.id)}>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause
                                </DropdownMenuItem>
                              </>
                            )}
                            {journal.status === 'paused' && (
                              <DropdownMenuItem onClick={() => handleResume(journal.id)}>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Resume
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
