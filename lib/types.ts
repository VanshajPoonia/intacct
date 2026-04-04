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
  // Remittance info
  bankName?: string
  bankAccountNumber?: string
  bankRoutingNumber?: string
  preferredPaymentMethod?: 'check' | 'ach' | 'wire'
  remittanceEmail?: string
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
  approvalStatus: 'not_submitted' | 'pending_approval' | 'approved' | 'rejected'
  paymentStatus: 'unpaid' | 'partial' | 'paid'
  description?: string
  lineItems: BillLineItem[]
  entityId: string
  departmentId?: string
  departmentName?: string
  locationId?: string
  locationName?: string
  terms?: string
  createdAt: Date
  submittedAt?: Date
  submittedBy?: string
  approvedAt?: Date
  approvedBy?: string
  rejectedAt?: Date
  rejectedBy?: string
  rejectionReason?: string
}

export interface BillLineItem {
  id: string
  description: string
  accountId: string
  accountName: string
  amount: number
  quantity: number
  unitPrice: number
  taxAmount?: number
  departmentId?: string
  departmentName?: string
  locationId?: string
  locationName?: string
  projectId?: string
  projectName?: string
}

export interface BillApprovalHistory {
  id: string
  billId: string
  action: 'submitted' | 'approved' | 'rejected' | 'reassigned' | 'commented'
  userId: string
  userName: string
  timestamp: Date
  comment?: string
  fromUser?: string
  toUser?: string
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

// Receipt Types (Cash Receipts / AR Payments)
export interface Receipt {
  id: string
  number: string
  date: Date
  amount: number
  currency: string
  method: 'check' | 'ach' | 'wire' | 'credit_card' | 'cash'
  status: 'pending' | 'applied' | 'unapplied' | 'voided'
  customerId: string
  customerName: string
  invoiceIds: string[]
  bankAccountId: string
  bankAccountName: string
  checkNumber?: string
  reference?: string
  memo?: string
  entityId: string
  createdBy: string
  createdAt: Date
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
  departmentName?: string
  locationId?: string
  locationName?: string
  projectId?: string
  projectName?: string
  customerId?: string
  customerName?: string
  vendorId?: string
  vendorName?: string
}

export interface AccountingPeriod {
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

// Transfer Types
export interface Transfer {
  id: string
  number: string
  date: Date
  amount: number
  currency: string
  fromAccountId: string
  fromAccountName: string
  toAccountId: string
  toAccountName: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  reference?: string
  memo?: string
  entityId: string
  createdBy: string
  createdAt: Date
}

// Reconciliation Types
export interface ReconciliationItem {
  id: string
  date: Date
  description: string
  reference?: string
  bankAmount: number
  bookAmount: number
  difference: number
  status: 'matched' | 'unmatched' | 'adjusted' | 'cleared'
  type: 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'interest'
  bankAccountId: string
  transactionId?: string
  matchedAt?: Date
  matchedBy?: string
}

export interface ReconciliationSummary {
  bankBalance: number
  bookBalance: number
  outstandingDeposits: number
  outstandingWithdrawals: number
  adjustments: number
  reconciledBalance: number
  lastReconciledDate?: Date
  status: 'in_progress' | 'completed' | 'needs_review'
}

// Cash Position Types
export interface CashPositionData {
  totalCash: number
  availableCash: number
  pendingInflows: number
  pendingOutflows: number
  projectedBalance: number
  accountBreakdown: { accountId: string; accountName: string; balance: number; available: number }[]
  dailyForecast: { date: string; opening: number; inflows: number; outflows: number; closing: number }[]
}

// Chart Data Types
export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

// Purchase Order Types
export interface PurchaseOrder {
  id: string
  number: string
  vendorId: string
  vendorName: string
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'received' | 'closed' | 'cancelled'
  orderDate: Date
  expectedDate?: Date
  lines: PurchaseOrderLine[]
  subtotal: number
  tax: number
  total: number
  entityId: string
  departmentId?: string
  projectId?: string
  notes?: string
  createdBy: string
  createdAt: Date
}

export interface PurchaseOrderLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  receivedQuantity: number
  accountId: string
}

// Sales Order Types
export interface SalesOrder {
  id: string
  number: string
  customerId: string
  customerName: string
  status: 'draft' | 'pending_approval' | 'approved' | 'confirmed' | 'partially_shipped' | 'shipped' | 'invoiced' | 'closed' | 'cancelled'
  orderDate: Date
  requestedDate?: Date
  lines: SalesOrderLine[]
  subtotal: number
  tax: number
  total: number
  entityId: string
  salesRepId?: string
  notes?: string
  createdBy: string
  createdAt: Date
}

export interface SalesOrderLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  shippedQuantity: number
  accountId: string
}

// Project Types (extended)
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

// Time Entry Types
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

// Expense Entry Types
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

// Recurring Journal Types
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
  templateLines: JournalEntryLine[]
  entityId: string
  createdBy: string
  createdAt: Date
  runCount: number
}

// Allocation Types
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

export interface AllocationTarget {
  id: string
  accountId: string
  accountName: string
  departmentId?: string
  departmentName?: string
  percentage?: number
  fixedAmount?: number
}

// Admin Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'controller' | 'accountant' | 'viewer' | 'ap_clerk' | 'ar_clerk'
  status: 'active' | 'inactive' | 'pending'
  entityIds: string[]
  lastLoginAt?: Date
  createdAt: Date
  avatar?: string
}

export interface Dimension {
  id: string
  name: string
  code: string
  type: 'department' | 'location' | 'project' | 'class' | 'custom'
  status: 'active' | 'inactive'
  parentId?: string
  entityIds: string[]
  createdAt: Date
}

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

export interface WorkflowStep {
  id: string
  order: number
  type: 'approval' | 'notification' | 'condition' | 'action'
  config: Record<string, unknown>
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

// Task Types
export interface Task {
  id: string
  title: string
  description?: string
  type: 'approval' | 'review' | 'data_entry' | 'reconciliation' | 'follow_up' | 'other'
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
  dueDate?: Date
  assigneeId: string
  assigneeName: string
  relatedType?: 'bill' | 'invoice' | 'journal_entry' | 'payment' | 'receipt' | 'reconciliation'
  relatedId?: string
  relatedNumber?: string
  entityId: string
  createdBy: string
  createdAt: Date
  completedAt?: Date
}

// Notification Types
export interface Notification {
  id: string
  type: 'approval_required' | 'approval_completed' | 'task_assigned' | 'task_due' | 'payment_received' | 'invoice_overdue' | 'sync_error' | 'system' | 'mention'
  title: string
  message: string
  read: boolean
  actionUrl?: string
  relatedType?: string
  relatedId?: string
  createdAt: Date
}

// Activity Timeline Types
export interface ActivityItem {
  id: string
  type: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'post' | 'void' | 'payment' | 'login' | 'export' | 'import'
  action: string
  description: string
  userId: string
  userName: string
  userAvatar?: string
  relatedType?: string
  relatedId?: string
  relatedNumber?: string
  entityId: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

// Auth Types
export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'controller' | 'accountant' | 'viewer' | 'ap_clerk' | 'ar_clerk'
  avatar?: string
  entityIds: string[]
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
  expiresAt: Date
}

// Preferences Types
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  defaultEntity: string
  defaultDateRange: 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year'
  sidebarCollapsed: boolean
  notifications: {
    email: boolean
    push: boolean
    approvals: boolean
    tasks: boolean
  }
}

// Saved View Types
export interface SavedView {
  id: string
  name: string
  module: string
  filters: Record<string, unknown>
  columns?: string[]
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  isDefault: boolean
  createdBy: string
  createdAt: Date
}
