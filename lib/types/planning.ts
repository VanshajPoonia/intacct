export type BudgetsForecastingSectionId =
  | 'budget_versions'
  | 'forecast_scenarios'
  | 'variance_review'
  | 'submission_queue'

export interface BudgetVersion {
  id: string
  name: string
  fiscalYear: number
  entityId: string
  departmentId?: string
  departmentName?: string
  projectId?: string
  projectName?: string
  ownerId: string
  ownerName: string
  versionType: 'operating' | 'capital' | 'headcount'
  status: 'draft' | 'in_review' | 'approved' | 'locked'
  totalBudget: number
  actualToDate: number
  forecastAmount: number
  varianceAmount: number
  variancePercent: number
  lineCount: number
  submissionDueDate?: Date
  updatedAt: Date
  notes?: string
}

export interface BudgetLine {
  id: string
  budgetVersionId: string
  accountId: string
  accountName: string
  category: string
  periodLabel: string
  departmentId?: string
  departmentName?: string
  projectId?: string
  projectName?: string
  budgetAmount: number
  actualAmount: number
  forecastAmount?: number
}

export interface ForecastScenario {
  id: string
  name: string
  entityId: string
  departmentId?: string
  departmentName?: string
  projectId?: string
  projectName?: string
  basedOnBudgetVersionId: string
  ownerId: string
  ownerName: string
  status: 'draft' | 'in_review' | 'approved' | 'active'
  confidence: 'low' | 'medium' | 'high'
  revenueForecast: number
  expenseForecast: number
  netForecast: number
  upsideAmount: number
  downsideAmount: number
  updatedAt: Date
}

export interface ForecastDriver {
  id: string
  scenarioId: string
  name: string
  type: 'revenue' | 'expense' | 'headcount' | 'price' | 'volume'
  assumption: string
  impactAmount: number
  direction: 'increase' | 'decrease'
}

export interface ForecastAssumption {
  id: string
  scenarioId: string
  label: string
  value: string
  unit?: string
  status: 'open' | 'approved' | 'needs_review'
  notes?: string
}

export interface BudgetSubmission {
  id: string
  budgetVersionId: string
  entityId: string
  departmentId?: string
  departmentName?: string
  projectId?: string
  projectName?: string
  ownerId: string
  ownerName: string
  status: 'not_started' | 'in_progress' | 'submitted' | 'overdue' | 'returned'
  dueDate: Date
  submittedAt?: Date
  exceptionReason?: string
}

export interface BudgetVarianceRow {
  id: string
  category: string
  entityId: string
  entityName: string
  departmentId?: string
  departmentName?: string
  projectId?: string
  projectName?: string
  budgetAmount: number
  actualAmount: number
  varianceAmount: number
  variancePercent: number
  ownerName: string
  status: 'favorable' | 'watch' | 'critical'
}
