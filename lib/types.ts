// Core Entity Types
export interface Entity {
  id: string
  name: string
  code: string
  type: 'primary' | 'subsidiary' | 'consolidated'
  currency: string
  status: 'active' | 'inactive'
}

export interface Vendor {
  id: string
  name: string
  code: string
  email: string
  phone?: string
  address?: string
  taxId?: string
  paymentTerms: string
  status: 'active' | 'inactive' | 'pending'
  balance: number
  currency: string
  createdAt: Date
}

export interface Customer {
  id: string
  name: string
  code: string
  email: string
  phone?: string
  address?: string
  creditLimit: number
  paymentTerms: string
  status: 'active' | 'inactive' | 'pending'
  balance: number
  currency: string
  createdAt: Date
}

export interface Account {
  id: string
  number: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  category: string
  subCategory?: string
  balance: number
  currency: string
  status: 'active' | 'inactive'
  parentId?: string
}

export interface Transaction {
  id: string
  date: Date
  type: 'debit' | 'credit'
  amount: number
  currency: string
  accountId: string
  accountName: string
  description: string
  reference?: string
  status: 'posted' | 'pending' | 'voided'
  entityId: string
  createdBy: string
  createdAt: Date
}

export interface Bill {
  id: string
  number: string
  vendorId: string
  vendorName: string
  date: Date
  dueDate: Date
  amount: number
  currency: string
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'voided'
  description?: string
  lineItems: BillLineItem[]
  entityId: string
  createdAt: Date
}

export interface BillLineItem {
  id: string
  description: string
  accountId: string
  accountName: string
  amount: number
  quantity: number
  unitPrice: number
}

export interface Invoice {
  id: string
  number: string
  customerId: string
  customerName: string
  date: Date
  dueDate: Date
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'voided'
  description?: string
  lineItems: InvoiceLineItem[]
  entityId: string
  createdAt: Date
}

export interface InvoiceLineItem {
  id: string
  description: string
  accountId: string
  accountName: string
  amount: number
  quantity: number
  unitPrice: number
}

export interface JournalEntry {
  id: string
  number: string
  date: Date
  description: string
  status: 'draft' | 'posted' | 'reversed'
  lines: JournalEntryLine[]
  entityId: string
  createdBy: string
  createdAt: Date
  postedAt?: Date
}

export interface JournalEntryLine {
  id: string
  accountId: string
  accountNumber: string
  accountName: string
  debit: number
  credit: number
  description?: string
  departmentId?: string
  locationId?: string
}

export interface ApprovalItem {
  id: string
  type: 'bill' | 'invoice' | 'journal_entry' | 'purchase_order' | 'expense'
  documentId: string
  documentNumber: string
  description: string
  amount: number
  currency: string
  requestedBy: string
  requestedAt: Date
  status: 'pending' | 'approved' | 'rejected'
  approvers: Approver[]
  currentStep: number
  entityId: string
}

export interface Approver {
  id: string
  name: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  respondedAt?: Date
  comments?: string
}

export interface ReportFilter {
  startDate?: Date
  endDate?: Date
  entityIds?: string[]
  accountIds?: string[]
  departmentIds?: string[]
  locationIds?: string[]
  vendorIds?: string[]
  customerIds?: string[]
  projectIds?: string[]
  employeeIds?: string[]
  status?: string[]
}

// Dashboard Filter State
export interface DashboardFilters {
  entityId: string
  departmentId?: string
  locationId?: string
  projectId?: string
  customerId?: string
  vendorId?: string
  employeeId?: string
  dateRange: {
    startDate: Date
    endDate: Date
    preset?: 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'last_month' | 'last_quarter' | 'last_year' | 'custom'
  }
}

// Enhanced Dashboard Metrics Response
export interface DashboardMetricsResponse {
  totalRevenue: DashboardMetric
  totalExpenses: DashboardMetric
  netIncome: DashboardMetric
  cashBalance: DashboardMetric
  arOutstanding: DashboardMetric
  apOutstanding: DashboardMetric
  budgetVariance: DashboardMetric
  pendingApprovals: DashboardMetric
}

// Chart Data Response Types
export interface RevenueByChannelData {
  channel: string
  direct: number
  partner: number
  online: number
}

export interface RevenueTrendData {
  year: number
  data: { month: string; value: number }[]
}

export interface DepartmentExpenseData {
  department: string
  salary: number
  benefits: number
  travel: number
  supplies: number
}

export interface CashWeeklyData {
  week: string
  opening: number
  inflow: number
  outflow: number
  closing: number
}

export interface ContractExpenseData {
  rep: string
  value: number
  color: string
}

export interface AgingData {
  bucket: string
  amount: number
  count: number
}

export interface BudgetActualData {
  category: string
  budget: number
  actual: number
  variance: number
  variancePercent: number
}

export interface EntityPerformanceData {
  entityId: string
  entityName: string
  revenue: number
  expenses: number
  netIncome: number
  cashBalance: number
}

export interface AIInsight {
  id: string
  type: 'anomaly' | 'duplicate' | 'missing_receipt' | 'budget_variance' | 'recommendation'
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  relatedIds?: string[]
  actionLabel?: string
  actionHref?: string
  createdAt: Date
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

// Department and Location types
export interface Department {
  id: string
  name: string
  code: string
  managerId?: string
  parentId?: string
  status: 'active' | 'inactive'
}

export interface Location {
  id: string
  name: string
  code: string
  address?: string
  status: 'active' | 'inactive'
}

export interface Project {
  id: string
  name: string
  code: string
  customerId?: string
  managerId?: string
  budget: number
  spent: number
  status: 'active' | 'completed' | 'on_hold'
  startDate: Date
  endDate?: Date
}

export interface Employee {
  id: string
  name: string
  email: string
  departmentId: string
  locationId?: string
  role: string
  status: 'active' | 'inactive'
}

export interface DashboardMetric {
  id: string
  label: string
  value: number
  previousValue?: number
  change?: number
  changeType?: 'positive' | 'negative' | 'neutral'
  format: 'currency' | 'number' | 'percentage'
  currency?: string
}

// Navigation Types
export interface NavModule {
  id: string
  label: string
  icon: string
  href?: string
  megaMenu?: MegaMenuGroup[]
}

export interface MegaMenuGroup {
  label: string
  items: MegaMenuItem[]
}

export interface MegaMenuItem {
  label: string
  href: string
  description?: string
  icon?: string
}

// User Types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  entityIds: string[]
}

// Financial Statement Types
export type { BalanceSheetData, IncomeStatementData } from './services'

// Notification Types
export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  createdAt: Date
  link?: string
}

// Task Types
export interface Task {
  id: string
  title: string
  description?: string
  dueDate?: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'completed'
  assignedTo?: string
  relatedType?: string
  relatedId?: string
  createdAt: Date
}

// Payment Types
export interface Payment {
  id: string
  number: string
  date: Date
  amount: number
  currency: string
  method: 'check' | 'ach' | 'wire' | 'credit_card'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'voided'
  vendorId: string
  vendorName: string
  billIds: string[]
  bankAccountId: string
  bankAccountName: string
  checkNumber?: string
  reference?: string
  memo?: string
  entityId: string
  createdBy: string
  createdAt: Date
}

// Bank Account Types
export interface BankAccount {
  id: string
  name: string
  accountNumber: string
  routingNumber?: string
  bankName: string
  type: 'checking' | 'savings' | 'credit'
  balance: number
  currency: string
  status: 'active' | 'inactive'
  lastSyncedAt?: Date
  entityId: string
}

// Chart Data Types
export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}
