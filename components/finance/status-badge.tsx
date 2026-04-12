"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusType = 
  | 'active' | 'inactive' | 'pending' 
  | 'draft' | 'sent' | 'paid' | 'overdue' | 'voided'
  | 'approved' | 'rejected' | 'posted' | 'reversed'
  | 'submitted' | 'reimbursed'
  | 'pending_approval' | 'confirmed' | 'partially_shipped' | 'shipped' | 'invoiced'
  | 'planning' | 'on_hold' | 'cancelled' | 'expired'
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
  submitted: { label: 'Submitted', variant: 'secondary', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  reimbursed: { label: 'Reimbursed', variant: 'secondary', className: 'bg-violet-50 text-violet-700 border-violet-200' },

  // Operational workflow states
  pending_approval: { label: 'Pending Approval', variant: 'secondary', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', variant: 'secondary', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  partially_shipped: { label: 'Partially Shipped', variant: 'secondary', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  shipped: { label: 'Shipped', variant: 'secondary', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  invoiced: { label: 'Invoiced', variant: 'secondary', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  planning: { label: 'Planning', variant: 'secondary', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  on_hold: { label: 'On Hold', variant: 'secondary', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancelled: { label: 'Cancelled', variant: 'secondary', className: 'bg-red-50 text-red-700 border-red-200' },
  expired: { label: 'Expired', variant: 'secondary', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  
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
    label: status
      .split('_')
      .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' '), 
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
