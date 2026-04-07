import type {
  PerformanceObligation,
  RevenueRecognitionEvent,
  RevenueSchedule,
  RevenueScheduleLine,
} from '@/lib/types'

export const revenueSchedules: RevenueSchedule[] = [
  {
    id: 'revsch-9001',
    contractId: 'ctr-9001',
    contractNumber: 'CTR-9001',
    contractName: 'Apex multi-year implementation',
    customerId: 'c-apex',
    customerName: 'Apex Retail Group',
    entityId: 'e1',
    projectId: 'p-close',
    projectName: 'Q1 Close Acceleration',
    status: 'active',
    recognitionMethod: 'milestone',
    totalValue: 1250000,
    recognizedToDate: 812000,
    deferredBalance: 438000,
    nextRecognitionDate: new Date('2026-04-08'),
    scheduleStartDate: new Date('2025-08-01'),
    scheduleEndDate: new Date('2027-07-31'),
  },
  {
    id: 'revsch-9002',
    contractId: 'ctr-9002',
    contractNumber: 'CTR-9002',
    contractName: 'Berger shared services agreement',
    customerId: 'c-berger',
    customerName: 'Berger Industrial GmbH',
    entityId: 'e3',
    projectId: 'p-eu',
    projectName: 'EU Shared Services',
    status: 'hold',
    recognitionMethod: 'ratable',
    totalValue: 240000,
    recognizedToDate: 82000,
    deferredBalance: 158000,
    nextRecognitionDate: new Date('2026-04-10'),
    scheduleStartDate: new Date('2025-11-01'),
    scheduleEndDate: new Date('2026-10-31'),
  },
  {
    id: 'revsch-9003',
    contractId: 'ctr-9003',
    contractNumber: 'CTR-9003',
    contractName: 'Northwind analytics support',
    customerId: 'c-northwind',
    customerName: 'Northwind Health',
    entityId: 'e1',
    status: 'active',
    recognitionMethod: 'usage',
    totalValue: 320000,
    recognizedToDate: 118000,
    deferredBalance: 202000,
    nextRecognitionDate: new Date('2026-04-06'),
    scheduleStartDate: new Date('2026-01-01'),
    scheduleEndDate: new Date('2026-12-31'),
  },
]

export const revenueScheduleLines: RevenueScheduleLine[] = [
  { id: 'revline-1', scheduleId: 'revsch-9001', periodLabel: 'Apr 2026 Milestone', recognitionDate: new Date('2026-04-08'), amount: 96000, status: 'ready', note: 'Customer acceptance received.' },
  { id: 'revline-2', scheduleId: 'revsch-9001', periodLabel: 'May 2026 Milestone', recognitionDate: new Date('2026-05-12'), amount: 112000, status: 'scheduled' },
  { id: 'revline-3', scheduleId: 'revsch-9002', periodLabel: 'Apr 2026 Monthly Release', recognitionDate: new Date('2026-04-10'), amount: 22000, status: 'held', note: 'Support memo missing for April deliverables.' },
  { id: 'revline-4', scheduleId: 'revsch-9002', periodLabel: 'May 2026 Monthly Release', recognitionDate: new Date('2026-05-10'), amount: 22000, status: 'scheduled' },
  { id: 'revline-5', scheduleId: 'revsch-9003', periodLabel: 'Apr 2026 Usage Release', recognitionDate: new Date('2026-04-06'), amount: 31000, status: 'ready', note: 'Usage file loaded from billing system.' },
  { id: 'revline-6', scheduleId: 'revsch-9003', periodLabel: 'Mar 2026 Usage Release', recognitionDate: new Date('2026-03-31'), amount: 29000, status: 'posted', journalEntryId: 'je-1002' },
]

export const performanceObligations: PerformanceObligation[] = [
  { id: 'po-1', contractId: 'ctr-9001', scheduleId: 'revsch-9001', name: 'Implementation phase 2', allocatedAmount: 420000, satisfiedPercent: 74, status: 'in_progress' },
  { id: 'po-2', contractId: 'ctr-9001', scheduleId: 'revsch-9001', name: 'Data migration acceptance', allocatedAmount: 280000, satisfiedPercent: 100, status: 'satisfied' },
  { id: 'po-3', contractId: 'ctr-9002', scheduleId: 'revsch-9002', name: 'Shared services delivery', allocatedAmount: 240000, satisfiedPercent: 38, status: 'on_hold' },
  { id: 'po-4', contractId: 'ctr-9003', scheduleId: 'revsch-9003', name: 'Analytics platform usage', allocatedAmount: 320000, satisfiedPercent: 36, status: 'in_progress' },
]

export const revenueRecognitionEvents: RevenueRecognitionEvent[] = [
  { id: 'rev-event-1', scheduleId: 'revsch-9001', contractId: 'ctr-9001', contractNumber: 'CTR-9001', entityId: 'e1', recognitionDate: new Date('2026-04-08'), amount: 96000, status: 'queued', description: 'Post April implementation milestone.', createdBy: 'u1', createdAt: new Date('2026-04-04T08:45:00') },
  { id: 'rev-event-2', scheduleId: 'revsch-9002', contractId: 'ctr-9002', contractNumber: 'CTR-9002', entityId: 'e3', recognitionDate: new Date('2026-04-10'), amount: 22000, status: 'held', description: 'April shared services release on hold.', createdBy: 'u2', createdAt: new Date('2026-04-04T07:35:00'), exceptionReason: 'Support memo missing from contract file.' },
  { id: 'rev-event-3', scheduleId: 'revsch-9003', contractId: 'ctr-9003', contractNumber: 'CTR-9003', entityId: 'e1', recognitionDate: new Date('2026-04-06'), amount: 31000, status: 'queued', description: 'Usage-based April recognition.', createdBy: 'u1', createdAt: new Date('2026-04-04T09:00:00') },
  { id: 'rev-event-4', scheduleId: 'revsch-9003', contractId: 'ctr-9003', contractNumber: 'CTR-9003', entityId: 'e1', recognitionDate: new Date('2026-03-31'), amount: 29000, status: 'posted', journalEntryId: 'je-1002', description: 'March usage recognition posted.', createdBy: 'u1', createdAt: new Date('2026-03-31T16:10:00') },
]
