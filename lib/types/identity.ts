import type { DateRangePreset } from './common'

export type RoleId =
  | 'accountant'
  | 'ap_specialist'
  | 'ar_specialist'
  | 'controller'
  | 'cfo'
  | 'admin'
  | 'viewer'
  | 'ap_clerk'
  | 'ar_clerk'

export type Permission =
  | 'dashboard.view'
  | 'transactions.view'
  | 'transactions.export'
  | 'bills.view'
  | 'bills.manage'
  | 'invoices.view'
  | 'invoices.manage'
  | 'journal_entries.view'
  | 'journal_entries.manage'
  | 'chart_of_accounts.view'
  | 'chart_of_accounts.manage'
  | 'close.view'
  | 'close.manage'
  | 'reconciliation.view'
  | 'reconciliation.manage'
  | 'reports.view'
  | 'reports.build'
  | 'saved_views.manage'
  | 'search.global'
  | 'admin.manage'
  | 'integrations.manage'
  | 'api.manage'

export interface Role {
  id: RoleId
  name: string
  description: string
  landingRoute: string
  navigationModules: string[]
  accentLabel: string
}

export interface RolePermission {
  roleId: RoleId
  permissions: Permission[]
}

export interface RoleHomeConfig {
  roleId: RoleId
  title: string
  subtitle: string
  primaryModule: string
  defaultRoute: string
  emphasis: string[]
  quickActions: {
    id: string
    label: string
    href: string
  }[]
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  defaultEntity: string
  defaultDateRange: DateRangePreset
  sidebarCollapsed: boolean
  notifications: {
    email: boolean
    push: boolean
    approvals: boolean
    tasks: boolean
  }
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName?: string
  role: RoleId
  status: 'active' | 'inactive' | 'pending'
  entityIds: string[]
  primaryEntityId?: string
  title?: string
  lastLoginAt?: Date
  createdAt: Date
  avatar?: string
  preferences?: UserPreferences
}

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: RoleId
  avatar?: string
  entityIds: string[]
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
  expiresAt: Date
}
