import {
  assetBooks,
  assetLifecycleEvents,
  depreciationScheduleLines,
  fixedAssets,
} from '@/lib/mock-data/fixed-assets'
import { entities } from '@/lib/mock-data/organization'
import type {
  AssetBook,
  AssetLifecycleEvent,
  DepreciationPreview,
  DepreciationScheduleLine,
  FinanceFilters,
  FixedAsset,
  FixedAssetsSectionId,
  ModuleOverviewData,
  RoleId,
  SortConfig,
  WorkspaceDetailData,
  WorkspaceFilterDefinition,
  WorkspaceListResponse,
  WorkspaceTabItem,
} from '@/lib/types'
import { delay, isInDateRange, matchesFinanceFilters, paginate, sortItems } from './base'
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

const fixedAssetStore = fixedAssets.map(asset => ({ ...asset }))
const assetBookStore = assetBooks.map(book => ({ ...book }))
const depreciationStore = depreciationScheduleLines.map(line => ({ ...line }))
const lifecycleStore = assetLifecycleEvents.map(event => ({ ...event }))

const entityMap = new Map(entities.map(entity => [entity.id, entity]))

const defaultSorts: Record<FixedAssetsSectionId, SortConfig> = {
  asset_register: { key: 'updatedAt', direction: 'desc' },
  depreciation: { key: 'scheduledDate', direction: 'asc' },
  lifecycle_events: { key: 'eventDate', direction: 'desc' },
}

const roleDefaults: Record<RoleId, FixedAssetsSectionId> = {
  accountant: 'asset_register',
  ap_specialist: 'asset_register',
  ar_specialist: 'asset_register',
  controller: 'depreciation',
  cfo: 'asset_register',
  admin: 'asset_register',
  ap_clerk: 'asset_register',
  ar_clerk: 'asset_register',
  viewer: 'asset_register',
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
        ...Array.from(new Set(rows.map(row => row.departmentId).filter(Boolean))).map(id => ({
          value: id as string,
          label: id === 'd-fin' ? 'Finance' : id === 'd-it' ? 'IT' : 'Operations',
        })),
      ],
    },
    {
      id: 'projectId',
      label: 'Project',
      options: [
        { value: 'all', label: 'All Projects' },
        ...Array.from(new Set(rows.map(row => row.projectId).filter(Boolean))).map(id => ({
          value: id as string,
          label: id === 'p-close' ? 'Q1 Close Acceleration' : 'ERP Data Migration',
        })),
      ],
    },
  ]
}

function buildOverviewSections(filters: FinanceFilters) {
  const flaggedAssets = fixedAssetStore
    .filter(asset => matchesFinanceFilters(asset, filters))
    .filter(asset => asset.capitalizationStatus !== 'capitalized' || asset.status === 'hold')
    .slice(0, 3)

  const depreciationExceptions = depreciationStore
    .filter(line => matchesFinanceFilters(line, filters))
    .filter(line => line.status === 'exception')
    .slice(0, 3)

  return [
    {
      id: 'asset-queue',
      title: 'Capitalization Queue',
      description: 'Assets waiting on metadata, approval, or placement in service.',
      rows: flaggedAssets.map(asset =>
        buildOverviewRow(asset.id, `${asset.assetNumber} · ${asset.name}`, {
          value: formatMoney(asset.cost),
          status: asset.capitalizationStatus,
          statusTone: asset.capitalizationStatus === 'needs_review' ? 'critical' : asset.capitalizationStatus === 'queued' ? 'warning' : 'positive',
          meta: [asset.departmentName ?? 'Shared', asset.projectName ?? 'No project'],
          href: '/fixed-assets',
        })
      ),
    },
    {
      id: 'depreciation-exceptions',
      title: 'Depreciation Exceptions',
      description: 'Runs that still need accountant cleanup before period close.',
      rows: depreciationExceptions.map(line =>
        buildOverviewRow(line.id, `${line.assetName} · ${line.periodLabel}`, {
          value: formatMoney(line.depreciationAmount),
          status: line.status,
          statusTone: 'critical',
          meta: [line.bookName, formatDateLabel(line.scheduledDate)],
          href: '/fixed-assets',
        })
      ),
    },
  ]
}

export function getFixedAssetsDefaultSection(roleId?: RoleId): FixedAssetsSectionId {
  return roleDefaults[roleId ?? 'accountant'] ?? 'asset_register'
}

export async function getFixedAssetsTabs(filters: FinanceFilters, roleId?: RoleId): Promise<WorkspaceTabItem[]> {
  await delay()

  const defaultSection = getFixedAssetsDefaultSection(roleId)
  const scopedAssets = fixedAssetStore.filter(asset => matchesFinanceFilters(asset, filters))
  const scopedDepreciation = depreciationStore.filter(line => matchesFinanceFilters(line, filters))
  const scopedLifecycle = lifecycleStore.filter(event => matchesFinanceFilters(event, filters))

  return [
    { id: 'asset_register', label: 'Asset Register', description: 'Capitalization and metadata control.', count: scopedAssets.length, tone: defaultSection === 'asset_register' ? 'accent' : 'neutral' },
    { id: 'depreciation', label: 'Depreciation', description: 'Current period depreciation runs.', count: scopedDepreciation.length, tone: defaultSection === 'depreciation' ? 'accent' : 'neutral' },
    { id: 'lifecycle_events', label: 'Lifecycle Events', description: 'Transfers, disposals, and changes.', count: scopedLifecycle.length, tone: defaultSection === 'lifecycle_events' ? 'accent' : 'neutral' },
  ]
}

export async function getFixedAssetsOverview(
  filters: FinanceFilters,
  roleId: RoleId = 'accountant'
): Promise<ModuleOverviewData> {
  await delay()

  const scopedAssets = fixedAssetStore.filter(asset => matchesFinanceFilters(asset, filters))
  const scopedDepreciation = depreciationStore.filter(line => matchesFinanceFilters(line, filters))
  const pendingCapitalization = scopedAssets.filter(asset => asset.capitalizationStatus !== 'capitalized').length
  const depreciationExceptions = scopedDepreciation.filter(line => line.status === 'exception').length
  const disposalReady = scopedAssets.filter(asset => asset.status === 'hold' || asset.status === 'disposed').length

  return {
    moduleId: 'fixed-assets',
    title: 'Fixed Assets',
    subtitle: 'Capitalization, depreciation, and lifecycle control from one accountant-friendly register.',
    badge: roleId === 'controller' ? 'Depreciation Assurance' : 'Asset Operations',
    metrics: [
      { id: 'fa-pending', label: 'Pending Capitalization', value: String(pendingCapitalization), detail: 'Assets queued or missing metadata', tone: pendingCapitalization ? 'warning' : 'positive' },
      { id: 'fa-exceptions', label: 'Depreciation Exceptions', value: String(depreciationExceptions), detail: 'Runs still blocked before close', tone: depreciationExceptions ? 'critical' : 'positive' },
      { id: 'fa-net-book', label: 'Net Book Value', value: formatMoney(scopedAssets.reduce((sum, asset) => sum + asset.netBookValue, 0)), detail: 'Visible assets in current scope', tone: 'accent' },
      { id: 'fa-disposal', label: 'Disposal Readiness', value: String(disposalReady), detail: 'Held or disposed assets to review', tone: 'neutral' },
    ],
    actions:
      roleId === 'controller'
        ? [
            { id: 'preview-depreciation', label: 'Preview Depreciation', icon: 'Calculator', tone: 'accent' },
            { id: 'asset-register', label: 'Open Register', href: '/fixed-assets', icon: 'ListTree' },
          ]
        : [
            { id: 'new-fixed-asset', label: 'Add Asset', icon: 'FilePlus2', tone: 'accent' },
            { id: 'preview-depreciation', label: 'Preview Depreciation', icon: 'Calculator' },
            { id: 'asset-register', label: 'Asset Register', href: '/fixed-assets', icon: 'ListTree' },
          ],
    sections: buildOverviewSections(filters),
  }
}

export async function getFixedAssetsWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery = {}
): Promise<WorkspaceListResponse<FixedAsset>> {
  await delay()

  const scopedRows = fixedAssetStore
    .filter(asset => matchesScopedRecord(asset, filters, query, asset.updatedAt))
    .filter(asset =>
      matchesSearch(
        `${asset.assetNumber} ${asset.name} ${asset.vendorName ?? ''} ${asset.locationName ?? ''}`,
        query.search
      )
    )

  const sorted = sortItems(scopedRows, query.sort ?? defaultSorts.asset_register)
  const paginated = paginate(sorted, query.page ?? 1, query.pageSize ?? 10)

  return {
    ...paginated,
    metrics: [
      { id: 'fa-visible', label: 'Visible Assets', value: String(scopedRows.length), detail: `${scopedRows.filter(asset => asset.status === 'disposed').length} disposed`, tone: 'neutral' },
      { id: 'fa-queued', label: 'Needs Attention', value: String(scopedRows.filter(asset => asset.capitalizationStatus !== 'capitalized' || asset.status === 'hold').length), detail: 'Queued or held assets', tone: 'warning' },
      { id: 'fa-cost', label: 'Gross Cost', value: formatMoney(scopedRows.reduce((sum, asset) => sum + asset.cost, 0)), detail: 'Capitalized cost in view', tone: 'accent' },
      { id: 'fa-nbv', label: 'Net Book Value', value: formatMoney(scopedRows.reduce((sum, asset) => sum + asset.netBookValue, 0)), detail: 'Remaining book value', tone: 'positive' },
    ],
    actions: [
      { id: 'new-fixed-asset', label: 'Add Asset', icon: 'FilePlus2', tone: 'accent' },
      { id: 'preview-depreciation', label: 'Preview Depreciation', icon: 'Calculator' },
    ],
    filters: buildFilterDefinitions(Array.from(new Set(scopedRows.map(asset => asset.status))), scopedRows),
    emptyMessage: 'No fixed assets match the current register filters.',
    defaultSort: defaultSorts.asset_register,
  }
}

export async function getFixedAssetDetail(id: string): Promise<WorkspaceDetailData | null> {
  await delay()
  const asset = fixedAssetStore.find(candidate => candidate.id === id)
  if (!asset) {
    return null
  }

  const book = assetBookStore.find(candidate => candidate.assetId === id)
  const depreciationLines = depreciationStore.filter(line => line.assetId === id)
  const lifecycleEvents = lifecycleStore.filter(event => event.assetId === id)

  return {
    id: asset.id,
    title: `${asset.assetNumber} · ${asset.name}`,
    subtitle: `${asset.category} asset in ${entityMap.get(asset.entityId)?.name ?? asset.entityId}`,
    badges: [
      { id: 'status', label: asset.status, tone: getStatusTone(asset.status) },
      { id: 'capitalization', label: asset.capitalizationStatus, tone: asset.capitalizationStatus === 'capitalized' ? 'positive' : asset.capitalizationStatus === 'queued' ? 'warning' : 'critical' },
    ],
    summary: [
      buildDetailField('cost', 'Cost', formatMoney(asset.cost)),
      buildDetailField('acc-dep', 'Accumulated Depreciation', formatMoney(asset.accumulatedDepreciation)),
      buildDetailField('nbv', 'Net Book Value', formatMoney(asset.netBookValue)),
      buildDetailField('in-service', 'In Service', formatDateLabel(asset.inServiceDate)),
      buildDetailField('book', 'Book', asset.bookName),
      buildDetailField('updated', 'Updated', formatDateTimeLabel(asset.updatedAt)),
    ],
    sections: [
      {
        id: 'book',
        title: 'Book Attributes',
        fields: book
          ? [
              buildDetailField('book-type', 'Book Type', book.bookType),
              buildDetailField('method', 'Depreciation Method', book.depreciationMethod.replace(/_/g, ' ')),
              buildDetailField('life', 'Useful Life', `${book.usefulLifeMonths} months`),
            ]
          : [buildDetailField('book-missing', 'Book', 'No active book found')],
      },
      {
        id: 'depreciation',
        title: 'Depreciation Schedule',
        fields: depreciationLines.map(line =>
          buildDetailField(line.id, line.periodLabel, `${formatMoney(line.depreciationAmount)} · ${line.status}`)
        ),
      },
      {
        id: 'lifecycle',
        title: 'Lifecycle Events',
        fields: lifecycleEvents.map(event =>
          buildDetailField(event.id, `${event.eventType} · ${formatDateLabel(event.eventDate)}`, event.description)
        ),
      },
    ],
    actions: [
      { id: 'preview-depreciation', label: 'Preview Depreciation', icon: 'Calculator' },
      ...(asset.status !== 'disposed' ? [{ id: 'dispose-asset', label: 'Dispose Asset', icon: 'ArchiveX' }] : []),
      ...(asset.status === 'active' ? [{ id: 'activate-asset', label: 'Place In Service', icon: 'BadgeCheck' }] : []),
    ],
    links: [
      { id: 'fixed-assets-home', label: 'Fixed Assets Workspace', href: '/fixed-assets', description: 'Return to the asset register' },
    ],
  }
}

export async function getDepreciationWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery = {}
): Promise<WorkspaceListResponse<DepreciationScheduleLine>> {
  await delay()

  const scopedRows = depreciationStore
    .filter(line => matchesScopedRecord(line, filters, query, line.scheduledDate))
    .filter(line => matchesSearch(`${line.assetName} ${line.periodLabel} ${line.bookName}`, query.search))

  const sorted = sortItems(scopedRows, query.sort ?? defaultSorts.depreciation)
  const paginated = paginate(sorted, query.page ?? 1, query.pageSize ?? 10)

  return {
    ...paginated,
    metrics: [
      { id: 'dep-visible', label: 'Visible Runs', value: String(scopedRows.length), detail: `${scopedRows.filter(line => line.status === 'posted').length} posted`, tone: 'neutral' },
      { id: 'dep-exception', label: 'Exceptions', value: String(scopedRows.filter(line => line.status === 'exception').length), detail: 'Need metadata or timing cleanup', tone: 'critical' },
      { id: 'dep-amount', label: 'Scheduled Amount', value: formatMoney(scopedRows.reduce((sum, line) => sum + line.depreciationAmount, 0)), detail: 'Current visible run value', tone: 'accent' },
      { id: 'dep-posted', label: 'Posted', value: String(scopedRows.filter(line => line.status === 'posted').length), detail: 'Already reflected in GL', tone: 'positive' },
    ],
    actions: [
      { id: 'preview-depreciation', label: 'Preview Depreciation', icon: 'Calculator', tone: 'accent' },
    ],
    filters: buildFilterDefinitions(Array.from(new Set(scopedRows.map(line => line.status))), scopedRows),
    emptyMessage: 'No depreciation rows match the current filters.',
    defaultSort: defaultSorts.depreciation,
  }
}

export async function getDepreciationRunDetail(id: string): Promise<WorkspaceDetailData | null> {
  await delay()
  const line = depreciationStore.find(candidate => candidate.id === id)
  if (!line) {
    return null
  }

  const asset = fixedAssetStore.find(candidate => candidate.id === line.assetId)

  return {
    id: line.id,
    title: `${line.assetName} · ${line.periodLabel}`,
    subtitle: `Depreciation run in ${line.bookName}`,
    badges: [{ id: 'status', label: line.status, tone: getStatusTone(line.status) }],
    summary: [
      buildDetailField('amount', 'Amount', formatMoney(line.depreciationAmount)),
      buildDetailField('scheduled', 'Scheduled Date', formatDateLabel(line.scheduledDate)),
      buildDetailField('book', 'Book', line.bookName),
      buildDetailField('ending-book-value', 'Ending Book Value', formatMoney(line.endingBookValue)),
    ],
    sections: [
      {
        id: 'asset',
        title: 'Asset Context',
        fields: asset
          ? [
              buildDetailField('asset-number', 'Asset', `${asset.assetNumber} · ${asset.name}`),
              buildDetailField('cost', 'Cost', formatMoney(asset.cost)),
              buildDetailField('nbv', 'Current NBV', formatMoney(asset.netBookValue)),
            ]
          : [buildDetailField('asset-missing', 'Asset', 'No linked asset found')],
      },
    ],
    actions: [{ id: 'preview-depreciation', label: 'Preview Again', icon: 'Calculator' }],
    links: [{ id: 'fixed-assets-home', label: 'Fixed Assets Workspace', href: '/fixed-assets', description: 'Return to the fixed assets workspace' }],
  }
}

export async function getAssetLifecycleWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery = {}
): Promise<WorkspaceListResponse<AssetLifecycleEvent>> {
  await delay()

  const scopedRows = lifecycleStore
    .filter(event => matchesScopedRecord(event, filters, query, event.eventDate))
    .filter(event => matchesSearch(`${event.assetName} ${event.description} ${event.userName}`, query.search))

  const sorted = sortItems(scopedRows, query.sort ?? defaultSorts.lifecycle_events)
  const paginated = paginate(sorted, query.page ?? 1, query.pageSize ?? 10)

  return {
    ...paginated,
    metrics: [
      { id: 'life-visible', label: 'Visible Events', value: String(scopedRows.length), detail: `${scopedRows.filter(event => event.status === 'exception').length} exceptions`, tone: 'neutral' },
      { id: 'life-disposals', label: 'Disposals', value: String(scopedRows.filter(event => event.eventType === 'disposed').length), detail: 'Assets retired in scope', tone: 'accent' },
      { id: 'life-pending', label: 'Pending Actions', value: String(scopedRows.filter(event => event.status === 'pending').length), detail: 'Still awaiting completion', tone: 'warning' },
      { id: 'life-exception', label: 'Exception Events', value: String(scopedRows.filter(event => event.status === 'exception').length), detail: 'Need controller review', tone: 'critical' },
    ],
    actions: [
      { id: 'new-fixed-asset', label: 'Add Asset', icon: 'FilePlus2', tone: 'accent' },
    ],
    filters: buildFilterDefinitions(Array.from(new Set(scopedRows.map(event => event.status))), scopedRows.map(() => ({}))),
    emptyMessage: 'No lifecycle events match the current filters.',
    defaultSort: defaultSorts.lifecycle_events,
  }
}

export async function getAssetLifecycleEventDetail(id: string): Promise<WorkspaceDetailData | null> {
  await delay()
  const event = lifecycleStore.find(candidate => candidate.id === id)
  if (!event) {
    return null
  }

  const asset = fixedAssetStore.find(candidate => candidate.id === event.assetId)

  return {
    id: event.id,
    title: `${event.assetName} · ${event.eventType}`,
    subtitle: event.description,
    badges: [{ id: 'status', label: event.status, tone: getStatusTone(event.status) }],
    summary: [
      buildDetailField('date', 'Event Date', formatDateLabel(event.eventDate)),
      buildDetailField('amount', 'Amount', formatMoney(event.amount ?? 0)),
      buildDetailField('user', 'Updated By', event.userName),
    ],
    sections: [
      {
        id: 'asset-context',
        title: 'Asset Context',
        fields: asset
          ? [
              buildDetailField('asset', 'Asset', `${asset.assetNumber} · ${asset.name}`),
              buildDetailField('entity', 'Entity', entityMap.get(asset.entityId)?.name ?? asset.entityId),
              buildDetailField('nbv', 'Net Book Value', formatMoney(asset.netBookValue)),
            ]
          : [buildDetailField('asset-missing', 'Asset', 'No linked asset found')],
      },
    ],
    actions: [{ id: 'new-fixed-asset', label: 'Add Related Asset', icon: 'FilePlus2' }],
    links: [{ id: 'fixed-assets-home', label: 'Fixed Assets Workspace', href: '/fixed-assets', description: 'Return to the fixed assets workspace' }],
  }
}

export async function saveFixedAsset(
  input: Partial<FixedAsset> & Pick<FixedAsset, 'name' | 'entityId' | 'category' | 'cost'>
): Promise<FixedAsset> {
  await delay()

  if (input.id) {
    const existing = fixedAssetStore.find(asset => asset.id === input.id)
    if (existing) {
      Object.assign(existing, input, { updatedAt: new Date() })
      return { ...existing }
    }
  }

  const created: FixedAsset = {
    id: `fa-${1000 + fixedAssetStore.length + 1}`,
    assetNumber: input.assetNumber ?? `FA-${1000 + fixedAssetStore.length + 1}`,
    name: input.name,
    entityId: input.entityId,
    departmentId: input.departmentId,
    departmentName: input.departmentName,
    projectId: input.projectId,
    projectName: input.projectName,
    category: input.category,
    status: input.status ?? 'active',
    capitalizationStatus: input.capitalizationStatus ?? 'queued',
    acquisitionDate: input.acquisitionDate ?? new Date(),
    inServiceDate: input.inServiceDate,
    cost: input.cost,
    accumulatedDepreciation: input.accumulatedDepreciation ?? 0,
    netBookValue: input.netBookValue ?? input.cost,
    salvageValue: input.salvageValue ?? 0,
    usefulLifeMonths: input.usefulLifeMonths ?? 60,
    depreciationMethod: input.depreciationMethod ?? 'straight_line',
    bookId: input.bookId ?? 'book-corp-us',
    bookName: input.bookName ?? 'Corporate Book',
    vendorName: input.vendorName,
    locationName: input.locationName,
    serialNumber: input.serialNumber,
    updatedAt: new Date(),
  }

  fixedAssetStore.unshift(created)
  lifecycleStore.unshift({
    id: `fa-event-${lifecycleStore.length + 1}`,
    assetId: created.id,
    assetName: created.name,
    entityId: created.entityId,
    eventType: 'created',
    eventDate: new Date(),
    description: 'Asset record created from workspace action.',
    status: 'completed',
    amount: created.cost,
    userName: 'Ava Mitchell',
  })

  return { ...created }
}

export async function runDepreciationPreview(assetId: string): Promise<DepreciationPreview | null> {
  await delay()
  const asset = fixedAssetStore.find(candidate => candidate.id === assetId)
  if (!asset) {
    return null
  }

  const monthlyAmount = Math.max((asset.cost - asset.salvageValue) / asset.usefulLifeMonths, 0)

  return {
    assetId: asset.id,
    assetName: asset.name,
    nextPeriodAmount: Number(monthlyAmount.toFixed(2)),
    remainingLifeMonths: Math.max(asset.usefulLifeMonths - Math.round(asset.accumulatedDepreciation / Math.max(monthlyAmount, 1)), 0),
    projectedEndValue: Math.max(asset.netBookValue - monthlyAmount, asset.salvageValue),
  }
}

export async function disposeFixedAsset(id: string): Promise<FixedAsset | null> {
  await delay()
  const asset = fixedAssetStore.find(candidate => candidate.id === id)
  if (!asset) {
    return null
  }

  asset.status = 'disposed'
  asset.capitalizationStatus = 'capitalized'
  asset.updatedAt = new Date()

  lifecycleStore.unshift({
    id: `fa-event-${lifecycleStore.length + 1}`,
    assetId: asset.id,
    assetName: asset.name,
    entityId: asset.entityId,
    eventType: 'disposed',
    eventDate: new Date(),
    description: 'Asset disposed from the fixed assets workspace.',
    status: 'completed',
    amount: asset.netBookValue,
    userName: 'Ava Mitchell',
  })

  return { ...asset }
}
