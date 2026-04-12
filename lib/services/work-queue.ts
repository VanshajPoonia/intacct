import type {
  ActivityItem,
  ApprovalItem,
  Bill,
  CloseTask,
  Department,
  Entity,
  JournalEntry,
  Project,
  ReconciliationItem,
  Task,
  User,
  VersionHistoryItem,
  RoleId,
  SavedView,
  ShellRouteLink,
  WorkQueueActionDefinition,
  WorkQueueActionId,
  WorkQueueColumnDefinition,
  WorkQueueColumnId,
  WorkQueueDetail,
  WorkQueueDetailField,
  WorkQueueDetailSection,
  WorkQueueFilterOption,
  WorkQueueFilterOptions,
  WorkQueueFilters,
  WorkQueueImportError,
  WorkQueueItem,
  WorkQueueItemsResponse,
  WorkQueueItemStateOverride,
  WorkQueueMissingDocumentIssue,
  WorkQueueMutationInput,
  WorkQueueMutationResult,
  WorkQueuePriority,
  WorkQueueSavedViewInput,
  WorkQueueSectionId,
  WorkQueueSectionDefinition,
  WorkQueueSectionSummary,
  WorkQueueStatus,
  WorkQueueSummary,
  WorkQueueTableState,
  WorkQueueTimelineEvent,
} from '@/lib/types'
import { delay, paginate, sortItems } from './base'
import { getRolePermissions } from './identity'
import { getRuntimeDataset } from './runtime-data'
import { getSavedViews, saveView } from './search-views'

const defaultActiveSectionId: WorkQueueSectionId = 'needs_review'

let journalEntries: JournalEntry[] = []
let reconciliationItems: ReconciliationItem[] = []
let activityTimeline: ActivityItem[] = []
let closeTasks: CloseTask[] = []
let versionHistory: VersionHistoryItem[] = []
let workflowApprovalItems: ApprovalItem[] = []
let currentUser: User | null = null
let users: User[] = []
let departments: Department[] = []
let entities: Entity[] = []
let projects: Project[] = []
let bills: Bill[] = []
let payableApprovalItems: ApprovalItem[] = []
let workQueueSections: WorkQueueSectionDefinition[] = []
let workQueueActionDefinitions: WorkQueueActionDefinition[] = []
let workQueueImportErrors: WorkQueueImportError[] = []
let workQueueItemOverrides: WorkQueueItemStateOverride[] = []
let workQueueMissingDocumentIssues: WorkQueueMissingDocumentIssue[] = []

let workQueueOverrideStore: WorkQueueItemStateOverride[] = []
let workQueueMissingDocumentStore: WorkQueueMissingDocumentIssue[] = []
let workQueueImportErrorStore: WorkQueueImportError[] = []

let entityMap = new Map<string, Entity>()
let departmentMap = new Map<string, Department>()
let projectMap = new Map<string, Project>()
let billMap = new Map<string, Bill>()
let sectionMap = new Map<WorkQueueSectionId, WorkQueueSectionDefinition>()
let actionMap = new Map<WorkQueueActionId, WorkQueueActionDefinition>()
let workQueueStatePromise: Promise<void> | null = null

async function ensureWorkQueueState() {
  if (workQueueStatePromise) {
    return workQueueStatePromise
  }

  workQueueStatePromise = (async () => {
    const [accounting, workflow, identity, organization, payables, workQueue] = await Promise.all([
      getRuntimeDataset<{ journalEntries: JournalEntry[]; reconciliationItems: ReconciliationItem[] }>("accounting"),
      getRuntimeDataset<{
        activityTimeline: ActivityItem[]
        closeTasks: CloseTask[]
        versionHistory: VersionHistoryItem[]
        workflowApprovalItems: ApprovalItem[]
      }>("workflow"),
      getRuntimeDataset<{ currentUser: User; users: User[] }>("identity"),
      getRuntimeDataset<{ departments: Department[]; entities: Entity[]; projects: Project[] }>("organization"),
      getRuntimeDataset<{ bills: Bill[]; payableApprovalItems: ApprovalItem[] }>("payables"),
      getRuntimeDataset<{
        workQueueActionDefinitions: WorkQueueActionDefinition[]
        workQueueImportErrors: WorkQueueImportError[]
        workQueueItemOverrides: WorkQueueItemStateOverride[]
        workQueueMissingDocumentIssues: WorkQueueMissingDocumentIssue[]
        workQueueSections: WorkQueueSectionDefinition[]
      }>("work_queue"),
    ])

    journalEntries = accounting.journalEntries
    reconciliationItems = accounting.reconciliationItems
    activityTimeline = workflow.activityTimeline
    closeTasks = workflow.closeTasks
    versionHistory = workflow.versionHistory
    workflowApprovalItems = workflow.workflowApprovalItems
    currentUser = identity.currentUser
    users = identity.users
    departments = organization.departments
    entities = organization.entities
    projects = organization.projects
    bills = payables.bills
    payableApprovalItems = payables.payableApprovalItems
    workQueueSections = workQueue.workQueueSections
    workQueueActionDefinitions = workQueue.workQueueActionDefinitions
    workQueueImportErrors = workQueue.workQueueImportErrors
    workQueueItemOverrides = workQueue.workQueueItemOverrides
    workQueueMissingDocumentIssues = workQueue.workQueueMissingDocumentIssues

    workQueueOverrideStore = workQueueItemOverrides.map(override => ({ ...override }))
    workQueueMissingDocumentStore = workQueueMissingDocumentIssues.map(issue => ({
      ...issue,
      requiredDocuments: [...issue.requiredDocuments],
    }))
    workQueueImportErrorStore = workQueueImportErrors.map(error => ({ ...error }))

    entityMap = new Map(entities.map(entity => [entity.id, entity]))
    departmentMap = new Map(departments.map(department => [department.id, department]))
    projectMap = new Map(projects.map(project => [project.id, project]))
    billMap = new Map(bills.map(bill => [bill.id, bill]))
    sectionMap = new Map(workQueueSections.map(section => [section.id, section]))
    actionMap = new Map(workQueueActionDefinitions.map(action => [action.id, action]))
  })()

  try {
    await workQueueStatePromise
  } finally {
    workQueueStatePromise = null
  }
}

const workQueueColumns: Record<WorkQueueColumnId, WorkQueueColumnDefinition> = {
  item: {
    id: 'item',
    label: 'Work Item',
    kind: 'item',
    sortable: true,
    className: 'min-w-[320px]',
  },
  reference: {
    id: 'reference',
    label: 'Reference',
    kind: 'text',
    sortable: true,
    className: 'min-w-[140px]',
  },
  source: {
    id: 'source',
    label: 'Source',
    kind: 'text',
    sortable: true,
    className: 'min-w-[140px]',
  },
  entity: {
    id: 'entity',
    label: 'Entity',
    kind: 'text',
    sortable: true,
    className: 'min-w-[160px]',
  },
  department: {
    id: 'department',
    label: 'Department',
    kind: 'text',
    sortable: true,
    className: 'min-w-[140px]',
  },
  project: {
    id: 'project',
    label: 'Project',
    kind: 'text',
    sortable: true,
    className: 'min-w-[160px]',
  },
  assignee: {
    id: 'assignee',
    label: 'Owner',
    kind: 'person',
    sortable: true,
    className: 'min-w-[150px]',
  },
  status: {
    id: 'status',
    label: 'Status',
    kind: 'status',
    sortable: true,
    className: 'min-w-[130px]',
  },
  priority: {
    id: 'priority',
    label: 'Priority',
    kind: 'priority',
    sortable: true,
    className: 'min-w-[110px]',
  },
  amount: {
    id: 'amount',
    label: 'Amount',
    kind: 'amount',
    sortable: true,
    align: 'right',
    className: 'min-w-[120px]',
  },
  dueDate: {
    id: 'dueDate',
    label: 'Due',
    kind: 'date',
    sortable: true,
    className: 'min-w-[120px]',
  },
  age: {
    id: 'age',
    label: 'Age',
    kind: 'number',
    sortable: true,
    align: 'right',
    className: 'min-w-[90px]',
  },
  updatedAt: {
    id: 'updatedAt',
    label: 'Updated',
    kind: 'date',
    sortable: true,
    className: 'min-w-[140px]',
  },
}

const actionableStatuses: WorkQueueStatus[] = [
  'new',
  'needs_review',
  'pending_approval',
  'requested',
  'in_progress',
  'blocked',
  'error',
  'retrying',
  'snoozed',
]

function formatCurrency(value: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateTime(value?: Date) {
  if (!value) {
    return 'None'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value)
}

function formatShortDate(value?: Date) {
  if (!value) {
    return 'None'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(value)
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, ' ')
}

function getItemOperationalDate(item: Pick<WorkQueueItem, 'dueDate' | 'updatedAt' | 'createdAt'>) {
  return item.dueDate ?? item.updatedAt ?? item.createdAt
}

function calculateAgeInDays(from: Date) {
  const now = new Date()
  const diff = now.getTime() - from.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function getPriorityTone(priority: WorkQueuePriority) {
  if (priority === 'critical') {
    return 'critical' as const
  }
  if (priority === 'high') {
    return 'warning' as const
  }
  return 'neutral' as const
}

function getStatusTone(status: WorkQueueStatus) {
  if (['completed', 'reviewed', 'resolved'].includes(status)) {
    return 'positive' as const
  }
  if (['blocked', 'error'].includes(status)) {
    return 'critical' as const
  }
  if (['pending_approval', 'requested', 'snoozed', 'retrying'].includes(status)) {
    return 'warning' as const
  }
  if (['in_progress', 'needs_review'].includes(status)) {
    return 'accent' as const
  }
  return 'neutral' as const
}

function entityMatchesFilter(entityId: string | undefined, filterEntityId?: string) {
  if (!filterEntityId || filterEntityId === 'e4') {
    return true
  }
  return entityId === filterEntityId
}

function departmentMatchesFilter(departmentId: string | undefined, filterDepartmentId?: string) {
  if (!filterDepartmentId) {
    return true
  }
  return departmentId === filterDepartmentId
}

function projectMatchesFilter(projectId: string | undefined, filterProjectId?: string) {
  if (!filterProjectId) {
    return true
  }
  return projectId === filterProjectId
}

function isWithinDateRange(date: Date, filters: WorkQueueFilters) {
  if (!filters.dateRange) {
    return true
  }
  return date >= filters.dateRange.startDate && date <= filters.dateRange.endDate
}

function isActionableStatus(status: WorkQueueStatus) {
  return actionableStatuses.includes(status)
}

function getSectionActionDefinitions(sectionId: WorkQueueSectionId) {
  return (sectionMap.get(sectionId)?.availableActionIds ?? [])
    .map(actionId => actionMap.get(actionId))
    .filter((action): action is WorkQueueActionDefinition => Boolean(action))
}

function sanitizeQueueFilters(filters: WorkQueueFilters) {
  return {
    sectionId: filters.sectionId,
    search: filters.search,
    departmentId: filters.departmentId,
    projectId: filters.projectId,
    assigneeId: filters.assigneeId,
    status: filters.status,
  }
}

function findOverride(itemId: string) {
  return workQueueOverrideStore.find(override => override.itemId === itemId)
}

function upsertOverride(itemId: string, updates: Partial<WorkQueueItemStateOverride>) {
  const existing = findOverride(itemId)
  if (existing) {
    Object.assign(existing, updates, { updatedAt: new Date() })
    return existing
  }

  const created: WorkQueueItemStateOverride = {
    itemId,
    updatedAt: new Date(),
    ...updates,
  }
  workQueueOverrideStore.push(created)
  return created
}

function getAssignedSectionIds(
  baseSectionId: WorkQueueSectionId,
  assigneeId: string | undefined,
  activeUserId: string
): WorkQueueSectionId[] {
  return assigneeId === activeUserId ? [baseSectionId, 'assigned_to_me'] : [baseSectionId]
}

function buildTimeline(item: WorkQueueItem): WorkQueueTimelineEvent[] {
  const matchingActivity = activityTimeline
    .filter(entry => entry.entityType === item.sourceEntityType && entry.entityId === item.sourceEntityId)
    .map(entry => ({
      id: `activity-${entry.id}`,
      label: entry.action,
      description: entry.description,
      occurredAt: entry.changedAt,
      userName: entry.userName,
    }))

  const matchingHistory = versionHistory
    .filter(entry => entry.entityType === item.sourceEntityType && entry.entityId === item.sourceEntityId)
    .map(entry => ({
      id: `history-${entry.id}`,
      label: entry.summary,
      description: entry.changes.map(change => `${change.field}: ${change.oldValue ?? 'blank'} -> ${change.newValue ?? 'blank'}`).join(' | '),
      occurredAt: entry.changedAt,
      userName: entry.changedByName,
    }))

  const queueOverride = findOverride(item.id)
  const queueEvent = queueOverride
    ? [
        {
          id: `queue-${item.id}`,
          label: 'Queue state updated',
          description: queueOverride.note ?? `Status ${formatStatusLabel(item.status)} · Owner ${item.assigneeName ?? 'Unassigned'}`,
          occurredAt: queueOverride.updatedAt,
          userName: item.assigneeName,
        },
      ]
    : []

  return [...matchingActivity, ...matchingHistory, ...queueEvent].sort(
    (left, right) => right.occurredAt.getTime() - left.occurredAt.getTime()
  )
}

function buildCommonLinks(item: WorkQueueItem): ShellRouteLink[] {
  const links: ShellRouteLink[] = []

  if (item.sourceHref) {
    links.push({
      id: `source-${item.id}`,
      label: 'Open Source Record',
      href: item.sourceHref,
      description: `Open ${item.reference ?? item.title} in its home module.`,
      icon: 'ArrowLeftRight',
    })
  }

  if (item.primarySectionId === 'reconciliation_exceptions') {
    links.push({
      id: `reconcile-${item.id}`,
      label: 'Open Reconciliation Workspace',
      href: '/cash-management/reconciliation',
      description: 'Jump into the reconciliation workspace with the current entity context.',
      icon: 'ArrowLeftRight',
    })
  }

  if (item.primarySectionId === 'close_tasks' || item.primarySectionId === 'missing_documents') {
    links.push({
      id: `queue-${item.id}`,
      label: 'Stay In Work Queue',
      href: '/work-queue',
      description: 'Return to the unified accounting queue after completing the task.',
      icon: 'Inbox',
    })
  }

  return links
}

function toQueueItemFromJournal(entry: (typeof journalEntries)[number], activeUserId: string): WorkQueueItem {
  const itemId = `wq-journal-review-${entry.id}`
  const override = findOverride(itemId)
  const operationalDueDate = override?.dueDate ?? new Date(new Date().setHours(17, 0, 0, 0))
  const priority = override?.priority ?? (entry.status === 'pending' ? 'high' : 'medium')
  const status = override?.status ?? 'needs_review'
  const entity = entityMap.get(entry.entityId)
  const firstLine = entry.lines[0]

  return {
    id: itemId,
    primarySectionId: 'needs_review',
    sectionIds: getAssignedSectionIds('needs_review', override?.assigneeId, activeUserId),
    type: 'journal_review',
    title: entry.description,
    description: `${entry.number} is ${formatStatusLabel(entry.status)} and ready for accounting review.`,
    reference: entry.number,
    sourceLabel: 'Journal Review',
    sourceEntityType: 'journal_entry',
    sourceEntityId: entry.id,
    sourceHref: '/general-ledger/journal-entries',
    entityId: entry.entityId,
    entityName: entity?.name,
    departmentId: firstLine?.departmentId,
    departmentName: firstLine?.departmentName,
    projectId: firstLine?.projectId,
    projectName: firstLine?.projectName,
    assigneeId: override?.assigneeId,
    assigneeName: override?.assigneeName,
    amount: entry.lines.reduce((sum, line) => sum + line.debit, 0),
    currency: entity?.currency ?? 'USD',
    status,
    priority,
    dueDate: operationalDueDate,
    createdAt: entry.createdAt,
    updatedAt: override?.updatedAt ?? entry.createdAt,
    ageInDays: calculateAgeInDays(entry.createdAt),
    badges: [
      { id: `${itemId}-status`, label: formatStatusLabel(status), tone: getStatusTone(status) },
      { id: `${itemId}-entry-status`, label: formatStatusLabel(entry.status), tone: 'neutral' },
    ],
    meta: [`${entry.lines.length} lines`, `Prepared by ${entry.createdBy}`],
    availableActionIds: ['assign', 'assign_to_me', 'mark_reviewed', 'snooze'],
  }
}

function toQueueItemFromApproval(
  approval: (typeof payableApprovalItems)[number] | (typeof workflowApprovalItems)[number],
  activeUserId: string
): WorkQueueItem {
  const itemId = `wq-approval-${approval.id}`
  const override = findOverride(itemId)
  const relatedBill = billMap.get(approval.documentId)
  const entity = entityMap.get(approval.entityId)
  const dueDate =
    override?.dueDate ??
    relatedBill?.dueDate ??
    new Date(approval.requestedAt.getTime() + 2 * 24 * 60 * 60 * 1000)
  const priority = override?.priority ?? approval.priority ?? 'medium'
  const status = override?.status ?? 'pending_approval'

  return {
    id: itemId,
    primarySectionId: 'approvals',
    sectionIds: getAssignedSectionIds('approvals', override?.assigneeId, activeUserId),
    type: 'approval',
    title: approval.description,
    description: `${approval.documentNumber} is waiting on approval routing.`,
    reference: approval.documentNumber,
    sourceLabel: approval.type === 'bill' ? 'Bill Approval' : 'Workflow Approval',
    sourceEntityType: approval.type,
    sourceEntityId: approval.documentId,
    sourceHref: approval.type === 'bill' ? '/accounts-payable/bills' : '/general-ledger/journal-entries',
    entityId: approval.entityId,
    entityName: entity?.name,
    departmentId: relatedBill?.departmentId,
    departmentName: relatedBill?.departmentName,
    projectId: relatedBill?.lineItems[0]?.projectId,
    projectName: relatedBill?.lineItems[0]?.projectName,
    assigneeId: override?.assigneeId,
    assigneeName: override?.assigneeName,
    amount: approval.amount,
    currency: approval.currency,
    status,
    priority,
    dueDate,
    createdAt: approval.requestedAt,
    updatedAt: override?.updatedAt ?? approval.requestedAt,
    ageInDays: calculateAgeInDays(approval.requestedAt),
    badges: [
      { id: `${itemId}-status`, label: formatStatusLabel(status), tone: getStatusTone(status) },
      { id: `${itemId}-priority`, label: priority, tone: getPriorityTone(priority) },
    ],
    meta: [`Requested by ${approval.requestedBy}`],
    availableActionIds: ['assign', 'assign_to_me', 'approve', 'send_back', 'snooze'],
  }
}

function toQueueItemFromReconciliation(item: (typeof reconciliationItems)[number], activeUserId: string): WorkQueueItem {
  const itemId = `wq-reconciliation-${item.id}`
  const override = findOverride(itemId)
  const entityId = item.entityId ?? 'e1'
  const entity = entityMap.get(entityId)
  const priority = override?.priority ?? (Math.abs(item.difference) >= 500 ? 'critical' : 'high')
  const status = override?.status ?? 'needs_review'
  const dueDate =
    override?.dueDate ?? new Date(new Date().setHours(12, 0, 0, 0))

  return {
    id: itemId,
    primarySectionId: 'reconciliation_exceptions',
    sectionIds: getAssignedSectionIds('reconciliation_exceptions', override?.assigneeId, activeUserId),
    type: 'reconciliation_exception',
    title: item.description,
    description: `${item.reference ?? 'Unreferenced activity'} has a reconciliation variance of ${formatCurrency(Math.abs(item.difference), entity?.currency ?? 'USD')}.`,
    reference: item.reference,
    sourceLabel: 'Bank Reconciliation',
    sourceEntityType: 'reconciliation_item',
    sourceEntityId: item.id,
    sourceHref: '/cash-management/reconciliation',
    entityId,
    entityName: entity?.name,
    departmentId: item.departmentId,
    departmentName: item.departmentId ? departmentMap.get(item.departmentId)?.name : undefined,
    projectId: item.projectId,
    projectName: item.projectId ? projectMap.get(item.projectId)?.name : undefined,
    assigneeId: override?.assigneeId,
    assigneeName: override?.assigneeName,
    amount: Math.abs(item.difference || item.bankAmount),
    currency: entity?.currency ?? 'USD',
    status,
    priority,
    dueDate,
    createdAt: item.date,
    updatedAt: override?.updatedAt ?? item.date,
    ageInDays: calculateAgeInDays(item.date),
    badges: [
      { id: `${itemId}-status`, label: formatStatusLabel(status), tone: getStatusTone(status) },
      { id: `${itemId}-source-status`, label: formatStatusLabel(item.status), tone: 'neutral' },
    ],
    meta: [`Difference ${formatCurrency(item.difference, entity?.currency ?? 'USD')}`],
    availableActionIds: ['assign', 'assign_to_me', 'resolve', 'snooze'],
  }
}

function toQueueItemFromCloseTask(task: (typeof closeTasks)[number], activeUserId: string): WorkQueueItem {
  const itemId = `wq-close-${task.id}`
  const override = findOverride(itemId)
  const entity = entityMap.get(task.entityId)
  const priority = override?.priority ?? (task.status === 'blocked' || task.exceptionCount > 0 ? 'high' : 'medium')
  const status =
    override?.status ??
    (task.status === 'not_started' ? 'new' : task.status === 'completed' ? 'completed' : task.status)

  return {
    id: itemId,
    primarySectionId: 'close_tasks',
    sectionIds: getAssignedSectionIds('close_tasks', override?.assigneeId ?? task.ownerId, activeUserId),
    type: 'close_task',
    title: task.name,
    description: `${formatStatusLabel(task.phase)} close task with ${task.exceptionCount} active exception${task.exceptionCount === 1 ? '' : 's'}.`,
    reference: task.taskKey,
    sourceLabel: 'Close Task',
    sourceEntityType: 'close_task',
    sourceEntityId: task.id,
    sourceHref: '/work-queue',
    entityId: task.entityId,
    entityName: entity?.name,
    departmentId: task.departmentId,
    departmentName: task.departmentId ? departmentMap.get(task.departmentId)?.name : undefined,
    projectId: task.projectId,
    projectName: task.projectId ? projectMap.get(task.projectId)?.name : undefined,
    assigneeId: override?.assigneeId ?? task.ownerId,
    assigneeName: override?.assigneeName ?? task.ownerName,
    status,
    priority,
    dueDate: override?.dueDate ?? task.dueDate,
    createdAt: task.dueDate,
    updatedAt: override?.updatedAt ?? task.dueDate,
    ageInDays: calculateAgeInDays(task.dueDate),
    badges: [
      { id: `${itemId}-status`, label: formatStatusLabel(status), tone: getStatusTone(status) },
      { id: `${itemId}-phase`, label: formatStatusLabel(task.phase), tone: 'neutral' },
    ],
    meta: [`${task.documentCount} docs`, `${task.exceptionCount} exceptions`],
    availableActionIds: ['assign', 'assign_to_me', 'start_task', 'complete_task', 'snooze'],
  }
}

function toQueueItemFromMissingDocument(issue: WorkQueueMissingDocumentIssue, activeUserId: string): WorkQueueItem {
  const entity = entityMap.get(issue.entityId)
  const status = issue.status === 'resolved' ? 'resolved' : issue.status === 'requested' ? 'requested' : 'new'

  return {
    id: issue.id,
    primarySectionId: 'missing_documents',
    sectionIds: getAssignedSectionIds('missing_documents', issue.assigneeId, activeUserId),
    type: 'missing_document',
    title: issue.title,
    description: issue.description,
    reference: issue.reference,
    sourceLabel: issue.sourceLabel,
    sourceEntityType: issue.sourceEntityType,
    sourceEntityId: issue.sourceEntityId,
    sourceHref:
      issue.sourceEntityType === 'bill'
        ? '/accounts-payable/bills'
        : issue.sourceEntityType === 'journal_entry'
          ? '/general-ledger/journal-entries'
          : '/work-queue',
    entityId: issue.entityId,
    entityName: issue.entityName ?? entity?.name,
    departmentId: issue.departmentId,
    departmentName: issue.departmentName,
    projectId: issue.projectId,
    projectName: issue.projectName,
    assigneeId: issue.assigneeId,
    assigneeName: issue.assigneeName,
    amount: issue.amount,
    currency: issue.currency ?? entity?.currency ?? 'USD',
    status,
    priority: issue.priority,
    dueDate: issue.dueDate,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    ageInDays: calculateAgeInDays(issue.createdAt),
    badges: [
      { id: `${issue.id}-status`, label: formatStatusLabel(status), tone: getStatusTone(status) },
      { id: `${issue.id}-docs`, label: `${issue.requiredDocuments.length} docs`, tone: 'warning' },
    ],
    meta: issue.requiredDocuments,
    availableActionIds: ['assign', 'assign_to_me', 'request_documents', 'snooze'],
  }
}

function toQueueItemFromImportError(issue: WorkQueueImportError, activeUserId: string): WorkQueueItem {
  const entity = entityMap.get(issue.entityId)

  return {
    id: issue.id,
    primarySectionId: 'import_errors',
    sectionIds: getAssignedSectionIds('import_errors', issue.assigneeId, activeUserId),
    type: 'import_error',
    title: issue.title,
    description: issue.description,
    reference: issue.reference,
    sourceLabel: issue.sourceLabel,
    sourceEntityType: issue.sourceEntityType ?? issue.importType,
    sourceEntityId: issue.sourceEntityId ?? issue.id,
    sourceHref: issue.importType === 'bank_feed' ? '/cash-management/reconciliation' : '/integrations',
    entityId: issue.entityId,
    entityName: issue.entityName ?? entity?.name,
    departmentId: issue.departmentId,
    departmentName: issue.departmentName,
    projectId: issue.projectId,
    projectName: issue.projectName,
    assigneeId: issue.assigneeId,
    assigneeName: issue.assigneeName,
    status: issue.status,
    priority: issue.priority,
    dueDate: issue.dueDate,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    ageInDays: calculateAgeInDays(issue.createdAt),
    badges: [
      { id: `${issue.id}-status`, label: formatStatusLabel(issue.status), tone: getStatusTone(issue.status) },
      { id: `${issue.id}-records`, label: `${issue.affectedRecords} records`, tone: 'warning' },
    ],
    meta: [issue.sourceSystem, issue.errorCode],
    availableActionIds: ['assign', 'assign_to_me', 'retry_import', 'resolve', 'snooze'],
  }
}

function buildAllQueueItems(activeUserId: string) {
  const openJournals = journalEntries
    .filter(entry => ['draft', 'pending'].includes(entry.status))
    .map(entry => toQueueItemFromJournal(entry, activeUserId))

  const openApprovals = [...payableApprovalItems, ...workflowApprovalItems]
    .filter(approval => approval.status === 'pending')
    .map(approval => toQueueItemFromApproval(approval, activeUserId))

  const reconciliationExceptions = reconciliationItems
    .filter(item => ['unmatched', 'adjusted'].includes(item.status))
    .map(item => toQueueItemFromReconciliation(item, activeUserId))

  const openCloseTasks = closeTasks
    .filter(task => task.status !== 'completed')
    .map(task => toQueueItemFromCloseTask(task, activeUserId))

  const missingDocuments = workQueueMissingDocumentStore
    .filter(issue => issue.status !== 'resolved')
    .map(issue => toQueueItemFromMissingDocument(issue, activeUserId))

  const importErrors = workQueueImportErrorStore
    .filter(issue => issue.status !== 'resolved')
    .map(issue => toQueueItemFromImportError(issue, activeUserId))

  return [
    ...openJournals,
    ...openApprovals,
    ...reconciliationExceptions,
    ...missingDocuments,
    ...importErrors,
    ...openCloseTasks,
  ]
}

function applyQueueFilters(items: WorkQueueItem[], filters: WorkQueueFilters, activeUserId: string) {
  return items.filter(item => {
    if (!isActionableStatus(item.status)) {
      return false
    }

    if (!entityMatchesFilter(item.entityId, filters.entityId)) {
      return false
    }

    if (!departmentMatchesFilter(item.departmentId, filters.departmentId)) {
      return false
    }

    if (!projectMatchesFilter(item.projectId, filters.projectId)) {
      return false
    }

    if (filters.sectionId && !item.sectionIds.includes(filters.sectionId)) {
      return false
    }

    if (filters.assigneeId && item.assigneeId !== filters.assigneeId) {
      return false
    }

    if (filters.status?.length && !filters.status.includes(item.status)) {
      return false
    }

    if (filters.search) {
      const query = filters.search.toLowerCase()
      const haystack = [
        item.title,
        item.description,
        item.reference,
        item.sourceLabel,
        item.entityName,
        item.departmentName,
        item.projectName,
        item.assigneeName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      if (!haystack.includes(query)) {
        return false
      }
    }

    if (!isWithinDateRange(getItemOperationalDate(item), filters)) {
      return false
    }

    if (filters.sectionId === 'assigned_to_me' && item.assigneeId !== activeUserId) {
      return false
    }

    return true
  })
}

function buildSummaryFromItems(items: WorkQueueItem[], filters: WorkQueueFilters, activeUserId: string): WorkQueueSummary {
  const unsectionedFilters = { ...filters, sectionId: undefined }
  const filtered = applyQueueFilters(items, unsectionedFilters, activeUserId)

  const sections = workQueueSections.map(section => {
    const sectionItems = filtered.filter(item => item.sectionIds.includes(section.id))
    const overdueCount = sectionItems.filter(item => item.dueDate && item.dueDate < new Date()).length
    const criticalCount = sectionItems.filter(
      item => item.priority === 'critical' || item.status === 'blocked' || item.status === 'error'
    ).length

    return {
      ...section,
      count: sectionItems.length,
      criticalCount,
      overdueCount,
    }
  })

  return {
    sections,
    totalCount: filtered.length,
    assignedToMeCount: filtered.filter(item => item.assigneeId === activeUserId).length,
    attentionCount: filtered.filter(item => ['critical', 'high'].includes(item.priority) || ['blocked', 'error'].includes(item.status)).length,
  }
}

function buildDetailSections(item: WorkQueueItem): WorkQueueDetailSection[] {
  if (item.type === 'journal_review') {
    const entry = journalEntries.find(candidate => candidate.id === item.sourceEntityId)
    if (!entry) {
      return []
    }

    return [
      {
        id: 'queue',
        title: 'Queue Context',
        fields: [
          { id: 'queue-status', label: 'Queue Status', value: formatStatusLabel(item.status), tone: getStatusTone(item.status) },
          { id: 'entry-status', label: 'Entry Status', value: formatStatusLabel(entry.status) },
          { id: 'created-by', label: 'Prepared By', value: entry.createdBy },
          { id: 'lines', label: 'Journal Lines', value: String(entry.lines.length) },
        ],
      },
      {
        id: 'coding',
        title: 'Coding Context',
        fields: entry.lines.slice(0, 3).map((line, index) => ({
          id: `line-${line.id}`,
          label: `Line ${index + 1}`,
          value: `${line.accountNumber} ${line.accountName} · ${formatCurrency(line.debit || line.credit, item.currency ?? 'USD')}`,
        })),
      },
    ]
  }

  if (item.type === 'approval') {
    const approval = [...payableApprovalItems, ...workflowApprovalItems].find(candidate => candidate.id === item.id.replace('wq-approval-', ''))
    const relatedBill = approval ? billMap.get(approval.documentId) : undefined

    return [
      {
        id: 'approval',
        title: 'Approval Routing',
        fields: [
          { id: 'requested-by', label: 'Requested By', value: approval?.requestedBy ?? 'Unknown' },
          { id: 'requested-at', label: 'Requested At', value: formatDateTime(approval?.requestedAt) },
          { id: 'document-type', label: 'Document Type', value: approval?.type.replace(/_/g, ' ') ?? 'Unknown' },
          { id: 'amount', label: 'Amount', value: formatCurrency(approval?.amount ?? item.amount ?? 0, approval?.currency ?? item.currency ?? 'USD') },
        ],
      },
      {
        id: 'bill',
        title: 'Source Record',
        fields: [
          { id: 'source-number', label: 'Document Number', value: approval?.documentNumber ?? item.reference ?? 'Unknown' },
          { id: 'bill-due', label: 'Underlying Due Date', value: formatShortDate(relatedBill?.dueDate) },
          { id: 'bill-description', label: 'Description', value: relatedBill?.description ?? approval?.description ?? item.title },
        ],
      },
    ]
  }

  if (item.type === 'reconciliation_exception') {
    const reconItem = reconciliationItems.find(candidate => candidate.id === item.sourceEntityId)

    return [
      {
        id: 'variance',
        title: 'Exception Detail',
        fields: [
          { id: 'bank-amount', label: 'Bank Amount', value: formatCurrency(reconItem?.bankAmount ?? 0, item.currency ?? 'USD') },
          { id: 'book-amount', label: 'Book Amount', value: formatCurrency(reconItem?.bookAmount ?? 0, item.currency ?? 'USD') },
          { id: 'difference', label: 'Difference', value: formatCurrency(reconItem?.difference ?? 0, item.currency ?? 'USD'), tone: getStatusTone(item.status) },
          { id: 'source-status', label: 'Reconciliation Status', value: formatStatusLabel(reconItem?.status ?? item.status) },
        ],
      },
    ]
  }

  if (item.type === 'missing_document') {
    const issue = workQueueMissingDocumentStore.find(candidate => candidate.id === item.id)

    return [
      {
        id: 'document-request',
        title: 'Required Documents',
        fields: (issue?.requiredDocuments ?? []).map((document, index) => ({
          id: `required-${index}`,
          label: `Document ${index + 1}`,
          value: document,
          tone: 'warning',
        })),
      },
      {
        id: 'source',
        title: 'Source Context',
        fields: [
          { id: 'source-type', label: 'Source Type', value: issue?.sourceLabel ?? item.sourceLabel },
          { id: 'reference', label: 'Reference', value: issue?.reference ?? item.reference ?? 'Unknown' },
          { id: 'description', label: 'Queue Reason', value: issue?.description ?? item.description ?? item.title },
        ],
      },
    ]
  }

  if (item.type === 'import_error') {
    const issue = workQueueImportErrorStore.find(candidate => candidate.id === item.id)

    return [
      {
        id: 'error',
        title: 'Import Failure',
        fields: [
          { id: 'source-system', label: 'Source System', value: issue?.sourceSystem ?? 'Unknown' },
          { id: 'import-type', label: 'Import Type', value: issue?.importType.replace(/_/g, ' ') ?? 'Unknown' },
          { id: 'error-code', label: 'Error Code', value: issue?.errorCode ?? 'Unknown', tone: 'critical' },
          { id: 'affected-records', label: 'Affected Records', value: String(issue?.affectedRecords ?? 0) },
        ],
      },
    ]
  }

  if (item.type === 'close_task') {
    const task = closeTasks.find(candidate => candidate.id === item.sourceEntityId)

    return [
      {
        id: 'task',
        title: 'Task Detail',
        fields: [
          { id: 'phase', label: 'Close Phase', value: formatStatusLabel(task?.phase ?? 'unknown') },
          { id: 'documents', label: 'Documents', value: String(task?.documentCount ?? 0) },
          { id: 'exceptions', label: 'Exceptions', value: String(task?.exceptionCount ?? 0) },
          { id: 'dependencies', label: 'Dependencies', value: String(task?.dependencies.length ?? 0) },
        ],
      },
      {
        id: 'blockers',
        title: 'Execution Context',
        fields: [
          { id: 'owner', label: 'Original Owner', value: task?.ownerName ?? item.assigneeName ?? 'Unassigned' },
          { id: 'queue-status', label: 'Queue Status', value: formatStatusLabel(item.status), tone: getStatusTone(item.status) },
          { id: 'blocker', label: 'Blocker', value: task?.blockerReason ?? 'None' },
        ],
      },
    ]
  }

  return []
}

function getActiveUser(userId?: string): User {
  return users.find(user => user.id === (userId ?? currentUser?.id)) ?? currentUser ?? users[0]
}

function getActiveUserId(userId?: string) {
  return getActiveUser(userId).id
}

export async function getWorkQueueSections(
  filters: WorkQueueFilters,
  userId?: string
): Promise<WorkQueueSectionSummary[]> {
  await ensureWorkQueueState()
  await delay()
  const activeUserId = getActiveUserId(userId)
  const items = buildAllQueueItems(activeUserId)
  return buildSummaryFromItems(items, filters, activeUserId).sections
}

export async function getWorkQueueItems(
  filters: WorkQueueFilters,
  tableState: WorkQueueTableState,
  userId?: string
): Promise<WorkQueueItemsResponse> {
  await ensureWorkQueueState()
  await delay()
  const activeUserId = getActiveUserId(userId)
  const items = buildAllQueueItems(activeUserId)
  const summary = buildSummaryFromItems(items, filters, activeUserId)
  const activeSectionId = filters.sectionId ?? defaultActiveSectionId
  const activeSection = summary.sections.find(section => section.id === activeSectionId) ?? null
  const filtered = applyQueueFilters(items, { ...filters, sectionId: activeSectionId }, activeUserId)
  const sorted = sortItems(filtered, tableState.sort)
  const paginated = paginate(sorted, tableState.page, tableState.pageSize)

  return {
    ...paginated,
    activeSection,
    columns: (activeSection?.columns ?? sectionMap.get(defaultActiveSectionId)?.columns ?? []).map(columnId => workQueueColumns[columnId]),
    availableActions: getSectionActionDefinitions(activeSectionId),
  }
}

export async function getWorkQueueSummary(filters: WorkQueueFilters, userId?: string): Promise<WorkQueueSummary> {
  await ensureWorkQueueState()
  await delay()
  const activeUserId = getActiveUserId(userId)
  const items = buildAllQueueItems(activeUserId)
  return buildSummaryFromItems(items, filters, activeUserId)
}

export async function getWorkQueueItemDetail(itemId: string, userId?: string): Promise<WorkQueueDetail | null> {
  await ensureWorkQueueState()
  await delay()
  const activeUserId = getActiveUserId(userId)
  const item = buildAllQueueItems(activeUserId).find(candidate => candidate.id === itemId)
  if (!item) {
    return null
  }

  const summary: WorkQueueDetailField[] = [
    { id: 'detail-status', label: 'Status', value: formatStatusLabel(item.status), tone: getStatusTone(item.status) },
    { id: 'detail-priority', label: 'Priority', value: item.priority, tone: getPriorityTone(item.priority) },
    { id: 'detail-owner', label: 'Owner', value: item.assigneeName ?? 'Unassigned' },
    { id: 'detail-due', label: 'Due', value: formatDateTime(item.dueDate) },
  ]

  return {
    item,
    summary,
    sections: buildDetailSections(item),
    links: buildCommonLinks(item),
    availableActions: item.availableActionIds
      .map(actionId => actionMap.get(actionId))
      .filter((action): action is WorkQueueActionDefinition => Boolean(action)),
    timeline: buildTimeline(item),
  }
}

export async function getWorkQueueFilterOptions(filters: WorkQueueFilters, _userId?: string): Promise<WorkQueueFilterOptions> {
  await ensureWorkQueueState()
  await delay()

  const scopedDepartments = departments.filter(department => {
    if (!filters.entityId || filters.entityId === 'e4') {
      return true
    }

    return department.entityIds?.includes(filters.entityId)
  })

  const scopedProjects = projects.filter(project => entityMatchesFilter(project.entityId, filters.entityId))
  const assignees = users
    .filter(user => user.status === 'active')
    .map<WorkQueueFilterOption>(user => ({
      id: user.id,
      label: user.displayName ?? `${user.firstName} ${user.lastName}`,
    }))

  return {
    departments: scopedDepartments.map(department => ({ id: department.id, label: department.name })),
    projects: scopedProjects.map(project => ({ id: project.id, label: project.name })),
    assignees,
    statuses: actionableStatuses.map(status => ({ id: status, label: formatStatusLabel(status) })),
  }
}

export async function getWorkQueueSavedViews(roleId?: RoleId): Promise<SavedView[]> {
  await ensureWorkQueueState()
  const views = await getSavedViews('work-queue')
  if (!roleId) {
    return views
  }

  return views.filter(view => !view.roleScope?.length || view.roleScope.includes(roleId))
}

export async function saveWorkQueueView(input: WorkQueueSavedViewInput): Promise<SavedView> {
  await ensureWorkQueueState()
  return saveView({
    id: input.id,
    name: input.name,
    module: 'work-queue',
    filters: sanitizeQueueFilters(input.filters),
    columns: input.columns,
    sortBy: input.sort?.key,
    sortDirection: input.sort?.direction,
    isDefault: input.isDefault,
    roleScope: input.roleScope,
  })
}

function applyItemMutation(itemId: string, input: WorkQueueMutationInput, actingUserId: string) {
  const actingUser = getActiveUser(actingUserId)

  if (itemId.startsWith('wq-missing-doc-')) {
    const issue = workQueueMissingDocumentStore.find(candidate => candidate.id === itemId)
    if (!issue) {
      return
    }

    if (input.actionId === 'assign') {
      issue.assigneeId = input.assigneeId
      issue.assigneeName = input.assigneeName
    } else if (input.actionId === 'assign_to_me') {
      issue.assigneeId = actingUser.id
      issue.assigneeName = actingUser.displayName ?? `${actingUser.firstName} ${actingUser.lastName}`
    } else if (input.actionId === 'request_documents') {
      issue.status = 'requested'
    } else if (input.actionId === 'resolve' || input.actionId === 'mark_reviewed') {
      issue.status = 'resolved'
    }

    issue.updatedAt = new Date()
    return
  }

  if (itemId.startsWith('wq-import-error-')) {
    const issue = workQueueImportErrorStore.find(candidate => candidate.id === itemId)
    if (!issue) {
      return
    }

    if (input.actionId === 'assign') {
      issue.assigneeId = input.assigneeId
      issue.assigneeName = input.assigneeName
    } else if (input.actionId === 'assign_to_me') {
      issue.assigneeId = actingUser.id
      issue.assigneeName = actingUser.displayName ?? `${actingUser.firstName} ${actingUser.lastName}`
    } else if (input.actionId === 'retry_import') {
      issue.status = 'retrying'
    } else if (input.actionId === 'resolve') {
      issue.status = 'resolved'
    } else if (input.actionId === 'snooze') {
      upsertOverride(itemId, {
        status: 'snoozed',
        assigneeId: issue.assigneeId,
        assigneeName: issue.assigneeName,
        note: input.note,
      })
    }

    issue.updatedAt = new Date()
    return
  }

  const existing = findOverride(itemId)
  const assigneeId =
    input.actionId === 'assign'
      ? input.assigneeId
      : input.actionId === 'assign_to_me'
        ? actingUser.id
        : existing?.assigneeId
  const assigneeName =
    input.actionId === 'assign'
      ? input.assigneeName
      : input.actionId === 'assign_to_me'
        ? actingUser.displayName ?? `${actingUser.firstName} ${actingUser.lastName}`
        : existing?.assigneeName

  const nextStatusByAction: Partial<Record<WorkQueueActionId, WorkQueueStatus>> = {
    mark_reviewed: 'reviewed',
    resolve: 'resolved',
    snooze: 'snoozed',
    approve: 'completed',
    send_back: 'blocked',
    start_task: 'in_progress',
    complete_task: 'completed',
  }

  const nextDueDate =
    input.actionId === 'snooze'
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : existing?.dueDate

  upsertOverride(itemId, {
    assigneeId,
    assigneeName,
    dueDate: nextDueDate,
    status: nextStatusByAction[input.actionId] ?? existing?.status,
    note: input.note,
  })
}

export async function applyWorkQueueAction(
  itemId: string,
  input: WorkQueueMutationInput,
  filters?: WorkQueueFilters,
  userId?: string
): Promise<WorkQueueMutationResult> {
  await ensureWorkQueueState()
  await delay()
  const activeUserId = getActiveUserId(userId)
  applyItemMutation(itemId, input, activeUserId)
  const items = buildAllQueueItems(activeUserId)
  const summary = buildSummaryFromItems(items, filters ?? { sectionId: defaultActiveSectionId }, activeUserId)

  return {
    updatedItemIds: [itemId],
    updatedItems: items.filter(item => item.id === itemId),
    summary,
  }
}

export async function applyBulkWorkQueueAction(
  itemIds: string[],
  input: WorkQueueMutationInput,
  filters?: WorkQueueFilters,
  userId?: string
): Promise<WorkQueueMutationResult> {
  await ensureWorkQueueState()
  await delay()
  const activeUserId = getActiveUserId(userId)
  itemIds.forEach(itemId => applyItemMutation(itemId, input, activeUserId))
  const items = buildAllQueueItems(activeUserId)
  const summary = buildSummaryFromItems(items, filters ?? { sectionId: defaultActiveSectionId }, activeUserId)

  return {
    updatedItemIds: itemIds,
    updatedItems: items.filter(item => itemIds.includes(item.id)),
    summary,
  }
}

export async function getWorkQueueCurrentUserPermissions(userId?: string) {
  await ensureWorkQueueState()
  const activeUser = getActiveUser(userId)
  return getRolePermissions(activeUser.role)
}
