"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
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
import { 
  Bell, 
  Check, 
  CheckCheck,
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  FileText,
  DollarSign,
  AlertTriangle,
  Settings,
  User,
  ExternalLink,
  Mail,
  Archive,
  BellOff,
  ChevronDown,
  ChevronUp,
  Receipt,
  Upload,
  CreditCard,
  Brain,
  Calendar,
  Trash2,
} from "lucide-react"
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns"
import Link from "next/link"
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } from "@/lib/services"
import type { Notification, PaginatedResponse } from "@/lib/types"

// Notification categories for grouping
const notificationCategories = [
  { 
    id: 'approvals', 
    label: 'Approvals', 
    icon: CheckCircle2,
    types: ['approval_required', 'approval_completed'],
    color: 'bg-amber-100 text-amber-600'
  },
  { 
    id: 'reconciliation', 
    label: 'Reconciliation', 
    icon: Receipt,
    types: ['reconciliation_issue', 'bank_sync'],
    color: 'bg-purple-100 text-purple-600'
  },
  { 
    id: 'imports', 
    label: 'Imports', 
    icon: Upload,
    types: ['sync_error', 'import_completed'],
    color: 'bg-red-100 text-red-600'
  },
  { 
    id: 'receipts', 
    label: 'Missing Receipts', 
    icon: CreditCard,
    types: ['missing_receipt'],
    color: 'bg-orange-100 text-orange-600'
  },
  { 
    id: 'anomalies', 
    label: 'Anomalies', 
    icon: Brain,
    types: ['anomaly_detected', 'duplicate_detected'],
    color: 'bg-blue-100 text-blue-600'
  },
  { 
    id: 'reminders', 
    label: 'Reminders', 
    icon: Calendar,
    types: ['task_due', 'invoice_overdue', 'payment_reminder'],
    color: 'bg-emerald-100 text-emerald-600'
  },
]

const snoozeOptions = [
  { value: '1h', label: '1 hour', hours: 1 },
  { value: '4h', label: '4 hours', hours: 4 },
  { value: '1d', label: 'Tomorrow', hours: 24 },
  { value: '3d', label: '3 days', hours: 72 },
  { value: '1w', label: '1 week', hours: 168 },
]

function NotificationIcon({ type }: { type: string }) {
  const icons: Record<string, { icon: React.ReactNode; className: string }> = {
    approval_required: { icon: <Clock className="h-5 w-5" />, className: 'bg-amber-100 text-amber-600' },
    approval_completed: { icon: <CheckCircle2 className="h-5 w-5" />, className: 'bg-emerald-100 text-emerald-600' },
    task_assigned: { icon: <User className="h-5 w-5" />, className: 'bg-blue-100 text-blue-600' },
    task_due: { icon: <AlertCircle className="h-5 w-5" />, className: 'bg-amber-100 text-amber-600' },
    payment_received: { icon: <DollarSign className="h-5 w-5" />, className: 'bg-emerald-100 text-emerald-600' },
    invoice_overdue: { icon: <AlertTriangle className="h-5 w-5" />, className: 'bg-red-100 text-red-600' },
    sync_error: { icon: <XCircle className="h-5 w-5" />, className: 'bg-red-100 text-red-600' },
    system: { icon: <Settings className="h-5 w-5" />, className: 'bg-gray-100 text-gray-600' },
    mention: { icon: <Mail className="h-5 w-5" />, className: 'bg-purple-100 text-purple-600' },
    missing_receipt: { icon: <CreditCard className="h-5 w-5" />, className: 'bg-orange-100 text-orange-600' },
    anomaly_detected: { icon: <Brain className="h-5 w-5" />, className: 'bg-blue-100 text-blue-600' },
    reconciliation_issue: { icon: <Receipt className="h-5 w-5" />, className: 'bg-purple-100 text-purple-600' },
  }
  
  const config = icons[type] || { icon: <Bell className="h-5 w-5" />, className: 'bg-gray-100 text-gray-600' }
  
  return (
    <div className={`p-2 rounded-full ${config.className}`}>
      {config.icon}
    </div>
  )
}

function getDateGroupLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  if (isThisWeek(date)) return 'This Week'
  return format(date, 'MMMM d, yyyy')
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<PaginatedResponse<Notification> | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [unreadCount, setUnreadCount] = useState(0)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Today', 'Yesterday']))
  
  // Archived notifications (local state for demo)
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set())
  const [snoozedIds, setSnoozedIds] = useState<Set<string>>(new Set())
  
  // Snooze dialog
  const [snoozeNotification, setSnoozeNotification] = useState<Notification | null>(null)
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const [snoozeDuration, setSnoozeDuration] = useState("")

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const unreadOnly = tab === "unread"
      
      // Map category to types
      let typeArr: string[] | undefined
      if (categoryFilter !== "all") {
        const category = notificationCategories.find(c => c.id === categoryFilter)
        typeArr = category?.types
      }
      
      const result = await getNotifications(unreadOnly, typeArr, 1, 100)
      setNotifications(result)
      
      const count = await getUnreadCount()
      setUnreadCount(count)
    } finally {
      setLoading(false)
    }
  }, [tab, categoryFilter])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    fetchNotifications()
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    fetchNotifications()
  }

  const handleArchive = (id: string) => {
    setArchivedIds(prev => new Set([...prev, id]))
  }

  const handleSnooze = () => {
    if (!snoozeNotification || !snoozeDuration) return
    setSnoozedIds(prev => new Set([...prev, snoozeNotification.id]))
    setSnoozeOpen(false)
    setSnoozeNotification(null)
    setSnoozeDuration("")
  }

  const openSnooze = (notification: Notification) => {
    setSnoozeNotification(notification)
    setSnoozeOpen(true)
  }

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupLabel)) {
        next.delete(groupLabel)
      } else {
        next.add(groupLabel)
      }
      return next
    })
  }

  // Filter out archived and snoozed
  const visibleNotifications = notifications?.data.filter(n => 
    !archivedIds.has(n.id) && !snoozedIds.has(n.id)
  ) || []

  // Group by date
  const groupedNotifications = visibleNotifications.reduce((groups, notification) => {
    const label = getDateGroupLabel(new Date(notification.createdAt))
    if (!groups[label]) {
      groups[label] = []
    }
    groups[label].push(notification)
    return groups
  }, {} as Record<string, Notification[]>)

  const sortedGroups = Object.keys(groupedNotifications).sort((a, b) => {
    // Custom sort order: Today, Yesterday, This Week, then by date
    const order = ['Today', 'Yesterday', 'This Week']
    const aIndex = order.indexOf(a)
    const bIndex = order.indexOf(b)
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return 0
  })

  // Category counts
  const getCategoryCount = (categoryId: string) => {
    const category = notificationCategories.find(c => c.id === categoryId)
    if (!category) return 0
    return visibleNotifications.filter(n => 
      category.types.includes(n.type) && !n.read
    ).length
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Notification Center</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
            <Link href="/admin/notifications">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </Button>
            </Link>
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-6 gap-3">
          {notificationCategories.map((category) => {
            const Icon = category.icon
            const count = getCategoryCount(category.id)
            const isActive = categoryFilter === category.id
            return (
              <Card 
                key={category.id}
                className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setCategoryFilter(isActive ? 'all' : category.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${category.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{category.label}</p>
                      {count > 0 && (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px] mt-0.5">
                          {count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{visibleNotifications.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{unreadCount}</p>
                  <p className="text-xs text-muted-foreground">Unread</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BellOff className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{snoozedIds.size}</p>
                  <p className="text-xs text-muted-foreground">Snoozed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Archive className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{archivedIds.size}</p>
                  <p className="text-xs text-muted-foreground">Archived</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">
                    Unread
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {categoryFilter !== 'all' && (
                <Button variant="outline" size="sm" onClick={() => setCategoryFilter('all')}>
                  Clear Filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedGroups.map((groupLabel) => {
                  const groupNotifications = groupedNotifications[groupLabel]
                  const isExpanded = expandedGroups.has(groupLabel)
                  const unreadInGroup = groupNotifications.filter(n => !n.read).length
                  
                  return (
                    <div key={groupLabel}>
                      <button
                        className="flex items-center gap-2 w-full text-left mb-3 group"
                        onClick={() => toggleGroup(groupLabel)}
                      >
                        <span className="text-sm font-semibold text-muted-foreground">{groupLabel}</span>
                        {unreadInGroup > 0 && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                            {unreadInGroup} new
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">({groupNotifications.length})</span>
                        <div className="flex-1" />
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="space-y-2">
                          {groupNotifications.map((notification) => (
                            <div 
                              key={notification.id} 
                              className={`flex items-start gap-4 p-4 border rounded-lg transition-colors group ${
                                !notification.read ? 'bg-blue-50/50 border-blue-200' : 'hover:bg-muted/50'
                              }`}
                            >
                              <NotificationIcon type={notification.type} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {notification.title}
                                  </p>
                                  {!notification.read && (
                                    <span className="h-2 w-2 bg-blue-500 rounded-full" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {notification.actionUrl && (
                                  <Link href={notification.actionUrl}>
                                    <Button variant="ghost" size="sm" className="h-8 px-2">
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
                                {!notification.read && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => handleMarkRead(notification.id)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => openSnooze(notification)}
                                >
                                  <BellOff className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => handleArchive(notification.id)}
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Snooze Dialog */}
      <Dialog open={snoozeOpen} onOpenChange={setSnoozeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Snooze Notification</DialogTitle>
            <DialogDescription>
              Choose how long to snooze this notification
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {snoozeOptions.map((option) => (
              <Button
                key={option.value}
                variant={snoozeDuration === option.value ? "default" : "outline"}
                className="justify-start"
                onClick={() => setSnoozeDuration(option.value)}
              >
                <BellOff className="h-4 w-4 mr-2" />
                {option.label}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSnoozeOpen(false)}>Cancel</Button>
            <Button onClick={handleSnooze} disabled={!snoozeDuration}>
              Snooze
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
