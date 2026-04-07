import type { SortConfig } from './common'
import type { ShellRouteLink } from './ui'

export type WorkspaceTone = 'neutral' | 'accent' | 'positive' | 'warning' | 'critical'

export interface WorkspaceMetricCard {
  id: string
  label: string
  value: string
  detail?: string
  href?: string
  tone?: WorkspaceTone
}

export interface WorkspaceAction {
  id: string
  label: string
  icon?: string
  href?: string
  tone?: WorkspaceTone
}

export interface WorkspaceOption {
  value: string
  label: string
}

export interface WorkspaceOverviewRow {
  id: string
  title: string
  description?: string
  value?: string
  href?: string
  status?: string
  statusTone?: WorkspaceTone
  meta?: string[]
}

export interface WorkspaceOverviewSection {
  id: string
  title: string
  description?: string
  rows: WorkspaceOverviewRow[]
}

export interface ModuleOverviewData {
  moduleId: string
  title: string
  subtitle: string
  badge: string
  metrics: WorkspaceMetricCard[]
  actions: WorkspaceAction[]
  sections: WorkspaceOverviewSection[]
}

export interface WorkspaceFilterDefinition {
  id: string
  label: string
  options: WorkspaceOption[]
}

export interface WorkspaceColumnDefinition {
  id: string
  label: string
  sortKey?: string
  align?: 'left' | 'right' | 'center'
  widthClassName?: string
}

export interface WorkspaceListResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  metrics: WorkspaceMetricCard[]
  actions: WorkspaceAction[]
  filters: WorkspaceFilterDefinition[]
  emptyMessage: string
  defaultSort: SortConfig
}

export interface WorkspaceDetailBadge {
  id: string
  label: string
  tone?: WorkspaceTone
}

export interface WorkspaceDetailField {
  id: string
  label: string
  value: string
  tone?: WorkspaceTone
}

export interface WorkspaceDetailSection {
  id: string
  title: string
  fields: WorkspaceDetailField[]
}

export interface WorkspaceDetailAction {
  id: string
  label: string
  icon?: string
}

export interface WorkspaceDetailData {
  id: string
  title: string
  subtitle: string
  badges: WorkspaceDetailBadge[]
  summary: WorkspaceDetailField[]
  sections: WorkspaceDetailSection[]
  actions: WorkspaceDetailAction[]
  links?: ShellRouteLink[]
}
