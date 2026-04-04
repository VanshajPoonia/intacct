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
