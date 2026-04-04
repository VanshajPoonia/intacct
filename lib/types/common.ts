export type DateRangePreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'this_quarter'
  | 'this_year'
  | 'last_month'
  | 'last_quarter'
  | 'last_year'
  | 'custom'

export interface DateRangeFilter {
  startDate: Date
  endDate: Date
  preset?: DateRangePreset
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface VersionHistoryItem {
  id: string
  entityType: string
  entityId: string
  version: number
  changedAt: Date
  changedBy: string
  changedByName: string
  summary: string
  changes: {
    field: string
    oldValue?: string
    newValue?: string
  }[]
}
