import { entities } from '@/lib/mock-data/organization'
import type {
  FinanceFilters,
  PlatformOverviewData,
  PlatformWorkspaceListResponse,
  PlatformWorkspaceQuery,
  PlatformWorkspaceRecord,
  RoleId,
  RuleDefinition,
  RuleDeployment,
  RuleEngineSectionId,
  RuleSimulationResult,
  WorkspaceDetailData,
  WorkspaceTabItem,
} from '@/lib/types'
import { eventMonitoringRecordStore, ruleDefinitionStore, ruleDeploymentStore, ruleSimulationStore } from './platform-store'
import { buildColumn, buildFilterDefinition, finalizePlatformRows, matchesQueryFilter, matchesScopedFilters, matchesSearch } from './platform-workspace-support'
import { delay } from './base'
import { buildDetailField, buildOverviewRow, formatDateLabel, formatDateTimeLabel, getStatusTone } from './workspace-support'

const entityMap = new Map(entities.map(entity => [entity.id, entity]))

function buildRuleRow(rule: RuleDefinition): PlatformWorkspaceRecord {
  return {
    id: rule.id,
    title: rule.name,
    subtitle: `${rule.trigger} · ${rule.conditionSummary}`,
    status: rule.status,
    statusTone: getStatusTone(rule.status),
    typeLabel: rule.category,
    entityName: rule.entityId ? entityMap.get(rule.entityId)?.name ?? rule.entityId : 'Shared',
    ownerLabel: rule.ownerName,
    primaryMetricLabel: 'Matches',
    primaryMetricValue: rule.matchCount,
    primaryMetricDisplay: `${rule.matchCount}`,
    primaryDateValue: rule.updatedAt,
    primaryDateDisplay: formatDateTimeLabel(rule.updatedAt),
  }
}

function buildSimulationRow(simulation: RuleSimulationResult): PlatformWorkspaceRecord {
  return {
    id: simulation.id,
    title: simulation.ruleName,
    subtitle: simulation.outcome,
    status: simulation.status,
    statusTone: getStatusTone(simulation.status === 'passed' ? 'active' : simulation.status === 'warning' ? 'review' : 'failed'),
    typeLabel: simulation.sampleRecord,
    entityName: simulation.entityId ? entityMap.get(simulation.entityId)?.name ?? simulation.entityId : 'Shared',
    primaryDateValue: simulation.createdAt,
    primaryDateDisplay: formatDateTimeLabel(simulation.createdAt),
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

function buildDeploymentRow(deployment: RuleDeployment): PlatformWorkspaceRecord {
  return {
    id: deployment.id,
    title: deployment.ruleName,
    subtitle: `${deployment.environment} · ${deployment.version}`,
    status: deployment.status,
    statusTone: getStatusTone(deployment.status === 'rolled_back' ? 'reversed' : deployment.status),
    typeLabel: deployment.environment,
    ownerLabel: deployment.deployedBy,
    primaryDateValue: deployment.deployedAt,
    primaryDateDisplay: formatDateTimeLabel(deployment.deployedAt),
  }
}

export function getRuleEngineWorkspaceDefaultSection(roleId?: RoleId): RuleEngineSectionId {
  return roleId === 'controller' ? 'exceptions' : 'rules'
}

export async function getRuleEngineWorkspaceTabs(
  filters: FinanceFilters,
  _roleId?: RoleId
): Promise<WorkspaceTabItem[]> {
  const scopedExceptions = eventMonitoringRecordStore.filter(event =>
    event.sourceType === 'rule' &&
    (!filters.entityId || filters.entityId === 'e4' || event.entityId === filters.entityId)
  )

  return [
    { id: 'rules', label: 'Rules', count: ruleDefinitionStore.length },
    { id: 'simulations', label: 'Simulations', count: ruleSimulationStore.length },
    { id: 'exceptions', label: 'Exceptions', count: scopedExceptions.length },
    { id: 'deployments', label: 'Deployments', count: ruleDeploymentStore.length },
  ]
}

export async function getRuleEngineWorkspaceOverview(
  filters: FinanceFilters,
  roleId?: RoleId
): Promise<PlatformOverviewData> {
  const scopedExceptions = eventMonitoringRecordStore.filter(event =>
    event.sourceType === 'rule' &&
    (!filters.entityId || filters.entityId === 'e4' || event.entityId === filters.entityId)
  )

  return {
    moduleId: 'rule-engine',
    title: 'Rule Engine',
    subtitle: 'Manage posting, routing, approval, and exception rules with traceable simulations and deployments.',
    badge: 'Policy Automation',
    defaultSectionId: getRuleEngineWorkspaceDefaultSection(roleId),
    metrics: [
      { id: 'rules-total', label: 'Rules', value: String(ruleDefinitionStore.length), detail: 'Active, paused, and draft logic', tone: 'neutral' },
      { id: 'rules-active', label: 'Active', value: String(ruleDefinitionStore.filter(rule => rule.status === 'active').length), detail: 'Currently matching transactions', tone: 'positive' },
      { id: 'rules-sims', label: 'Recent Simulations', value: String(ruleSimulationStore.length), detail: 'Validation history', tone: 'accent' },
      { id: 'rules-exceptions', label: 'Open Exceptions', value: String(scopedExceptions.length), detail: 'Rule-driven issues needing review', tone: scopedExceptions.length ? 'critical' : 'positive' },
    ],
    actions: [
      { id: 'new-rule', label: 'Create Rule', icon: 'plus', tone: 'accent' },
      { id: 'run-simulation', label: 'Run Simulation', icon: 'play' },
    ],
    sections: [
      {
        id: 'rule-alerts',
        title: 'Rule Exceptions',
        description: 'Recent rule outcomes needing policy review.',
        rows: scopedExceptions.slice(0, 4).map(event =>
          buildOverviewRow(event.id, event.sourceLabel, {
            value: event.severity,
            href: '/rule-engine',
            status: event.status,
            statusTone: getStatusTone(event.status === 'new' ? 'failed' : event.status),
            meta: [formatDateTimeLabel(event.occurredAt)],
          })
        ),
      },
      {
        id: 'deployments',
        title: 'Recent Deployments',
        description: 'Latest production and sandbox rule changes.',
        rows: ruleDeploymentStore.slice(0, 4).map(deployment =>
          buildOverviewRow(deployment.id, deployment.ruleName, {
            value: deployment.version,
            href: '/rule-engine',
            status: deployment.status,
            statusTone: getStatusTone(deployment.status === 'rolled_back' ? 'reversed' : deployment.status),
            meta: [formatDateTimeLabel(deployment.deployedAt)],
          })
        ),
      },
    ],
  }
}

export async function getRuleEngineWorkspaceList(
  sectionId: RuleEngineSectionId,
  filters: FinanceFilters,
  query: PlatformWorkspaceQuery
): Promise<PlatformWorkspaceListResponse> {
  await delay()

  switch (sectionId) {
    case 'rules': {
      const rows = ruleDefinitionStore
        .filter(rule => matchesScopedFilters({ entityId: rule.entityId }, filters, query, rule.updatedAt))
        .filter(rule => matchesQueryFilter(query, 'status', rule.status))
        .filter(rule => matchesQueryFilter(query, 'type', rule.category))
        .filter(rule => matchesSearch([rule.name, rule.trigger, rule.conditionSummary, rule.actionSummary], query.search))
        .map(buildRuleRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'rules-visible', label: 'Visible Rules', value: String(rows.length), detail: 'Policy logic in scope', tone: 'neutral' },
          { id: 'rules-active', label: 'Active', value: String(rows.filter(row => row.status === 'active').length), detail: 'Currently matching', tone: 'positive' },
          { id: 'rules-paused', label: 'Paused', value: String(rows.filter(row => row.status === 'paused').length), detail: 'Temporarily disabled', tone: 'warning' },
          { id: 'rules-matches', label: 'Match Volume', value: String(ruleDefinitionStore.reduce((sum, rule) => sum + rule.matchCount, 0)), detail: 'Across rule library', tone: 'accent' },
        ],
        actions: [
          { id: 'new-rule', label: 'Create Rule', icon: 'plus', tone: 'accent' },
        ],
        bulkActions: [
          { id: 'activate-rule', label: 'Activate', icon: 'play' },
          { id: 'pause-rule', label: 'Pause', icon: 'pause' },
        ],
        filters: [
          buildFilterDefinition('status', 'Statuses', [
            { value: 'active', label: 'Active' },
            { value: 'draft', label: 'Draft' },
            { value: 'paused', label: 'Paused' },
          ]),
          buildFilterDefinition('type', 'Categories', [
            { value: 'posting', label: 'Posting' },
            { value: 'approval', label: 'Approval' },
            { value: 'routing', label: 'Routing' },
            { value: 'exception', label: 'Exception' },
            { value: 'export', label: 'Export' },
          ]),
        ],
        columns: [
          buildColumn('title', 'Rule', 'title', 'left', 'min-w-[340px]'),
          buildColumn('type', 'Category', 'typeLabel'),
          buildColumn('entity', 'Entity', 'entityName'),
          buildColumn('status', 'Status', 'status'),
          buildColumn('owner', 'Owner', 'ownerLabel'),
          buildColumn('primaryMetric', 'Matches', 'primaryMetricValue', 'right'),
          buildColumn('primaryDate', 'Updated', 'primaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'type', 'status', 'owner', 'primaryMetric', 'primaryDate'],
        emptyMessage: 'No rules match the current governance filters.',
      }
    }
    case 'simulations': {
      const rows = ruleSimulationStore
        .filter(simulation => matchesScopedFilters({ entityId: simulation.entityId }, filters, query, simulation.createdAt))
        .filter(simulation => matchesQueryFilter(query, 'status', simulation.status))
        .filter(simulation => matchesSearch([simulation.ruleName, simulation.sampleRecord, simulation.outcome], query.search))
        .map(buildSimulationRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'sim-visible', label: 'Visible Simulations', value: String(rows.length), detail: 'Recent rule test runs', tone: 'neutral' },
          { id: 'sim-failed', label: 'Failed', value: String(rows.filter(row => row.status === 'failed').length), detail: 'Need rule updates', tone: rows.some(row => row.status === 'failed') ? 'critical' : 'neutral' },
          { id: 'sim-warning', label: 'Warnings', value: String(rows.filter(row => row.status === 'warning').length), detail: 'Review recommended', tone: 'warning' },
          { id: 'sim-passed', label: 'Passed', value: String(rows.filter(row => row.status === 'passed').length), detail: 'Expected outcomes', tone: 'positive' },
        ],
        actions: [{ id: 'run-simulation', label: 'Run Simulation', icon: 'play', tone: 'accent' }],
        filters: [
          buildFilterDefinition('status', 'Statuses', [
            { value: 'passed', label: 'Passed' },
            { value: 'warning', label: 'Warning' },
            { value: 'failed', label: 'Failed' },
          ]),
        ],
        columns: [
          buildColumn('title', 'Simulation', 'title', 'left', 'min-w-[340px]'),
          buildColumn('type', 'Sample', 'typeLabel'),
          buildColumn('entity', 'Entity', 'entityName'),
          buildColumn('status', 'Outcome', 'status'),
          buildColumn('primaryDate', 'Run At', 'primaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'type', 'status', 'primaryDate'],
        emptyMessage: 'No simulations match the current validation filters.',
      }
    }
    case 'exceptions': {
      const rows = eventMonitoringRecordStore
        .filter(event => event.sourceType === 'rule')
        .filter(event => matchesScopedFilters({ entityId: event.entityId }, filters, query, event.occurredAt))
        .filter(event => matchesQueryFilter(query, 'status', event.status))
        .filter(event => matchesSearch([event.sourceLabel, event.message, event.resolutionHint], query.search))
        .map(buildExceptionRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'exc-visible', label: 'Visible Exceptions', value: String(rows.length), detail: 'Rule-driven alerts', tone: 'neutral' },
          { id: 'exc-new', label: 'New', value: String(rows.filter(row => row.status === 'new').length), detail: 'Needs acknowledgement', tone: rows.some(row => row.status === 'new') ? 'critical' : 'neutral' },
          { id: 'exc-ack', label: 'Acknowledged', value: String(rows.filter(row => row.status === 'acknowledged').length), detail: 'Awaiting resolution', tone: 'warning' },
          { id: 'exc-resolved', label: 'Resolved', value: String(rows.filter(row => row.status === 'resolved').length), detail: 'Closed events', tone: 'positive' },
        ],
        actions: [{ id: 'acknowledge-rule-event', label: 'Acknowledge', icon: 'check-circle-2', tone: 'accent' }],
        bulkActions: [{ id: 'acknowledge-rule-event', label: 'Acknowledge', icon: 'check-circle-2' }],
        filters: [
          buildFilterDefinition('status', 'Statuses', [
            { value: 'new', label: 'New' },
            { value: 'acknowledged', label: 'Acknowledged' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'retrying', label: 'Retrying' },
          ]),
        ],
        columns: [
          buildColumn('title', 'Exception', 'title', 'left', 'min-w-[360px]'),
          buildColumn('entity', 'Entity', 'entityName'),
          buildColumn('status', 'Status', 'status'),
          buildColumn('primaryDate', 'Occurred', 'primaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'status', 'primaryDate'],
        emptyMessage: 'No rule exceptions match the current filters.',
      }
    }
    case 'deployments': {
      const rows = ruleDeploymentStore
        .filter(deployment => matchesQueryFilter(query, 'status', deployment.status))
        .filter(deployment => matchesQueryFilter(query, 'type', deployment.environment))
        .filter(deployment => matchesSearch([deployment.ruleName, deployment.version, deployment.deployedBy], query.search))
        .map(buildDeploymentRow)

      const final = finalizePlatformRows(rows, query, { key: 'primaryDateValue', direction: 'desc' })

      return {
        ...final,
        metrics: [
          { id: 'dep-visible', label: 'Visible Deployments', value: String(rows.length), detail: 'Rule release history', tone: 'neutral' },
          { id: 'dep-active', label: 'Active', value: String(rows.filter(row => row.status === 'active').length), detail: 'Live rule versions', tone: 'positive' },
          { id: 'dep-pending', label: 'Pending', value: String(rows.filter(row => row.status === 'pending').length), detail: 'Awaiting release', tone: 'warning' },
          { id: 'dep-rollback', label: 'Rolled Back', value: String(rows.filter(row => row.status === 'rolled_back').length), detail: 'Recent reversions', tone: rows.some(row => row.status === 'rolled_back') ? 'critical' : 'neutral' },
        ],
        actions: [],
        filters: [
          buildFilterDefinition('status', 'Statuses', [
            { value: 'active', label: 'Active' },
            { value: 'pending', label: 'Pending' },
            { value: 'rolled_back', label: 'Rolled Back' },
          ]),
          buildFilterDefinition('type', 'Environments', [
            { value: 'production', label: 'Production' },
            { value: 'sandbox', label: 'Sandbox' },
          ]),
        ],
        columns: [
          buildColumn('title', 'Deployment', 'title', 'left', 'min-w-[320px]'),
          buildColumn('type', 'Environment', 'typeLabel'),
          buildColumn('status', 'Status', 'status'),
          buildColumn('owner', 'Deployed By', 'ownerLabel'),
          buildColumn('primaryDate', 'Deployed At', 'primaryDateValue'),
        ],
        defaultVisibleColumnIds: ['title', 'type', 'status', 'owner', 'primaryDate'],
        emptyMessage: 'No rule deployments match the current filters.',
      }
    }
  }
}

export async function getRuleEngineWorkspaceDetail(
  sectionId: RuleEngineSectionId,
  id: string
): Promise<WorkspaceDetailData | null> {
  switch (sectionId) {
    case 'rules': {
      const rule = ruleDefinitionStore.find(item => item.id === id)
      if (!rule) {
        return null
      }

      return {
        id: rule.id,
        title: rule.name,
        subtitle: `${rule.trigger} · ${rule.category}`,
        badges: [{ id: 'status', label: rule.status, tone: getStatusTone(rule.status) }],
        summary: [
          buildDetailField('condition', 'Condition', rule.conditionSummary),
          buildDetailField('action', 'Action', rule.actionSummary),
          buildDetailField('priority', 'Priority', `${rule.priority}`),
          buildDetailField('updated', 'Updated', formatDateTimeLabel(rule.updatedAt)),
        ],
        sections: [],
        actions: [
          { id: rule.status === 'active' ? 'pause-rule' : 'activate-rule', label: rule.status === 'active' ? 'Pause Rule' : 'Activate Rule', icon: rule.status === 'active' ? 'pause' : 'play' },
        ],
      }
    }
    case 'simulations': {
      const simulation = ruleSimulationStore.find(item => item.id === id)
      if (!simulation) {
        return null
      }

      return {
        id: simulation.id,
        title: simulation.ruleName,
        subtitle: simulation.outcome,
        badges: [{ id: 'status', label: simulation.status, tone: getStatusTone(simulation.status === 'passed' ? 'active' : simulation.status === 'warning' ? 'review' : 'failed') }],
        summary: [
          buildDetailField('sample', 'Sample Record', simulation.sampleRecord),
          buildDetailField('occurred', 'Executed', formatDateTimeLabel(simulation.createdAt)),
        ],
        sections: [],
        actions: [{ id: 'run-simulation', label: 'Run Again', icon: 'play' }],
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
          buildDetailField('severity', 'Severity', event.severity),
          buildDetailField('occurred', 'Occurred', formatDateTimeLabel(event.occurredAt)),
          buildDetailField('entity', 'Entity', event.entityId ? entityMap.get(event.entityId)?.name ?? event.entityId : 'Shared'),
        ],
        sections: event.resolutionHint
          ? [{
              id: 'hint',
              title: 'Resolution Hint',
              fields: [buildDetailField('hint', 'Suggested Fix', event.resolutionHint)],
            }]
          : [],
        actions: [{ id: 'acknowledge-rule-event', label: 'Acknowledge', icon: 'check-circle-2' }],
      }
    }
    case 'deployments': {
      const deployment = ruleDeploymentStore.find(item => item.id === id)
      if (!deployment) {
        return null
      }

      return {
        id: deployment.id,
        title: deployment.ruleName,
        subtitle: `${deployment.environment} · ${deployment.version}`,
        badges: [{ id: 'status', label: deployment.status, tone: getStatusTone(deployment.status === 'rolled_back' ? 'reversed' : deployment.status) }],
        summary: [
          buildDetailField('deployed-by', 'Deployed By', deployment.deployedBy),
          buildDetailField('deployed-at', 'Deployed At', formatDateTimeLabel(deployment.deployedAt)),
          buildDetailField('environment', 'Environment', deployment.environment),
        ],
        sections: [],
        actions: [],
      }
    }
  }
}

export async function applyRuleEngineWorkspaceAction(
  sectionId: RuleEngineSectionId,
  actionId: string,
  recordIds: string[]
): Promise<{ success: boolean; message?: string }> {
  if (actionId === 'new-rule') {
    ruleDefinitionStore.unshift({
      id: `rule-${Date.now()}`,
      name: 'Generated Rule',
      category: 'exception',
      status: 'draft',
      trigger: 'transaction.created',
      conditionSummary: 'Generated demo condition',
      actionSummary: 'Generated demo action',
      priority: 5,
      ownerName: 'Platform Team',
      updatedAt: new Date(),
      matchCount: 0,
    })
    return { success: true, message: 'Draft rule created.' }
  }

  if (actionId === 'activate-rule' || actionId === 'pause-rule') {
    ruleDefinitionStore.forEach(rule => {
      if (recordIds.includes(rule.id)) {
        rule.status = actionId === 'activate-rule' ? 'active' : 'paused'
        rule.updatedAt = new Date()
      }
    })
    return { success: true, message: 'Rule status updated.' }
  }

  if (actionId === 'run-simulation') {
    ruleSimulationStore.unshift({
      id: `sim-${Date.now()}`,
      ruleId: recordIds[0] ?? 'rule-1',
      ruleName: ruleDefinitionStore.find(rule => rule.id === recordIds[0])?.name ?? 'Generated Rule',
      status: 'passed',
      sampleRecord: 'SIM-GENERATED',
      outcome: 'Simulation completed with expected result.',
      createdAt: new Date(),
    })
    return { success: true, message: 'Simulation queued.' }
  }

  if (actionId === 'acknowledge-rule-event') {
    eventMonitoringRecordStore.forEach(event => {
      if (recordIds.includes(event.id)) {
        event.status = 'acknowledged'
      }
    })
    return { success: true, message: 'Rule exception acknowledged.' }
  }

  return { success: false, message: `No handler for ${sectionId} action ${actionId}.` }
}
