import type {
  Contract,
  ContractsRevenueSectionId,
  Entity,
  FinanceFilters,
  ModuleOverviewData,
  PerformanceObligation,
  RevenueRecognitionEvent,
  RevenueSchedule,
  RevenueScheduleLine,
  RoleId,
  SortConfig,
  WorkspaceDetailData,
  WorkspaceFilterDefinition,
  WorkspaceListResponse,
  WorkspaceTabItem,
} from '@/lib/types'
import { delay, isInDateRange, matchesFinanceFilters, paginate, sortItems } from './base'
import { getEntities } from './master-data'
import { getRuntimeDataset, updateRuntimeDataset } from './runtime-data'
import { buildDetailField, buildOverviewRow, formatDateLabel, formatDateTimeLabel, formatMoney, getStatusTone } from './workspace-support'

interface WorkspaceQuery {
  search?: string
  status?: string
  departmentId?: string
  projectId?: string
  sort?: SortConfig
  page?: number
  pageSize?: number
}

let contractStore: Contract[] = []
let scheduleStore: RevenueSchedule[] = []
let scheduleLineStore: RevenueScheduleLine[] = []
let obligationStore: PerformanceObligation[] = []
let recognitionEventStore: RevenueRecognitionEvent[] = []
let entityMap = new Map<string, Entity>()
let contractsRevenueStatePromise: Promise<void> | null = null

async function ensureContractsRevenueState() {
  if (contractsRevenueStatePromise) {
    return contractsRevenueStatePromise
  }

  contractsRevenueStatePromise = (async () => {
    const [receivables, contractsRevenue, entities] = await Promise.all([
      getRuntimeDataset<{ contracts: Contract[] }>("receivables"),
      getRuntimeDataset<{
        performanceObligations: PerformanceObligation[]
        revenueRecognitionEvents: RevenueRecognitionEvent[]
        revenueScheduleLines: RevenueScheduleLine[]
        revenueSchedules: RevenueSchedule[]
      }>("contracts_revenue"),
      getEntities(),
    ])

    contractStore = receivables.contracts.map(contract => ({ ...contract }))
    scheduleStore = contractsRevenue.revenueSchedules.map(schedule => ({ ...schedule }))
    scheduleLineStore = contractsRevenue.revenueScheduleLines.map(line => ({ ...line }))
    obligationStore = contractsRevenue.performanceObligations.map(obligation => ({ ...obligation }))
    recognitionEventStore = contractsRevenue.revenueRecognitionEvents.map(event => ({ ...event }))
    entityMap = new Map(entities.map(entity => [entity.id, entity]))
  })()

  try {
    await contractsRevenueStatePromise
  } finally {
    contractsRevenueStatePromise = null
  }
}

async function persistContractsRevenueState() {
  await Promise.all([
    updateRuntimeDataset("receivables", {
      contracts: contractStore,
    }),
    updateRuntimeDataset("contracts_revenue", {
      performanceObligations: obligationStore,
      revenueRecognitionEvents: recognitionEventStore,
      revenueScheduleLines: scheduleLineStore,
      revenueSchedules: scheduleStore,
    }),
  ])
}

const defaultSorts: Record<ContractsRevenueSectionId, SortConfig> = {
  contracts: { key: 'createdAt', direction: 'desc' },
  revenue_schedules: { key: 'nextRecognitionDate', direction: 'asc' },
  recognition_queue: { key: 'recognitionDate', direction: 'asc' },
  exceptions: { key: 'recognitionDate', direction: 'asc' },
}

const roleDefaults: Record<RoleId, ContractsRevenueSectionId> = {
  accountant: 'recognition_queue',
  ap_specialist: 'recognition_queue',
  ar_specialist: 'recognition_queue',
  controller: 'exceptions',
  cfo: 'contracts',
  admin: 'revenue_schedules',
  ap_clerk: 'recognition_queue',
  ar_clerk: 'recognition_queue',
  viewer: 'recognition_queue',
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
  return [
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Statuses' },
        ...statuses.map(status => ({ value: status, label: status.replace(/_/g, ' ') })),
      ],
    },
    {
      id: 'departmentId',
      label: 'Department',
      options: [
        { value: 'all', label: 'All Departments' },
        { value: 'd-fin', label: 'Finance' },
        { value: 'd-sales', label: 'Sales' },
      ],
    },
    {
      id: 'projectId',
      label: 'Project',
      options: [
        { value: 'all', label: 'All Projects' },
        { value: 'p-close', label: 'Q1 Close Acceleration' },
        { value: 'p-eu', label: 'EU Shared Services' },
      ],
    },
  ]
}

function buildOverviewSections(filters: FinanceFilters) {
  const queuedEvents = recognitionEventStore
    .filter(event => matchesFinanceFilters(event, filters))
    .filter(event => event.status !== 'posted')
    .slice(0, 3)

  const heldSchedules = scheduleStore
    .filter(schedule => matchesFinanceFilters(schedule, filters))
    .filter(schedule => schedule.status === 'hold')
    .slice(0, 3)

  return [
    {
      id: 'recognition-queue',
      title: 'Recognition Queue',
      description: 'Revenue events due for posting in the current period.',
      rows: queuedEvents.map(event =>
        buildOverviewRow(event.id, `${event.contractNumber} · ${formatDateLabel(event.recognitionDate)}`, {
          value: formatMoney(event.amount),
          status: event.status,
          statusTone: event.status === 'held' ? 'critical' : 'warning',
          meta: [event.description],
          href: '/contracts-revenue',
        })
      ),
    },
    {
      id: 'schedule-exceptions',
      title: 'Schedule Exceptions',
      description: 'Held or exception schedules that still need support.',
      rows: heldSchedules.map(schedule =>
        buildOverviewRow(schedule.id, `${schedule.contractNumber} · ${schedule.contractName}`, {
          value: formatMoney(schedule.deferredBalance),
          status: schedule.status,
          statusTone: schedule.status === 'hold' ? 'critical' : 'neutral',
          meta: [schedule.recognitionMethod, formatDateLabel(schedule.nextRecognitionDate)],
          href: '/contracts-revenue',
        })
      ),
    },
  ]
}

export function getContractsRevenueDefaultSection(roleId?: RoleId): ContractsRevenueSectionId {
  return roleDefaults[roleId ?? 'accountant'] ?? 'recognition_queue'
}

export async function getContractsRevenueTabs(filters: FinanceFilters, roleId?: RoleId): Promise<WorkspaceTabItem[]> {
  await ensureContractsRevenueState()
  await delay()

  const defaultSection = getContractsRevenueDefaultSection(roleId)
  const scopedContracts = contractStore.filter(contract => matchesFinanceFilters(contract, filters))
  const scopedSchedules = scheduleStore.filter(schedule => matchesFinanceFilters(schedule, filters))
  const scopedEvents = recognitionEventStore.filter(event => matchesFinanceFilters(event, filters))

  return [
    { id: 'contracts', label: 'Contracts', description: 'Commercial agreements and deferred balances.', count: scopedContracts.length, tone: defaultSection === 'contracts' ? 'accent' : 'neutral' },
    { id: 'revenue_schedules', label: 'Revenue Schedules', description: 'Schedule health and deferred roll-forward.', count: scopedSchedules.length, tone: defaultSection === 'revenue_schedules' ? 'accent' : 'neutral' },
    { id: 'recognition_queue', label: 'Recognition Queue', description: 'Revenue events ready to post.', count: scopedEvents.filter(event => event.status === 'queued').length, tone: defaultSection === 'recognition_queue' ? 'accent' : 'neutral' },
    { id: 'exceptions', label: 'Exceptions', description: 'Held items and policy exceptions.', count: scopedEvents.filter(event => event.status === 'held').length, tone: defaultSection === 'exceptions' ? 'accent' : 'neutral' },
  ]
}

export async function getContractsRevenueOverview(
  filters: FinanceFilters,
  roleId: RoleId = 'accountant'
): Promise<ModuleOverviewData> {
  await ensureContractsRevenueState()
  await delay()

  const scopedContracts = contractStore.filter(contract => matchesFinanceFilters(contract, filters))
  const scopedSchedules = scheduleStore.filter(schedule => matchesFinanceFilters(schedule, filters))
  const scopedEvents = recognitionEventStore.filter(event => matchesFinanceFilters(event, filters))

  return {
    moduleId: 'contracts-revenue',
    title: 'Contracts & Revenue',
    subtitle: 'Recognition queues, deferred balances, and contract exceptions in one accountant-ready workspace.',
    badge: roleId === 'cfo' ? 'Revenue Visibility' : roleId === 'controller' ? 'Recognition Assurance' : 'Recognition Operations',
    metrics: [
      { id: 'rev-queued', label: 'Queued Recognition', value: String(scopedEvents.filter(event => event.status === 'queued').length), detail: `${scopedEvents.filter(event => event.status === 'held').length} held`, tone: scopedEvents.some(event => event.status === 'held') ? 'critical' : 'warning' },
      { id: 'rev-deferred', label: 'Deferred Balance', value: formatMoney(scopedSchedules.reduce((sum, schedule) => sum + schedule.deferredBalance, 0)), detail: 'Visible deferred revenue in scope', tone: 'accent' },
      { id: 'rev-contracts', label: 'Active Contracts', value: String(scopedContracts.filter(contract => contract.status === 'active').length), detail: `${scopedContracts.filter(contract => contract.status === 'renewal_pending').length} renewal pending`, tone: 'positive' },
      { id: 'rev-recognized', label: 'Recognized To Date', value: formatMoney(scopedContracts.reduce((sum, contract) => sum + contract.recognizedRevenue, 0)), detail: 'Contract recognition completed to date', tone: 'neutral' },
    ],
    actions:
      roleId === 'cfo'
        ? [
            { id: 'new-contract', label: 'New Contract', icon: 'FilePlus2', tone: 'accent' },
            { id: 'open-report', label: 'Open Income Statement', href: '/reports/income-statement', icon: 'LineChart' },
          ]
        : [
            { id: 'post-recognition', label: 'Post Recognition', icon: 'BadgeCheck', tone: 'accent' },
            { id: 'new-contract', label: 'New Contract', icon: 'FilePlus2' },
            { id: 'open-report', label: 'Budget vs Actual', href: '/reports/budget-vs-actual', icon: 'LineChart' },
          ],
    sections: buildOverviewSections(filters),
  }
}

export async function getContractsWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery = {}
): Promise<WorkspaceListResponse<Contract>> {
  await ensureContractsRevenueState()
  await delay()

  const scopedRows = contractStore
    .filter(contract => matchesScopedRecord(contract, filters, query, contract.createdAt))
    .filter(contract =>
      matchesSearch(
        `${contract.number} ${contract.name} ${contract.customerName}`,
        query.search
      )
    )

  const sorted = sortItems(scopedRows, query.sort ?? defaultSorts.contracts)
  const paginated = paginate(sorted, query.page ?? 1, query.pageSize ?? 10)

  return {
    ...paginated,
    metrics: [
      { id: 'contract-visible', label: 'Visible Contracts', value: String(scopedRows.length), detail: `${scopedRows.filter(contract => contract.status === 'active').length} active`, tone: 'neutral' },
      { id: 'contract-value', label: 'Contract Value', value: formatMoney(scopedRows.reduce((sum, contract) => sum + contract.contractValue, 0)), detail: 'Total value in current scope', tone: 'accent' },
      { id: 'contract-deferred', label: 'Deferred Revenue', value: formatMoney(scopedRows.reduce((sum, contract) => sum + contract.deferredRevenue, 0)), detail: 'Unrecognized contract value', tone: 'warning' },
      { id: 'contract-renewal', label: 'Renewal Pending', value: String(scopedRows.filter(contract => contract.status === 'renewal_pending').length), detail: 'Contracts approaching renewal', tone: 'positive' },
    ],
    actions: [
      { id: 'new-contract', label: 'New Contract', icon: 'FilePlus2', tone: 'accent' },
    ],
    filters: buildFilterDefinitions(Array.from(new Set(scopedRows.map(contract => contract.status))), scopedRows),
    emptyMessage: 'No contracts match the current revenue filters.',
    defaultSort: defaultSorts.contracts,
  }
}

export async function getContractDetail(id: string): Promise<WorkspaceDetailData | null> {
  await ensureContractsRevenueState()
  await delay()
  const contract = contractStore.find(candidate => candidate.id === id)
  if (!contract) {
    return null
  }

  const schedule = scheduleStore.find(candidate => candidate.contractId === id)
  const obligations = obligationStore.filter(candidate => candidate.contractId === id)

  return {
    id: contract.id,
    title: `${contract.number} · ${contract.name}`,
    subtitle: `${contract.customerName} · ${entityMap.get(contract.entityId)?.name ?? contract.entityId}`,
    badges: [
      { id: 'status', label: contract.status, tone: getStatusTone(contract.status) },
      { id: 'billing', label: contract.billingFrequency, tone: 'neutral' },
    ],
    summary: [
      buildDetailField('value', 'Contract Value', formatMoney(contract.contractValue)),
      buildDetailField('recognized', 'Recognized', formatMoney(contract.recognizedRevenue)),
      buildDetailField('deferred', 'Deferred', formatMoney(contract.deferredRevenue)),
      buildDetailField('start', 'Start Date', formatDateLabel(contract.startDate)),
      buildDetailField('end', 'End Date', formatDateLabel(contract.endDate)),
      buildDetailField('created', 'Created', formatDateTimeLabel(contract.createdAt)),
    ],
    sections: [
      {
        id: 'schedule',
        title: 'Revenue Schedule',
        fields: schedule
          ? [
              buildDetailField('method', 'Recognition Method', schedule.recognitionMethod),
              buildDetailField('next-recognition', 'Next Recognition', formatDateLabel(schedule.nextRecognitionDate)),
              buildDetailField('schedule-status', 'Schedule Status', schedule.status, getStatusTone(schedule.status)),
            ]
          : [buildDetailField('schedule-missing', 'Schedule', 'No schedule found')],
      },
      {
        id: 'obligations',
        title: 'Performance Obligations',
        fields: obligations.map(obligation =>
          buildDetailField(obligation.id, obligation.name, `${obligation.satisfiedPercent}% satisfied · ${formatMoney(obligation.allocatedAmount)}`)
        ),
      },
    ],
    actions: [
      { id: 'new-contract', label: 'Duplicate Contract', icon: 'CopyPlus' },
    ],
    links: [{ id: 'contracts-home', label: 'Contracts Workspace', href: '/contracts-revenue', description: 'Return to the contracts workspace' }],
  }
}

export async function getRevenueSchedulesWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery = {}
): Promise<WorkspaceListResponse<RevenueSchedule>> {
  await ensureContractsRevenueState()
  await delay()

  const scopedRows = scheduleStore
    .filter(schedule => matchesScopedRecord(schedule, filters, query, schedule.nextRecognitionDate))
    .filter(schedule =>
      matchesSearch(
        `${schedule.contractNumber} ${schedule.contractName} ${schedule.customerName} ${schedule.recognitionMethod}`,
        query.search
      )
    )

  const sorted = sortItems(scopedRows, query.sort ?? defaultSorts.revenue_schedules)
  const paginated = paginate(sorted, query.page ?? 1, query.pageSize ?? 10)

  return {
    ...paginated,
    metrics: [
      { id: 'schedule-visible', label: 'Visible Schedules', value: String(scopedRows.length), detail: `${scopedRows.filter(schedule => schedule.status === 'hold').length} on hold`, tone: 'neutral' },
      { id: 'schedule-deferred', label: 'Deferred Balance', value: formatMoney(scopedRows.reduce((sum, schedule) => sum + schedule.deferredBalance, 0)), detail: 'Remaining deferred revenue', tone: 'warning' },
      { id: 'schedule-next', label: 'Due This Week', value: String(scopedRows.filter(schedule => schedule.nextRecognitionDate && schedule.nextRecognitionDate <= new Date('2026-04-11')).length), detail: 'Recognition events due soon', tone: 'accent' },
      { id: 'schedule-active', label: 'Active', value: String(scopedRows.filter(schedule => schedule.status === 'active').length), detail: 'Schedules running normally', tone: 'positive' },
    ],
    actions: [
      { id: 'post-recognition', label: 'Post Recognition', icon: 'BadgeCheck', tone: 'accent' },
    ],
    filters: buildFilterDefinitions(Array.from(new Set(scopedRows.map(schedule => schedule.status))), scopedRows),
    emptyMessage: 'No revenue schedules match the current filters.',
    defaultSort: defaultSorts.revenue_schedules,
  }
}

export async function getRevenueScheduleDetail(id: string): Promise<WorkspaceDetailData | null> {
  await ensureContractsRevenueState()
  await delay()
  const schedule = scheduleStore.find(candidate => candidate.id === id)
  if (!schedule) {
    return null
  }

  const lines = scheduleLineStore.filter(line => line.scheduleId === id)
  const events = recognitionEventStore.filter(event => event.scheduleId === id)

  return {
    id: schedule.id,
    title: `${schedule.contractNumber} · ${schedule.contractName}`,
    subtitle: `${schedule.customerName} revenue schedule`,
    badges: [
      { id: 'status', label: schedule.status, tone: getStatusTone(schedule.status) },
      { id: 'method', label: schedule.recognitionMethod, tone: 'neutral' },
    ],
    summary: [
      buildDetailField('total', 'Total Value', formatMoney(schedule.totalValue)),
      buildDetailField('recognized', 'Recognized To Date', formatMoney(schedule.recognizedToDate)),
      buildDetailField('deferred', 'Deferred Balance', formatMoney(schedule.deferredBalance)),
      buildDetailField('next', 'Next Recognition', formatDateLabel(schedule.nextRecognitionDate)),
    ],
    sections: [
      {
        id: 'lines',
        title: 'Schedule Lines',
        fields: lines.map(line =>
          buildDetailField(line.id, line.periodLabel, `${formatMoney(line.amount)} · ${line.status}`)
        ),
      },
      {
        id: 'events',
        title: 'Recognition Events',
        fields: events.map(event =>
          buildDetailField(event.id, formatDateLabel(event.recognitionDate), `${formatMoney(event.amount)} · ${event.status}`)
        ),
      },
    ],
    actions: [
      { id: 'post-recognition', label: 'Post Recognition', icon: 'BadgeCheck' },
    ],
    links: [{ id: 'contracts-home', label: 'Contracts Workspace', href: '/contracts-revenue', description: 'Return to the contracts workspace' }],
  }
}

export async function getRevenueRecognitionWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery = {},
  mode: 'queue' | 'exceptions' = 'queue'
): Promise<WorkspaceListResponse<RevenueRecognitionEvent>> {
  await ensureContractsRevenueState()
  await delay()

  const scopedRows = recognitionEventStore
    .filter(event => matchesScopedRecord(event, filters, query, event.recognitionDate))
    .filter(event => mode === 'queue' ? event.status === 'queued' : event.status === 'held')
    .filter(event => matchesSearch(`${event.contractNumber} ${event.description} ${event.exceptionReason ?? ''}`, query.search))

  const sorted = sortItems(scopedRows, query.sort ?? (mode === 'queue' ? defaultSorts.recognition_queue : defaultSorts.exceptions))
  const paginated = paginate(sorted, query.page ?? 1, query.pageSize ?? 10)

  return {
    ...paginated,
    metrics: [
      { id: `${mode}-visible`, label: mode === 'queue' ? 'Queued Events' : 'Exception Events', value: String(scopedRows.length), detail: mode === 'queue' ? 'Ready to post this period' : 'Held for policy or support issues', tone: mode === 'queue' ? 'warning' : 'critical' },
      { id: `${mode}-amount`, label: 'Visible Amount', value: formatMoney(scopedRows.reduce((sum, event) => sum + event.amount, 0)), detail: 'Current visible event value', tone: 'accent' },
      { id: `${mode}-this-week`, label: 'This Week', value: String(scopedRows.filter(event => event.recognitionDate <= new Date('2026-04-11')).length), detail: 'Recognition date inside seven days', tone: 'neutral' },
      { id: `${mode}-posted`, label: 'Posted Elsewhere', value: String(recognitionEventStore.filter(event => event.status === 'posted').length), detail: 'Reference volume already posted', tone: 'positive' },
    ],
    actions: [
      { id: 'post-recognition', label: 'Post Recognition', icon: 'BadgeCheck', tone: 'accent' },
      ...(mode === 'exceptions' ? [{ id: 'release-hold', label: 'Release Hold', icon: 'Undo2' }] : []),
    ],
    filters: buildFilterDefinitions(Array.from(new Set(scopedRows.map(event => event.status))), scopedRows.map(() => ({}))),
    emptyMessage: mode === 'queue' ? 'No revenue events are ready to post for the current scope.' : 'No held revenue exceptions match the current filters.',
    defaultSort: mode === 'queue' ? defaultSorts.recognition_queue : defaultSorts.exceptions,
  }
}

export async function getRevenueRecognitionDetail(id: string): Promise<WorkspaceDetailData | null> {
  await ensureContractsRevenueState()
  await delay()
  const event = recognitionEventStore.find(candidate => candidate.id === id)
  if (!event) {
    return null
  }

  const schedule = scheduleStore.find(candidate => candidate.id === event.scheduleId)
  const contract = contractStore.find(candidate => candidate.id === event.contractId)

  return {
    id: event.id,
    title: `${event.contractNumber} recognition`,
    subtitle: event.description,
    badges: [{ id: 'status', label: event.status, tone: getStatusTone(event.status) }],
    summary: [
      buildDetailField('date', 'Recognition Date', formatDateLabel(event.recognitionDate)),
      buildDetailField('amount', 'Amount', formatMoney(event.amount)),
      buildDetailField('created', 'Created', formatDateTimeLabel(event.createdAt)),
      buildDetailField('exception', 'Exception', event.exceptionReason ?? 'No exception'),
    ],
    sections: [
      {
        id: 'contract',
        title: 'Contract Context',
        fields: [
          buildDetailField('contract-name', 'Contract', contract?.name ?? event.contractNumber),
          buildDetailField('customer', 'Customer', contract?.customerName ?? schedule?.customerName ?? 'Unknown customer'),
          buildDetailField('schedule', 'Schedule Status', schedule?.status ?? 'Unknown', schedule?.status ? getStatusTone(schedule.status) : 'neutral'),
        ],
      },
    ],
    actions: [{ id: 'post-recognition', label: 'Post Recognition', icon: 'BadgeCheck' }],
    links: [{ id: 'contracts-home', label: 'Contracts Workspace', href: '/contracts-revenue', description: 'Return to the contracts workspace' }],
  }
}

export async function saveContract(
  input: Partial<Contract> & Pick<Contract, 'name' | 'customerId' | 'customerName' | 'entityId' | 'contractValue' | 'startDate' | 'endDate'>
): Promise<Contract> {
  await ensureContractsRevenueState()
  await delay()

  if (input.id) {
    const existing = contractStore.find(contract => contract.id === input.id)
    if (existing) {
      Object.assign(existing, input)
      await persistContractsRevenueState()
      return { ...existing }
    }
  }

  const created: Contract = {
    id: `ctr-${9000 + contractStore.length + 1}`,
    number: input.number ?? `CTR-${9000 + contractStore.length + 1}`,
    name: input.name,
    customerId: input.customerId,
    customerName: input.customerName,
    entityId: input.entityId,
    projectId: input.projectId,
    startDate: input.startDate,
    endDate: input.endDate,
    contractValue: input.contractValue,
    recognizedRevenue: input.recognizedRevenue ?? 0,
    deferredRevenue: input.deferredRevenue ?? input.contractValue,
    billingFrequency: input.billingFrequency ?? 'monthly',
    status: input.status ?? 'draft',
    createdAt: new Date(),
  }

  contractStore.unshift(created)
  await persistContractsRevenueState()
  return { ...created }
}

export async function postRevenueRecognition(eventId: string): Promise<RevenueRecognitionEvent | null> {
  await ensureContractsRevenueState()
  await delay()
  const event = recognitionEventStore.find(candidate => candidate.id === eventId)
  if (!event) {
    return null
  }

  event.status = 'posted'
  event.journalEntryId = event.journalEntryId ?? 'je-1002'

  const schedule = scheduleStore.find(candidate => candidate.id === event.scheduleId)
  if (schedule) {
    schedule.recognizedToDate += event.amount
    schedule.deferredBalance = Math.max(schedule.deferredBalance - event.amount, 0)
    schedule.status = schedule.deferredBalance === 0 ? 'completed' : 'active'
  }

  const contract = contractStore.find(candidate => candidate.id === event.contractId)
  if (contract) {
    contract.recognizedRevenue += event.amount
    contract.deferredRevenue = Math.max(contract.deferredRevenue - event.amount, 0)
  }

  const scheduleLine = scheduleLineStore.find(candidate => candidate.scheduleId === event.scheduleId && candidate.recognitionDate.getTime() === event.recognitionDate.getTime())
  if (scheduleLine) {
    scheduleLine.status = 'posted'
    scheduleLine.journalEntryId = event.journalEntryId
  }

  await persistContractsRevenueState()
  return { ...event }
}

export async function releaseRevenueRecognitionHold(eventId: string): Promise<RevenueRecognitionEvent | null> {
  await ensureContractsRevenueState()
  await delay()
  const event = recognitionEventStore.find(candidate => candidate.id === eventId)
  if (!event) {
    return null
  }

  event.status = 'queued'
  event.exceptionReason = undefined

  const schedule = scheduleStore.find(candidate => candidate.id === event.scheduleId)
  if (schedule && schedule.status === 'hold') {
    schedule.status = 'active'
  }

  const scheduleLine = scheduleLineStore.find(candidate => candidate.scheduleId === event.scheduleId && candidate.recognitionDate.getTime() === event.recognitionDate.getTime())
  if (scheduleLine && scheduleLine.status === 'held') {
    scheduleLine.status = 'ready'
    scheduleLine.note = 'Hold released from contracts workspace.'
  }

  await persistContractsRevenueState()
  return { ...event }
}
