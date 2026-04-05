"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/finance/page-header"
import { MetricCard } from "@/components/finance/metric-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Network, 
  Building2, 
  ArrowRightLeft,
  FileText,
  Globe,
  Plus,
  Search,
  ExternalLink
} from "lucide-react"
import { getEntities } from "@/lib/services"
import type { Entity } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

interface IntercompanyTransaction {
  id: string
  fromEntity: string
  toEntity: string
  type: string
  amount: number
  date: Date
  status: string
}

interface EliminationEntry {
  id: string
  period: string
  type: string
  amount: number
  status: string
}

const mockIntercompanyTransactions: IntercompanyTransaction[] = [
  { id: 'ic-1', fromEntity: 'Acme Corp (US)', toEntity: 'Acme Corp (UK)', type: 'Management Fee', amount: 125000, date: new Date('2024-03-15'), status: 'posted' },
  { id: 'ic-2', fromEntity: 'Acme Corp (UK)', toEntity: 'Acme Corp (DE)', type: 'Intercompany Loan', amount: 500000, date: new Date('2024-03-10'), status: 'posted' },
  { id: 'ic-3', fromEntity: 'Acme Corp (DE)', toEntity: 'Acme Corp (US)', type: 'Cost Allocation', amount: 75000, date: new Date('2024-03-05'), status: 'pending' },
]

const mockEliminations: EliminationEntry[] = [
  { id: 'el-1', period: 'Mar 2024', type: 'Intercompany Revenue', amount: 325000, status: 'posted' },
  { id: 'el-2', period: 'Mar 2024', type: 'Intercompany Payables', amount: 500000, status: 'posted' },
  { id: 'el-3', period: 'Mar 2024', type: 'Management Fees', amount: 125000, status: 'draft' },
]

export default function MultiEntityPage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  const loadData = async () => {
    setLoading(true)
    const result = await getEntities()
    setEntities(result)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const metrics = {
    total: entities.length,
    active: entities.filter(e => e.status === 'active').length,
    intercompanyBalance: mockIntercompanyTransactions.reduce((sum, t) => sum + t.amount, 0),
    pendingEliminations: mockEliminations.filter(e => e.status === 'draft').length,
  }

  const filteredEntities = entities.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Multi-Entity Management"
          description="Manage entities, intercompany transactions, and consolidation"
          actions={
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Entity</DialogTitle>
                  <DialogDescription>
                    Create a new legal entity in your organizational structure.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Entity Name</label>
                    <Input placeholder="Enter entity name" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Entity Code</label>
                    <Input placeholder="e.g., ACME-US" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Base Currency</label>
                    <Input placeholder="e.g., USD" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Entity</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Entities"
            value={loading ? "-" : metrics.total.toString()}
            icon={<Building2 className="h-4 w-4" />}
          />
          <MetricCard
            title="Active Entities"
            value={loading ? "-" : metrics.active.toString()}
            icon={<Globe className="h-4 w-4" />}
          />
          <MetricCard
            title="Intercompany Volume"
            value={formatCurrency(metrics.intercompanyBalance)}
            icon={<ArrowRightLeft className="h-4 w-4" />}
          />
          <MetricCard
            title="Pending Eliminations"
            value={metrics.pendingEliminations.toString()}
            icon={<FileText className="h-4 w-4" />}
            trend={metrics.pendingEliminations > 0 ? "attention" : undefined}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="entities">Entities</TabsTrigger>
            <TabsTrigger value="intercompany">Intercompany</TabsTrigger>
            <TabsTrigger value="eliminations">Eliminations</TabsTrigger>
            <TabsTrigger value="consolidation">Consolidation</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveTab("intercompany")}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Intercompany Transactions</CardTitle>
                      <CardDescription>Record and track intercompany activity</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveTab("eliminations")}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Eliminations</CardTitle>
                      <CardDescription>Manage elimination entries</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveTab("consolidation")}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Network className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Consolidation</CardTitle>
                      <CardDescription>Run consolidated reports</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Recent Intercompany Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Recent Intercompany Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockIntercompanyTransactions.slice(0, 3).map(tx => (
                      <TableRow key={tx.id}>
                        <TableCell>{formatDate(tx.date)}</TableCell>
                        <TableCell>{tx.fromEntity}</TableCell>
                        <TableCell>{tx.toEntity}</TableCell>
                        <TableCell>{tx.type}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={tx.status === 'posted' 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            }
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(tx.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Entities Tab */}
          <TabsContent value="entities" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Entities</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Search entities..." 
                      className="pl-9" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredEntities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No entities found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEntities.map((entity) => (
                        <TableRow key={entity.id}>
                          <TableCell className="font-medium">{entity.name}</TableCell>
                          <TableCell>{entity.code}</TableCell>
                          <TableCell>{entity.currency}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary"
                              className={entity.status === 'active' 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-muted text-muted-foreground"
                              }
                            >
                              {entity.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Intercompany Tab */}
          <TabsContent value="intercompany" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Intercompany Transactions</CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Transaction
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>From Entity</TableHead>
                      <TableHead>To Entity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockIntercompanyTransactions.map(tx => (
                      <TableRow key={tx.id}>
                        <TableCell>{formatDate(tx.date)}</TableCell>
                        <TableCell>{tx.fromEntity}</TableCell>
                        <TableCell>{tx.toEntity}</TableCell>
                        <TableCell>{tx.type}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={tx.status === 'posted' 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            }
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(tx.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Eliminations Tab */}
          <TabsContent value="eliminations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Elimination Entries</CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Elimination
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockEliminations.map(el => (
                      <TableRow key={el.id}>
                        <TableCell>{el.period}</TableCell>
                        <TableCell>{el.type}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={el.status === 'posted' 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                            }
                          >
                            {el.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(el.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consolidation Tab */}
          <TabsContent value="consolidation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Consolidation Reports</CardTitle>
                <CardDescription>Generate consolidated financial statements across entities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">Consolidated Balance Sheet</p>
                        <p className="text-sm text-muted-foreground">Combined position across all entities</p>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">Consolidated Income Statement</p>
                        <p className="text-sm text-muted-foreground">Combined P&L with eliminations</p>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <ArrowRightLeft className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium">Intercompany Reconciliation</p>
                        <p className="text-sm text-muted-foreground">Verify balances between entities</p>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Network className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium">Elimination Report</p>
                        <p className="text-sm text-muted-foreground">Summary of elimination entries</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
