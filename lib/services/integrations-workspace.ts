import type {
  Entity,
  FinanceFilters,
  IntegrationsWorkspaceSectionId,
  IntegrationDependency,
  IntegrationSyncRun,
  PlatformOverviewData,
  PlatformWorkspaceListResponse,
  PlatformWorkspaceQuery,
  PlatformWorkspaceRecord,
  RoleId,
  WorkspaceDetailData,
  WorkspaceTabItem,
} from '@/lib/types'
import { getIntegrations, reconnectIntegration, syncIntegration } from './legacy'
import { getEntities } from './master-data'
import { ensurePlatformStore, eventMonitoringRecordStore, integrationDependencyStore, integrationSyncRunStore } from './platform-store'
import { buildColumn, buildFilterDefinition, finalizePlatformRows, matchesQueryFilter, matchesScopedFilters, matchesSearch } from './platform-workspace-support'
import { delay } from './base'
import { buildDetailField, buildOverviewRow, formatDateLabel, formatDateTimeLabel, getStatusTone } from './workspace-support'

let entityMap = new Map<string, Entity>()

async function ensureIntegrationsWorkspaceState() {
  const [entities] = await Promise.all([getEntities(), ensurePlatformStore()])
  entityMap = new Map(entities.map(entity => [entity.id, entity]))
}

function buildConnectionRow(integration: Awaited<ReturnType<typeof getIntegrations>>[number]): PlatformWorkspaceRecord {
  return {
    id: integration.id,
    title: integration.name,
    subtitle: integration.provider,
    status: integration.status,
    statusTone: getStatusTone(integration.status),
    typeLabel: integration.type,
    entityName: integration.entityId ? entityMap.get(integration.entityId)?.name ?? integration.entityId : 'Shared',
    ownerLabel: integration.ownerName ?? 'Platform',
    primaryDateValue: integration.lastSyncAt,
    primaryDateDisplay: formatDateTimeLabel(integration.lastSyncAt),
    secondaryDateValue: integration.createdAt,
    secondaryDateDisplay: formatDateLabel(integration.createdAt),
  }
}

function buildSyncRunRow(run: IntegrationSyncRun): PlatformWorkspaceRecord {
  return {
    id: run.id,
    title: run.integrationName,
    subtitle: run.summary,
    status: run.status,
    statusTone: getStatusTone(run.status),
    typeLabel: run.source,
    entityName: run.entityId ? entityMap.get(run.entityId)?.name ?? run.entityId : 'Shared',
    primaryMetricLabel: 'Processed',
    primaryMetricValue: run.recordsProcessed,
    primaryMetricDisplay: `${run.recordsProcessed}`,
    secondaryMetricLabel: 'Errors',
    secondaryMetricValue: run.errorCount,
    secondaryMetricDisplay: `${run.errorCount}`,
    primaryDateValue: run.startedAt,
    primaryDateDisplay: formatDateTimeLabel(run.startedAt),
    secondaryDateValue: run.finishedAt,
    secondaryDateDisplay: formatDateTimeLabel(run.finishedAt),
  }
}

function buildDependencyRow(dependency: IntegrationDependency): PlatformWorkspaceRecord {
  return {
    id: dependency.id,
    title: dependency.label,
    subtitle: dependency.description,
    status: dependency.status,
    statusTone: getStatusTone(dependency.status),
    typeLabel: dependency.type,
    ownerLabel: dependency.integrationId,
    reference: dependency.integrationId,
  }
}

function buildExceptionRow(event: typeof eventMonitoringRecordStore[number]): PlatformWorkspaceRecord {
  return {
    id: event.id,
    title: event.sourceLabel,
    subtitle: event.message,
    status: event.status,
    statusTone: getStatusTone(event.status === 'new' ? 'failed' : event.status),
    typeLabel: event.sourceType,
    entityName: event.entityId ? entityMap.get(event.entityId)?.name ?? event.entityId : 'Shared',
    primaryDateValue: event.occurredAt,
    primaryDateDisplay: formatDateTimeLabel(event.occurredAt),
    reference: event.resolutionHint,
  }
}

export function getIntegrationsWorkspaceDefaultSection(): IntegrationsWorkspaceSectionId {
  return 'connections'
}

export async function getIntegrationsWorkspaceTabs(
  filters: FinanceFilters,
  _roleId?: RoleId
): Promise<WorkspaceTabItem[]> {
  await ensureIntegrationsWorkspaceState()
  const [integrations] = await Promise.all([getIntegrations()])
  const scopedRuns = integrationSyncRunStore.filter(run => !filters.entityId || filters.entityId === 'e4' || run.entityId === filters.entityId)
  const scopedExceptions = eventMonitoringRecordStore.filter(event =>
    ['integration', 'webhook'].includes(event.sourceType) &&
    (!filters.entityId || filters.entityId === 'e4' || event.entityId === filters.entityId)
  )

  return [
    { id: 'connections', label: 'Connections', count: integrations.length },
    { id: 'sync_runs', label: 'Sync Runs', count: scopedRuns.length },
    { id: 'dependencies', label: 'Dependencies', count: integrationDependencyStore.length },
    { id: 'exceptions', label: 'Exceptions', count: scopedExceptions.length },
  ]
}

export async function getIntegrationsWorkspaceOverview(
  filters: FinanceFilters,
  _roleId?: RoleId
): Promise<PlatformOverviewData> {
  await ensureIntegrationsWorkspaceState()
  const [integrations] = await Promise.all([getIntegrations()])
  const scopedRuns = integrationSyncRunStore.filter(run => !filters.entityId || filters.entityId === 'e4' || run.entityId === filters.entityId)
  const scopedExceptions = eventMonitoringRecordStore.filter(event =>
    ['integration', 'webhook'].includes(event.sourceType) &&
    (!filters.entityId || filters.entityId === 'e4' || event.entityId === filters.entityId)
  )

  return {
    moduleId: 'integrations',
    title: 'Integrations',
    subtitle: 'Operate connected systems, sync health, and downstream finance dependencies from one control surface.',
    badge: 'Connected Systems',
    defaultSectionId: 'connections',
    metrics: [
      { id: 'int-connections', label: 'Connections', value: String(integrations.length), detail: 'Connected and pending systems', tone: 'neutral' },
      { id: 'int-healthy', label: 'Healthy', value: String(integrations.filter(item => item.status === 'connected').length), detail: 'Connections currently healthy', tone: 'positive' },
      { id: 'int-runs', label: 'Recent Sync Runs', value: String(scopedRuns.length), detail: 'Runs in current entity scope', tone: 'accent' },
      { id: 'int-exceptions', label: 'Exceptions', value: String(scopedExceptions.length), detail: 'Integration and webhook issues', tone: scopedExceptions.length ? 'critical' : 'positive' },
    ],
    actions: [
      { id: 'sync-integration', label: 'Run Sync', icon: 'refresh-cw', tone: 'accent' },
      { id: 'reconnect-integration', label: 'Reconnect', icon: 'plug' },
    ],
    sections: [
      {
        id: 'attention',
        title: 'Needs Attention',
        description: 'Exceptions blocking finance operations.',
        rows: scopedExceptions.slice(0, 4).map(event =>
          buildOverviewRow(event.id, event.sourceLabel, {
            value: event.sourceType,
            href: '/event-monitoring',
            status: event.status,
            statusTone: getStatusTone(event.status === 'new' ? 'failed' : event.status),
            meta: [formatDateTimeLabel(event.occurredAt)],
          })
        ),
      },
      {
        id: 'healthy-syncs',
        title: 'Recent Healthy Syncs',
        description: 'Successful or warning-level sync movement.',
        rows: scopedRuns.slice(0, 4).map(run =>
          buildOverviewRow(run.id, run.integrationName, {
            value: `${run.recordsProcessed} records`,
            href: '/integrations',
            status: run.status,
            statusTone: getStatusTone(run.status),
            meta: [formatDateTimeLabel(run.startedAt)],
          })
        ),
      },
    ],
  }
}

export async function getIntegrationsWorkspaceList(
  sectionId: IntegrationsWorkspaceSectionId,
  filters: FinanceFilters,
  query: PlatformWorkspaceQuery
): Promise<PlatformWorkspaceListResponse> {
  await ensureIntegrationsWorkspaceState()
  await delay()

  switch (sectionId) {
    case 'connections': {
      const integrations = await getIntegrations(
        query.filters?.type && query.filters.type !== 'all' ? query.filters.type : undefined,
        query.filters?.status && query.filters.status !== 'all' ? [query.filters.status] : undefined
      )

      const rows = integrations
        .filter(integration => matchesScopedFilters({ entityId: integration.entityId }, filters, query, integration.lastSyncAt ?? integration.createdAt))
        .filter(integration => matchesSearch([integration.name, integration.provider, integration.type], query.search))
        .map(buildConnectionRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'connections-visible', label: 'Visible', value: String(rows.length), detail: 'Current connection scope', tone: 'neutral' },
          { id: 'connections-connected', label: 'Connected', value: String(rows.filter(row => row.status === 'connected').length), detail: 'Healthy connections', tone: 'positive' },
          { id: 'connections-errors', label: 'Errors', value: String(rows.filter(row => row.status === 'error').length), detail: 'Require remediation', tone: rows.some(row => row.status === 'error') ? 'critical' : 'neutral' },
          { id: 'connections-pending', label: 'Pending', value: String(rows.filter(row => row.status === 'pending').length), detail: 'Onboarding in progress', tone: 'warning' },
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
          buildColumn('title', 'Connection', 'title', 'left', 'min-w-[320px]'),
          buildColumn('type', 'Type', 'typeLabel'),
          buildColumn('entity', 'Entity', 'entityName'),
          buildColumn('status', 'Status', 'status'),
          buildColumn('owner', 'Owner', 'ownerLabel'),
          buildColumn('primaryDate', 'Last Sync', 'primaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'type', 'status', 'entity', 'primaryDate'],
        emptyMessage: 'No integrations match the current connection filters.',
      }
    }
    case 'sync_runs': {
      const rows = integrationSyncRunStore
        .filter(run => matchesScopedFilters({ entityId: run.entityId }, filters, query, run.startedAt))
        .filter(run => matchesQueryFilter(query, 'status', run.status))
        .filter(run => matchesSearch([run.integrationName, run.summary, run.source], query.search))
        .map(buildSyncRunRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'runs-visible', label: 'Visible Runs', value: String(rows.length), detail: 'Sync history in scope', tone: 'neutral' },
          { id: 'runs-failed', label: 'Failed', value: String(rows.filter(row => row.status === 'failed').length), detail: 'Need operator attention', tone: rows.some(row => row.status === 'failed') ? 'critical' : 'neutral' },
          { id: 'runs-running', label: 'Running', value: String(rows.filter(row => row.status === 'running').length), detail: 'Currently in progress', tone: 'warning' },
          { id: 'runs-processed', label: 'Records', value: String(integrationSyncRunStore.reduce((sum, run) => sum + run.recordsProcessed, 0)), detail: 'Across visible runs', tone: 'accent' },
        ],
        actions: [{ id: 'sync-integration', label: 'Run Sync', icon: 'refresh-cw', tone: 'accent' }],
        filters: [
          buildFilterDefinition('status', 'Statuses', [
            { value: 'success', label: 'Success' },
            { value: 'warning', label: 'Warning' },
            { value: 'failed', label: 'Failed' },
            { value: 'running', label: 'Running' },
          ]),
        ],
        columns: [
          buildColumn('title', 'Sync Run', 'title', 'left', 'min-w-[320px]'),
          buildColumn('type', 'Source', 'typeLabel'),
          buildColumn('entity', 'Entity', 'entityName'),
          buildColumn('status', 'Status', 'status'),
          buildColumn('primaryMetric', 'Records', 'primaryMetricValue', 'right'),
          buildColumn('secondaryMetric', 'Errors', 'secondaryMetricValue', 'right'),
          buildColumn('primaryDate', 'Started', 'primaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'status', 'primaryMetric', 'secondaryMetric', 'primaryDate'],
        emptyMessage: 'No sync runs match the current monitoring filters.',
      }
    }
    case 'dependencies': {
      const rows = integrationDependencyStore
        .filter(dependency => matchesQueryFilter(query, 'status', dependency.status))
        .filter(dependency => matchesQueryFilter(query, 'type', dependency.type))
        .filter(dependency => matchesSearch([dependency.label, dependency.description, dependency.integrationId], query.search))
        .map(buildDependencyRow)

      const final = finalizePlatformRows(rows, query, { key: 'title', direction: 'asc' })

      return {
        ...final,
        metrics: [
          { id: 'deps-visible', label: 'Dependencies', value: String(rows.length), detail: 'Downstream consumers', tone: 'neutral' },
          { id: 'deps-blocked', label: 'Blocked', value: String(rows.filter(row => row.status === 'blocked').length), detail: 'Currently blocked', tone: rows.some(row => row.status === 'blocked') ? 'critical' : 'neutral' },
          { id: 'deps-degraded', label: 'Degraded', value: String(rows.filter(row => row.status === 'degraded').length), detail: 'Partially healthy', tone: 'warning' },
          { id: 'deps-healthy', label: 'Healthy', value: String(rows.filter(row => row.status === 'healthy').length), detail: 'Operating normally', tone: 'positive' },
        ],
        actions: [],
        filters: [
          buildFilterDefinition('status', 'Statuses', [
            { value: 'healthy', label: 'Healthy' },
            { value: 'degraded', label: 'Degraded' },
            { value: 'blocked', label: 'Blocked' },
          ]),
          buildFilterDefinition('type', 'Types', [
            { value: 'module', label: 'Module' },
            { value: 'workflow', label: 'Workflow' },
            { value: 'export', label: 'Export' },
            { value: 'webhook', label: 'Webhook' },
          ]),
        ],
        columns: [
          buildColumn('title', 'Dependency', 'title', 'left', 'min-w-[320px]'),
          buildColumn('type', 'Type', 'typeLabel'),
          buildColumn('status', 'Status', 'status'),
          buildColumn('owner', 'Integration', 'ownerLabel'),
        ],
        defaultVisibleColumnIds: ['title', 'type', 'status', 'owner'],
        emptyMessage: 'No integration dependencies match the current filters.',
      }
    }
    case 'exceptions': {
      const rows = eventMonitoringRecordStore
        .filter(event => ['integration', 'webhook'].includes(event.sourceType))
        .filter(event => matchesScopedFilters({ entityId: event.entityId }, filters, query, event.occurredAt))
        .filter(event => matchesQueryFilter(query, 'status', event.status))
        .filter(event => matchesQueryFilter(query, 'type', event.sourceType))
        .filter(event => matchesSearch([event.sourceLabel, event.message, event.resolutionHint], query.search))
        .map(buildExceptionRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'exceptions-visible', label: 'Visible Exceptions', value: String(rows.length), detail: 'Integration and webhook issues', tone: 'neutral' },
          { id: 'exceptions-critical', label: 'Critical', value: String(rows.filter(row => row.status === 'new').length), detail: 'Unacknowledged events', tone: rows.some(row => row.status === 'new') ? 'critical' : 'neutral' },
          { id: 'exceptions-retrying', label: 'Retrying', value: String(rows.filter(row => row.status === 'retrying').length), detail: 'Automatic retries in flight', tone: 'warning' },
          { id: 'exceptions-resolved', label: 'Resolved', value: String(rows.filter(row => row.status === 'resolved').length), detail: 'Closed or cleared', tone: 'positive' },
        ],
        actions: [{ id: 'acknowledge-event', label: 'Acknowledge', icon: 'check-circle-2', tone: 'accent' }],
        bulkActions: [{ id: 'acknowledge-event', label: 'Acknowledge', icon: 'check-circle-2' }],
        filters: [
          buildFilterDefinition('status', 'Statuses', [
            { value: 'new', label: 'New' },
            { value: 'acknowledged', label: 'Acknowledged' },
            { value: 'retrying', label: 'Retrying' },
            { value: 'resolved', label: 'Resolved' },
          ]),
          buildFilterDefinition('type', 'Types', [
            { value: 'integration', label: 'Integration' },
            { value: 'webhook', label: 'Webhook' },
          ]),
        ],
        columns: [
          buildColumn('title', 'Exception', 'title', 'left', 'min-w-[340px]'),
          buildColumn('type', 'Source', 'typeLabel'),
          buildColumn('entity', 'Entity', 'entityName'),
          buildColumn('status', 'Status', 'status'),
          buildColumn('primaryDate', 'Occurred', 'primaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'type', 'status', 'primaryDate'],
        emptyMessage: 'No integration exceptions match the current filters.',
      }
    }
  }
}

export async function getIntegrationsWorkspaceDetail(
  sectionId: IntegrationsWorkspaceSectionId,
  id: string
): Promise<WorkspaceDetailData | null> {
  await ensureIntegrationsWorkspaceState()
  switch (sectionId) {
    case 'connections': {
      const integrations = await getIntegrations()
      const integration = integrations.find(item => item.id === id)
      if (!integration) {
        return null
      }

      return {
        id: integration.id,
        title: integration.name,
        subtitle: `${integration.provider} · ${integration.type}`,
        badges: [{ id: 'status', label: integration.status, tone: getStatusTone(integration.status) }],
        summary: [
          buildDetailField('entity', 'Entity', integration.entityId ? entityMap.get(integration.entityId)?.name ?? integration.entityId : 'Shared'),
          buildDetailField('owner', 'Owner', integration.ownerName ?? 'Platform'),
          buildDetailField('last-sync', 'Last Sync', formatDateTimeLabel(integration.lastSyncAt)),
          buildDetailField('connected', 'Connected', formatDateLabel(integration.createdAt)),
        ],
        sections: [],
        actions: [
          { id: 'sync-integration', label: 'Run Sync', icon: 'refresh-cw' },
          { id: integration.status === 'connected' ? 'reconnect-integration' : 'reconnect-integration', label: 'Reconnect', icon: 'plug' },
        ],
      }
    }
    case 'sync_runs': {
      const run = integrationSyncRunStore.find(item => item.id === id)
      if (!run) {
        return null
      }

      return {
        id: run.id,
        title: run.integrationName,
        subtitle: run.summary,
        badges: [{ id: 'status', label: run.status, tone: getStatusTone(run.status) }],
        summary: [
          buildDetailField('source', 'Source', run.source),
          buildDetailField('processed', 'Processed', `${run.recordsProcessed}`),
          buildDetailField('errors', 'Errors', `${run.errorCount}`),
          buildDetailField('started', 'Started', formatDateTimeLabel(run.startedAt)),
        ],
        sections: [],
        actions: [{ id: 'sync-integration', label: 'Run Sync Again', icon: 'refresh-cw' }],
      }
    }
    case 'dependencies': {
      const dependency = integrationDependencyStore.find(item => item.id === id)
      if (!dependency) {
        return null
      }

      return {
        id: dependency.id,
        title: dependency.label,
        subtitle: dependency.description,
        badges: [{ id: 'status', label: dependency.status, tone: getStatusTone(dependency.status) }],
        summary: [
          buildDetailField('type', 'Type', dependency.type),
          buildDetailField('integration', 'Integration', dependency.integrationId),
        ],
        sections: [],
        actions: [],
      }
    }
    case 'exceptions': {
      const event = eventMonitoringRecordStore.find(item => item.id === id)
      if (!event) {
        return null
      }

      return {
        id: event.id,
        title: event.sourceLabel,
        subtitle: event.message,
        badges: [{ id: 'status', label: event.status, tone: getStatusTone(event.status === 'new' ? 'failed' : event.status) }],
        summary: [
          buildDetailField('source', 'Source Type', event.sourceType),
          buildDetailField('severity', 'Severity', event.severity),
          buildDetailField('occurred', 'Occurred', formatDateTimeLabel(event.occurredAt)),
          buildDetailField('entity', 'Entity', event.entityId ? entityMap.get(event.entityId)?.name ?? event.entityId : 'Shared'),
        ],
        sections: event.resolutionHint
          ? [{
              id: 'resolution',
              title: 'Resolution',
              fields: [buildDetailField('hint', 'Suggested Next Step', event.resolutionHint)],
            }]
          : [],
        actions: [{ id: 'acknowledge-event', label: 'Acknowledge', icon: 'check-circle-2' }],
      }
    }
  }
}

export async function applyIntegrationsWorkspaceAction(
  sectionId: IntegrationsWorkspaceSectionId,
  actionId: string,
  recordIds: string[]
): Promise<{ success: boolean; message?: string }> {
  await ensureIntegrationsWorkspaceState()
  if (sectionId === 'connections' || actionId === 'sync-integration') {
    await Promise.all(recordIds.map(id => syncIntegration(id)))
    return { success: true, message: 'Integration sync queued.' }
  }

  if (actionId === 'reconnect-integration') {
    await Promise.all(recordIds.map(id => reconnectIntegration(id)))
    return { success: true, message: 'Integration reconnected.' }
  }

  if (actionId === 'acknowledge-event') {
    eventMonitoringRecordStore.forEach(event => {
      if (recordIds.includes(event.id)) {
        event.status = 'acknowledged'
      }
    })
    return { success: true, message: 'Integration exceptions acknowledged.' }
  }

  return { success: false, message: `No handler for ${sectionId} action ${actionId}.` }
}
