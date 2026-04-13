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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
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
  LineChart,
  TrendingUp,
  Grid3X3,
  Layers,
  Filter,
  SortAsc,
  Eye,
  Settings2,
  ArrowRight,
  GripVertical,
  X,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { getSavedReports, saveReport, deleteReport, toggleReportFavorite, getEntities, getDepartments, type SavedReport, type Department } from "@/lib/services"
import type { Entity } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const REPORT_TYPES = [
  { value: 'balance_sheet', label: 'Balance Sheet', icon: FileText, path: '/reports/balance-sheet', description: 'Assets, liabilities, and equity' },
  { value: 'income_statement', label: 'Income Statement', icon: BarChart3, path: '/reports/income-statement', description: 'Revenue and expenses' },
  { value: 'cash_flow', label: 'Cash Flow Statement', icon: TrendingUp, path: '/reports/cash-flow', description: 'Cash inflows and outflows' },
  { value: 'budget_vs_actual', label: 'Budget vs Actual', icon: Table2, path: '/reports/budget-vs-actual', description: 'Variance analysis' },
  { value: 'trial_balance', label: 'Trial Balance', icon: Grid3X3, path: '/general-ledger/reports/trial-balance', description: 'Account balances' },
  { value: 'custom', label: 'Custom Report', icon: Settings2, path: '/reports/builder', description: 'Build your own' },
]

const BASE_DATASETS = [
  { value: 'gl_transactions', label: 'General Ledger Transactions', description: 'All GL transaction details' },
  { value: 'chart_of_accounts', label: 'Chart of Accounts', description: 'Account master data' },
  { value: 'ap_transactions', label: 'AP Transactions', description: 'Accounts payable details' },
  { value: 'ar_transactions', label: 'AR Transactions', description: 'Accounts receivable details' },
  { value: 'budget_data', label: 'Budget Data', description: 'Budget vs actual by period' },
  { value: 'cash_transactions', label: 'Cash Transactions', description: 'Bank and cash movements' },
]

const COLUMN_OPTIONS = [
  { value: 'account', label: 'Account Name', group: 'Dimensions' },
  { value: 'account_number', label: 'Account Number', group: 'Dimensions' },
  { value: 'department', label: 'Department', group: 'Dimensions' },
  { value: 'entity', label: 'Entity', group: 'Dimensions' },
  { value: 'project', label: 'Project', group: 'Dimensions' },
  { value: 'current', label: 'Current Period', group: 'Measures' },
  { value: 'previous', label: 'Previous Period', group: 'Measures' },
  { value: 'variance', label: 'Variance ($)', group: 'Measures' },
  { value: 'variance_pct', label: 'Variance (%)', group: 'Measures' },
  { value: 'budget', label: 'Budget', group: 'Measures' },
  { value: 'actual', label: 'Actual', group: 'Measures' },
  { value: 'ytd', label: 'Year to Date', group: 'Measures' },
  { value: 'mtd', label: 'Month to Date', group: 'Measures' },
  { value: 'qtd', label: 'Quarter to Date', group: 'Measures' },
]

const GROUPING_OPTIONS = [
  { value: 'none', label: 'No Grouping' },
  { value: 'account_type', label: 'Account Type' },
  { value: 'department', label: 'Department' },
  { value: 'entity', label: 'Entity' },
  { value: 'project', label: 'Project' },
  { value: 'period', label: 'Period' },
]

const CHART_TYPES = [
  { value: 'none', label: 'No Chart', icon: Table2 },
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
  { value: 'stacked_bar', label: 'Stacked Bar', icon: Layers },
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
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [builderStep, setBuilderStep] = useState<1 | 2 | 3>(1)
  const [newReportName, setNewReportName] = useState("")
  const [newReportDescription, setNewReportDescription] = useState("")
  const [newReportType, setNewReportType] = useState<string>("")
  const [newBaseDataset, setNewBaseDataset] = useState<string>("gl_transactions")
  const [newReportEntity, setNewReportEntity] = useState("e4")
  const [newReportPeriod, setNewReportPeriod] = useState("this_year")
  const [newReportColumns, setNewReportColumns] = useState<string[]>(['account', 'current', 'previous', 'variance'])
  const [newReportGroupBy, setNewReportGroupBy] = useState<string>("none")
  const [newReportSortBy, setNewReportSortBy] = useState<string>("account")
  const [newChartType, setNewChartType] = useState<string>("none")
  const [showSubtotals, setShowSubtotals] = useState(true)
  const [showGrandTotal, setShowGrandTotal] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    const [reportsData, entitiesData, departmentsData] = await Promise.all([
      getSavedReports(),
      getEntities(),
      getDepartments(),
    ])
    
    setSavedReports(reportsData)
    setEntities(entitiesData)
    setDepartments(departmentsData)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateReport = async () => {
    if (!newReportName || !newReportType) return
    
    await saveReport({
      name: newReportName,
      description: newReportDescription || undefined,
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
      groupBy: newReportGroupBy,
      sortBy: newReportSortBy,
      category: REPORT_TYPES.find(type => type.value === newReportType)?.label,
    })
    
    setCreateModalOpen(false)
    resetBuilderForm()
    fetchData()
  }

  const resetBuilderForm = () => {
    setBuilderStep(1)
    setNewReportName("")
    setNewReportDescription("")
    setNewReportType("")
    setNewBaseDataset("gl_transactions")
    setNewReportColumns(['account', 'current', 'previous', 'variance'])
    setNewReportGroupBy("none")
    setNewReportSortBy("account")
    setNewChartType("none")
    setShowSubtotals(true)
    setShowGrandTotal(true)
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

      {/* Create Report Modal - Enhanced Builder */}
      <Dialog open={createModalOpen} onOpenChange={(open) => {
        setCreateModalOpen(open)
        if (!open) resetBuilderForm()
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Builder</DialogTitle>
            <DialogDescription>
              Create a custom report with your own columns, grouping, and visualizations
            </DialogDescription>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 py-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  builderStep >= step 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {step}
                </div>
                {step < 3 && (
                  <ArrowRight className={cn(
                    "h-4 w-4",
                    builderStep > step ? "text-primary" : "text-muted-foreground"
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {builderStep === 1 && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Report Name *</Label>
                <Input
                  placeholder="e.g., Monthly P&L by Department"
                  value={newReportName}
                  onChange={(e) => setNewReportName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Optional description of what this report shows..."
                  value={newReportDescription}
                  onChange={(e) => setNewReportDescription(e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Report Type *</Label>
                <div className="grid grid-cols-3 gap-3">
                  {REPORT_TYPES.map((type) => {
                    const Icon = type.icon
                    return (
                      <div
                        key={type.value}
                        className={cn(
                          "flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all",
                          newReportType === type.value 
                            ? "border-primary bg-primary/5" 
                            : "hover:border-muted-foreground/50"
                        )}
                        onClick={() => setNewReportType(type.value)}
                      >
                        <Icon className={cn(
                          "h-6 w-6 mb-2",
                          newReportType === type.value ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className="text-sm font-medium text-center">{type.label}</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">{type.description}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {newReportType === 'custom' && (
                <div className="space-y-2">
                  <Label>Base Dataset</Label>
                  <Select value={newBaseDataset} onValueChange={setNewBaseDataset}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BASE_DATASETS.map((ds) => (
                        <SelectItem key={ds.value} value={ds.value}>
                          <div>
                            <div className="font-medium">{ds.label}</div>
                            <div className="text-xs text-muted-foreground">{ds.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
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
            </div>
          )}

          {/* Step 2: Columns & Grouping */}
          {builderStep === 2 && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Columns to Include
                </Label>
                <div className="border rounded-lg p-4">
                  <div className="mb-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Dimensions</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {COLUMN_OPTIONS.filter(c => c.group === 'Dimensions').map((col) => (
                      <div key={col.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={col.value}
                          checked={newReportColumns.includes(col.value)}
                          onCheckedChange={() => handleColumnToggle(col.value)}
                        />
                        <label htmlFor={col.value} className="text-sm cursor-pointer">
                          {col.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-3" />
                  <div className="mb-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Measures</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {COLUMN_OPTIONS.filter(c => c.group === 'Measures').map((col) => (
                      <div key={col.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={col.value}
                          checked={newReportColumns.includes(col.value)}
                          onCheckedChange={() => handleColumnToggle(col.value)}
                        />
                        <label htmlFor={col.value} className="text-sm cursor-pointer">
                          {col.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Row Grouping
                  </Label>
                  <Select value={newReportGroupBy} onValueChange={setNewReportGroupBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUPING_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    Sort By
                  </Label>
                  <Select value={newReportSortBy} onValueChange={setNewReportSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_OPTIONS.map((col) => (
                        <SelectItem key={col.value} value={col.value}>
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-subtotals"
                    checked={showSubtotals}
                    onCheckedChange={setShowSubtotals}
                  />
                  <Label htmlFor="show-subtotals">Show Subtotals</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-grand-total"
                    checked={showGrandTotal}
                    onCheckedChange={setShowGrandTotal}
                  />
                  <Label htmlFor="show-grand-total">Show Grand Total</Label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Visualization */}
          {builderStep === 3 && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Chart Type
                </Label>
                <div className="grid grid-cols-5 gap-3">
                  {CHART_TYPES.map((chart) => {
                    const Icon = chart.icon
                    return (
                      <div
                        key={chart.value}
                        className={cn(
                          "flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all",
                          newChartType === chart.value 
                            ? "border-primary bg-primary/5" 
                            : "hover:border-muted-foreground/50"
                        )}
                        onClick={() => setNewChartType(chart.value)}
                      >
                        <Icon className={cn(
                          "h-6 w-6 mb-2",
                          newChartType === chart.value ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className="text-xs font-medium text-center">{chart.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Preview Summary */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Report Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{newReportName || 'Untitled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{REPORT_TYPES.find(t => t.value === newReportType)?.label || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Columns:</span>
                    <span className="font-medium">{newReportColumns.length} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Grouping:</span>
                    <span className="font-medium">{GROUPING_OPTIONS.find(g => g.value === newReportGroupBy)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chart:</span>
                    <span className="font-medium">{CHART_TYPES.find(c => c.value === newChartType)?.label}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <div>
              {builderStep > 1 && (
                <Button variant="outline" onClick={() => setBuilderStep((builderStep - 1) as 1 | 2 | 3)}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setCreateModalOpen(false)
                resetBuilderForm()
              }}>
                Cancel
              </Button>
              {builderStep < 3 ? (
                <Button 
                  onClick={() => setBuilderStep((builderStep + 1) as 1 | 2 | 3)}
                  disabled={builderStep === 1 && (!newReportName || !newReportType)}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleCreateReport} disabled={!newReportName || !newReportType}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
