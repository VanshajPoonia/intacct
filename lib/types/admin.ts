export interface Integration {
  id: string
  name: string
  type: 'bank' | 'payroll' | 'crm' | 'ecommerce' | 'tax' | 'expense' | 'hr'
  provider: string
  status: 'connected' | 'disconnected' | 'error' | 'pending'
  lastSyncAt?: Date
  configuration?: Record<string, unknown>
  createdAt: Date
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
