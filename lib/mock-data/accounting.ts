import type {
  Account,
  AccountingPeriod,
  BankAccount,
  ConsolidationAdjustment,
  JournalEntry,
  ReconciliationItem,
  Transaction,
} from '@/lib/types'

export const accountingPeriods: AccountingPeriod[] = [
  { id: 'per-2026-01', name: 'Jan 2026', fiscalYear: 2026, periodNumber: 1, startDate: new Date('2026-01-01'), endDate: new Date('2026-01-31'), status: 'closed', entityId: 'e1', closedBy: 'u2', closedAt: new Date('2026-02-05') },
  { id: 'per-2026-02', name: 'Feb 2026', fiscalYear: 2026, periodNumber: 2, startDate: new Date('2026-02-01'), endDate: new Date('2026-02-28'), status: 'closed', entityId: 'e1', closedBy: 'u2', closedAt: new Date('2026-03-05') },
  { id: 'per-2026-03', name: 'Mar 2026', fiscalYear: 2026, periodNumber: 3, startDate: new Date('2026-03-01'), endDate: new Date('2026-03-31'), status: 'open', entityId: 'e1' },
]

export const accounts: Account[] = [
  { id: 'a-cash', number: '1000', name: 'Operating Cash', type: 'asset', category: 'Current Assets', balance: 1850000, currency: 'USD', status: 'active' },
  { id: 'a-ar', number: '1100', name: 'Accounts Receivable', type: 'asset', category: 'Current Assets', balance: 642000, currency: 'USD', status: 'active' },
  { id: 'a-prepaid', number: '1300', name: 'Prepaid Expenses', type: 'asset', category: 'Current Assets', balance: 94000, currency: 'USD', status: 'active' },
  { id: 'a-fixed', number: '1500', name: 'Machinery & Equipment', type: 'asset', category: 'Non-Current Assets', balance: 2120000, currency: 'USD', status: 'active' },
  { id: 'a-accdep', number: '1510', name: 'Accumulated Depreciation', type: 'asset', category: 'Non-Current Assets', balance: -540000, currency: 'USD', status: 'active' },
  { id: 'a-ap', number: '2000', name: 'Accounts Payable', type: 'liability', category: 'Current Liabilities', balance: 418000, currency: 'USD', status: 'active' },
  { id: 'a-accrual', number: '2100', name: 'Accrued Expenses', type: 'liability', category: 'Current Liabilities', balance: 121000, currency: 'USD', status: 'active' },
  { id: 'a-deferred', number: '2200', name: 'Deferred Revenue', type: 'liability', category: 'Current Liabilities', balance: 288000, currency: 'USD', status: 'active' },
  { id: 'a-debt', number: '2500', name: 'Long-Term Debt', type: 'liability', category: 'Non-Current Liabilities', balance: 880000, currency: 'USD', status: 'active' },
  { id: 'a-equity', number: '3100', name: 'Retained Earnings', type: 'equity', category: 'Equity', balance: 1558000, currency: 'USD', status: 'active' },
  { id: 'a-sales', number: '4000', name: 'Product Revenue', type: 'revenue', category: 'Operating Revenue', balance: 4225000, currency: 'USD', status: 'active' },
  { id: 'a-service', number: '4100', name: 'Service Revenue', type: 'revenue', category: 'Operating Revenue', balance: 1880000, currency: 'USD', status: 'active' },
  { id: 'a-cogs', number: '5000', name: 'Cost of Goods Sold', type: 'expense', category: 'Cost of Sales', balance: 2490000, currency: 'USD', status: 'active' },
  { id: 'a-payroll', number: '6100', name: 'Payroll Expense', type: 'expense', category: 'Operating Expenses', balance: 1160000, currency: 'USD', status: 'active' },
  { id: 'a-rent', number: '6200', name: 'Facilities Expense', type: 'expense', category: 'Operating Expenses', balance: 242000, currency: 'USD', status: 'active' },
  { id: 'a-marketing', number: '6300', name: 'Marketing Expense', type: 'expense', category: 'Operating Expenses', balance: 192000, currency: 'USD', status: 'active' },
  { id: 'a-prof', number: '6400', name: 'Professional Services', type: 'expense', category: 'Operating Expenses', balance: 138000, currency: 'USD', status: 'active' },
  { id: 'a-dep', number: '6500', name: 'Depreciation Expense', type: 'expense', category: 'Operating Expenses', balance: 86000, currency: 'USD', status: 'active' },
]

export const bankAccounts: BankAccount[] = [
  { id: 'ba-op', name: 'Northstar Operating', accountNumber: '****1204', routingNumber: '071000013', bankName: 'JPMorgan Chase', type: 'checking', balance: 1220000, availableBalance: 1184000, currency: 'USD', status: 'active', lastSyncedAt: new Date('2026-04-04T08:00:00'), entityId: 'e1', entityName: 'Northstar Holdings' },
  { id: 'ba-pay', name: 'Payroll Disbursement', accountNumber: '****8801', routingNumber: '071000013', bankName: 'JPMorgan Chase', type: 'checking', balance: 410000, availableBalance: 410000, currency: 'USD', status: 'active', lastSyncedAt: new Date('2026-04-04T08:00:00'), entityId: 'e1', entityName: 'Northstar Holdings' },
  { id: 'ba-west', name: 'West Plant Operating', accountNumber: '****5572', routingNumber: '122105155', bankName: 'Wells Fargo', type: 'checking', balance: 385000, availableBalance: 372000, currency: 'USD', status: 'active', lastSyncedAt: new Date('2026-04-04T07:45:00'), entityId: 'e2', entityName: 'Northstar Manufacturing West' },
  { id: 'ba-eu', name: 'EU Operating', accountNumber: '****2008', bankName: 'Deutsche Bank', type: 'checking', balance: 245000, availableBalance: 240000, currency: 'EUR', status: 'active', lastSyncedAt: new Date('2026-04-04T06:10:00'), entityId: 'e3', entityName: 'Northstar Europe' },
]

export const journalEntries: JournalEntry[] = [
  {
    id: 'je-1001',
    number: 'JE-2026-1001',
    date: new Date('2026-03-31'),
    description: 'March depreciation',
    status: 'posted',
    entityId: 'e1',
    periodId: 'per-2026-03',
    createdBy: 'u1',
    createdAt: new Date('2026-03-31T15:00:00'),
    postedAt: new Date('2026-03-31T15:20:00'),
    postedBy: 'u2',
    lines: [
      { id: 'jel-1', accountId: 'a-dep', accountNumber: '6500', accountName: 'Depreciation Expense', debit: 21000, credit: 0, departmentId: 'd-fin', departmentName: 'Finance' },
      { id: 'jel-2', accountId: 'a-accdep', accountNumber: '1510', accountName: 'Accumulated Depreciation', debit: 0, credit: 21000, departmentId: 'd-fin', departmentName: 'Finance' },
    ],
  },
  {
    id: 'je-1002',
    number: 'JE-2026-1002',
    date: new Date('2026-03-29'),
    description: 'Deferred revenue release',
    status: 'posted',
    entityId: 'e1',
    periodId: 'per-2026-03',
    createdBy: 'u1',
    createdAt: new Date('2026-03-29T10:00:00'),
    postedAt: new Date('2026-03-29T10:14:00'),
    postedBy: 'u2',
    lines: [
      { id: 'jel-3', accountId: 'a-deferred', accountNumber: '2200', accountName: 'Deferred Revenue', debit: 48000, credit: 0, projectId: 'p-close', projectName: 'Q1 Close Acceleration' },
      { id: 'jel-4', accountId: 'a-service', accountNumber: '4100', accountName: 'Service Revenue', debit: 0, credit: 48000, projectId: 'p-close', projectName: 'Q1 Close Acceleration' },
    ],
  },
  {
    id: 'je-1003',
    number: 'JE-2026-1003',
    date: new Date('2026-03-27'),
    description: 'Payroll accrual',
    status: 'pending',
    entityId: 'e2',
    periodId: 'per-2026-03',
    createdBy: 'u1',
    createdAt: new Date('2026-03-27T11:30:00'),
    lines: [
      { id: 'jel-5', accountId: 'a-payroll', accountNumber: '6100', accountName: 'Payroll Expense', debit: 86000, credit: 0, departmentId: 'd-ops', departmentName: 'Operations' },
      { id: 'jel-6', accountId: 'a-accrual', accountNumber: '2100', accountName: 'Accrued Expenses', debit: 0, credit: 86000, departmentId: 'd-ops', departmentName: 'Operations' },
    ],
  },
  {
    id: 'je-1004',
    number: 'JE-2026-1004',
    date: new Date('2026-03-26'),
    description: 'Intercompany elimination seed',
    status: 'posted',
    entityId: 'e4',
    createdBy: 'u2',
    createdAt: new Date('2026-03-26T16:00:00'),
    postedAt: new Date('2026-03-26T16:10:00'),
    postedBy: 'u2',
    lines: [
      { id: 'jel-7', accountId: 'a-service', accountNumber: '4100', accountName: 'Service Revenue', debit: 15000, credit: 0 },
      { id: 'jel-8', accountId: 'a-prof', accountNumber: '6400', accountName: 'Professional Services', debit: 0, credit: 15000 },
    ],
  },
]

export const transactions: Transaction[] = [
  { id: 'txn-1', date: new Date('2026-03-31'), type: 'receipt', amount: 128000, currency: 'USD', accountId: 'a-cash', accountName: 'Operating Cash', bankAccountId: 'ba-op', bankAccountName: 'Northstar Operating', description: 'Customer payment - Apex Retail', reference: 'RCPT-3101', source: 'bank_feed', category: 'collections', departmentId: 'd-sales', departmentName: 'Sales', projectId: 'p-close', projectName: 'Q1 Close Acceleration', status: 'cleared', reconciliationStatus: 'reconciled', entityId: 'e1', entityName: 'Northstar Holdings', createdBy: 'u4', createdAt: new Date('2026-03-31T09:00:00') },
  { id: 'txn-2', date: new Date('2026-03-30'), type: 'payment', amount: 62000, currency: 'USD', accountId: 'a-ap', accountName: 'Accounts Payable', bankAccountId: 'ba-op', bankAccountName: 'Northstar Operating', description: 'Vendor disbursement - Vertex Components', reference: 'PMT-2209', source: 'manual', category: 'disbursements', departmentId: 'd-ops', departmentName: 'Operations', status: 'completed', reconciliationStatus: 'matched', entityId: 'e2', entityName: 'Northstar Manufacturing West', createdBy: 'u3', createdAt: new Date('2026-03-30T14:15:00') },
  { id: 'txn-3', date: new Date('2026-03-29'), type: 'journal', amount: 48000, currency: 'USD', accountId: 'a-service', accountName: 'Service Revenue', description: 'Deferred revenue release', reference: 'JE-2026-1002', source: 'system', category: 'revenue_recognition', departmentId: 'd-fin', departmentName: 'Finance', projectId: 'p-close', projectName: 'Q1 Close Acceleration', status: 'posted', entityId: 'e1', entityName: 'Northstar Holdings', createdBy: 'u1', createdAt: new Date('2026-03-29T10:15:00') },
  { id: 'txn-4', date: new Date('2026-03-28'), type: 'debit', amount: 18500, currency: 'USD', accountId: 'a-prof', accountName: 'Professional Services', description: 'Audit preparation support', reference: 'BILL-7604', source: 'manual', category: 'close_support', departmentId: 'd-fin', departmentName: 'Finance', status: 'posted', reconciliationStatus: 'exception', entityId: 'e1', entityName: 'Northstar Holdings', createdBy: 'u1', createdAt: new Date('2026-03-28T13:25:00') },
  { id: 'txn-5', date: new Date('2026-03-27'), type: 'credit', amount: 94000, currency: 'USD', accountId: 'a-sales', accountName: 'Product Revenue', description: 'Invoice run - March hardware shipment', reference: 'INV-1103', source: 'system', category: 'billing', departmentId: 'd-sales', departmentName: 'Sales', status: 'posted', entityId: 'e1', entityName: 'Northstar Holdings', createdBy: 'u4', createdAt: new Date('2026-03-27T11:00:00') },
  { id: 'txn-6', date: new Date('2026-03-26'), type: 'transfer', amount: 50000, currency: 'USD', accountId: 'a-cash', accountName: 'Operating Cash', bankAccountId: 'ba-op', bankAccountName: 'Northstar Operating', description: 'Cash sweep to payroll', reference: 'TRF-2081', source: 'api', category: 'cash_management', departmentId: 'd-fin', departmentName: 'Finance', status: 'completed', reconciliationStatus: 'matched', entityId: 'e1', entityName: 'Northstar Holdings', createdBy: 'u1', createdAt: new Date('2026-03-26T08:40:00') },
  { id: 'txn-7', date: new Date('2026-03-25'), type: 'fee', amount: 320, currency: 'USD', accountId: 'a-prof', accountName: 'Professional Services', bankAccountId: 'ba-op', bankAccountName: 'Northstar Operating', description: 'Bank service charge', reference: 'FEE-892', source: 'bank_feed', category: 'bank_fees', status: 'cleared', reconciliationStatus: 'unmatched', entityId: 'e1', entityName: 'Northstar Holdings', createdBy: 'u1', createdAt: new Date('2026-03-25T07:55:00') },
  { id: 'txn-8', date: new Date('2026-03-24'), type: 'payment', amount: 41000, currency: 'EUR', accountId: 'a-accrual', accountName: 'Accrued Expenses', bankAccountId: 'ba-eu', bankAccountName: 'EU Operating', description: 'Shared services settlement', reference: 'PMT-EU-01', source: 'manual', category: 'intercompany', departmentId: 'd-fin', departmentName: 'Finance', projectId: 'p-eu', projectName: 'EU Shared Services', status: 'completed', reconciliationStatus: 'matched', entityId: 'e3', entityName: 'Northstar Europe', createdBy: 'u1', createdAt: new Date('2026-03-24T12:10:00') },
  { id: 'txn-9', date: new Date('2026-03-22'), type: 'withdrawal', amount: 120000, currency: 'USD', accountId: 'a-cogs', accountName: 'Cost of Goods Sold', bankAccountId: 'ba-west', bankAccountName: 'West Plant Operating', description: 'Raw material purchase', reference: 'PO-2204', source: 'manual', category: 'inventory', departmentId: 'd-ops', departmentName: 'Operations', status: 'completed', reconciliationStatus: 'reconciled', entityId: 'e2', entityName: 'Northstar Manufacturing West', createdBy: 'u3', createdAt: new Date('2026-03-22T15:00:00') },
  { id: 'txn-10', date: new Date('2026-03-18'), type: 'interest', amount: 2100, currency: 'USD', accountId: 'a-cash', accountName: 'Operating Cash', bankAccountId: 'ba-op', bankAccountName: 'Northstar Operating', description: 'Money market interest', reference: 'INT-0318', source: 'bank_feed', category: 'treasury', status: 'cleared', reconciliationStatus: 'reconciled', entityId: 'e1', entityName: 'Northstar Holdings', createdBy: 'u1', createdAt: new Date('2026-03-18T06:30:00') },
]

export const reconciliationItems: ReconciliationItem[] = [
  { id: 'rec-1', date: new Date('2026-03-31'), description: 'Customer payment - Apex Retail', reference: 'RCPT-3101', bankAmount: 128000, bookAmount: 128000, difference: 0, status: 'matched', type: 'receipt', bankAccountId: 'ba-op', transactionId: 'txn-1', entityId: 'e1', matchedAt: new Date('2026-03-31T10:00:00'), matchedBy: 'u1' },
  { id: 'rec-2', date: new Date('2026-03-30'), description: 'Vertex Components payment', reference: 'PMT-2209', bankAmount: -62000, bookAmount: -62000, difference: 0, status: 'matched', type: 'payment', bankAccountId: 'ba-op', transactionId: 'txn-2', entityId: 'e2', matchedAt: new Date('2026-03-30T15:10:00'), matchedBy: 'u3' },
  { id: 'rec-3', date: new Date('2026-03-25'), description: 'Bank service charge', reference: 'FEE-892', bankAmount: -320, bookAmount: 0, difference: -320, status: 'unmatched', type: 'fee', bankAccountId: 'ba-op', transactionId: 'txn-7', entityId: 'e1' },
  { id: 'rec-4', date: new Date('2026-03-24'), description: 'EU settlement', reference: 'PMT-EU-01', bankAmount: -41000, bookAmount: -40500, difference: -500, status: 'adjusted', type: 'payment', bankAccountId: 'ba-eu', transactionId: 'txn-8', entityId: 'e3' },
  { id: 'rec-5', date: new Date('2026-03-18'), description: 'Money market interest', reference: 'INT-0318', bankAmount: 2100, bookAmount: 2100, difference: 0, status: 'cleared', type: 'interest', bankAccountId: 'ba-op', transactionId: 'txn-10', entityId: 'e1' },
]

export const consolidationAdjustments: ConsolidationAdjustment[] = [
  { label: 'Intercompany services elimination', amount: 15000 },
  { label: 'Intercompany AP/AR elimination', amount: 41000 },
]
