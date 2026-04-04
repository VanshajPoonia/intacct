// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { 
  History, 
  Search,
  Calendar as CalendarIcon,
  Download,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  LogIn,
  LogOut,
  Settings2,
  FileText,
  DollarSign,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react"
import type { ActivityItem } from "@/lib/types"

// Mock audit log data
const mockAuditLogs: ActivityItem[] = [
  {
    id: 'al1',
    type: 'create',
    action: 'Bill Created',
    description: 'Created bill BILL-2024-001 for Office Supply Co',
    userId: 'u1',
    userName: 'Sarah Chen',
    entityId: 'e1',
    entityName: 'Acme Corporation',
    relatedType: 'bill',
    relatedId: 'b1',
    relatedNumber: 'BILL-2024-001',
    timestamp: new Date('2024-03-15T10:30:00'),
    metadata: { amount: 2500, vendorName: 'Office Supply Co' },
  },
  {
    id: 'al2',
    type: 'approve',
    action: 'Bill Approved',
    description: 'Approved bill BILL-2024-001 for payment',
    userId: 'u2',
    userName: 'John Smith',
    entityId: 'e1',
    entityName: 'Acme Corporation',
    relatedType: 'bill',
    relatedId: 'b1',
    relatedNumber: 'BILL-2024-001',
    timestamp: new Date('2024-03-15T11:15:00'),
  },
  {
    id: 'al3',
    type: 'login',
    action: 'User Login',
    description: 'User logged in from IP 192.168.1.100',
    userId: 'u3',
    userName: 'Emily Davis',
    entityId: 'e1',
    entityName: 'Acme Corporation',
    timestamp: new Date('2024-03-15T09:00:00'),
    metadata: { ip: '192.168.1.100', browser: 'Chrome 122' },
  },
  {
    id: 'al4',
    type: 'update',
    action: 'Customer Updated',
    description: 'Updated credit limit for Enterprise Corp',
    userId: 'u1',
    userName: 'Sarah Chen',
    entityId: 'e1',
    entityName: 'Acme Corporation',
    relatedType: 'customer',
    relatedId: 'c1',
    relatedNumber: 'EC001',
    timestamp: new Date('2024-03-14T16:45:00'),
    metadata: { field: 'creditLimit', oldValue: 250000, newValue: 500000 },
  },
  {
    id: 'al5',
    type: 'post',
    action: 'Journal Entry Posted',
    description: 'Posted journal entry JE-2024-045',
    userId: 'u2',
    userName: 'John Smith',
    entityId: 'e1',
    entityName: 'Acme Corporation',
    relatedType: 'journal_entry',
    relatedId: 'je1',
    relatedNumber: 'JE-2024-045',
    timestamp: new Date('2024-03-14T15:30:00'),
    metadata: { totalDebit: 15000, totalCredit: 15000 },
  },
  {
    id: 'al6',
    type: 'delete',
    action: 'Draft Bill Deleted',
    description: 'Deleted draft bill BILL-2024-DRAFT-003',
    userId: 'u1',
    userName: 'Sarah Chen',
    entityId: 'e1',
    entityName: 'Acme Corporation',
    relatedType: 'bill',
    relatedId: 'b-draft-3',
    relatedNumber: 'BILL-2024-DRAFT-003',
    timestamp: new Date('2024-03-14T14:00:00'),
  },
  {
    id: 'al7',
    type: 'export',
    action: 'Report Exported',
    description: 'Exported Trial Balance report as PDF',
    userId: 'u3',
    userName: 'Emily Davis',
    entityId: 'e1',
    entityName: 'Acme Corporation',
    relatedType: 'report',
    timestamp: new Date('2024-03-14T11:30:00'),
    metadata: { reportName: 'Trial Balance', format: 'PDF' },
  },
  {
    id: 'al8',
    type: 'reject',
    action: 'Bill Rejected',
    description: 'Rejected bill BILL-2024-002 - Missing documentation',
    userId: 'u2',
    userName: 'John Smith',
    entityId: 'e1',
    entityName: 'Acme Corporation',
    relatedType: 'bill',
    relatedId: 'b2',
    relatedNumber: 'BILL-2024-002',
    timestamp: new Date('2024-03-13T16:00:00'),
    metadata: { reason: 'Missing documentation' },
  },
]

const actionTypes = [
  { value: 'all', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'post', label: 'Post' },
  { value: 'login', label: 'Login' },
  { value: 'export', label: 'Export' },
]

const getActionIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'create': return Plus
    case 'update': return Edit
    case 'delete': return Trash2
    case 'approve': return CheckCircle2
    case 'reject': return XCircle
    case 'post': return FileText
    case 'login': return LogIn
    case 'export': return Download
    default: return History
  }
}

const getActionColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'create': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'update': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'delete': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'approve': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'reject': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'post': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    case 'login': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
    case 'export': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

export default function AuditSettingsPage() {
  const [logs, setLogs] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })

  // Audit settings
  const [settings, setSettings] = useState({
    retentionDays: 365,
    logLoginAttempts: true,
    logDataExports: true,
    logFieldChanges: true,
    logApprovals: true,
    ipTracking: true,
    browserTracking: true,
  })

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    setLogs(mockAuditLogs)
    setLoading(false)
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase())
    const matchesAction = actionFilter === 'all' || log.type === actionFilter
    const matchesDateFrom = !dateRange.from || new Date(log.timestamp) >= dateRange.from
    const matchesDateTo = !dateRange.to || new Date(log.timestamp) <= dateRange.to
    return matchesSearch && matchesAction && matchesDateFrom && matchesDateTo
  })

  const handleExport = () => {
    console.log("Exporting audit logs...")
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Audit Trail</h1>
            <p className="text-sm text-muted-foreground">
              View system activity and configure audit settings
            </p>
          </div>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <History className="h-4 w-4" />
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : logs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Users Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : 3}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loading ? <Skeleton className="h-8 w-16" /> : 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Failed Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Audit Log */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Activity Log</CardTitle>
                  <div className="flex items-center gap-4">
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger className="w-[150px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                              </>
                            ) : (
                              format(dateRange.from, "MMM d, yyyy")
                            )
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="range"
                          selected={{ from: dateRange.from, to: dateRange.to }}
                          onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="Search logs..." 
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredLogs.map((log) => {
                      const Icon = getActionIcon(log.type)
                      const colorClass = getActionColor(log.type)
                      return (
                        <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <div className={`p-2 rounded-lg ${colorClass}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{log.action}</span>
                              {log.relatedNumber && (
                                <Badge variant="outline" className="text-xs">
                                  {log.relatedNumber}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-[8px]">
                                    {log.userName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{log.userName}</span>
                              </div>
                              <span>{log.entityName}</span>
                              <span>{format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Audit Settings</CardTitle>
                <CardDescription>Configure what gets logged</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Log Retention</Label>
                  <Select 
                    value={settings.retentionDays.toString()}
                    onValueChange={(v) => setSettings({ ...settings, retentionDays: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="730">2 years</SelectItem>
                      <SelectItem value="1825">5 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Login attempts</Label>
                    <Switch 
                      checked={settings.logLoginAttempts}
                      onCheckedChange={(v) => setSettings({ ...settings, logLoginAttempts: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Data exports</Label>
                    <Switch 
                      checked={settings.logDataExports}
                      onCheckedChange={(v) => setSettings({ ...settings, logDataExports: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Field changes</Label>
                    <Switch 
                      checked={settings.logFieldChanges}
                      onCheckedChange={(v) => setSettings({ ...settings, logFieldChanges: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Approvals</Label>
                    <Switch 
                      checked={settings.logApprovals}
                      onCheckedChange={(v) => setSettings({ ...settings, logApprovals: v })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Track IP address</Label>
                    <Switch 
                      checked={settings.ipTracking}
                      onCheckedChange={(v) => setSettings({ ...settings, ipTracking: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Track browser info</Label>
                    <Switch 
                      checked={settings.browserTracking}
                      onCheckedChange={(v) => setSettings({ ...settings, browserTracking: v })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Logs
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
