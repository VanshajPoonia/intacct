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
  CorporateCardTransaction,
} from './types'

// Entities
export const entities: Entity[] = [
  { id: 'e1', name: 'Acme Corporation', code: 'ACME', type: 'primary', currency: 'USD', status: 'active' },
  { id: 'e2', name: 'Acme West', code: 'ACME-W', type: 'subsidiary', currency: 'USD', status: 'active' },
  { id: 'e3', name: 'Acme Europe', code: 'ACME-EU', type: 'subsidiary', currency: 'EUR', status: 'active' },
  { id: 'e4', name: 'Acme Consolidated', code: 'ACME-CON', type: 'consolidated', currency: 'USD', status: 'active' },
]

// Current User
export const currentUser = {
  id: 'u1',
  name: 'Sarah Chen',
  firstName: 'Sarah',
  lastName: 'Chen',
  email: 'sarah.chen@acme.com',
  avatar: undefined,
  role: 'admin' as const,
  entityIds: ['e1', 'e2', 'e3', 'e4'],
  preferences: {
    theme: 'system' as const,
    defaultEntity: 'e4',
    defaultDateRange: 'this_month' as const,
    sidebarCollapsed: false,
    notifications: {
      email: true,
      push: true,
      approvals: true,
      tasks: true,
    },
  },
}

// Vendors
export const vendors: Vendor[] = [
  { id: 'v1', name: 'Office Supply Co', code: 'OSC001', email: 'ap@officesupply.com', phone: '(555) 123-4567', address: '123 Supply St, Chicago, IL 60601', taxId: '12-3456789', paymentTerms: 'Net 30', status: 'active', balance: 12500, currency: 'USD', createdAt: new Date('2024-01-15'), bankName: 'Chase Bank', bankAccountNumber: '****4567', bankRoutingNumber: '****1234', preferredPaymentMethod: 'ach', remittanceEmail: 'remittance@officesupply.com' },
  { id: 'v2', name: 'Tech Solutions Inc', code: 'TSI002', email: 'billing@techsolutions.com', phone: '(555) 234-5678', address: '456 Tech Blvd, San Francisco, CA 94105', taxId: '23-4567890', paymentTerms: 'Net 45', status: 'active', balance: 87300, currency: 'USD', createdAt: new Date('2024-02-20'), bankName: 'Bank of America', bankAccountNumber: '****8901', bankRoutingNumber: '****5678', preferredPaymentMethod: 'wire', remittanceEmail: 'ap@techsolutions.com' },
  { id: 'v3', name: 'CloudHost Services', code: 'CHS003', email: 'invoices@cloudhost.io', phone: '(555) 345-6789', address: '789 Cloud Ave, Seattle, WA 98101', taxId: '34-5678901', paymentTerms: 'Net 15', status: 'active', balance: 4200, currency: 'USD', createdAt: new Date('2024-03-10'), bankName: 'Wells Fargo', bankAccountNumber: '****2345', bankRoutingNumber: '****9012', preferredPaymentMethod: 'ach', remittanceEmail: 'payments@cloudhost.io' },
  { id: 'v4', name: 'Marketing Agency Plus', code: 'MAP004', email: 'accounts@mapagency.com', phone: '(555) 456-7890', address: '321 Creative Way, New York, NY 10001', taxId: '45-6789012', paymentTerms: 'Net 30', status: 'active', balance: 35000, currency: 'USD', createdAt: new Date('2024-01-25'), bankName: 'Citibank', bankAccountNumber: '****6789', bankRoutingNumber: '****3456', preferredPaymentMethod: 'check' },
  { id: 'v5', name: 'Logistics Partners', code: 'LP005', email: 'ap@logisticspartners.com', phone: '(555) 567-8901', address: '567 Shipping Ln, Dallas, TX 75201', taxId: '56-7890123', paymentTerms: 'Net 60', status: 'active', balance: 22800, currency: 'USD', createdAt: new Date('2024-04-05'), bankName: 'US Bank', bankAccountNumber: '****0123', bankRoutingNumber: '****7890', preferredPaymentMethod: 'ach', remittanceEmail: 'remittance@logisticspartners.com' },
]

// Customers
export const customers: Customer[] = [
  { id: 'c1', name: 'Enterprise Corp', code: 'EC001', email: 'ar@enterprisecorp.com', phone: '(555) 123-4567', address: '100 Enterprise Way, San Francisco, CA 94105', billingAddress: '100 Enterprise Way, Suite 100, San Francisco, CA 94105', creditLimit: 500000, paymentTerms: 'Net 30', status: 'active', balance: 125000, lifetimeRevenue: 2450000, lastPaymentDate: new Date('2024-03-01'), lastPaymentAmount: 45000, currency: 'USD', createdAt: new Date('2023-06-15') },
  { id: 'c2', name: 'Global Industries', code: 'GI002', email: 'payments@globalind.com', phone: '(555) 234-5678', address: '500 Global Plaza, New York, NY 10001', billingAddress: '500 Global Plaza, Floor 25, New York, NY 10001', creditLimit: 250000, paymentTerms: 'Net 45', status: 'active', balance: 87500, lifetimeRevenue: 1250000, lastPaymentDate: new Date('2024-02-15'), lastPaymentAmount: 62500, currency: 'USD', createdAt: new Date('2023-08-20'), collectionNotes: 'Payment typically delayed by 10 days. Contact CFO directly for urgent matters.', collectionPriority: 'medium' },
  { id: 'c3', name: 'Startup Ventures LLC', code: 'SV003', email: 'finance@startupventures.io', phone: '(555) 345-6789', address: '50 Innovation Drive, Austin, TX 78701', creditLimit: 100000, paymentTerms: 'Net 15', status: 'active', balance: 42000, lifetimeRevenue: 320000, lastPaymentDate: new Date('2024-03-10'), lastPaymentAmount: 28000, currency: 'USD', createdAt: new Date('2024-01-10') },
  { id: 'c4', name: 'Regional Medical Group', code: 'RMG004', email: 'ap@regionalmedical.org', phone: '(555) 456-7890', address: '200 Healthcare Blvd, Chicago, IL 60601', billingAddress: 'PO Box 5000, Chicago, IL 60601', creditLimit: 750000, paymentTerms: 'Net 60', status: 'active', balance: 215000, lifetimeRevenue: 3800000, lastPaymentDate: new Date('2024-01-20'), lastPaymentAmount: 150000, currency: 'USD', createdAt: new Date('2023-04-25'), collectionNotes: 'Government-funded entity. Payments processed monthly.', assignedCollector: 'Sarah Chen' },
  { id: 'c5', name: 'Education First', code: 'EF005', email: 'accounting@educationfirst.edu', phone: '(555) 567-8901', address: '1000 University Ave, Boston, MA 02115', creditLimit: 150000, paymentTerms: 'Net 30', status: 'active', balance: 68000, lifetimeRevenue: 580000, lastPaymentDate: new Date('2024-02-28'), lastPaymentAmount: 35000, currency: 'USD', createdAt: new Date('2023-11-05') },
  { id: 'c6', name: 'TechStart Inc', code: 'TS006', email: 'billing@techstart.com', phone: '(555) 678-9012', address: '75 Tech Lane, Seattle, WA 98101', creditLimit: 50000, paymentTerms: 'Net 15', status: 'hold', balance: 45000, lifetimeRevenue: 120000, lastPaymentDate: new Date('2024-01-05'), lastPaymentAmount: 15000, currency: 'USD', createdAt: new Date('2024-02-01'), collectionNotes: 'Account on hold - exceeded credit limit. Multiple overdue invoices.', assignedCollector: 'John Smith', collectionPriority: 'critical' },
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
  { id: 't1', date: new Date('2024-03-15'), type: 'deposit', amount: 45000, currency: 'USD', accountId: 'a1', accountName: 'Cash', bankAccountId: 'ba1', bankAccountName: 'Operating Account', description: 'Customer Payment - Enterprise Corp', merchant: 'Enterprise Corp', reference: 'PMT-2024-001', source: 'bank_feed', category: 'Customer Payment', tags: ['customer', 'enterprise'], departmentId: 'd3', departmentName: 'Sales', status: 'completed', reconciliationStatus: 'reconciled', entityId: 'e1', entityName: 'Acme Corporation', createdBy: 'u1', createdAt: new Date('2024-03-15') },
  { id: 't2', date: new Date('2024-03-14'), type: 'withdrawal', amount: 12500, currency: 'USD', accountId: 'a5', accountName: 'Accounts Payable', bankAccountId: 'ba1', bankAccountName: 'Operating Account', description: 'Vendor Payment - Office Supply Co', merchant: 'Office Supply Co', reference: 'PMT-2024-002', source: 'manual', category: 'Vendor Payment', tags: ['vendor'], departmentId: 'd1', departmentName: 'Operations', status: 'completed', reconciliationStatus: 'matched', entityId: 'e1', entityName: 'Acme Corporation', createdBy: 'u1', createdAt: new Date('2024-03-14') },
  { id: 't3', date: new Date('2024-03-13'), type: 'deposit', amount: 87500, currency: 'USD', accountId: 'a10', accountName: 'Sales Revenue', bankAccountId: 'ba1', bankAccountName: 'Operating Account', description: 'Invoice Payment - Global Industries', merchant: 'Global Industries', reference: 'INV-2024-089', source: 'bank_feed', category: 'Invoice Payment', tags: ['invoice', 'customer'], departmentId: 'd3', departmentName: 'Sales', status: 'completed', reconciliationStatus: 'reconciled', matchedTransactionId: 'inv-089', entityId: 'e1', entityName: 'Acme Corporation', createdBy: 'u1', createdAt: new Date('2024-03-13') },
  { id: 't4', date: new Date('2024-03-12'), type: 'withdrawal', amount: 4200, currency: 'USD', accountId: 'a15', accountName: 'Utilities', bankAccountId: 'ba1', bankAccountName: 'Operating Account', description: 'Monthly Utility Bill', merchant: 'City Utilities', reference: 'BILL-2024-045', source: 'import', category: 'Utilities', status: 'completed', reconciliationStatus: 'unmatched', entityId: 'e1', entityName: 'Acme Corporation', createdBy: 'u1', createdAt: new Date('2024-03-12') },
  { id: 't5', date: new Date('2024-03-11'), type: 'deposit', amount: 125000, currency: 'USD', accountId: 'a1', accountName: 'Cash', bankAccountId: 'ba1', bankAccountName: 'Operating Account', description: 'Customer Payment - Regional Medical', merchant: 'Regional Medical', reference: 'PMT-2024-003', source: 'bank_feed', category: 'Customer Payment', tags: ['customer', 'healthcare'], departmentId: 'd3', departmentName: 'Sales', status: 'completed', reconciliationStatus: 'reconciled', entityId: 'e1', entityName: 'Acme Corporation', createdBy: 'u1', createdAt: new Date('2024-03-11') },
  { id: 't6', date: new Date('2024-03-10'), type: 'transfer', amount: 50000, currency: 'USD', accountId: 'a1', accountName: 'Cash', bankAccountId: 'ba1', bankAccountName: 'Operating Account', description: 'Transfer to Payroll Account', reference: 'TRF-2024-001', source: 'manual', category: 'Internal Transfer', status: 'completed', reconciliationStatus: 'reconciled', entityId: 'e1', entityName: 'Acme Corporation', createdBy: 'u1', createdAt: new Date('2024-03-10') },
  { id: 't7', date: new Date('2024-03-09'), type: 'fee', amount: 150, currency: 'USD', accountId: 'a20', accountName: 'Bank Fees', bankAccountId: 'ba1', bankAccountName: 'Operating Account', description: 'Monthly Account Fee', merchant: 'First National Bank', reference: 'FEE-2024-001', source: 'bank_feed', category: 'Bank Fees', status: 'completed', reconciliationStatus: 'reconciled', ruleId: 'r1', ruleName: 'Bank Fees Rule', entityId: 'e1', entityName: 'Acme Corporation', createdBy: 'u1', createdAt: new Date('2024-03-09') },
  { id: 't8', date: new Date('2024-03-08'), type: 'interest', amount: 245.50, currency: 'USD', accountId: 'a21', accountName: 'Interest Income', bankAccountId: 'ba3', bankAccountName: 'Savings Reserve', description: 'Monthly Interest', reference: 'INT-2024-001', source: 'bank_feed', category: 'Interest', status: 'completed', reconciliationStatus: 'reconciled', entityId: 'e1', entityName: 'Acme Corporation', createdBy: 'u1', createdAt: new Date('2024-03-08') },
  { id: 't9', date: new Date('2024-03-07'), type: 'withdrawal', amount: 8500, currency: 'USD', accountId: 'a5', accountName: 'Accounts Payable', bankAccountId: 'ba5', bankAccountName: 'West Operating', description: 'Rent Payment - West Office', merchant: 'Pacific Properties', reference: 'PMT-2024-004', source: 'bank_feed', category: 'Rent', departmentId: 'd1', departmentName: 'Operations', status: 'pending', reconciliationStatus: 'exception', entityId: 'e2', entityName: 'Acme West', createdBy: 'u2', createdAt: new Date('2024-03-07') },
  { id: 't10', date: new Date('2024-03-06'), type: 'deposit', amount: 32000, currency: 'EUR', accountId: 'a1', accountName: 'Cash', bankAccountId: 'ba6', bankAccountName: 'Europe Account', description: 'EU Customer Payment', merchant: 'Berlin Tech GmbH', reference: 'PMT-2024-EU-001', source: 'bank_feed', category: 'Customer Payment', tags: ['eu', 'customer'], departmentId: 'd3', departmentName: 'Sales', status: 'completed', reconciliationStatus: 'matched', entityId: 'e3', entityName: 'Acme Europe', createdBy: 'u3', createdAt: new Date('2024-03-06') },
]

// Bills
export const bills: Bill[] = [
  {
    id: 'b1', number: 'BILL-2024-001', vendorId: 'v1', vendorName: 'Office Supply Co', date: new Date('2024-03-01'), dueDate: new Date('2024-03-31'), amount: 2500, currency: 'USD', status: 'pending', approvalStatus: 'pending_approval', paymentStatus: 'unpaid', description: 'Office supplies for Q1', entityId: 'e1', departmentId: 'd1', departmentName: 'Operations', terms: 'Net 30', createdAt: new Date('2024-03-01'), submittedAt: new Date('2024-03-01'), submittedBy: 'John Smith',
    lineItems: [{ id: 'bl1', description: 'Paper and printing supplies', accountId: 'a15', accountName: 'Office Supplies', amount: 1500, quantity: 1, unitPrice: 1500, departmentId: 'd1', departmentName: 'Operations' }, { id: 'bl2', description: 'Desk accessories', accountId: 'a15', accountName: 'Office Supplies', amount: 1000, quantity: 1, unitPrice: 1000, departmentId: 'd1', departmentName: 'Operations' }]
  },
  {
    id: 'b2', number: 'BILL-2024-002', vendorId: 'v2', vendorName: 'Tech Solutions Inc', date: new Date('2024-03-05'), dueDate: new Date('2024-04-19'), amount: 15000, currency: 'USD', status: 'approved', approvalStatus: 'approved', paymentStatus: 'unpaid', description: 'Software licenses renewal', entityId: 'e1', departmentId: 'd2', departmentName: 'Engineering', terms: 'Net 45', createdAt: new Date('2024-03-05'), submittedAt: new Date('2024-03-05'), submittedBy: 'Emily Davis', approvedAt: new Date('2024-03-07'), approvedBy: 'Sarah Chen',
    lineItems: [{ id: 'bl3', description: 'Annual software subscription', accountId: 'a14', accountName: 'Software Expense', amount: 15000, quantity: 1, unitPrice: 15000, departmentId: 'd2', departmentName: 'Engineering' }]
  },
  {
    id: 'b3', number: 'BILL-2024-003', vendorId: 'v3', vendorName: 'CloudHost Services', date: new Date('2024-03-10'), dueDate: new Date('2024-03-25'), amount: 4200, currency: 'USD', status: 'paid', approvalStatus: 'approved', paymentStatus: 'paid', description: 'Monthly hosting fees', entityId: 'e1', departmentId: 'd2', departmentName: 'Engineering', terms: 'Net 15', createdAt: new Date('2024-03-10'), submittedAt: new Date('2024-03-10'), submittedBy: 'Michael Johnson', approvedAt: new Date('2024-03-11'), approvedBy: 'Sarah Chen',
    lineItems: [{ id: 'bl4', description: 'Cloud hosting - March', accountId: 'a15', accountName: 'Hosting Expense', amount: 4200, quantity: 1, unitPrice: 4200, departmentId: 'd2', departmentName: 'Engineering' }]
  },
  {
    id: 'b4', number: 'BILL-2024-004', vendorId: 'v1', vendorName: 'Office Supply Co', date: new Date('2024-03-15'), dueDate: new Date('2024-04-14'), amount: 3800, currency: 'USD', status: 'pending', approvalStatus: 'pending_approval', paymentStatus: 'unpaid', description: 'Furniture order', entityId: 'e1', departmentId: 'd3', departmentName: 'HR', terms: 'Net 30', createdAt: new Date('2024-03-15'), submittedAt: new Date('2024-03-15'), submittedBy: 'Lisa Wong',
    lineItems: [{ id: 'bl5', description: 'Office chairs (5)', accountId: 'a3', accountName: 'Furniture & Equipment', amount: 2500, quantity: 5, unitPrice: 500, departmentId: 'd3', departmentName: 'HR' }, { id: 'bl6', description: 'Standing desks (2)', accountId: 'a3', accountName: 'Furniture & Equipment', amount: 1300, quantity: 2, unitPrice: 650, departmentId: 'd3', departmentName: 'HR' }]
  },
  {
    id: 'b5', number: 'BILL-2024-005', vendorId: 'v4', vendorName: 'Marketing Agency', date: new Date('2024-03-18'), dueDate: new Date('2024-04-17'), amount: 25000, currency: 'USD', status: 'draft', approvalStatus: 'not_submitted', paymentStatus: 'unpaid', description: 'Q2 Marketing Campaign', entityId: 'e1', departmentId: 'd4', departmentName: 'Marketing', terms: 'Net 30', createdAt: new Date('2024-03-18'),
    lineItems: [{ id: 'bl7', description: 'Digital advertising', accountId: 'a13', accountName: 'Marketing Expense', amount: 15000, quantity: 1, unitPrice: 15000, departmentId: 'd4', departmentName: 'Marketing' }, { id: 'bl8', description: 'Content creation', accountId: 'a13', accountName: 'Marketing Expense', amount: 10000, quantity: 1, unitPrice: 10000, departmentId: 'd4', departmentName: 'Marketing' }]
  },
  {
    id: 'b6', number: 'BILL-2024-006', vendorId: 'v2', vendorName: 'Tech Solutions Inc', date: new Date('2024-03-20'), dueDate: new Date('2024-04-04'), amount: 8500, currency: 'USD', status: 'pending', approvalStatus: 'rejected', paymentStatus: 'unpaid', description: 'Hardware maintenance', entityId: 'e1', departmentId: 'd2', departmentName: 'Engineering', terms: 'Net 15', createdAt: new Date('2024-03-20'), submittedAt: new Date('2024-03-20'), submittedBy: 'David Kim', rejectedAt: new Date('2024-03-21'), rejectedBy: 'Sarah Chen', rejectionReason: 'Please provide itemized breakdown and attach quote',
    lineItems: [{ id: 'bl9', description: 'Server maintenance', accountId: 'a14', accountName: 'IT Expense', amount: 8500, quantity: 1, unitPrice: 8500, departmentId: 'd2', departmentName: 'Engineering' }]
  },
]

// Invoices
export const invoices: Invoice[] = [
  {
    id: 'i1', number: 'INV-2024-089', customerId: 'c1', customerName: 'Enterprise Corp', date: new Date('2024-03-01'), dueDate: new Date('2024-03-31'), amount: 45000, openBalance: 45000, currency: 'USD', status: 'sent', collectionStatus: 'none', description: 'Consulting services - February', entityId: 'e1', departmentId: 'd1', departmentName: 'Operations', billingAddress: '100 Enterprise Way, Suite 100, San Francisco, CA 94105', createdAt: new Date('2024-03-01'), sentAt: new Date('2024-03-01'),
    lineItems: [{ id: 'il1', description: 'Strategic consulting - 40 hours', accountId: 'a11', accountName: 'Service Revenue', amount: 40000, quantity: 40, unitPrice: 1000, departmentId: 'd1', departmentName: 'Operations' }, { id: 'il2', description: 'Travel expenses', accountId: 'a11', accountName: 'Service Revenue', amount: 5000, quantity: 1, unitPrice: 5000, departmentId: 'd1', departmentName: 'Operations' }]
  },
  {
    id: 'i2', number: 'INV-2024-090', customerId: 'c2', customerName: 'Global Industries', date: new Date('2024-03-05'), dueDate: new Date('2024-02-19'), amount: 87500, openBalance: 87500, currency: 'USD', status: 'overdue', collectionStatus: 'reminder_sent', description: 'Product delivery - Order #4521', entityId: 'e1', departmentId: 'd4', departmentName: 'Marketing', billingAddress: '500 Global Plaza, Floor 25, New York, NY 10001', createdAt: new Date('2024-03-05'), sentAt: new Date('2024-03-05'),
    lineItems: [{ id: 'il3', description: 'Enterprise software package', accountId: 'a10', accountName: 'Sales Revenue', amount: 75000, quantity: 1, unitPrice: 75000, departmentId: 'd4', departmentName: 'Marketing' }, { id: 'il4', description: 'Implementation support', accountId: 'a11', accountName: 'Service Revenue', amount: 12500, quantity: 25, unitPrice: 500, departmentId: 'd2', departmentName: 'Engineering' }]
  },
  {
    id: 'i3', number: 'INV-2024-091', customerId: 'c3', customerName: 'Startup Ventures LLC', date: new Date('2024-03-10'), dueDate: new Date('2024-03-25'), amount: 28000, openBalance: 0, currency: 'USD', status: 'paid', collectionStatus: 'none', description: 'SaaS subscription - Annual', entityId: 'e1', departmentId: 'd2', departmentName: 'Engineering', createdAt: new Date('2024-03-10'), sentAt: new Date('2024-03-10'), paidAt: new Date('2024-03-20'),
    lineItems: [{ id: 'il5', description: 'Annual subscription - Pro tier', accountId: 'a10', accountName: 'Sales Revenue', amount: 24000, quantity: 12, unitPrice: 2000, departmentId: 'd2', departmentName: 'Engineering', projectId: 'p1', projectName: 'SaaS Platform' }, { id: 'il6', description: 'Onboarding package', accountId: 'a11', accountName: 'Service Revenue', amount: 4000, quantity: 1, unitPrice: 4000, departmentId: 'd2', departmentName: 'Engineering' }]
  },
  {
    id: 'i4', number: 'INV-2024-092', customerId: 'c4', customerName: 'Regional Medical Group', date: new Date('2024-02-15'), dueDate: new Date('2024-04-15'), amount: 125000, openBalance: 125000, currency: 'USD', status: 'sent', collectionStatus: 'none', description: 'Healthcare IT implementation', entityId: 'e1', departmentId: 'd2', departmentName: 'Engineering', billingAddress: 'PO Box 5000, Chicago, IL 60601', createdAt: new Date('2024-02-15'), sentAt: new Date('2024-02-15'),
    lineItems: [{ id: 'il7', description: 'System implementation', accountId: 'a11', accountName: 'Service Revenue', amount: 100000, quantity: 200, unitPrice: 500, departmentId: 'd2', departmentName: 'Engineering' }, { id: 'il8', description: 'Training sessions', accountId: 'a11', accountName: 'Service Revenue', amount: 25000, quantity: 50, unitPrice: 500, departmentId: 'd3', departmentName: 'HR' }]
  },
  {
    id: 'i5', number: 'INV-2024-093', customerId: 'c6', customerName: 'TechStart Inc', date: new Date('2024-01-15'), dueDate: new Date('2024-01-30'), amount: 25000, openBalance: 25000, currency: 'USD', status: 'overdue', collectionStatus: 'escalated', description: 'Software licenses', entityId: 'e1', departmentId: 'd4', departmentName: 'Marketing', createdAt: new Date('2024-01-15'), sentAt: new Date('2024-01-15'),
    lineItems: [{ id: 'il9', description: 'Enterprise license pack', accountId: 'a10', accountName: 'Sales Revenue', amount: 25000, quantity: 25, unitPrice: 1000, departmentId: 'd4', departmentName: 'Marketing' }]
  },
  {
    id: 'i6', number: 'INV-2024-094', customerId: 'c6', customerName: 'TechStart Inc', date: new Date('2024-02-20'), dueDate: new Date('2024-03-05'), amount: 20000, openBalance: 20000, currency: 'USD', status: 'overdue', collectionStatus: 'in_collections', description: 'Additional services', entityId: 'e1', departmentId: 'd2', departmentName: 'Engineering', createdAt: new Date('2024-02-20'), sentAt: new Date('2024-02-20'),
    lineItems: [{ id: 'il10', description: 'Custom development', accountId: 'a11', accountName: 'Service Revenue', amount: 20000, quantity: 40, unitPrice: 500, departmentId: 'd2', departmentName: 'Engineering' }]
  },
  {
    id: 'i7', number: 'INV-2024-095', customerId: 'c1', customerName: 'Enterprise Corp', date: new Date('2024-03-15'), dueDate: new Date('2024-04-14'), amount: 35000, openBalance: 15000, currency: 'USD', status: 'partial', collectionStatus: 'none', description: 'Consulting services - March', entityId: 'e1', departmentId: 'd1', departmentName: 'Operations', billingAddress: '100 Enterprise Way, Suite 100, San Francisco, CA 94105', createdAt: new Date('2024-03-15'), sentAt: new Date('2024-03-15'),
    lineItems: [{ id: 'il11', description: 'Strategic consulting - 30 hours', accountId: 'a11', accountName: 'Service Revenue', amount: 30000, quantity: 30, unitPrice: 1000, departmentId: 'd1', departmentName: 'Operations' }, { id: 'il12', description: 'Report preparation', accountId: 'a11', accountName: 'Service Revenue', amount: 5000, quantity: 1, unitPrice: 5000, departmentId: 'd1', departmentName: 'Operations' }]
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
  { id: 'ba1', name: 'Operating Account', accountNumber: '****4521', bankName: 'First National Bank', type: 'checking', balance: 1850000, availableBalance: 1820000, currency: 'USD', status: 'active', lastSyncedAt: new Date('2024-03-15T10:30:00'), entityId: 'e1', entityName: 'Acme Corporation' },
  { id: 'ba2', name: 'Payroll Account', accountNumber: '****7832', bankName: 'First National Bank', type: 'checking', balance: 425000, availableBalance: 425000, currency: 'USD', status: 'active', lastSyncedAt: new Date('2024-03-15T10:30:00'), entityId: 'e1', entityName: 'Acme Corporation' },
  { id: 'ba3', name: 'Savings Reserve', accountNumber: '****9154', bankName: 'Community Credit Union', type: 'savings', balance: 175000, availableBalance: 175000, currency: 'USD', status: 'active', lastSyncedAt: new Date('2024-03-14T16:45:00'), entityId: 'e1', entityName: 'Acme Corporation' },
  { id: 'ba4', name: 'Corporate Card', accountNumber: '****3367', bankName: 'Business Bank', type: 'corporate_card', balance: -12500, availableBalance: 37500, currency: 'USD', status: 'active', lastSyncedAt: new Date('2024-03-15T08:00:00'), entityId: 'e1', entityName: 'Acme Corporation' },
  { id: 'ba5', name: 'West Operating', accountNumber: '****6289', bankName: 'Pacific Bank', type: 'checking', balance: 580000, availableBalance: 565000, currency: 'USD', status: 'active', lastSyncedAt: new Date('2024-03-15T09:15:00'), entityId: 'e2', entityName: 'Acme West' },
  { id: 'ba6', name: 'Europe Account', accountNumber: '****1456', bankName: 'Deutsche Bank', type: 'checking', balance: 420000, availableBalance: 420000, currency: 'EUR', status: 'active', lastSyncedAt: new Date('2024-03-15T06:00:00'), entityId: 'e3', entityName: 'Acme Europe' },
  { id: 'ba7', name: 'Travel Card', accountNumber: '****9912', bankName: 'Business Bank', type: 'corporate_card', balance: -4250, availableBalance: 45750, currency: 'USD', status: 'active', lastSyncedAt: new Date('2024-03-15T08:00:00'), entityId: 'e1', entityName: 'Acme Corporation' },
]

// Corporate Card Transactions
export const corporateCardTransactions: CorporateCardTransaction[] = [
  { id: 'cct1', cardId: 'ba4', cardLastFour: '3367', cardholderName: 'Sarah Chen', merchantName: 'Amazon Web Services', merchantCategory: 'Cloud Services', transactionDate: new Date('2024-03-14'), postDate: new Date('2024-03-15'), amount: 2450.00, currency: 'USD', status: 'posted', receiptStatus: 'uploaded', codingStatus: 'coded', suggestedCategory: 'Software & Cloud', suggestedAccountId: 'a21', suggestedAccountName: 'Software Subscriptions', actualCategory: 'Software & Cloud', actualAccountId: 'a21', actualAccountName: 'Software Subscriptions', departmentId: 'd2', departmentName: 'Engineering', entityId: 'e1', createdAt: new Date('2024-03-14') },
  { id: 'cct2', cardId: 'ba4', cardLastFour: '3367', cardholderName: 'Sarah Chen', merchantName: 'Hilton Hotels', merchantCategory: 'Travel - Lodging', transactionDate: new Date('2024-03-13'), postDate: new Date('2024-03-14'), amount: 589.00, currency: 'USD', status: 'posted', receiptStatus: 'missing', codingStatus: 'suggested', suggestedCategory: 'Travel & Entertainment', suggestedAccountId: 'a22', suggestedAccountName: 'Travel Expenses', entityId: 'e1', createdAt: new Date('2024-03-13') },
  { id: 'cct3', cardId: 'ba4', cardLastFour: '3367', cardholderName: 'John Smith', merchantName: 'United Airlines', merchantCategory: 'Travel - Air', transactionDate: new Date('2024-03-12'), postDate: new Date('2024-03-13'), amount: 1245.00, currency: 'USD', status: 'posted', receiptStatus: 'uploaded', codingStatus: 'reviewed', suggestedCategory: 'Travel & Entertainment', suggestedAccountId: 'a22', suggestedAccountName: 'Travel Expenses', actualCategory: 'Travel & Entertainment', actualAccountId: 'a22', actualAccountName: 'Travel Expenses', departmentId: 'd4', departmentName: 'Marketing', projectId: 'p1', projectName: 'Q1 Conference', entityId: 'e1', createdAt: new Date('2024-03-12') },
  { id: 'cct4', cardId: 'ba7', cardLastFour: '9912', cardholderName: 'Mike Johnson', merchantName: 'Uber', merchantCategory: 'Travel - Ground', transactionDate: new Date('2024-03-15'), postDate: new Date('2024-03-15'), amount: 45.50, currency: 'USD', status: 'pending', receiptStatus: 'not_required', codingStatus: 'suggested', suggestedCategory: 'Travel & Entertainment', suggestedAccountId: 'a22', suggestedAccountName: 'Travel Expenses', entityId: 'e1', createdAt: new Date('2024-03-15') },
  { id: 'cct5', cardId: 'ba4', cardLastFour: '3367', cardholderName: 'Sarah Chen', merchantName: 'Office Depot', merchantCategory: 'Office Supplies', transactionDate: new Date('2024-03-11'), postDate: new Date('2024-03-12'), amount: 234.50, currency: 'USD', status: 'posted', receiptStatus: 'uploaded', codingStatus: 'coded', suggestedCategory: 'Office Supplies', suggestedAccountId: 'a23', suggestedAccountName: 'Office Supplies', actualCategory: 'Office Supplies', actualAccountId: 'a23', actualAccountName: 'Office Supplies', departmentId: 'd1', departmentName: 'Operations', entityId: 'e1', createdAt: new Date('2024-03-11') },
  { id: 'cct6', cardId: 'ba7', cardLastFour: '9912', cardholderName: 'Lisa Wang', merchantName: 'Marriott', merchantCategory: 'Travel - Lodging', transactionDate: new Date('2024-03-10'), postDate: new Date('2024-03-11'), amount: 425.00, currency: 'USD', status: 'posted', receiptStatus: 'missing', codingStatus: 'uncoded', suggestedCategory: 'Travel & Entertainment', suggestedAccountId: 'a22', suggestedAccountName: 'Travel Expenses', entityId: 'e1', createdAt: new Date('2024-03-10') },
  { id: 'cct7', cardId: 'ba4', cardLastFour: '3367', cardholderName: 'John Smith', merchantName: 'Starbucks', merchantCategory: 'Meals & Entertainment', transactionDate: new Date('2024-03-15'), postDate: new Date('2024-03-15'), amount: 24.50, currency: 'USD', status: 'pending', receiptStatus: 'not_required', codingStatus: 'suggested', suggestedCategory: 'Meals & Entertainment', suggestedAccountId: 'a24', suggestedAccountName: 'Meals & Entertainment', entityId: 'e1', createdAt: new Date('2024-03-15') },
  { id: 'cct8', cardId: 'ba4', cardLastFour: '3367', cardholderName: 'Sarah Chen', merchantName: 'GitHub', merchantCategory: 'Software', transactionDate: new Date('2024-03-01'), postDate: new Date('2024-03-02'), amount: 441.00, currency: 'USD', status: 'posted', receiptStatus: 'matched', codingStatus: 'reviewed', suggestedCategory: 'Software & Cloud', suggestedAccountId: 'a21', suggestedAccountName: 'Software Subscriptions', actualCategory: 'Software & Cloud', actualAccountId: 'a21', actualAccountName: 'Software Subscriptions', departmentId: 'd2', departmentName: 'Engineering', entityId: 'e1', createdAt: new Date('2024-03-01') },
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
      { label: 'Accounts', items: [{ label: 'Bank Accounts', href: '/cash-management/accounts' }, { label: 'Corporate Cards', href: '/cash-management/card-feed' }] },
      { label: 'Activity', items: [{ label: 'Transactions', href: '/cash-management/transactions' }, { label: 'Transfers', href: '/cash-management/transfers' }, { label: 'Reconciliation', href: '/cash-management/reconciliation' }] },
      { label: 'Reports', items: [{ label: 'Cash Position', href: '/cash-management/reports/cash-position' }, { label: 'Bank Activity', href: '/cash-management/reports/bank-activity' }] }
    ]
  },
  {
    id: 'general-ledger', label: 'General Ledger', icon: 'BookOpen',
    megaMenu: [
      { label: 'Transactions', items: [{ label: 'Journal Entries', href: '/general-ledger/journal-entries' }, { label: 'Recurring Journals', href: '/general-ledger/recurring-journals' }, { label: 'Adjustments', href: '/general-ledger/adjustments' }] },
      { label: 'Setup', items: [{ label: 'Chart of Accounts', href: '/general-ledger/chart-of-accounts' }, { label: 'Accounting Periods', href: '/general-ledger/accounting-periods' }, { label: 'Allocations', href: '/general-ledger/allocations' }] },
      { label: 'Reports', items: [{ label: 'Trial Balance', href: '/general-ledger/reports/trial-balance' }, { label: 'General Ledger Detail', href: '/general-ledger/reports/gl-detail' }, { label: 'Account Activity', href: '/general-ledger/reports/account-activity' }, { label: 'Audit Trail', href: '/general-ledger/audit-trail' }] }
    ]
  },
  {
    id: 'accounts-payable', label: 'Accounts Payable', icon: 'Receipt',
    megaMenu: [
      { label: 'Operations', items: [{ label: 'Bills', href: '/accounts-payable/bills' }, { label: 'Approvals', href: '/accounts-payable/approvals' }, { label: 'Payments', href: '/accounts-payable/payments' }] },
      { label: 'Master Data', items: [{ label: 'Vendors', href: '/accounts-payable/vendors' }, { label: 'Terms', href: '/accounts-payable/terms' }, { label: 'Categories', href: '/accounts-payable/categories' }] },
      { label: 'Reports', items: [{ label: 'AP Aging', href: '/accounts-payable/aging' }, { label: 'Payment History', href: '/accounts-payable/reports/payment-history' }] }
    ]
  },
  {
    id: 'accounts-receivable', label: 'Accounts Receivable', icon: 'CreditCard',
    megaMenu: [
      { label: 'Operations', items: [{ label: 'Invoices', href: '/accounts-receivable/invoices' }, { label: 'Collections', href: '/accounts-receivable/collections' }, { label: 'Cash Receipts', href: '/accounts-receivable/receipts' }] },
      { label: 'Master Data', items: [{ label: 'Customers', href: '/accounts-receivable/customers' }, { label: 'Credit Terms', href: '/accounts-receivable/credit-terms' }] },
      { label: 'Reports', items: [{ label: 'AR Aging', href: '/accounts-receivable/aging' }, { label: 'Collections Summary', href: '/accounts-receivable/collections' }] }
    ]
  },
  {
    id: 'purchasing', label: 'Purchasing', icon: 'ShoppingCart',
    href: '/purchasing',
    megaMenu: [
      { label: 'Operations', items: [{ label: 'All Purchase Orders', href: '/purchasing' }, { label: 'New Purchase Order', href: '/purchasing/orders/new' }, { label: 'Requisitions', href: '/purchasing/requisitions' }, { label: 'Receiving', href: '/purchasing/receiving' }] },
      { label: 'Setup', items: [{ label: 'Approval Workflows', href: '/purchasing/workflows' }, { label: 'Spend Categories', href: '/purchasing/categories' }] }
    ]
  },
  {
    id: 'order-management', label: 'Order Management', icon: 'Package',
    href: '/order-management',
    megaMenu: [
      { label: 'Orders', items: [{ label: 'All Sales Orders', href: '/order-management' }, { label: 'New Sales Order', href: '/order-management/orders/new' }, { label: 'Quotes', href: '/order-management/quotes' }, { label: 'Fulfillment', href: '/order-management/fulfillment' }] },
      { label: 'Setup', items: [{ label: 'Products', href: '/order-management/products' }, { label: 'Price Lists', href: '/order-management/price-lists' }] }
    ]
  },
  {
    id: 'projects', label: 'Projects', icon: 'FolderKanban',
    href: '/projects',
    megaMenu: [
      { label: 'Management', items: [{ label: 'All Projects', href: '/projects' }, { label: 'New Project', href: '/projects/new' }] },
      { label: 'Time & Billing', items: [{ label: 'Time Tracking', href: '/time-expenses' }, { label: 'Project Expenses', href: '/time-expenses' }, { label: 'Project Billing', href: '/projects/billing' }] }
    ]
  },
  {
    id: 'time-expenses', label: 'Time & Expenses', icon: 'Clock',
    href: '/time-expenses',
    megaMenu: [
      { label: 'Entry', items: [{ label: 'Time & Expenses', href: '/time-expenses' }, { label: 'Log Time', href: '/time-expenses/time/new' }, { label: 'New Expense', href: '/time-expenses/expenses/new' }] },
      { label: 'Management', items: [{ label: 'Approvals', href: '/time-expenses/approvals' }, { label: 'Policies', href: '/time-expenses/policies' }] }
    ]
  },
  {
    id: 'multi-entity', label: 'Multi-Entity', icon: 'Network',
    href: '/multi-entity',
    megaMenu: [
      { label: 'Overview', items: [{ label: 'Multi-Entity Hub', href: '/multi-entity' }, { label: 'Intercompany', href: '/multi-entity/intercompany' }, { label: 'Eliminations', href: '/multi-entity/eliminations' }, { label: 'Consolidation', href: '/multi-entity/consolidation' }] },
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
  { id: 'recent', label: 'Recent', icon: 'Clock', href: '/activity' },
  { id: 'favorites', label: 'Favorites', icon: 'Star', href: '/favorites' },
  { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', href: '/tasks', badge: 3 },
  { id: 'approvals', label: 'Approvals', icon: 'UserCheck', href: '/approvals', badge: 5 },
  { id: 'notifications', label: 'Notifications', icon: 'Bell', href: '/notifications', badge: 4 },
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
  { type: 'module', label: 'Purchasing', href: '/purchasing', icon: 'ShoppingCart' },
  { type: 'module', label: 'Order Management', href: '/order-management', icon: 'Package' },
  { type: 'module', label: 'Projects', href: '/projects', icon: 'FolderKanban' },
  { type: 'module', label: 'Time & Expenses', href: '/time-expenses', icon: 'Clock' },
  { type: 'module', label: 'Multi-Entity', href: '/multi-entity', icon: 'Network' },
  // GL Sub-modules
  { type: 'module', label: 'Journal Entries', href: '/general-ledger/journal-entries', icon: 'FileText' },
  { type: 'module', label: 'Recurring Journals', href: '/general-ledger/recurring-journals', icon: 'RefreshCcw' },
  { type: 'module', label: 'Chart of Accounts', href: '/general-ledger/chart-of-accounts', icon: 'List' },
  { type: 'module', label: 'Accounting Periods', href: '/general-ledger/accounting-periods', icon: 'Calendar' },
  { type: 'module', label: 'Allocations', href: '/general-ledger/allocations', icon: 'GitBranch' },
  { type: 'module', label: 'Audit Trail', href: '/general-ledger/audit-trail', icon: 'History' },
  { type: 'module', label: 'Trial Balance', href: '/general-ledger/reports/trial-balance', icon: 'FileSpreadsheet' },
  // Workflow
  { type: 'module', label: 'Tasks', href: '/tasks', icon: 'CheckSquare' },
  { type: 'module', label: 'Approvals', href: '/approvals', icon: 'UserCheck' },
  { type: 'module', label: 'Notifications', href: '/notifications', icon: 'Bell' },
  { type: 'module', label: 'Activity Timeline', href: '/activity', icon: 'Activity' },
  { type: 'module', label: 'Settings', href: '/settings', icon: 'Settings' },
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
  { type: 'transaction', label: 'Create Purchase Order', href: '/purchasing/orders/new', icon: 'Plus' },
  { type: 'transaction', label: 'Create Sales Order', href: '/order-management/orders/new', icon: 'Plus' },
  { type: 'transaction', label: 'Log Time', href: '/time-expenses/time/new', icon: 'Plus' },
  { type: 'transaction', label: 'New Expense', href: '/time-expenses/expenses/new', icon: 'Plus' },
]

// Saved Views
export const savedViews = [
  { id: 'sv1', name: 'Overdue Bills', module: 'accounts-payable', filters: { status: ['overdue'], entityId: 'e1' }, isDefault: false, createdBy: 'u1', createdAt: new Date('2024-01-15') },
  { id: 'sv2', name: 'High Priority Approvals', module: 'approvals', filters: { priority: ['high'] }, isDefault: true, createdBy: 'u1', createdAt: new Date('2024-02-01') },
  { id: 'sv3', name: 'Open Invoices > $50k', module: 'accounts-receivable', filters: { status: ['sent', 'overdue'], minAmount: 50000 }, isDefault: false, createdBy: 'u1', createdAt: new Date('2024-02-15') },
  { id: 'sv4', name: 'Q1 Journal Entries', module: 'general-ledger', filters: { dateRange: 'this_quarter' }, isDefault: false, createdBy: 'u1', createdAt: new Date('2024-03-01') },
]
