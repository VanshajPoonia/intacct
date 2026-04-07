"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/finance/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Building2,
} from "lucide-react"
import { toast } from "sonner"
import type { Entity } from "@/lib/types"
import { 
  getAccountingPeriods, 
  getEntities,
  closePeriod,
  reopenPeriod,
  lockPeriod,
  unlockPeriod,
} from "@/lib/services"

interface AccountingPeriod {
  id: string
  name: string
  fiscalYear: number
  periodNumber: number
  startDate: Date
  endDate: Date
  status: 'open' | 'closed' | 'locked' | 'future'
  entityId: string
  closedBy?: string
  closedAt?: Date
  lockedBy?: string
  lockedAt?: Date
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Open', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
  closed: { label: 'Closed', color: 'bg-blue-100 text-blue-800', icon: <XCircle className="h-4 w-4" /> },
  locked: { label: 'Locked', color: 'bg-slate-100 text-slate-800', icon: <Lock className="h-4 w-4" /> },
  future: { label: 'Future', color: 'bg-muted text-muted-foreground', icon: <Clock className="h-4 w-4" /> },
}

export default function AccountingPeriodsPage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string>('e4')
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [periods, setPeriods] = useState<AccountingPeriod[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: 'close' | 'reopen' | 'lock' | 'unlock'
    period: AccountingPeriod | null
  }>({ open: false, action: 'close', period: null })
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [entitiesData, periodsData] = await Promise.all([
        getEntities(),
        getAccountingPeriods(selectedEntity, selectedYear)
      ])
      setEntities(entitiesData)
      setPeriods(periodsData)
    } finally {
      setLoading(false)
    }
  }, [selectedEntity, selectedYear])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAction = async () => {
    if (!confirmDialog.period) return
    
    setActionLoading(true)
    try {
      let result: { success: boolean }
      const periodName = confirmDialog.period.name
      
      switch (confirmDialog.action) {
        case 'close':
          result = await closePeriod(confirmDialog.period.id)
          if (result.success) toast.success(`${periodName} has been closed`)
          break
        case 'reopen':
          result = await reopenPeriod(confirmDialog.period.id)
          if (result.success) toast.success(`${periodName} has been reopened`)
          break
        case 'lock':
          result = await lockPeriod(confirmDialog.period.id)
          if (result.success) toast.success(`${periodName} has been locked`)
          break
        case 'unlock':
          result = await unlockPeriod(confirmDialog.period.id)
          if (result.success) toast.success(`${periodName} has been unlocked`)
          break
      }
      
      setConfirmDialog({ open: false, action: 'close', period: null })
      loadData()
    } finally {
      setActionLoading(false)
    }
  }

  const getActionConfig = () => {
    switch (confirmDialog.action) {
      case 'close':
        return {
          title: 'Close Period',
          description: `Are you sure you want to close ${confirmDialog.period?.name}? This will prevent new transactions from being posted to this period.`,
          buttonText: 'Close Period',
          buttonVariant: 'default' as const,
        }
      case 'reopen':
        return {
          title: 'Reopen Period',
          description: `Are you sure you want to reopen ${confirmDialog.period?.name}? This will allow new transactions to be posted to this period.`,
          buttonText: 'Reopen Period',
          buttonVariant: 'default' as const,
        }
      case 'lock':
        return {
          title: 'Lock Period',
          description: `Are you sure you want to lock ${confirmDialog.period?.name}? This will permanently prevent any changes to this period. Only administrators can unlock a locked period.`,
          buttonText: 'Lock Period',
          buttonVariant: 'destructive' as const,
        }
      case 'unlock':
        return {
          title: 'Unlock Period',
          description: `Are you sure you want to unlock ${confirmDialog.period?.name}? This will change the status back to closed and allow modifications.`,
          buttonText: 'Unlock Period',
          buttonVariant: 'default' as const,
        }
    }
  }

  // Calculate summary stats
  const stats = {
    open: periods.filter(p => p.status === 'open').length,
    closed: periods.filter(p => p.status === 'closed').length,
    locked: periods.filter(p => p.status === 'locked').length,
    future: periods.filter(p => p.status === 'future').length,
  }

  const years = [2024, 2023, 2022]

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Accounting Periods"
          description="Manage fiscal periods for transaction posting"
        />

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map(entity => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        FY {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-2xl font-semibold">{loading ? '-' : stats.open}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <XCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Closed</p>
                  <p className="text-2xl font-semibold">{loading ? '-' : stats.closed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Lock className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Locked</p>
                  <p className="text-2xl font-semibold">{loading ? '-' : stats.locked}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Future</p>
                  <p className="text-2xl font-semibold">{loading ? '-' : stats.future}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Periods Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Fiscal Year {selectedYear} Periods</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : periods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No periods found for the selected criteria
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Closed By</TableHead>
                    <TableHead>Closed Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map(period => {
                    const status = statusConfig[period.status]
                    return (
                      <TableRow key={period.id}>
                        <TableCell className="font-medium">{period.name}</TableCell>
                        <TableCell>{format(new Date(period.startDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(new Date(period.endDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <Badge className={`${status.color} gap-1`} variant="secondary">
                            {status.icon}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{period.closedBy || '-'}</TableCell>
                        <TableCell>
                          {period.closedAt ? format(new Date(period.closedAt), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {period.status === 'open' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setConfirmDialog({ open: true, action: 'close', period })}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Close
                              </Button>
                            )}
                            {period.status === 'closed' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setConfirmDialog({ open: true, action: 'reopen', period })}
                                >
                                  <Unlock className="h-4 w-4 mr-1" />
                                  Reopen
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setConfirmDialog({ open: true, action: 'lock', period })}
                                >
                                  <Lock className="h-4 w-4 mr-1" />
                                  Lock
                                </Button>
                              </>
                            )}
                            {period.status === 'locked' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setConfirmDialog({ open: true, action: 'unlock', period })}
                              >
                                <Unlock className="h-4 w-4 mr-1" />
                                Unlock
                              </Button>
                            )}
                            {period.status === 'future' && (
                              <span className="text-sm text-muted-foreground">No actions available</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                {getActionConfig()?.title}
              </DialogTitle>
              <DialogDescription>
                {getActionConfig()?.description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
                Cancel
              </Button>
              <Button 
                variant={getActionConfig()?.buttonVariant}
                onClick={handleAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : getActionConfig()?.buttonText}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
