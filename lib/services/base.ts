import type { DateRangeFilter, FinanceFilters, PaginatedResponse, SortConfig } from '@/lib/types'

const SIMULATED_DELAY = 50

const ENTITY_WEIGHTS: Record<string, number> = {
  e1: 0.58,
  e2: 0.27,
  e3: 0.15,
}

function normalizeFilterValues(single?: string, multiple?: string[]) {
  return unique([single, ...(multiple ?? [])].filter(Boolean)) as string[]
}

function matchesScopedValue(
  recordValue: string | undefined,
  single?: string,
  multiple?: string[],
  options?: {
    allowMissing?: boolean
    treatConsolidatedEntityAsAll?: boolean
  }
) {
  const allowedValues = normalizeFilterValues(single, multiple)
  if (!allowedValues.length) {
    return true
  }

  if (options?.treatConsolidatedEntityAsAll && allowedValues.includes('e4')) {
    return true
  }

  if (!recordValue) {
    return options?.allowMissing ?? true
  }

  return allowedValues.includes(recordValue)
}

export async function delay(ms: number = SIMULATED_DELAY) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

export function getEntityWeight(entityId?: string) {
  if (!entityId || entityId === 'e4') {
    return 1
  }
  return ENTITY_WEIGHTS[entityId] ?? 1
}

export function isInDateRange(date: Date, range?: DateRangeFilter) {
  if (!range) {
    return true
  }
  return date >= range.startDate && date <= range.endDate
}

export function matchesFinanceFilters(
  record: {
    entityId?: string
    departmentId?: string
    locationId?: string
    projectId?: string
    customerId?: string
    vendorId?: string
    employeeId?: string
    status?: string
  },
  filters?: Partial<FinanceFilters>
) {
  if (!filters) {
    return true
  }

  if (!matchesScopedValue(record.entityId, filters.entityId, filters.entityIds, { treatConsolidatedEntityAsAll: true })) {
    return false
  }

  if (!matchesScopedValue(record.departmentId, filters.departmentId, filters.departmentIds)) {
    return false
  }

  if (!matchesScopedValue(record.locationId, filters.locationId, filters.locationIds)) {
    return false
  }

  if (!matchesScopedValue(record.projectId, filters.projectId, filters.projectIds)) {
    return false
  }

  if (!matchesScopedValue(record.customerId, filters.customerId)) {
    return false
  }

  if (!matchesScopedValue(record.vendorId, filters.vendorId)) {
    return false
  }

  if (!matchesScopedValue(record.employeeId, filters.employeeId)) {
    return false
  }

  if (!matchesScopedValue(record.status, undefined, filters.status)) {
    return false
  }

  return true
}

export function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResponse<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = (safePage - 1) * pageSize

  return {
    data: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  }
}

export function sortItems<T>(items: T[], sort?: SortConfig) {
  if (!sort) {
    return items
  }

  return [...items].sort((left, right) => {
    const leftRecord = left as Record<string, unknown>
    const rightRecord = right as Record<string, unknown>
    const leftValue = leftRecord[sort.key]
    const rightValue = rightRecord[sort.key]

    if (leftValue instanceof Date && rightValue instanceof Date) {
      return sort.direction === 'asc'
        ? leftValue.getTime() - rightValue.getTime()
        : rightValue.getTime() - leftValue.getTime()
    }

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return sort.direction === 'asc' ? leftValue - rightValue : rightValue - leftValue
    }

    const leftString = String(leftValue ?? '').toLowerCase()
    const rightString = String(rightValue ?? '').toLowerCase()
    if (leftString === rightString) {
      return 0
    }

    const comparison = leftString > rightString ? 1 : -1
    return sort.direction === 'asc' ? comparison : -comparison
  })
}

export function getDateRangeFactor(range: DateRangeFilter) {
  if (range.preset === 'this_month' || range.preset === 'last_month') {
    return 1 / 12
  }
  if (range.preset === 'this_quarter' || range.preset === 'last_quarter') {
    return 1 / 4
  }
  if (range.preset === 'today') {
    return 1 / 365
  }
  if (range.preset === 'this_week') {
    return 7 / 365
  }

  const diff = Math.max(range.endDate.getTime() - range.startDate.getTime(), 1)
  const days = diff / (1000 * 60 * 60 * 24)
  return Math.min(Math.max(days / 365, 0.05), 1)
}

export function unique<T>(items: T[]) {
  return Array.from(new Set(items))
}
