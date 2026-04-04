import type { VersionHistoryItem } from './common'

export interface Approver {
  id: string
  name: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  respondedAt?: Date
  comments?: string
}

export interface ApprovalItem {
  id: string
  type: 'bill' | 'invoice' | 'journal_entry' | 'purchase_order' | 'expense' | 'payment'
  documentId: string
  documentNumber: string
  description: string
  amount: number
  currency: string
  requestedBy: string
  requestedAt: Date
  status: 'pending' | 'approved' | 'rejected'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  approvers?: Approver[]
  currentStep?: number
  entityId: string
}

export interface CloseTask {
  id: string
  taskKey: string
  name: string
  phase: 'pre_close' | 'soft_close' | 'hard_close' | 'post_close'
  entityId: string
  departmentId?: string
  projectId?: string
  dueDate: Date
  ownerId: string
  ownerName: string
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked'
  blockerReason?: string
  completedAt?: Date
  dependencies: string[]
  documentCount: number
  exceptionCount: number
}

export interface CloseStatus {
  entityId?: string
  totalTasks: number
  completedTasks: number
  blockedTasks: number
  overdueTasks: number
  progressPercent: number
  currentPeriodLabel: string
  phaseBreakdown: {
    phase: CloseTask['phase']
    total: number
    completed: number
  }[]
  nextDueTask?: CloseTask
}

export interface Document {
  id: string
  number: string
  type:
    | 'bill'
    | 'invoice'
    | 'journal_entry'
    | 'payment'
    | 'receipt'
    | 'contract'
    | 'report'
    | 'attachment'
  module: 'ap' | 'ar' | 'gl' | 'cash' | 'close' | 'reporting' | 'contracts'
  title: string
  status: 'draft' | 'pending' | 'approved' | 'posted' | 'archived' | 'missing'
  entityId: string
  relatedEntityType?: string
  relatedEntityId?: string
  fileName?: string
  fileSizeBytes?: number
  mimeType?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface AllocationRuleTarget {
  targetAccountId: string
  targetAccountName: string
  departmentId?: string
  projectId?: string
  percentage?: number
  fixedAmount?: number
}

export interface AllocationRule {
  id: string
  name: string
  description?: string
  sourceAccountId: string
  sourceAccountName: string
  method: 'fixed' | 'percentage' | 'statistical'
  basis?: string
  status: 'draft' | 'active' | 'inactive'
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'on_demand'
  entityId: string
  createdBy: string
  createdAt: Date
  targets: AllocationRuleTarget[]
}

export interface Task {
  id: string
  title: string
  description?: string
  type: 'approval' | 'review' | 'data_entry' | 'reconciliation' | 'follow_up' | 'other'
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'snoozed'
  dueDate?: Date
  assigneeId: string
  assigneeName: string
  relatedType?: 'bill' | 'invoice' | 'journal_entry' | 'payment' | 'receipt' | 'reconciliation'
  relatedId?: string
  relatedNumber?: string
  entityId: string
  createdBy: string
  createdAt: Date
  completedAt?: Date
}

export interface Notification {
  id: string
  type:
    | 'approval_required'
    | 'approval_completed'
    | 'task_assigned'
    | 'task_due'
    | 'payment_received'
    | 'invoice_overdue'
    | 'sync_error'
    | 'system'
    | 'mention'
  title: string
  message: string
  read: boolean
  actionUrl?: string
  relatedType?: string
  relatedId?: string
  createdAt: Date
}

export interface ActivityItem extends VersionHistoryItem {
  type: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'post' | 'void' | 'payment' | 'login' | 'export' | 'import'
  action: string
  description: string
  userId: string
  userName: string
  userAvatar?: string
  relatedType?: string
  relatedId?: string
  relatedNumber?: string
  entityId: string
  metadata?: Record<string, unknown>
}
