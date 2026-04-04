"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Activity, 
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  LogIn,
  Download,
  Upload,
  ExternalLink,
  RefreshCcw,
  Filter,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { getActivityTimeline, getEntities, getUsers } from "@/lib/services"
import type { ActivityItem, Entity, User, PaginatedResponse } from "@/lib/types"

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, { icon: React.ReactNode; className: string }> = {
    create: { icon: <Plus className="h-4 w-4" />, className: 'bg-emerald-100 text-emerald-600' },
    update: { icon: <Edit className="h-4 w-4" />, className: 'bg-blue-100 text-blue-600' },
    delete: { icon: <Trash2 className="h-4 w-4" />, className: 'bg-red-100 text-red-600' },
    approve: { icon: <CheckCircle2 className="h-4 w-4" />, className: 'bg-emerald-100 text-emerald-600' },
    reject: { icon: <XCircle className="h-4 w-4" />, className: 'bg-red-100 text-red-600' },
    post: { icon: <FileText className="h-4 w-4" />, className: 'bg-purple-100 text-purple-600' },
    void: { icon: <XCircle className="h-4 w-4" />, className: 'bg-gray-100 text-gray-600' },
    payment: { icon: <DollarSign className="h-4 w-4" />, className: 'bg-emerald-100 text-emerald-600' },
    login: { icon: <LogIn className="h-4 w-4" />, className: 'bg-gray-100 text-gray-600' },
    export: { icon: <Download className="h-4 w-4" />, className: 'bg-blue-100 text-blue-600' },
    import: { icon: <Upload className="h-4 w-4" />, className: 'bg-amber-100 text-amber-600' },
  }
  
  const config = icons[type] || { icon: <Activity className="h-4 w-4" />, className: 'bg-gray-100 text-gray-600' }
  
  return (
    <div className={`p-2 rounded-full ${config.className}`}>
      {config.icon}
    </div>
  )
}

function RelatedTypeBadge({ type, number }: { type?: string; number?: string }) {
  if (!type) return null
  
  const labels: Record<string, string> = {
    bill: 'Bill',
    invoice: 'Invoice',
    journal_entry: 'Journal Entry',
    payment: 'Payment',
    receipt: 'Receipt',
    reconciliation: 'Reconciliation',
    bank_account: 'Bank Account',
    report: 'Report',
  }
  
  return (
    <Badge variant="outline" className="text-xs">
      {labels[type] || type}
      {number && `: ${number}`}
    </Badge>
  )
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<PaginatedResponse<ActivityItem> | null>(null)
  const [entities, setEntities] = useState<Entity[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [userFilter, setUserFilter] = useState<string>("all")
  const [relatedFilter, setRelatedFilter] = useState<string>("all")

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    try {
      const entityId = entityFilter !== "all" ? entityFilter : undefined
      const typeArr = typeFilter !== "all" ? [typeFilter] : undefined
      const userId = userFilter !== "all" ? userFilter : undefined
      const relatedType = relatedFilter !== "all" ? relatedFilter : undefined
      
      const result = await getActivityTimeline(entityId, typeArr, userId, relatedType, 1, 50)
      setActivities(result)
    } finally {
      setLoading(false)
    }
  }, [entityFilter, typeFilter, userFilter, relatedFilter])

  const fetchFilters = useCallback(async () => {
    const [entitiesResult, usersResult] = await Promise.all([
      getEntities(),
      getUsers(undefined, undefined, ["active"])
    ])
    setEntities(entitiesResult)
    setUsers(usersResult.data)
  }, [])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  useEffect(() => {
    fetchFilters()
  }, [fetchFilters])

  // Group activities by date
  const groupedActivities = activities?.data.reduce((groups, activity) => {
    const date = format(new Date(activity.createdAt), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(activity)
    return groups
  }, {} as Record<string, ActivityItem[]>) || {}

  const sortedDates = Object.keys(groupedActivities).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Activity Timeline</h1>
            <p className="text-sm text-muted-foreground">Track all actions and changes across your organization</p>
          </div>
          <Button variant="outline" onClick={fetchActivities}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={relatedFilter} onValueChange={setRelatedFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Related To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="bill">Bills</SelectItem>
                  <SelectItem value="invoice">Invoices</SelectItem>
                  <SelectItem value="journal_entry">Journal Entries</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="receipt">Receipts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-4 w-32" />
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="flex items-start gap-4 ml-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : activities?.data.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No activity found</p>
              </div>
            ) : (
              <div className="space-y-8">
                {sortedDates.map((date) => (
                  <div key={date}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="space-y-4 relative">
                      {/* Timeline line */}
                      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                      
                      {groupedActivities[date].map((activity, index) => (
                        <div key={activity.id} className="flex items-start gap-4 relative">
                          <div className="relative z-10 bg-background">
                            <ActivityIcon type={activity.type} />
                          </div>
                          <div className="flex-1 min-w-0 pb-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">{activity.action}</p>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {activity.description}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={activity.userAvatar} />
                                      <AvatarFallback className="text-[10px]">
                                        {activity.userName.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground">
                                      {activity.userName}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(activity.createdAt), 'h:mm a')}
                                  </span>
                                  {activity.relatedType && (
                                    <RelatedTypeBadge 
                                      type={activity.relatedType} 
                                      number={activity.relatedNumber} 
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
