import type {
  ApiKey,
  DeveloperApp,
  DeveloperPlatformSectionId,
  FinanceFilters,
  PlatformOverviewData,
  PlatformWorkspaceListResponse,
  PlatformWorkspaceQuery,
  PlatformWorkspaceRecord,
  RoleId,
  WebhookEndpoint,
  WorkspaceDetailData,
  WorkspaceTabItem,
} from '@/lib/types'
import { createApiKey, getApiKeys, revokeApiKey } from './legacy'
import { apiRequestLogStore, developerAppStore, ensurePlatformStore, webhookEndpointStore } from './platform-store'
import { buildColumn, buildFilterDefinition, finalizePlatformRows, matchesQueryFilter, matchesSearch, matchesScopedFilters } from './platform-workspace-support'
import { delay } from './base'
import { buildDetailField, buildOverviewRow, formatDateLabel, formatDateTimeLabel, getStatusTone } from './workspace-support'

function buildApiKeyRow(key: ApiKey): PlatformWorkspaceRecord {
  return {
    id: key.id,
    title: key.name,
    subtitle: key.createdBy,
    reference: `${key.key.slice(0, 12)}...${key.key.slice(-4)}`,
    status: key.status,
    statusTone: getStatusTone(key.status),
    primaryMetricLabel: 'Scopes',
    primaryMetricValue: key.permissions.length,
    primaryMetricDisplay: `${key.permissions.length}`,
    primaryDateValue: key.lastUsedAt ?? key.createdAt,
    primaryDateDisplay: formatDateTimeLabel(key.lastUsedAt),
    secondaryDateValue: key.expiresAt,
    secondaryDateDisplay: key.expiresAt ? formatDateLabel(key.expiresAt) : 'No expiry',
  }
}

function buildWebhookRow(webhook: WebhookEndpoint): PlatformWorkspaceRecord {
  return {
    id: webhook.id,
    title: webhook.name,
    subtitle: webhook.url,
    status: webhook.status,
    statusTone: getStatusTone(webhook.status),
    typeLabel: webhook.eventType,
    primaryMetricLabel: 'Retries',
    primaryMetricValue: webhook.retryCount,
    primaryMetricDisplay: `${webhook.retryCount}`,
    primaryDateValue: webhook.lastDeliveredAt ?? webhook.createdAt,
    primaryDateDisplay: formatDateTimeLabel(webhook.lastDeliveredAt),
    secondaryDateValue: webhook.createdAt,
    secondaryDateDisplay: formatDateLabel(webhook.createdAt),
  }
}

function buildDeveloperAppRow(app: DeveloperApp): PlatformWorkspaceRecord {
  return {
    id: app.id,
    title: app.name,
    subtitle: app.clientId,
    status: app.status,
    statusTone: getStatusTone(app.status),
    typeLabel: app.environment,
    ownerLabel: app.ownerName,
    primaryMetricLabel: 'Scopes',
    primaryMetricValue: app.scopes.length,
    primaryMetricDisplay: `${app.scopes.length}`,
    primaryDateValue: app.lastUsedAt ?? app.createdAt,
    primaryDateDisplay: formatDateTimeLabel(app.lastUsedAt),
    secondaryDateValue: app.createdAt,
    secondaryDateDisplay: formatDateLabel(app.createdAt),
  }
}

function buildRequestLogRow(log: typeof apiRequestLogStore[number]): PlatformWorkspaceRecord {
  return {
    id: log.id,
    title: `${log.method} ${log.endpoint}`,
    subtitle: log.appId ?? log.apiKeyId ?? 'Unknown client',
    status: log.success ? 'success' : 'failed',
    statusTone: getStatusTone(log.success ? 'active' : 'failed'),
    typeLabel: `${log.statusCode}`,
    primaryMetricLabel: 'Latency',
    primaryMetricValue: log.latencyMs,
    primaryMetricDisplay: `${log.latencyMs} ms`,
    primaryDateValue: log.createdAt,
    primaryDateDisplay: formatDateTimeLabel(log.createdAt),
  }
}

export function getApiDeveloperWorkspaceDefaultSection(_roleId?: RoleId): DeveloperPlatformSectionId {
  return 'api_keys'
}

export async function getApiDeveloperWorkspaceTabs(
  _filters: FinanceFilters,
  _roleId?: RoleId
): Promise<WorkspaceTabItem[]> {
  await ensurePlatformStore()
  const apiKeys = await getApiKeys()
  return [
    { id: 'api_keys', label: 'API Keys', count: apiKeys.length },
    { id: 'webhooks', label: 'Webhooks', count: webhookEndpointStore.length },
    { id: 'apps', label: 'Apps', count: developerAppStore.length },
    { id: 'request_logs', label: 'Request Logs', count: apiRequestLogStore.length },
  ]
}

export async function getApiDeveloperWorkspaceOverview(
  filters: FinanceFilters,
  _roleId?: RoleId
): Promise<PlatformOverviewData> {
  await ensurePlatformStore()
  const apiKeys = await getApiKeys()
  const scopedLogs = apiRequestLogStore.filter(log => !filters.entityId || filters.entityId === 'e4' || log.entityId === filters.entityId)

  return {
    moduleId: 'api-developer',
    title: 'API / Developer Platform',
    subtitle: 'Manage credentials, webhook delivery, developer clients, and API activity with a backend-ready control surface.',
    badge: 'Developer Platform',
    defaultSectionId: 'api_keys',
    metrics: [
      { id: 'dev-keys', label: 'API Keys', value: String(apiKeys.length), detail: 'Active and revoked credentials', tone: 'neutral' },
      { id: 'dev-webhooks', label: 'Webhooks', value: String(webhookEndpointStore.length), detail: 'Endpoint subscriptions', tone: 'accent' },
      { id: 'dev-apps', label: 'Apps', value: String(developerAppStore.length), detail: 'Registered clients', tone: 'positive' },
      { id: 'dev-errors', label: 'Failed Requests', value: String(scopedLogs.filter(log => !log.success).length), detail: 'Current entity scope', tone: scopedLogs.some(log => !log.success) ? 'critical' : 'positive' },
    ],
    actions: [
      { id: 'new-api-key', label: 'Create API Key', icon: 'plus', tone: 'accent' },
      { id: 'new-webhook', label: 'Add Webhook', icon: 'plus' },
    ],
    sections: [
      {
        id: 'credentials',
        title: 'Credential Activity',
        description: 'Recent developer credentials and request movement.',
        rows: apiKeys.slice(0, 4).map(key =>
          buildOverviewRow(key.id, key.name, {
            value: `${key.permissions.length} scopes`,
            href: '/api-developer',
            status: key.status,
            statusTone: getStatusTone(key.status),
            meta: [formatDateTimeLabel(key.lastUsedAt)],
          })
        ),
      },
      {
        id: 'request-watch',
        title: 'Request Watchlist',
        description: 'Recent API errors and slow paths.',
        rows: scopedLogs.slice(0, 4).map(log =>
          buildOverviewRow(log.id, `${log.method} ${log.endpoint}`, {
            value: `${log.latencyMs} ms`,
            href: '/api-developer',
            status: log.success ? 'success' : 'failed',
            statusTone: getStatusTone(log.success ? 'active' : 'failed'),
            meta: [formatDateTimeLabel(log.createdAt)],
          })
        ),
      },
    ],
  }
}

export async function getApiDeveloperWorkspaceList(
  sectionId: DeveloperPlatformSectionId,
  filters: FinanceFilters,
  query: PlatformWorkspaceQuery
): Promise<PlatformWorkspaceListResponse> {
  await ensurePlatformStore()
  await delay()

  switch (sectionId) {
    case 'api_keys': {
      const apiKeys = await getApiKeys()
      const rows = apiKeys
        .filter(key => (!query.filters?.status || query.filters.status === 'all' || key.status === query.filters.status))
        .filter(key => matchesSearch([key.name, key.createdBy, key.key], query.search))
        .map(buildApiKeyRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'keys-visible', label: 'Visible Keys', value: String(rows.length), detail: 'Developer credentials', tone: 'neutral' },
          { id: 'keys-active', label: 'Active', value: String(rows.filter(row => row.status === 'active').length), detail: 'Usable credentials', tone: 'positive' },
          { id: 'keys-revoked', label: 'Revoked', value: String(rows.filter(row => row.status === 'revoked').length), detail: 'Disabled credentials', tone: 'warning' },
          { id: 'keys-scopes', label: 'Granted Scopes', value: String(apiKeys.reduce((sum, key) => sum + key.permissions.length, 0)), detail: 'Across visible keys', tone: 'accent' },
        ],
        actions: [
          { id: 'new-api-key', label: 'Create API Key', icon: 'plus', tone: 'accent' },
        ],
        bulkActions: [{ id: 'revoke-api-key', label: 'Revoke', icon: 'ban' }],
        filters: [buildFilterDefinition('status', 'Statuses', [{ value: 'active', label: 'Active' }, { value: 'revoked', label: 'Revoked' }])],
        columns: [
          buildColumn('title', 'API Key', 'title', 'left', 'min-w-[320px]'),
          buildColumn('status', 'Status', 'status'),
          buildColumn('primaryMetric', 'Scopes', 'primaryMetricValue', 'right'),
          buildColumn('primaryDate', 'Last Used', 'primaryDateValue'),
          buildColumn('secondaryDate', 'Expires', 'secondaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'status', 'primaryMetric', 'primaryDate', 'secondaryDate'],
        emptyMessage: 'No API keys match the current developer filters.',
      }
    }
    case 'webhooks': {
      const rows = webhookEndpointStore
        .filter(webhook => matchesQueryFilter(query, 'status', webhook.status))
        .filter(webhook => matchesSearch([webhook.name, webhook.url, webhook.eventType], query.search))
        .map(buildWebhookRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'webhooks-visible', label: 'Visible Endpoints', value: String(rows.length), detail: 'Configured subscriptions', tone: 'neutral' },
          { id: 'webhooks-active', label: 'Active', value: String(rows.filter(row => row.status === 'active').length), detail: 'Delivering successfully', tone: 'positive' },
          { id: 'webhooks-errors', label: 'Errors', value: String(rows.filter(row => row.status === 'error').length), detail: 'Needs operator attention', tone: rows.some(row => row.status === 'error') ? 'critical' : 'neutral' },
          { id: 'webhooks-retries', label: 'Retries', value: String(webhookEndpointStore.reduce((sum, endpoint) => sum + endpoint.retryCount, 0)), detail: 'Current retry queue', tone: 'warning' },
        ],
        actions: [{ id: 'new-webhook', label: 'Add Webhook', icon: 'plus', tone: 'accent' }],
        bulkActions: [{ id: 'pause-webhook', label: 'Pause', icon: 'pause' }],
        filters: [
          buildFilterDefinition('status', 'Statuses', [
            { value: 'active', label: 'Active' },
            { value: 'paused', label: 'Paused' },
            { value: 'error', label: 'Error' },
          ]),
        ],
        columns: [
          buildColumn('title', 'Webhook', 'title', 'left', 'min-w-[340px]'),
          buildColumn('type', 'Event', 'typeLabel'),
          buildColumn('status', 'Status', 'status'),
          buildColumn('primaryMetric', 'Retries', 'primaryMetricValue', 'right'),
          buildColumn('primaryDate', 'Last Delivery', 'primaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'type', 'status', 'primaryMetric', 'primaryDate'],
        emptyMessage: 'No webhook endpoints match the current filters.',
      }
    }
    case 'apps': {
      const rows = developerAppStore
        .filter(app => matchesQueryFilter(query, 'status', app.status))
        .filter(app => matchesQueryFilter(query, 'type', app.environment))
        .filter(app => matchesSearch([app.name, app.clientId, app.ownerName], query.search))
        .map(buildDeveloperAppRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'apps-visible', label: 'Visible Apps', value: String(rows.length), detail: 'Registered API clients', tone: 'neutral' },
          { id: 'apps-active', label: 'Active', value: String(rows.filter(row => row.status === 'active').length), detail: 'Currently in use', tone: 'positive' },
          { id: 'apps-sandbox', label: 'Sandbox', value: String(rows.filter(row => row.typeLabel === 'sandbox').length), detail: 'Non-production clients', tone: 'warning' },
          { id: 'apps-scopes', label: 'Granted Scopes', value: String(developerAppStore.reduce((sum, app) => sum + app.scopes.length, 0)), detail: 'Across apps', tone: 'accent' },
        ],
        actions: [{ id: 'new-developer-app', label: 'Create App', icon: 'plus', tone: 'accent' }],
        filters: [
          buildFilterDefinition('status', 'Statuses', [
            { value: 'active', label: 'Active' },
            { value: 'draft', label: 'Draft' },
            { value: 'suspended', label: 'Suspended' },
          ]),
          buildFilterDefinition('type', 'Environments', [
            { value: 'production', label: 'Production' },
            { value: 'sandbox', label: 'Sandbox' },
          ]),
        ],
        columns: [
          buildColumn('title', 'App', 'title', 'left', 'min-w-[320px]'),
          buildColumn('type', 'Environment', 'typeLabel'),
          buildColumn('owner', 'Owner', 'ownerLabel'),
          buildColumn('status', 'Status', 'status'),
          buildColumn('primaryMetric', 'Scopes', 'primaryMetricValue', 'right'),
          buildColumn('primaryDate', 'Last Used', 'primaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'type', 'owner', 'status', 'primaryDate'],
        emptyMessage: 'No developer apps match the current filters.',
      }
    }
    case 'request_logs': {
      const rows = apiRequestLogStore
        .filter(log => matchesScopedFilters({ entityId: log.entityId }, filters, query, log.createdAt))
        .filter(log => matchesQueryFilter(query, 'status', log.success ? 'success' : 'failed'))
        .filter(log => matchesSearch([log.endpoint, log.method, log.appId, log.apiKeyId], query.search))
        .map(buildRequestLogRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'logs-visible', label: 'Visible Requests', value: String(rows.length), detail: 'API traffic in scope', tone: 'neutral' },
          { id: 'logs-failed', label: 'Failures', value: String(rows.filter(row => row.status === 'failed').length), detail: 'Error responses', tone: rows.some(row => row.status === 'failed') ? 'critical' : 'neutral' },
          { id: 'logs-success', label: 'Successful', value: String(rows.filter(row => row.status === 'success').length), detail: 'Healthy traffic', tone: 'positive' },
          { id: 'logs-latency', label: 'Peak Latency', value: `${Math.max(...apiRequestLogStore.map(log => log.latencyMs))} ms`, detail: 'Highest visible latency', tone: 'warning' },
        ],
        actions: [],
        filters: [
          buildFilterDefinition('status', 'Statuses', [
            { value: 'success', label: 'Success' },
            { value: 'failed', label: 'Failed' },
          ]),
        ],
        columns: [
          buildColumn('title', 'Request', 'title', 'left', 'min-w-[360px]'),
          buildColumn('type', 'HTTP Status', 'typeLabel'),
          buildColumn('status', 'Outcome', 'status'),
          buildColumn('primaryMetric', 'Latency', 'primaryMetricValue', 'right'),
          buildColumn('primaryDate', 'Timestamp', 'primaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'type', 'status', 'primaryMetric', 'primaryDate'],
        emptyMessage: 'No API request logs match the current filters.',
      }
    }
  }
}

export async function getApiDeveloperWorkspaceDetail(
  sectionId: DeveloperPlatformSectionId,
  id: string
): Promise<WorkspaceDetailData | null> {
  await ensurePlatformStore()
  switch (sectionId) {
    case 'api_keys': {
      const apiKeys = await getApiKeys()
      const key = apiKeys.find(item => item.id === id)
      if (!key) {
        return null
      }

      return {
        id: key.id,
        title: key.name,
        subtitle: `${key.createdBy} · ${key.key.slice(0, 12)}...${key.key.slice(-4)}`,
        badges: [{ id: 'status', label: key.status, tone: getStatusTone(key.status) }],
        summary: [
          buildDetailField('created', 'Created', formatDateLabel(key.createdAt)),
          buildDetailField('last-used', 'Last Used', formatDateTimeLabel(key.lastUsedAt)),
          buildDetailField('expires', 'Expires', key.expiresAt ? formatDateLabel(key.expiresAt) : 'No expiry'),
          buildDetailField('scopes', 'Scopes', `${key.permissions.length}`),
        ],
        sections: [
          {
            id: 'permissions',
            title: 'Permissions',
            fields: key.permissions.map(permission => buildDetailField(permission, permission, 'Granted')),
          },
        ],
        actions: key.status === 'active' ? [{ id: 'revoke-api-key', label: 'Revoke Key', icon: 'ban' }] : [],
      }
    }
    case 'webhooks': {
      const webhook = webhookEndpointStore.find(item => item.id === id)
      if (!webhook) {
        return null
      }

      return {
        id: webhook.id,
        title: webhook.name,
        subtitle: `${webhook.eventType} · ${webhook.url}`,
        badges: [{ id: 'status', label: webhook.status, tone: getStatusTone(webhook.status) }],
        summary: [
          buildDetailField('last-delivery', 'Last Delivery', formatDateTimeLabel(webhook.lastDeliveredAt)),
          buildDetailField('signing-key', 'Signing Key', webhook.signingKey),
          buildDetailField('retries', 'Retries', `${webhook.retryCount}`),
          buildDetailField('created', 'Created', formatDateLabel(webhook.createdAt)),
        ],
        sections: [],
        actions: [{ id: 'pause-webhook', label: 'Pause Endpoint', icon: 'pause' }],
      }
    }
    case 'apps': {
      const app = developerAppStore.find(item => item.id === id)
      if (!app) {
        return null
      }

      return {
        id: app.id,
        title: app.name,
        subtitle: `${app.clientId} · ${app.environment}`,
        badges: [{ id: 'status', label: app.status, tone: getStatusTone(app.status) }],
        summary: [
          buildDetailField('owner', 'Owner', app.ownerName),
          buildDetailField('environment', 'Environment', app.environment),
          buildDetailField('created', 'Created', formatDateLabel(app.createdAt)),
          buildDetailField('last-used', 'Last Used', formatDateTimeLabel(app.lastUsedAt)),
        ],
        sections: [
          {
            id: 'scopes',
            title: 'Granted Scopes',
            fields: app.scopes.map(scope => buildDetailField(scope, scope, 'Granted')),
          },
        ],
        actions: [{ id: 'suspend-app', label: 'Suspend App', icon: 'pause' }],
      }
    }
    case 'request_logs': {
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
          buildDetailField('api-key', 'API Key', log.apiKeyId ?? 'Unknown'),
          buildDetailField('app', 'App', log.appId ?? 'Unknown'),
          buildDetailField('entity', 'Entity', log.entityId ?? 'Shared'),
          buildDetailField('timestamp', 'Timestamp', formatDateTimeLabel(log.createdAt)),
        ],
        sections: [],
        actions: [],
      }
    }
  }
}

export async function applyApiDeveloperWorkspaceAction(
  sectionId: DeveloperPlatformSectionId,
  actionId: string,
  recordIds: string[]
): Promise<{ success: boolean; message?: string }> {
  await ensurePlatformStore()
  if (actionId === 'new-api-key') {
    await createApiKey({
      name: `Generated Platform Key ${new Date().toLocaleDateString('en-US')}`,
      permissions: ['read:all'],
    })
    return { success: true, message: 'API key generated.' }
  }

  if (actionId === 'revoke-api-key') {
    await Promise.all(recordIds.map(id => revokeApiKey(id)))
    return { success: true, message: 'API key revoked.' }
  }

  if (actionId === 'new-webhook') {
    webhookEndpointStore.unshift({
      id: `webhook-${Date.now()}`,
      name: 'Generated Webhook',
      url: 'https://hooks.northstar.example/generated',
      eventType: 'export.completed',
      status: 'active',
      signingKey: `whsec_${Date.now()}`,
      retryCount: 0,
      createdAt: new Date(),
      lastDeliveredAt: new Date(),
    })
    return { success: true, message: 'Webhook endpoint created.' }
  }

  if (actionId === 'pause-webhook') {
    webhookEndpointStore.forEach(webhook => {
      if (recordIds.includes(webhook.id)) {
        webhook.status = 'paused'
      }
    })
    return { success: true, message: 'Webhook paused.' }
  }

  if (actionId === 'new-developer-app') {
    developerAppStore.unshift({
      id: `app-${Date.now()}`,
      name: 'Generated App',
      status: 'draft',
      ownerName: 'Platform Team',
      clientId: `cli_generated_${Date.now()}`,
      environment: 'sandbox',
      scopes: ['reports.read'],
      createdAt: new Date(),
      lastUsedAt: new Date(),
    })
    return { success: true, message: 'Developer app created.' }
  }

  if (actionId === 'suspend-app') {
    developerAppStore.forEach(app => {
      if (recordIds.includes(app.id)) {
        app.status = 'suspended'
      }
    })
    return { success: true, message: 'Developer app suspended.' }
  }

  return { success: false, message: `No handler for ${sectionId} action ${actionId}.` }
}
