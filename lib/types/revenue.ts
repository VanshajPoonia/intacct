export type ContractsRevenueSectionId = 'contracts' | 'revenue_schedules' | 'recognition_queue' | 'exceptions'

export interface RevenueSchedule {
  id: string
  contractId: string
  contractNumber: string
  contractName: string
  customerId: string
  customerName: string
  entityId: string
  projectId?: string
  projectName?: string
  status: 'draft' | 'active' | 'hold' | 'completed'
  recognitionMethod: 'ratable' | 'milestone' | 'usage'
  totalValue: number
  recognizedToDate: number
  deferredBalance: number
  nextRecognitionDate?: Date
  scheduleStartDate: Date
  scheduleEndDate: Date
}

export interface RevenueScheduleLine {
  id: string
  scheduleId: string
  periodLabel: string
  recognitionDate: Date
  amount: number
  status: 'scheduled' | 'ready' | 'posted' | 'held'
  journalEntryId?: string
  note?: string
}

export interface PerformanceObligation {
  id: string
  contractId: string
  scheduleId: string
  name: string
  allocatedAmount: number
  satisfiedPercent: number
  status: 'open' | 'in_progress' | 'satisfied' | 'on_hold'
}

export interface RevenueRecognitionEvent {
  id: string
  scheduleId: string
  contractId: string
  contractNumber: string
  entityId: string
  recognitionDate: Date
  amount: number
  status: 'queued' | 'posted' | 'held'
  journalEntryId?: string
  description: string
  createdBy: string
  createdAt: Date
  exceptionReason?: string
}
