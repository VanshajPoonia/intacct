import type {
  Entity,
  ExportsSharingSectionId,
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
import { deliveryTargetStore, ensurePlatformStore, exportJobStore, exportScheduleStore, shareLinkStore } from './platform-store'
import { buildColumn, buildFilterDefinition, finalizePlatformRows, matchesQueryFilter, matchesScopedFilters, matchesSearch } from './platform-workspace-support'
import { delay } from './base'
import { buildDetailField, buildOverviewRow, formatDateLabel, formatDateTimeLabel, getStatusTone } from './workspace-support'

let entityMap = new Map<string, Entity>()

async function ensureExportsSharingState() {
  const [entities] = await Promise.all([getEntities(), ensurePlatformStore()])
  entityMap = new Map(entities.map(entity => [entity.id, entity]))
}

function buildExportJobRow(job: typeof exportJobStore[number]): PlatformWorkspaceRecord {
  return {
    id: job.id,
    title: job.name,
    subtitle: job.module,
    status: job.status,
    statusTone: getStatusTone(job.status),
    typeLabel: job.format,
    entityName: job.entityId ? entityMap.get(job.entityId)?.name ?? job.entityId : 'Shared',
    ownerLabel: job.requestedBy,
    primaryMetricLabel: 'Records',
    primaryMetricValue: job.recordCount,
    primaryMetricDisplay: `${job.recordCount}`,
    primaryDateValue: job.createdAt,
    primaryDateDisplay: formatDateTimeLabel(job.createdAt),
    secondaryDateValue: job.deliveredAt,
    secondaryDateDisplay: formatDateTimeLabel(job.deliveredAt),
  }
}

function buildExportScheduleRow(schedule: typeof exportScheduleStore[number]): PlatformWorkspaceRecord {
  return {
    id: schedule.id,
    title: schedule.name,
    subtitle: `${schedule.module} · ${schedule.format}`,
    status: schedule.status,
    statusTone: getStatusTone(schedule.status),
    typeLabel: schedule.frequency,
    entityName: schedule.entityId ? entityMap.get(schedule.entityId)?.name ?? schedule.entityId : 'Shared',
    primaryDateValue: schedule.nextRunAt,
    primaryDateDisplay: formatDateTimeLabel(schedule.nextRunAt),
    reference: deliveryTargetStore.find(target => target.id === schedule.targetId)?.label,
  }
}

function buildShareLinkRow(link: typeof shareLinkStore[number]): PlatformWorkspaceRecord {
  return {
    id: link.id,
    title: link.name,
    subtitle: link.module,
    status: link.status,
    statusTone: getStatusTone(link.status === 'expired' ? 'failed' : link.status),
    ownerLabel: link.createdBy,
    primaryMetricLabel: 'Recipients',
    primaryMetricValue: Number.parseInt(link.recipientSummary, 10) || 1,
    primaryMetricDisplay: link.recipientSummary,
    primaryDateValue: link.createdAt,
    primaryDateDisplay: formatDateTimeLabel(link.createdAt),
    secondaryDateValue: link.expiresAt,
    secondaryDateDisplay: link.expiresAt ? formatDateLabel(link.expiresAt) : 'No expiry',
    reference: link.url,
  }
}

function buildDeliveryFailureRow(target: typeof deliveryTargetStore[number]): PlatformWorkspaceRecord {
  return {
    id: target.id,
    title: target.label,
    subtitle: target.destination,
    status: target.status === 'error' ? 'failed' : target.status,
    statusTone: getStatusTone(target.status === 'error' ? 'failed' : target.status),
    typeLabel: target.type,
    reference: target.destination,
  }
}

export function getExportsSharingWorkspaceDefaultSection(roleId?: RoleId): ExportsSharingSectionId {
  return roleId === 'cfo' ? 'share_links' : 'export_jobs'
}

export async function getExportsSharingWorkspaceTabs(
  _filters: FinanceFilters,
  _roleId?: RoleId
): Promise<WorkspaceTabItem[]> {
  await ensureExportsSharingState()
  return [
    { id: 'export_jobs', label: 'Export Jobs', count: exportJobStore.length },
    { id: 'schedules', label: 'Schedules', count: exportScheduleStore.length },
    { id: 'share_links', label: 'Share Links', count: shareLinkStore.length },
    { id: 'delivery_failures', label: 'Delivery Failures', count: deliveryTargetStore.filter(target => target.status === 'error').length },
  ]
}

export async function getExportsSharingWorkspaceOverview(
  filters: FinanceFilters,
  roleId?: RoleId
): Promise<PlatformOverviewData> {
  await ensureExportsSharingState()
  const scopedJobs = exportJobStore.filter(job => !filters.entityId || filters.entityId === 'e4' || job.entityId === filters.entityId)

  return {
    moduleId: 'exports-sharing',
    title: 'Exports & Sharing',
    subtitle: 'Manage export jobs, scheduled deliveries, and share links without breaking the service-driven ERP workflow.',
    badge: 'Distribution Controls',
    defaultSectionId: getExportsSharingWorkspaceDefaultSection(roleId),
    metrics: [
      { id: 'exports-jobs', label: 'Jobs', value: String(scopedJobs.length), detail: 'Visible export jobs', tone: 'neutral' },
      { id: 'exports-schedules', label: 'Schedules', value: String(exportScheduleStore.length), detail: 'Recurring delivery plans', tone: 'accent' },
      { id: 'exports-links', label: 'Share Links', value: String(shareLinkStore.length), detail: 'Active and expired links', tone: 'positive' },
      { id: 'exports-failures', label: 'Delivery Failures', value: String(deliveryTargetStore.filter(target => target.status === 'error').length), detail: 'Targets needing remediation', tone: deliveryTargetStore.some(target => target.status === 'error') ? 'critical' : 'positive' },
    ],
    actions: [
      { id: 'queue-export-job', label: 'Queue Export', icon: 'plus', tone: 'accent' },
      { id: 'create-share-link', label: 'Create Share Link', icon: 'plus' },
    ],
    sections: [
      {
        id: 'recent-jobs',
        title: 'Recent Jobs',
        description: 'Current export workload and distribution timing.',
        rows: scopedJobs.slice(0, 4).map(job =>
          buildOverviewRow(job.id, job.name, {
            value: `${job.recordCount} rows`,
            href: '/exports-sharing',
            status: job.status,
            statusTone: getStatusTone(job.status),
            meta: [formatDateTimeLabel(job.createdAt)],
          })
        ),
      },
      {
        id: 'share-links',
        title: 'Share Link Activity',
        description: 'Links currently active or recently expired.',
        rows: shareLinkStore.slice(0, 4).map(link =>
          buildOverviewRow(link.id, link.name, {
            value: link.recipientSummary,
            href: '/exports-sharing',
            status: link.status,
            statusTone: getStatusTone(link.status === 'expired' ? 'failed' : link.status),
            meta: [formatDateLabel(link.expiresAt)],
          })
        ),
      },
    ],
  }
}

export async function getExportsSharingWorkspaceList(
  sectionId: ExportsSharingSectionId,
  filters: FinanceFilters,
  query: PlatformWorkspaceQuery
): Promise<PlatformWorkspaceListResponse> {
  await ensureExportsSharingState()
  await delay()

  switch (sectionId) {
    case 'export_jobs': {
      const rows = exportJobStore
        .filter(job => matchesScopedFilters({ entityId: job.entityId }, filters, query, job.createdAt))
        .filter(job => matchesQueryFilter(query, 'status', job.status))
        .filter(job => matchesQueryFilter(query, 'type', job.format))
        .filter(job => matchesSearch([job.name, job.module, job.requestedBy], query.search))
        .map(buildExportJobRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'jobs-visible', label: 'Visible Jobs', value: String(rows.length), detail: 'Distribution workload', tone: 'neutral' },
          { id: 'jobs-processing', label: 'Processing', value: String(rows.filter(row => row.status === 'processing').length), detail: 'Currently running', tone: 'warning' },
          { id: 'jobs-failed', label: 'Failed', value: String(rows.filter(row => row.status === 'failed').length), detail: 'Needs rerun', tone: rows.some(row => row.status === 'failed') ? 'critical' : 'neutral' },
          { id: 'jobs-completed', label: 'Completed', value: String(rows.filter(row => row.status === 'completed').length), detail: 'Delivered successfully', tone: 'positive' },
        ],
        actions: [{ id: 'queue-export-job', label: 'Queue Export', icon: 'plus', tone: 'accent' }],
        bulkActions: [{ id: 'rerun-export-job', label: 'Rerun', icon: 'refresh-cw' }],
        filters: [
          buildFilterDefinition('status', 'Statuses', [
            { value: 'completed', label: 'Completed' },
            { value: 'processing', label: 'Processing' },
            { value: 'failed', label: 'Failed' },
            { value: 'scheduled', label: 'Scheduled' },
          ]),
          buildFilterDefinition('type', 'Formats', [
            { value: 'csv', label: 'CSV' },
            { value: 'xlsx', label: 'XLSX' },
            { value: 'pdf', label: 'PDF' },
          ]),
        ],
        columns: [
          buildColumn('title', 'Export Job', 'title', 'left', 'min-w-[340px]'),
          buildColumn('type', 'Format', 'typeLabel'),
          buildColumn('entity', 'Entity', 'entityName'),
          buildColumn('status', 'Status', 'status'),
          buildColumn('owner', 'Requested By', 'ownerLabel'),
          buildColumn('primaryMetric', 'Rows', 'primaryMetricValue', 'right'),
          buildColumn('primaryDate', 'Requested', 'primaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'type', 'status', 'owner', 'primaryMetric', 'primaryDate'],
        emptyMessage: 'No export jobs match the current distribution filters.',
      }
    }
    case 'schedules': {
      const rows = exportScheduleStore
        .filter(schedule => matchesScopedFilters({ entityId: schedule.entityId }, filters, query, schedule.nextRunAt))
        .filter(schedule => matchesQueryFilter(query, 'status', schedule.status))
        .filter(schedule => matchesQueryFilter(query, 'type', schedule.frequency))
        .filter(schedule => matchesSearch([schedule.name, schedule.module, schedule.format], query.search))
        .map(buildExportScheduleRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'asc' })

      return {
        ...final,
        metrics: [
          { id: 'sched-visible', label: 'Visible Schedules', value: String(rows.length), detail: 'Recurring deliveries', tone: 'neutral' },
          { id: 'sched-active', label: 'Active', value: String(rows.filter(row => row.status === 'active').length), detail: 'Scheduled deliveries in flight', tone: 'positive' },
          { id: 'sched-paused', label: 'Paused', value: String(rows.filter(row => row.status === 'paused').length), detail: 'Disabled schedules', tone: 'warning' },
          { id: 'sched-next', label: 'Next Run', value: rows[0]?.primaryDateDisplay ?? 'None', detail: 'Closest scheduled delivery', tone: 'accent' },
        ],
        actions: [{ id: 'create-export-schedule', label: 'Create Schedule', icon: 'plus', tone: 'accent' }],
        bulkActions: [{ id: 'pause-export-schedule', label: 'Pause', icon: 'pause' }],
        filters: [
          buildFilterDefinition('status', 'Statuses', [
            { value: 'active', label: 'Active' },
            { value: 'paused', label: 'Paused' },
          ]),
          buildFilterDefinition('type', 'Frequencies', [
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]),
        ],
        columns: [
          buildColumn('title', 'Schedule', 'title', 'left', 'min-w-[320px]'),
          buildColumn('type', 'Frequency', 'typeLabel'),
          buildColumn('entity', 'Entity', 'entityName'),
          buildColumn('status', 'Status', 'status'),
          buildColumn('primaryDate', 'Next Run', 'primaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'type', 'status', 'primaryDate'],
        emptyMessage: 'No schedules match the current filters.',
      }
    }
    case 'share_links': {
      const rows = shareLinkStore
        .filter(link => matchesQueryFilter(query, 'status', link.status))
        .filter(link => matchesSearch([link.name, link.module, link.createdBy, link.url], query.search))
        .map(buildShareLinkRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'links-visible', label: 'Visible Links', value: String(rows.length), detail: 'Shareable finance outputs', tone: 'neutral' },
          { id: 'links-active', label: 'Active', value: String(rows.filter(row => row.status === 'active').length), detail: 'Currently accessible', tone: 'positive' },
          { id: 'links-expired', label: 'Expired', value: String(rows.filter(row => row.status === 'expired').length), detail: 'No longer accessible', tone: 'warning' },
          { id: 'links-recipients', label: 'Recipients', value: String(shareLinkStore.length), detail: 'Visible link population', tone: 'accent' },
        ],
        actions: [{ id: 'create-share-link', label: 'Create Share Link', icon: 'plus', tone: 'accent' }],
        bulkActions: [{ id: 'revoke-share-link', label: 'Revoke', icon: 'ban' }],
        filters: [
          buildFilterDefinition('status', 'Statuses', [
            { value: 'active', label: 'Active' },
            { value: 'expired', label: 'Expired' },
            { value: 'revoked', label: 'Revoked' },
          ]),
        ],
        columns: [
          buildColumn('title', 'Share Link', 'title', 'left', 'min-w-[340px]'),
          buildColumn('status', 'Status', 'status'),
          buildColumn('owner', 'Created By', 'ownerLabel'),
          buildColumn('primaryMetric', 'Recipients', 'primaryMetricValue', 'right'),
          buildColumn('primaryDate', 'Created', 'primaryDateValue'),
          buildColumn('secondaryDate', 'Expires', 'secondaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'status', 'owner', 'primaryDate', 'secondaryDate'],
        emptyMessage: 'No share links match the current filters.',
      }
    }
    case 'delivery_failures': {
      const rows = deliveryTargetStore
        .filter(target => target.status === 'error')
        .filter(target => matchesQueryFilter(query, 'type', target.type))
        .filter(target => matchesSearch([target.label, target.destination, target.type], query.search))
        .map(buildDeliveryFailureRow)

      const final = finalizePlatformRows(rows, query, { key: 'title', direction: 'asc' })

      return {
        ...final,
        metrics: [
          { id: 'fail-visible', label: 'Visible Failures', value: String(rows.length), detail: 'Delivery targets in error', tone: rows.length ? 'critical' : 'positive' },
          { id: 'fail-api', label: 'API Targets', value: String(rows.filter(row => row.typeLabel === 'api').length), detail: 'Programmatic delivery issues', tone: 'warning' },
          { id: 'fail-email', label: 'Email Targets', value: String(rows.filter(row => row.typeLabel === 'email').length), detail: 'Mail delivery issues', tone: 'neutral' },
          { id: 'fail-share', label: 'Share Targets', value: String(rows.filter(row => row.typeLabel === 'share_link').length), detail: 'Link delivery issues', tone: 'neutral' },
        ],
        actions: [{ id: 'repair-delivery-target', label: 'Repair Target', icon: 'refresh-cw', tone: 'accent' }],
        bulkActions: [{ id: 'repair-delivery-target', label: 'Repair Target', icon: 'refresh-cw' }],
        filters: [
          buildFilterDefinition('type', 'Target Types', [
            { value: 'email', label: 'Email' },
            { value: 's3', label: 'S3' },
            { value: 'share_link', label: 'Share Link' },
            { value: 'api', label: 'API' },
          ]),
        ],
        columns: [
          buildColumn('title', 'Delivery Target', 'title', 'left', 'min-w-[360px]'),
          buildColumn('type', 'Type', 'typeLabel'),
          buildColumn('status', 'Status', 'status'),
        ],
        defaultVisibleColumnIds: ['title', 'type', 'status'],
        emptyMessage: 'No delivery failures match the current filters.',
      }
    }
  }
}

export async function getExportsSharingWorkspaceDetail(
  sectionId: ExportsSharingSectionId,
  id: string
): Promise<WorkspaceDetailData | null> {
  await ensureExportsSharingState()
  switch (sectionId) {
    case 'export_jobs': {
      const job = exportJobStore.find(item => item.id === id)
      if (!job) {
        return null
      }

      return {
        id: job.id,
        title: job.name,
        subtitle: `${job.module} · ${job.format}`,
        badges: [{ id: 'status', label: job.status, tone: getStatusTone(job.status) }],
        summary: [
          buildDetailField('requested', 'Requested', formatDateTimeLabel(job.createdAt)),
          buildDetailField('delivered', 'Delivered', formatDateTimeLabel(job.deliveredAt)),
          buildDetailField('requested-by', 'Requested By', job.requestedBy),
          buildDetailField('records', 'Records', `${job.recordCount}`),
        ],
        sections: [],
        actions: [{ id: 'rerun-export-job', label: 'Rerun Job', icon: 'refresh-cw' }],
      }
    }
    case 'schedules': {
      const schedule = exportScheduleStore.find(item => item.id === id)
      if (!schedule) {
        return null
      }

      return {
        id: schedule.id,
        title: schedule.name,
        subtitle: `${schedule.module} · ${schedule.frequency}`,
        badges: [{ id: 'status', label: schedule.status, tone: getStatusTone(schedule.status) }],
        summary: [
          buildDetailField('format', 'Format', schedule.format),
          buildDetailField('next-run', 'Next Run', formatDateTimeLabel(schedule.nextRunAt)),
          buildDetailField('target', 'Delivery Target', deliveryTargetStore.find(target => target.id === schedule.targetId)?.label ?? schedule.targetId),
        ],
        sections: [],
        actions: [{ id: 'pause-export-schedule', label: 'Pause Schedule', icon: 'pause' }],
      }
    }
    case 'share_links': {
      const link = shareLinkStore.find(item => item.id === id)
      if (!link) {
        return null
      }

      return {
        id: link.id,
        title: link.name,
        subtitle: link.url,
        badges: [{ id: 'status', label: link.status, tone: getStatusTone(link.status === 'expired' ? 'failed' : link.status) }],
        summary: [
          buildDetailField('created-by', 'Created By', link.createdBy),
          buildDetailField('created', 'Created', formatDateTimeLabel(link.createdAt)),
          buildDetailField('expires', 'Expires', formatDateLabel(link.expiresAt)),
          buildDetailField('recipients', 'Recipients', link.recipientSummary),
        ],
        sections: [],
        actions: [{ id: 'revoke-share-link', label: 'Revoke Link', icon: 'ban' }],
      }
    }
    case 'delivery_failures': {
      const target = deliveryTargetStore.find(item => item.id === id)
      if (!target) {
        return null
      }

      return {
        id: target.id,
        title: target.label,
        subtitle: target.destination,
        badges: [{ id: 'status', label: target.status === 'error' ? 'failed' : target.status, tone: getStatusTone(target.status === 'error' ? 'failed' : target.status) }],
        summary: [
          buildDetailField('type', 'Target Type', target.type),
          buildDetailField('destination', 'Destination', target.destination),
        ],
        sections: [],
        actions: [{ id: 'repair-delivery-target', label: 'Repair Target', icon: 'refresh-cw' }],
      }
    }
  }
}

export async function applyExportsSharingWorkspaceAction(
  sectionId: ExportsSharingSectionId,
  actionId: string,
  recordIds: string[]
): Promise<{ success: boolean; message?: string }> {
  await ensureExportsSharingState()
  if (actionId === 'queue-export-job') {
    exportJobStore.unshift({
      id: `job-${Date.now()}`,
      name: 'Generated Export Job',
      module: 'reports',
      format: 'xlsx',
      status: 'processing',
      requestedBy: 'Current User',
      createdAt: new Date(),
      recordCount: 42,
    })
    return { success: true, message: 'Export job queued.' }
  }

  if (actionId === 'rerun-export-job') {
    exportJobStore.forEach(job => {
      if (recordIds.includes(job.id)) {
        job.status = 'processing'
        job.createdAt = new Date()
      }
    })
    return { success: true, message: 'Export rerun started.' }
  }

  if (actionId === 'create-export-schedule') {
    exportScheduleStore.unshift({
      id: `schedule-${Date.now()}`,
      name: 'Generated Schedule',
      module: 'reports',
      frequency: 'weekly',
      status: 'active',
      format: 'xlsx',
      nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      targetId: deliveryTargetStore[0]?.id ?? 'target-1',
    })
    return { success: true, message: 'Schedule created.' }
  }

  if (actionId === 'pause-export-schedule') {
    exportScheduleStore.forEach(schedule => {
      if (recordIds.includes(schedule.id)) {
        schedule.status = 'paused'
      }
    })
    return { success: true, message: 'Schedule paused.' }
  }

  if (actionId === 'create-share-link') {
    shareLinkStore.unshift({
      id: `share-${Date.now()}`,
      name: 'Generated Share Link',
      module: 'reports',
      status: 'active',
      url: `https://share.northstar.example/generated/${Date.now()}`,
      createdBy: 'Current User',
      createdAt: new Date(),
      recipientSummary: '1 recipient',
    })
    return { success: true, message: 'Share link created.' }
  }

  if (actionId === 'revoke-share-link') {
    shareLinkStore.forEach(link => {
      if (recordIds.includes(link.id)) {
        link.status = 'revoked'
      }
    })
    return { success: true, message: 'Share link revoked.' }
  }

  if (actionId === 'repair-delivery-target') {
    deliveryTargetStore.forEach(target => {
      if (recordIds.includes(target.id)) {
        target.status = 'active'
      }
    })
    return { success: true, message: 'Delivery target repaired.' }
  }

  return { success: false, message: `No handler for ${sectionId} action ${actionId}.` }
}
