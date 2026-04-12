import type {
  Entity,
  FinanceFilters,
  PlatformOverviewData,
  PlatformWorkspaceListResponse,
  PlatformWorkspaceQuery,
  PlatformWorkspaceRecord,
  RoleId,
  WorkspaceDetailData,
  WorkspaceTabItem,
} from '@/lib/types'
import { getEntities } from './master-data'
import { apiRequestLogStore, ensurePlatformStore, eventMonitoringRecordStore, integrationSyncRunStore, webhookEndpointStore } from './platform-store'
import { buildColumn, buildFilterDefinition, finalizePlatformRows, matchesQueryFilter, matchesScopedFilters, matchesSearch } from './platform-workspace-support'
import { delay } from './base'
import { buildDetailField, buildOverviewRow, formatDateTimeLabel, getStatusTone } from './workspace-support'

export type EventMonitoringSectionId = 'events' | 'sync_runs' | 'api_errors'

let entityMap = new Map<string, Entity>()

async function ensureEventMonitoringState() {
  const [entities] = await Promise.all([getEntities(), ensurePlatformStore()])
  entityMap = new Map(entities.map(entity => [entity.id, entity]))
}

function buildEventRow(event: typeof eventMonitoringRecordStore[number]): PlatformWorkspaceRecord {
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

function buildSyncRow(run: typeof integrationSyncRunStore[number]): PlatformWorkspaceRecord {
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
  }
}

function buildApiErrorRow(log: typeof apiRequestLogStore[number]): PlatformWorkspaceRecord {
  return {
    id: log.id,
    title: `${log.method} ${log.endpoint}`,
    subtitle: log.appId ?? log.apiKeyId ?? 'Unknown client',
    status: log.success ? 'success' : 'failed',
    statusTone: getStatusTone(log.success ? 'active' : 'failed'),
    typeLabel: `${log.statusCode}`,
    entityName: log.entityId ? entityMap.get(log.entityId)?.name ?? log.entityId : 'Shared',
    primaryMetricLabel: 'Latency',
    primaryMetricValue: log.latencyMs,
    primaryMetricDisplay: `${log.latencyMs} ms`,
    primaryDateValue: log.createdAt,
    primaryDateDisplay: formatDateTimeLabel(log.createdAt),
  }
}

export function getEventMonitoringWorkspaceDefaultSection(roleId?: RoleId): EventMonitoringSectionId {
  return roleId === 'controller' ? 'sync_runs' : 'events'
}

export async function getEventMonitoringWorkspaceTabs(
  filters: FinanceFilters,
  _roleId?: RoleId
): Promise<WorkspaceTabItem[]> {
  await ensureEventMonitoringState()
  const scopedEvents = eventMonitoringRecordStore.filter(event => !filters.entityId || filters.entityId === 'e4' || event.entityId === filters.entityId)
  const scopedRuns = integrationSyncRunStore.filter(run => !filters.entityId || filters.entityId === 'e4' || run.entityId === filters.entityId)
  const scopedApiErrors = apiRequestLogStore.filter(log => !log.success && (!filters.entityId || filters.entityId === 'e4' || log.entityId === filters.entityId))

  return [
    { id: 'events', label: 'Events', count: scopedEvents.length },
    { id: 'sync_runs', label: 'Sync Telemetry', count: scopedRuns.length },
    { id: 'api_errors', label: 'API Errors', count: scopedApiErrors.length },
  ]
}

export async function getEventMonitoringWorkspaceOverview(
  filters: FinanceFilters,
  roleId?: RoleId
): Promise<PlatformOverviewData> {
  await ensureEventMonitoringState()
  const scopedEvents = eventMonitoringRecordStore.filter(event => !filters.entityId || filters.entityId === 'e4' || event.entityId === filters.entityId)
  const scopedApiErrors = apiRequestLogStore.filter(log => !log.success && (!filters.entityId || filters.entityId === 'e4' || log.entityId === filters.entityId))

  return {
    moduleId: 'event-monitoring',
    title: 'Event Monitoring',
    subtitle: 'Track real-time integrations, API failures, and operational events through one service-backed monitoring workspace.',
    badge: 'Operational Events',
    defaultSectionId: getEventMonitoringWorkspaceDefaultSection(roleId),
    metrics: [
      { id: 'events-total', label: 'Events', value: String(scopedEvents.length), detail: 'Visible operational events', tone: 'neutral' },
      { id: 'events-critical', label: 'Critical', value: String(scopedEvents.filter(event => event.severity === 'critical').length), detail: 'High-severity issues', tone: scopedEvents.some(event => event.severity === 'critical') ? 'critical' : 'positive' },
      { id: 'events-retrying', label: 'Retrying', value: String(scopedEvents.filter(event => event.status === 'retrying').length), detail: 'Automatic retries active', tone: 'warning' },
      { id: 'events-api', label: 'API Errors', value: String(scopedApiErrors.length), detail: 'Failed API requests in scope', tone: scopedApiErrors.length ? 'critical' : 'positive' },
    ],
    actions: [{ id: 'acknowledge-event', label: 'Acknowledge Event', icon: 'check-circle-2', tone: 'accent' }],
    sections: [
      {
        id: 'critical-events',
        title: 'Critical Events',
        description: 'Highest-severity failures needing review.',
        rows: scopedEvents.filter(event => event.severity === 'critical').slice(0, 4).map(event =>
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
        id: 'api-errors',
        title: 'Recent API Errors',
        description: 'Latest failed API traffic across the platform.',
        rows: scopedApiErrors.slice(0, 4).map(log =>
          buildOverviewRow(log.id, `${log.method} ${log.endpoint}`, {
            value: `${log.statusCode}`,
            href: '/event-monitoring',
            status: 'failed',
            statusTone: 'critical',
            meta: [formatDateTimeLabel(log.createdAt)],
          })
        ),
      },
    ],
  }
}

export async function getEventMonitoringWorkspaceList(
  sectionId: EventMonitoringSectionId,
  filters: FinanceFilters,
  query: PlatformWorkspaceQuery
): Promise<PlatformWorkspaceListResponse> {
  await ensureEventMonitoringState()
  await delay()

  switch (sectionId) {
    case 'events': {
      const rows = eventMonitoringRecordStore
        .filter(event => matchesScopedFilters({ entityId: event.entityId }, filters, query, event.occurredAt))
        .filter(event => matchesQueryFilter(query, 'status', event.status))
        .filter(event => matchesQueryFilter(query, 'type', event.sourceType))
        .filter(event => matchesSearch([event.sourceLabel, event.message, event.resolutionHint], query.search))
        .map(buildEventRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'events-visible', label: 'Visible Events', value: String(rows.length), detail: 'Operational event stream', tone: 'neutral' },
          { id: 'events-new', label: 'New', value: String(rows.filter(row => row.status === 'new').length), detail: 'Unreviewed events', tone: rows.some(row => row.status === 'new') ? 'critical' : 'neutral' },
          { id: 'events-ack', label: 'Acknowledged', value: String(rows.filter(row => row.status === 'acknowledged').length), detail: 'Pending resolution', tone: 'warning' },
          { id: 'events-resolved', label: 'Resolved', value: String(rows.filter(row => row.status === 'resolved').length), detail: 'Closed events', tone: 'positive' },
        ],
        actions: [{ id: 'acknowledge-event', label: 'Acknowledge Event', icon: 'check-circle-2', tone: 'accent' }],
        bulkActions: [{ id: 'acknowledge-event', label: 'Acknowledge', icon: 'check-circle-2' }],
        filters: [
          buildFilterDefinition('status', 'Statuses', [
            { value: 'new', label: 'New' },
            { value: 'acknowledged', label: 'Acknowledged' },
            { value: 'retrying', label: 'Retrying' },
            { value: 'resolved', label: 'Resolved' },
          ]),
          buildFilterDefinition('type', 'Sources', [
            { value: 'integration', label: 'Integration' },
            { value: 'webhook', label: 'Webhook' },
            { value: 'rule', label: 'Rule' },
            { value: 'export', label: 'Export' },
            { value: 'workflow', label: 'Workflow' },
            { value: 'api', label: 'API' },
          ]),
        ],
        columns: [
          buildColumn('title', 'Event', 'title', 'left', 'min-w-[360px]'),
          buildColumn('type', 'Source', 'typeLabel'),
          buildColumn('entity', 'Entity', 'entityName'),
          buildColumn('status', 'Status', 'status'),
          buildColumn('primaryDate', 'Occurred', 'primaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'type', 'status', 'primaryDate'],
        emptyMessage: 'No events match the current monitoring filters.',
      }
    }
    case 'sync_runs': {
      const rows = integrationSyncRunStore
        .filter(run => matchesScopedFilters({ entityId: run.entityId }, filters, query, run.startedAt))
        .filter(run => matchesQueryFilter(query, 'status', run.status))
        .filter(run => matchesSearch([run.integrationName, run.summary, run.source], query.search))
        .map(buildSyncRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'sync-visible', label: 'Visible Syncs', value: String(rows.length), detail: 'Telemetry stream', tone: 'neutral' },
          { id: 'sync-failed', label: 'Failed', value: String(rows.filter(row => row.status === 'failed').length), detail: 'Need rerun', tone: rows.some(row => row.status === 'failed') ? 'critical' : 'neutral' },
          { id: 'sync-running', label: 'Running', value: String(rows.filter(row => row.status === 'running').length), detail: 'Currently in progress', tone: 'warning' },
          { id: 'sync-processed', label: 'Processed', value: String(integrationSyncRunStore.reduce((sum, run) => sum + run.recordsProcessed, 0)), detail: 'Across visible sync runs', tone: 'accent' },
        ],
        actions: [],
        filters: [
          buildFilterDefinition('status', 'Statuses', [
            { value: 'success', label: 'Success' },
            { value: 'warning', label: 'Warning' },
            { value: 'failed', label: 'Failed' },
            { value: 'running', label: 'Running' },
          ]),
        ],
        columns: [
          buildColumn('title', 'Sync Run', 'title', 'left', 'min-w-[340px]'),
          buildColumn('type', 'Source', 'typeLabel'),
          buildColumn('entity', 'Entity', 'entityName'),
          buildColumn('status', 'Status', 'status'),
          buildColumn('primaryMetric', 'Processed', 'primaryMetricValue', 'right'),
          buildColumn('secondaryMetric', 'Errors', 'secondaryMetricValue', 'right'),
          buildColumn('primaryDate', 'Started', 'primaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'status', 'primaryMetric', 'secondaryMetric', 'primaryDate'],
        emptyMessage: 'No sync telemetry matches the current filters.',
      }
    }
    case 'api_errors': {
      const rows = apiRequestLogStore
        .filter(log => !log.success)
        .filter(log => matchesScopedFilters({ entityId: log.entityId }, filters, query, log.createdAt))
        .filter(log => matchesSearch([log.endpoint, log.method, log.appId, log.apiKeyId], query.search))
        .map(buildApiErrorRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'apierr-visible', label: 'Visible API Errors', value: String(rows.length), detail: 'Failed requests only', tone: rows.length ? 'critical' : 'positive' },
          { id: 'apierr-500', label: '5xx Errors', value: String(apiRequestLogStore.filter(log => !log.success && log.statusCode >= 500).length), detail: 'Server-side failures', tone: 'critical' },
          { id: 'apierr-429', label: 'Rate Limits', value: String(apiRequestLogStore.filter(log => !log.success && log.statusCode === 429).length), detail: 'Traffic throttled', tone: 'warning' },
          { id: 'apierr-latency', label: 'Peak Latency', value: `${Math.max(...apiRequestLogStore.map(log => log.latencyMs))} ms`, detail: 'Highest failed request latency', tone: 'accent' },
        ],
        actions: [],
        filters: [],
        columns: [
          buildColumn('title', 'API Error', 'title', 'left', 'min-w-[340px]'),
          buildColumn('type', 'Status Code', 'typeLabel'),
          buildColumn('entity', 'Entity', 'entityName'),
          buildColumn('status', 'Outcome', 'status'),
          buildColumn('primaryMetric', 'Latency', 'primaryMetricValue', 'right'),
          buildColumn('primaryDate', 'Occurred', 'primaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'type', 'entity', 'primaryMetric', 'primaryDate'],
        emptyMessage: 'No API errors match the current filters.',
      }
    }
  }
}

export async function getEventMonitoringWorkspaceDetail(
  sectionId: EventMonitoringSectionId,
  id: string
): Promise<WorkspaceDetailData | null> {
  await ensureEventMonitoringState()
  if (sectionId === 'events') {
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
        buildDetailField('source', 'Source', event.sourceType),
        buildDetailField('severity', 'Severity', event.severity),
        buildDetailField('occurred', 'Occurred', formatDateTimeLabel(event.occurredAt)),
      ],
      sections: event.resolutionHint ? [{ id: 'hint', title: 'Resolution Hint', fields: [buildDetailField('hint', 'Suggested Resolution', event.resolutionHint)] }] : [],
      actions: [{ id: 'acknowledge-event', label: 'Acknowledge', icon: 'check-circle-2' }],
    }
  }

  if (sectionId === 'sync_runs') {
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
      actions: [],
    }
  }

  const log = apiRequestLogStore.find(item => item.id === id)
  if (!log) {
    return null
  }

  return {
    id: log.id,
    title: `${log.method} ${log.endpoint}`,
    subtitle: `${log.statusCode} · ${log.latencyMs} ms`,
    badges: [{ id: 'status', label: log.success ? 'success' : 'failed', tone: getStatusTone(log.success ? 'active' : 'failed') }],
    summary: [
      buildDetailField('app', 'App', log.appId ?? 'Unknown'),
      buildDetailField('api-key', 'API Key', log.apiKeyId ?? 'Unknown'),
      buildDetailField('entity', 'Entity', log.entityId ?? 'Shared'),
      buildDetailField('timestamp', 'Occurred', formatDateTimeLabel(log.createdAt)),
    ],
    sections: [],
    actions: [],
  }
}

export async function applyEventMonitoringWorkspaceAction(
  _sectionId: EventMonitoringSectionId,
  actionId: string,
  recordIds: string[]
): Promise<{ success: boolean; message?: string }> {
  await ensureEventMonitoringState()
  if (actionId === 'acknowledge-event') {
    eventMonitoringRecordStore.forEach(event => {
      if (recordIds.includes(event.id)) {
        event.status = 'acknowledged'
      }
    })
    return { success: true, message: 'Event acknowledged.' }
  }

  return { success: false, message: `No handler for action ${actionId}.` }
}
