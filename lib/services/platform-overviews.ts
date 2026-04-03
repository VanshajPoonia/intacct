import type {
  AIInsight,
  DashboardMetric,
  FinanceFilters,
  ModuleOverviewData,
  RoleId,
  Workflow,
} from '@/lib/types'
import { getCloseStatus, getCloseTasks } from './close'
import { getDashboardMetrics, getBudgetVsActual, getConsolidatedFinancials, getPnL } from './reporting'
import { getApprovalItems, getAIInsights, getWorkflows } from './legacy'
import { getWorkQueueSummary } from './work-queue'
import { buildOverviewRow, formatDateLabel, formatMoney, getStatusTone } from './workspace-support'

function formatDashboardMetric(metric: DashboardMetric) {
  if (metric.format === 'currency') {
    return formatMoney(metric.value, metric.currency)
  }

  if (metric.format === 'percentage') {
    return `${metric.value.toFixed(1)}%`
  }

  return new Intl.NumberFormat('en-US').format(metric.value)
}

function buildDashboardTitle(roleId?: RoleId) {
  switch (roleId) {
    case 'accountant':
      return 'Accounting Dashboards'
    case 'cfo':
      return 'Executive Dashboards'
    case 'controller':
      return 'Control Dashboards'
    default:
      return 'Dashboards'
  }
}

function buildAIActionLabel(roleId?: RoleId) {
  return roleId === 'cfo' ? 'Open Insight Queue' : 'Review Insight Queue'
}

function sortInsightsBySeverity(insights: AIInsight[]) {
  const severityWeight: Record<AIInsight['severity'], number> = {
    critical: 3,
    warning: 2,
    info: 1,
  }

  return [...insights].sort((left, right) => {
    const severityDelta = severityWeight[right.severity] - severityWeight[left.severity]
    if (severityDelta !== 0) {
      return severityDelta
    }

    return right.createdAt.getTime() - left.createdAt.getTime()
  })
}

function sortWorkflowsForAttention(workflows: Workflow[]) {
  const statusWeight: Record<Workflow['status'], number> = {
    draft: 3,
    inactive: 2,
    active: 1,
  }

  return [...workflows].sort((left, right) => {
    const statusDelta = statusWeight[right.status] - statusWeight[left.status]
    if (statusDelta !== 0) {
      return statusDelta
    }

    return right.createdAt.getTime() - left.createdAt.getTime()
  })
}

export async function getDashboardsOverview(
  filters: FinanceFilters,
  roleId?: RoleId
): Promise<ModuleOverviewData> {
  const [metrics, pnl, budgetRows, consolidated, closeStatus, queueSummary] = await Promise.all([
    getDashboardMetrics(filters),
    getPnL(filters),
    getBudgetVsActual(filters),
    getConsolidatedFinancials(filters),
    getCloseStatus(filters),
    getWorkQueueSummary({ entityId: filters.entityId, dateRange: filters.dateRange }),
  ])

  const highestVarianceRows = [...budgetRows]
    .sort((left, right) => Math.abs(right.variancePercent) - Math.abs(left.variancePercent))
    .slice(0, 4)

  return {
    moduleId: 'dashboards',
    title: buildDashboardTitle(roleId),
    subtitle: 'Review liquidity, profitability, variance, and consolidation signals from one service-driven landing page.',
    badge: roleId === 'cfo' ? 'Executive View' : roleId === 'accountant' ? 'Accounting View' : 'Finance View',
    metrics: [
      { id: 'dash-revenue', label: metrics.totalRevenue.label, value: formatDashboardMetric(metrics.totalRevenue), detail: 'Current period revenue', tone: 'accent' },
      { id: 'dash-cash', label: metrics.cashBalance.label, value: formatDashboardMetric(metrics.cashBalance), detail: 'Cash and cash equivalents', tone: 'positive' },
      { id: 'dash-income', label: metrics.netIncome.label, value: formatDashboardMetric(metrics.netIncome), detail: 'Net income in scope', tone: pnl.netIncome >= 0 ? 'positive' : 'critical' },
      { id: 'dash-queue', label: 'Attention Queue', value: String(queueSummary.attentionCount), detail: `${closeStatus.blockedTasks} blocked close tasks`, tone: queueSummary.attentionCount ? 'warning' : 'positive' },
    ],
    actions: roleId === 'accountant'
      ? [
          { id: 'dash-open-queue', label: 'Open Work Queue', href: '/work-queue', icon: 'Inbox', tone: 'accent' },
          { id: 'dash-open-reports', label: 'Open Reports', href: '/reports', icon: 'LineChart' },
          { id: 'dash-open-exports', label: 'Exports & Sharing', href: '/exports-sharing', icon: 'Share2' },
        ]
      : [
          { id: 'dash-open-reports', label: 'Open Reports', href: '/reports', icon: 'LineChart', tone: 'accent' },
          { id: 'dash-open-budgets', label: 'Budgets & Forecasting', href: '/budgets-forecasting', icon: 'Calculator' },
          { id: 'dash-open-exports', label: 'Exports & Sharing', href: '/exports-sharing', icon: 'Share2' },
        ],
    sections: [
      {
        id: 'dash-financial-position',
        title: 'Financial Position',
        description: 'Quick links into the core statement surfaces driving the current dashboard view.',
        rows: [
          buildOverviewRow('dash-pnl', 'Profit & Loss', {
            value: formatMoney(pnl.netIncome),
            href: '/reports/income-statement',
            status: pnl.netIncome >= 0 ? 'healthy' : 'watch',
            statusTone: pnl.netIncome >= 0 ? 'positive' : 'warning',
            meta: ['Net income for current scope'],
          }),
          buildOverviewRow('dash-cash-flow', 'Cash Flow', {
            value: formatMoney(consolidated.cashFlow.netChangeInCash),
            href: '/reports/cash-flow',
            status: consolidated.cashFlow.netChangeInCash >= 0 ? 'positive' : 'negative',
            statusTone: consolidated.cashFlow.netChangeInCash >= 0 ? 'positive' : 'critical',
            meta: [`${consolidated.entitiesIncluded.length} entities in current view`],
          }),
          buildOverviewRow('dash-balance-sheet', 'Balance Sheet', {
            value: formatMoney(consolidated.balanceSheet.assets.total),
            href: '/reports/balance-sheet',
            status: 'available',
            statusTone: 'neutral',
            meta: ['Assets from the current consolidated scope'],
          }),
        ],
      },
      {
        id: 'dash-variance-watch',
        title: roleId === 'accountant' ? 'Variance Review' : 'Variance Highlights',
        description: 'The largest budget-to-actual variances across the current slice of the business.',
        rows: highestVarianceRows.map(row =>
          buildOverviewRow(`dash-var-${row.category}`, row.category, {
            value: formatMoney(row.variance),
            href: '/budgets-forecasting',
            status: `${row.variancePercent.toFixed(1)}%`,
            statusTone: Math.abs(row.variancePercent) >= 10 ? 'critical' : 'warning',
            meta: [`Budget ${formatMoney(row.budget)}`, `Actual ${formatMoney(row.actual)}`],
          })
        ),
      },
      {
        id: 'dash-close-watch',
        title: roleId === 'accountant' ? 'Close And Queue Watch' : 'Operating Watch',
        description: 'Close progress and accountant-facing workload still visible from the dashboard surface.',
        rows: [
          buildOverviewRow('dash-close-progress', closeStatus.currentPeriodLabel, {
            value: `${closeStatus.progressPercent}% complete`,
            href: '/work-queue',
            status: closeStatus.blockedTasks ? 'blocked' : 'in_progress',
            statusTone: closeStatus.blockedTasks ? 'critical' : 'warning',
            meta: [`${closeStatus.completedTasks}/${closeStatus.totalTasks} tasks complete`, `${queueSummary.attentionCount} queue items need attention`],
          }),
          buildOverviewRow('dash-close-next', closeStatus.nextDueTask?.name ?? 'No next due task', {
            value: closeStatus.nextDueTask?.dueDate ? formatDateLabel(closeStatus.nextDueTask.dueDate) : 'No due date',
            href: '/work-queue',
            status: closeStatus.nextDueTask?.status ?? 'clear',
            statusTone: getStatusTone(closeStatus.nextDueTask?.status),
            meta: closeStatus.nextDueTask ? [closeStatus.nextDueTask.phase.replace(/_/g, ' ')] : ['Current scope is clear'],
          }),
        ],
      },
    ],
  }
}

export async function getAIWorkspaceOverview(
  filters: FinanceFilters,
  roleId?: RoleId
): Promise<ModuleOverviewData> {
  const insights = sortInsightsBySeverity(await getAIInsights(filters))
  const criticalInsights = insights.filter(insight => insight.severity === 'critical')
  const warningInsights = insights.filter(insight => insight.severity === 'warning')

  return {
    moduleId: 'ai',
    title: roleId === 'cfo' ? 'AI Executive Insights' : 'AI Finance Insights',
    subtitle: 'Review exception-driven recommendations and finance copilots through service-backed insight queues.',
    badge: roleId === 'accountant' ? 'Accountant-Safe' : 'AI Workspace',
    metrics: [
      { id: 'ai-total', label: 'Insights', value: String(insights.length), detail: 'Current AI insight queue', tone: 'neutral' },
      { id: 'ai-critical', label: 'Critical', value: String(criticalInsights.length), detail: 'Immediate review items', tone: criticalInsights.length ? 'critical' : 'positive' },
      { id: 'ai-warning', label: 'Warnings', value: String(warningInsights.length), detail: 'Investigate before period close', tone: warningInsights.length ? 'warning' : 'positive' },
      { id: 'ai-actions', label: 'Actionable', value: String(insights.filter(insight => insight.actionHref).length), detail: 'Insights with direct drill-down', tone: 'accent' },
    ],
    actions: [
      { id: 'ai-open-queue', label: buildAIActionLabel(roleId), href: '/work-queue', icon: 'Inbox', tone: 'accent' },
      { id: 'ai-open-reports', label: 'Open Reports', href: '/reports', icon: 'LineChart' },
      { id: 'ai-open-exports', label: 'Exports & Sharing', href: '/exports-sharing', icon: 'Share2' },
    ],
    sections: [
      {
        id: 'ai-critical',
        title: 'Critical Insight Queue',
        description: 'Highest-severity insights surfaced for immediate review.',
        rows: criticalInsights.slice(0, 4).map(insight =>
          buildOverviewRow(insight.id, insight.title, {
            value: insight.type.replace(/_/g, ' '),
            href: insight.actionHref ?? '/ai',
            status: insight.severity,
            statusTone: insight.severity === 'critical' ? 'critical' : 'warning',
            meta: [formatDateLabel(insight.createdAt)],
          })
        ),
      },
      {
        id: 'ai-guidance',
        title: roleId === 'accountant' ? 'Daily Guidance' : 'Guidance Feed',
        description: 'AI recommendations that can be turned into operational follow-up.',
        rows: insights.slice(0, 4).map(insight =>
          buildOverviewRow(insight.id, insight.title, {
            value: insight.actionLabel ?? 'Review',
            href: insight.actionHref ?? '/ai',
            status: insight.severity,
            statusTone: insight.severity === 'info' ? 'accent' : insight.severity === 'warning' ? 'warning' : 'critical',
            meta: [insight.description],
          })
        ),
      },
    ],
  }
}

export async function getWorkflowsAutomationOverview(
  filters: FinanceFilters,
  roleId?: RoleId
): Promise<ModuleOverviewData> {
  const [workflows, approvals, closeTasks, closeStatus] = await Promise.all([
    getWorkflows(),
    getApprovalItems(filters, 'pending', 1, 50),
    getCloseTasks(filters),
    getCloseStatus(filters),
  ])

  const attentionWorkflows = sortWorkflowsForAttention(workflows)
  const blockedCloseTasks = closeTasks.filter(task => task.status === 'blocked')

  return {
    moduleId: 'workflows-automation',
    title: roleId === 'admin' ? 'Automation Control Tower' : 'Workflow Automation',
    subtitle: 'Track workflow routing, approval load, and automation readiness from one service-driven workspace entry point.',
    badge: roleId === 'admin' ? 'Platform Controls' : 'Finance Controls',
    metrics: [
      { id: 'wf-total', label: 'Workflows', value: String(workflows.length), detail: 'Active and draft automations', tone: 'neutral' },
      { id: 'wf-active', label: 'Active', value: String(workflows.filter(workflow => workflow.status === 'active').length), detail: 'Running production workflows', tone: 'positive' },
      { id: 'wf-approvals', label: 'Pending Approvals', value: String(approvals.total), detail: 'Documents waiting on workflow actions', tone: approvals.total ? 'warning' : 'positive' },
      { id: 'wf-close-blocked', label: 'Blocked Close Tasks', value: String(closeStatus.blockedTasks), detail: `${blockedCloseTasks.length} tasks currently blocked`, tone: closeStatus.blockedTasks ? 'critical' : 'positive' },
    ],
    actions: [
      { id: 'wf-open-admin', label: 'Open Workflow Workspace', href: '/admin/workflows', icon: 'Workflow', tone: 'accent' },
      { id: 'wf-open-approvals', label: 'Open Approvals', href: '/approvals', icon: 'BadgeCheck' },
      { id: 'wf-open-events', label: 'Event Monitoring', href: '/event-monitoring', icon: 'ActivitySquare' },
    ],
    sections: [
      {
        id: 'wf-attention',
        title: 'Automation Watchlist',
        description: 'Workflow definitions that need activation, validation, or governance review.',
        rows: attentionWorkflows.slice(0, 4).map(workflow =>
          buildOverviewRow(workflow.id, workflow.name, {
            value: workflow.type,
            href: '/admin/workflows',
            status: workflow.status,
            statusTone: getStatusTone(workflow.status),
            meta: [workflow.trigger, `${workflow.steps.length} steps`],
          })
        ),
      },
      {
        id: 'wf-approval-load',
        title: 'Approval Workload',
        description: 'Operational approval flow still waiting on workflow completion.',
        rows: approvals.data.slice(0, 4).map(item =>
          buildOverviewRow(item.id, `${item.documentNumber} · ${item.description}`, {
            value: item.type.replace(/_/g, ' '),
            href: '/approvals',
            status: item.status,
            statusTone: getStatusTone(item.status),
            meta: [item.requestedBy, formatDateLabel(item.requestedAt)],
          })
        ),
      },
      {
        id: 'wf-close-blockers',
        title: 'Close Blockers',
        description: 'Period-close items still blocked and likely to benefit from workflow remediation.',
        rows: blockedCloseTasks.slice(0, 4).map(task =>
          buildOverviewRow(task.id, task.name, {
            value: task.phase.replace(/_/g, ' '),
            href: '/work-queue',
            status: task.status,
            statusTone: getStatusTone(task.status),
            meta: [task.blockerReason ?? 'Blocked', task.ownerName],
          })
        ),
      },
    ],
  }
}
