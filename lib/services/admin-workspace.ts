import type {
  AdminOverviewData,
  AdminWorkspaceSectionId,
  ApiKey,
  CustomFieldDefinition,
  Entity,
  FinanceFilters,
  Notification,
  NotificationPolicy,
  PlatformOverviewData,
  PlatformWorkspaceListResponse,
  PlatformWorkspaceQuery,
  PlatformWorkspaceRecord,
  RoleId,
  SortConfig,
  User,
  Workflow,
  WorkspaceDetailData,
  WorkspaceTabItem,
} from '@/lib/types'
import { getEntities } from './master-data'
import {
  createApiKey,
  createUser,
  createWorkflow,
  deactivateUser,
  getApiKeys,
  getAuditLogs,
  getIntegrations,
  getNotifications,
  getUsers,
  getWorkflows,
  reconnectIntegration,
  revokeApiKey,
  syncIntegration,
  updateUser,
  updateWorkflowStatus,
} from './legacy'
import type { AuditLogEntry } from './legacy'
import { customFieldStore, ensurePlatformStore, notificationPolicyStore } from './platform-store'
import { buildColumn, buildFilterDefinition, finalizePlatformRows, matchesSearch, matchesScopedFilters } from './platform-workspace-support'
import { delay } from './base'
import { buildDetailField, buildOverviewRow, formatDateLabel, formatDateTimeLabel, getStatusTone } from './workspace-support'

let entities: Entity[] = []
let entityMap = new Map<string, Entity>()

async function ensureAdminWorkspaceState() {
  const [nextEntities] = await Promise.all([getEntities(), ensurePlatformStore()])
  entities = nextEntities
  entityMap = new Map(entities.map(entity => [entity.id, entity]))
}

const adminSectionLabels: Record<AdminWorkspaceSectionId, string> = {
  users: 'Users',
  workflows: 'Workflows',
  integrations: 'Integrations',
  api_keys: 'API Keys',
  audit: 'Audit',
  custom_fields: 'Custom Fields',
  notifications: 'Notifications',
}

const adminDefaultSectionByRole: Partial<Record<RoleId, AdminWorkspaceSectionId>> = {
  admin: 'users',
  controller: 'audit',
  cfo: 'audit',
}

function getVisibleEntityName(entityIds: string[]) {
  if (!entityIds.length) {
    return 'No entities'
  }

  if (entityIds.length === entities.length || entityIds.includes('e4')) {
    return 'All entities'
  }

  if (entityIds.length === 1) {
    return entityMap.get(entityIds[0])?.name ?? entityIds[0]
  }

  return `${entityIds.length} entities`
}

function getAdminRowStatusTone(status: string) {
  if (status === 'read only') {
    return 'neutral'
  }

  return getStatusTone(status)
}

function buildUserRow(user: User): PlatformWorkspaceRecord {
  return {
    id: user.id,
    title: user.displayName ?? `${user.firstName} ${user.lastName}`.trim(),
    subtitle: user.email,
    reference: user.title,
    status: user.status,
    statusTone: getAdminRowStatusTone(user.status),
    typeLabel: user.role.replace(/_/g, ' '),
    entityName: getVisibleEntityName(user.entityIds),
    primaryMetricLabel: 'Entities',
    primaryMetricValue: user.entityIds.length,
    primaryMetricDisplay: `${user.entityIds.length}`,
    primaryDateValue: user.lastLoginAt,
    primaryDateDisplay: formatDateTimeLabel(user.lastLoginAt),
    secondaryDateValue: user.createdAt,
    secondaryDateDisplay: formatDateLabel(user.createdAt),
    meta: user.primaryEntityId ? [`Primary: ${entityMap.get(user.primaryEntityId)?.name ?? user.primaryEntityId}`] : undefined,
  }
}

function buildWorkflowRow(workflow: Workflow): PlatformWorkspaceRecord {
  return {
    id: workflow.id,
    title: workflow.name,
    subtitle: workflow.trigger,
    status: workflow.status,
    statusTone: getAdminRowStatusTone(workflow.status),
    typeLabel: workflow.type,
    entityName: getVisibleEntityName(workflow.entityIds),
    ownerLabel: workflow.createdBy,
    primaryMetricLabel: 'Steps',
    primaryMetricValue: workflow.steps.length,
    primaryMetricDisplay: `${workflow.steps.length}`,
    primaryDateValue: workflow.createdAt,
    primaryDateDisplay: formatDateLabel(workflow.createdAt),
  }
}

function buildIntegrationRow(integration: Awaited<ReturnType<typeof getIntegrations>>[number]): PlatformWorkspaceRecord {
  return {
    id: integration.id,
    title: integration.name,
    subtitle: integration.provider,
    status: integration.status,
    statusTone: getAdminRowStatusTone(integration.status),
    typeLabel: integration.type,
    ownerLabel: integration.ownerName ?? 'Platform',
    entityName: integration.entityId ? entityMap.get(integration.entityId)?.name ?? integration.entityId : 'Shared',
    primaryDateValue: integration.lastSyncAt,
    primaryDateDisplay: formatDateTimeLabel(integration.lastSyncAt),
    secondaryDateValue: integration.createdAt,
    secondaryDateDisplay: formatDateLabel(integration.createdAt),
  }
}

function buildApiKeyRow(key: ApiKey): PlatformWorkspaceRecord {
  return {
    id: key.id,
    title: key.name,
    subtitle: key.createdBy,
    reference: `${key.key.slice(0, 12)}...${key.key.slice(-4)}`,
    status: key.status,
    statusTone: getAdminRowStatusTone(key.status),
    typeLabel: key.status === 'active' ? 'credential' : 'revoked',
    primaryMetricLabel: 'Scopes',
    primaryMetricValue: key.permissions.length,
    primaryMetricDisplay: `${key.permissions.length}`,
    primaryDateValue: key.lastUsedAt ?? key.createdAt,
    primaryDateDisplay: formatDateTimeLabel(key.lastUsedAt),
    secondaryDateValue: key.expiresAt,
    secondaryDateDisplay: key.expiresAt ? formatDateLabel(key.expiresAt) : 'No expiry',
  }
}

function buildAuditRow(log: AuditLogEntry): PlatformWorkspaceRecord {
  return {
    id: log.id,
    title: `${log.entityNumber} · ${log.action}`,
    subtitle: `${log.entityType.replace(/_/g, ' ')} updated by ${log.userName}`,
    status: log.action,
    statusTone: getAdminRowStatusTone(log.action),
    typeLabel: log.entityType.replace(/_/g, ' '),
    ownerLabel: log.userName,
    primaryMetricLabel: 'Changes',
    primaryMetricValue: log.changes?.length ?? 0,
    primaryMetricDisplay: `${log.changes?.length ?? 0}`,
    primaryDateValue: log.timestamp,
    primaryDateDisplay: formatDateTimeLabel(log.timestamp),
    meta: [log.ipAddress],
  }
}

function buildCustomFieldRow(field: CustomFieldDefinition): PlatformWorkspaceRecord {
  return {
    id: field.id,
    title: field.name,
    subtitle: field.code,
    status: field.status,
    statusTone: getAdminRowStatusTone(field.status),
    typeLabel: field.type,
    scopeLabel: field.module.replace(/_/g, ' '),
    entityName: field.entityId ? entityMap.get(field.entityId)?.name ?? field.entityId : 'Shared',
    primaryMetricLabel: 'Options',
    primaryMetricValue: field.options?.length ?? 0,
    primaryMetricDisplay: field.options?.length ? `${field.options.length}` : 'None',
    primaryDateValue: field.updatedAt ?? field.createdAt,
    primaryDateDisplay: formatDateLabel(field.updatedAt ?? field.createdAt),
  }
}

function buildNotificationRow(policy: NotificationPolicy): PlatformWorkspaceRecord {
  return {
    id: policy.id,
    title: policy.name,
    subtitle: policy.description,
    status: policy.email || policy.push ? 'active' : 'paused',
    statusTone: policy.email || policy.push ? 'positive' : 'warning',
    typeLabel: policy.category,
    scopeLabel: policy.scope,
    primaryMetricLabel: 'Frequency',
    primaryMetricValue: policy.frequency === 'instant' ? 4 : policy.frequency === 'hourly' ? 3 : policy.frequency === 'daily' ? 2 : 1,
    primaryMetricDisplay: policy.frequency,
    secondaryMetricLabel: 'Channels',
    secondaryMetricValue: Number(policy.email) + Number(policy.push),
    secondaryMetricDisplay: [policy.email ? 'Email' : null, policy.push ? 'Push' : null].filter(Boolean).join(' + ') || 'Disabled',
    primaryDateValue: policy.updatedAt,
    primaryDateDisplay: formatDateTimeLabel(policy.updatedAt),
  }
}

async function getAdminSourceData(filters: FinanceFilters) {
  await ensureAdminWorkspaceState()
  const [usersResponse, workflows, integrations, apiKeys, notifications, auditLogs] = await Promise.all([
    getUsers(undefined, undefined, undefined, { key: 'createdAt', direction: 'desc' }, 1, 200),
    getWorkflows(),
    getIntegrations(),
    getApiKeys(),
    getNotifications(false, undefined, 1, 100),
    getAuditLogs(undefined, undefined, filters.dateRange.startDate, filters.dateRange.endDate, 1, 200),
  ])

  return {
    users: usersResponse.data,
    workflows,
    integrations,
    apiKeys,
    notifications: notifications.data,
    auditLogs: auditLogs.data,
  }
}

export function getAdminWorkspaceDefaultSection(roleId?: RoleId): AdminWorkspaceSectionId {
  return roleId ? adminDefaultSectionByRole[roleId] ?? 'users' : 'users'
}

export async function getAdminWorkspaceTabs(
  filters: FinanceFilters,
  roleId?: RoleId
): Promise<WorkspaceTabItem[]> {
  const { users, workflows, integrations, apiKeys, notifications, auditLogs } = await getAdminSourceData(filters)
  const defaultSection = getAdminWorkspaceDefaultSection(roleId)

  return [
    { id: 'users', label: 'Users', count: users.length, tone: defaultSection === 'users' ? 'accent' : 'neutral' },
    { id: 'workflows', label: 'Workflows', count: workflows.length },
    { id: 'integrations', label: 'Integrations', count: integrations.length },
    { id: 'api_keys', label: 'API Keys', count: apiKeys.length },
    { id: 'audit', label: 'Audit', count: auditLogs.length },
    { id: 'custom_fields', label: 'Custom Fields', count: customFieldStore.length },
    { id: 'notifications', label: 'Notifications', count: notifications.length + notificationPolicyStore.length },
  ]
}

export async function getAdminWorkspaceOverview(
  filters: FinanceFilters,
  roleId?: RoleId
): Promise<AdminOverviewData> {
  const { users, workflows, integrations, apiKeys, notifications, auditLogs } = await getAdminSourceData(filters)
  const defaultSectionId = getAdminWorkspaceDefaultSection(roleId)
  const activeUsers = users.filter(user => user.status === 'active').length
  const connectedIntegrations = integrations.filter(integration => integration.status === 'connected').length
  const activeWorkflows = workflows.filter(workflow => workflow.status === 'active').length
  const activeKeys = apiKeys.filter(key => key.status === 'active').length

  return {
    moduleId: 'admin',
    title: 'Platform Administration',
    subtitle: 'Access governance, workflow controls, platform health, and developer access from one service-driven workspace.',
    badge: 'Governance & Platform',
    defaultSectionId,
    metrics: [
      { id: 'admin-users', label: 'Active Users', value: String(activeUsers), detail: `${users.length - activeUsers} non-active accounts`, tone: 'accent' },
      { id: 'admin-workflows', label: 'Active Workflows', value: String(activeWorkflows), detail: `${workflows.length} total automations`, tone: activeWorkflows ? 'positive' : 'warning' },
      { id: 'admin-integrations', label: 'Connected Systems', value: String(connectedIntegrations), detail: `${integrations.filter(integration => integration.status === 'error').length} need attention`, tone: integrations.some(integration => integration.status === 'error') ? 'critical' : 'positive' },
      { id: 'admin-api-keys', label: 'Active Keys', value: String(activeKeys), detail: `${notifications.filter(notification => !notification.read).length} unread admin alerts`, tone: 'neutral' },
    ],
    actions: [
      { id: 'invite-user', label: 'Invite User', icon: 'plus', tone: 'accent' },
      { id: 'new-workflow', label: 'New Workflow', icon: 'workflow' },
      { id: 'new-api-key', label: 'Generate API Key', icon: 'key' },
    ],
    sections: [
      {
        id: 'access-watch',
        title: 'Access Watchlist',
        description: 'Accounts and credentials requiring governance review.',
        rows: [
          ...users
            .filter(user => user.status !== 'active')
            .slice(0, 3)
            .map(user =>
              buildOverviewRow(user.id, `${user.firstName} ${user.lastName}`, {
                value: user.role.replace(/_/g, ' '),
                href: '/admin/users',
                status: user.status,
                statusTone: getStatusTone(user.status),
                meta: [user.email, getVisibleEntityName(user.entityIds)],
              })
            ),
          ...apiKeys
            .filter(key => key.status !== 'active')
            .slice(0, 2)
            .map(key =>
              buildOverviewRow(key.id, key.name, {
                value: key.createdBy,
                href: '/admin/api-keys',
                status: key.status,
                statusTone: getStatusTone(key.status),
                meta: [key.expiresAt ? formatDateLabel(key.expiresAt) : 'No expiry'],
              })
            ),
        ],
      },
      {
        id: 'platform-health',
        title: 'Platform Health',
        description: 'Recent sync, automation, and audit movement.',
        rows: [
          ...integrations
            .filter(integration => integration.status !== 'connected')
            .slice(0, 3)
            .map(integration =>
              buildOverviewRow(integration.id, integration.name, {
                value: integration.provider,
                href: '/integrations',
                status: integration.status,
                statusTone: getStatusTone(integration.status),
                meta: [formatDateTimeLabel(integration.lastSyncAt)],
              })
            ),
          ...auditLogs.slice(0, 2).map(log =>
            buildOverviewRow(log.id, `${log.entityNumber} · ${log.action}`, {
              value: log.userName,
              href: '/admin/audit',
              status: log.entityType,
              statusTone: 'neutral',
              meta: [formatDateTimeLabel(log.timestamp)],
            })
          ),
        ],
      },
    ],
  }
}

async function getUserWorkspace(
  filters: FinanceFilters,
  query: PlatformWorkspaceQuery
): Promise<PlatformWorkspaceListResponse> {
  const response = await getUsers(
    query.search,
    query.filters?.type && query.filters.type !== 'all' ? [query.filters.type] : undefined,
    query.filters?.status && query.filters.status !== 'all' ? [query.filters.status] : undefined,
    query.sort ?? { key: 'createdAt', direction: 'desc' },
    1,
    200
  )

  const rows = response.data
    .filter(user => filters.entityId === 'e4' || !filters.entityId || user.entityIds.includes(filters.entityId))
    .map(buildUserRow)

  const final = finalizePlatformRows(rows, query, { key: 'secondaryDateValue', direction: 'desc' })

  return {
    ...final,
    metrics: [
      { id: 'users-visible', label: 'Visible Users', value: String(rows.length), detail: 'Current access scope', tone: 'neutral' },
      { id: 'users-pending', label: 'Pending Invites', value: String(rows.filter(row => row.status === 'pending').length), detail: 'Awaiting activation', tone: rows.some(row => row.status === 'pending') ? 'warning' : 'positive' },
      { id: 'users-inactive', label: 'Inactive', value: String(rows.filter(row => row.status === 'inactive').length), detail: 'Disabled or archived', tone: 'neutral' },
      { id: 'users-entities', label: 'Entity Assignments', value: String(response.data.reduce((sum, user) => sum + user.entityIds.length, 0)), detail: 'Across visible users', tone: 'accent' },
    ],
    actions: [
      { id: 'invite-user', label: 'Invite User', icon: 'plus', tone: 'accent' },
      { id: 'export-users', label: 'Export Users', icon: 'download' },
    ],
    bulkActions: [
      { id: 'activate-user', label: 'Activate', icon: 'play' },
      { id: 'deactivate-user', label: 'Deactivate', icon: 'pause' },
    ],
    filters: [
      buildFilterDefinition('status', 'Statuses', [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
      ]),
      buildFilterDefinition('type', 'Roles', [
        { value: 'admin', label: 'Admin' },
        { value: 'controller', label: 'Controller' },
        { value: 'accountant', label: 'Accountant' },
        { value: 'ap_specialist', label: 'AP Specialist' },
        { value: 'ar_specialist', label: 'AR Specialist' },
      ]),
    ],
    columns: [
      buildColumn('title', 'User', 'title', 'left', 'min-w-[280px]'),
      buildColumn('type', 'Role', 'typeLabel'),
      buildColumn('entity', 'Entity Scope', 'entityName'),
      buildColumn('status', 'Status', 'status'),
      buildColumn('primaryMetric', 'Entity Count', 'primaryMetricValue', 'right'),
      buildColumn('primaryDate', 'Last Login', 'primaryDateValue'),
      buildColumn('secondaryDate', 'Created', 'secondaryDateValue'),
    ],
    defaultVisibleColumnIds: ['title', 'type', 'entity', 'status', 'primaryDate', 'secondaryDate'],
    emptyMessage: 'No user accounts match the current governance filters.',
  }
}

async function getWorkflowWorkspace(
  filters: FinanceFilters,
  query: PlatformWorkspaceQuery
): Promise<PlatformWorkspaceListResponse> {
  const workflows = await getWorkflows(
    query.filters?.type && query.filters.type !== 'all' ? query.filters.type : undefined,
    query.filters?.status && query.filters.status !== 'all' ? [query.filters.status] : undefined
  )

  const rows = workflows
    .filter(workflow => filters.entityId === 'e4' || !filters.entityId || workflow.entityIds.includes(filters.entityId))
    .filter(workflow => matchesSearch([workflow.name, workflow.trigger, workflow.createdBy], query.search))
    .map(buildWorkflowRow)

  const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

  return {
    ...final,
    metrics: [
      { id: 'workflow-visible', label: 'Visible Workflows', value: String(rows.length), detail: 'Approval and automation coverage', tone: 'neutral' },
      { id: 'workflow-active', label: 'Active', value: String(rows.filter(row => row.status === 'active').length), detail: 'Currently routing or automating', tone: 'positive' },
      { id: 'workflow-drafts', label: 'Drafts', value: String(rows.filter(row => row.status === 'draft').length), detail: 'Pending publication', tone: 'warning' },
      { id: 'workflow-steps', label: 'Configured Steps', value: String(workflows.reduce((sum, workflow) => sum + workflow.steps.length, 0)), detail: 'Across visible workflows', tone: 'accent' },
    ],
    actions: [
      { id: 'new-workflow', label: 'Create Workflow', icon: 'plus', tone: 'accent' },
      { id: 'export-workflows', label: 'Export Rules', icon: 'download' },
    ],
    bulkActions: [
      { id: 'activate-workflow', label: 'Activate', icon: 'play' },
      { id: 'pause-workflow', label: 'Pause', icon: 'pause' },
    ],
    filters: [
      buildFilterDefinition('status', 'Statuses', [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'draft', label: 'Draft' },
      ]),
      buildFilterDefinition('type', 'Types', [
        { value: 'approval', label: 'Approval' },
        { value: 'notification', label: 'Notification' },
        { value: 'automation', label: 'Automation' },
      ]),
    ],
    columns: [
      buildColumn('title', 'Workflow', 'title', 'left', 'min-w-[300px]'),
      buildColumn('type', 'Type', 'typeLabel'),
      buildColumn('entity', 'Entity Scope', 'entityName'),
      buildColumn('status', 'Status', 'status'),
      buildColumn('owner', 'Owner', 'ownerLabel'),
      buildColumn('primaryMetric', 'Steps', 'primaryMetricValue', 'right'),
      buildColumn('primaryDate', 'Created', 'primaryDateValue'),
    ],
    defaultVisibleColumnIds: ['title', 'type', 'entity', 'status', 'primaryMetric', 'primaryDate'],
    emptyMessage: 'No workflows match the current automation filters.',
  }
}

async function getIntegrationWorkspace(
  filters: FinanceFilters,
  query: PlatformWorkspaceQuery
): Promise<PlatformWorkspaceListResponse> {
  const integrations = await getIntegrations(
    query.filters?.type && query.filters.type !== 'all' ? query.filters.type : undefined,
    query.filters?.status && query.filters.status !== 'all' ? [query.filters.status] : undefined
  )

  const rows = integrations
    .filter(integration => !integration.entityId || filters.entityId === 'e4' || !filters.entityId || integration.entityId === filters.entityId)
    .filter(integration => matchesSearch([integration.name, integration.provider, integration.type], query.search))
    .map(buildIntegrationRow)

  const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

  return {
    ...final,
    metrics: [
      { id: 'int-visible', label: 'Visible Connections', value: String(rows.length), detail: 'Connected systems in scope', tone: 'neutral' },
      { id: 'int-connected', label: 'Connected', value: String(rows.filter(row => row.status === 'connected').length), detail: 'Healthy connections', tone: 'positive' },
      { id: 'int-errors', label: 'Errors', value: String(rows.filter(row => row.status === 'error').length), detail: 'Needs remediation', tone: rows.some(row => row.status === 'error') ? 'critical' : 'positive' },
      { id: 'int-pending', label: 'Pending', value: String(rows.filter(row => row.status === 'pending').length), detail: 'Still onboarding', tone: 'warning' },
    ],
    actions: [
      { id: 'sync-integration', label: 'Run Sync', icon: 'refresh-cw', tone: 'accent' },
      { id: 'reconnect-integration', label: 'Reconnect', icon: 'plug' },
    ],
    bulkActions: [
      { id: 'sync-integration', label: 'Run Sync', icon: 'refresh-cw' },
      { id: 'reconnect-integration', label: 'Reconnect', icon: 'plug' },
    ],
    filters: [
      buildFilterDefinition('status', 'Statuses', [
        { value: 'connected', label: 'Connected' },
        { value: 'error', label: 'Error' },
        { value: 'disconnected', label: 'Disconnected' },
        { value: 'pending', label: 'Pending' },
      ]),
      buildFilterDefinition('type', 'Types', [
        { value: 'bank', label: 'Bank' },
        { value: 'payroll', label: 'Payroll' },
        { value: 'crm', label: 'CRM' },
        { value: 'ecommerce', label: 'Ecommerce' },
        { value: 'tax', label: 'Tax' },
        { value: 'expense', label: 'Expense' },
        { value: 'hr', label: 'HR' },
      ]),
    ],
    columns: [
      buildColumn('title', 'Integration', 'title', 'left', 'min-w-[300px]'),
      buildColumn('type', 'Type', 'typeLabel'),
      buildColumn('entity', 'Entity', 'entityName'),
      buildColumn('status', 'Status', 'status'),
      buildColumn('owner', 'Owner', 'ownerLabel'),
      buildColumn('primaryDate', 'Last Sync', 'primaryDateValue'),
      buildColumn('secondaryDate', 'Connected', 'secondaryDateValue'),
    ],
    defaultVisibleColumnIds: ['title', 'type', 'entity', 'status', 'primaryDate'],
    emptyMessage: 'No integrations match the current platform filters.',
  }
}

async function getApiKeyWorkspace(query: PlatformWorkspaceQuery): Promise<PlatformWorkspaceListResponse> {
  const apiKeys = await getApiKeys()
  const rows = apiKeys
    .filter(key => matchesQueryForSimpleValue(key.status, key.name, key.createdBy, query))
    .map(buildApiKeyRow)

  const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

  return {
    ...final,
    metrics: [
      { id: 'keys-visible', label: 'Visible Keys', value: String(rows.length), detail: 'Current developer credentials', tone: 'neutral' },
      { id: 'keys-active', label: 'Active', value: String(rows.filter(row => row.status === 'active').length), detail: 'Usable credentials', tone: 'positive' },
      { id: 'keys-revoked', label: 'Revoked', value: String(rows.filter(row => row.status === 'revoked').length), detail: 'Disabled credentials', tone: 'warning' },
      { id: 'keys-scopes', label: 'Granted Scopes', value: String(apiKeys.reduce((sum, key) => sum + key.permissions.length, 0)), detail: 'Across visible keys', tone: 'accent' },
    ],
    actions: [
      { id: 'new-api-key', label: 'Create API Key', icon: 'plus', tone: 'accent' },
      { id: 'export-api-keys', label: 'Export', icon: 'download' },
    ],
    bulkActions: [{ id: 'revoke-api-key', label: 'Revoke', icon: 'ban' }],
    filters: [
      buildFilterDefinition('status', 'Statuses', [
        { value: 'active', label: 'Active' },
        { value: 'revoked', label: 'Revoked' },
      ]),
    ],
    columns: [
      buildColumn('title', 'API Key', 'title', 'left', 'min-w-[300px]'),
      buildColumn('status', 'Status', 'status'),
      buildColumn('primaryMetric', 'Scopes', 'primaryMetricValue', 'right'),
      buildColumn('primaryDate', 'Last Used', 'primaryDateValue'),
      buildColumn('secondaryDate', 'Expires', 'secondaryDateValue'),
    ],
    defaultVisibleColumnIds: ['title', 'status', 'primaryMetric', 'primaryDate', 'secondaryDate'],
    emptyMessage: 'No API keys match the current developer filters.',
  }
}

function matchesQueryForSimpleValue(status: string, ...values: Array<string | undefined | PlatformWorkspaceQuery>) {
  const query = values.pop() as PlatformWorkspaceQuery
  if (query.filters?.status && query.filters.status !== 'all' && status !== query.filters.status) {
    return false
  }

  return matchesSearch(values as string[], query.search)
}

async function getAuditWorkspace(
  filters: FinanceFilters,
  query: PlatformWorkspaceQuery
): Promise<PlatformWorkspaceListResponse> {
  const auditLogs = await getAuditLogs(undefined, undefined, filters.dateRange.startDate, filters.dateRange.endDate, 1, 200)

  const rows = auditLogs.data
    .filter(log => matchesQueryForSimpleValue(log.action, log.entityNumber, log.userName, log.entityType, query))
    .map(buildAuditRow)

  const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

  return {
    ...final,
    metrics: [
      { id: 'audit-visible', label: 'Visible Events', value: String(rows.length), detail: 'Audit trail in date scope', tone: 'neutral' },
      { id: 'audit-posts', label: 'Posts', value: String(rows.filter(row => row.status === 'post').length), detail: 'Journal and document postings', tone: 'positive' },
      { id: 'audit-rejects', label: 'Rejections', value: String(rows.filter(row => row.status === 'reject').length), detail: 'Rejected approval actions', tone: rows.some(row => row.status === 'reject') ? 'warning' : 'neutral' },
      { id: 'audit-updates', label: 'Field Changes', value: String(rows.reduce((sum, row) => sum + (row.primaryMetricValue ?? 0), 0)), detail: 'Tracked field changes', tone: 'accent' },
    ],
    actions: [
      { id: 'export-audit', label: 'Export Audit', icon: 'download', tone: 'accent' },
    ],
    filters: [
      buildFilterDefinition('status', 'Actions', [
        { value: 'create', label: 'Create' },
        { value: 'update', label: 'Update' },
        { value: 'post', label: 'Post' },
        { value: 'approve', label: 'Approve' },
        { value: 'reject', label: 'Reject' },
        { value: 'reverse', label: 'Reverse' },
      ]),
      buildFilterDefinition('type', 'Objects', [
        { value: 'journal entry', label: 'Journal Entry' },
        { value: 'bill', label: 'Bill' },
        { value: 'invoice', label: 'Invoice' },
        { value: 'account', label: 'Account' },
        { value: 'vendor', label: 'Vendor' },
        { value: 'customer', label: 'Customer' },
      ]),
    ],
    columns: [
      buildColumn('title', 'Audit Event', 'title', 'left', 'min-w-[320px]'),
      buildColumn('type', 'Object', 'typeLabel'),
      buildColumn('owner', 'User', 'ownerLabel'),
      buildColumn('status', 'Action', 'status'),
      buildColumn('primaryMetric', 'Changes', 'primaryMetricValue', 'right'),
      buildColumn('primaryDate', 'Timestamp', 'primaryDateValue'),
    ],
    defaultVisibleColumnIds: ['title', 'owner', 'status', 'primaryMetric', 'primaryDate'],
    emptyMessage: 'No audit activity matches the current filters.',
  }
}

async function getCustomFieldWorkspace(
  filters: FinanceFilters,
  query: PlatformWorkspaceQuery
): Promise<PlatformWorkspaceListResponse> {
  const rows = customFieldStore
    .filter(field => matchesScopedFilters({ entityId: field.entityId }, filters, query, field.updatedAt ?? field.createdAt))
    .filter(field => matchesQueryForSimpleValue(field.status, field.name, field.code, field.module, query))
    .map(buildCustomFieldRow)

  const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

  return {
    ...final,
    metrics: [
      { id: 'fields-visible', label: 'Visible Fields', value: String(rows.length), detail: 'Configured extensions', tone: 'neutral' },
      { id: 'fields-active', label: 'Active', value: String(rows.filter(row => row.status === 'active').length), detail: 'Available in forms and lists', tone: 'positive' },
      { id: 'fields-required', label: 'Required', value: String(customFieldStore.filter(field => field.required).length), detail: 'Mandatory data capture', tone: 'warning' },
      { id: 'fields-dropdowns', label: 'Dropdown Lists', value: String(customFieldStore.filter(field => field.type === 'dropdown').length), detail: 'Managed options', tone: 'accent' },
    ],
    actions: [
      { id: 'new-custom-field', label: 'Add Custom Field', icon: 'plus', tone: 'accent' },
    ],
    bulkActions: [
      { id: 'activate-custom-field', label: 'Activate', icon: 'play' },
      { id: 'deactivate-custom-field', label: 'Deactivate', icon: 'pause' },
    ],
    filters: [
      buildFilterDefinition('status', 'Statuses', [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ]),
      buildFilterDefinition('type', 'Modules', [
        { value: 'bill', label: 'Bills' },
        { value: 'invoice', label: 'Invoices' },
        { value: 'customer', label: 'Customers' },
        { value: 'vendor', label: 'Vendors' },
        { value: 'project', label: 'Projects' },
        { value: 'journal_entry', label: 'Journal Entries' },
      ]),
    ],
    columns: [
      buildColumn('title', 'Field', 'title', 'left', 'min-w-[300px]'),
      buildColumn('type', 'Type', 'typeLabel'),
      buildColumn('scope', 'Module', 'scopeLabel'),
      buildColumn('entity', 'Entity', 'entityName'),
      buildColumn('status', 'Status', 'status'),
      buildColumn('primaryMetric', 'Options', 'primaryMetricValue', 'right'),
      buildColumn('primaryDate', 'Updated', 'primaryDateValue'),
    ],
    defaultVisibleColumnIds: ['title', 'scope', 'status', 'entity', 'primaryDate'],
    emptyMessage: 'No custom fields match the current configuration filters.',
  }
}

async function getNotificationWorkspace(
  filters: FinanceFilters,
  query: PlatformWorkspaceQuery
): Promise<PlatformWorkspaceListResponse> {
  const rows = notificationPolicyStore
    .filter(policy => matchesScopedFilters({ entityId: policy.entityId }, filters, query, policy.updatedAt))
    .filter(policy => matchesQueryForSimpleValue(policy.category, policy.name, policy.description, policy.scope, query))
    .map(buildNotificationRow)

  const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

  return {
    ...final,
    metrics: [
      { id: 'notifications-visible', label: 'Visible Policies', value: String(rows.length), detail: 'Notification rules in scope', tone: 'neutral' },
      { id: 'notifications-active', label: 'Enabled', value: String(rows.filter(row => row.status === 'active').length), detail: 'Currently dispatching', tone: 'positive' },
      { id: 'notifications-instant', label: 'Instant Alerts', value: String(notificationPolicyStore.filter(policy => policy.frequency === 'instant').length), detail: 'Immediate dispatch rules', tone: 'warning' },
      { id: 'notifications-system', label: 'System Policies', value: String(notificationPolicyStore.filter(policy => policy.category === 'system').length), detail: 'Platform and security alerts', tone: 'accent' },
    ],
    actions: [
      { id: 'save-notification-policies', label: 'Save Policies', icon: 'save', tone: 'accent' },
    ],
    bulkActions: [
      { id: 'enable-notification-policy', label: 'Enable', icon: 'play' },
      { id: 'pause-notification-policy', label: 'Pause', icon: 'pause' },
    ],
    filters: [
      buildFilterDefinition('type', 'Categories', [
        { value: 'approvals', label: 'Approvals' },
        { value: 'tasks', label: 'Tasks' },
        { value: 'payments', label: 'Payments' },
        { value: 'invoices', label: 'Invoices' },
        { value: 'system', label: 'System' },
      ]),
      buildFilterDefinition('status', 'Statuses', [
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
      ]),
    ],
    columns: [
      buildColumn('title', 'Policy', 'title', 'left', 'min-w-[320px]'),
      buildColumn('type', 'Category', 'typeLabel'),
      buildColumn('scope', 'Scope', 'scopeLabel'),
      buildColumn('status', 'Status', 'status'),
      buildColumn('primaryMetric', 'Frequency', 'primaryMetricValue', 'right'),
      buildColumn('secondaryMetric', 'Channels', 'secondaryMetricValue', 'right'),
      buildColumn('primaryDate', 'Updated', 'primaryDateValue'),
    ],
    defaultVisibleColumnIds: ['title', 'type', 'scope', 'status', 'primaryMetric', 'primaryDate'],
    emptyMessage: 'No notification policies match the current filters.',
  }
}

export async function getAdminWorkspaceList(
  sectionId: AdminWorkspaceSectionId,
  filters: FinanceFilters,
  query: PlatformWorkspaceQuery
): Promise<PlatformWorkspaceListResponse> {
  await ensureAdminWorkspaceState()
  await delay()

  switch (sectionId) {
    case 'users':
      return getUserWorkspace(filters, query)
    case 'workflows':
      return getWorkflowWorkspace(filters, query)
    case 'integrations':
      return getIntegrationWorkspace(filters, query)
    case 'api_keys':
      return getApiKeyWorkspace(query)
    case 'audit':
      return getAuditWorkspace(filters, query)
    case 'custom_fields':
      return getCustomFieldWorkspace(filters, query)
    case 'notifications':
      return getNotificationWorkspace(filters, query)
  }
}

export async function getAdminWorkspaceDetail(
  sectionId: AdminWorkspaceSectionId,
  id: string
): Promise<WorkspaceDetailData | null> {
  await ensureAdminWorkspaceState()
  switch (sectionId) {
    case 'users': {
      const response = await getUsers(undefined, undefined, undefined, { key: 'createdAt', direction: 'desc' }, 1, 200)
      const user = response.data.find(item => item.id === id)
      if (!user) {
        return null
      }

      return {
        id: user.id,
        title: user.displayName ?? `${user.firstName} ${user.lastName}`.trim(),
        subtitle: `${user.email} · ${user.role.replace(/_/g, ' ')}`,
        badges: [
          { id: 'status', label: user.status, tone: getStatusTone(user.status) },
        ],
        summary: [
          buildDetailField('role', 'Role', user.role.replace(/_/g, ' ')),
          buildDetailField('entity-scope', 'Entity Scope', getVisibleEntityName(user.entityIds)),
          buildDetailField('title', 'Title', user.title ?? 'None'),
          buildDetailField('last-login', 'Last Login', formatDateTimeLabel(user.lastLoginAt)),
        ],
        sections: [
          {
            id: 'entities',
            title: 'Entity Access',
            fields: user.entityIds.map(entityId =>
              buildDetailField(entityId, entityMap.get(entityId)?.name ?? entityId, entityId === user.primaryEntityId ? 'Primary' : 'Assigned')
            ),
          },
        ],
        actions: [
          { id: user.status === 'active' ? 'deactivate-user' : 'activate-user', label: user.status === 'active' ? 'Deactivate User' : 'Activate User', icon: user.status === 'active' ? 'pause' : 'play' },
        ],
      }
    }
    case 'workflows': {
      const workflows = await getWorkflows()
      const workflow = workflows.find(item => item.id === id)
      if (!workflow) {
        return null
      }

      return {
        id: workflow.id,
        title: workflow.name,
        subtitle: `${workflow.type} workflow · ${workflow.trigger}`,
        badges: [
          { id: 'status', label: workflow.status, tone: getStatusTone(workflow.status) },
        ],
        summary: [
          buildDetailField('owner', 'Owner', workflow.createdBy),
          buildDetailField('entities', 'Entity Scope', getVisibleEntityName(workflow.entityIds)),
          buildDetailField('steps', 'Steps', `${workflow.steps.length}`),
          buildDetailField('created', 'Created', formatDateLabel(workflow.createdAt)),
        ],
        sections: [
          {
            id: 'steps',
            title: 'Workflow Steps',
            fields: workflow.steps.map(step =>
              buildDetailField(step.id, `${step.order}. ${step.type}`, JSON.stringify(step.config))
            ),
          },
        ],
        actions: [
          { id: workflow.status === 'active' ? 'pause-workflow' : 'activate-workflow', label: workflow.status === 'active' ? 'Pause Workflow' : 'Activate Workflow', icon: workflow.status === 'active' ? 'pause' : 'play' },
        ],
      }
    }
    case 'integrations': {
      const integrations = await getIntegrations()
      const integration = integrations.find(item => item.id === id)
      if (!integration) {
        return null
      }

      return {
        id: integration.id,
        title: integration.name,
        subtitle: `${integration.provider} · ${integration.type}`,
        badges: [
          { id: 'status', label: integration.status, tone: getStatusTone(integration.status) },
        ],
        summary: [
          buildDetailField('last-sync', 'Last Sync', formatDateTimeLabel(integration.lastSyncAt)),
          buildDetailField('entity', 'Entity', integration.entityId ? entityMap.get(integration.entityId)?.name ?? integration.entityId : 'Shared'),
          buildDetailField('owner', 'Owner', integration.ownerName ?? 'Platform'),
          buildDetailField('created', 'Connected', formatDateLabel(integration.createdAt)),
        ],
        sections: [],
        actions: [
          { id: 'sync-integration', label: 'Run Sync', icon: 'refresh-cw' },
          { id: integration.status === 'connected' ? 'disconnect-integration' : 'reconnect-integration', label: integration.status === 'connected' ? 'Disconnect' : 'Reconnect', icon: integration.status === 'connected' ? 'unlink' : 'plug' },
        ],
      }
    }
    case 'api_keys': {
      const apiKeys = await getApiKeys()
      const apiKey = apiKeys.find(item => item.id === id)
      if (!apiKey) {
        return null
      }

      return {
        id: apiKey.id,
        title: apiKey.name,
        subtitle: `${apiKey.createdBy} · ${apiKey.key.slice(0, 12)}...${apiKey.key.slice(-4)}`,
        badges: [
          { id: 'status', label: apiKey.status, tone: getStatusTone(apiKey.status) },
        ],
        summary: [
          buildDetailField('created', 'Created', formatDateLabel(apiKey.createdAt)),
          buildDetailField('last-used', 'Last Used', formatDateTimeLabel(apiKey.lastUsedAt)),
          buildDetailField('expires', 'Expires', apiKey.expiresAt ? formatDateLabel(apiKey.expiresAt) : 'No expiry'),
          buildDetailField('permissions', 'Permissions', `${apiKey.permissions.length}`),
        ],
        sections: [
          {
            id: 'scopes',
            title: 'Granted Scopes',
            fields: apiKey.permissions.map(permission =>
              buildDetailField(permission, permission, 'Enabled')
            ),
          },
        ],
        actions: apiKey.status === 'active' ? [{ id: 'revoke-api-key', label: 'Revoke Key', icon: 'ban' }] : [],
      }
    }
    case 'audit': {
      const auditLogs = await getAuditLogs(undefined, undefined, undefined, undefined, 1, 200)
      const log = auditLogs.data.find(item => item.id === id)
      if (!log) {
        return null
      }

      return {
        id: log.id,
        title: `${log.entityNumber} · ${log.action}`,
        subtitle: `${log.entityType.replace(/_/g, ' ')} by ${log.userName}`,
        badges: [
          { id: 'action', label: log.action, tone: getStatusTone(log.action) },
        ],
        summary: [
          buildDetailField('timestamp', 'Timestamp', formatDateTimeLabel(log.timestamp)),
          buildDetailField('user', 'User', log.userName),
          buildDetailField('object', 'Object', log.entityType.replace(/_/g, ' ')),
          buildDetailField('ip', 'IP Address', log.ipAddress),
        ],
        sections: [
          {
            id: 'changes',
            title: 'Tracked Changes',
            fields: (log.changes ?? []).map(change =>
              buildDetailField(change.field, change.field, `${change.oldValue} -> ${change.newValue}`)
            ),
          },
        ],
        actions: [{ id: 'export-audit', label: 'Export Audit Row', icon: 'download' }],
      }
    }
    case 'custom_fields': {
      const field = customFieldStore.find(item => item.id === id)
      if (!field) {
        return null
      }

      return {
        id: field.id,
        title: field.name,
        subtitle: `${field.code} · ${field.module.replace(/_/g, ' ')}`,
        badges: [
          { id: 'status', label: field.status, tone: getStatusTone(field.status) },
        ],
        summary: [
          buildDetailField('type', 'Type', field.type),
          buildDetailField('required', 'Required', field.required ? 'Yes' : 'No'),
          buildDetailField('entity', 'Entity', field.entityId ? entityMap.get(field.entityId)?.name ?? field.entityId : 'Shared'),
          buildDetailField('updated', 'Updated', formatDateLabel(field.updatedAt ?? field.createdAt)),
        ],
        sections: field.options?.length
          ? [{
              id: 'options',
              title: 'Dropdown Options',
              fields: field.options.map(option => buildDetailField(option, option, 'Available')),
            }]
          : [],
        actions: [
          { id: field.status === 'active' ? 'deactivate-custom-field' : 'activate-custom-field', label: field.status === 'active' ? 'Deactivate Field' : 'Activate Field', icon: field.status === 'active' ? 'pause' : 'play' },
        ],
      }
    }
    case 'notifications': {
      const policy = notificationPolicyStore.find(item => item.id === id)
      if (!policy) {
        return null
      }

      return {
        id: policy.id,
        title: policy.name,
        subtitle: policy.description,
        badges: [
          { id: 'status', label: policy.email || policy.push ? 'active' : 'paused', tone: policy.email || policy.push ? 'positive' : 'warning' },
        ],
        summary: [
          buildDetailField('category', 'Category', policy.category),
          buildDetailField('scope', 'Scope', policy.scope),
          buildDetailField('frequency', 'Frequency', policy.frequency),
          buildDetailField('updated', 'Updated', formatDateTimeLabel(policy.updatedAt)),
        ],
        sections: [
          {
            id: 'delivery',
            title: 'Delivery Channels',
            fields: [
              buildDetailField('email', 'Email', policy.email ? 'Enabled' : 'Disabled'),
              buildDetailField('push', 'Push', policy.push ? 'Enabled' : 'Disabled'),
            ],
          },
        ],
        actions: [
          { id: policy.email || policy.push ? 'pause-notification-policy' : 'enable-notification-policy', label: policy.email || policy.push ? 'Pause Policy' : 'Enable Policy', icon: policy.email || policy.push ? 'pause' : 'play' },
        ],
      }
    }
  }
}

export async function applyAdminWorkspaceAction(
  sectionId: AdminWorkspaceSectionId,
  actionId: string,
  recordIds: string[],
  context: {
    userId?: string
    filters?: FinanceFilters
  } = {}
): Promise<{ success: boolean; message?: string }> {
  await ensureAdminWorkspaceState()
  switch (sectionId) {
    case 'users':
      if (actionId === 'invite-user') {
        await createUser({
          email: `user${Date.now()}@northstarfinance.com`,
          firstName: 'Demo',
          lastName: 'User',
          role: 'accountant',
          entityIds: context.filters?.entityId && context.filters.entityId !== 'e4' ? [context.filters.entityId] : ['e1', 'e2'],
        })
        return { success: true, message: 'Demo user invited.' }
      }

      if (actionId === 'activate-user') {
        await Promise.all(recordIds.map(id => updateUser(id, { status: 'active' })))
        return { success: true, message: 'Selected users activated.' }
      }

      if (actionId === 'deactivate-user') {
        await Promise.all(recordIds.map(id => deactivateUser(id)))
        return { success: true, message: 'Selected users deactivated.' }
      }
      break
    case 'workflows':
      if (actionId === 'new-workflow') {
        await createWorkflow({
          name: `Workflow ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
          type: 'automation',
          trigger: 'export.completed',
          steps: [],
          entityIds: context.filters?.entityId && context.filters.entityId !== 'e4' ? [context.filters.entityId] : ['e4'],
        })
        return { success: true, message: 'Draft workflow created.' }
      }

      if (actionId === 'activate-workflow') {
        await Promise.all(recordIds.map(id => updateWorkflowStatus(id, 'active')))
        return { success: true, message: 'Workflows activated.' }
      }

      if (actionId === 'pause-workflow') {
        await Promise.all(recordIds.map(id => updateWorkflowStatus(id, 'inactive')))
        return { success: true, message: 'Workflows paused.' }
      }
      break
    case 'integrations':
      if (actionId === 'sync-integration') {
        await Promise.all(recordIds.map(id => syncIntegration(id)))
        return { success: true, message: 'Integration sync started.' }
      }

      if (actionId === 'reconnect-integration') {
        await Promise.all(recordIds.map(id => reconnectIntegration(id)))
        return { success: true, message: 'Selected integrations reconnected.' }
      }
      break
    case 'api_keys':
      if (actionId === 'new-api-key') {
        await createApiKey({
          name: `Generated Key ${new Date().toLocaleDateString('en-US')}`,
          permissions: ['read:all'],
        })
        return { success: true, message: 'API key generated.' }
      }

      if (actionId === 'revoke-api-key') {
        await Promise.all(recordIds.map(id => revokeApiKey(id)))
        return { success: true, message: 'Selected API keys revoked.' }
      }
      break
    case 'audit':
      if (actionId === 'export-audit') {
        return { success: true, message: 'Audit export queued.' }
      }
      break
    case 'custom_fields':
      if (actionId === 'new-custom-field') {
        customFieldStore.unshift({
          id: `cf-generated-${Date.now()}`,
          name: 'Generated Compliance Field',
          code: `AUTO_${Date.now().toString().slice(-4)}`,
          type: 'text',
          module: 'bill',
          required: false,
          status: 'active',
          options: undefined,
          entityId: context.filters?.entityId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        return { success: true, message: 'Custom field added.' }
      }

      if (actionId === 'activate-custom-field' || actionId === 'deactivate-custom-field') {
        customFieldStore.forEach(field => {
          if (recordIds.includes(field.id)) {
            field.status = actionId === 'activate-custom-field' ? 'active' : 'inactive'
            field.updatedAt = new Date()
          }
        })
        return { success: true, message: 'Custom field status updated.' }
      }
      break
    case 'notifications':
      if (actionId === 'save-notification-policies') {
        return { success: true, message: 'Notification policies saved.' }
      }

      if (actionId === 'enable-notification-policy' || actionId === 'pause-notification-policy') {
        notificationPolicyStore.forEach(policy => {
          if (recordIds.includes(policy.id)) {
            const enable = actionId === 'enable-notification-policy'
            policy.email = enable
            policy.push = enable
            policy.updatedAt = new Date()
          }
        })
        return { success: true, message: 'Notification policy updated.' }
      }
      break
  }

  return { success: false, message: `No handler for ${adminSectionLabels[sectionId]} action ${actionId}.` }
}
