import type { RoleId } from './identity'
import type { SortConfig } from './common'
import type {
  ModuleOverviewData,
  WorkspaceAction,
  WorkspaceColumnDefinition,
  WorkspaceDetailData,
  WorkspaceFilterDefinition,
  WorkspaceListResponse,
  WorkspaceTabItem,
  WorkspaceTone,
} from './workspaces'

export interface Integration {
  id: string
  name: string
  type: 'bank' | 'payroll' | 'crm' | 'ecommerce' | 'tax' | 'expense' | 'hr'
  provider: string
  status: 'connected' | 'disconnected' | 'error' | 'pending'
  lastSyncAt?: Date
  configuration?: Record<string, unknown>
  createdAt: Date
  entityId?: string
  ownerName?: string
}

export interface WorkflowStep {
  id: string
  order: number
  type: 'approval' | 'notification' | 'condition' | 'action'
  config: Record<string, unknown>
}

export interface Workflow {
  id: string
  name: string
  type: 'approval' | 'notification' | 'automation'
  trigger: string
  status: 'active' | 'inactive' | 'draft'
  steps: WorkflowStep[]
  entityIds: string[]
  createdBy: string
  createdAt: Date
}

export interface ApiKey {
  id: string
  name: string
  key: string
  status: 'active' | 'revoked'
  permissions: string[]
  lastUsedAt?: Date
  expiresAt?: Date
  createdBy: string
  createdAt: Date
}

export interface CustomFieldDefinition {
  id: string
  name: string
  code: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'dropdown' | 'textarea'
  module: 'bill' | 'invoice' | 'customer' | 'vendor' | 'project' | 'journal_entry'
  required: boolean
  status: 'active' | 'inactive'
  options?: string[]
  entityId?: string
  createdAt: Date
  updatedAt?: Date
}

export interface NotificationPolicy {
  id: string
  category: 'approvals' | 'tasks' | 'payments' | 'invoices' | 'system'
  name: string
  description: string
  email: boolean
  push: boolean
  frequency: 'instant' | 'hourly' | 'daily' | 'weekly'
  scope: 'personal' | 'role' | 'global'
  roleIds?: RoleId[]
  entityId?: string
  updatedAt: Date
}

export interface IntegrationSyncRun {
  id: string
  integrationId: string
  integrationName: string
  status: 'success' | 'warning' | 'failed' | 'running' | 'pending'
  source: 'scheduled' | 'manual' | 'webhook'
  startedAt: Date
  finishedAt?: Date
  recordsProcessed: number
  errorCount: number
  entityId?: string
  summary: string
}

export interface IntegrationDependency {
  id: string
  integrationId: string
  label: string
  type: 'module' | 'workflow' | 'export' | 'webhook'
  status: 'healthy' | 'degraded' | 'blocked'
  description: string
}

export interface DeveloperApp {
  id: string
  name: string
  status: 'active' | 'draft' | 'suspended'
  ownerName: string
  clientId: string
  environment: 'production' | 'sandbox'
  scopes: string[]
  createdAt: Date
  lastUsedAt?: Date
}

export interface WebhookEndpoint {
  id: string
  name: string
  url: string
  eventType: string
  status: 'active' | 'paused' | 'error'
  signingKey: string
  retryCount: number
  lastDeliveredAt?: Date
  createdAt: Date
}

export interface ApiRequestLog {
  id: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  statusCode: number
  latencyMs: number
  apiKeyId?: string
  appId?: string
  entityId?: string
  success: boolean
  createdAt: Date
}

export interface RuleDefinition {
  id: string
  name: string
  category: 'posting' | 'approval' | 'routing' | 'exception' | 'export'
  status: 'active' | 'draft' | 'paused'
  trigger: string
  conditionSummary: string
  actionSummary: string
  priority: number
  entityId?: string
  ownerName: string
  updatedAt: Date
  matchCount: number
}

export interface RuleSimulationResult {
  id: string
  ruleId: string
  ruleName: string
  status: 'passed' | 'failed' | 'warning'
  sampleRecord: string
  outcome: string
  entityId?: string
  createdAt: Date
}

export interface RuleDeployment {
  id: string
  ruleId: string
  ruleName: string
  environment: 'production' | 'sandbox'
  status: 'active' | 'rolled_back' | 'pending'
  deployedBy: string
  deployedAt: Date
  version: string
}

export interface DeliveryTarget {
  id: string
  type: 'email' | 's3' | 'share_link' | 'api'
  label: string
  destination: string
  status: 'active' | 'error'
}

export interface ExportJob {
  id: string
  name: string
  module: string
  format: 'csv' | 'xlsx' | 'pdf'
  status: 'completed' | 'processing' | 'failed' | 'scheduled'
  requestedBy: string
  createdAt: Date
  deliveredAt?: Date
  entityId?: string
  recordCount: number
}

export interface ExportSchedule {
  id: string
  name: string
  module: string
  frequency: 'daily' | 'weekly' | 'monthly'
  status: 'active' | 'paused'
  format: 'csv' | 'xlsx' | 'pdf'
  nextRunAt: Date
  targetId: string
  entityId?: string
}

export interface ShareLink {
  id: string
  name: string
  module: string
  status: 'active' | 'expired' | 'revoked'
  url: string
  createdBy: string
  createdAt: Date
  expiresAt?: Date
  recipientSummary: string
}

export interface EventMonitoringRecord {
  id: string
  sourceType: 'integration' | 'webhook' | 'rule' | 'export' | 'workflow' | 'api'
  sourceId: string
  sourceLabel: string
  severity: 'info' | 'warning' | 'critical'
  status: 'new' | 'acknowledged' | 'resolved' | 'retrying'
  entityId?: string
  occurredAt: Date
  message: string
  resolutionHint?: string
}

export type AdminWorkspaceSectionId =
  | 'users'
  | 'workflows'
  | 'integrations'
  | 'api_keys'
  | 'audit'
  | 'custom_fields'
  | 'notifications'

export type IntegrationsWorkspaceSectionId =
  | 'connections'
  | 'sync_runs'
  | 'dependencies'
  | 'exceptions'

export type DeveloperPlatformSectionId =
  | 'api_keys'
  | 'webhooks'
  | 'apps'
  | 'request_logs'

export type RuleEngineSectionId =
  | 'rules'
  | 'simulations'
  | 'exceptions'
  | 'deployments'

export type ExportsSharingSectionId =
  | 'export_jobs'
  | 'schedules'
  | 'share_links'
  | 'delivery_failures'

export interface PlatformWorkspaceRecord {
  id: string
  title: string
  subtitle?: string
  reference?: string
  status: string
  statusTone?: WorkspaceTone
  typeLabel?: string
  entityName?: string
  scopeLabel?: string
  ownerLabel?: string
  primaryMetricLabel?: string
  primaryMetricValue?: number
  primaryMetricDisplay?: string
  secondaryMetricLabel?: string
  secondaryMetricValue?: number
  secondaryMetricDisplay?: string
  primaryDateValue?: Date
  primaryDateDisplay?: string
  secondaryDateValue?: Date
  secondaryDateDisplay?: string
  meta?: string[]
}

export interface PlatformWorkspaceListResponse extends WorkspaceListResponse<PlatformWorkspaceRecord> {
  columns: WorkspaceColumnDefinition[]
  bulkActions?: WorkspaceAction[]
  defaultVisibleColumnIds?: string[]
}

export interface PlatformWorkspaceQuery {
  search?: string
  filters?: Record<string, string>
  sort?: SortConfig
  page?: number
  pageSize?: number
}

export interface AdminOverviewData extends ModuleOverviewData {
  defaultSectionId: AdminWorkspaceSectionId
}

export interface PlatformOverviewData extends ModuleOverviewData {
  defaultSectionId: string
}

export interface PlatformWorkspaceTabsData {
  tabs: WorkspaceTabItem[]
  defaultSectionId: string
}

export interface PlatformWorkspaceData {
  overview: PlatformOverviewData
  tabs: WorkspaceTabItem[]
  list: PlatformWorkspaceListResponse
  detail?: WorkspaceDetailData | null
  filters?: WorkspaceFilterDefinition[]
}
