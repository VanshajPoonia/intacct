"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } from "@/lib/services"
import type { Notification, PaginatedResponse } from "@/lib/types"

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
  }
  
  const config = icons[type] || { icon: <Bell className="h-5 w-5" />, className: 'bg-gray-100 text-gray-600' }
  
  return (
    <div className={`p-2 rounded-full ${config.className}`}>
      {config.icon}
    </div>
  )
}

function TypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    approval_required: 'Approval Required',
    approval_completed: 'Approval Completed',
    task_assigned: 'Task Assigned',
    task_due: 'Task Due',
    payment_received: 'Payment Received',
    invoice_overdue: 'Invoice Overdue',
    sync_error: 'Sync Error',
    system: 'System',
    mention: 'Mention',
  }
  
  return <span className="text-xs text-muted-foreground">{labels[type] || type}</span>
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<PaginatedResponse<Notification> | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const unreadOnly = tab === "unread"
      const typeArr = typeFilter !== "all" ? [typeFilter] : undefined
      
      const result = await getNotifications(unreadOnly, typeArr, 1, 50)
      setNotifications(result)
      
      const count = await getUnreadCount()
      setUnreadCount(count)
    } finally {
      setLoading(false)
    }
  }, [tab, typeFilter])

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

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
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
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{notifications?.total || 0}</p>
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
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {notifications?.data.filter(n => n.type === 'approval_required').length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending Approvals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {notifications?.data.filter(n => n.type === 'sync_error' || n.type === 'invoice_overdue').length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Alerts</p>
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="approval_required">Approval Required</SelectItem>
                  <SelectItem value="approval_completed">Approval Completed</SelectItem>
                  <SelectItem value="task_assigned">Task Assigned</SelectItem>
                  <SelectItem value="task_due">Task Due</SelectItem>
                  <SelectItem value="payment_received">Payment Received</SelectItem>
                  <SelectItem value="invoice_overdue">Invoice Overdue</SelectItem>
                  <SelectItem value="sync_error">Sync Error</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="mention">Mention</SelectItem>
                </SelectContent>
              </Select>
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
            ) : notifications?.data.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications?.data.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
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
                        <TypeLabel type={notification.type} />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {notification.actionUrl && (
                        <Link href={notification.actionUrl}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      )}
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMarkRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
