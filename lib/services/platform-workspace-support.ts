import { departments, entities, projects } from '@/lib/mock-data/organization'
import type {
  FinanceFilters,
  PlatformWorkspaceQuery,
  PlatformWorkspaceRecord,
  SortConfig,
  WorkspaceColumnDefinition,
  WorkspaceFilterDefinition,
} from '@/lib/types'
import { isInDateRange, matchesFinanceFilters, paginate, sortItems, unique } from './base'

const entityMap = new Map(entities.map(entity => [entity.id, entity]))
const departmentMap = new Map(departments.map(department => [department.id, department]))
const projectMap = new Map(projects.map(project => [project.id, project]))

export function matchesSearch(values: Array<string | undefined>, search?: string) {
  if (!search?.trim()) {
    return true
  }

  const normalizedSearch = search.trim().toLowerCase()
  return values.some(value => value?.toLowerCase().includes(normalizedSearch))
}

export function matchesQueryFilter(
  query: PlatformWorkspaceQuery,
  key: string,
  value?: string
) {
  const filterValue = query.filters?.[key]
  if (!filterValue || filterValue === 'all') {
    return true
  }

  return filterValue === value
}

export function buildColumn(
  id: WorkspaceColumnDefinition['id'],
  label: string,
  sortKey?: string,
  align?: WorkspaceColumnDefinition['align'],
  widthClassName?: string
): WorkspaceColumnDefinition {
  return {
    id,
    label,
    sortKey,
    align,
    widthClassName,
  }
}

export function buildFilterDefinition(
  id: string,
  label: string,
  values: Array<{ value: string; label: string }>
): WorkspaceFilterDefinition {
  return {
    id,
    label,
    options: [{ value: 'all', label: `All ${label}` }, ...values],
  }
}

export function buildScopedFilters(
  rows: Array<{ entityId?: string; departmentId?: string; projectId?: string }>
): WorkspaceFilterDefinition[] {
  const scopedEntities = unique(rows.map(row => row.entityId).filter(Boolean) as string[])
    .map(id => entityMap.get(id))
    .filter(Boolean)
    .map(entity => ({ value: entity!.id, label: entity!.name }))

  const scopedDepartments = unique(rows.map(row => row.departmentId).filter(Boolean) as string[])
    .map(id => departmentMap.get(id))
    .filter(Boolean)
    .map(department => ({ value: department!.id, label: department!.name }))

  const scopedProjects = unique(rows.map(row => row.projectId).filter(Boolean) as string[])
    .map(id => projectMap.get(id))
    .filter(Boolean)
    .map(project => ({ value: project!.id, label: project!.name }))

  return [
    buildFilterDefinition('entityId', 'Entities', scopedEntities),
    buildFilterDefinition('departmentId', 'Departments', scopedDepartments),
    buildFilterDefinition('projectId', 'Projects', scopedProjects),
  ]
}

export function matchesScopedFilters(
  record: {
    entityId?: string
    departmentId?: string
    projectId?: string
  },
  filters: FinanceFilters,
  query: PlatformWorkspaceQuery,
  date?: Date
) {
  if (!matchesFinanceFilters(record, filters)) {
    return false
  }

  if (!matchesQueryFilter(query, 'entityId', record.entityId)) {
    return false
  }

  if (!matchesQueryFilter(query, 'departmentId', record.departmentId)) {
    return false
  }

  if (!matchesQueryFilter(query, 'projectId', record.projectId)) {
    return false
  }

  if (date && !isInDateRange(date, filters.dateRange)) {
    return false
  }

  return true
}

export function finalizePlatformRows(
  rows: PlatformWorkspaceRecord[],
  query: PlatformWorkspaceQuery,
  defaultSort: SortConfig
) {
  const sort = query.sort ?? defaultSort
  const paginated = paginate(sortItems(rows, sort), query.page ?? 1, query.pageSize ?? 15)

  return {
    ...paginated,
    defaultSort,
  }
}
