import type { JournalLine } from './accounting'

export interface ProjectDetail {
  id: string
  name: string
  code: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  customerId?: string
  customerName?: string
  managerId: string
  managerName: string
  startDate: Date
  endDate?: Date
  budget: number
  actualCost: number
  revenue: number
  profitMargin: number
  percentComplete: number
  entityId: string
  departmentId?: string
  description?: string
  createdAt: Date
}

export interface TimeEntry {
  id: string
  employeeId: string
  employeeName: string
  projectId?: string
  projectName?: string
  taskDescription: string
  date: Date
  hours: number
  billable: boolean
  rate: number
  amount: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'invoiced'
  entityId: string
  notes?: string
  createdAt: Date
}

export interface ExpenseEntry {
  id: string
  employeeId: string
  employeeName: string
  category: string
  description: string
  date: Date
  amount: number
  currency: string
  receipt?: string
  projectId?: string
  projectName?: string
  customerId?: string
  billable: boolean
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed'
  entityId: string
  notes?: string
  createdAt: Date
}

export interface RecurringJournal {
  id: string
  name: string
  description?: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  startDate: Date
  endDate?: Date
  nextRunDate: Date
  lastRunDate?: Date
  status: 'active' | 'paused' | 'expired'
  templateLines: JournalLine[]
  entityId: string
  createdBy: string
  createdAt: Date
  runCount: number
}

export interface AllocationTarget {
  id: string
  accountId: string
  accountName: string
  departmentId?: string
  departmentName?: string
  percentage?: number
  fixedAmount?: number
}

export interface Allocation {
  id: string
  name: string
  description?: string
  sourceAccountId: string
  sourceAccountName: string
  method: 'fixed' | 'percentage' | 'statistical'
  basis?: string
  targets: AllocationTarget[]
  status: 'draft' | 'active' | 'inactive'
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'on_demand'
  lastRunDate?: Date
  entityId: string
  createdBy: string
  createdAt: Date
}
