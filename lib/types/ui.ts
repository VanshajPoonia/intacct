import type { DateRangeFilter, DateRangePreset } from './common'
import type { Role, RoleHomeConfig, RoleId, User } from './identity'
import type { Entity } from './organization'

export interface ShellBadge {
  value: string | number
  tone?: 'neutral' | 'accent' | 'positive' | 'warning' | 'critical'
}

export interface ShellRouteLink {
  id: string
  label: string
  href: string
  description?: string
  icon?: string
  status?: 'available' | 'preview' | 'planned'
  badge?: ShellBadge
}

export type MegaMenuItem = ShellRouteLink

export interface ShellModuleGroup {
  id: string
  label: string
  description?: string
  items: ShellRouteLink[]
}

export type MegaMenuGroup = ShellModuleGroup

export interface ShellModule {
  id: string
  label: string
  icon: string
  href: string
  description?: string
  roles?: RoleId[]
  matchers: string[]
  status?: 'available' | 'preview' | 'planned'
  groups?: ShellModuleGroup[]
  megaMenu?: MegaMenuGroup[]
}

export type NavModule = ShellModule

export interface ShellSidebarItem extends ShellRouteLink {
  moduleId?: string
  matchers?: string[]
  countKey?: 'notifications' | 'tasks'
}

export interface ShellSidebarSection {
  id: string
  label: string
  roles: RoleId[]
  items: ShellSidebarItem[]
}

export interface ShellCommandItem extends ShellRouteLink {
  keywords?: string[]
  roles?: RoleId[]
  section?: 'navigate' | 'create' | 'reports' | 'admin' | 'priority'
  shortcut?: string
}

export interface ShellCommandGroup {
  id: string
  label: string
  roles: RoleId[]
  items: ShellCommandItem[]
}

export interface ShellBreadcrumbDefinition {
  path: string
  label: string
  parentPath?: string
  moduleId: string
  href?: string
}

export interface ShellBreadcrumbItem {
  label: string
  href?: string
}

export interface ShellStubPage {
  path: string
  title: string
  subtitle: string
  moduleId: string
  status: 'available' | 'preview' | 'planned'
  primaryLinks: ShellRouteLink[]
  upcoming: string[]
  roleIds?: RoleId[]
}

export interface RoleShellConfig {
  roleId: RoleId
  moduleIds: string[]
  sidebarSectionIds: string[]
  commandGroupIds: string[]
  homeLabel: string
}

export interface ShellDatePresetOption {
  value: DateRangePreset
  label: string
}

export interface ShellUtilityCounts {
  notifications: number
  tasks: number
}

export interface ShellContextData {
  currentUser: User
  availableRoles: Role[]
  activeRole: Role
  activeEntity: Entity
  entities: Entity[]
  dateRange: DateRangeFilter
  roleHomeConfig: RoleHomeConfig | null
  counts: ShellUtilityCounts
}

export type HomepageTone = 'neutral' | 'accent' | 'positive' | 'warning' | 'critical'

export interface RoleHomepageAction extends ShellRouteLink {
  tone?: HomepageTone
}

export interface RoleHomepageMetric {
  id: string
  label: string
  value: string
  detail?: string
  href?: string
  icon?: string
  tone?: HomepageTone
}

export interface RoleHomepageWidgetItem {
  id: string
  title: string
  description?: string
  value?: string
  secondaryValue?: string
  href?: string
  icon?: string
  status?: string
  statusTone?: HomepageTone
  meta?: string[]
}

export interface RoleHomepageWidget {
  id: string
  title: string
  description?: string
  kind: 'metrics' | 'list' | 'actions' | 'progress'
  metrics?: RoleHomepageMetric[]
  items?: RoleHomepageWidgetItem[]
  actions?: RoleHomepageAction[]
  footerLink?: ShellRouteLink
  emptyMessage?: string
}

export interface RoleHomepageSection {
  id: string
  area: 'full' | 'main' | 'rail'
  widgets: RoleHomepageWidget[]
}

export interface RoleHomepageData {
  roleId: RoleId
  roleLabel: string
  title: string
  subtitle: string
  accentLabel: string
  summaryMetrics: RoleHomepageMetric[]
  primaryActions: RoleHomepageAction[]
  sections: RoleHomepageSection[]
  refreshedAt: Date
}
