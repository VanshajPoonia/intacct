"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusType = 
  | 'active' | 'inactive' | 'pending' 
  | 'draft' | 'sent' | 'paid' | 'overdue' | 'voided'
  | 'approved' | 'rejected' | 'posted' | 'reversed'
  | 'todo' | 'in_progress' | 'completed'
  | 'low' | 'medium' | 'high' | 'urgent'

interface StatusBadgeProps {
  status: StatusType | string
  className?: string
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  // General status
  active: { label: 'Active', variant: 'secondary', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive: { label: 'Inactive', variant: 'secondary', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  pending: { label: 'Pending', variant: 'secondary', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  
  // Document status
  draft: { label: 'Draft', variant: 'secondary', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  sent: { label: 'Sent', variant: 'secondary', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid: { label: 'Paid', variant: 'secondary', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  overdue: { label: 'Overdue', variant: 'secondary', className: 'bg-red-50 text-red-700 border-red-200' },
  voided: { label: 'Voided', variant: 'secondary', className: 'bg-gray-50 text-gray-500 border-gray-200 line-through' },
  
  // Approval status
  approved: { label: 'Approved', variant: 'secondary', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', variant: 'secondary', className: 'bg-red-50 text-red-700 border-red-200' },
  posted: { label: 'Posted', variant: 'secondary', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  reversed: { label: 'Reversed', variant: 'secondary', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  
  // Task status
  todo: { label: 'To Do', variant: 'secondary', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  in_progress: { label: 'In Progress', variant: 'secondary', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'Completed', variant: 'secondary', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  
  // Priority
  low: { label: 'Low', variant: 'secondary', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  medium: { label: 'Medium', variant: 'secondary', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  high: { label: 'High', variant: 'secondary', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  urgent: { label: 'Urgent', variant: 'secondary', className: 'bg-red-50 text-red-700 border-red-200' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { 
    label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '), 
    variant: 'secondary' as const, 
    className: 'bg-gray-50 text-gray-600 border-gray-200' 
  }
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(
        "text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  )
}
