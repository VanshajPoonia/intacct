// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/finance/page-header"
import { MetricCard } from "@/components/finance/metric-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Network, 
  Building2, 
  ArrowRightLeft,
  FileText,
  Globe,
  DollarSign,
  Plus
} from "lucide-react"
import { getEntities } from "@/lib/services"
import type { Entity } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

export default function MultiEntityPage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)

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
  }

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Multi-Entity Management"
          description="Manage entities, intercompany transactions, and consolidation"
          actions={
            <Button asChild>
              <Link href="/multi-entity/entities/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Entity
              </Link>
            </Button>
          }
        />

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Entities"
            value={metrics.total}
            icon={<Building2 className="h-4 w-4" />}
          />
          <MetricCard
            title="Active Entities"
            value={metrics.active}
            icon={<Globe className="h-4 w-4" />}
          />
          <MetricCard
            title="Intercompany Balance"
            value={formatCurrency(0)}
            icon={<ArrowRightLeft className="h-4 w-4" />}
          />
          <MetricCard
            title="Pending Eliminations"
            value={0}
            icon={<FileText className="h-4 w-4" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <Link href="/multi-entity/intercompany">
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
            </Link>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <Link href="/multi-entity/eliminations">
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
            </Link>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <Link href="/multi-entity/consolidation">
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
            </Link>
          </Card>
        </div>

        {/* Entities List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Entities</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/multi-entity/entities">Manage Entities</Link>
              </Button>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : entities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No entities found
                    </TableCell>
                  </TableRow>
                ) : (
                  entities.map((entity) => (
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
