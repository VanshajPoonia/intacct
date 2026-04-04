import type {
  DashboardFilters,
  DashboardMetricsResponse,
  DashboardMetric,
  RevenueByChannelData,
  RevenueTrendData,
  DepartmentExpenseData,
  CashWeeklyData,
  ContractExpenseData,
  AgingData,
  BudgetActualData,
  EntityPerformanceData,
  AIInsight,
  Transaction,
  ApprovalItem,
  Bill,
  Invoice,
  JournalEntry,
  PaginatedResponse,
  SortConfig,
  Vendor,
  Customer,
  Account,
  Department,
  Location,
  Project,
  Employee,
  Entity,
  BankAccount,
} from '@/lib/types'
import {
  entities,
  vendors,
  customers,
  accounts,
  transactions as mockTransactions,
  bills as mockBills,
  invoices as mockInvoices,
  journalEntries as mockJournalEntries,
  approvalItems as mockApprovalItems,
  bankAccounts,
} from '@/lib/mock-data'

// Simulated latency for realistic UX
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const SIMULATED_DELAY = 300

// Mock departments, locations, projects, employees
export const departments: Department[] = [
  { id: 'dept1', name: 'Sales', code: 'SALES', status: 'active' },
  { id: 'dept2', name: 'Marketing', code: 'MKT', status: 'active' },
  { id: 'dept3', name: 'Engineering', code: 'ENG', status: 'active' },
  { id: 'dept4', name: 'Finance', code: 'FIN', status: 'active' },
  { id: 'dept5', name: 'Operations', code: 'OPS', status: 'active' },
  { id: 'dept6', name: 'HR', code: 'HR', status: 'active' },
]

export const locations: Location[] = [
  { id: 'loc1', name: 'Headquarters', code: 'HQ', address: '100 Main St, San Francisco, CA', status: 'active' },
  { id: 'loc2', name: 'West Office', code: 'WEST', address: '200 Oak Ave, Los Angeles, CA', status: 'active' },
  { id: 'loc3', name: 'Europe Office', code: 'EU', address: '50 Kings Rd, London, UK', status: 'active' },
]

export const projects: Project[] = [
  { id: 'proj1', name: 'ERP Implementation', code: 'ERP-2024', customerId: 'c1', budget: 500000, spent: 320000, status: 'active', startDate: new Date('2024-01-15') },
  { id: 'proj2', name: 'Cloud Migration', code: 'CLOUD-Q1', customerId: 'c2', budget: 250000, spent: 180000, status: 'active', startDate: new Date('2024-02-01') },
  { id: 'proj3', name: 'Marketing Campaign', code: 'MKT-SPR', budget: 100000, spent: 75000, status: 'active', startDate: new Date('2024-03-01') },
]

export const employees: Employee[] = [
  { id: 'emp1', name: 'John Smith', email: 'john.smith@acme.com', departmentId: 'dept1', locationId: 'loc1', role: 'Sales Manager', status: 'active' },
  { id: 'emp2', name: 'Emily Davis', email: 'emily.davis@acme.com', departmentId: 'dept3', locationId: 'loc1', role: 'Senior Engineer', status: 'active' },
  { id: 'emp3', name: 'Michael Johnson', email: 'michael.j@acme.com', departmentId: 'dept4', locationId: 'loc1', role: 'Financial Analyst', status: 'active' },
  { id: 'emp4', name: 'Sarah Chen', email: 'sarah.chen@acme.com', departmentId: 'dept4', locationId: 'loc1', role: 'Controller', status: 'active' },
]

// ============ BANK ACCOUNT SERVICES ============

export async function getBankAccounts(): Promise<BankAccount[]> {
  await delay(SIMULATED_DELAY)
  return bankAccounts
}

export async function getBankAccountById(id: string): Promise<BankAccount | null> {
  await delay(SIMULATED_DELAY)
  return bankAccounts.find(a => a.id === id) || null
}

// ============ CASH POSITION SERVICES ============

import type { CashPositionData, Transfer, ReconciliationItem, ReconciliationSummary } from '@/lib/types'

export async function getCashPosition(filters: DashboardFilters): Promise<CashPositionData> {
  await delay(SIMULATED_DELAY)
  
  const multiplier = filters.entityId === 'e4' ? 1 : filters.entityId === 'e1' ? 0.6 : 0.2
  
  const accountBreakdown = bankAccounts
    .filter(a => filters.entityId === 'e4' || a.entityId === filters.entityId)
    .map(a => ({
      accountId: a.id,
      accountName: a.name,
      balance: Math.round(a.balance * multiplier),
      available: Math.round(a.balance * multiplier * 0.95),
    }))
  
  const totalCash = accountBreakdown.reduce((sum, a) => sum + a.balance, 0)
  const availableCash = accountBreakdown.reduce((sum, a) => sum + a.available, 0)
  
  // Generate 7-day forecast
  const dailyForecast = []
  let runningBalance = totalCash
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    const inflows = Math.round((Math.random() * 50000 + 20000) * multiplier)
    const outflows = Math.round((Math.random() * 40000 + 15000) * multiplier)
    dailyForecast.push({
      date: date.toISOString().split('T')[0],
      opening: runningBalance,
      inflows,
      outflows,
      closing: runningBalance + inflows - outflows,
    })
    runningBalance = runningBalance + inflows - outflows
  }
  
  return {
    totalCash,
    availableCash,
    pendingInflows: Math.round(125000 * multiplier),
    pendingOutflows: Math.round(85000 * multiplier),
    projectedBalance: runningBalance,
    accountBreakdown,
    dailyForecast,
  }
}

// ============ TRANSFER SERVICES ============

const mockTransfers: Transfer[] = [
  {
    id: 'tr1',
    number: 'TRF-2024-001',
    date: new Date('2024-03-10'),
    amount: 50000,
    currency: 'USD',
    fromAccountId: 'ba1',
    fromAccountName: 'Operating Account',
    toAccountId: 'ba2',
    toAccountName: 'Payroll Account',
    status: 'completed',
    memo: 'Payroll funding',
    entityId: 'e1',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2024-03-10'),
  },
  {
    id: 'tr2',
    number: 'TRF-2024-002',
    date: new Date('2024-03-12'),
    amount: 100000,
    currency: 'USD',
    fromAccountId: 'ba1',
    fromAccountName: 'Operating Account',
    toAccountId: 'ba3',
    toAccountName: 'Investment Account',
    status: 'completed',
    memo: 'Excess cash investment',
    entityId: 'e1',
    createdBy: 'Michael Johnson',
    createdAt: new Date('2024-03-12'),
  },
  {
    id: 'tr3',
    number: 'TRF-2024-003',
    date: new Date('2024-03-14'),
    amount: 25000,
    currency: 'USD',
    fromAccountId: 'ba3',
    fromAccountName: 'Investment Account',
    toAccountId: 'ba1',
    toAccountName: 'Operating Account',
    status: 'processing',
    memo: 'Cash needs',
    entityId: 'e1',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2024-03-14'),
  },
  {
    id: 'tr4',
    number: 'TRF-2024-004',
    date: new Date('2024-03-15'),
    amount: 15000,
    currency: 'USD',
    fromAccountId: 'ba1',
    fromAccountName: 'Operating Account',
    toAccountId: 'ba2',
    toAccountName: 'Payroll Account',
    status: 'pending',
    memo: 'Bonus funding',
    entityId: 'e1',
    createdBy: 'Emily Davis',
    createdAt: new Date('2024-03-15'),
  },
]

export async function getTransfers(
  filters: DashboardFilters,
  search?: string,
  status?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Transfer>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockTransfers]
  
  if (filters.entityId && filters.entityId !== 'e4') {
    filtered = filtered.filter(t => t.entityId === filters.entityId)
  }
  
  if (status && status.length > 0) {
    filtered = filtered.filter(t => status.includes(t.status))
  }
  
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(t => 
      t.number.toLowerCase().includes(s) ||
      t.fromAccountName.toLowerCase().includes(s) ||
      t.toAccountName.toLowerCase().includes(s) ||
      t.memo?.toLowerCase().includes(s)
    )
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof Transfer]
      const bVal = b[sort.key as keyof Transfer]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function createTransfer(transfer: Partial<Transfer>): Promise<{ success: boolean; transfer?: Transfer }> {
  await delay(SIMULATED_DELAY)
  
  const fromAccount = bankAccounts.find(a => a.id === transfer.fromAccountId)
  const toAccount = bankAccounts.find(a => a.id === transfer.toAccountId)
  
  const newTransfer: Transfer = {
    id: `tr${mockTransfers.length + 1}`,
    number: `TRF-2024-${String(mockTransfers.length + 1).padStart(3, '0')}`,
    date: transfer.date || new Date(),
    amount: transfer.amount || 0,
    currency: 'USD',
    fromAccountId: transfer.fromAccountId || '',
    fromAccountName: fromAccount?.name || '',
    toAccountId: transfer.toAccountId || '',
    toAccountName: toAccount?.name || '',
    status: 'pending',
    reference: transfer.reference,
    memo: transfer.memo,
    entityId: transfer.entityId || 'e1',
    createdBy: 'Current User',
    createdAt: new Date(),
  }
  
  mockTransfers.push(newTransfer)
  return { success: true, transfer: newTransfer }
}

export async function processTransfer(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const transfer = mockTransfers.find(t => t.id === id)
  if (transfer && transfer.status === 'pending') {
    transfer.status = 'processing'
    return { success: true }
  }
  return { success: false }
}

export async function completeTransfer(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const transfer = mockTransfers.find(t => t.id === id)
  if (transfer && (transfer.status === 'pending' || transfer.status === 'processing')) {
    transfer.status = 'completed'
    // Update account balances
    const fromAccount = bankAccounts.find(a => a.id === transfer.fromAccountId)
    const toAccount = bankAccounts.find(a => a.id === transfer.toAccountId)
    if (fromAccount) fromAccount.balance -= transfer.amount
    if (toAccount) toAccount.balance += transfer.amount
    return { success: true }
  }
  return { success: false }
}

export async function cancelTransfer(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const transfer = mockTransfers.find(t => t.id === id)
  if (transfer && transfer.status === 'pending') {
    transfer.status = 'cancelled'
    return { success: true }
  }
  return { success: false }
}

// ============ RECONCILIATION SERVICES ============

const mockReconciliationItems: ReconciliationItem[] = [
  {
    id: 'rec1',
    date: new Date('2024-03-01'),
    description: 'ACH Deposit - Customer Payment',
    reference: 'ACH-12345',
    bankAmount: 15000,
    bookAmount: 15000,
    difference: 0,
    status: 'matched',
    type: 'deposit',
    bankAccountId: 'ba1',
    transactionId: 't1',
    matchedAt: new Date('2024-03-02'),
    matchedBy: 'Sarah Chen',
  },
  {
    id: 'rec2',
    date: new Date('2024-03-02'),
    description: 'Wire Transfer - Vendor Payment',
    reference: 'WIRE-67890',
    bankAmount: -25000,
    bookAmount: -25000,
    difference: 0,
    status: 'matched',
    type: 'withdrawal',
    bankAccountId: 'ba1',
    transactionId: 't2',
    matchedAt: new Date('2024-03-03'),
    matchedBy: 'Michael Johnson',
  },
  {
    id: 'rec3',
    date: new Date('2024-03-05'),
    description: 'Check Deposit - Customer',
    reference: 'CHK-5678',
    bankAmount: 8500,
    bookAmount: 8500,
    difference: 0,
    status: 'cleared',
    type: 'deposit',
    bankAccountId: 'ba1',
  },
  {
    id: 'rec4',
    date: new Date('2024-03-08'),
    description: 'Bank Service Fee',
    reference: 'FEE-MAR',
    bankAmount: -45,
    bookAmount: 0,
    difference: -45,
    status: 'unmatched',
    type: 'fee',
    bankAccountId: 'ba1',
  },
  {
    id: 'rec5',
    date: new Date('2024-03-10'),
    description: 'Interest Earned',
    reference: 'INT-MAR',
    bankAmount: 125,
    bookAmount: 0,
    difference: 125,
    status: 'unmatched',
    type: 'interest',
    bankAccountId: 'ba1',
  },
  {
    id: 'rec6',
    date: new Date('2024-03-12'),
    description: 'ACH Payment - Payroll',
    reference: 'ACH-PR-001',
    bankAmount: -85000,
    bookAmount: -85000,
    difference: 0,
    status: 'matched',
    type: 'withdrawal',
    bankAccountId: 'ba1',
    transactionId: 't3',
    matchedAt: new Date('2024-03-12'),
    matchedBy: 'Emily Davis',
  },
  {
    id: 'rec7',
    date: new Date('2024-03-14'),
    description: 'Wire Deposit - Customer',
    reference: 'WIRE-IN-002',
    bankAmount: 45000,
    bookAmount: 45000,
    difference: 0,
    status: 'cleared',
    type: 'deposit',
    bankAccountId: 'ba1',
  },
  {
    id: 'rec8',
    date: new Date('2024-03-15'),
    description: 'Check #10234 - Vendor',
    reference: 'CHK-10234',
    bankAmount: -12500,
    bookAmount: -12500,
    difference: 0,
    status: 'unmatched',
    type: 'withdrawal',
    bankAccountId: 'ba1',
  },
]

export async function getReconciliationItems(
  bankAccountId: string,
  status?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<ReconciliationItem>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = mockReconciliationItems.filter(r => r.bankAccountId === bankAccountId)
  
  if (status && status.length > 0) {
    filtered = filtered.filter(r => status.includes(r.status))
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof ReconciliationItem]
      const bVal = b[sort.key as keyof ReconciliationItem]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  } else {
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function getReconciliationSummary(bankAccountId: string): Promise<ReconciliationSummary> {
  await delay(SIMULATED_DELAY)
  
  const account = bankAccounts.find(a => a.id === bankAccountId)
  const items = mockReconciliationItems.filter(r => r.bankAccountId === bankAccountId)
  
  const outstandingDeposits = items
    .filter(i => i.status === 'unmatched' && i.bankAmount > 0)
    .reduce((sum, i) => sum + i.bankAmount, 0)
  
  const outstandingWithdrawals = items
    .filter(i => i.status === 'unmatched' && i.bankAmount < 0)
    .reduce((sum, i) => sum + Math.abs(i.bankAmount), 0)
  
  const adjustments = items
    .filter(i => i.status === 'adjusted')
    .reduce((sum, i) => sum + i.difference, 0)
  
  const bankBalance = account?.balance || 0
  const bookBalance = bankBalance - outstandingDeposits + outstandingWithdrawals - adjustments
  
  const hasUnmatched = items.some(i => i.status === 'unmatched')
  
  return {
    bankBalance,
    bookBalance,
    outstandingDeposits,
    outstandingWithdrawals,
    adjustments,
    reconciledBalance: bookBalance + adjustments,
    lastReconciledDate: new Date('2024-02-29'),
    status: hasUnmatched ? 'needs_review' : 'completed',
  }
}

export async function matchReconciliationItem(id: string, transactionId: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const item = mockReconciliationItems.find(r => r.id === id)
  if (item && item.status === 'unmatched') {
    item.status = 'matched'
    item.transactionId = transactionId
    item.matchedAt = new Date()
    item.matchedBy = 'Current User'
    item.difference = 0
    return { success: true }
  }
  return { success: false }
}

export async function clearReconciliationItem(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const item = mockReconciliationItems.find(r => r.id === id)
  if (item && (item.status === 'unmatched' || item.status === 'matched')) {
    item.status = 'cleared'
    return { success: true }
  }
  return { success: false }
}

export async function adjustReconciliationItem(id: string, adjustment: number): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const item = mockReconciliationItems.find(r => r.id === id)
  if (item && item.status === 'unmatched') {
    item.status = 'adjusted'
    item.bookAmount = item.bankAmount
    item.difference = adjustment
    return { success: true }
  }
  return { success: false }
}

// ============ FILTER OPTION SERVICES ============

export async function getEntities(): Promise<Entity[]> {
  await delay(SIMULATED_DELAY)
  return entities
}

export async function getDepartments(): Promise<Department[]> {
  await delay(SIMULATED_DELAY)
  return departments
}

export async function getLocations(): Promise<Location[]> {
  await delay(SIMULATED_DELAY)
  return locations
}

export async function getProjects(): Promise<Project[]> {
  await delay(SIMULATED_DELAY)
  return projects
}

export async function getCustomers(
  search?: string,
  status?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Customer>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...customers]
  
  if (status && status.length > 0) {
    filtered = filtered.filter(c => status.includes(c.status))
  }
  
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(s) ||
      c.customerId?.toLowerCase().includes(s) ||
      c.contactEmail?.toLowerCase().includes(s)
    )
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof Customer]
      const bVal = b[sort.key as keyof Customer]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function getVendors(
  search?: string,
  status?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Vendor>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...vendors]
  
  if (status && status.length > 0) {
    filtered = filtered.filter(v => status.includes(v.status))
  }
  
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(v => 
      v.name.toLowerCase().includes(s) ||
      v.vendorId?.toLowerCase().includes(s) ||
      v.contactEmail?.toLowerCase().includes(s)
    )
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof Vendor]
      const bVal = b[sort.key as keyof Vendor]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function getVendorById(id: string): Promise<Vendor | null> {
  await delay(SIMULATED_DELAY)
  return vendors.find(v => v.id === id) || null
}

export async function createVendor(data: Partial<Vendor>): Promise<{ success: boolean; vendor?: Vendor }> {
  await delay(SIMULATED_DELAY)
  const newVendor: Vendor = {
    id: `v${vendors.length + 1}`,
    name: data.name || '',
    code: data.code || `V${String(vendors.length + 1).padStart(3, '0')}`,
    email: data.email || '',
    phone: data.phone,
    address: data.address,
    taxId: data.taxId,
    paymentTerms: data.paymentTerms || 'Net 30',
    status: data.status || 'active',
    balance: 0,
    currency: data.currency || 'USD',
    createdAt: new Date(),
    bankName: data.bankName,
    bankAccountNumber: data.bankAccountNumber,
    bankRoutingNumber: data.bankRoutingNumber,
    preferredPaymentMethod: data.preferredPaymentMethod,
    remittanceEmail: data.remittanceEmail,
  }
  vendors.push(newVendor)
  return { success: true, vendor: newVendor }
}

export async function updateVendor(id: string, data: Partial<Vendor>): Promise<{ success: boolean; vendor?: Vendor }> {
  await delay(SIMULATED_DELAY)
  const index = vendors.findIndex(v => v.id === id)
  if (index === -1) return { success: false }
  
  vendors[index] = { ...vendors[index], ...data }
  return { success: true, vendor: vendors[index] }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  await delay(SIMULATED_DELAY)
  return customers.find(c => c.id === id) || null
}

export async function getEmployees(): Promise<Employee[]> {
  await delay(SIMULATED_DELAY)
  return employees
}

export async function getAccounts(): Promise<Account[]> {
  await delay(SIMULATED_DELAY)
  return accounts
}

// ============ DASHBOARD METRICS ============

export async function getDashboardMetrics(filters: DashboardFilters): Promise<DashboardMetricsResponse> {
  await delay(SIMULATED_DELAY)
  
  // Simulate filter-based variations
  const entityMultiplier = filters.entityId === 'e4' ? 1 : filters.entityId === 'e1' ? 0.6 : 0.2
  const dateRangeMultiplier = filters.dateRange.preset === 'this_year' ? 1 : 
                             filters.dateRange.preset === 'this_quarter' ? 0.25 : 
                             filters.dateRange.preset === 'this_month' ? 0.08 : 0.5
  
  const baseRevenue = 6100000 * entityMultiplier * dateRangeMultiplier
  const baseExpenses = 4551000 * entityMultiplier * dateRangeMultiplier
  const baseCash = 2450000 * entityMultiplier
  const baseAR = 537500 * entityMultiplier
  const baseAP = 161800 * entityMultiplier

  return {
    totalRevenue: {
      id: 'total-revenue',
      label: 'Total Revenue',
      value: Math.round(baseRevenue),
      previousValue: Math.round(baseRevenue * 0.92),
      change: 8.7,
      changeType: 'positive',
      format: 'currency',
      currency: 'USD'
    },
    totalExpenses: {
      id: 'total-expenses',
      label: 'Total Expenses',
      value: Math.round(baseExpenses),
      previousValue: Math.round(baseExpenses * 0.95),
      change: 5.3,
      changeType: 'negative',
      format: 'currency',
      currency: 'USD'
    },
    netIncome: {
      id: 'net-income',
      label: 'Net Income',
      value: Math.round(baseRevenue - baseExpenses),
      previousValue: Math.round((baseRevenue - baseExpenses) * 0.85),
      change: 17.6,
      changeType: 'positive',
      format: 'currency',
      currency: 'USD'
    },
    cashBalance: {
      id: 'cash-balance',
      label: 'Cash Balance',
      value: Math.round(baseCash),
      previousValue: Math.round(baseCash * 0.88),
      change: 13.6,
      changeType: 'positive',
      format: 'currency',
      currency: 'USD'
    },
    arOutstanding: {
      id: 'ar-outstanding',
      label: 'AR Outstanding',
      value: Math.round(baseAR),
      previousValue: Math.round(baseAR * 1.08),
      change: -7.4,
      changeType: 'positive',
      format: 'currency',
      currency: 'USD'
    },
    apOutstanding: {
      id: 'ap-outstanding',
      label: 'AP Outstanding',
      value: Math.round(baseAP),
      previousValue: Math.round(baseAP * 1.12),
      change: -10.7,
      changeType: 'positive',
      format: 'currency',
      currency: 'USD'
    },
    budgetVariance: {
      id: 'budget-variance',
      label: 'Budget Variance',
      value: 4.2,
      previousValue: 6.8,
      change: -38.2,
      changeType: 'positive',
      format: 'percentage'
    },
    pendingApprovals: {
      id: 'pending-approvals',
      label: 'Pending Approvals',
      value: filters.entityId === 'e4' ? 12 : 5,
      previousValue: filters.entityId === 'e4' ? 8 : 3,
      change: 50,
      changeType: 'negative',
      format: 'number'
    }
  }
}

// ============ CHART DATA SERVICES ============

export async function getRevenueByChannel(filters: DashboardFilters): Promise<RevenueByChannelData[]> {
  await delay(SIMULATED_DELAY)
  
  const multiplier = filters.entityId === 'e4' ? 1 : filters.entityId === 'e1' ? 0.6 : 0.2
  
  return [
    { channel: 'Jan', direct: Math.round(320000 * multiplier), partner: Math.round(120000 * multiplier), online: Math.round(45000 * multiplier) },
    { channel: 'Feb', direct: Math.round(350000 * multiplier), partner: Math.round(125000 * multiplier), online: Math.round(48000 * multiplier) },
    { channel: 'Mar', direct: Math.round(410000 * multiplier), partner: Math.round(145000 * multiplier), online: Math.round(55000 * multiplier) },
    { channel: 'Apr', direct: Math.round(390000 * multiplier), partner: Math.round(138000 * multiplier), online: Math.round(52000 * multiplier) },
    { channel: 'May', direct: Math.round(440000 * multiplier), partner: Math.round(155000 * multiplier), online: Math.round(58000 * multiplier) },
    { channel: 'Jun', direct: Math.round(485000 * multiplier), partner: Math.round(170000 * multiplier), online: Math.round(65000 * multiplier) },
  ]
}

export async function getRevenueTrend(filters: DashboardFilters): Promise<RevenueTrendData[]> {
  await delay(SIMULATED_DELAY)
  
  const multiplier = filters.entityId === 'e4' ? 1 : filters.entityId === 'e1' ? 0.6 : 0.2
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  return [
    { year: 2022, data: months.map((month, i) => ({ month, value: Math.round((400000 + i * 15000) * multiplier * 0.75) })) },
    { year: 2023, data: months.map((month, i) => ({ month, value: Math.round((450000 + i * 20000) * multiplier * 0.9) })) },
    { year: 2024, data: months.slice(0, 6).map((month, i) => ({ month, value: Math.round((500000 + i * 25000) * multiplier) })) },
  ]
}

export async function getDepartmentExpenses(filters: DashboardFilters): Promise<DepartmentExpenseData[]> {
  await delay(SIMULATED_DELAY)
  
  const multiplier = filters.entityId === 'e4' ? 1 : filters.entityId === 'e1' ? 0.6 : 0.2
  const deptFilter = filters.departmentId
  
  const allDepts = [
    { department: 'Sales', salary: 450000, benefits: 90000, travel: 45000, supplies: 12000 },
    { department: 'Marketing', salary: 320000, benefits: 64000, travel: 28000, supplies: 18000 },
    { department: 'Engineering', salary: 680000, benefits: 136000, travel: 15000, supplies: 25000 },
    { department: 'Finance', salary: 280000, benefits: 56000, travel: 8000, supplies: 6000 },
    { department: 'Operations', salary: 390000, benefits: 78000, travel: 22000, supplies: 35000 },
    { department: 'HR', salary: 180000, benefits: 36000, travel: 5000, supplies: 4000 },
  ]
  
  const filtered = deptFilter 
    ? allDepts.filter(d => departments.find(dept => dept.id === deptFilter)?.name === d.department)
    : allDepts
  
  return filtered.map(d => ({
    department: d.department,
    salary: Math.round(d.salary * multiplier),
    benefits: Math.round(d.benefits * multiplier),
    travel: Math.round(d.travel * multiplier),
    supplies: Math.round(d.supplies * multiplier),
  }))
}

export async function getCashWeekly(filters: DashboardFilters): Promise<CashWeeklyData[]> {
  await delay(SIMULATED_DELAY)
  
  const multiplier = filters.entityId === 'e4' ? 1 : filters.entityId === 'e1' ? 0.6 : 0.2
  let running = Math.round(2100000 * multiplier)
  
  return ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'].map(week => {
    const inflow = Math.round((150000 + Math.random() * 80000) * multiplier)
    const outflow = Math.round((120000 + Math.random() * 60000) * multiplier)
    const opening = running
    running = opening + inflow - outflow
    return { week, opening, inflow, outflow, closing: running }
  })
}

export async function getContractExpensesByRep(filters: DashboardFilters): Promise<ContractExpenseData[]> {
  await delay(SIMULATED_DELAY)
  
  const multiplier = filters.entityId === 'e4' ? 1 : filters.entityId === 'e1' ? 0.6 : 0.2
  
  return [
    { rep: 'John Smith', value: Math.round(125000 * multiplier), color: 'hsl(var(--chart-1))' },
    { rep: 'Emily Davis', value: Math.round(98000 * multiplier), color: 'hsl(var(--chart-2))' },
    { rep: 'Michael Johnson', value: Math.round(87000 * multiplier), color: 'hsl(var(--chart-3))' },
    { rep: 'Sarah Chen', value: Math.round(76000 * multiplier), color: 'hsl(var(--chart-4))' },
    { rep: 'Others', value: Math.round(54000 * multiplier), color: 'hsl(var(--chart-5))' },
  ]
}

export async function getAPAging(filters: DashboardFilters): Promise<AgingData[]> {
  await delay(SIMULATED_DELAY)
  
  const multiplier = filters.entityId === 'e4' ? 1 : filters.entityId === 'e1' ? 0.6 : 0.2
  
  return [
    { bucket: 'Current', amount: Math.round(85000 * multiplier), count: 12 },
    { bucket: '1-30 Days', amount: Math.round(42000 * multiplier), count: 8 },
    { bucket: '31-60 Days', amount: Math.round(22800 * multiplier), count: 5 },
    { bucket: '61-90 Days', amount: Math.round(8500 * multiplier), count: 2 },
    { bucket: '90+ Days', amount: Math.round(3500 * multiplier), count: 1 },
  ]
}

export async function getARAging(filters: DashboardFilters): Promise<AgingData[]> {
  await delay(SIMULATED_DELAY)
  
  const multiplier = filters.entityId === 'e4' ? 1 : filters.entityId === 'e1' ? 0.6 : 0.2
  
  return [
    { bucket: 'Current', amount: Math.round(285000 * multiplier), count: 15 },
    { bucket: '1-30 Days', amount: Math.round(125000 * multiplier), count: 9 },
    { bucket: '31-60 Days', amount: Math.round(87500 * multiplier), count: 6 },
    { bucket: '61-90 Days', amount: Math.round(28000 * multiplier), count: 3 },
    { bucket: '90+ Days', amount: Math.round(12000 * multiplier), count: 2 },
  ]
}

export async function getBudgetVsActual(filters: DashboardFilters): Promise<BudgetActualData[]> {
  await delay(SIMULATED_DELAY)
  
  const multiplier = filters.entityId === 'e4' ? 1 : filters.entityId === 'e1' ? 0.6 : 0.2
  
  return [
    { category: 'Revenue', budget: Math.round(6500000 * multiplier), actual: Math.round(6100000 * multiplier), variance: Math.round(-400000 * multiplier), variancePercent: -6.2 },
    { category: 'COGS', budget: Math.round(2600000 * multiplier), actual: Math.round(2425000 * multiplier), variance: Math.round(175000 * multiplier), variancePercent: 6.7 },
    { category: 'Payroll', budget: Math.round(1900000 * multiplier), actual: Math.round(1850000 * multiplier), variance: Math.round(50000 * multiplier), variancePercent: 2.6 },
    { category: 'Marketing', budget: Math.round(400000 * multiplier), actual: Math.round(450000 * multiplier), variance: Math.round(-50000 * multiplier), variancePercent: -12.5 },
    { category: 'Operations', budget: Math.round(300000 * multiplier), actual: Math.round(276000 * multiplier), variance: Math.round(24000 * multiplier), variancePercent: 8.0 },
  ]
}

export async function getEntityPerformance(filters: DashboardFilters): Promise<EntityPerformanceData[]> {
  await delay(SIMULATED_DELAY)
  
  if (filters.entityId !== 'e4') {
    const entity = entities.find(e => e.id === filters.entityId)
    if (entity) {
      const multiplier = filters.entityId === 'e1' ? 0.6 : 0.2
      return [{
        entityId: entity.id,
        entityName: entity.name,
        revenue: Math.round(6100000 * multiplier),
        expenses: Math.round(4551000 * multiplier),
        netIncome: Math.round(1549000 * multiplier),
        cashBalance: Math.round(2450000 * multiplier),
      }]
    }
  }
  
  return [
    { entityId: 'e1', entityName: 'Acme Corporation', revenue: 3660000, expenses: 2730600, netIncome: 929400, cashBalance: 1470000 },
    { entityId: 'e2', entityName: 'Acme West', revenue: 1220000, expenses: 910200, netIncome: 309800, cashBalance: 490000 },
    { entityId: 'e3', entityName: 'Acme Europe', revenue: 1220000, expenses: 910200, netIncome: 309800, cashBalance: 490000 },
  ]
}

// ============ TRANSACTION SERVICES ============

export async function getTransactions(
  filters: DashboardFilters,
  search?: string,
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Transaction>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockTransactions]
  
  // Apply entity filter
  if (filters.entityId && filters.entityId !== 'e4') {
    filtered = filtered.filter(t => t.entityId === filters.entityId)
  }
  
  // Apply date filter
  filtered = filtered.filter(t => 
    t.date >= filters.dateRange.startDate && t.date <= filters.dateRange.endDate
  )
  
  // Apply search
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(s) ||
      t.accountName.toLowerCase().includes(s) ||
      t.reference?.toLowerCase().includes(s)
    )
  }
  
  // Apply sort
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof Transaction]
      const bVal = b[sort.key as keyof Transaction]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  await delay(SIMULATED_DELAY)
  return mockTransactions.find(t => t.id === id) || null
}

// ============ APPROVAL SERVICES ============

export async function getApprovalItems(
  filters: DashboardFilters,
  status?: 'pending' | 'approved' | 'rejected',
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<ApprovalItem>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockApprovalItems]
  
  if (filters.entityId && filters.entityId !== 'e4') {
    filtered = filtered.filter(a => a.entityId === filters.entityId)
  }
  
  if (status) {
    filtered = filtered.filter(a => a.status === status)
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function approveItem(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const item = mockApprovalItems.find(a => a.id === id)
  if (item) {
    item.status = 'approved'
    return { success: true }
  }
  return { success: false }
}

export async function rejectItem(id: string, reason?: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const item = mockApprovalItems.find(a => a.id === id)
  if (item) {
    item.status = 'rejected'
    return { success: true }
  }
  return { success: false }
}

// ============ BILL SERVICES ============

export async function getBills(
  filters: DashboardFilters,
  search?: string,
  status?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Bill>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockBills]
  
  if (filters.entityId && filters.entityId !== 'e4') {
    filtered = filtered.filter(b => b.entityId === filters.entityId)
  }
  
  if (filters.vendorId) {
    filtered = filtered.filter(b => b.vendorId === filters.vendorId)
  }
  
  if (status && status.length > 0) {
    filtered = filtered.filter(b => status.includes(b.status))
  }
  
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(b => 
      b.number.toLowerCase().includes(s) ||
      b.vendorName.toLowerCase().includes(s) ||
      b.description?.toLowerCase().includes(s)
    )
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof Bill]
      const bVal = b[sort.key as keyof Bill]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function getBillById(id: string): Promise<Bill | null> {
  await delay(SIMULATED_DELAY)
  return mockBills.find(b => b.id === id) || null
}

export async function createBill(bill: Partial<Bill>): Promise<{ success: boolean; bill?: Bill }> {
  await delay(SIMULATED_DELAY)
  
  const newBill: Bill = {
    id: `b${mockBills.length + 1}`,
    number: `BILL-2024-${String(mockBills.length + 1).padStart(3, '0')}`,
    vendorId: bill.vendorId || '',
    vendorName: bill.vendorName || '',
    date: bill.date || new Date(),
    dueDate: bill.dueDate || new Date(),
    amount: bill.amount || 0,
    currency: 'USD',
    status: 'draft',
    description: bill.description,
    lineItems: bill.lineItems || [],
    entityId: bill.entityId || 'e1',
    createdAt: new Date(),
  }
  mockBills.push(newBill)
  return { success: true, bill: newBill }
}

export async function updateBill(id: string, updates: Partial<Bill>): Promise<{ success: boolean; bill?: Bill }> {
  await delay(SIMULATED_DELAY)
  const index = mockBills.findIndex(b => b.id === id)
  if (index !== -1) {
    mockBills[index] = { ...mockBills[index], ...updates }
    return { success: true, bill: mockBills[index] }
  }
  return { success: false }
}

export async function approveBill(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const bill = mockBills.find(b => b.id === id)
  if (bill && (bill.status === 'draft' || bill.status === 'pending')) {
    bill.status = 'approved'
    bill.approvalStatus = 'approved'
    bill.approvedAt = new Date()
    bill.approvedBy = 'Current User'
    return { success: true }
  }
  return { success: false }
}

export async function rejectBill(id: string, reason: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const bill = mockBills.find(b => b.id === id)
  if (bill && bill.approvalStatus === 'pending_approval') {
    bill.approvalStatus = 'rejected'
    bill.rejectedAt = new Date()
    bill.rejectedBy = 'Current User'
    bill.rejectionReason = reason
    return { success: true }
  }
  return { success: false }
}

export async function submitBillForApproval(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const bill = mockBills.find(b => b.id === id)
  if (bill && bill.approvalStatus === 'not_submitted') {
    bill.approvalStatus = 'pending_approval'
    bill.status = 'pending'
    bill.submittedAt = new Date()
    bill.submittedBy = 'Current User'
    return { success: true }
  }
  return { success: false }
}

export async function voidBill(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const bill = mockBills.find(b => b.id === id)
  if (bill && bill.status !== 'paid') {
    bill.status = 'voided'
    return { success: true }
  }
  return { success: false }
}

// ============ PAYMENT SERVICES ============

import type { Payment } from '@/lib/types'

const mockPayments: Payment[] = [
  {
    id: 'pay1',
    number: 'PAY-2024-001',
    date: new Date('2024-03-10'),
    amount: 12500,
    currency: 'USD',
    method: 'ach',
    status: 'completed',
    vendorId: 'v1',
    vendorName: 'Acme Supplies Inc.',
    billIds: ['b1'],
    bankAccountId: 'ba1',
    bankAccountName: 'Operating Account',
    reference: 'ACH-789456',
    memo: 'March payment',
    entityId: 'e1',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2024-03-10'),
  },
  {
    id: 'pay2',
    number: 'PAY-2024-002',
    date: new Date('2024-03-12'),
    amount: 8750,
    currency: 'USD',
    method: 'check',
    status: 'completed',
    vendorId: 'v2',
    vendorName: 'TechPro Services',
    billIds: ['b2'],
    bankAccountId: 'ba1',
    bankAccountName: 'Operating Account',
    checkNumber: '10234',
    memo: 'IT services - Q1',
    entityId: 'e1',
    createdBy: 'Michael Johnson',
    createdAt: new Date('2024-03-12'),
  },
  {
    id: 'pay3',
    number: 'PAY-2024-003',
    date: new Date('2024-03-14'),
    amount: 45000,
    currency: 'USD',
    method: 'wire',
    status: 'processing',
    vendorId: 'v3',
    vendorName: 'Global Partners LLC',
    billIds: ['b3', 'b4'],
    bankAccountId: 'ba1',
    bankAccountName: 'Operating Account',
    reference: 'WIRE-2024-0314',
    memo: 'International supplier payment',
    entityId: 'e1',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2024-03-14'),
  },
  {
    id: 'pay4',
    number: 'PAY-2024-004',
    date: new Date('2024-03-15'),
    amount: 3200,
    currency: 'USD',
    method: 'credit_card',
    status: 'completed',
    vendorId: 'v4',
    vendorName: 'Office Depot',
    billIds: ['b5'],
    bankAccountId: 'ba2',
    bankAccountName: 'Corporate Card',
    reference: 'CC-4521',
    memo: 'Office supplies',
    entityId: 'e1',
    createdBy: 'Emily Davis',
    createdAt: new Date('2024-03-15'),
  },
  {
    id: 'pay5',
    number: 'PAY-2024-005',
    date: new Date('2024-03-16'),
    amount: 15800,
    currency: 'USD',
    method: 'ach',
    status: 'pending',
    vendorId: 'v1',
    vendorName: 'Acme Supplies Inc.',
    billIds: ['b6'],
    bankAccountId: 'ba1',
    bankAccountName: 'Operating Account',
    memo: 'Pending batch',
    entityId: 'e1',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2024-03-16'),
  },
]

export async function getPayments(
  filters: DashboardFilters,
  search?: string,
  status?: string[],
  method?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Payment>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockPayments]
  
  if (filters.entityId && filters.entityId !== 'e4') {
    filtered = filtered.filter(p => p.entityId === filters.entityId)
  }
  
  if (filters.vendorId) {
    filtered = filtered.filter(p => p.vendorId === filters.vendorId)
  }
  
  if (status && status.length > 0) {
    filtered = filtered.filter(p => status.includes(p.status))
  }
  
  if (method && method.length > 0) {
    filtered = filtered.filter(p => method.includes(p.method))
  }
  
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(p => 
      p.number.toLowerCase().includes(s) ||
      p.vendorName.toLowerCase().includes(s) ||
      p.reference?.toLowerCase().includes(s) ||
      p.checkNumber?.toLowerCase().includes(s)
    )
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof Payment]
      const bVal = b[sort.key as keyof Payment]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  await delay(SIMULATED_DELAY)
  return mockPayments.find(p => p.id === id) || null
}

export async function createPayment(payment: Partial<Payment>): Promise<{ success: boolean; payment?: Payment }> {
  await delay(SIMULATED_DELAY)
  
  const newPayment: Payment = {
    id: `pay${mockPayments.length + 1}`,
    number: `PAY-2024-${String(mockPayments.length + 1).padStart(3, '0')}`,
    date: payment.date || new Date(),
    amount: payment.amount || 0,
    currency: 'USD',
    method: payment.method || 'ach',
    status: 'pending',
    vendorId: payment.vendorId || '',
    vendorName: payment.vendorName || '',
    billIds: payment.billIds || [],
    bankAccountId: payment.bankAccountId || '',
    bankAccountName: payment.bankAccountName || '',
    checkNumber: payment.checkNumber,
    reference: payment.reference,
    memo: payment.memo,
    entityId: payment.entityId || 'e1',
    createdBy: 'Current User',
    createdAt: new Date(),
  }
  
  // Mark associated bills as paid
  newPayment.billIds.forEach(billId => {
    const bill = mockBills.find(b => b.id === billId)
    if (bill) bill.status = 'paid'
  })
  
  mockPayments.push(newPayment)
  return { success: true, payment: newPayment }
}

export async function processPayment(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const payment = mockPayments.find(p => p.id === id)
  if (payment && payment.status === 'pending') {
    payment.status = 'processing'
    return { success: true }
  }
  return { success: false }
}

export async function completePayment(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const payment = mockPayments.find(p => p.id === id)
  if (payment && (payment.status === 'pending' || payment.status === 'processing')) {
    payment.status = 'completed'
    return { success: true }
  }
  return { success: false }
}

export async function voidPayment(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const payment = mockPayments.find(p => p.id === id)
  if (payment && payment.status !== 'completed') {
    payment.status = 'voided'
    // Restore bills to approved status
    payment.billIds.forEach(billId => {
      const bill = mockBills.find(b => b.id === billId)
      if (bill) bill.status = 'approved'
    })
    return { success: true }
  }
  return { success: false }
}

// ============ INVOICE SERVICES ============

export async function getInvoices(
  filters: DashboardFilters,
  search?: string,
  status?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Invoice>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockInvoices]
  
  if (filters.entityId && filters.entityId !== 'e4') {
    filtered = filtered.filter(i => i.entityId === filters.entityId)
  }
  
  if (filters.customerId) {
    filtered = filtered.filter(i => i.customerId === filters.customerId)
  }
  
  if (status && status.length > 0) {
    filtered = filtered.filter(i => status.includes(i.status))
  }
  
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(i => 
      i.number.toLowerCase().includes(s) ||
      i.customerName.toLowerCase().includes(s) ||
      i.description?.toLowerCase().includes(s)
    )
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof Invoice]
      const bVal = b[sort.key as keyof Invoice]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  await delay(SIMULATED_DELAY)
  return mockInvoices.find(i => i.id === id) || null
}

export async function createInvoice(invoice: Partial<Invoice>): Promise<{ success: boolean; invoice?: Invoice }> {
  await delay(SIMULATED_DELAY)
  
  const newInvoice: Invoice = {
    id: `inv${mockInvoices.length + 1}`,
    number: `INV-2024-${String(mockInvoices.length + 1).padStart(3, '0')}`,
    customerId: invoice.customerId || '',
    customerName: invoice.customerName || '',
    date: invoice.date || new Date(),
    dueDate: invoice.dueDate || new Date(),
    amount: invoice.amount || 0,
    currency: 'USD',
    status: 'draft',
    description: invoice.description,
    lineItems: invoice.lineItems || [],
    entityId: invoice.entityId || 'e1',
    createdAt: new Date(),
  }
  mockInvoices.push(newInvoice)
  return { success: true, invoice: newInvoice }
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<{ success: boolean; invoice?: Invoice }> {
  await delay(SIMULATED_DELAY)
  const index = mockInvoices.findIndex(i => i.id === id)
  if (index !== -1) {
    mockInvoices[index] = { ...mockInvoices[index], ...updates }
    return { success: true, invoice: mockInvoices[index] }
  }
  return { success: false }
}

export async function sendInvoice(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const invoice = mockInvoices.find(i => i.id === id)
  if (invoice && invoice.status === 'draft') {
    invoice.status = 'sent'
    return { success: true }
  }
  return { success: false }
}

export async function voidInvoice(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const invoice = mockInvoices.find(i => i.id === id)
  if (invoice && invoice.status !== 'paid') {
    invoice.status = 'voided'
    return { success: true }
  }
  return { success: false }
}

// ============ RECEIPT SERVICES ============

import type { Receipt } from '@/lib/types'

const mockReceipts: Receipt[] = [
  {
    id: 'rec1',
    number: 'REC-2024-001',
    date: new Date('2024-03-08'),
    amount: 15000,
    currency: 'USD',
    method: 'ach',
    status: 'applied',
    customerId: 'c1',
    customerName: 'Globex Corporation',
    invoiceIds: ['inv1'],
    bankAccountId: 'ba1',
    bankAccountName: 'Operating Account',
    reference: 'ACH-12345',
    memo: 'March payment',
    entityId: 'e1',
    createdBy: 'Emily Davis',
    createdAt: new Date('2024-03-08'),
  },
  {
    id: 'rec2',
    number: 'REC-2024-002',
    date: new Date('2024-03-10'),
    amount: 8500,
    currency: 'USD',
    method: 'check',
    status: 'applied',
    customerId: 'c2',
    customerName: 'Initech Industries',
    invoiceIds: ['inv2'],
    bankAccountId: 'ba1',
    bankAccountName: 'Operating Account',
    checkNumber: '5678',
    memo: 'Invoice payment',
    entityId: 'e1',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2024-03-10'),
  },
  {
    id: 'rec3',
    number: 'REC-2024-003',
    date: new Date('2024-03-12'),
    amount: 25000,
    currency: 'USD',
    method: 'wire',
    status: 'unapplied',
    customerId: 'c3',
    customerName: 'Umbrella Corp',
    invoiceIds: [],
    bankAccountId: 'ba1',
    bankAccountName: 'Operating Account',
    reference: 'WIRE-2024-0312',
    memo: 'Advance payment - to be applied',
    entityId: 'e1',
    createdBy: 'Michael Johnson',
    createdAt: new Date('2024-03-12'),
  },
  {
    id: 'rec4',
    number: 'REC-2024-004',
    date: new Date('2024-03-14'),
    amount: 12300,
    currency: 'USD',
    method: 'credit_card',
    status: 'applied',
    customerId: 'c4',
    customerName: 'Wayne Enterprises',
    invoiceIds: ['inv3', 'inv4'],
    bankAccountId: 'ba2',
    bankAccountName: 'Merchant Account',
    reference: 'CC-9876',
    memo: 'Online payment',
    entityId: 'e1',
    createdBy: 'Emily Davis',
    createdAt: new Date('2024-03-14'),
  },
  {
    id: 'rec5',
    number: 'REC-2024-005',
    date: new Date('2024-03-15'),
    amount: 5500,
    currency: 'USD',
    method: 'cash',
    status: 'pending',
    customerId: 'c1',
    customerName: 'Globex Corporation',
    invoiceIds: ['inv5'],
    bankAccountId: 'ba1',
    bankAccountName: 'Operating Account',
    memo: 'Cash payment - pending deposit',
    entityId: 'e1',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2024-03-15'),
  },
]

export async function getReceipts(
  filters: DashboardFilters,
  search?: string,
  status?: string[],
  method?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Receipt>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockReceipts]
  
  if (filters.entityId && filters.entityId !== 'e4') {
    filtered = filtered.filter(r => r.entityId === filters.entityId)
  }
  
  if (filters.customerId) {
    filtered = filtered.filter(r => r.customerId === filters.customerId)
  }
  
  if (status && status.length > 0) {
    filtered = filtered.filter(r => status.includes(r.status))
  }
  
  if (method && method.length > 0) {
    filtered = filtered.filter(r => method.includes(r.method))
  }
  
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(r => 
      r.number.toLowerCase().includes(s) ||
      r.customerName.toLowerCase().includes(s) ||
      r.reference?.toLowerCase().includes(s) ||
      r.checkNumber?.toLowerCase().includes(s)
    )
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof Receipt]
      const bVal = b[sort.key as keyof Receipt]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function getReceiptById(id: string): Promise<Receipt | null> {
  await delay(SIMULATED_DELAY)
  return mockReceipts.find(r => r.id === id) || null
}

export async function createReceipt(receipt: Partial<Receipt>): Promise<{ success: boolean; receipt?: Receipt }> {
  await delay(SIMULATED_DELAY)
  
  const newReceipt: Receipt = {
    id: `rec${mockReceipts.length + 1}`,
    number: `REC-2024-${String(mockReceipts.length + 1).padStart(3, '0')}`,
    date: receipt.date || new Date(),
    amount: receipt.amount || 0,
    currency: 'USD',
    method: receipt.method || 'check',
    status: receipt.invoiceIds && receipt.invoiceIds.length > 0 ? 'applied' : 'unapplied',
    customerId: receipt.customerId || '',
    customerName: receipt.customerName || '',
    invoiceIds: receipt.invoiceIds || [],
    bankAccountId: receipt.bankAccountId || '',
    bankAccountName: receipt.bankAccountName || '',
    checkNumber: receipt.checkNumber,
    reference: receipt.reference,
    memo: receipt.memo,
    entityId: receipt.entityId || 'e1',
    createdBy: 'Current User',
    createdAt: new Date(),
  }
  
  // Mark associated invoices as paid
  newReceipt.invoiceIds.forEach(invoiceId => {
    const invoice = mockInvoices.find(i => i.id === invoiceId)
    if (invoice) invoice.status = 'paid'
  })
  
  mockReceipts.push(newReceipt)
  return { success: true, receipt: newReceipt }
}

export async function applyReceipt(id: string, invoiceIds: string[]): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const receipt = mockReceipts.find(r => r.id === id)
  if (receipt && receipt.status === 'unapplied') {
    receipt.invoiceIds = invoiceIds
    receipt.status = 'applied'
    // Mark invoices as paid
    invoiceIds.forEach(invoiceId => {
      const invoice = mockInvoices.find(i => i.id === invoiceId)
      if (invoice) invoice.status = 'paid'
    })
    return { success: true }
  }
  return { success: false }
}

export async function voidReceipt(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const receipt = mockReceipts.find(r => r.id === id)
  if (receipt && receipt.status !== 'voided') {
    receipt.status = 'voided'
    // Restore invoices to sent status
    receipt.invoiceIds.forEach(invoiceId => {
      const invoice = mockInvoices.find(i => i.id === invoiceId)
      if (invoice) invoice.status = 'sent'
    })
    return { success: true }
  }
  return { success: false }
}

// ============ JOURNAL ENTRY SERVICES ============

export async function getJournalEntries(
  filters: DashboardFilters,
  search?: string,
  status?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<JournalEntry>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockJournalEntries]
  
  if (filters.entityId && filters.entityId !== 'e4') {
    filtered = filtered.filter(j => j.entityId === filters.entityId)
  }
  
  if (status && status.length > 0) {
    filtered = filtered.filter(j => status.includes(j.status))
  }
  
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(j => 
      j.number.toLowerCase().includes(s) ||
      j.description.toLowerCase().includes(s)
    )
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof JournalEntry]
      const bVal = b[sort.key as keyof JournalEntry]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

// ============ JOURNAL ENTRY DETAIL SERVICES ============

export async function getJournalEntryById(id: string): Promise<JournalEntry | null> {
  await delay(SIMULATED_DELAY)
  return mockJournalEntries.find(j => j.id === id) || null
}

export async function saveJournalEntry(entry: Partial<JournalEntry>): Promise<{ success: boolean; entry?: JournalEntry }> {
  await delay(SIMULATED_DELAY)
  
  if (entry.id) {
    // Update existing
    const index = mockJournalEntries.findIndex(j => j.id === entry.id)
    if (index !== -1) {
      mockJournalEntries[index] = { ...mockJournalEntries[index], ...entry } as JournalEntry
      return { success: true, entry: mockJournalEntries[index] }
    }
    return { success: false }
  } else {
    // Create new
    const newEntry: JournalEntry = {
      id: `je${mockJournalEntries.length + 1}`,
      number: `JE-2024-${String(mockJournalEntries.length + 1).padStart(3, '0')}`,
      date: entry.date || new Date(),
      description: entry.description || '',
      status: 'draft',
      lines: entry.lines || [],
      entityId: entry.entityId || 'e1',
      createdBy: 'Current User',
      createdAt: new Date(),
    }
    mockJournalEntries.push(newEntry)
    return { success: true, entry: newEntry }
  }
}

export async function postJournalEntry(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const entry = mockJournalEntries.find(j => j.id === id)
  if (entry && entry.status === 'draft') {
    entry.status = 'posted'
    entry.postedAt = new Date()
    return { success: true }
  }
  return { success: false }
}

export async function reverseJournalEntry(id: string): Promise<{ success: boolean; reversalEntry?: JournalEntry }> {
  await delay(SIMULATED_DELAY)
  const entry = mockJournalEntries.find(j => j.id === id)
  if (entry && entry.status === 'posted') {
    entry.status = 'reversed'
    // Create reversal entry
    const reversalEntry: JournalEntry = {
      id: `je${mockJournalEntries.length + 1}`,
      number: `JE-2024-${String(mockJournalEntries.length + 1).padStart(3, '0')}-REV`,
      date: new Date(),
      description: `Reversal of ${entry.number}: ${entry.description}`,
      status: 'posted',
      lines: entry.lines.map(line => ({
        ...line,
        id: `${line.id}-rev`,
        debit: line.credit,
        credit: line.debit,
      })),
      entityId: entry.entityId,
      createdBy: 'Current User',
      createdAt: new Date(),
      postedAt: new Date(),
    }
    mockJournalEntries.push(reversalEntry)
    return { success: true, reversalEntry }
  }
  return { success: false }
}

// ============ CHART OF ACCOUNTS SERVICES ============

export async function getChartOfAccounts(
  search?: string,
  type?: string[],
  status?: string[],
  sort?: SortConfig
): Promise<Account[]> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...accounts]
  
  if (type && type.length > 0) {
    filtered = filtered.filter(a => type.includes(a.type))
  }
  
  if (status && status.length > 0) {
    filtered = filtered.filter(a => status.includes(a.status))
  }
  
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(a => 
      a.number.toLowerCase().includes(s) ||
      a.name.toLowerCase().includes(s) ||
      a.category.toLowerCase().includes(s)
    )
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof Account]
      const bVal = b[sort.key as keyof Account]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  } else {
    // Default sort by account number
    filtered.sort((a, b) => a.number.localeCompare(b.number))
  }
  
  return filtered
}

export async function getAccountById(id: string): Promise<Account | null> {
  await delay(SIMULATED_DELAY)
  return accounts.find(a => a.id === id) || null
}

export async function saveAccount(account: Partial<Account>): Promise<{ success: boolean; account?: Account }> {
  await delay(SIMULATED_DELAY)
  
  if (account.id) {
    const index = accounts.findIndex(a => a.id === account.id)
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...account } as Account
      return { success: true, account: accounts[index] }
    }
    return { success: false }
  } else {
    const newAccount: Account = {
      id: `acc${accounts.length + 1}`,
      number: account.number || '',
      name: account.name || '',
      type: account.type || 'expense',
      category: account.category || '',
      balance: 0,
      currency: 'USD',
      status: 'active',
    }
    accounts.push(newAccount)
    return { success: true, account: newAccount }
  }
}

export async function deleteAccount(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const index = accounts.findIndex(a => a.id === id)
  if (index !== -1) {
    accounts[index].status = 'inactive'
    return { success: true }
  }
  return { success: false }
}

// ============ TRIAL BALANCE SERVICES ============

export interface TrialBalanceRow {
  accountId: string
  accountNumber: string
  accountName: string
  accountType: string
  openingDebit: number
  openingCredit: number
  periodDebit: number
  periodCredit: number
  closingDebit: number
  closingCredit: number
}

export async function getTrialBalance(filters: DashboardFilters): Promise<TrialBalanceRow[]> {
  await delay(SIMULATED_DELAY)
  
  const multiplier = filters.entityId === 'e4' ? 1 : filters.entityId === 'e1' ? 0.6 : 0.2
  
  // Generate trial balance data based on accounts
  const trialBalance: TrialBalanceRow[] = accounts
    .filter(a => a.status === 'active')
    .map(account => {
      const isDebitNormal = ['asset', 'expense'].includes(account.type)
      const baseAmount = Math.abs(account.balance) * multiplier
      
      let openingDebit = 0, openingCredit = 0, periodDebit = 0, periodCredit = 0
      
      if (isDebitNormal) {
        openingDebit = Math.round(baseAmount * 0.8)
        periodDebit = Math.round(baseAmount * 0.3)
        periodCredit = Math.round(baseAmount * 0.1)
      } else {
        openingCredit = Math.round(baseAmount * 0.8)
        periodCredit = Math.round(baseAmount * 0.3)
        periodDebit = Math.round(baseAmount * 0.1)
      }
      
      return {
        accountId: account.id,
        accountNumber: account.number,
        accountName: account.name,
        accountType: account.type,
        openingDebit,
        openingCredit,
        periodDebit,
        periodCredit,
        closingDebit: openingDebit + periodDebit - periodCredit,
        closingCredit: openingCredit + periodCredit - periodDebit > 0 ? openingCredit + periodCredit - periodDebit : 0,
      }
    })
  
  return trialBalance
}

// ============ AUDIT LOG SERVICES ============

export interface AuditLogEntry {
  id: string
  timestamp: Date
  action: 'create' | 'update' | 'delete' | 'post' | 'reverse' | 'approve' | 'reject'
  entityType: 'journal_entry' | 'bill' | 'invoice' | 'account' | 'vendor' | 'customer'
  entityId: string
  entityNumber: string
  userId: string
  userName: string
  changes?: { field: string; oldValue: string; newValue: string }[]
  ipAddress: string
}

export async function getAuditLogs(
  entityType?: string,
  entityId?: string,
  startDate?: Date,
  endDate?: Date,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<AuditLogEntry>> {
  await delay(SIMULATED_DELAY)
  
  // Generate mock audit logs
  const allLogs: AuditLogEntry[] = [
    {
      id: 'log1',
      timestamp: new Date('2024-03-15T14:30:00'),
      action: 'post',
      entityType: 'journal_entry',
      entityId: 'je1',
      entityNumber: 'JE-2024-001',
      userId: 'emp4',
      userName: 'Sarah Chen',
      ipAddress: '192.168.1.100'
    },
    {
      id: 'log2',
      timestamp: new Date('2024-03-15T14:25:00'),
      action: 'update',
      entityType: 'journal_entry',
      entityId: 'je1',
      entityNumber: 'JE-2024-001',
      userId: 'emp4',
      userName: 'Sarah Chen',
      changes: [
        { field: 'description', oldValue: 'Monthly accruals', newValue: 'Monthly accruals - March 2024' }
      ],
      ipAddress: '192.168.1.100'
    },
    {
      id: 'log3',
      timestamp: new Date('2024-03-15T14:20:00'),
      action: 'create',
      entityType: 'journal_entry',
      entityId: 'je1',
      entityNumber: 'JE-2024-001',
      userId: 'emp3',
      userName: 'Michael Johnson',
      ipAddress: '192.168.1.105'
    },
    {
      id: 'log4',
      timestamp: new Date('2024-03-14T16:45:00'),
      action: 'approve',
      entityType: 'bill',
      entityId: 'b1',
      entityNumber: 'BILL-2024-001',
      userId: 'emp4',
      userName: 'Sarah Chen',
      ipAddress: '192.168.1.100'
    },
    {
      id: 'log5',
      timestamp: new Date('2024-03-14T10:30:00'),
      action: 'create',
      entityType: 'bill',
      entityId: 'b1',
      entityNumber: 'BILL-2024-001',
      userId: 'emp3',
      userName: 'Michael Johnson',
      ipAddress: '192.168.1.105'
    },
    {
      id: 'log6',
      timestamp: new Date('2024-03-13T11:00:00'),
      action: 'update',
      entityType: 'account',
      entityId: 'acc1',
      entityNumber: '1000',
      userId: 'emp4',
      userName: 'Sarah Chen',
      changes: [
        { field: 'name', oldValue: 'Cash', newValue: 'Cash and Equivalents' }
      ],
      ipAddress: '192.168.1.100'
    },
    {
      id: 'log7',
      timestamp: new Date('2024-03-12T15:20:00'),
      action: 'reverse',
      entityType: 'journal_entry',
      entityId: 'je5',
      entityNumber: 'JE-2024-005',
      userId: 'emp4',
      userName: 'Sarah Chen',
      ipAddress: '192.168.1.100'
    },
  ]
  
  let filtered = [...allLogs]
  
  if (entityType) {
    filtered = filtered.filter(l => l.entityType === entityType)
  }
  
  if (entityId) {
    filtered = filtered.filter(l => l.entityId === entityId)
  }
  
  if (startDate) {
    filtered = filtered.filter(l => l.timestamp >= startDate)
  }
  
  if (endDate) {
    filtered = filtered.filter(l => l.timestamp <= endDate)
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

// ============ AI INSIGHTS ============

export async function getAIInsights(filters: DashboardFilters): Promise<AIInsight[]> {
  await delay(SIMULATED_DELAY)
  
  const insights: AIInsight[] = [
    {
      id: 'ai1',
      type: 'anomaly',
      severity: 'warning',
      title: 'Unusual expense pattern detected',
      description: 'Marketing expenses increased 45% compared to the same period last year. This exceeds the typical variance threshold of 25%.',
      relatedIds: ['t2'],
      actionLabel: 'Review Details',
      actionHref: '/reports/expense-analysis',
      createdAt: new Date('2024-03-15T08:00:00')
    },
    {
      id: 'ai2',
      type: 'duplicate',
      severity: 'critical',
      title: 'Potential duplicate bill detected',
      description: 'BILL-2024-001 appears to be similar to BILL-2024-003 from the same vendor with matching amounts.',
      relatedIds: ['b1', 'b3'],
      actionLabel: 'Compare Bills',
      actionHref: '/accounts-payable/bills?compare=b1,b3',
      createdAt: new Date('2024-03-14T14:30:00')
    },
    {
      id: 'ai3',
      type: 'missing_receipt',
      severity: 'warning',
      title: '3 expenses missing receipts',
      description: 'Three expense transactions over $500 are missing attached receipts, which may impact audit compliance.',
      actionLabel: 'View Expenses',
      actionHref: '/time-expenses/expense-reports?missing=receipts',
      createdAt: new Date('2024-03-14T10:00:00')
    },
    {
      id: 'ai4',
      type: 'budget_variance',
      severity: 'info',
      title: 'Revenue tracking below budget',
      description: 'YTD revenue is 6.2% below budget. At current trajectory, annual revenue may miss target by $780K.',
      actionLabel: 'View Forecast',
      actionHref: '/reports/budget-forecast',
      createdAt: new Date('2024-03-13T16:00:00')
    },
    {
      id: 'ai5',
      type: 'recommendation',
      severity: 'info',
      title: 'Early payment discount opportunity',
      description: '4 bills totaling $45,000 qualify for 2% early payment discounts if paid within 10 days, saving $900.',
      actionLabel: 'Review Bills',
      actionHref: '/accounts-payable/bills?discount=available',
      createdAt: new Date('2024-03-12T11:00:00')
    }
  ]
  
  // Filter insights based on entity
  if (filters.entityId !== 'e4') {
    return insights.slice(0, 3) // Show fewer insights for single entities
  }
  
  return insights
}

// ============ FINANCIAL STATEMENT SERVICES ============

export interface BalanceSheetData {
  assets: {
    currentAssets: {
      cash: number
      accountsReceivable: number
      inventory: number
      prepaidExpenses: number
      other: number
      total: number
    }
    nonCurrentAssets: {
      ppe: number
      accumulatedDepreciation: number
      intangibles: number
      investments: number
      other: number
      total: number
    }
    total: number
  }
  liabilities: {
    currentLiabilities: {
      accountsPayable: number
      accruedExpenses: number
      shortTermDebt: number
      currentPortionLTD: number
      other: number
      total: number
    }
    nonCurrentLiabilities: {
      longTermDebt: number
      deferredTax: number
      other: number
      total: number
    }
    total: number
  }
  equity: {
    commonStock: number
    additionalPaidInCapital: number
    retainedEarnings: number
    treasuryStock: number
    otherComprehensiveIncome: number
    total: number
  }
}

export async function getBalanceSheetData(filters: DashboardFilters): Promise<BalanceSheetData> {
  await delay(SIMULATED_DELAY)
  
  const multiplier = filters.entityId === 'e4' ? 1 : filters.entityId === 'e1' ? 0.6 : 0.2
  
  const currentAssets = {
    cash: Math.round(2450000 * multiplier),
    accountsReceivable: Math.round(537500 * multiplier),
    inventory: Math.round(425000 * multiplier),
    prepaidExpenses: Math.round(85000 * multiplier),
    other: Math.round(42000 * multiplier),
    total: 0
  }
  currentAssets.total = currentAssets.cash + currentAssets.accountsReceivable + 
    currentAssets.inventory + currentAssets.prepaidExpenses + currentAssets.other
  
  const nonCurrentAssets = {
    ppe: Math.round(3200000 * multiplier),
    accumulatedDepreciation: Math.round(850000 * multiplier),
    intangibles: Math.round(450000 * multiplier),
    investments: Math.round(180000 * multiplier),
    other: Math.round(65000 * multiplier),
    total: 0
  }
  nonCurrentAssets.total = nonCurrentAssets.ppe - nonCurrentAssets.accumulatedDepreciation + 
    nonCurrentAssets.intangibles + nonCurrentAssets.investments + nonCurrentAssets.other
  
  const totalAssets = currentAssets.total + nonCurrentAssets.total
  
  const currentLiabilities = {
    accountsPayable: Math.round(161800 * multiplier),
    accruedExpenses: Math.round(125000 * multiplier),
    shortTermDebt: Math.round(50000 * multiplier),
    currentPortionLTD: Math.round(75000 * multiplier),
    other: Math.round(35000 * multiplier),
    total: 0
  }
  currentLiabilities.total = currentLiabilities.accountsPayable + currentLiabilities.accruedExpenses + 
    currentLiabilities.shortTermDebt + currentLiabilities.currentPortionLTD + currentLiabilities.other
  
  const nonCurrentLiabilities = {
    longTermDebt: Math.round(800000 * multiplier),
    deferredTax: Math.round(120000 * multiplier),
    other: Math.round(45000 * multiplier),
    total: 0
  }
  nonCurrentLiabilities.total = nonCurrentLiabilities.longTermDebt + nonCurrentLiabilities.deferredTax + nonCurrentLiabilities.other
  
  const totalLiabilities = currentLiabilities.total + nonCurrentLiabilities.total
  
  const equity = {
    commonStock: Math.round(500000 * multiplier),
    additionalPaidInCapital: Math.round(1200000 * multiplier),
    retainedEarnings: Math.round(totalAssets - totalLiabilities - 1700000 * multiplier),
    treasuryStock: Math.round(50000 * multiplier),
    otherComprehensiveIncome: Math.round(50000 * multiplier),
    total: 0
  }
  equity.total = equity.commonStock + equity.additionalPaidInCapital + equity.retainedEarnings - equity.treasuryStock + equity.otherComprehensiveIncome
  
  return {
    assets: {
      currentAssets,
      nonCurrentAssets,
      total: totalAssets
    },
    liabilities: {
      currentLiabilities,
      nonCurrentLiabilities,
      total: totalLiabilities
    },
    equity
  }
}

export interface IncomeStatementData {
  revenue: {
    lines: { name: string; amount: number; previousAmount: number }[]
    total: number
    previousTotal: number
  }
  costOfGoodsSold: {
    lines: { name: string; amount: number; previousAmount: number }[]
    total: number
    previousTotal: number
  }
  grossProfit: number
  previousGrossProfit: number
  operatingExpenses: {
    lines: { name: string; amount: number; previousAmount: number }[]
    total: number
    previousTotal: number
  }
  operatingIncome: number
  previousOperatingIncome: number
  otherIncome: {
    interestIncome: number
    interestExpense: number
    other: number
    total: number
  }
  incomeBeforeTax: number
  previousIncomeBeforeTax: number
  incomeTaxExpense: number
  netIncome: number
  previousNetIncome: number
}

export async function getIncomeStatementData(filters: DashboardFilters): Promise<IncomeStatementData> {
  await delay(SIMULATED_DELAY)
  
  const entityMultiplier = filters.entityId === 'e4' ? 1 : filters.entityId === 'e1' ? 0.6 : 0.2
  const dateMultiplier = filters.dateRange.preset === 'this_year' ? 1 : 
                        filters.dateRange.preset === 'this_quarter' ? 0.25 : 
                        filters.dateRange.preset === 'this_month' ? 0.08 : 0.5
  
  const multiplier = entityMultiplier * dateMultiplier
  
  const revenue = {
    lines: [
      { name: 'Product Sales', amount: Math.round(4500000 * multiplier), previousAmount: Math.round(4200000 * multiplier) },
      { name: 'Service Revenue', amount: Math.round(1200000 * multiplier), previousAmount: Math.round(1050000 * multiplier) },
      { name: 'Subscription Revenue', amount: Math.round(350000 * multiplier), previousAmount: Math.round(280000 * multiplier) },
      { name: 'Other Revenue', amount: Math.round(50000 * multiplier), previousAmount: Math.round(45000 * multiplier) },
    ],
    total: 0,
    previousTotal: 0
  }
  revenue.total = revenue.lines.reduce((sum, l) => sum + l.amount, 0)
  revenue.previousTotal = revenue.lines.reduce((sum, l) => sum + l.previousAmount, 0)
  
  const cogs = {
    lines: [
      { name: 'Direct Materials', amount: Math.round(1450000 * multiplier), previousAmount: Math.round(1380000 * multiplier) },
      { name: 'Direct Labor', amount: Math.round(680000 * multiplier), previousAmount: Math.round(650000 * multiplier) },
      { name: 'Manufacturing Overhead', amount: Math.round(295000 * multiplier), previousAmount: Math.round(280000 * multiplier) },
    ],
    total: 0,
    previousTotal: 0
  }
  cogs.total = cogs.lines.reduce((sum, l) => sum + l.amount, 0)
  cogs.previousTotal = cogs.lines.reduce((sum, l) => sum + l.previousAmount, 0)
  
  const grossProfit = revenue.total - cogs.total
  const previousGrossProfit = revenue.previousTotal - cogs.previousTotal
  
  const opex = {
    lines: [
      { name: 'Salaries & Benefits', amount: Math.round(1120000 * multiplier), previousAmount: Math.round(1050000 * multiplier) },
      { name: 'Rent & Facilities', amount: Math.round(185000 * multiplier), previousAmount: Math.round(175000 * multiplier) },
      { name: 'Marketing & Advertising', amount: Math.round(280000 * multiplier), previousAmount: Math.round(220000 * multiplier) },
      { name: 'Technology & Software', amount: Math.round(125000 * multiplier), previousAmount: Math.round(110000 * multiplier) },
      { name: 'Professional Services', amount: Math.round(95000 * multiplier), previousAmount: Math.round(85000 * multiplier) },
      { name: 'Depreciation & Amortization', amount: Math.round(145000 * multiplier), previousAmount: Math.round(140000 * multiplier) },
      { name: 'Other Operating Expenses', amount: Math.round(85000 * multiplier), previousAmount: Math.round(78000 * multiplier) },
    ],
    total: 0,
    previousTotal: 0
  }
  opex.total = opex.lines.reduce((sum, l) => sum + l.amount, 0)
  opex.previousTotal = opex.lines.reduce((sum, l) => sum + l.previousAmount, 0)
  
  const operatingIncome = grossProfit - opex.total
  const previousOperatingIncome = previousGrossProfit - opex.previousTotal
  
  const otherIncome = {
    interestIncome: Math.round(15000 * multiplier),
    interestExpense: Math.round(42000 * multiplier),
    other: Math.round(8000 * multiplier),
    total: 0
  }
  otherIncome.total = otherIncome.interestIncome - otherIncome.interestExpense + otherIncome.other
  
  const incomeBeforeTax = operatingIncome + otherIncome.total
  const previousIncomeBeforeTax = previousOperatingIncome - 19000 * multiplier
  
  const taxRate = 0.25
  const incomeTaxExpense = Math.round(incomeBeforeTax * taxRate)
  
  const netIncome = incomeBeforeTax - incomeTaxExpense
  const previousNetIncome = Math.round(previousIncomeBeforeTax * (1 - taxRate))
  
  return {
    revenue,
    costOfGoodsSold: cogs,
    grossProfit,
    previousGrossProfit,
    operatingExpenses: opex,
    operatingIncome,
    previousOperatingIncome,
    otherIncome,
    incomeBeforeTax,
    previousIncomeBeforeTax,
    incomeTaxExpense,
    netIncome,
    previousNetIncome
  }
}

// ============ CASH FLOW STATEMENT SERVICE ============

export interface CashFlowData {
  operatingActivities: {
    netIncome: number
    adjustments: { name: string; amount: number }[]
    changesInWorkingCapital: { name: string; amount: number }[]
    total: number
  }
  investingActivities: {
    items: { name: string; amount: number }[]
    total: number
  }
  financingActivities: {
    items: { name: string; amount: number }[]
    total: number
  }
  netChangeInCash: number
  beginningCash: number
  endingCash: number
  previousNetChangeInCash: number
}

export async function getCashFlowData(filters: DashboardFilters): Promise<CashFlowData> {
  await delay(SIMULATED_DELAY)
  
  const entityMultiplier = filters.entityId === 'e4' ? 1 : filters.entityId === 'e1' ? 0.6 : 0.2
  const dateMultiplier = filters.dateRange.preset === 'this_year' ? 1 : 
                        filters.dateRange.preset === 'this_quarter' ? 0.25 : 
                        filters.dateRange.preset === 'this_month' ? 0.08 : 0.5
  
  const multiplier = entityMultiplier * dateMultiplier
  
  const netIncome = Math.round(485000 * multiplier)
  
  const adjustments = [
    { name: 'Depreciation & Amortization', amount: Math.round(145000 * multiplier) },
    { name: 'Stock-Based Compensation', amount: Math.round(35000 * multiplier) },
    { name: 'Deferred Taxes', amount: Math.round(-15000 * multiplier) },
    { name: 'Loss on Asset Disposal', amount: Math.round(5000 * multiplier) },
  ]
  
  const changesInWorkingCapital = [
    { name: 'Accounts Receivable', amount: Math.round(-45000 * multiplier) },
    { name: 'Inventory', amount: Math.round(-25000 * multiplier) },
    { name: 'Prepaid Expenses', amount: Math.round(-8000 * multiplier) },
    { name: 'Accounts Payable', amount: Math.round(32000 * multiplier) },
    { name: 'Accrued Expenses', amount: Math.round(18000 * multiplier) },
    { name: 'Deferred Revenue', amount: Math.round(12000 * multiplier) },
  ]
  
  const operatingTotal = netIncome + 
    adjustments.reduce((sum, a) => sum + a.amount, 0) +
    changesInWorkingCapital.reduce((sum, c) => sum + c.amount, 0)
  
  const investingItems = [
    { name: 'Purchase of Property & Equipment', amount: Math.round(-180000 * multiplier) },
    { name: 'Purchase of Intangible Assets', amount: Math.round(-45000 * multiplier) },
    { name: 'Proceeds from Sale of Assets', amount: Math.round(15000 * multiplier) },
    { name: 'Acquisitions, Net of Cash', amount: Math.round(-250000 * multiplier) },
    { name: 'Purchase of Investments', amount: Math.round(-100000 * multiplier) },
  ]
  const investingTotal = investingItems.reduce((sum, i) => sum + i.amount, 0)
  
  const financingItems = [
    { name: 'Proceeds from Debt Issuance', amount: Math.round(200000 * multiplier) },
    { name: 'Repayment of Debt', amount: Math.round(-75000 * multiplier) },
    { name: 'Dividends Paid', amount: Math.round(-50000 * multiplier) },
    { name: 'Stock Repurchases', amount: Math.round(-30000 * multiplier) },
    { name: 'Proceeds from Stock Options', amount: Math.round(25000 * multiplier) },
  ]
  const financingTotal = financingItems.reduce((sum, f) => sum + f.amount, 0)
  
  const netChangeInCash = operatingTotal + investingTotal + financingTotal
  const beginningCash = Math.round(2100000 * entityMultiplier)
  const endingCash = beginningCash + netChangeInCash
  
  return {
    operatingActivities: {
      netIncome,
      adjustments,
      changesInWorkingCapital,
      total: operatingTotal,
    },
    investingActivities: {
      items: investingItems,
      total: investingTotal,
    },
    financingActivities: {
      items: financingItems,
      total: financingTotal,
    },
    netChangeInCash,
    beginningCash,
    endingCash,
    previousNetChangeInCash: Math.round(netChangeInCash * 0.85),
  }
}

// ============ REPORT BUILDER SERVICE ============

export interface SavedReport {
  id: string
  name: string
  type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'budget_vs_actual' | 'trial_balance' | 'custom'
  filters: Partial<DashboardFilters>
  columns: string[]
  groupBy?: string
  sortBy?: string
  createdBy: string
  createdAt: Date
  lastRunAt?: Date
  isFavorite: boolean
}

const mockSavedReports: SavedReport[] = [
  {
    id: 'sr1',
    name: 'Monthly P&L - All Entities',
    type: 'income_statement',
    filters: { entityId: 'e4', dateRange: { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), preset: 'this_year' } },
    columns: ['account', 'current', 'previous', 'variance', 'variance_pct'],
    groupBy: 'category',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2024-01-15'),
    lastRunAt: new Date('2024-03-14'),
    isFavorite: true,
  },
  {
    id: 'sr2',
    name: 'Quarterly Balance Sheet',
    type: 'balance_sheet',
    filters: { entityId: 'e1', dateRange: { startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31'), preset: 'this_quarter' } },
    columns: ['account', 'current', 'previous'],
    createdBy: 'Michael Johnson',
    createdAt: new Date('2024-02-01'),
    lastRunAt: new Date('2024-03-10'),
    isFavorite: false,
  },
  {
    id: 'sr3',
    name: 'Department Budget Variance',
    type: 'budget_vs_actual',
    filters: { entityId: 'e1' },
    columns: ['department', 'budget', 'actual', 'variance', 'variance_pct'],
    groupBy: 'department',
    createdBy: 'Emily Davis',
    createdAt: new Date('2024-02-15'),
    lastRunAt: new Date('2024-03-12'),
    isFavorite: true,
  },
  {
    id: 'sr4',
    name: 'Cash Flow Analysis',
    type: 'cash_flow',
    filters: { entityId: 'e4', dateRange: { startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31'), preset: 'this_quarter' } },
    columns: ['category', 'amount', 'previous'],
    createdBy: 'Sarah Chen',
    createdAt: new Date('2024-03-01'),
    isFavorite: false,
  },
]

export async function getSavedReports(): Promise<SavedReport[]> {
  await delay(SIMULATED_DELAY)
  return mockSavedReports
}

export async function saveReport(report: Partial<SavedReport>): Promise<{ success: boolean; report?: SavedReport }> {
  await delay(SIMULATED_DELAY)
  
  const newReport: SavedReport = {
    id: `sr${mockSavedReports.length + 1}`,
    name: report.name || 'Untitled Report',
    type: report.type || 'custom',
    filters: report.filters || {},
    columns: report.columns || [],
    groupBy: report.groupBy,
    sortBy: report.sortBy,
    createdBy: 'Current User',
    createdAt: new Date(),
    isFavorite: false,
  }
  
  mockSavedReports.push(newReport)
  return { success: true, report: newReport }
}

export async function deleteReport(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const index = mockSavedReports.findIndex(r => r.id === id)
  if (index !== -1) {
    mockSavedReports.splice(index, 1)
    return { success: true }
  }
  return { success: false }
}

export async function toggleReportFavorite(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const report = mockSavedReports.find(r => r.id === id)
  if (report) {
    report.isFavorite = !report.isFavorite
    return { success: true }
  }
  return { success: false }
}

// ============ ADMIN SERVICES ============

import type { User, Dimension, Integration, Workflow, ApiKey } from '@/lib/types'

const mockUsers: User[] = [
  {
    id: 'u1',
    email: 'sarah.chen@company.com',
    firstName: 'Sarah',
    lastName: 'Chen',
    role: 'admin',
    status: 'active',
    entityIds: ['e1', 'e2', 'e3', 'e4'],
    lastLoginAt: new Date('2024-03-15T10:30:00'),
    createdAt: new Date('2023-01-15'),
    avatar: '/avatars/sarah.jpg',
  },
  {
    id: 'u2',
    email: 'michael.johnson@company.com',
    firstName: 'Michael',
    lastName: 'Johnson',
    role: 'controller',
    status: 'active',
    entityIds: ['e1', 'e2'],
    lastLoginAt: new Date('2024-03-15T09:15:00'),
    createdAt: new Date('2023-02-20'),
  },
  {
    id: 'u3',
    email: 'emily.davis@company.com',
    firstName: 'Emily',
    lastName: 'Davis',
    role: 'accountant',
    status: 'active',
    entityIds: ['e1'],
    lastLoginAt: new Date('2024-03-14T16:45:00'),
    createdAt: new Date('2023-03-10'),
  },
  {
    id: 'u4',
    email: 'james.wilson@company.com',
    firstName: 'James',
    lastName: 'Wilson',
    role: 'ap_clerk',
    status: 'active',
    entityIds: ['e1', 'e2'],
    lastLoginAt: new Date('2024-03-15T08:00:00'),
    createdAt: new Date('2023-06-01'),
  },
  {
    id: 'u5',
    email: 'lisa.brown@company.com',
    firstName: 'Lisa',
    lastName: 'Brown',
    role: 'ar_clerk',
    status: 'active',
    entityIds: ['e1'],
    lastLoginAt: new Date('2024-03-13T14:20:00'),
    createdAt: new Date('2023-07-15'),
  },
  {
    id: 'u6',
    email: 'robert.taylor@company.com',
    firstName: 'Robert',
    lastName: 'Taylor',
    role: 'viewer',
    status: 'inactive',
    entityIds: ['e1'],
    createdAt: new Date('2023-08-01'),
  },
  {
    id: 'u7',
    email: 'new.user@company.com',
    firstName: 'New',
    lastName: 'User',
    role: 'accountant',
    status: 'pending',
    entityIds: ['e1'],
    createdAt: new Date('2024-03-14'),
  },
]

export async function getUsers(
  search?: string,
  role?: string[],
  status?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<User>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockUsers]
  
  if (role && role.length > 0) {
    filtered = filtered.filter(u => role.includes(u.role))
  }
  
  if (status && status.length > 0) {
    filtered = filtered.filter(u => status.includes(u.status))
  }
  
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(u => 
      u.email.toLowerCase().includes(s) ||
      u.firstName.toLowerCase().includes(s) ||
      u.lastName.toLowerCase().includes(s)
    )
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof User]
      const bVal = b[sort.key as keyof User]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function createUser(user: Partial<User>): Promise<{ success: boolean; user?: User }> {
  await delay(SIMULATED_DELAY)
  
  const newUser: User = {
    id: `u${mockUsers.length + 1}`,
    email: user.email || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    role: user.role || 'viewer',
    status: 'pending',
    entityIds: user.entityIds || [],
    createdAt: new Date(),
  }
  
  mockUsers.push(newUser)
  return { success: true, user: newUser }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const user = mockUsers.find(u => u.id === id)
  if (user) {
    Object.assign(user, updates)
    return { success: true }
  }
  return { success: false }
}

export async function deactivateUser(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const user = mockUsers.find(u => u.id === id)
  if (user) {
    user.status = 'inactive'
    return { success: true }
  }
  return { success: false }
}

// ============ DIMENSION SERVICES ============

const mockDimensions: Dimension[] = [
  { id: 'd1', name: 'Sales', code: 'SALES', type: 'department', status: 'active', entityIds: ['e1', 'e2'], createdAt: new Date('2023-01-01') },
  { id: 'd2', name: 'Marketing', code: 'MKT', type: 'department', status: 'active', entityIds: ['e1', 'e2'], createdAt: new Date('2023-01-01') },
  { id: 'd3', name: 'Engineering', code: 'ENG', type: 'department', status: 'active', entityIds: ['e1'], createdAt: new Date('2023-01-01') },
  { id: 'd4', name: 'Finance', code: 'FIN', type: 'department', status: 'active', entityIds: ['e1', 'e2', 'e3'], createdAt: new Date('2023-01-01') },
  { id: 'd5', name: 'HR', code: 'HR', type: 'department', status: 'active', entityIds: ['e1'], createdAt: new Date('2023-01-01') },
  { id: 'd6', name: 'Operations', code: 'OPS', type: 'department', status: 'inactive', entityIds: ['e1'], createdAt: new Date('2023-01-01') },
  { id: 'd7', name: 'Headquarters', code: 'HQ', type: 'location', status: 'active', entityIds: ['e1'], createdAt: new Date('2023-01-01') },
  { id: 'd8', name: 'West Coast', code: 'WEST', type: 'location', status: 'active', entityIds: ['e1', 'e2'], createdAt: new Date('2023-01-01') },
  { id: 'd9', name: 'East Coast', code: 'EAST', type: 'location', status: 'active', entityIds: ['e1', 'e3'], createdAt: new Date('2023-01-01') },
  { id: 'd10', name: 'Project Alpha', code: 'ALPHA', type: 'project', status: 'active', entityIds: ['e1'], createdAt: new Date('2023-06-01') },
  { id: 'd11', name: 'Project Beta', code: 'BETA', type: 'project', status: 'active', entityIds: ['e1'], createdAt: new Date('2023-08-01') },
  { id: 'd12', name: 'Retail', code: 'RETAIL', type: 'class', status: 'active', entityIds: ['e1', 'e2'], createdAt: new Date('2023-01-01') },
  { id: 'd13', name: 'Wholesale', code: 'WHSLE', type: 'class', status: 'active', entityIds: ['e1', 'e2'], createdAt: new Date('2023-01-01') },
]

export async function getDimensions(
  type?: string,
  status?: string[],
  search?: string,
  sort?: SortConfig
): Promise<Dimension[]> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockDimensions]
  
  if (type) {
    filtered = filtered.filter(d => d.type === type)
  }
  
  if (status && status.length > 0) {
    filtered = filtered.filter(d => status.includes(d.status))
  }
  
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(d => 
      d.name.toLowerCase().includes(s) ||
      d.code.toLowerCase().includes(s)
    )
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof Dimension]
      const bVal = b[sort.key as keyof Dimension]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }
  
  return filtered
}

export async function createDimension(dimension: Partial<Dimension>): Promise<{ success: boolean; dimension?: Dimension }> {
  await delay(SIMULATED_DELAY)
  
  const newDimension: Dimension = {
    id: `d${mockDimensions.length + 1}`,
    name: dimension.name || '',
    code: dimension.code || '',
    type: dimension.type || 'custom',
    status: 'active',
    parentId: dimension.parentId,
    entityIds: dimension.entityIds || [],
    createdAt: new Date(),
  }
  
  mockDimensions.push(newDimension)
  return { success: true, dimension: newDimension }
}

export async function updateDimension(id: string, updates: Partial<Dimension>): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const dimension = mockDimensions.find(d => d.id === id)
  if (dimension) {
    Object.assign(dimension, updates)
    return { success: true }
  }
  return { success: false }
}

// ============ INTEGRATION SERVICES ============

const mockIntegrations: Integration[] = [
  {
    id: 'int1',
    name: 'Chase Bank',
    type: 'bank',
    provider: 'Plaid',
    status: 'connected',
    lastSyncAt: new Date('2024-03-15T06:00:00'),
    createdAt: new Date('2023-01-15'),
  },
  {
    id: 'int2',
    name: 'Bank of America',
    type: 'bank',
    provider: 'Plaid',
    status: 'connected',
    lastSyncAt: new Date('2024-03-15T06:00:00'),
    createdAt: new Date('2023-02-01'),
  },
  {
    id: 'int3',
    name: 'ADP Payroll',
    type: 'payroll',
    provider: 'ADP',
    status: 'connected',
    lastSyncAt: new Date('2024-03-01T00:00:00'),
    createdAt: new Date('2023-01-20'),
  },
  {
    id: 'int4',
    name: 'Salesforce CRM',
    type: 'crm',
    provider: 'Salesforce',
    status: 'connected',
    lastSyncAt: new Date('2024-03-15T08:00:00'),
    createdAt: new Date('2023-03-01'),
  },
  {
    id: 'int5',
    name: 'Shopify',
    type: 'ecommerce',
    provider: 'Shopify',
    status: 'error',
    lastSyncAt: new Date('2024-03-10T12:00:00'),
    createdAt: new Date('2023-04-01'),
  },
  {
    id: 'int6',
    name: 'Avalara Tax',
    type: 'tax',
    provider: 'Avalara',
    status: 'connected',
    lastSyncAt: new Date('2024-03-14T00:00:00'),
    createdAt: new Date('2023-05-01'),
  },
  {
    id: 'int7',
    name: 'Expensify',
    type: 'expense',
    provider: 'Expensify',
    status: 'disconnected',
    createdAt: new Date('2023-06-01'),
  },
  {
    id: 'int8',
    name: 'BambooHR',
    type: 'hr',
    provider: 'BambooHR',
    status: 'pending',
    createdAt: new Date('2024-03-10'),
  },
]

export async function getIntegrations(type?: string, status?: string[]): Promise<Integration[]> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockIntegrations]
  
  if (type) {
    filtered = filtered.filter(i => i.type === type)
  }
  
  if (status && status.length > 0) {
    filtered = filtered.filter(i => status.includes(i.status))
  }
  
  return filtered
}

export async function syncIntegration(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY * 2)
  const integration = mockIntegrations.find(i => i.id === id)
  if (integration && integration.status === 'connected') {
    integration.lastSyncAt = new Date()
    return { success: true }
  }
  return { success: false }
}

export async function disconnectIntegration(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const integration = mockIntegrations.find(i => i.id === id)
  if (integration) {
    integration.status = 'disconnected'
    return { success: true }
  }
  return { success: false }
}

export async function reconnectIntegration(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const integration = mockIntegrations.find(i => i.id === id)
  if (integration && (integration.status === 'disconnected' || integration.status === 'error')) {
    integration.status = 'connected'
    integration.lastSyncAt = new Date()
    return { success: true }
  }
  return { success: false }
}

// ============ WORKFLOW SERVICES ============

const mockWorkflows: Workflow[] = [
  {
    id: 'wf1',
    name: 'Bill Approval > $5,000',
    type: 'approval',
    trigger: 'bill.created',
    status: 'active',
    steps: [
      { id: 's1', order: 1, type: 'condition', config: { field: 'amount', operator: 'gte', value: 5000 } },
      { id: 's2', order: 2, type: 'approval', config: { role: 'controller' } },
    ],
    entityIds: ['e1', 'e2'],
    createdBy: 'Sarah Chen',
    createdAt: new Date('2023-02-01'),
  },
  {
    id: 'wf2',
    name: 'Invoice Overdue Notification',
    type: 'notification',
    trigger: 'invoice.overdue',
    status: 'active',
    steps: [
      { id: 's1', order: 1, type: 'notification', config: { channel: 'email', template: 'overdue_invoice' } },
    ],
    entityIds: ['e1'],
    createdBy: 'Michael Johnson',
    createdAt: new Date('2023-03-15'),
  },
  {
    id: 'wf3',
    name: 'Journal Entry Auto-Post',
    type: 'automation',
    trigger: 'journal_entry.approved',
    status: 'active',
    steps: [
      { id: 's1', order: 1, type: 'action', config: { action: 'post' } },
    ],
    entityIds: ['e1', 'e2', 'e3'],
    createdBy: 'Sarah Chen',
    createdAt: new Date('2023-04-01'),
  },
  {
    id: 'wf4',
    name: 'Expense Report Approval',
    type: 'approval',
    trigger: 'expense.submitted',
    status: 'inactive',
    steps: [
      { id: 's1', order: 1, type: 'approval', config: { role: 'manager' } },
      { id: 's2', order: 2, type: 'condition', config: { field: 'amount', operator: 'gte', value: 1000 } },
      { id: 's3', order: 3, type: 'approval', config: { role: 'controller' } },
    ],
    entityIds: ['e1'],
    createdBy: 'Emily Davis',
    createdAt: new Date('2023-05-01'),
  },
  {
    id: 'wf5',
    name: 'Payment Confirmation',
    type: 'notification',
    trigger: 'payment.completed',
    status: 'draft',
    steps: [
      { id: 's1', order: 1, type: 'notification', config: { channel: 'email', template: 'payment_confirmation' } },
    ],
    entityIds: ['e1'],
    createdBy: 'Sarah Chen',
    createdAt: new Date('2024-03-01'),
  },
]

export async function getWorkflows(type?: string, status?: string[]): Promise<Workflow[]> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockWorkflows]
  
  if (type) {
    filtered = filtered.filter(w => w.type === type)
  }
  
  if (status && status.length > 0) {
    filtered = filtered.filter(w => status.includes(w.status))
  }
  
  return filtered
}

export async function createWorkflow(workflow: Partial<Workflow>): Promise<{ success: boolean; workflow?: Workflow }> {
  await delay(SIMULATED_DELAY)
  
  const newWorkflow: Workflow = {
    id: `wf${mockWorkflows.length + 1}`,
    name: workflow.name || 'Untitled Workflow',
    type: workflow.type || 'automation',
    trigger: workflow.trigger || '',
    status: 'draft',
    steps: workflow.steps || [],
    entityIds: workflow.entityIds || [],
    createdBy: 'Current User',
    createdAt: new Date(),
  }
  
  mockWorkflows.push(newWorkflow)
  return { success: true, workflow: newWorkflow }
}

export async function updateWorkflowStatus(id: string, status: 'active' | 'inactive' | 'draft'): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const workflow = mockWorkflows.find(w => w.id === id)
  if (workflow) {
    workflow.status = status
    return { success: true }
  }
  return { success: false }
}

// ============ API KEY SERVICES ============

const mockApiKeys: ApiKey[] = [
  {
    id: 'ak1',
    name: 'Production API',
    key: 'sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    status: 'active',
    permissions: ['read:all', 'write:transactions', 'write:bills', 'write:invoices'],
    lastUsedAt: new Date('2024-03-15T10:30:00'),
    createdBy: 'Sarah Chen',
    createdAt: new Date('2023-01-15'),
  },
  {
    id: 'ak2',
    name: 'Reporting Integration',
    key: 'sk_live_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
    status: 'active',
    permissions: ['read:reports', 'read:transactions'],
    lastUsedAt: new Date('2024-03-14T08:00:00'),
    expiresAt: new Date('2024-12-31'),
    createdBy: 'Michael Johnson',
    createdAt: new Date('2023-06-01'),
  },
  {
    id: 'ak3',
    name: 'Testing Key',
    key: 'sk_test_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
    status: 'active',
    permissions: ['read:all', 'write:all'],
    createdBy: 'Emily Davis',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'ak4',
    name: 'Old Integration',
    key: 'sk_live_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    status: 'revoked',
    permissions: ['read:all'],
    createdBy: 'Sarah Chen',
    createdAt: new Date('2022-06-01'),
  },
]

export async function getApiKeys(): Promise<ApiKey[]> {
  await delay(SIMULATED_DELAY)
  return mockApiKeys
}

export async function createApiKey(key: Partial<ApiKey>): Promise<{ success: boolean; apiKey?: ApiKey }> {
  await delay(SIMULATED_DELAY)
  
  const newKey: ApiKey = {
    id: `ak${mockApiKeys.length + 1}`,
    name: key.name || 'New API Key',
    key: `sk_live_${Math.random().toString(36).substring(2, 34)}`,
    status: 'active',
    permissions: key.permissions || ['read:all'],
    expiresAt: key.expiresAt,
    createdBy: 'Current User',
    createdAt: new Date(),
  }
  
  mockApiKeys.push(newKey)
  return { success: true, apiKey: newKey }
}

export async function revokeApiKey(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const key = mockApiKeys.find(k => k.id === id)
  if (key && key.status === 'active') {
    key.status = 'revoked'
    return { success: true }
  }
  return { success: false }
}

// ============ TASK SERVICES ============

import type { Task, Notification, ActivityItem } from '@/lib/types'

const mockTasks: Task[] = [
  {
    id: 'task1',
    title: 'Review March expense reports',
    description: 'Review and approve expense reports submitted for March 2024',
    type: 'review',
    priority: 'high',
    status: 'todo',
    dueDate: new Date('2024-03-20'),
    assigneeId: 'u1',
    assigneeName: 'Sarah Chen',
    entityId: 'e1',
    createdBy: 'System',
    createdAt: new Date('2024-03-15'),
  },
  {
    id: 'task2',
    title: 'Reconcile operating account',
    description: 'Complete monthly bank reconciliation for operating account',
    type: 'reconciliation',
    priority: 'high',
    status: 'in_progress',
    dueDate: new Date('2024-03-18'),
    assigneeId: 'u3',
    assigneeName: 'Emily Davis',
    relatedType: 'reconciliation',
    entityId: 'e1',
    createdBy: 'Michael Johnson',
    createdAt: new Date('2024-03-10'),
  },
  {
    id: 'task3',
    title: 'Follow up on overdue invoice INV-2024-015',
    description: 'Contact customer regarding payment for invoice INV-2024-015',
    type: 'follow_up',
    priority: 'medium',
    status: 'todo',
    dueDate: new Date('2024-03-19'),
    assigneeId: 'u5',
    assigneeName: 'Lisa Brown',
    relatedType: 'invoice',
    relatedId: 'inv15',
    relatedNumber: 'INV-2024-015',
    entityId: 'e1',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2024-03-14'),
  },
  {
    id: 'task4',
    title: 'Enter vendor invoices',
    description: 'Enter 5 pending vendor invoices into the system',
    type: 'data_entry',
    priority: 'medium',
    status: 'todo',
    dueDate: new Date('2024-03-17'),
    assigneeId: 'u4',
    assigneeName: 'James Wilson',
    entityId: 'e1',
    createdBy: 'Emily Davis',
    createdAt: new Date('2024-03-15'),
  },
  {
    id: 'task5',
    title: 'Review journal entry JE-2024-089',
    description: 'Review and approve adjusting journal entry for accruals',
    type: 'approval',
    priority: 'high',
    status: 'todo',
    dueDate: new Date('2024-03-16'),
    assigneeId: 'u2',
    assigneeName: 'Michael Johnson',
    relatedType: 'journal_entry',
    relatedId: 'je89',
    relatedNumber: 'JE-2024-089',
    entityId: 'e1',
    createdBy: 'Emily Davis',
    createdAt: new Date('2024-03-15'),
  },
  {
    id: 'task6',
    title: 'Quarterly tax filing preparation',
    description: 'Prepare documentation for Q1 2024 tax filing',
    type: 'other',
    priority: 'low',
    status: 'completed',
    dueDate: new Date('2024-03-31'),
    assigneeId: 'u1',
    assigneeName: 'Sarah Chen',
    entityId: 'e1',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2024-03-01'),
    completedAt: new Date('2024-03-14'),
  },
  {
    id: 'task7',
    title: 'Update vendor payment terms',
    description: 'Update payment terms for Acme Supplies per new agreement',
    type: 'data_entry',
    priority: 'low',
    status: 'cancelled',
    assigneeId: 'u4',
    assigneeName: 'James Wilson',
    entityId: 'e1',
    createdBy: 'Michael Johnson',
    createdAt: new Date('2024-03-05'),
  },
]

export async function getTasks(
  assigneeId?: string,
  status?: string[],
  priority?: string[],
  type?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Task>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockTasks]
  
  if (assigneeId) {
    filtered = filtered.filter(t => t.assigneeId === assigneeId)
  }
  
  if (status && status.length > 0) {
    filtered = filtered.filter(t => status.includes(t.status))
  }
  
  if (priority && priority.length > 0) {
    filtered = filtered.filter(t => priority.includes(t.priority))
  }
  
  if (type && type.length > 0) {
    filtered = filtered.filter(t => type.includes(t.type))
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof Task]
      const bVal = b[sort.key as keyof Task]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  } else {
    // Default sort: by due date, then by priority
    filtered.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      return 0
    })
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function createTask(task: Partial<Task>): Promise<{ success: boolean; task?: Task }> {
  await delay(SIMULATED_DELAY)
  
  const newTask: Task = {
    id: `task${mockTasks.length + 1}`,
    title: task.title || 'New Task',
    description: task.description,
    type: task.type || 'other',
    priority: task.priority || 'medium',
    status: 'todo',
    dueDate: task.dueDate,
    assigneeId: task.assigneeId || 'u1',
    assigneeName: task.assigneeName || 'Sarah Chen',
    relatedType: task.relatedType,
    relatedId: task.relatedId,
    relatedNumber: task.relatedNumber,
    entityId: task.entityId || 'e1',
    createdBy: 'Current User',
    createdAt: new Date(),
  }
  
  mockTasks.push(newTask)
  return { success: true, task: newTask }
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const task = mockTasks.find(t => t.id === id)
  if (task) {
    task.status = status
    if (status === 'completed') {
      task.completedAt = new Date()
    }
    return { success: true }
  }
  return { success: false }
}

export async function assignTask(id: string, assigneeId: string, assigneeName: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const task = mockTasks.find(t => t.id === id)
  if (task) {
    task.assigneeId = assigneeId
    task.assigneeName = assigneeName
    return { success: true }
  }
  return { success: false }
}

// ============ NOTIFICATION SERVICES ============

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'approval_required',
    title: 'Bill Approval Required',
    message: 'Bill BILL-2024-045 from Acme Supplies ($12,500) requires your approval',
    read: false,
    actionUrl: '/approvals',
    relatedType: 'bill',
    relatedId: 'b45',
    createdAt: new Date('2024-03-15T10:30:00'),
  },
  {
    id: 'n2',
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: 'You have been assigned: Review March expense reports',
    read: false,
    actionUrl: '/tasks',
    relatedType: 'task',
    relatedId: 'task1',
    createdAt: new Date('2024-03-15T09:15:00'),
  },
  {
    id: 'n3',
    type: 'invoice_overdue',
    title: 'Invoice Overdue',
    message: 'Invoice INV-2024-015 to Globex Corp is 15 days overdue ($8,750)',
    read: false,
    actionUrl: '/accounts-receivable/invoices',
    relatedType: 'invoice',
    relatedId: 'inv15',
    createdAt: new Date('2024-03-15T08:00:00'),
  },
  {
    id: 'n4',
    type: 'payment_received',
    title: 'Payment Received',
    message: 'Payment of $15,000 received from Initech Industries for INV-2024-012',
    read: true,
    actionUrl: '/accounts-receivable/receipts',
    relatedType: 'receipt',
    relatedId: 'rec1',
    createdAt: new Date('2024-03-14T16:45:00'),
  },
  {
    id: 'n5',
    type: 'approval_completed',
    title: 'Approval Completed',
    message: 'Journal Entry JE-2024-088 has been approved by Michael Johnson',
    read: true,
    actionUrl: '/general-ledger/journal-entries',
    relatedType: 'journal_entry',
    relatedId: 'je88',
    createdAt: new Date('2024-03-14T14:20:00'),
  },
  {
    id: 'n6',
    type: 'sync_error',
    title: 'Integration Sync Error',
    message: 'Shopify integration sync failed. Please check connection settings.',
    read: false,
    actionUrl: '/admin/integrations',
    relatedType: 'integration',
    relatedId: 'int5',
    createdAt: new Date('2024-03-14T12:00:00'),
  },
  {
    id: 'n7',
    type: 'task_due',
    title: 'Task Due Tomorrow',
    message: 'Task "Reconcile operating account" is due tomorrow',
    read: true,
    actionUrl: '/tasks',
    relatedType: 'task',
    relatedId: 'task2',
    createdAt: new Date('2024-03-14T09:00:00'),
  },
  {
    id: 'n8',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on March 20, 2024 from 2:00 AM - 4:00 AM EST',
    read: true,
    createdAt: new Date('2024-03-13T10:00:00'),
  },
  {
    id: 'n9',
    type: 'mention',
    title: 'You were mentioned',
    message: 'Emily Davis mentioned you in a comment on Bill BILL-2024-042',
    read: true,
    actionUrl: '/accounts-payable/bills',
    relatedType: 'bill',
    relatedId: 'b42',
    createdAt: new Date('2024-03-12T15:30:00'),
  },
]

export async function getNotifications(
  unreadOnly?: boolean,
  type?: string[],
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<Notification>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockNotifications]
  
  if (unreadOnly) {
    filtered = filtered.filter(n => !n.read)
  }
  
  if (type && type.length > 0) {
    filtered = filtered.filter(n => type.includes(n.type))
  }
  
  // Sort by date descending
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function getUnreadCount(): Promise<number> {
  await delay(50)
  return mockNotifications.filter(n => !n.read).length
}

export async function markNotificationRead(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const notification = mockNotifications.find(n => n.id === id)
  if (notification) {
    notification.read = true
    return { success: true }
  }
  return { success: false }
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  mockNotifications.forEach(n => { n.read = true })
  return { success: true }
}

// ============ ACTIVITY TIMELINE SERVICES ============

const mockActivityItems: ActivityItem[] = [
  {
    id: 'act1',
    type: 'create',
    action: 'Created bill',
    description: 'Created bill BILL-2024-047 for Acme Supplies ($8,500)',
    userId: 'u4',
    userName: 'James Wilson',
    relatedType: 'bill',
    relatedId: 'b47',
    relatedNumber: 'BILL-2024-047',
    entityId: 'e1',
    createdAt: new Date('2024-03-15T11:30:00'),
  },
  {
    id: 'act2',
    type: 'approve',
    action: 'Approved journal entry',
    description: 'Approved journal entry JE-2024-090 ($45,000)',
    userId: 'u2',
    userName: 'Michael Johnson',
    relatedType: 'journal_entry',
    relatedId: 'je90',
    relatedNumber: 'JE-2024-090',
    entityId: 'e1',
    createdAt: new Date('2024-03-15T10:45:00'),
  },
  {
    id: 'act3',
    type: 'payment',
    action: 'Recorded payment',
    description: 'Recorded payment PAY-2024-023 to TechPro Services ($15,000)',
    userId: 'u3',
    userName: 'Emily Davis',
    relatedType: 'payment',
    relatedId: 'pay23',
    relatedNumber: 'PAY-2024-023',
    entityId: 'e1',
    createdAt: new Date('2024-03-15T10:15:00'),
  },
  {
    id: 'act4',
    type: 'update',
    action: 'Updated invoice',
    description: 'Updated invoice INV-2024-018 terms to Net 45',
    userId: 'u5',
    userName: 'Lisa Brown',
    relatedType: 'invoice',
    relatedId: 'inv18',
    relatedNumber: 'INV-2024-018',
    entityId: 'e1',
    createdAt: new Date('2024-03-15T09:30:00'),
  },
  {
    id: 'act5',
    type: 'login',
    action: 'User login',
    description: 'Sarah Chen logged in from 192.168.1.100',
    userId: 'u1',
    userName: 'Sarah Chen',
    entityId: 'e1',
    metadata: { ip: '192.168.1.100' },
    createdAt: new Date('2024-03-15T08:30:00'),
  },
  {
    id: 'act6',
    type: 'post',
    action: 'Posted journal entry',
    description: 'Posted journal entry JE-2024-089 to general ledger',
    userId: 'u1',
    userName: 'Sarah Chen',
    relatedType: 'journal_entry',
    relatedId: 'je89',
    relatedNumber: 'JE-2024-089',
    entityId: 'e1',
    createdAt: new Date('2024-03-15T08:15:00'),
  },
  {
    id: 'act7',
    type: 'reject',
    action: 'Rejected bill',
    description: 'Rejected bill BILL-2024-044 - Missing documentation',
    userId: 'u2',
    userName: 'Michael Johnson',
    relatedType: 'bill',
    relatedId: 'b44',
    relatedNumber: 'BILL-2024-044',
    entityId: 'e1',
    createdAt: new Date('2024-03-14T17:00:00'),
  },
  {
    id: 'act8',
    type: 'export',
    action: 'Exported report',
    description: 'Exported Balance Sheet report for Q1 2024',
    userId: 'u1',
    userName: 'Sarah Chen',
    relatedType: 'report',
    entityId: 'e1',
    createdAt: new Date('2024-03-14T16:30:00'),
  },
  {
    id: 'act9',
    type: 'void',
    action: 'Voided invoice',
    description: 'Voided invoice INV-2024-010 - Duplicate entry',
    userId: 'u3',
    userName: 'Emily Davis',
    relatedType: 'invoice',
    relatedId: 'inv10',
    relatedNumber: 'INV-2024-010',
    entityId: 'e1',
    createdAt: new Date('2024-03-14T15:00:00'),
  },
  {
    id: 'act10',
    type: 'create',
    action: 'Created receipt',
    description: 'Created receipt REC-2024-008 from Wayne Enterprises ($25,000)',
    userId: 'u5',
    userName: 'Lisa Brown',
    relatedType: 'receipt',
    relatedId: 'rec8',
    relatedNumber: 'REC-2024-008',
    entityId: 'e1',
    createdAt: new Date('2024-03-14T14:00:00'),
  },
  {
    id: 'act11',
    type: 'import',
    action: 'Imported bank transactions',
    description: 'Imported 47 transactions from Chase Bank feed',
    userId: 'u1',
    userName: 'Sarah Chen',
    relatedType: 'bank_account',
    entityId: 'e1',
    metadata: { count: 47, source: 'Chase Bank' },
    createdAt: new Date('2024-03-14T06:00:00'),
  },
]

export async function getActivityTimeline(
  entityId?: string,
  type?: string[],
  userId?: string,
  relatedType?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<ActivityItem>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockActivityItems]
  
  if (entityId && entityId !== 'e4') {
    filtered = filtered.filter(a => a.entityId === entityId)
  }
  
  if (type && type.length > 0) {
    filtered = filtered.filter(a => type.includes(a.type))
  }
  
  if (userId) {
    filtered = filtered.filter(a => a.userId === userId)
  }
  
  if (relatedType) {
    filtered = filtered.filter(a => a.relatedType === relatedType)
  }
  
  // Sort by date descending
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

// ============ AUTH SERVICES ============

import type { AuthUser, AuthSession, UserPreferences, SavedView } from '@/lib/types'
import { currentUser, savedViews as mockSavedViews } from '@/lib/mock-data'

// Simulated user credentials for demo
const demoCredentials = [
  { email: 'sarah.chen@company.com', password: 'demo123', userId: 'u1' },
  { email: 'michael.johnson@company.com', password: 'demo123', userId: 'u2' },
  { email: 'emily.davis@company.com', password: 'demo123', userId: 'u3' },
  { email: 'demo@intacct.com', password: 'demo', userId: 'u1' },
]

export async function login(email: string, password: string): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  await delay(SIMULATED_DELAY * 2)
  
  const cred = demoCredentials.find(c => c.email.toLowerCase() === email.toLowerCase() && c.password === password)
  
  if (!cred) {
    return { success: false, error: 'Invalid email or password' }
  }
  
  const user: AuthUser = {
    id: currentUser.id,
    email: currentUser.email,
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    role: currentUser.role,
    avatar: currentUser.avatar,
    entityIds: currentUser.entityIds,
  }
  
  const session: AuthSession = {
    user,
    accessToken: `mock_token_${Date.now()}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  }
  
  return { success: true, session }
}

export async function logout(): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  return { success: true }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  await delay(SIMULATED_DELAY)
  
  // In a real app, this would validate the session token
  return {
    id: currentUser.id,
    email: currentUser.email,
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    role: currentUser.role,
    avatar: currentUser.avatar,
    entityIds: currentUser.entityIds,
  }
}

export async function validateSession(token: string): Promise<boolean> {
  await delay(50)
  return token.startsWith('mock_token_')
}

// ============ PREFERENCES SERVICES ============

let userPreferences: UserPreferences = { ...currentUser.preferences }

export async function getPreferences(): Promise<UserPreferences> {
  await delay(SIMULATED_DELAY)
  return { ...userPreferences }
}

export async function updatePreferences(updates: Partial<UserPreferences>): Promise<{ success: boolean; preferences: UserPreferences }> {
  await delay(SIMULATED_DELAY)
  userPreferences = { ...userPreferences, ...updates }
  return { success: true, preferences: { ...userPreferences } }
}

export async function resetPreferences(): Promise<{ success: boolean; preferences: UserPreferences }> {
  await delay(SIMULATED_DELAY)
  userPreferences = { ...currentUser.preferences }
  return { success: true, preferences: { ...userPreferences } }
}

// ============ SAVED VIEW SERVICES ============

const savedViewsData = [...mockSavedViews]

export async function getSavedViews(module?: string): Promise<SavedView[]> {
  await delay(SIMULATED_DELAY)
  
  if (module) {
    return savedViewsData.filter(v => v.module === module)
  }
  return [...savedViewsData]
}

export async function getSavedViewById(id: string): Promise<SavedView | null> {
  await delay(SIMULATED_DELAY)
  return savedViewsData.find(v => v.id === id) || null
}

export async function createSavedView(view: Omit<SavedView, 'id' | 'createdBy' | 'createdAt'>): Promise<{ success: boolean; view?: SavedView }> {
  await delay(SIMULATED_DELAY)
  
  const newView: SavedView = {
    ...view,
    id: `sv${savedViewsData.length + 1}`,
    createdBy: currentUser.id,
    createdAt: new Date(),
  }
  
  savedViewsData.push(newView)
  return { success: true, view: newView }
}

export async function updateSavedView(id: string, updates: Partial<SavedView>): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const index = savedViewsData.findIndex(v => v.id === id)
  if (index !== -1) {
    savedViewsData[index] = { ...savedViewsData[index], ...updates }
    return { success: true }
  }
  return { success: false }
}

export async function deleteSavedView(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const index = savedViewsData.findIndex(v => v.id === id)
  if (index !== -1) {
    savedViewsData.splice(index, 1)
    return { success: true }
  }
  return { success: false }
}

export async function setDefaultView(id: string, module: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  
  // Remove default from other views in same module
  savedViewsData.forEach(v => {
    if (v.module === module) {
      v.isDefault = v.id === id
    }
  })
  
  return { success: true }
}

// ============ PURCHASE ORDER SERVICES ============

import type { PurchaseOrder, SalesOrder, ProjectDetail, TimeEntry, ExpenseEntry, RecurringJournal, Allocation } from '@/lib/types'

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po1',
    number: 'PO-2024-001',
    vendorId: 'v1',
    vendorName: 'Acme Supplies',
    status: 'approved',
    orderDate: new Date('2024-03-10'),
    expectedDate: new Date('2024-03-20'),
    lines: [
      { id: 'pol1', description: 'Office Supplies', quantity: 100, unitPrice: 25, amount: 2500, receivedQuantity: 0, accountId: 'acc1' },
      { id: 'pol2', description: 'Printer Paper', quantity: 50, unitPrice: 30, amount: 1500, receivedQuantity: 0, accountId: 'acc1' },
    ],
    subtotal: 4000,
    tax: 320,
    total: 4320,
    entityId: 'e1',
    departmentId: 'd1',
    createdBy: 'James Wilson',
    createdAt: new Date('2024-03-10'),
  },
  {
    id: 'po2',
    number: 'PO-2024-002',
    vendorId: 'v2',
    vendorName: 'TechPro Services',
    status: 'sent',
    orderDate: new Date('2024-03-12'),
    expectedDate: new Date('2024-03-25'),
    lines: [
      { id: 'pol3', description: 'Software Licenses', quantity: 10, unitPrice: 500, amount: 5000, receivedQuantity: 0, accountId: 'acc2' },
    ],
    subtotal: 5000,
    tax: 0,
    total: 5000,
    entityId: 'e1',
    departmentId: 'd3',
    projectId: 'd10',
    createdBy: 'Emily Davis',
    createdAt: new Date('2024-03-12'),
  },
  {
    id: 'po3',
    number: 'PO-2024-003',
    vendorId: 'v3',
    vendorName: 'Global Logistics',
    status: 'partially_received',
    orderDate: new Date('2024-03-05'),
    expectedDate: new Date('2024-03-15'),
    lines: [
      { id: 'pol4', description: 'Shipping Materials', quantity: 200, unitPrice: 15, amount: 3000, receivedQuantity: 150, accountId: 'acc3' },
      { id: 'pol5', description: 'Packing Supplies', quantity: 100, unitPrice: 8, amount: 800, receivedQuantity: 100, accountId: 'acc3' },
    ],
    subtotal: 3800,
    tax: 304,
    total: 4104,
    entityId: 'e1',
    createdBy: 'James Wilson',
    createdAt: new Date('2024-03-05'),
  },
  {
    id: 'po4',
    number: 'PO-2024-004',
    vendorId: 'v1',
    vendorName: 'Acme Supplies',
    status: 'draft',
    orderDate: new Date('2024-03-15'),
    lines: [
      { id: 'pol6', description: 'Furniture - Desks', quantity: 5, unitPrice: 450, amount: 2250, receivedQuantity: 0, accountId: 'acc4' },
    ],
    subtotal: 2250,
    tax: 180,
    total: 2430,
    entityId: 'e1',
    departmentId: 'd5',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2024-03-15'),
  },
  {
    id: 'po5',
    number: 'PO-2024-005',
    vendorId: 'v4',
    vendorName: 'Cloud Systems Inc',
    status: 'pending_approval',
    orderDate: new Date('2024-03-14'),
    expectedDate: new Date('2024-03-30'),
    lines: [
      { id: 'pol7', description: 'Cloud Infrastructure - Annual', quantity: 1, unitPrice: 24000, amount: 24000, receivedQuantity: 0, accountId: 'acc5' },
    ],
    subtotal: 24000,
    tax: 0,
    total: 24000,
    entityId: 'e1',
    departmentId: 'd3',
    notes: 'Annual subscription renewal',
    createdBy: 'Michael Johnson',
    createdAt: new Date('2024-03-14'),
  },
]

export async function getPurchaseOrders(
  status?: string[],
  vendorId?: string,
  search?: string,
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<PurchaseOrder>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockPurchaseOrders]
  
  if (status && status.length > 0) {
    filtered = filtered.filter(po => status.includes(po.status))
  }
  
  if (vendorId) {
    filtered = filtered.filter(po => po.vendorId === vendorId)
  }
  
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(po => 
      po.number.toLowerCase().includes(s) ||
      po.vendorName.toLowerCase().includes(s)
    )
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof PurchaseOrder]
      const bVal = b[sort.key as keyof PurchaseOrder]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  await delay(SIMULATED_DELAY)
  return mockPurchaseOrders.find(po => po.id === id) || null
}

export async function createPurchaseOrder(po: Partial<PurchaseOrder>): Promise<{ success: boolean; purchaseOrder?: PurchaseOrder }> {
  await delay(SIMULATED_DELAY)
  
  const newPO: PurchaseOrder = {
    id: `po${mockPurchaseOrders.length + 1}`,
    number: `PO-2024-${String(mockPurchaseOrders.length + 1).padStart(3, '0')}`,
    vendorId: po.vendorId || '',
    vendorName: po.vendorName || '',
    status: 'draft',
    orderDate: new Date(),
    lines: po.lines || [],
    subtotal: po.subtotal || 0,
    tax: po.tax || 0,
    total: po.total || 0,
    entityId: po.entityId || 'e1',
    departmentId: po.departmentId,
    projectId: po.projectId,
    notes: po.notes,
    createdBy: 'Current User',
    createdAt: new Date(),
  }
  
  mockPurchaseOrders.push(newPO)
  return { success: true, purchaseOrder: newPO }
}

export async function approvePurchaseOrder(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const po = mockPurchaseOrders.find(p => p.id === id)
  if (po && (po.status === 'draft' || po.status === 'pending_approval')) {
    po.status = 'approved'
    return { success: true }
  }
  return { success: false }
}

export async function sendPurchaseOrder(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const po = mockPurchaseOrders.find(p => p.id === id)
  if (po && po.status === 'approved') {
    po.status = 'sent'
    return { success: true }
  }
  return { success: false }
}

export async function receivePurchaseOrder(id: string, lineId?: string, quantity?: number): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const po = mockPurchaseOrders.find(p => p.id === id)
  if (po) {
    // If no lineId provided, mark all lines as fully received
    if (!lineId) {
      po.lines.forEach(l => { l.receivedQuantity = l.quantity })
      po.status = 'received'
      return { success: true }
    }
    
    const line = po.lines.find(l => l.id === lineId)
    if (line) {
      line.receivedQuantity = Math.min(line.quantity, line.receivedQuantity + (quantity || line.quantity))
      
      const allReceived = po.lines.every(l => l.receivedQuantity >= l.quantity)
      const someReceived = po.lines.some(l => l.receivedQuantity > 0)
      
      if (allReceived) {
        po.status = 'received'
      } else if (someReceived) {
        po.status = 'partially_received'
      }
      return { success: true }
    }
  }
  return { success: false }
}

// ============ SALES ORDER SERVICES ============

const mockSalesOrders: SalesOrder[] = [
  {
    id: 'so1',
    number: 'SO-2024-001',
    customerId: 'c1',
    customerName: 'Globex Corporation',
    status: 'confirmed',
    orderDate: new Date('2024-03-08'),
    requestedDate: new Date('2024-03-22'),
    lines: [
      { id: 'sol1', description: 'Consulting Services - Phase 1', quantity: 40, unitPrice: 150, amount: 6000, shippedQuantity: 0, accountId: 'acc10' },
      { id: 'sol2', description: 'Implementation Support', quantity: 20, unitPrice: 175, amount: 3500, shippedQuantity: 0, accountId: 'acc10' },
    ],
    subtotal: 9500,
    tax: 760,
    total: 10260,
    entityId: 'e1',
    salesRepId: 'u5',
    createdBy: 'Lisa Brown',
    createdAt: new Date('2024-03-08'),
  },
  {
    id: 'so2',
    number: 'SO-2024-002',
    customerId: 'c2',
    customerName: 'Initech Industries',
    status: 'shipped',
    orderDate: new Date('2024-03-05'),
    requestedDate: new Date('2024-03-15'),
    lines: [
      { id: 'sol3', description: 'Enterprise License', quantity: 1, unitPrice: 25000, amount: 25000, shippedQuantity: 1, accountId: 'acc11' },
    ],
    subtotal: 25000,
    tax: 0,
    total: 25000,
    entityId: 'e1',
    salesRepId: 'u5',
    createdBy: 'Lisa Brown',
    createdAt: new Date('2024-03-05'),
  },
  {
    id: 'so3',
    number: 'SO-2024-003',
    customerId: 'c3',
    customerName: 'Wayne Enterprises',
    status: 'draft',
    orderDate: new Date('2024-03-15'),
    lines: [
      { id: 'sol4', description: 'Custom Development', quantity: 80, unitPrice: 200, amount: 16000, shippedQuantity: 0, accountId: 'acc10' },
    ],
    subtotal: 16000,
    tax: 1280,
    total: 17280,
    entityId: 'e1',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2024-03-15'),
  },
  {
    id: 'so4',
    number: 'SO-2024-004',
    customerId: 'c4',
    customerName: 'Stark Industries',
    status: 'invoiced',
    orderDate: new Date('2024-03-01'),
    lines: [
      { id: 'sol5', description: 'Training Program', quantity: 3, unitPrice: 5000, amount: 15000, shippedQuantity: 3, accountId: 'acc12' },
    ],
    subtotal: 15000,
    tax: 1200,
    total: 16200,
    entityId: 'e1',
    salesRepId: 'u5',
    createdBy: 'Lisa Brown',
    createdAt: new Date('2024-03-01'),
  },
]

export async function getSalesOrders(
  status?: string[],
  customerId?: string,
  search?: string,
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<SalesOrder>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockSalesOrders]
  
  if (status && status.length > 0) {
    filtered = filtered.filter(so => status.includes(so.status))
  }
  
  if (customerId) {
    filtered = filtered.filter(so => so.customerId === customerId)
  }
  
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(so => 
      so.number.toLowerCase().includes(s) ||
      so.customerName.toLowerCase().includes(s)
    )
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof SalesOrder]
      const bVal = b[sort.key as keyof SalesOrder]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function getSalesOrderById(id: string): Promise<SalesOrder | null> {
  await delay(SIMULATED_DELAY)
  return mockSalesOrders.find(so => so.id === id) || null
}

export async function createSalesOrder(so: Partial<SalesOrder>): Promise<{ success: boolean; salesOrder?: SalesOrder }> {
  await delay(SIMULATED_DELAY)
  
  const newSO: SalesOrder = {
    id: `so${mockSalesOrders.length + 1}`,
    number: `SO-2024-${String(mockSalesOrders.length + 1).padStart(3, '0')}`,
    customerId: so.customerId || '',
    customerName: so.customerName || '',
    status: 'draft',
    orderDate: new Date(),
    lines: so.lines || [],
    subtotal: so.subtotal || 0,
    tax: so.tax || 0,
    total: so.total || 0,
    entityId: so.entityId || 'e1',
    salesRepId: so.salesRepId,
    notes: so.notes,
    createdBy: 'Current User',
    createdAt: new Date(),
  }
  
  mockSalesOrders.push(newSO)
  return { success: true, salesOrder: newSO }
}

export async function confirmSalesOrder(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const so = mockSalesOrders.find(s => s.id === id)
  if (so && (so.status === 'draft' || so.status === 'approved')) {
    so.status = 'confirmed'
    return { success: true }
  }
  return { success: false }
}

export async function shipSalesOrder(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const so = mockSalesOrders.find(s => s.id === id)
  if (so && so.status === 'confirmed') {
    so.lines.forEach(l => { l.shippedQuantity = l.quantity })
    so.status = 'shipped'
    return { success: true }
  }
  return { success: false }
}

export async function invoiceSalesOrder(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const so = mockSalesOrders.find(s => s.id === id)
  if (so && so.status === 'shipped') {
    so.status = 'invoiced'
    return { success: true }
  }
  return { success: false }
}

// ============ PROJECT DETAIL SERVICES ============

const mockProjectDetails: ProjectDetail[] = [
  {
    id: 'proj1',
    name: 'Project Alpha',
    code: 'ALPHA',
    status: 'active',
    customerId: 'c1',
    customerName: 'Globex Corporation',
    managerId: 'u2',
    managerName: 'Michael Johnson',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-06-30'),
    budget: 150000,
    actualCost: 67500,
    revenue: 85000,
    profitMargin: 25.9,
    percentComplete: 45,
    entityId: 'e1',
    departmentId: 'd3',
    description: 'Enterprise system implementation',
    createdAt: new Date('2024-01-10'),
  },
  {
    id: 'proj2',
    name: 'Project Beta',
    code: 'BETA',
    status: 'active',
    customerId: 'c2',
    customerName: 'Initech Industries',
    managerId: 'u1',
    managerName: 'Sarah Chen',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-08-31'),
    budget: 280000,
    actualCost: 42000,
    revenue: 56000,
    profitMargin: 33.3,
    percentComplete: 15,
    entityId: 'e1',
    departmentId: 'd3',
    description: 'Custom platform development',
    createdAt: new Date('2024-01-25'),
  },
  {
    id: 'proj3',
    name: 'Infrastructure Upgrade',
    code: 'INFRA',
    status: 'planning',
    managerId: 'u3',
    managerName: 'Emily Davis',
    startDate: new Date('2024-04-01'),
    budget: 75000,
    actualCost: 0,
    revenue: 0,
    profitMargin: 0,
    percentComplete: 0,
    entityId: 'e1',
    departmentId: 'd3',
    description: 'Internal infrastructure modernization',
    createdAt: new Date('2024-03-01'),
  },
  {
    id: 'proj4',
    name: 'Marketing Campaign Q2',
    code: 'MKT-Q2',
    status: 'active',
    managerId: 'u1',
    managerName: 'Sarah Chen',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-05-31'),
    budget: 50000,
    actualCost: 22000,
    revenue: 0,
    profitMargin: 0,
    percentComplete: 60,
    entityId: 'e1',
    departmentId: 'd2',
    description: 'Q2 marketing initiatives',
    createdAt: new Date('2024-02-15'),
  },
  {
    id: 'proj5',
    name: 'Legacy Migration',
    code: 'LEGACY',
    status: 'completed',
    customerId: 'c3',
    customerName: 'Wayne Enterprises',
    managerId: 'u2',
    managerName: 'Michael Johnson',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2024-02-28'),
    budget: 200000,
    actualCost: 185000,
    revenue: 220000,
    profitMargin: 18.9,
    percentComplete: 100,
    entityId: 'e1',
    departmentId: 'd3',
    description: 'Legacy system migration project',
    createdAt: new Date('2023-08-15'),
  },
]

export async function getProjectDetails(
  status?: string[],
  managerId?: string,
  search?: string,
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<ProjectDetail>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockProjectDetails]
  
  if (status && status.length > 0) {
    filtered = filtered.filter(p => status.includes(p.status))
  }
  
  if (managerId) {
    filtered = filtered.filter(p => p.managerId === managerId)
  }
  
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(s) ||
      p.code.toLowerCase().includes(s) ||
      (p.customerName && p.customerName.toLowerCase().includes(s))
    )
  }
  
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof ProjectDetail]
      const bVal = b[sort.key as keyof ProjectDetail]
      if (aVal === undefined || bVal === undefined) return 0
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function getProjectDetailById(id: string): Promise<ProjectDetail | null> {
  await delay(SIMULATED_DELAY)
  return mockProjectDetails.find(p => p.id === id) || null
}

export async function updateProjectStatus(id: string, status: ProjectDetail['status']): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const project = mockProjectDetails.find(p => p.id === id)
  if (project) {
    project.status = status
    if (status === 'completed') {
      project.percentComplete = 100
    }
    return { success: true }
  }
  return { success: false }
}

// ============ TIME ENTRY SERVICES ============

const mockTimeEntries: TimeEntry[] = [
  {
    id: 'te1',
    employeeId: 'u3',
    employeeName: 'Emily Davis',
    projectId: 'proj1',
    projectName: 'Project Alpha',
    taskDescription: 'Development - API Integration',
    date: new Date('2024-03-14'),
    hours: 6,
    billable: true,
    rate: 150,
    amount: 900,
    status: 'approved',
    entityId: 'e1',
    createdAt: new Date('2024-03-14'),
  },
  {
    id: 'te2',
    employeeId: 'u3',
    employeeName: 'Emily Davis',
    projectId: 'proj1',
    projectName: 'Project Alpha',
    taskDescription: 'Testing & QA',
    date: new Date('2024-03-14'),
    hours: 2,
    billable: true,
    rate: 150,
    amount: 300,
    status: 'approved',
    entityId: 'e1',
    createdAt: new Date('2024-03-14'),
  },
  {
    id: 'te3',
    employeeId: 'u2',
    employeeName: 'Michael Johnson',
    projectId: 'proj2',
    projectName: 'Project Beta',
    taskDescription: 'Project Management',
    date: new Date('2024-03-15'),
    hours: 4,
    billable: true,
    rate: 200,
    amount: 800,
    status: 'submitted',
    entityId: 'e1',
    createdAt: new Date('2024-03-15'),
  },
  {
    id: 'te4',
    employeeId: 'u4',
    employeeName: 'James Wilson',
    taskDescription: 'Internal Training',
    date: new Date('2024-03-15'),
    hours: 2,
    billable: false,
    rate: 0,
    amount: 0,
    status: 'draft',
    entityId: 'e1',
    notes: 'New software training session',
    createdAt: new Date('2024-03-15'),
  },
  {
    id: 'te5',
    employeeId: 'u5',
    employeeName: 'Lisa Brown',
    projectId: 'proj4',
    projectName: 'Marketing Campaign Q2',
    taskDescription: 'Campaign Analysis',
    date: new Date('2024-03-13'),
    hours: 5,
    billable: false,
    rate: 0,
    amount: 0,
    status: 'approved',
    entityId: 'e1',
    createdAt: new Date('2024-03-13'),
  },
]

export async function getTimeEntries(
  employeeId?: string,
  projectId?: string,
  status?: string[],
  dateFrom?: Date,
  dateTo?: Date,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<TimeEntry>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockTimeEntries]
  
  if (employeeId) {
    filtered = filtered.filter(te => te.employeeId === employeeId)
  }
  
  if (projectId) {
    filtered = filtered.filter(te => te.projectId === projectId)
  }
  
  if (status && status.length > 0) {
    filtered = filtered.filter(te => status.includes(te.status))
  }
  
  if (dateFrom) {
    filtered = filtered.filter(te => new Date(te.date) >= dateFrom)
  }
  
  if (dateTo) {
    filtered = filtered.filter(te => new Date(te.date) <= dateTo)
  }
  
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function createTimeEntry(entry: Partial<TimeEntry>): Promise<{ success: boolean; timeEntry?: TimeEntry }> {
  await delay(SIMULATED_DELAY)
  
  const newEntry: TimeEntry = {
    id: `te${mockTimeEntries.length + 1}`,
    employeeId: entry.employeeId || 'u1',
    employeeName: entry.employeeName || 'Current User',
    projectId: entry.projectId,
    projectName: entry.projectName,
    taskDescription: entry.taskDescription || '',
    date: entry.date || new Date(),
    hours: entry.hours || 0,
    billable: entry.billable || false,
    rate: entry.rate || 0,
    amount: (entry.hours || 0) * (entry.rate || 0),
    status: 'draft',
    entityId: entry.entityId || 'e1',
    notes: entry.notes,
    createdAt: new Date(),
  }
  
  mockTimeEntries.push(newEntry)
  return { success: true, timeEntry: newEntry }
}

export async function submitTimeEntry(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const entry = mockTimeEntries.find(te => te.id === id)
  if (entry && entry.status === 'draft') {
    entry.status = 'submitted'
    return { success: true }
  }
  return { success: false }
}

export async function approveTimeEntry(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const entry = mockTimeEntries.find(te => te.id === id)
  if (entry && entry.status === 'submitted') {
    entry.status = 'approved'
    return { success: true }
  }
  return { success: false }
}

// ============ EXPENSE ENTRY SERVICES ============

const mockExpenseEntries: ExpenseEntry[] = [
  {
    id: 'exp1',
    employeeId: 'u2',
    employeeName: 'Michael Johnson',
    category: 'Travel',
    description: 'Client visit - Flight to NYC',
    date: new Date('2024-03-10'),
    amount: 450,
    currency: 'USD',
    projectId: 'proj1',
    projectName: 'Project Alpha',
    customerId: 'c1',
    billable: true,
    status: 'approved',
    entityId: 'e1',
    createdAt: new Date('2024-03-11'),
  },
  {
    id: 'exp2',
    employeeId: 'u2',
    employeeName: 'Michael Johnson',
    category: 'Meals',
    description: 'Client dinner',
    date: new Date('2024-03-10'),
    amount: 185,
    currency: 'USD',
    projectId: 'proj1',
    projectName: 'Project Alpha',
    customerId: 'c1',
    billable: true,
    status: 'approved',
    entityId: 'e1',
    createdAt: new Date('2024-03-11'),
  },
  {
    id: 'exp3',
    employeeId: 'u3',
    employeeName: 'Emily Davis',
    category: 'Software',
    description: 'Development tools subscription',
    date: new Date('2024-03-01'),
    amount: 99,
    currency: 'USD',
    billable: false,
    status: 'reimbursed',
    entityId: 'e1',
    createdAt: new Date('2024-03-02'),
  },
  {
    id: 'exp4',
    employeeId: 'u5',
    employeeName: 'Lisa Brown',
    category: 'Marketing',
    description: 'Conference booth materials',
    date: new Date('2024-03-12'),
    amount: 1250,
    currency: 'USD',
    projectId: 'proj4',
    projectName: 'Marketing Campaign Q2',
    billable: false,
    status: 'submitted',
    entityId: 'e1',
    createdAt: new Date('2024-03-13'),
  },
  {
    id: 'exp5',
    employeeId: 'u4',
    employeeName: 'James Wilson',
    category: 'Office Supplies',
    description: 'Printer cartridges',
    date: new Date('2024-03-14'),
    amount: 75,
    currency: 'USD',
    billable: false,
    status: 'draft',
    entityId: 'e1',
    createdAt: new Date('2024-03-14'),
  },
]

export async function getExpenseEntries(
  employeeId?: string,
  projectId?: string,
  status?: string[],
  category?: string,
  dateFrom?: Date,
  dateTo?: Date,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<ExpenseEntry>> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockExpenseEntries]
  
  if (employeeId) {
    filtered = filtered.filter(e => e.employeeId === employeeId)
  }
  
  if (projectId) {
    filtered = filtered.filter(e => e.projectId === projectId)
  }
  
  if (status && status.length > 0) {
    filtered = filtered.filter(e => status.includes(e.status))
  }
  
  if (category) {
    filtered = filtered.filter(e => e.category === category)
  }
  
  if (dateFrom) {
    filtered = filtered.filter(e => new Date(e.date) >= dateFrom)
  }
  
  if (dateTo) {
    filtered = filtered.filter(e => new Date(e.date) <= dateTo)
  }
  
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  
  return { data, total, page, pageSize, totalPages }
}

export async function createExpenseEntry(expense: Partial<ExpenseEntry>): Promise<{ success: boolean; expense?: ExpenseEntry }> {
  await delay(SIMULATED_DELAY)
  
  const newExpense: ExpenseEntry = {
    id: `exp${mockExpenseEntries.length + 1}`,
    employeeId: expense.employeeId || 'u1',
    employeeName: expense.employeeName || 'Current User',
    category: expense.category || 'Other',
    description: expense.description || '',
    date: expense.date || new Date(),
    amount: expense.amount || 0,
    currency: expense.currency || 'USD',
    receipt: expense.receipt,
    projectId: expense.projectId,
    projectName: expense.projectName,
    customerId: expense.customerId,
    billable: expense.billable || false,
    status: 'draft',
    entityId: expense.entityId || 'e1',
    notes: expense.notes,
    createdAt: new Date(),
  }
  
  mockExpenseEntries.push(newExpense)
  return { success: true, expense: newExpense }
}

export async function submitExpenseEntry(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const expense = mockExpenseEntries.find(e => e.id === id)
  if (expense && expense.status === 'draft') {
    expense.status = 'submitted'
    return { success: true }
  }
  return { success: false }
}

export async function approveExpenseEntry(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const expense = mockExpenseEntries.find(e => e.id === id)
  if (expense && expense.status === 'submitted') {
    expense.status = 'approved'
    return { success: true }
  }
  return { success: false }
}

export async function reimburseExpenseEntry(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const expense = mockExpenseEntries.find(e => e.id === id)
  if (expense && expense.status === 'approved') {
    expense.status = 'reimbursed'
    return { success: true }
  }
  return { success: false }
}

// ============ RECURRING JOURNAL SERVICES ============

const mockRecurringJournals: RecurringJournal[] = [
  {
    id: 'rj1',
    name: 'Monthly Depreciation',
    description: 'Record monthly depreciation expense',
    frequency: 'monthly',
    startDate: new Date('2024-01-01'),
    nextRunDate: new Date('2024-04-01'),
    lastRunDate: new Date('2024-03-01'),
    status: 'active',
    templateLines: [
      { accountId: 'acc20', accountName: 'Depreciation Expense', debit: 12500, credit: 0, description: 'Monthly depreciation' },
      { accountId: 'acc21', accountName: 'Accumulated Depreciation', debit: 0, credit: 12500, description: 'Monthly depreciation' },
    ],
    entityId: 'e1',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2023-12-15'),
    runCount: 3,
  },
  {
    id: 'rj2',
    name: 'Monthly Rent Accrual',
    description: 'Accrue monthly office rent',
    frequency: 'monthly',
    startDate: new Date('2024-01-01'),
    nextRunDate: new Date('2024-04-01'),
    lastRunDate: new Date('2024-03-01'),
    status: 'active',
    templateLines: [
      { accountId: 'acc22', accountName: 'Rent Expense', debit: 8500, credit: 0, description: 'Office rent' },
      { accountId: 'acc23', accountName: 'Accrued Expenses', debit: 0, credit: 8500, description: 'Office rent accrual' },
    ],
    entityId: 'e1',
    createdBy: 'Emily Davis',
    createdAt: new Date('2023-12-20'),
    runCount: 3,
  },
  {
    id: 'rj3',
    name: 'Quarterly Insurance Amortization',
    description: 'Amortize prepaid insurance',
    frequency: 'quarterly',
    startDate: new Date('2024-01-01'),
    nextRunDate: new Date('2024-04-01'),
    lastRunDate: new Date('2024-01-01'),
    status: 'active',
    templateLines: [
      { accountId: 'acc24', accountName: 'Insurance Expense', debit: 6000, credit: 0, description: 'Insurance amortization' },
      { accountId: 'acc25', accountName: 'Prepaid Insurance', debit: 0, credit: 6000, description: 'Insurance amortization' },
    ],
    entityId: 'e1',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2023-12-28'),
    runCount: 1,
  },
  {
    id: 'rj4',
    name: 'Weekly Payroll Accrual',
    description: 'Accrue weekly payroll',
    frequency: 'weekly',
    startDate: new Date('2024-01-01'),
    nextRunDate: new Date('2024-03-22'),
    lastRunDate: new Date('2024-03-15'),
    status: 'active',
    templateLines: [
      { accountId: 'acc26', accountName: 'Salaries Expense', debit: 45000, credit: 0, description: 'Weekly payroll' },
      { accountId: 'acc27', accountName: 'Accrued Payroll', debit: 0, credit: 45000, description: 'Weekly payroll accrual' },
    ],
    entityId: 'e1',
    createdBy: 'Michael Johnson',
    createdAt: new Date('2024-01-02'),
    runCount: 11,
  },
  {
    id: 'rj5',
    name: 'Annual License Amortization',
    description: 'Amortize annual software licenses',
    frequency: 'yearly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    nextRunDate: new Date('2025-01-01'),
    lastRunDate: new Date('2024-01-01'),
    status: 'paused',
    templateLines: [
      { accountId: 'acc28', accountName: 'Software License Expense', debit: 36000, credit: 0, description: 'Annual license' },
      { accountId: 'acc29', accountName: 'Prepaid Software', debit: 0, credit: 36000, description: 'Annual license amortization' },
    ],
    entityId: 'e1',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2024-01-05'),
    runCount: 1,
  },
]

export async function getRecurringJournals(
  status?: string[],
  frequency?: string[],
  search?: string
): Promise<RecurringJournal[]> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockRecurringJournals]
  
  if (status && status.length > 0) {
    filtered = filtered.filter(rj => status.includes(rj.status))
  }
  
  if (frequency && frequency.length > 0) {
    filtered = filtered.filter(rj => frequency.includes(rj.frequency))
  }
  
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(rj => 
      rj.name.toLowerCase().includes(s) ||
      (rj.description && rj.description.toLowerCase().includes(s))
    )
  }
  
  return filtered
}

export async function getRecurringJournalById(id: string): Promise<RecurringJournal | null> {
  await delay(SIMULATED_DELAY)
  return mockRecurringJournals.find(rj => rj.id === id) || null
}

export async function createRecurringJournal(rj: Partial<RecurringJournal>): Promise<{ success: boolean; recurringJournal?: RecurringJournal }> {
  await delay(SIMULATED_DELAY)
  
  const newRJ: RecurringJournal = {
    id: `rj${mockRecurringJournals.length + 1}`,
    name: rj.name || 'New Recurring Journal',
    description: rj.description,
    frequency: rj.frequency || 'monthly',
    startDate: rj.startDate || new Date(),
    endDate: rj.endDate,
    nextRunDate: rj.startDate || new Date(),
    status: 'active',
    templateLines: rj.templateLines || [],
    entityId: rj.entityId || 'e1',
    createdBy: 'Current User',
    createdAt: new Date(),
    runCount: 0,
  }
  
  mockRecurringJournals.push(newRJ)
  return { success: true, recurringJournal: newRJ }
}

export async function runRecurringJournal(id: string): Promise<{ success: boolean; journalEntryId?: string }> {
  await delay(SIMULATED_DELAY)
  const rj = mockRecurringJournals.find(r => r.id === id)
  if (rj && rj.status === 'active') {
    rj.lastRunDate = new Date()
    rj.runCount++
    // Calculate next run date based on frequency
    const next = new Date(rj.lastRunDate)
    switch (rj.frequency) {
      case 'daily': next.setDate(next.getDate() + 1); break
      case 'weekly': next.setDate(next.getDate() + 7); break
      case 'monthly': next.setMonth(next.getMonth() + 1); break
      case 'quarterly': next.setMonth(next.getMonth() + 3); break
      case 'yearly': next.setFullYear(next.getFullYear() + 1); break
    }
    rj.nextRunDate = next
    return { success: true, journalEntryId: `je-auto-${Date.now()}` }
  }
  return { success: false }
}

export async function pauseRecurringJournal(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const rj = mockRecurringJournals.find(r => r.id === id)
  if (rj && rj.status === 'active') {
    rj.status = 'paused'
    return { success: true }
  }
  return { success: false }
}

export async function resumeRecurringJournal(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const rj = mockRecurringJournals.find(r => r.id === id)
  if (rj && rj.status === 'paused') {
    rj.status = 'active'
    return { success: true }
  }
  return { success: false }
}

// ============ ALLOCATION SERVICES ============

const mockAllocations: Allocation[] = [
  {
    id: 'alloc1',
    name: 'IT Cost Allocation',
    description: 'Allocate IT department costs to all departments',
    sourceAccountId: 'acc30',
    sourceAccountName: 'IT Department Expenses',
    method: 'percentage',
    targets: [
      { id: 't1', accountId: 'acc31', accountName: 'Sales Dept Expense', departmentId: 'd1', departmentName: 'Sales', percentage: 35 },
      { id: 't2', accountId: 'acc32', accountName: 'Marketing Dept Expense', departmentId: 'd2', departmentName: 'Marketing', percentage: 25 },
      { id: 't3', accountId: 'acc33', accountName: 'Engineering Dept Expense', departmentId: 'd3', departmentName: 'Engineering', percentage: 30 },
      { id: 't4', accountId: 'acc34', accountName: 'Finance Dept Expense', departmentId: 'd4', departmentName: 'Finance', percentage: 10 },
    ],
    status: 'active',
    frequency: 'monthly',
    lastRunDate: new Date('2024-03-01'),
    entityId: 'e1',
    createdBy: 'Sarah Chen',
    createdAt: new Date('2023-06-01'),
  },
  {
    id: 'alloc2',
    name: 'Rent Allocation',
    description: 'Allocate office rent by headcount',
    sourceAccountId: 'acc35',
    sourceAccountName: 'Office Rent',
    method: 'statistical',
    basis: 'headcount',
    targets: [
      { id: 't5', accountId: 'acc31', accountName: 'Sales Dept Expense', departmentId: 'd1', departmentName: 'Sales', percentage: 40 },
      { id: 't6', accountId: 'acc32', accountName: 'Marketing Dept Expense', departmentId: 'd2', departmentName: 'Marketing', percentage: 15 },
      { id: 't7', accountId: 'acc33', accountName: 'Engineering Dept Expense', departmentId: 'd3', departmentName: 'Engineering', percentage: 35 },
      { id: 't8', accountId: 'acc34', accountName: 'Finance Dept Expense', departmentId: 'd4', departmentName: 'Finance', percentage: 10 },
    ],
    status: 'active',
    frequency: 'monthly',
    lastRunDate: new Date('2024-03-01'),
    entityId: 'e1',
    createdBy: 'Michael Johnson',
    createdAt: new Date('2023-06-15'),
  },
  {
    id: 'alloc3',
    name: 'Shared Services Allocation',
    description: 'Allocate shared services costs',
    sourceAccountId: 'acc36',
    sourceAccountName: 'Shared Services',
    method: 'fixed',
    targets: [
      { id: 't9', accountId: 'acc31', accountName: 'Sales Dept Expense', departmentId: 'd1', departmentName: 'Sales', fixedAmount: 5000 },
      { id: 't10', accountId: 'acc32', accountName: 'Marketing Dept Expense', departmentId: 'd2', departmentName: 'Marketing', fixedAmount: 3000 },
      { id: 't11', accountId: 'acc33', accountName: 'Engineering Dept Expense', departmentId: 'd3', departmentName: 'Engineering', fixedAmount: 4500 },
    ],
    status: 'draft',
    frequency: 'quarterly',
    entityId: 'e1',
    createdBy: 'Emily Davis',
    createdAt: new Date('2024-02-01'),
  },
]

export async function getAllocations(
  status?: string[],
  method?: string[]
): Promise<Allocation[]> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockAllocations]
  
  if (status && status.length > 0) {
    filtered = filtered.filter(a => status.includes(a.status))
  }
  
  if (method && method.length > 0) {
    filtered = filtered.filter(a => method.includes(a.method))
  }
  
  return filtered
}

export async function getAllocationById(id: string): Promise<Allocation | null> {
  await delay(SIMULATED_DELAY)
  return mockAllocations.find(a => a.id === id) || null
}

export async function createAllocation(alloc: Partial<Allocation>): Promise<{ success: boolean; allocation?: Allocation }> {
  await delay(SIMULATED_DELAY)
  
  const newAlloc: Allocation = {
    id: `alloc${mockAllocations.length + 1}`,
    name: alloc.name || 'New Allocation',
    description: alloc.description,
    sourceAccountId: alloc.sourceAccountId || '',
    sourceAccountName: alloc.sourceAccountName || '',
    method: alloc.method || 'percentage',
    basis: alloc.basis,
    targets: alloc.targets || [],
    status: 'draft',
    frequency: alloc.frequency || 'monthly',
    entityId: alloc.entityId || 'e1',
    createdBy: 'Current User',
    createdAt: new Date(),
  }
  
  mockAllocations.push(newAlloc)
  return { success: true, allocation: newAlloc }
}

export async function runAllocation(id: string): Promise<{ success: boolean; journalEntryId?: string }> {
  await delay(SIMULATED_DELAY)
  const alloc = mockAllocations.find(a => a.id === id)
  if (alloc && alloc.status === 'active') {
    alloc.lastRunDate = new Date()
    return { success: true, journalEntryId: `je-alloc-${Date.now()}` }
  }
  return { success: false }
}

export async function activateAllocation(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const alloc = mockAllocations.find(a => a.id === id)
  if (alloc && alloc.status === 'draft') {
    alloc.status = 'active'
    return { success: true }
  }
  return { success: false }
}

export async function deactivateAllocation(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const alloc = mockAllocations.find(a => a.id === id)
  if (alloc && alloc.status === 'active') {
    alloc.status = 'inactive'
    return { success: true }
  }
  return { success: false }
}

// ==========================================
// ACCOUNTING PERIODS
// ==========================================

interface AccountingPeriod {
  id: string
  name: string
  fiscalYear: number
  periodNumber: number
  startDate: Date
  endDate: Date
  status: 'open' | 'closed' | 'locked' | 'future'
  entityId: string
  closedBy?: string
  closedAt?: Date
  lockedBy?: string
  lockedAt?: Date
}

const mockAccountingPeriods: AccountingPeriod[] = [
  { id: 'p1', name: 'January 2024', fiscalYear: 2024, periodNumber: 1, startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31'), status: 'closed', entityId: 'e4', closedBy: 'Sarah Chen', closedAt: new Date('2024-02-05') },
  { id: 'p2', name: 'February 2024', fiscalYear: 2024, periodNumber: 2, startDate: new Date('2024-02-01'), endDate: new Date('2024-02-29'), status: 'closed', entityId: 'e4', closedBy: 'Sarah Chen', closedAt: new Date('2024-03-05') },
  { id: 'p3', name: 'March 2024', fiscalYear: 2024, periodNumber: 3, startDate: new Date('2024-03-01'), endDate: new Date('2024-03-31'), status: 'open', entityId: 'e4' },
  { id: 'p4', name: 'April 2024', fiscalYear: 2024, periodNumber: 4, startDate: new Date('2024-04-01'), endDate: new Date('2024-04-30'), status: 'future', entityId: 'e4' },
  { id: 'p5', name: 'May 2024', fiscalYear: 2024, periodNumber: 5, startDate: new Date('2024-05-01'), endDate: new Date('2024-05-31'), status: 'future', entityId: 'e4' },
  { id: 'p6', name: 'June 2024', fiscalYear: 2024, periodNumber: 6, startDate: new Date('2024-06-01'), endDate: new Date('2024-06-30'), status: 'future', entityId: 'e4' },
  { id: 'p7', name: 'July 2024', fiscalYear: 2024, periodNumber: 7, startDate: new Date('2024-07-01'), endDate: new Date('2024-07-31'), status: 'future', entityId: 'e4' },
  { id: 'p8', name: 'August 2024', fiscalYear: 2024, periodNumber: 8, startDate: new Date('2024-08-01'), endDate: new Date('2024-08-31'), status: 'future', entityId: 'e4' },
  { id: 'p9', name: 'September 2024', fiscalYear: 2024, periodNumber: 9, startDate: new Date('2024-09-01'), endDate: new Date('2024-09-30'), status: 'future', entityId: 'e4' },
  { id: 'p10', name: 'October 2024', fiscalYear: 2024, periodNumber: 10, startDate: new Date('2024-10-01'), endDate: new Date('2024-10-31'), status: 'future', entityId: 'e4' },
  { id: 'p11', name: 'November 2024', fiscalYear: 2024, periodNumber: 11, startDate: new Date('2024-11-01'), endDate: new Date('2024-11-30'), status: 'future', entityId: 'e4' },
  { id: 'p12', name: 'December 2024', fiscalYear: 2024, periodNumber: 12, startDate: new Date('2024-12-01'), endDate: new Date('2024-12-31'), status: 'future', entityId: 'e4' },
  // Previous year - all closed/locked
  { id: 'p13', name: 'January 2023', fiscalYear: 2023, periodNumber: 1, startDate: new Date('2023-01-01'), endDate: new Date('2023-01-31'), status: 'locked', entityId: 'e4', closedBy: 'Sarah Chen', closedAt: new Date('2023-02-05'), lockedBy: 'Sarah Chen', lockedAt: new Date('2023-03-01') },
  { id: 'p14', name: 'February 2023', fiscalYear: 2023, periodNumber: 2, startDate: new Date('2023-02-01'), endDate: new Date('2023-02-28'), status: 'locked', entityId: 'e4', closedBy: 'Sarah Chen', closedAt: new Date('2023-03-05'), lockedBy: 'Sarah Chen', lockedAt: new Date('2023-04-01') },
  { id: 'p15', name: 'March 2023', fiscalYear: 2023, periodNumber: 3, startDate: new Date('2023-03-01'), endDate: new Date('2023-03-31'), status: 'locked', entityId: 'e4', closedBy: 'Sarah Chen', closedAt: new Date('2023-04-05'), lockedBy: 'Sarah Chen', lockedAt: new Date('2023-05-01') },
]

export async function getAccountingPeriods(
  entityId?: string,
  fiscalYear?: number
): Promise<AccountingPeriod[]> {
  await delay(SIMULATED_DELAY)
  
  let filtered = [...mockAccountingPeriods]
  
  if (entityId && entityId !== 'all' && entityId !== 'e4') {
    // For demo, return same data but with different entity
    filtered = filtered.map(p => ({ ...p, entityId }))
  }
  
  if (fiscalYear) {
    filtered = filtered.filter(p => p.fiscalYear === fiscalYear)
  }
  
  return filtered.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
}

export async function closePeriod(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const period = mockAccountingPeriods.find(p => p.id === id)
  if (period && period.status === 'open') {
    period.status = 'closed'
    period.closedBy = 'Current User'
    period.closedAt = new Date()
    return { success: true }
  }
  return { success: false }
}

export async function reopenPeriod(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const period = mockAccountingPeriods.find(p => p.id === id)
  if (period && period.status === 'closed') {
    period.status = 'open'
    period.closedBy = undefined
    period.closedAt = undefined
    return { success: true }
  }
  return { success: false }
}

export async function lockPeriod(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const period = mockAccountingPeriods.find(p => p.id === id)
  if (period && period.status === 'closed') {
    period.status = 'locked'
    period.lockedBy = 'Current User'
    period.lockedAt = new Date()
    return { success: true }
  }
  return { success: false }
}

export async function unlockPeriod(id: string): Promise<{ success: boolean }> {
  await delay(SIMULATED_DELAY)
  const period = mockAccountingPeriods.find(p => p.id === id)
  if (period && period.status === 'locked') {
    period.status = 'closed'
    period.lockedBy = undefined
    period.lockedAt = undefined
    return { success: true }
  }
  return { success: false }
}
