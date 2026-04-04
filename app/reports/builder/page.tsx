"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { 
  Plus, 
  Play, 
  Save, 
  Star,
  StarOff,
  Trash2,
  FileText,
  BarChart3,
  PieChart,
  Table2,
  Calendar,
  Clock,
  MoreHorizontal,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getSavedReports, saveReport, deleteReport, toggleReportFavorite, getEntities, type SavedReport } from "@/lib/services"
import type { Entity } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const REPORT_TYPES = [
  { value: 'balance_sheet', label: 'Balance Sheet', icon: FileText, path: '/reports/balance-sheet' },
  { value: 'income_statement', label: 'Income Statement', icon: BarChart3, path: '/reports/income-statement' },
  { value: 'cash_flow', label: 'Cash Flow Statement', icon: PieChart, path: '/reports/cash-flow' },
  { value: 'budget_vs_actual', label: 'Budget vs Actual', icon: Table2, path: '/reports/budget-vs-actual' },
  { value: 'trial_balance', label: 'Trial Balance', icon: FileText, path: '/general-ledger/reports/trial-balance' },
]

const COLUMN_OPTIONS = [
  { value: 'account', label: 'Account Name' },
  { value: 'current', label: 'Current Period' },
  { value: 'previous', label: 'Previous Period' },
  { value: 'variance', label: 'Variance ($)' },
  { value: 'variance_pct', label: 'Variance (%)' },
  { value: 'budget', label: 'Budget' },
  { value: 'actual', label: 'Actual' },
  { value: 'ytd', label: 'Year to Date' },
]

const DATE_PRESETS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'last_year', label: 'Last Year' },
]

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export default function ReportBuilderPage() {
  const router = useRouter()
  
  // Data state
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newReportName, setNewReportName] = useState("")
  const [newReportType, setNewReportType] = useState<string>("")
  const [newReportEntity, setNewReportEntity] = useState("e4")
  const [newReportPeriod, setNewReportPeriod] = useState("this_year")
  const [newReportColumns, setNewReportColumns] = useState<string[]>(['account', 'current', 'previous', 'variance'])

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    const [reportsData, entitiesData] = await Promise.all([
      getSavedReports(),
      getEntities(),
    ])
    
    setSavedReports(reportsData)
    setEntities(entitiesData)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateReport = async () => {
    if (!newReportName || !newReportType) return
    
    await saveReport({
      name: newReportName,
      type: newReportType as SavedReport['type'],
      filters: {
        entityId: newReportEntity,
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          preset: newReportPeriod as 'this_month' | 'this_quarter' | 'this_year' | 'custom',
        },
      },
      columns: newReportColumns,
    })
    
    setCreateModalOpen(false)
    setNewReportName("")
    setNewReportType("")
    setNewReportColumns(['account', 'current', 'previous', 'variance'])
    fetchData()
  }

  const handleRunReport = (report: SavedReport) => {
    const reportType = REPORT_TYPES.find(t => t.value === report.type)
    if (reportType) {
      router.push(reportType.path)
    }
  }

  const handleDeleteReport = async (id: string) => {
    await deleteReport(id)
    fetchData()
  }

  const handleToggleFavorite = async (id: string) => {
    await toggleReportFavorite(id)
    fetchData()
  }

  const handleColumnToggle = (column: string) => {
    if (newReportColumns.includes(column)) {
      setNewReportColumns(newReportColumns.filter(c => c !== column))
    } else {
      setNewReportColumns([...newReportColumns, column])
    }
  }

  const favoriteReports = savedReports.filter(r => r.isFavorite)
  const recentReports = savedReports.filter(r => r.lastRunAt).sort((a, b) => 
    new Date(b.lastRunAt!).getTime() - new Date(a.lastRunAt!).getTime()
  ).slice(0, 5)

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Report Builder</h1>
            <p className="text-sm text-muted-foreground">
              Create, customize, and manage your financial reports
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-5 gap-4">
          {REPORT_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <Card 
                key={type.value}
                className="cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                onClick={() => router.push(type.path)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{type.label}</span>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Favorites */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                Favorite Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))
              ) : favoriteReports.length > 0 ? (
                favoriteReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{report.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {report.type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleRunReport(report)}>
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No favorite reports yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recently Run
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))
              ) : recentReports.length > 0 ? (
                recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{report.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {report.lastRunAt ? formatDate(report.lastRunAt) : 'Never run'}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleRunReport(report)}>
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No recent reports
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Reports</span>
                <Badge variant="secondary">{savedReports.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Favorites</span>
                <Badge variant="secondary">{favoriteReports.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Report Types</span>
                <Badge variant="secondary">{REPORT_TYPES.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Saved Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Saved Reports</CardTitle>
            <CardDescription>
              Manage and run your saved report configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : savedReports.length > 0 ? (
              <div className="divide-y rounded-lg border">
                {savedReports.map((report) => {
                  const reportType = REPORT_TYPES.find(t => t.value === report.type)
                  const Icon = reportType?.icon || FileText
                  
                  return (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {report.name}
                            {report.isFavorite && (
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3">
                            <span className="capitalize">{report.type.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>Created by {report.createdBy}</span>
                            <span>•</span>
                            <span>{formatDate(report.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => handleRunReport(report)}>
                          <Play className="h-4 w-4 mr-2" />
                          Run
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleFavorite(report.id)}>
                              {report.isFavorite ? (
                                <>
                                  <StarOff className="h-4 w-4 mr-2" />
                                  Remove from Favorites
                                </>
                              ) : (
                                <>
                                  <Star className="h-4 w-4 mr-2" />
                                  Add to Favorites
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteReport(report.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No saved reports yet</p>
                <p className="text-sm">Create your first report to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Report Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Report Name</Label>
              <Input
                placeholder="e.g., Monthly P&L Report"
                value={newReportName}
                onChange={(e) => setNewReportName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={newReportType} onValueChange={setNewReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entity</Label>
                <Select value={newReportEntity} onValueChange={setNewReportEntity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={newReportPeriod} onValueChange={setNewReportPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Columns to Include</Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                {COLUMN_OPTIONS.map((col) => (
                  <div key={col.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={col.value}
                      checked={newReportColumns.includes(col.value)}
                      onCheckedChange={() => handleColumnToggle(col.value)}
                    />
                    <label
                      htmlFor={col.value}
                      className="text-sm cursor-pointer"
                    >
                      {col.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReport} disabled={!newReportName || !newReportType}>
              <Save className="h-4 w-4 mr-2" />
              Save Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
