import type {
  Entity,
  Vendor,
  Customer,
  Account,
  Transaction,
  Bill,
  Invoice,
  JournalEntry,
  ApprovalItem,
  DashboardMetric,
  NavModule,
  User,
  Notification,
  Task,
  BankAccount,
  ChartDataPoint,
} from './types'

// Entities
export const entities: Entity[] = [
  { id: 'e1', name: 'Acme Corporation', code: 'ACME', type: 'primary', currency: 'USD', status: 'active' },
  { id: 'e2', name: 'Acme West', code: 'ACME-W', type: 'subsidiary', currency: 'USD', status: 'active' },
  { id: 'e3', name: 'Acme Europe', code: 'ACME-EU', type: 'subsidiary', currency: 'EUR', status: 'active' },
  { id: 'e4', name: 'Acme Consolidated', code: 'ACME-CON', type: 'consolidated', currency: 'USD', status: 'active' },
]

// Current User
export const currentUser: User = {
  id: 'u1',
  name: 'Sarah Chen',
  email: 'sarah.chen@acme.com',
  avatar: undefined,
  role: 'Controller',
  entityIds: ['e1', 'e2', 'e3', 'e4'],
}

// Vendors
export const vendors: Vendor[] = [
  { id: 'v1', name: 'Office Supply Co', code: 'OSC001', email: 'ap@officesupply.com', paymentTerms: 'Net 30', status: 'active', balance: 12500, currency: 'USD', createdAt: new Date('2024-01-15') },
  { id: 'v2', name: 'Tech Solutions Inc', code: 'TSI002', email: 'billing@techsolutions.com', paymentTerms: 'Net 45', status: 'active', balance: 87300, currency: 'USD', createdAt: new Date('2024-02-20') },
  { id: 'v3', name: 'CloudHost Services', code: 'CHS003', email: 'invoices@cloudhost.io', paymentTerms: 'Net 15', status: 'active', balance: 4200, currency: 'USD', createdAt: new Date('2024-03-10') },
  { id: 'v4', name: 'Marketing Agency Plus', code: 'MAP004', email: 'accounts@mapagency.com', paymentTerms: 'Net 30', status: 'active', balance: 35000, currency: 'USD', createdAt: new Date('2024-01-25') },
  { id: 'v5', name: 'Logistics Partners', code: 'LP005', email: 'ap@logisticspartners.com', paymentTerms: 'Net 60', status: 'active', balance: 22800, currency: 'USD', createdAt: new Date('2024-04-05') },
]

// Customers
export const customers: Customer[] = [
  { id: 'c1', name: 'Enterprise Corp', code: 'EC001', email: 'ar@enterprisecorp.com', creditLimit: 500000, paymentTerms: 'Net 30', status: 'active', balance: 125000, currency: 'USD', createdAt: new Date('2023-06-15') },
  { id: 'c2', name: 'Global Industries', code: 'GI002', email: 'payments@globalind.com', creditLimit: 250000, paymentTerms: 'Net 45', status: 'active', balance: 87500, currency: 'USD', createdAt: new Date('2023-08-20') },
  { id: 'c3', name: 'Startup Ventures LLC', code: 'SV003', email: 'finance@startupventures.io', creditLimit: 100000, paymentTerms: 'Net 15', status: 'active', balance: 42000, currency: 'USD', createdAt: new Date('2024-01-10') },
  { id: 'c4', name: 'Regional Medical Group', code: 'RMG004', email: 'ap@regionalmedical.org', creditLimit: 750000, paymentTerms: 'Net 60', status: 'active', balance: 215000, currency: 'USD', createdAt: new Date('2023-04-25') },
  { id: 'c5', name: 'Education First', code: 'EF005', email: 'accounting@educationfirst.edu', creditLimit: 150000, paymentTerms: 'Net 30', status: 'active', balance: 68000, currency: 'USD', createdAt: new Date('2023-11-05') },
]

// Chart of Accounts
export const accounts: Account[] = [
  // Assets
  { id: 'a1', number: '1000', name: 'Cash', type: 'asset', category: 'Current Assets', balance: 2450000, currency: 'USD', status: 'active' },
  { id: 'a2', number: '1100', name: 'Accounts Receivable', type: 'asset', category: 'Current Assets', balance: 537500, currency: 'USD', status: 'active' },
  { id: 'a3', number: '1200', name: 'Inventory', type: 'asset', category: 'Current Assets', balance: 185000, currency: 'USD', status: 'active' },
  { id: 'a4', number: '1500', name: 'Fixed Assets', type: 'asset', category: 'Fixed Assets', balance: 1250000, currency: 'USD', status: 'active' },
  // Liabilities
  { id: 'a5', number: '2000', name: 'Accounts Payable', type: 'liability', category: 'Current Liabilities', balance: 161800, currency: 'USD', status: 'active' },
  { id: 'a6', number: '2100', name: 'Accrued Expenses', type: 'liability', category: 'Current Liabilities', balance: 85000, currency: 'USD', status: 'active' },
  { id: 'a7', number: '2500', name: 'Long-term Debt', type: 'liability', category: 'Long-term Liabilities', balance: 500000, currency: 'USD', status: 'active' },
  // Equity
  { id: 'a8', number: '3000', name: 'Common Stock', type: 'equity', category: 'Equity', balance: 1000000, currency: 'USD', status: 'active' },
  { id: 'a9', number: '3100', name: 'Retained Earnings', type: 'equity', category: 'Equity', balance: 2175700, currency: 'USD', status: 'active' },
  // Revenue
  { id: 'a10', number: '4000', name: 'Sales Revenue', type: 'revenue', category: 'Revenue', balance: 4850000, currency: 'USD', status: 'active' },
  { id: 'a11', number: '4100', name: 'Service Revenue', type: 'revenue', category: 'Revenue', balance: 1250000, currency: 'USD', status: 'active' },
  // Expenses
  { id: 'a12', number: '5000', name: 'Cost of Goods Sold', type: 'expense', category: 'Cost of Sales', balance: 2425000, currency: 'USD', status: 'active' },
  { id: 'a13', number: '6000', name: 'Salaries & Wages', type: 'expense', category: 'Operating Expenses', balance: 1850000, currency: 'USD', status: 'active' },
  { id: 'a14', number: '6100', name: 'Rent Expense', type: 'expense', category: 'Operating Expenses', balance: 240000, currency: 'USD', status: 'active' },
  { id: 'a15', number: '6200', name: 'Utilities', type: 'expense', category: 'Operating Expenses', balance: 36000, currency: 'USD', status: 'active' },
]

// Transactions
export const transactions: Transaction[] = [
  { id: 't1', date: new Date('2024-03-15'), type: 'credit', amount: 45000, currency: 'USD', accountId: 'a1', accountName: 'Cash', description: 'Customer Payment - Enterprise Corp', reference: 'PMT-2024-001', status: 'posted', entityId: 'e1', createdBy: 'u1', createdAt: new Date('2024-03-15') },
  { id: 't2', date: new Date('2024-03-14'), type: 'debit', amount: 12500, currency: 'USD', accountId: 'a5', accountName: 'Accounts Payable', description: 'Vendor Payment - Office Supply Co', reference: 'PMT-2024-002', status: 'posted', entityId: 'e1', createdBy: 'u1', createdAt: new Date('2024-03-14') },
  { id: 't3', date: new Date('2024-03-13'), type: 'credit', amount: 87500, currency: 'USD', accountId: 'a10', accountName: 'Sales Revenue', description: 'Invoice Payment - Global Industries', reference: 'INV-2024-089', status: 'posted', entityId: 'e1', createdBy: 'u1', createdAt: new Date('2024-03-13') },
  { id: 't4', date: new Date('2024-03-12'), type: 'debit', amount: 4200, currency: 'USD', accountId: 'a15', accountName: 'Utilities', description: 'Monthly Utility Bill', reference: 'BILL-2024-045', status: 'posted', entityId: 'e1', createdBy: 'u1', createdAt: new Date('2024-03-12') },
  { id: 't5', date: new Date('2024-03-11'), type: 'credit', amount: 125000, currency: 'USD', accountId: 'a1', accountName: 'Cash', description: 'Customer Payment - Regional Medical', reference: 'PMT-2024-003', status: 'posted', entityId: 'e1', createdBy: 'u1', createdAt: new Date('2024-03-11') },
]

// Bills
export const bills: Bill[] = [
  {
    id: 'b1', number: 'BILL-2024-001', vendorId: 'v1', vendorName: 'Office Supply Co', date: new Date('2024-03-01'), dueDate: new Date('2024-03-31'), amount: 2500, currency: 'USD', status: 'pending', description: 'Office supplies for Q1', entityId: 'e1', createdAt: new Date('2024-03-01'),
    lineItems: [{ id: 'bl1', description: 'Paper and printing supplies', accountId: 'a15', accountName: 'Office Supplies', amount: 1500, quantity: 1, unitPrice: 1500 }, { id: 'bl2', description: 'Desk accessories', accountId: 'a15', accountName: 'Office Supplies', amount: 1000, quantity: 1, unitPrice: 1000 }]
  },
  {
    id: 'b2', number: 'BILL-2024-002', vendorId: 'v2', vendorName: 'Tech Solutions Inc', date: new Date('2024-03-05'), dueDate: new Date('2024-04-19'), amount: 15000, currency: 'USD', status: 'approved', description: 'Software licenses renewal', entityId: 'e1', createdAt: new Date('2024-03-05'),
    lineItems: [{ id: 'bl3', description: 'Annual software subscription', accountId: 'a14', accountName: 'Software Expense', amount: 15000, quantity: 1, unitPrice: 15000 }]
  },
  {
    id: 'b3', number: 'BILL-2024-003', vendorId: 'v3', vendorName: 'CloudHost Services', date: new Date('2024-03-10'), dueDate: new Date('2024-03-25'), amount: 4200, currency: 'USD', status: 'paid', description: 'Monthly hosting fees', entityId: 'e1', createdAt: new Date('2024-03-10'),
    lineItems: [{ id: 'bl4', description: 'Cloud hosting - March', accountId: 'a15', accountName: 'Hosting Expense', amount: 4200, quantity: 1, unitPrice: 4200 }]
  },
]

// Invoices
export const invoices: Invoice[] = [
  {
    id: 'i1', number: 'INV-2024-089', customerId: 'c1', customerName: 'Enterprise Corp', date: new Date('2024-03-01'), dueDate: new Date('2024-03-31'), amount: 45000, currency: 'USD', status: 'sent', description: 'Consulting services - February', entityId: 'e1', createdAt: new Date('2024-03-01'),
    lineItems: [{ id: 'il1', description: 'Strategic consulting - 40 hours', accountId: 'a11', accountName: 'Service Revenue', amount: 40000, quantity: 40, unitPrice: 1000 }, { id: 'il2', description: 'Travel expenses', accountId: 'a11', accountName: 'Service Revenue', amount: 5000, quantity: 1, unitPrice: 5000 }]
  },
  {
    id: 'i2', number: 'INV-2024-090', customerId: 'c2', customerName: 'Global Industries', date: new Date('2024-03-05'), dueDate: new Date('2024-04-19'), amount: 87500, currency: 'USD', status: 'overdue', description: 'Product delivery - Order #4521', entityId: 'e1', createdAt: new Date('2024-03-05'),
    lineItems: [{ id: 'il3', description: 'Enterprise software package', accountId: 'a10', accountName: 'Sales Revenue', amount: 75000, quantity: 1, unitPrice: 75000 }, { id: 'il4', description: 'Implementation support', accountId: 'a11', accountName: 'Service Revenue', amount: 12500, quantity: 25, unitPrice: 500 }]
  },
  {
    id: 'i3', number: 'INV-2024-091', customerId: 'c3', customerName: 'Startup Ventures LLC', date: new Date('2024-03-10'), dueDate: new Date('2024-03-25'), amount: 28000, currency: 'USD', status: 'paid', description: 'SaaS subscription - Annual', entityId: 'e1', createdAt: new Date('2024-03-10'),
    lineItems: [{ id: 'il5', description: 'Annual subscription - Pro tier', accountId: 'a10', accountName: 'Sales Revenue', amount: 24000, quantity: 12, unitPrice: 2000 }, { id: 'il6', description: 'Onboarding package', accountId: 'a11', accountName: 'Service Revenue', amount: 4000, quantity: 1, unitPrice: 4000 }]
  },
]

// Journal Entries
export const journalEntries: JournalEntry[] = [
  {
    id: 'je1', number: 'JE-2024-001', date: new Date('2024-03-31'), description: 'Monthly depreciation entry', status: 'posted', entityId: 'e1', createdBy: 'u1', createdAt: new Date('2024-03-31'), postedAt: new Date('2024-03-31'),
    lines: [
      { id: 'jel1', accountId: 'a12', accountNumber: '6300', accountName: 'Depreciation Expense', debit: 12500, credit: 0 },
      { id: 'jel2', accountId: 'a4', accountNumber: '1510', accountName: 'Accumulated Depreciation', debit: 0, credit: 12500 }
    ]
  },
  {
    id: 'je2', number: 'JE-2024-002', date: new Date('2024-03-31'), description: 'Accrued interest expense', status: 'posted', entityId: 'e1', createdBy: 'u1', createdAt: new Date('2024-03-31'), postedAt: new Date('2024-03-31'),
    lines: [
      { id: 'jel3', accountId: 'a15', accountNumber: '6400', accountName: 'Interest Expense', debit: 4167, credit: 0 },
      { id: 'jel4', accountId: 'a6', accountNumber: '2100', accountName: 'Accrued Interest Payable', debit: 0, credit: 4167 }
    ]
  },
]

// Approval Items
export const approvalItems: ApprovalItem[] = [
  {
    id: 'ap1', type: 'bill', documentId: 'b1', documentNumber: 'BILL-2024-001', description: 'Office supplies for Q1 - Office Supply Co', amount: 2500, currency: 'USD', requestedBy: 'John Smith', requestedAt: new Date('2024-03-01'), status: 'pending', currentStep: 1, entityId: 'e1',
    approvers: [{ id: 'apr1', name: 'Sarah Chen', email: 'sarah.chen@acme.com', status: 'pending' }, { id: 'apr2', name: 'Michael Johnson', email: 'michael.j@acme.com', status: 'pending' }]
  },
  {
    id: 'ap2', type: 'bill', documentId: 'b2', documentNumber: 'BILL-2024-002', description: 'Software licenses renewal - Tech Solutions', amount: 15000, currency: 'USD', requestedBy: 'Emily Davis', requestedAt: new Date('2024-03-05'), status: 'pending', currentStep: 1, entityId: 'e1',
    approvers: [{ id: 'apr3', name: 'Sarah Chen', email: 'sarah.chen@acme.com', status: 'pending' }, { id: 'apr4', name: 'CFO Review', email: 'cfo@acme.com', status: 'pending' }]
  },
  {
    id: 'ap3', type: 'journal_entry', documentId: 'je1', documentNumber: 'JE-2024-003', description: 'Year-end adjusting entry - Prepaid expenses', amount: 35000, currency: 'USD', requestedBy: 'Sarah Chen', requestedAt: new Date('2024-03-15'), status: 'pending', currentStep: 2, entityId: 'e1',
    approvers: [{ id: 'apr5', name: 'Michael Johnson', email: 'michael.j@acme.com', status: 'approved', respondedAt: new Date('2024-03-16') }, { id: 'apr6', name: 'CFO Review', email: 'cfo@acme.com', status: 'pending' }]
  },
]

// Dashboard Metrics
export const dashboardMetrics: DashboardMetric[] = [
  { id: 'm1', label: 'Cash Position', value: 2450000, previousValue: 2180000, change: 12.4, changeType: 'positive', format: 'currency', currency: 'USD' },
  { id: 'm2', label: 'Accounts Receivable', value: 537500, previousValue: 485000, change: 10.8, changeType: 'negative', format: 'currency', currency: 'USD' },
  { id: 'm3', label: 'Accounts Payable', value: 161800, previousValue: 195000, change: -17.0, changeType: 'positive', format: 'currency', currency: 'USD' },
  { id: 'm4', label: 'Net Income (YTD)', value: 1825000, previousValue: 1650000, change: 10.6, changeType: 'positive', format: 'currency', currency: 'USD' },
  { id: 'm5', label: 'Operating Margin', value: 24.5, previousValue: 22.8, change: 7.5, changeType: 'positive', format: 'percentage' },
  { id: 'm6', label: 'Current Ratio', value: 2.85, previousValue: 2.65, change: 7.5, changeType: 'positive', format: 'number' },
]

// Bank Accounts
export const bankAccounts: BankAccount[] = [
  { id: 'ba1', name: 'Operating Account', accountNumber: '****4521', bankName: 'First National Bank', type: 'checking', balance: 1850000, currency: 'USD', status: 'active', lastSyncedAt: new Date('2024-03-15T10:30:00'), entityId: 'e1' },
  { id: 'ba2', name: 'Payroll Account', accountNumber: '****7832', bankName: 'First National Bank', type: 'checking', balance: 425000, currency: 'USD', status: 'active', lastSyncedAt: new Date('2024-03-15T10:30:00'), entityId: 'e1' },
  { id: 'ba3', name: 'Savings Reserve', accountNumber: '****9154', bankName: 'Community Credit Union', type: 'savings', balance: 175000, currency: 'USD', status: 'active', lastSyncedAt: new Date('2024-03-14T16:45:00'), entityId: 'e1' },
  { id: 'ba4', name: 'Corporate Card', accountNumber: '****3367', bankName: 'Business Bank', type: 'credit', balance: -12500, currency: 'USD', status: 'active', lastSyncedAt: new Date('2024-03-15T08:00:00'), entityId: 'e1' },
]

// Notifications
export const notifications: Notification[] = [
  { id: 'n1', title: 'Bill Approval Required', message: 'BILL-2024-002 requires your approval', type: 'warning', read: false, createdAt: new Date('2024-03-15T09:00:00'), link: '/accounts-payable/approvals' },
  { id: 'n2', title: 'Invoice Overdue', message: 'INV-2024-090 is 5 days overdue', type: 'error', read: false, createdAt: new Date('2024-03-15T08:00:00'), link: '/accounts-receivable/invoices/i2' },
  { id: 'n3', title: 'Bank Sync Complete', message: 'All bank accounts synced successfully', type: 'success', read: true, createdAt: new Date('2024-03-15T07:30:00'), link: '/cash-management/accounts' },
  { id: 'n4', title: 'Period Close Reminder', message: 'March 2024 period closes in 5 days', type: 'info', read: false, createdAt: new Date('2024-03-15T07:00:00'), link: '/general-ledger/periods' },
]

// Tasks
export const tasks: Task[] = [
  { id: 'task1', title: 'Review Q1 financial statements', priority: 'high', status: 'in_progress', dueDate: new Date('2024-03-20'), createdAt: new Date('2024-03-10') },
  { id: 'task2', title: 'Approve vendor payments batch', priority: 'urgent', status: 'todo', dueDate: new Date('2024-03-16'), createdAt: new Date('2024-03-15') },
  { id: 'task3', title: 'Reconcile bank accounts', priority: 'medium', status: 'todo', dueDate: new Date('2024-03-18'), createdAt: new Date('2024-03-12') },
  { id: 'task4', title: 'Update customer credit limits', priority: 'low', status: 'completed', dueDate: new Date('2024-03-14'), createdAt: new Date('2024-03-08') },
]

// Revenue Chart Data
export const revenueChartData: ChartDataPoint[] = [
  { name: 'Jan', revenue: 485000, expenses: 380000 },
  { name: 'Feb', revenue: 520000, expenses: 395000 },
  { name: 'Mar', revenue: 610000, expenses: 420000 },
  { name: 'Apr', revenue: 580000, expenses: 410000 },
  { name: 'May', revenue: 650000, expenses: 445000 },
  { name: 'Jun', revenue: 720000, expenses: 480000 },
  { name: 'Jul', revenue: 695000, expenses: 465000 },
  { name: 'Aug', revenue: 750000, expenses: 490000 },
  { name: 'Sep', revenue: 810000, expenses: 520000 },
  { name: 'Oct', revenue: 780000, expenses: 505000 },
  { name: 'Nov', revenue: 850000, expenses: 545000 },
  { name: 'Dec', revenue: 920000, expenses: 580000 },
]

// Cash Flow Chart Data
export const cashFlowChartData: ChartDataPoint[] = [
  { name: 'Jan', inflow: 520000, outflow: 410000 },
  { name: 'Feb', inflow: 545000, outflow: 425000 },
  { name: 'Mar', inflow: 635000, outflow: 455000 },
  { name: 'Apr', inflow: 610000, outflow: 440000 },
  { name: 'May', inflow: 680000, outflow: 475000 },
  { name: 'Jun', inflow: 755000, outflow: 510000 },
]

// AP Aging Data
export const apAgingData: ChartDataPoint[] = [
  { name: 'Current', value: 85000 },
  { name: '1-30 Days', value: 42000 },
  { name: '31-60 Days', value: 22800 },
  { name: '61-90 Days', value: 8500 },
  { name: '90+ Days', value: 3500 },
]

// AR Aging Data
export const arAgingData: ChartDataPoint[] = [
  { name: 'Current', value: 285000 },
  { name: '1-30 Days', value: 125000 },
  { name: '31-60 Days', value: 87500 },
  { name: '61-90 Days', value: 28000 },
  { name: '90+ Days', value: 12000 },
]

// Navigation Modules with Mega Menus
export const navModules: NavModule[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/' },
  { id: 'reports', label: 'Reports', icon: 'FileText', href: '/reports' },
  { id: 'company', label: 'Company', icon: 'Building2', href: '/company' },
  {
    id: 'cash-management', label: 'Cash Management', icon: 'Banknote',
    megaMenu: [
      { label: 'Accounts', items: [{ label: 'Bank Accounts', href: '/cash-management/accounts' }, { label: 'Card Feeds', href: '/cash-management/card-feeds' }] },
      { label: 'Activity', items: [{ label: 'Transactions', href: '/cash-management/transactions' }, { label: 'Transfers', href: '/cash-management/transfers' }, { label: 'Reconciliation', href: '/cash-management/reconciliation' }] },
      { label: 'Reports', items: [{ label: 'Cash Position', href: '/cash-management/reports/cash-position' }, { label: 'Bank Activity', href: '/cash-management/reports/bank-activity' }] }
    ]
  },
  {
    id: 'general-ledger', label: 'General Ledger', icon: 'BookOpen',
    megaMenu: [
      { label: 'Transactions', items: [{ label: 'Journal Entries', href: '/general-ledger/journal-entries' }, { label: 'Recurring Journals', href: '/general-ledger/recurring-journals' }, { label: 'Adjustments', href: '/general-ledger/adjustments' }] },
      { label: 'Setup', items: [{ label: 'Chart of Accounts', href: '/general-ledger/chart-of-accounts' }, { label: 'Accounting Periods', href: '/general-ledger/periods' }, { label: 'Allocations', href: '/general-ledger/allocations' }] },
      { label: 'Reports', items: [{ label: 'Trial Balance', href: '/general-ledger/reports/trial-balance' }, { label: 'General Ledger Detail', href: '/general-ledger/reports/gl-detail' }, { label: 'Account Activity', href: '/general-ledger/reports/account-activity' }] }
    ]
  },
  {
    id: 'accounts-payable', label: 'Accounts Payable', icon: 'Receipt',
    megaMenu: [
      { label: 'Operations', items: [{ label: 'Bills', href: '/accounts-payable/bills' }, { label: 'Approvals', href: '/accounts-payable/approvals' }, { label: 'Payments', href: '/accounts-payable/payments' }] },
      { label: 'Master Data', items: [{ label: 'Vendors', href: '/accounts-payable/vendors' }, { label: 'Terms', href: '/accounts-payable/terms' }, { label: 'Categories', href: '/accounts-payable/categories' }] },
      { label: 'Reports', items: [{ label: 'AP Aging', href: '/accounts-payable/reports/aging' }, { label: 'Payment History', href: '/accounts-payable/reports/payment-history' }] }
    ]
  },
  {
    id: 'accounts-receivable', label: 'Accounts Receivable', icon: 'CreditCard',
    megaMenu: [
      { label: 'Operations', items: [{ label: 'Invoices', href: '/accounts-receivable/invoices' }, { label: 'Collections', href: '/accounts-receivable/collections' }, { label: 'Cash Receipts', href: '/accounts-receivable/cash-receipts' }] },
      { label: 'Master Data', items: [{ label: 'Customers', href: '/accounts-receivable/customers' }, { label: 'Credit Terms', href: '/accounts-receivable/credit-terms' }] },
      { label: 'Reports', items: [{ label: 'AR Aging', href: '/accounts-receivable/reports/aging' }, { label: 'Collections Summary', href: '/accounts-receivable/reports/collections-summary' }] }
    ]
  },
  {
    id: 'purchasing', label: 'Purchasing', icon: 'ShoppingCart',
    megaMenu: [
      { label: 'Operations', items: [{ label: 'Purchase Orders', href: '/purchasing/orders' }, { label: 'Requisitions', href: '/purchasing/requisitions' }, { label: 'Receiving', href: '/purchasing/receiving' }] },
      { label: 'Setup', items: [{ label: 'Approval Workflows', href: '/purchasing/workflows' }, { label: 'Spend Categories', href: '/purchasing/categories' }] }
    ]
  },
  {
    id: 'order-management', label: 'Order Management', icon: 'Package',
    megaMenu: [
      { label: 'Orders', items: [{ label: 'Sales Orders', href: '/order-management/sales-orders' }, { label: 'Quotes', href: '/order-management/quotes' }, { label: 'Fulfillment', href: '/order-management/fulfillment' }] },
      { label: 'Setup', items: [{ label: 'Products', href: '/order-management/products' }, { label: 'Price Lists', href: '/order-management/price-lists' }] }
    ]
  },
  {
    id: 'projects', label: 'Projects', icon: 'FolderKanban',
    megaMenu: [
      { label: 'Management', items: [{ label: 'All Projects', href: '/projects' }, { label: 'Time Tracking', href: '/projects/time-tracking' }, { label: 'Expenses', href: '/projects/expenses' }] },
      { label: 'Billing', items: [{ label: 'Project Billing', href: '/projects/billing' }, { label: 'Revenue Recognition', href: '/projects/revenue-recognition' }] }
    ]
  },
  {
    id: 'time-expenses', label: 'Time & Expenses', icon: 'Clock',
    megaMenu: [
      { label: 'Entry', items: [{ label: 'Timesheets', href: '/time-expenses/timesheets' }, { label: 'Expense Reports', href: '/time-expenses/expense-reports' }] },
      { label: 'Management', items: [{ label: 'Approvals', href: '/time-expenses/approvals' }, { label: 'Policies', href: '/time-expenses/policies' }] }
    ]
  },
  {
    id: 'multi-entity', label: 'Multi-Entity', icon: 'Network',
    megaMenu: [
      { label: 'Consolidation', items: [{ label: 'Intercompany', href: '/multi-entity/intercompany' }, { label: 'Eliminations', href: '/multi-entity/eliminations' }, { label: 'Consolidation', href: '/multi-entity/consolidation' }] },
      { label: 'Setup', items: [{ label: 'Entities', href: '/multi-entity/entities' }, { label: 'Mapping', href: '/multi-entity/mapping' }] }
    ]
  },
  {
    id: 'admin', label: 'Admin', icon: 'Settings',
    megaMenu: [
      { label: 'Users & Security', items: [{ label: 'Users', href: '/admin/users' }, { label: 'Roles', href: '/admin/roles' }, { label: 'Permissions', href: '/admin/permissions' }] },
      { label: 'Configuration', items: [{ label: 'Company Settings', href: '/admin/settings' }, { label: 'Integrations', href: '/admin/integrations' }, { label: 'Audit Log', href: '/admin/audit-log' }] }
    ]
  },
]

// Sidebar Items
export const sidebarItems = [
  { id: 'home', label: 'Home', icon: 'Home', href: '/' },
  { id: 'recent', label: 'Recent', icon: 'Clock', href: '/recent' },
  { id: 'favorites', label: 'Favorites', icon: 'Star', href: '/favorites' },
  { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', href: '/tasks', badge: 3 },
  { id: 'approvals', label: 'Approvals', icon: 'UserCheck', href: '/approvals', badge: 5 },
  { id: 'reports', label: 'Reports', icon: 'FileText', href: '/reports' },
  { id: 'settings', label: 'Settings', icon: 'Settings', href: '/settings' },
]

// Command Palette Search Items
export const searchableItems = [
  // Modules
  { type: 'module', label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { type: 'module', label: 'General Ledger', href: '/general-ledger', icon: 'BookOpen' },
  { type: 'module', label: 'Accounts Payable', href: '/accounts-payable', icon: 'Receipt' },
  { type: 'module', label: 'Accounts Receivable', href: '/accounts-receivable', icon: 'CreditCard' },
  { type: 'module', label: 'Cash Management', href: '/cash-management', icon: 'Banknote' },
  // Reports
  { type: 'report', label: 'Trial Balance', href: '/general-ledger/reports/trial-balance', icon: 'FileText' },
  { type: 'report', label: 'AP Aging Report', href: '/accounts-payable/reports/aging', icon: 'FileText' },
  { type: 'report', label: 'AR Aging Report', href: '/accounts-receivable/reports/aging', icon: 'FileText' },
  { type: 'report', label: 'Cash Position', href: '/cash-management/reports/cash-position', icon: 'FileText' },
  { type: 'report', label: 'Income Statement', href: '/reports/income-statement', icon: 'FileText' },
  { type: 'report', label: 'Balance Sheet', href: '/reports/balance-sheet', icon: 'FileText' },
  // Vendors
  ...vendors.map(v => ({ type: 'vendor', label: v.name, href: `/accounts-payable/vendors/${v.id}`, icon: 'Building', meta: v.code })),
  // Customers
  ...customers.map(c => ({ type: 'customer', label: c.name, href: `/accounts-receivable/customers/${c.id}`, icon: 'Users', meta: c.code })),
  // Accounts
  ...accounts.slice(0, 8).map(a => ({ type: 'account', label: `${a.number} - ${a.name}`, href: `/general-ledger/chart-of-accounts/${a.id}`, icon: 'Hash', meta: a.type })),
  // Transactions
  { type: 'transaction', label: 'Create Journal Entry', href: '/general-ledger/journal-entries/new', icon: 'Plus' },
  { type: 'transaction', label: 'Create Bill', href: '/accounts-payable/bills/new', icon: 'Plus' },
  { type: 'transaction', label: 'Create Invoice', href: '/accounts-receivable/invoices/new', icon: 'Plus' },
]
