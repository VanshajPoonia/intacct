"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
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
  Paperclip,
  MessageSquare,
  Send,
  MoreHorizontal,
  UserPlus,
  RefreshCcw,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ActivityItem } from "@/lib/types"

export interface ActivityTimelineProps {
  activities: ActivityItem[]
  loading?: boolean
  showCommentInput?: boolean
  onComment?: (comment: string) => void
  onRefresh?: () => void
  maxItems?: number
  title?: string
  compact?: boolean
  showRelatedBadge?: boolean
}

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
    comment: { icon: <MessageSquare className="h-4 w-4" />, className: 'bg-blue-100 text-blue-600' },
    attachment: { icon: <Paperclip className="h-4 w-4" />, className: 'bg-gray-100 text-gray-600' },
    reassign: { icon: <UserPlus className="h-4 w-4" />, className: 'bg-purple-100 text-purple-600' },
  }
  
  const config = icons[type] || { icon: <FileText className="h-4 w-4" />, className: 'bg-gray-100 text-gray-600' }
  
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
    task: 'Task',
    approval: 'Approval',
  }
  
  return (
    <Badge variant="outline" className="text-xs">
      {labels[type] || type}
      {number && `: ${number}`}
    </Badge>
  )
}

function ActivityItemRow({ 
  activity, 
  compact = false,
  showRelatedBadge = true,
}: { 
  activity: ActivityItem
  compact?: boolean
  showRelatedBadge?: boolean
}) {
  return (
    <div className="flex items-start gap-4 relative">
      <div className="relative z-10 bg-background">
        <ActivityIcon type={activity.type} />
      </div>
      <div className={`flex-1 min-w-0 ${compact ? 'pb-3' : 'pb-4'}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className={`font-medium ${compact ? 'text-sm' : ''}`}>{activity.action}</p>
            {!compact && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {activity.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-2">
                <Avatar className={compact ? "h-4 w-4" : "h-5 w-5"}>
                  <AvatarImage src={activity.userAvatar} />
                  <AvatarFallback className={compact ? "text-[8px]" : "text-[10px]"}>
                    {activity.userName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {activity.userName}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </span>
              {showRelatedBadge && activity.relatedType && (
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
  )
}

export function ActivityTimeline({
  activities,
  loading = false,
  showCommentInput = false,
  onComment,
  onRefresh,
  maxItems,
  title = "Activity",
  compact = false,
  showRelatedBadge = true,
}: ActivityTimelineProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const displayedActivities = maxItems ? activities.slice(0, maxItems) : activities

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !onComment) return
    
    setIsSubmitting(true)
    try {
      await onComment(newComment)
      setNewComment("")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-0 relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            
            {displayedActivities.map((activity, index) => (
              <ActivityItemRow 
                key={activity.id} 
                activity={activity} 
                compact={compact}
                showRelatedBadge={showRelatedBadge}
              />
            ))}

            {maxItems && activities.length > maxItems && (
              <div className="pt-2 pl-12">
                <Button variant="link" className="h-auto p-0 text-sm">
                  View all {activities.length} activities
                </Button>
              </div>
            )}
          </div>
        )}

        {showCommentInput && (
          <>
            <Separator className="my-4" />
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">SC</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button 
                  size="sm" 
                  disabled={!newComment.trim() || isSubmitting}
                  onClick={handleSubmitComment}
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  {isSubmitting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for embedding in other components
export function ActivityTimelineCompact({
  activities,
  loading = false,
  maxItems = 5,
  onViewAll,
}: {
  activities: ActivityItem[]
  loading?: boolean
  maxItems?: number
  onViewAll?: () => void
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const displayedActivities = activities.slice(0, maxItems)

  return (
    <div className="space-y-3">
      {displayedActivities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className={`p-1.5 rounded-full ${
            activity.type === 'create' ? 'bg-emerald-100 text-emerald-600' :
            activity.type === 'approve' ? 'bg-emerald-100 text-emerald-600' :
            activity.type === 'reject' ? 'bg-red-100 text-red-600' :
            activity.type === 'update' ? 'bg-blue-100 text-blue-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {activity.type === 'create' && <Plus className="h-3 w-3" />}
            {activity.type === 'approve' && <CheckCircle2 className="h-3 w-3" />}
            {activity.type === 'reject' && <XCircle className="h-3 w-3" />}
            {activity.type === 'update' && <Edit className="h-3 w-3" />}
            {!['create', 'approve', 'reject', 'update'].includes(activity.type) && (
              <FileText className="h-3 w-3" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{activity.action}</p>
            <p className="text-xs text-muted-foreground">
              {activity.userName} - {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}

      {activities.length > maxItems && onViewAll && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs"
          onClick={onViewAll}
        >
          View all {activities.length} activities
        </Button>
      )}
    </div>
  )
}

// Hook for fetching activity data
export function useActivityTimeline(
  relatedType?: string,
  relatedId?: string,
) {
  // This would connect to the actual API
  // For now, returns mock data structure
  return {
    activities: [] as ActivityItem[],
    loading: false,
    refresh: () => {},
  }
}
