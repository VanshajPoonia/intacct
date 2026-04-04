import type { PaginatedResponse, SortConfig } from './common'
import type { RoleId } from './identity'
import type { FinanceFilters, SavedView } from './reporting'
import type { ShellRouteLink } from './ui'

export type WorkQueueSectionId =
  | 'needs_review'
  | 'approvals'
  | 'reconciliation_exceptions'
  | 'missing_documents'
  | 'import_errors'
  | 'close_tasks'
  | 'assigned_to_me'

export type WorkQueueItemType =
  | 'journal_review'
  | 'approval'
  | 'reconciliation_exception'
  | 'missing_document'
  | 'import_error'
  | 'close_task'

export type WorkQueueStatus =
  | 'new'
  | 'needs_review'
  | 'pending_approval'
  | 'requested'
  | 'in_progress'
  | 'blocked'
  | 'error'
  | 'retrying'
  | 'snoozed'
  | 'reviewed'
  | 'resolved'
  | 'completed'

export type WorkQueuePriority = 'low' | 'medium' | 'high' | 'critical'

export type WorkQueueTone = 'neutral' | 'accent' | 'positive' | 'warning' | 'critical'

export type WorkQueueActionId =
  | 'assign'
  | 'assign_to_me'
  | 'mark_reviewed'
  | 'resolve'
  | 'request_documents'
  | 'snooze'
  | 'approve'
  | 'send_back'
  | 'retry_import'
  | 'start_task'
  | 'complete_task'

export type WorkQueueColumnId =
  | 'item'
  | 'reference'
  | 'source'
  | 'entity'
  | 'department'
  | 'project'
  | 'assignee'
  | 'status'
  | 'priority'
  | 'amount'
  | 'dueDate'
  | 'age'
  | 'updatedAt'

export interface WorkQueueColumnDefinition {
  id: WorkQueueColumnId
  label: string
  kind: 'item' | 'text' | 'person' | 'status' | 'priority' | 'amount' | 'date' | 'number'
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  className?: string
}

export interface WorkQueueActionDefinition {
  id: WorkQueueActionId
  label: string
  description: string
  icon: string
  tone?: WorkQueueTone
}

export interface WorkQueueSectionDefinition {
  id: WorkQueueSectionId
  label: string
  description: string
  icon: string
  columns: WorkQueueColumnId[]
  defaultSort: SortConfig
  availableActionIds: WorkQueueActionId[]
}

export interface WorkQueueSectionSummary extends WorkQueueSectionDefinition {
  count: number
  criticalCount: number
  overdueCount: number
}

export interface WorkQueueBadge {
  id: string
  label: string
  tone?: WorkQueueTone
}

export interface WorkQueueItem {
  id: string
  primarySectionId: WorkQueueSectionId
  sectionIds: WorkQueueSectionId[]
  type: WorkQueueItemType
  title: string
  description?: string
  reference?: string
  sourceLabel: string
  sourceEntityType: string
  sourceEntityId: string
  sourceHref?: string
  entityId: string
  entityName?: string
  departmentId?: string
  departmentName?: string
  projectId?: string
  projectName?: string
  assigneeId?: string
  assigneeName?: string
  amount?: number
  currency?: string
  status: WorkQueueStatus
  priority: WorkQueuePriority
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  ageInDays: number
  badges: WorkQueueBadge[]
  meta: string[]
  availableActionIds: WorkQueueActionId[]
}

export interface WorkQueueDetailField {
  id: string
  label: string
  value: string
  tone?: WorkQueueTone
}

export interface WorkQueueDetailSection {
  id: string
  title: string
  fields: WorkQueueDetailField[]
}

export interface WorkQueueTimelineEvent {
  id: string
  label: string
  description?: string
  occurredAt: Date
  userName?: string
}

export interface WorkQueueDetail {
  item: WorkQueueItem
  summary: WorkQueueDetailField[]
  sections: WorkQueueDetailSection[]
  links: ShellRouteLink[]
  availableActions: WorkQueueActionDefinition[]
  timeline: WorkQueueTimelineEvent[]
}

export interface WorkQueueFilters extends Partial<FinanceFilters> {
  sectionId?: WorkQueueSectionId
  search?: string
  assigneeId?: string
  status?: WorkQueueStatus[]
}

export interface WorkQueueTableState {
  page: number
  pageSize: number
  sort: SortConfig
}

export interface WorkQueueItemsResponse extends PaginatedResponse<WorkQueueItem> {
  activeSection: WorkQueueSectionSummary | null
  columns: WorkQueueColumnDefinition[]
  availableActions: WorkQueueActionDefinition[]
}

export interface WorkQueueSummary {
  sections: WorkQueueSectionSummary[]
  totalCount: number
  assignedToMeCount: number
  attentionCount: number
}

export interface WorkQueueSavedViewInput {
  id?: string
  name: string
  filters: WorkQueueFilters
  columns?: WorkQueueColumnId[]
  sort?: SortConfig
  isDefault?: boolean
  roleScope?: RoleId[]
}

export interface WorkQueueMutationInput {
  actionId: WorkQueueActionId
  assigneeId?: string
  assigneeName?: string
  note?: string
}

export interface WorkQueueMutationResult {
  updatedItemIds: string[]
  updatedItems: WorkQueueItem[]
  summary: WorkQueueSummary
}

export interface WorkQueueFilterOption {
  id: string
  label: string
}

export interface WorkQueueFilterOptions {
  departments: WorkQueueFilterOption[]
  projects: WorkQueueFilterOption[]
  assignees: WorkQueueFilterOption[]
  statuses: WorkQueueFilterOption[]
}

export interface WorkQueueMissingDocumentIssue {
  id: string
  title: string
  description: string
  entityId: string
  entityName?: string
  departmentId?: string
  departmentName?: string
  projectId?: string
  projectName?: string
  assigneeId?: string
  assigneeName?: string
  sourceEntityType: string
  sourceEntityId: string
  sourceLabel: string
  reference?: string
  amount?: number
  currency?: string
  requiredDocuments: string[]
  status: 'new' | 'requested' | 'resolved'
  priority: WorkQueuePriority
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface WorkQueueImportError {
  id: string
  title: string
  description: string
  entityId: string
  entityName?: string
  departmentId?: string
  departmentName?: string
  projectId?: string
  projectName?: string
  assigneeId?: string
  assigneeName?: string
  sourceSystem: string
  importType: 'bank_feed' | 'vendor_import' | 'invoice_import' | 'journal_import'
  errorCode: string
  affectedRecords: number
  sourceLabel: string
  sourceEntityType?: string
  sourceEntityId?: string
  reference?: string
  status: 'error' | 'retrying' | 'resolved'
  priority: WorkQueuePriority
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface WorkQueueItemStateOverride {
  itemId: string
  assigneeId?: string
  assigneeName?: string
  status?: WorkQueueStatus
  dueDate?: Date
  priority?: WorkQueuePriority
  updatedAt: Date
  note?: string
}

export type WorkQueueSavedView = SavedView
