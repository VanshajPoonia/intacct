import type {
  ActivityItem,
  AllocationRule,
  ApprovalItem,
  CloseTask,
  Document,
  Notification,
  SavedView,
  VersionHistoryItem,
} from '@/lib/types'

export const closeTasks: CloseTask[] = [
  { id: 'close-1', taskKey: 'bank-recs', name: 'Complete operating account reconciliations', phase: 'pre_close', entityId: 'e1', departmentId: 'd-fin', dueDate: new Date('2026-04-04T12:00:00'), ownerId: 'u1', ownerName: 'Ava Mitchell', status: 'in_progress', dependencies: [], documentCount: 2, exceptionCount: 1 },
  { id: 'close-2', taskKey: 'ap-cutoff', name: 'Finalize AP cutoff accruals', phase: 'soft_close', entityId: 'e1', departmentId: 'd-fin', dueDate: new Date('2026-04-04T17:00:00'), ownerId: 'u3', ownerName: 'Lena Garcia', status: 'not_started', dependencies: ['close-1'], documentCount: 1, exceptionCount: 2 },
  { id: 'close-3', taskKey: 'ar-review', name: 'Review overdue AR and reserve', phase: 'soft_close', entityId: 'e1', departmentId: 'd-sales', dueDate: new Date('2026-04-05T11:00:00'), ownerId: 'u4', ownerName: 'Owen Price', status: 'in_progress', dependencies: [], documentCount: 1, exceptionCount: 1 },
  { id: 'close-4', taskKey: 'tb-signoff', name: 'Trial balance sign-off', phase: 'hard_close', entityId: 'e1', departmentId: 'd-fin', dueDate: new Date('2026-04-06T13:00:00'), ownerId: 'u2', ownerName: 'Miles Chen', status: 'not_started', dependencies: ['close-2', 'close-3'], documentCount: 0, exceptionCount: 0 },
  { id: 'close-5', taskKey: 'eu-intercompany', name: 'Book EU intercompany elimination', phase: 'post_close', entityId: 'e3', departmentId: 'd-fin', projectId: 'p-eu', dueDate: new Date('2026-04-06T16:00:00'), ownerId: 'u1', ownerName: 'Ava Mitchell', status: 'blocked', blockerReason: 'Waiting on final counterparty confirmation', dependencies: ['close-4'], documentCount: 1, exceptionCount: 1 },
]

export const workflowApprovalItems: ApprovalItem[] = [
  { id: 'ap-3001', type: 'journal_entry', documentId: 'je-1003', documentNumber: 'JE-2026-1003', description: 'Payroll accrual requires controller approval', amount: 86000, currency: 'USD', requestedBy: 'Ava Mitchell', requestedAt: new Date('2026-03-27T11:30:00'), status: 'pending', priority: 'high', entityId: 'e2' },
]

export const workflowDocuments: Document[] = [
  { id: 'doc-close-1', number: 'DOC-CLOSE-1', type: 'attachment', module: 'close', title: 'Operating account reconciliation package', status: 'pending', entityId: 'e1', relatedEntityType: 'close_task', relatedEntityId: 'close-1', fileName: 'operating-account-rec.xlsx', fileSizeBytes: 98412, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', tags: ['reconciliation', 'month-end'], createdAt: new Date('2026-04-03T18:10:00'), updatedAt: new Date('2026-04-04T08:00:00'), version: 3 },
  { id: 'doc-je-1002', number: 'DOC-JE-1002', type: 'journal_entry', module: 'gl', title: 'Deferred revenue release support', status: 'posted', entityId: 'e1', relatedEntityType: 'journal_entry', relatedEntityId: 'je-1002', fileName: 'je-1002-support.pdf', fileSizeBytes: 228401, mimeType: 'application/pdf', tags: ['revenue', 'support'], createdAt: new Date('2026-03-29T09:50:00'), updatedAt: new Date('2026-03-29T10:14:00'), version: 1 },
]

export const allocationRules: AllocationRule[] = [
  {
    id: 'alloc-1',
    name: 'Shared finance overhead',
    description: 'Allocate controllership overhead to supported entities based on transaction volume.',
    sourceAccountId: 'a-payroll',
    sourceAccountName: 'Payroll Expense',
    method: 'percentage',
    basis: 'monthly_transaction_volume',
    status: 'active',
    frequency: 'monthly',
    entityId: 'e1',
    createdBy: 'u2',
    createdAt: new Date('2025-12-15T10:00:00'),
    targets: [
      { targetAccountId: 'a-payroll', targetAccountName: 'Payroll Expense', departmentId: 'd-fin', percentage: 55 },
      { targetAccountId: 'a-payroll', targetAccountName: 'Payroll Expense', departmentId: 'd-ops', percentage: 30 },
      { targetAccountId: 'a-payroll', targetAccountName: 'Payroll Expense', projectId: 'p-eu', percentage: 15 },
    ],
  },
]

export const notifications: Notification[] = [
  { id: 'not-1', type: 'task_due', title: 'Close task due at noon', message: 'Operating account reconciliation is due today at 12:00 PM.', read: false, actionUrl: '/work-queue', relatedType: 'close_task', relatedId: 'close-1', createdAt: new Date('2026-04-04T08:05:00') },
  { id: 'not-2', type: 'approval_required', title: 'Journal approval required', message: 'JE-2026-1003 needs controller review.', read: false, actionUrl: '/approvals', relatedType: 'journal_entry', relatedId: 'je-1003', createdAt: new Date('2026-04-04T07:50:00') },
  { id: 'not-3', type: 'sync_error', title: 'EU bank feed delay', message: 'Berlin operating account sync is 6 hours behind.', read: false, actionUrl: '/cash-management/reconciliation', relatedType: 'bank_account', relatedId: 'ba-eu', createdAt: new Date('2026-04-04T06:20:00') },
]

export const savedViews: SavedView[] = [
  { id: 'sv-1', name: 'Month-End Exceptions', module: 'work-queue', filters: { sectionId: 'close_tasks', status: ['blocked', 'in_progress'] }, columns: ['item', 'entity', 'assignee', 'status', 'dueDate'], sortBy: 'dueDate', sortDirection: 'asc', isDefault: true, roleScope: ['accountant', 'controller'], createdBy: 'u1', createdAt: new Date('2026-03-15T08:00:00') },
  { id: 'sv-4', name: 'My Today Queue', module: 'work-queue', filters: { sectionId: 'assigned_to_me', status: ['needs_review', 'pending_approval', 'blocked'] }, columns: ['item', 'source', 'status', 'priority', 'dueDate'], sortBy: 'dueDate', sortDirection: 'asc', isDefault: false, roleScope: ['accountant'], createdBy: 'u1', createdAt: new Date('2026-04-02T08:30:00') },
  { id: 'sv-5', name: 'Reconciliation Breaks', module: 'work-queue', filters: { sectionId: 'reconciliation_exceptions', status: ['needs_review', 'blocked'] }, columns: ['item', 'entity', 'amount', 'status', 'dueDate'], sortBy: 'dueDate', sortDirection: 'asc', isDefault: false, roleScope: ['accountant', 'controller'], createdBy: 'u1', createdAt: new Date('2026-04-03T09:10:00') },
  { id: 'sv-2', name: 'Pending AP Approvals', module: 'accounts-payable', filters: { approvalStatus: ['pending_approval'], entityId: 'e1' }, isDefault: false, roleScope: ['ap_specialist', 'controller'], createdBy: 'u3', createdAt: new Date('2026-03-20T09:00:00') },
  { id: 'sv-3', name: 'AR Collections', module: 'accounts-receivable', filters: { collectionStatus: ['in_collections', 'reminder_sent'] }, isDefault: false, roleScope: ['ar_specialist'], createdBy: 'u4', createdAt: new Date('2026-03-28T14:00:00') },
]

export const versionHistory: VersionHistoryItem[] = [
  { id: 'vh-1', entityType: 'bill', entityId: 'bill-7603', version: 2, changedAt: new Date('2026-03-23T09:20:00'), changedBy: 'u3', changedByName: 'Lena Garcia', summary: 'Submitted bill for approval', changes: [{ field: 'approvalStatus', oldValue: 'not_submitted', newValue: 'pending_approval' }] },
  { id: 'vh-2', entityType: 'journal_entry', entityId: 'je-1002', version: 1, changedAt: new Date('2026-03-29T10:14:00'), changedBy: 'u2', changedByName: 'Miles Chen', summary: 'Posted deferred revenue release', changes: [{ field: 'status', oldValue: 'draft', newValue: 'posted' }] },
]

export const activityTimeline: ActivityItem[] = [
  { id: 'act-1', entityType: 'bill', entityId: 'bill-7603', version: 2, changedAt: new Date('2026-03-23T09:20:00'), changedBy: 'u3', changedByName: 'Lena Garcia', summary: 'Submitted SkyGrid bill for approval', changes: [{ field: 'approvalStatus', oldValue: 'not_submitted', newValue: 'pending_approval' }], type: 'update', action: 'submitted', description: 'Submitted bill for approval routing', userId: 'u3', userName: 'Lena Garcia', entityId: 'e1' },
  { id: 'act-2', entityType: 'journal_entry', entityId: 'je-1002', version: 1, changedAt: new Date('2026-03-29T10:14:00'), changedBy: 'u2', changedByName: 'Miles Chen', summary: 'Posted JE-2026-1002', changes: [{ field: 'status', oldValue: 'draft', newValue: 'posted' }], type: 'post', action: 'posted', description: 'Posted deferred revenue release', userId: 'u2', userName: 'Miles Chen', entityId: 'e1' },
]
