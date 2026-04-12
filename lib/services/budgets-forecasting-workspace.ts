import type {
  BudgetLine,
  BudgetSubmission,
  BudgetVarianceRow,
  BudgetVersion,
  BudgetsForecastingSectionId,
  FinanceFilters,
  ForecastAssumption,
  ForecastDriver,
  ForecastScenario,
  ModuleOverviewData,
  RoleId,
  SortConfig,
  WorkspaceDetailData,
  WorkspaceFilterDefinition,
  WorkspaceListResponse,
  WorkspaceTabItem,
} from '@/lib/types'
import { delay, isInDateRange, matchesFinanceFilters, paginate, sortItems } from './base'
import { getDepartments, getEntities, getProjects } from './master-data'
import { getRuntimeDataset, updateRuntimeDataset } from './runtime-data'
import { buildDetailField, buildOverviewRow, formatDateLabel, formatDateTimeLabel, formatMoney, getStatusTone } from './workspace-support'

interface WorkspaceQuery {
  roleId?: RoleId
  search?: string
  status?: string
  departmentId?: string
  projectId?: string
  sort?: SortConfig
  page?: number
  pageSize?: number
}

let budgetTargets: Array<{
  category: string
  entityId: string
  departmentId?: string
  projectId?: string
  budget: number
  actual: number
}> = []
let budgetVersionStore: BudgetVersion[] = []
let budgetLineStore: BudgetLine[] = []
let forecastScenarioStore: ForecastScenario[] = []
let forecastDriverStore: ForecastDriver[] = []
let forecastAssumptionStore: ForecastAssumption[] = []
let budgetSubmissionStore: BudgetSubmission[] = []

let entityMap = new Map<string, { id: string; name: string; code: string }>()
let departmentMap = new Map<string, { id: string; name: string }>()
let projectMap = new Map<string, { id: string; name: string }>()
let budgetsForecastingStatePromise: Promise<void> | null = null

async function ensureBudgetsForecastingState() {
  if (budgetsForecastingStatePromise) {
    return budgetsForecastingStatePromise
  }

  budgetsForecastingStatePromise = (async () => {
    const [reporting, planning, entities, departments, projects] = await Promise.all([
      getRuntimeDataset<{ budgetTargets: typeof budgetTargets }>("reporting"),
      getRuntimeDataset<{
        budgetLines: BudgetLine[]
        budgetSubmissions: BudgetSubmission[]
        budgetVersions: BudgetVersion[]
        forecastAssumptions: ForecastAssumption[]
        forecastDrivers: ForecastDriver[]
        forecastScenarios: ForecastScenario[]
      }>("planning"),
      getEntities(),
      getDepartments(),
      getProjects(),
    ])

    budgetTargets = reporting.budgetTargets.map(target => ({ ...target }))
    budgetVersionStore = planning.budgetVersions.map(version => ({ ...version }))
    budgetLineStore = planning.budgetLines.map(line => ({ ...line }))
    forecastScenarioStore = planning.forecastScenarios.map(scenario => ({ ...scenario }))
    forecastDriverStore = planning.forecastDrivers.map(driver => ({ ...driver }))
    forecastAssumptionStore = planning.forecastAssumptions.map(assumption => ({ ...assumption }))
    budgetSubmissionStore = planning.budgetSubmissions.map(submission => ({ ...submission }))

    entityMap = new Map(entities.map(entity => [entity.id, { id: entity.id, name: entity.name, code: entity.code }]))
    departmentMap = new Map(departments.map(department => [department.id, { id: department.id, name: department.name }]))
    projectMap = new Map(projects.map(project => [project.id, { id: project.id, name: project.name }]))
  })()

  try {
    await budgetsForecastingStatePromise
  } finally {
    budgetsForecastingStatePromise = null
  }
}

async function persistPlanningState() {
  await updateRuntimeDataset("planning", {
    budgetLines: budgetLineStore,
    budgetSubmissions: budgetSubmissionStore,
    budgetVersions: budgetVersionStore,
    forecastAssumptions: forecastAssumptionStore,
    forecastDrivers: forecastDriverStore,
    forecastScenarios: forecastScenarioStore,
  })
}

const defaultSorts: Record<BudgetsForecastingSectionId, SortConfig> = {
  budget_versions: { key: 'updatedAt', direction: 'desc' },
  forecast_scenarios: { key: 'updatedAt', direction: 'desc' },
  variance_review: { key: 'varianceAmount', direction: 'desc' },
  submission_queue: { key: 'dueDate', direction: 'asc' },
}

const roleDefaults: Record<RoleId, BudgetsForecastingSectionId> = {
  accountant: 'variance_review',
  ap_specialist: 'variance_review',
  ar_specialist: 'variance_review',
  controller: 'submission_queue',
  cfo: 'forecast_scenarios',
  admin: 'budget_versions',
  ap_clerk: 'variance_review',
  ar_clerk: 'variance_review',
  viewer: 'variance_review',
}

function matchesSearch(text: string | undefined, search?: string) {
  if (!search?.trim()) {
    return true
  }

  return text?.toLowerCase().includes(search.trim().toLowerCase()) ?? false
}

function matchesScopedRecord(
  record: {
    entityId?: string
    departmentId?: string
    projectId?: string
    status?: string
  },
  filters: FinanceFilters,
  query: WorkspaceQuery,
  date?: Date
) {
  if (!matchesFinanceFilters(record, filters)) {
    return false
  }

  if (query.departmentId && query.departmentId !== 'all' && record.departmentId !== query.departmentId) {
    return false
  }

  if (query.projectId && query.projectId !== 'all' && record.projectId !== query.projectId) {
    return false
  }

  if (query.status && query.status !== 'all' && record.status !== query.status) {
    return false
  }

  if (date && !isInDateRange(date, filters.dateRange)) {
    return false
  }

  return true
}

function buildFilterDefinitions(
  statuses: string[],
  rows: Array<{ departmentId?: string; projectId?: string }>
): WorkspaceFilterDefinition[] {
  const scopedDepartments = Array.from(
    new Set(rows.map(row => row.departmentId).filter(Boolean))
  )
    .map(id => departmentMap.get(id as string))
    .filter(Boolean)

  const scopedProjects = Array.from(
    new Set(rows.map(row => row.projectId).filter(Boolean))
  )
    .map(id => projectMap.get(id as string))
    .filter(Boolean)

  return [
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Statuses' },
        ...statuses.map(status => ({
          value: status,
          label: status.replace(/_/g, ' '),
        })),
      ],
    },
    {
      id: 'departmentId',
      label: 'Department',
      options: [
        { value: 'all', label: 'All Departments' },
        ...scopedDepartments.map(department => ({
          value: department!.id,
          label: department!.name,
        })),
      ],
    },
    {
      id: 'projectId',
      label: 'Project',
      options: [
        { value: 'all', label: 'All Projects' },
        ...scopedProjects.map(project => ({
          value: project!.id,
          label: project!.name,
        })),
      ],
    },
  ]
}

function buildVarianceRows(filters: FinanceFilters): BudgetVarianceRow[] {
  return budgetTargets
    .filter(target => matchesFinanceFilters(target, filters))
    .map(target => {
      const varianceAmount = target.actual - target.budget
      const variancePercent = target.budget === 0 ? 0 : Number(((varianceAmount / target.budget) * 100).toFixed(1))
      const department = target.departmentId ? departmentMap.get(target.departmentId) : undefined
      const project = target.projectId ? projectMap.get(target.projectId) : undefined
      const entity = entityMap.get(target.entityId)
      const ownerName =
        target.departmentId === 'd-sales'
          ? 'Owen Price'
          : target.departmentId === 'd-ops'
            ? 'Miles Chen'
            : 'Ava Mitchell'

      return {
        id: `variance-${target.entityId}-${target.category}`,
        category: target.category,
        entityId: target.entityId,
        entityName: entity?.name ?? target.entityId,
        departmentId: target.departmentId,
        departmentName: department?.name,
        projectId: target.projectId,
        projectName: project?.name,
        budgetAmount: target.budget,
        actualAmount: target.actual,
        varianceAmount,
        variancePercent,
        ownerName,
        status:
          Math.abs(variancePercent) >= 8
            ? 'critical'
            : Math.abs(variancePercent) >= 4
              ? 'watch'
              : 'favorable',
      }
    })
}

function buildOverviewSections(filters: FinanceFilters) {
  const varianceRows = buildVarianceRows(filters)
  const criticalVariance = varianceRows
    .filter(row => row.status === 'critical')
    .sort((left, right) => Math.abs(right.varianceAmount) - Math.abs(left.varianceAmount))
    .slice(0, 3)

  const overdueSubmissions = budgetSubmissionStore
    .filter(submission => matchesFinanceFilters(submission, filters))
    .filter(submission => submission.status === 'overdue' || submission.status === 'returned')
    .slice(0, 3)

  return [
    {
      id: 'planning-variance',
      title: 'Variance Hotspots',
      description: 'Largest plan variances needing accountant or controller attention.',
      rows: criticalVariance.map(row =>
        buildOverviewRow(row.id, `${row.category} · ${row.departmentName ?? row.entityName}`, {
          value: formatMoney(row.varianceAmount),
          status: row.status,
          statusTone: row.status === 'critical' ? 'critical' : row.status === 'watch' ? 'warning' : 'positive',
          meta: [row.projectName ?? 'No project', `${row.variancePercent}% variance`],
          href: '/budgets-forecasting',
        })
      ),
    },
    {
      id: 'planning-submissions',
      title: 'Submission Queue',
      description: 'Outstanding owner submissions that still need collection or review.',
      rows: overdueSubmissions.map(submission =>
        buildOverviewRow(submission.id, `${submission.ownerName} · ${submission.departmentName ?? 'Shared'}`, {
          value: formatDateLabel(submission.dueDate),
          status: submission.status,
          statusTone: submission.status === 'submitted' ? 'positive' : submission.status === 'in_progress' ? 'warning' : 'critical',
          meta: [submission.projectName ?? 'No project', submission.exceptionReason ?? 'Awaiting review'],
          href: '/budgets-forecasting',
        })
      ),
    },
  ]
}

export function getBudgetsForecastingDefaultSection(roleId?: RoleId): BudgetsForecastingSectionId {
  return roleDefaults[roleId ?? 'accountant'] ?? 'variance_review'
}

export async function getBudgetsForecastingTabs(
  filters: FinanceFilters,
  roleId?: RoleId
): Promise<WorkspaceTabItem[]> {
  await ensureBudgetsForecastingState()
  await delay()

  const varianceRows = buildVarianceRows(filters)
  const scopedVersions = budgetVersionStore.filter(version => matchesFinanceFilters(version, filters))
  const scopedScenarios = forecastScenarioStore.filter(scenario => matchesFinanceFilters(scenario, filters))
  const scopedSubmissions = budgetSubmissionStore.filter(submission => matchesFinanceFilters(submission, filters))
  const defaultSection = getBudgetsForecastingDefaultSection(roleId)

  return [
    {
      id: 'budget_versions',
      label: 'Budget Versions',
      description: 'Version ownership and review status.',
      count: scopedVersions.length,
      tone: defaultSection === 'budget_versions' ? 'accent' : 'neutral',
    },
    {
      id: 'forecast_scenarios',
      label: 'Forecast Scenarios',
      description: 'What-if cases and confidence drivers.',
      count: scopedScenarios.length,
      tone: defaultSection === 'forecast_scenarios' ? 'accent' : 'neutral',
    },
    {
      id: 'variance_review',
      label: 'Variance Review',
      description: 'Budget vs actual exceptions by owner.',
      count: varianceRows.length,
      tone: defaultSection === 'variance_review' ? 'accent' : 'neutral',
    },
    {
      id: 'submission_queue',
      label: 'Submission Queue',
      description: 'Department and project submissions in flight.',
      count: scopedSubmissions.length,
      tone: defaultSection === 'submission_queue' ? 'accent' : 'neutral',
    },
  ]
}

export async function getBudgetsForecastingOverview(
  filters: FinanceFilters,
  roleId: RoleId = 'accountant'
): Promise<ModuleOverviewData> {
  await ensureBudgetsForecastingState()
  await delay()

  const scopedVersions = budgetVersionStore.filter(version => matchesFinanceFilters(version, filters))
  const scopedScenarios = forecastScenarioStore.filter(scenario => matchesFinanceFilters(scenario, filters))
  const scopedSubmissions = budgetSubmissionStore.filter(submission => matchesFinanceFilters(submission, filters))
  const varianceRows = buildVarianceRows(filters)

  const overdueSubmissions = scopedSubmissions.filter(submission => submission.status === 'overdue' || submission.status === 'returned').length
  const criticalVariance = varianceRows.filter(row => row.status === 'critical').length
  const assumptionsOpen = forecastAssumptionStore.filter(assumption => assumption.status !== 'approved').length
  const activeScenarios = scopedScenarios.filter(scenario => scenario.status === 'active' || scenario.status === 'approved').length

  const roleAccent =
    roleId === 'cfo'
      ? 'Scenario Control'
      : roleId === 'controller'
        ? 'Submission Assurance'
        : 'Budget Operations'

  return {
    moduleId: 'budgets-forecasting',
    title: 'Budgets & Forecasting',
    subtitle: 'Variance exceptions, owner submissions, and forecast confidence in one planning workspace.',
    badge: roleAccent,
    metrics: [
      {
        id: 'planning-critical-variance',
        label: 'Critical Variances',
        value: String(criticalVariance),
        detail: 'Categories above four points off plan',
        tone: criticalVariance ? 'critical' : 'positive',
      },
      {
        id: 'planning-submissions',
        label: 'Open Submissions',
        value: String(scopedSubmissions.filter(submission => submission.status !== 'submitted').length),
        detail: `${overdueSubmissions} overdue or returned`,
        tone: overdueSubmissions ? 'critical' : 'warning',
      },
      {
        id: 'planning-scenarios',
        label: 'Active Scenarios',
        value: String(activeScenarios),
        detail: `${assumptionsOpen} assumptions still open`,
        tone: roleId === 'cfo' ? 'accent' : 'neutral',
      },
      {
        id: 'planning-coverage',
        label: 'Version Coverage',
        value: String(scopedVersions.length),
        detail: `${scopedVersions.filter(version => version.status === 'approved' || version.status === 'locked').length} approved or locked`,
        tone: 'positive',
      },
    ],
    actions:
      roleId === 'cfo'
        ? [
            { id: 'create-scenario', label: 'Create Scenario', icon: 'GitBranchPlus', tone: 'accent' },
            { id: 'compare-scenarios', label: 'Compare Scenarios', href: '/budgets-forecasting', icon: 'Scale' },
            { id: 'variance-report', label: 'Variance Review', href: '/reports/budget-vs-actual', icon: 'LineChart' },
          ]
        : roleId === 'controller'
          ? [
              { id: 'new-budget-version', label: 'New Budget Version', icon: 'FilePlus2', tone: 'accent' },
              { id: 'start-review-cycle', label: 'Start Review Cycle', icon: 'BadgeCheck' },
              { id: 'submission-queue', label: 'Submission Queue', href: '/budgets-forecasting', icon: 'Inbox' },
            ]
          : [
              { id: 'variance-review', label: 'Review Variances', href: '/budgets-forecasting', icon: 'TriangleAlert', tone: 'accent' },
              { id: 'create-scenario', label: 'Create Scenario', icon: 'GitBranchPlus' },
              { id: 'submission-queue', label: 'Submission Queue', href: '/budgets-forecasting', icon: 'Inbox' },
            ],
    sections: buildOverviewSections(filters),
  }
}

export async function getBudgetVersionsWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery = {}
): Promise<WorkspaceListResponse<BudgetVersion>> {
  await ensureBudgetsForecastingState()
  await delay()

  const scopedRows = budgetVersionStore
    .filter(version => matchesScopedRecord(version, filters, query, version.updatedAt))
    .filter(version =>
      matchesSearch(
        `${version.name} ${version.ownerName} ${version.departmentName ?? ''} ${version.projectName ?? ''} ${version.notes ?? ''}`,
        query.search
      )
    )

  const sorted = sortItems(scopedRows, query.sort ?? defaultSorts.budget_versions)
  const paginated = paginate(sorted, query.page ?? 1, query.pageSize ?? 10)

  return {
    ...paginated,
    metrics: [
      {
        id: 'budget-visible',
        label: 'Visible Versions',
        value: String(scopedRows.length),
        detail: `${scopedRows.filter(version => version.status === 'in_review').length} in review`,
        tone: 'neutral',
      },
      {
        id: 'budget-forecast-delta',
        label: 'Forecast Delta',
        value: formatMoney(scopedRows.reduce((sum, version) => sum + version.varianceAmount, 0)),
        detail: 'Forecast vs budget across visible versions',
        tone: scopedRows.some(version => version.varianceAmount > 0) ? 'warning' : 'positive',
      },
      {
        id: 'budget-due-soon',
        label: 'Due This Week',
        value: String(scopedRows.filter(version => version.submissionDueDate && version.submissionDueDate <= new Date('2026-04-11')).length),
        detail: 'Version packs due within seven days',
        tone: 'warning',
      },
      {
        id: 'budget-approved',
        label: 'Approved',
        value: String(scopedRows.filter(version => version.status === 'approved' || version.status === 'locked').length),
        detail: 'Ready for downstream planning use',
        tone: 'positive',
      },
    ],
    actions: [
      { id: 'new-budget-version', label: 'New Budget Version', icon: 'FilePlus2', tone: 'accent' },
      { id: 'start-review-cycle', label: 'Start Review Cycle', icon: 'BadgeCheck' },
    ],
    filters: buildFilterDefinitions(
      Array.from(new Set(scopedRows.map(version => version.status))),
      scopedRows
    ),
    emptyMessage: 'No budget versions match the current planning scope.',
    defaultSort: defaultSorts.budget_versions,
  }
}

export async function getBudgetVersionDetail(id: string): Promise<WorkspaceDetailData | null> {
  await ensureBudgetsForecastingState()
  await delay()
  const version = budgetVersionStore.find(candidate => candidate.id === id)
  if (!version) {
    return null
  }

  const lines = budgetLineStore.filter(line => line.budgetVersionId === id)
  const submission = budgetSubmissionStore.find(candidate => candidate.budgetVersionId === id)

  return {
    id: version.id,
    title: version.name,
    subtitle: `${version.versionType.replace('_', ' ')} plan for FY${version.fiscalYear}`,
    badges: [
      { id: 'status', label: version.status, tone: getStatusTone(version.status) },
      { id: 'entity', label: entityMap.get(version.entityId)?.code ?? version.entityId, tone: 'neutral' },
    ],
    summary: [
      buildDetailField('owner', 'Owner', version.ownerName),
      buildDetailField('budget', 'Total Budget', formatMoney(version.totalBudget)),
      buildDetailField('forecast', 'Forecast', formatMoney(version.forecastAmount)),
      buildDetailField('variance', 'Variance', formatMoney(version.varianceAmount), version.varianceAmount > 0 ? 'warning' : 'positive'),
      buildDetailField('updated', 'Updated', formatDateTimeLabel(version.updatedAt)),
      buildDetailField('due', 'Submission Due', formatDateLabel(version.submissionDueDate)),
    ],
    sections: [
      {
        id: 'budget-lines',
        title: 'Budget Lines',
        fields: lines.map(line =>
          buildDetailField(
            line.id,
            `${line.category} · ${line.accountName}`,
            `${formatMoney(line.budgetAmount)} budget / ${formatMoney(line.actualAmount)} actual`
          )
        ),
      },
      {
        id: 'submission',
        title: 'Submission Status',
        fields: submission
          ? [
              buildDetailField('submission-owner', 'Owner', submission.ownerName),
              buildDetailField('submission-status', 'Status', submission.status, getStatusTone(submission.status)),
              buildDetailField('submission-due', 'Due Date', formatDateLabel(submission.dueDate)),
              buildDetailField('submission-note', 'Exception', submission.exceptionReason ?? 'No blocking issues'),
            ]
          : [buildDetailField('submission-missing', 'Submission', 'No submission record found')],
      },
    ],
    actions: [
      { id: 'advance-status', label: version.status === 'draft' ? 'Submit Version' : 'Advance Status', icon: 'ArrowRight' },
      { id: 'new-budget-version', label: 'Duplicate Version', icon: 'CopyPlus' },
    ],
    links: [
      { id: 'planning-home', label: 'Planning Workspace', href: '/budgets-forecasting', description: 'Return to the planning workspace' },
      { id: 'variance-report', label: 'Budget vs Actual Report', href: '/reports/budget-vs-actual', description: 'Open the report view' },
    ],
  }
}

export async function getBudgetVarianceDetail(
  id: string,
  filters: FinanceFilters
): Promise<WorkspaceDetailData | null> {
  await ensureBudgetsForecastingState()
  await delay()
  const row = buildVarianceRows(filters).find(candidate => candidate.id === id)
  if (!row) {
    return null
  }

  return {
    id: row.id,
    title: `${row.category} variance`,
    subtitle: `${row.departmentName ?? row.entityName} · ${row.ownerName}`,
    badges: [
      { id: 'status', label: row.status, tone: row.status === 'critical' ? 'critical' : row.status === 'watch' ? 'warning' : 'positive' },
    ],
    summary: [
      buildDetailField('budget', 'Budget', formatMoney(row.budgetAmount)),
      buildDetailField('actual', 'Actual', formatMoney(row.actualAmount)),
      buildDetailField('variance', 'Variance', formatMoney(row.varianceAmount), row.varianceAmount > 0 ? 'critical' : 'positive'),
      buildDetailField('variance-percent', 'Variance %', `${row.variancePercent}%`, row.status === 'critical' ? 'critical' : row.status === 'watch' ? 'warning' : 'positive'),
    ],
    sections: [
      {
        id: 'scope',
        title: 'Scope',
        fields: [
          buildDetailField('entity', 'Entity', row.entityName),
          buildDetailField('department', 'Department', row.departmentName ?? 'No department'),
          buildDetailField('project', 'Project', row.projectName ?? 'No project'),
          buildDetailField('owner', 'Owner', row.ownerName),
        ],
      },
    ],
    actions: [{ id: 'refresh-assumptions', label: 'Refresh Assumptions', icon: 'RefreshCcw' }],
    links: [{ id: 'variance-report', label: 'Budget vs Actual Report', href: '/reports/budget-vs-actual', description: 'Open the report view' }],
  }
}

export async function getForecastScenariosWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery = {}
): Promise<WorkspaceListResponse<ForecastScenario>> {
  await ensureBudgetsForecastingState()
  await delay()

  const scopedRows = forecastScenarioStore
    .filter(scenario => matchesScopedRecord(scenario, filters, query, scenario.updatedAt))
    .filter(scenario =>
      matchesSearch(
        `${scenario.name} ${scenario.ownerName} ${scenario.departmentName ?? ''} ${scenario.projectName ?? ''}`,
        query.search
      )
    )

  const sorted = sortItems(scopedRows, query.sort ?? defaultSorts.forecast_scenarios)
  const paginated = paginate(sorted, query.page ?? 1, query.pageSize ?? 10)

  return {
    ...paginated,
    metrics: [
      {
        id: 'scenario-visible',
        label: 'Visible Scenarios',
        value: String(scopedRows.length),
        detail: `${scopedRows.filter(row => row.status === 'active').length} active`,
        tone: 'neutral',
      },
      {
        id: 'scenario-net',
        label: 'Net Forecast',
        value: formatMoney(scopedRows.reduce((sum, row) => sum + row.netForecast, 0)),
        detail: 'Combined net position for visible scenarios',
        tone: 'accent',
      },
      {
        id: 'scenario-confidence',
        label: 'High Confidence',
        value: String(scopedRows.filter(row => row.confidence === 'high').length),
        detail: `${scopedRows.filter(row => row.confidence === 'low').length} low confidence`,
        tone: scopedRows.some(row => row.confidence === 'low') ? 'warning' : 'positive',
      },
      {
        id: 'scenario-upside',
        label: 'Upside Opportunity',
        value: formatMoney(scopedRows.reduce((sum, row) => sum + row.upsideAmount, 0)),
        detail: 'Potential upside across visible scenarios',
        tone: 'positive',
      },
    ],
    actions: [
      { id: 'create-scenario', label: 'Create Scenario', icon: 'GitBranchPlus', tone: 'accent' },
      { id: 'refresh-assumptions', label: 'Refresh Assumptions', icon: 'RefreshCcw' },
    ],
    filters: buildFilterDefinitions(
      Array.from(new Set(scopedRows.map(row => row.status))),
      scopedRows
    ),
    emptyMessage: 'No forecast scenarios match the current planning scope.',
    defaultSort: defaultSorts.forecast_scenarios,
  }
}

export async function getForecastScenarioDetail(id: string): Promise<WorkspaceDetailData | null> {
  await ensureBudgetsForecastingState()
  await delay()
  const scenario = forecastScenarioStore.find(candidate => candidate.id === id)
  if (!scenario) {
    return null
  }

  const drivers = forecastDriverStore.filter(driver => driver.scenarioId === id)
  const assumptions = forecastAssumptionStore.filter(assumption => assumption.scenarioId === id)

  return {
    id: scenario.id,
    title: scenario.name,
    subtitle: `Scenario owned by ${scenario.ownerName}`,
    badges: [
      { id: 'status', label: scenario.status, tone: getStatusTone(scenario.status) },
      { id: 'confidence', label: `${scenario.confidence} confidence`, tone: scenario.confidence === 'low' ? 'warning' : scenario.confidence === 'high' ? 'positive' : 'neutral' },
    ],
    summary: [
      buildDetailField('revenue', 'Revenue Forecast', formatMoney(scenario.revenueForecast)),
      buildDetailField('expenses', 'Expense Forecast', formatMoney(scenario.expenseForecast)),
      buildDetailField('net', 'Net Forecast', formatMoney(scenario.netForecast)),
      buildDetailField('upside', 'Upside', formatMoney(scenario.upsideAmount), 'positive'),
      buildDetailField('downside', 'Downside', formatMoney(scenario.downsideAmount), 'critical'),
      buildDetailField('updated', 'Updated', formatDateTimeLabel(scenario.updatedAt)),
    ],
    sections: [
      {
        id: 'drivers',
        title: 'Forecast Drivers',
        fields: drivers.map(driver =>
          buildDetailField(driver.id, driver.name, `${driver.assumption} · ${formatMoney(driver.impactAmount)}`)
        ),
      },
      {
        id: 'assumptions',
        title: 'Assumptions',
        fields: assumptions.map(assumption =>
          buildDetailField(assumption.id, assumption.label, `${assumption.value}${assumption.unit ? ` ${assumption.unit}` : ''} · ${assumption.status}`)
        ),
      },
    ],
    actions: [
      { id: 'advance-status', label: scenario.status === 'draft' ? 'Submit Scenario' : 'Advance Status', icon: 'ArrowRight' },
      { id: 'refresh-assumptions', label: 'Refresh Assumptions', icon: 'RefreshCcw' },
    ],
    links: [
      { id: 'planning-home', label: 'Planning Workspace', href: '/budgets-forecasting', description: 'Return to the planning workspace' },
    ],
  }
}

export async function getBudgetVarianceWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery = {}
): Promise<WorkspaceListResponse<BudgetVarianceRow>> {
  await ensureBudgetsForecastingState()
  await delay()

  const scopedRows = buildVarianceRows(filters)
    .filter(row => matchesScopedRecord(row, filters, query))
    .filter(row =>
      matchesSearch(
        `${row.category} ${row.departmentName ?? ''} ${row.projectName ?? ''} ${row.ownerName} ${row.entityName}`,
        query.search
      )
    )

  const sorted = sortItems(scopedRows, query.sort ?? defaultSorts.variance_review)
  const paginated = paginate(sorted, query.page ?? 1, query.pageSize ?? 10)

  return {
    ...paginated,
    metrics: [
      {
        id: 'variance-visible',
        label: 'Visible Categories',
        value: String(scopedRows.length),
        detail: `${scopedRows.filter(row => row.status === 'critical').length} critical`,
        tone: 'neutral',
      },
      {
        id: 'variance-amount',
        label: 'Net Variance',
        value: formatMoney(scopedRows.reduce((sum, row) => sum + row.varianceAmount, 0)),
        detail: 'Actual minus budget across visible rows',
        tone: scopedRows.some(row => row.status === 'critical') ? 'warning' : 'positive',
      },
      {
        id: 'variance-over-budget',
        label: 'Over Budget',
        value: String(scopedRows.filter(row => row.varianceAmount > 0).length),
        detail: 'Categories trending above plan',
        tone: 'critical',
      },
      {
        id: 'variance-favorable',
        label: 'Favorable',
        value: String(scopedRows.filter(row => row.status === 'favorable').length),
        detail: 'Categories within tolerance',
        tone: 'positive',
      },
    ],
    actions: [
      { id: 'refresh-assumptions', label: 'Refresh Assumptions', icon: 'RefreshCcw' },
      { id: 'variance-report', label: 'Open Report', href: '/reports/budget-vs-actual', icon: 'LineChart' },
    ],
    filters: buildFilterDefinitions(
      Array.from(new Set(scopedRows.map(row => row.status))),
      scopedRows
    ),
    emptyMessage: 'No variance exceptions match the current filters.',
    defaultSort: defaultSorts.variance_review,
  }
}

export async function getBudgetSubmissionsWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery = {}
): Promise<WorkspaceListResponse<BudgetSubmission>> {
  await ensureBudgetsForecastingState()
  await delay()

  const scopedRows = budgetSubmissionStore
    .filter(submission => matchesScopedRecord(submission, filters, query, submission.dueDate))
    .filter(submission =>
      matchesSearch(
        `${submission.ownerName} ${submission.departmentName ?? ''} ${submission.projectName ?? ''} ${submission.exceptionReason ?? ''}`,
        query.search
      )
    )

  const sorted = sortItems(scopedRows, query.sort ?? defaultSorts.submission_queue)
  const paginated = paginate(sorted, query.page ?? 1, query.pageSize ?? 10)

  return {
    ...paginated,
    metrics: [
      {
        id: 'submission-visible',
        label: 'Visible Submissions',
        value: String(scopedRows.length),
        detail: `${scopedRows.filter(row => row.status === 'submitted').length} submitted`,
        tone: 'neutral',
      },
      {
        id: 'submission-overdue',
        label: 'Overdue',
        value: String(scopedRows.filter(row => row.status === 'overdue' || row.status === 'returned').length),
        detail: 'Still blocking planning completion',
        tone: 'critical',
      },
      {
        id: 'submission-in-flight',
        label: 'In Progress',
        value: String(scopedRows.filter(row => row.status === 'in_progress').length),
        detail: 'Owners still preparing support',
        tone: 'warning',
      },
      {
        id: 'submission-returned',
        label: 'Returned',
        value: String(scopedRows.filter(row => row.status === 'returned').length),
        detail: 'Need accountant follow-up',
        tone: 'critical',
      },
    ],
    actions: [
      { id: 'nudge-owners', label: 'Nudge Owners', icon: 'BellRing', tone: 'accent' },
      { id: 'new-budget-version', label: 'New Version', icon: 'FilePlus2' },
    ],
    filters: buildFilterDefinitions(
      Array.from(new Set(scopedRows.map(row => row.status))),
      scopedRows
    ),
    emptyMessage: 'No submissions match the current planning filters.',
    defaultSort: defaultSorts.submission_queue,
  }
}

export async function getBudgetSubmissionDetail(id: string): Promise<WorkspaceDetailData | null> {
  await ensureBudgetsForecastingState()
  await delay()
  const submission = budgetSubmissionStore.find(candidate => candidate.id === id)
  if (!submission) {
    return null
  }

  const version = budgetVersionStore.find(candidate => candidate.id === submission.budgetVersionId)

  return {
    id: submission.id,
    title: `${submission.ownerName} submission`,
    subtitle: version?.name ?? 'Budget submission',
    badges: [
      { id: 'status', label: submission.status, tone: getStatusTone(submission.status) },
    ],
    summary: [
      buildDetailField('owner', 'Owner', submission.ownerName),
      buildDetailField('due-date', 'Due Date', formatDateLabel(submission.dueDate)),
      buildDetailField('submitted', 'Submitted At', formatDateTimeLabel(submission.submittedAt)),
      buildDetailField('exception', 'Exception', submission.exceptionReason ?? 'No blocking issues'),
    ],
    sections: [
      {
        id: 'scope',
        title: 'Submission Scope',
        fields: [
          buildDetailField('entity', 'Entity', entityMap.get(submission.entityId)?.name ?? submission.entityId),
          buildDetailField('department', 'Department', submission.departmentName ?? 'No department'),
          buildDetailField('project', 'Project', submission.projectName ?? 'No project'),
        ],
      },
    ],
    actions: [{ id: 'advance-status', label: 'Advance Status', icon: 'ArrowRight' }],
    links: [{ id: 'planning-home', label: 'Planning Workspace', href: '/budgets-forecasting', description: 'Return to the planning workspace' }],
  }
}

export async function saveBudgetVersion(
  input: Partial<BudgetVersion> & Pick<BudgetVersion, 'name' | 'entityId' | 'ownerId' | 'ownerName' | 'versionType'>
): Promise<BudgetVersion> {
  await ensureBudgetsForecastingState()
  await delay()

  if (input.id) {
    const existing = budgetVersionStore.find(version => version.id === input.id)
    if (existing) {
      Object.assign(existing, input, {
        updatedAt: new Date(),
      })
      await persistPlanningState()
      return { ...existing }
    }
  }

  const department = input.departmentId ? departmentMap.get(input.departmentId) : undefined
  const project = input.projectId ? projectMap.get(input.projectId) : undefined
  const created: BudgetVersion = {
    id: `budget-version-${budgetVersionStore.length + 1}`,
    name: input.name,
    fiscalYear: input.fiscalYear ?? 2026,
    entityId: input.entityId,
    departmentId: input.departmentId,
    departmentName: input.departmentName ?? department?.name,
    projectId: input.projectId,
    projectName: input.projectName ?? project?.name,
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    versionType: input.versionType,
    status: input.status ?? 'draft',
    totalBudget: input.totalBudget ?? 0,
    actualToDate: input.actualToDate ?? 0,
    forecastAmount: input.forecastAmount ?? input.totalBudget ?? 0,
    varianceAmount: input.varianceAmount ?? 0,
    variancePercent: input.variancePercent ?? 0,
    lineCount: input.lineCount ?? 0,
    submissionDueDate: input.submissionDueDate ?? new Date('2026-04-15'),
    updatedAt: new Date(),
    notes: input.notes,
  }

  budgetVersionStore.unshift(created)
  budgetSubmissionStore.unshift({
    id: `budget-submission-${budgetSubmissionStore.length + 1}`,
    budgetVersionId: created.id,
    entityId: created.entityId,
    departmentId: created.departmentId,
    departmentName: created.departmentName,
    projectId: created.projectId,
    projectName: created.projectName,
    ownerId: created.ownerId,
    ownerName: created.ownerName,
    status: 'not_started',
    dueDate: created.submissionDueDate ?? new Date('2026-04-15'),
  })

  await persistPlanningState()
  return { ...created }
}

export async function saveForecastScenario(
  input: Partial<ForecastScenario> & Pick<ForecastScenario, 'name' | 'entityId' | 'basedOnBudgetVersionId' | 'ownerId' | 'ownerName'>
): Promise<ForecastScenario> {
  await ensureBudgetsForecastingState()
  await delay()

  if (input.id) {
    const existing = forecastScenarioStore.find(scenario => scenario.id === input.id)
    if (existing) {
      Object.assign(existing, input, {
        updatedAt: new Date(),
      })
      await persistPlanningState()
      return { ...existing }
    }
  }

  const department = input.departmentId ? departmentMap.get(input.departmentId) : undefined
  const project = input.projectId ? projectMap.get(input.projectId) : undefined
  const created: ForecastScenario = {
    id: `forecast-scenario-${forecastScenarioStore.length + 1}`,
    name: input.name,
    entityId: input.entityId,
    departmentId: input.departmentId,
    departmentName: input.departmentName ?? department?.name,
    projectId: input.projectId,
    projectName: input.projectName ?? project?.name,
    basedOnBudgetVersionId: input.basedOnBudgetVersionId,
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    status: input.status ?? 'draft',
    confidence: input.confidence ?? 'medium',
    revenueForecast: input.revenueForecast ?? 0,
    expenseForecast: input.expenseForecast ?? 0,
    netForecast: input.netForecast ?? 0,
    upsideAmount: input.upsideAmount ?? 0,
    downsideAmount: input.downsideAmount ?? 0,
    updatedAt: new Date(),
  }

  forecastScenarioStore.unshift(created)
  await persistPlanningState()
  return { ...created }
}

export async function updateBudgetSubmission(
  id: string,
  updates: Partial<BudgetSubmission>
): Promise<BudgetSubmission | null> {
  await ensureBudgetsForecastingState()
  await delay()
  const existing = budgetSubmissionStore.find(submission => submission.id === id)
  if (!existing) {
    return null
  }

  Object.assign(existing, updates, {
    submittedAt: updates.status === 'submitted' ? new Date() : existing.submittedAt,
  })

  await persistPlanningState()
  return { ...existing }
}
