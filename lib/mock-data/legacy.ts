import type {
  Entity,
  Vendor,
  Customer,
  Account,
  Transaction,
  Bill,
  BillLineItem,
  Invoice,
  InvoiceLineItem,
  JournalEntry,
  ApprovalItem,
  BankAccount,
} from '@/lib/types'

// ============ ENTITIES ============
export const entities: Entity[] = [
  { id: 'e1', name: 'Acme Corporation', code: 'ACME', type: 'primary', currency: 'USD', status: 'active' },
  { id: 'e2', name: 'Acme West', code: 'ACME-W', type: 'subsidiary', currency: 'USD', status: 'active' },
  { id: 'e3', name: 'Acme Europe', code: 'ACME-EU', type: 'subsidiary', currency: 'EUR', status: 'active' },
  { id: 'e4', name: 'Consolidated', code: 'CONS', type: 'consolidated', currency: 'USD', status: 'active' },
]

// ============ VENDORS ============
export const vendors: Vendor[] = [
  { id: 'v1', name: 'Acme Supplies Inc.', code: 'ACME-SUP', email: 'ap@acmesupplies.com', phone: '555-0101', paymentTerms: 'Net 30', status: 'active', balance: 15420, currency: 'USD', createdAt: new Date('2023-01-15') },
  { id: 'v2', name: 'TechPro Services', code: 'TECHPRO', email: 'billing@techpro.com', phone: '555-0102', paymentTerms: 'Net 45', status: 'active', balance: 8750, currency: 'USD', createdAt: new Date('2023-02-20') },
  { id: 'v3', name: 'Global Partners LLC', code: 'GLOBAL', email: 'accounts@globalpartners.com', paymentTerms: 'Net 30', status: 'active', balance: 45000, currency: 'USD', createdAt: new Date('2023-03-10') },
  { id: 'v4', name: 'Office Depot', code: 'OFDEPOT', email: 'business@officedepot.com', phone: '555-0104', paymentTerms: 'Net 15', status: 'active', balance: 3200, currency: 'USD', createdAt: new Date('2023-04-05') },
  { id: 'v5', name: 'Cloud Services Corp', code: 'CLOUD', email: 'invoices@cloudservices.com', paymentTerms: 'Net 30', status: 'active', balance: 12800, currency: 'USD', createdAt: new Date('2023-05-12') },
  { id: 'v6', name: 'Premium Logistics', code: 'PREMLOG', email: 'ar@premiumlogistics.com', phone: '555-0106', paymentTerms: 'Net 45', status: 'inactive', balance: 0, currency: 'USD', createdAt: new Date('2023-06-01') },
]

// ============ CUSTOMERS ============
export const customers: Customer[] = [
  { id: 'c1', name: 'Globex Corporation', code: 'GLOBEX', email: 'ap@globex.com', phone: '555-1001', creditLimit: 100000, paymentTerms: 'Net 30', status: 'active', balance: 42500, currency: 'USD', createdAt: new Date('2023-01-10') },
  { id: 'c2', name: 'Initech Industries', code: 'INITECH', email: 'payments@initech.com', phone: '555-1002', creditLimit: 75000, paymentTerms: 'Net 45', status: 'active', balance: 28750, currency: 'USD', createdAt: new Date('2023-02-15') },
  { id: 'c3', name: 'Umbrella Corp', code: 'UMBRELLA', email: 'finance@umbrella.com', creditLimit: 150000, paymentTerms: 'Net 30', status: 'active', balance: 67200, currency: 'USD', createdAt: new Date('2023-03-20') },
  { id: 'c4', name: 'Wayne Enterprises', code: 'WAYNE', email: 'ap@wayne.com', phone: '555-1004', creditLimit: 200000, paymentTerms: 'Net 60', status: 'active', balance: 89500, currency: 'USD', createdAt: new Date('2023-04-25') },
  { id: 'c5', name: 'Stark Industries', code: 'STARK', email: 'billing@stark.com', phone: '555-1005', creditLimit: 250000, paymentTerms: 'Net 30', status: 'active', balance: 125000, currency: 'USD', createdAt: new Date('2023-05-30') },
  { id: 'c6', name: 'Oscorp Industries', code: 'OSCORP', email: 'accounts@oscorp.com', creditLimit: 50000, paymentTerms: 'Net 30', status: 'pending', balance: 0, currency: 'USD', createdAt: new Date('2024-03-01') },
]

// ============ ACCOUNTS (CHART OF ACCOUNTS) ============
export const accounts: Account[] = [
  // Assets
  { id: 'a1', number: '1000', name: 'Cash', type: 'asset', category: 'Current Assets', balance: 485000, currency: 'USD', status: 'active' },
  { id: 'a2', number: '1100', name: 'Accounts Receivable', type: 'asset', category: 'Current Assets', balance: 325000, currency: 'USD', status: 'active' },
  { id: 'a3', number: '1200', name: 'Inventory', type: 'asset', category: 'Current Assets', balance: 180000, currency: 'USD', status: 'active' },
  { id: 'a4', number: '1300', name: 'Prepaid Expenses', type: 'asset', category: 'Current Assets', balance: 45000, currency: 'USD', status: 'active' },
  { id: 'a5', number: '1500', name: 'Fixed Assets', type: 'asset', category: 'Non-Current Assets', balance: 750000, currency: 'USD', status: 'active' },
  { id: 'a6', number: '1510', name: 'Accumulated Depreciation', type: 'asset', category: 'Non-Current Assets', balance: -125000, currency: 'USD', status: 'active' },
  // Liabilities
  { id: 'a7', number: '2000', name: 'Accounts Payable', type: 'liability', category: 'Current Liabilities', balance: 185000, currency: 'USD', status: 'active' },
  { id: 'a8', number: '2100', name: 'Accrued Expenses', type: 'liability', category: 'Current Liabilities', balance: 62000, currency: 'USD', status: 'active' },
  { id: 'a9', number: '2200', name: 'Deferred Revenue', type: 'liability', category: 'Current Liabilities', balance: 95000, currency: 'USD', status: 'active' },
  { id: 'a10', number: '2500', name: 'Long-term Debt', type: 'liability', category: 'Non-Current Liabilities', balance: 450000, currency: 'USD', status: 'active' },
  // Equity
  { id: 'a11', number: '3000', name: 'Common Stock', type: 'equity', category: 'Stockholders Equity', balance: 500000, currency: 'USD', status: 'active' },
  { id: 'a12', number: '3100', name: 'Retained Earnings', type: 'equity', category: 'Stockholders Equity', balance: 368000, currency: 'USD', status: 'active' },
  // Revenue
  { id: 'a13', number: '4000', name: 'Sales Revenue', type: 'revenue', category: 'Operating Revenue', balance: 2450000, currency: 'USD', status: 'active' },
  { id: 'a14', number: '4100', name: 'Service Revenue', type: 'revenue', category: 'Operating Revenue', balance: 850000, currency: 'USD', status: 'active' },
  { id: 'a15', number: '4200', name: 'Other Income', type: 'revenue', category: 'Non-Operating Revenue', balance: 45000, currency: 'USD', status: 'active' },
  // Expenses
  { id: 'a16', number: '5000', name: 'Cost of Goods Sold', type: 'expense', category: 'Cost of Sales', balance: 1225000, currency: 'USD', status: 'active' },
  { id: 'a17', number: '6000', name: 'Salaries & Wages', type: 'expense', category: 'Operating Expenses', balance: 680000, currency: 'USD', status: 'active' },
  { id: 'a18', number: '6100', name: 'Rent Expense', type: 'expense', category: 'Operating Expenses', balance: 144000, currency: 'USD', status: 'active' },
  { id: 'a19', number: '6200', name: 'Utilities', type: 'expense', category: 'Operating Expenses', balance: 36000, currency: 'USD', status: 'active' },
  { id: 'a20', number: '6300', name: 'Marketing & Advertising', type: 'expense', category: 'Operating Expenses', balance: 125000, currency: 'USD', status: 'active' },
  { id: 'a21', number: '6400', name: 'Professional Services', type: 'expense', category: 'Operating Expenses', balance: 85000, currency: 'USD', status: 'active' },
  { id: 'a22', number: '6500', name: 'Depreciation Expense', type: 'expense', category: 'Operating Expenses', balance: 62500, currency: 'USD', status: 'active' },
  { id: 'a23', number: '7000', name: 'Interest Expense', type: 'expense', category: 'Non-Operating Expenses', balance: 27000, currency: 'USD', status: 'active' },
]

// ============ TRANSACTIONS ============
export const transactions: Transaction[] = [
  { id: 't1', date: new Date('2024-03-15'), type: 'credit', amount: 15000, currency: 'USD', accountId: 'a1', accountName: 'Cash', description: 'Customer payment - Globex Corp', reference: 'REC-2024-001', status: 'posted', entityId: 'e1', createdBy: 'Emily Davis', createdAt: new Date('2024-03-15') },
  { id: 't2', date: new Date('2024-03-14'), type: 'debit', amount: 8500, currency: 'USD', accountId: 'a7', accountName: 'Accounts Payable', description: 'Vendor payment - TechPro Services', reference: 'PAY-2024-045', status: 'posted', entityId: 'e1', createdBy: 'James Wilson', createdAt: new Date('2024-03-14') },
  { id: 't3', date: new Date('2024-03-14'), type: 'credit', amount: 25000, currency: 'USD', accountId: 'a13', accountName: 'Sales Revenue', description: 'Invoice payment - Wayne Enterprises', reference: 'INV-2024-089', status: 'posted', entityId: 'e1', createdBy: 'Lisa Brown', createdAt: new Date('2024-03-14') },
  { id: 't4', date: new Date('2024-03-13'), type: 'debit', amount: 12500, currency: 'USD', accountId: 'a16', accountName: 'Cost of Goods Sold', description: 'Inventory purchase', reference: 'PO-2024-112', status: 'posted', entityId: 'e1', createdBy: 'Sarah Chen', createdAt: new Date('2024-03-13') },
  { id: 't5', date: new Date('2024-03-13'), type: 'debit', amount: 5200, currency: 'USD', accountId: 'a17', accountName: 'Salaries & Wages', description: 'Bi-weekly payroll', reference: 'PR-2024-006', status: 'posted', entityId: 'e1', createdBy: 'Michael Johnson', createdAt: new Date('2024-03-13') },
  { id: 't6', date: new Date('2024-03-12'), type: 'credit', amount: 8750, currency: 'USD', accountId: 'a1', accountName: 'Cash', description: 'Customer payment - Initech', reference: 'REC-2024-002', status: 'posted', entityId: 'e1', createdBy: 'Emily Davis', createdAt: new Date('2024-03-12') },
  { id: 't7', date: new Date('2024-03-12'), type: 'debit', amount: 3500, currency: 'USD', accountId: 'a20', accountName: 'Marketing & Advertising', description: 'Digital marketing campaign', reference: 'MKT-2024-015', status: 'posted', entityId: 'e1', createdBy: 'Sarah Chen', createdAt: new Date('2024-03-12') },
  { id: 't8', date: new Date('2024-03-11'), type: 'debit', amount: 1850, currency: 'USD', accountId: 'a19', accountName: 'Utilities', description: 'Monthly utilities', reference: 'UTIL-MAR-24', status: 'posted', entityId: 'e1', createdBy: 'James Wilson', createdAt: new Date('2024-03-11') },
  { id: 't9', date: new Date('2024-03-10'), type: 'credit', amount: 45000, currency: 'USD', accountId: 'a13', accountName: 'Sales Revenue', description: 'Project milestone - Stark Industries', reference: 'INV-2024-092', status: 'posted', entityId: 'e1', createdBy: 'Lisa Brown', createdAt: new Date('2024-03-10') },
  { id: 't10', date: new Date('2024-03-10'), type: 'debit', amount: 15000, currency: 'USD', accountId: 'a7', accountName: 'Accounts Payable', description: 'Vendor payment - Acme Supplies', reference: 'PAY-2024-044', status: 'pending', entityId: 'e1', createdBy: 'James Wilson', createdAt: new Date('2024-03-10') },
]

// ============ BILLS ============
export const bills: Bill[] = [
  {
    id: 'b1', number: 'BILL-2024-001', vendorId: 'v1', vendorName: 'Acme Supplies Inc.', date: new Date('2024-03-01'), dueDate: new Date('2024-03-31'), amount: 12500, currency: 'USD', status: 'approved', description: 'Office supplies Q1', entityId: 'e1', createdAt: new Date('2024-03-01'),
    lineItems: [
      { id: 'bl1', description: 'Office chairs (10)', accountId: 'a4', accountName: 'Prepaid Expenses', amount: 5000, quantity: 10, unitPrice: 500 },
      { id: 'bl2', description: 'Desks (5)', accountId: 'a4', accountName: 'Prepaid Expenses', amount: 7500, quantity: 5, unitPrice: 1500 },
    ]
  },
  {
    id: 'b2', number: 'BILL-2024-002', vendorId: 'v2', vendorName: 'TechPro Services', date: new Date('2024-03-05'), dueDate: new Date('2024-04-19'), amount: 8750, currency: 'USD', status: 'pending', description: 'IT consulting services', entityId: 'e1', createdAt: new Date('2024-03-05'),
    lineItems: [
      { id: 'bl3', description: 'Network setup', accountId: 'a21', accountName: 'Professional Services', amount: 5000, quantity: 1, unitPrice: 5000 },
      { id: 'bl4', description: 'Security audit', accountId: 'a21', accountName: 'Professional Services', amount: 3750, quantity: 1, unitPrice: 3750 },
    ]
  },
  {
    id: 'b3', number: 'BILL-2024-003', vendorId: 'v3', vendorName: 'Global Partners LLC', date: new Date('2024-03-08'), dueDate: new Date('2024-04-07'), amount: 45000, currency: 'USD', status: 'draft', description: 'International shipping', entityId: 'e1', createdAt: new Date('2024-03-08'),
    lineItems: [
      { id: 'bl5', description: 'Freight charges', accountId: 'a16', accountName: 'Cost of Goods Sold', amount: 35000, quantity: 1, unitPrice: 35000 },
      { id: 'bl6', description: 'Customs fees', accountId: 'a16', accountName: 'Cost of Goods Sold', amount: 10000, quantity: 1, unitPrice: 10000 },
    ]
  },
  {
    id: 'b4', number: 'BILL-2024-004', vendorId: 'v4', vendorName: 'Office Depot', date: new Date('2024-03-10'), dueDate: new Date('2024-03-25'), amount: 3200, currency: 'USD', status: 'paid', description: 'Office supplies', entityId: 'e1', createdAt: new Date('2024-03-10'),
    lineItems: [
      { id: 'bl7', description: 'Printer supplies', accountId: 'a4', accountName: 'Prepaid Expenses', amount: 1800, quantity: 1, unitPrice: 1800 },
      { id: 'bl8', description: 'Paper and stationery', accountId: 'a4', accountName: 'Prepaid Expenses', amount: 1400, quantity: 1, unitPrice: 1400 },
    ]
  },
  {
    id: 'b5', number: 'BILL-2024-005', vendorId: 'v5', vendorName: 'Cloud Services Corp', date: new Date('2024-03-12'), dueDate: new Date('2024-04-11'), amount: 12800, currency: 'USD', status: 'approved', description: 'Cloud hosting - Q1', entityId: 'e1', createdAt: new Date('2024-03-12'),
    lineItems: [
      { id: 'bl9', description: 'Server hosting', accountId: 'a21', accountName: 'Professional Services', amount: 8000, quantity: 1, unitPrice: 8000 },
      { id: 'bl10', description: 'Data storage', accountId: 'a21', accountName: 'Professional Services', amount: 4800, quantity: 1, unitPrice: 4800 },
    ]
  },
]

// ============ INVOICES ============
export const invoices: Invoice[] = [
  {
    id: 'inv1', number: 'INV-2024-001', customerId: 'c1', customerName: 'Globex Corporation', date: new Date('2024-03-01'), dueDate: new Date('2024-03-31'), amount: 42500, amountPaid: 15000, currency: 'USD', status: 'sent', description: 'Consulting services - Phase 1', entityId: 'e1', createdAt: new Date('2024-03-01'),
    lineItems: [
      { id: 'il1', description: 'Strategy consulting (80 hrs)', accountId: 'a14', accountName: 'Service Revenue', amount: 32000, quantity: 80, unitPrice: 400 },
      { id: 'il2', description: 'Implementation support', accountId: 'a14', accountName: 'Service Revenue', amount: 10500, quantity: 1, unitPrice: 10500 },
    ]
  },
  {
    id: 'inv2', number: 'INV-2024-002', customerId: 'c2', customerName: 'Initech Industries', date: new Date('2024-03-05'), dueDate: new Date('2024-04-19'), amount: 28750, amountPaid: 28750, currency: 'USD', status: 'paid', description: 'Software licenses', entityId: 'e1', createdAt: new Date('2024-03-05'),
    lineItems: [
      { id: 'il3', description: 'Enterprise license (25 seats)', accountId: 'a13', accountName: 'Sales Revenue', amount: 25000, quantity: 25, unitPrice: 1000 },
      { id: 'il4', description: 'Support package', accountId: 'a14', accountName: 'Service Revenue', amount: 3750, quantity: 1, unitPrice: 3750 },
    ]
  },
  {
    id: 'inv3', number: 'INV-2024-003', customerId: 'c3', customerName: 'Umbrella Corp', date: new Date('2024-02-15'), dueDate: new Date('2024-03-16'), amount: 67200, amountPaid: 0, currency: 'USD', status: 'overdue', description: 'Product delivery - Batch A', entityId: 'e1', createdAt: new Date('2024-02-15'),
    lineItems: [
      { id: 'il5', description: 'Product units (120)', accountId: 'a13', accountName: 'Sales Revenue', amount: 60000, quantity: 120, unitPrice: 500 },
      { id: 'il6', description: 'Shipping & handling', accountId: 'a13', accountName: 'Sales Revenue', amount: 7200, quantity: 1, unitPrice: 7200 },
    ]
  },
  {
    id: 'inv4', number: 'INV-2024-004', customerId: 'c4', customerName: 'Wayne Enterprises', date: new Date('2024-03-10'), dueDate: new Date('2024-05-09'), amount: 89500, amountPaid: 25000, currency: 'USD', status: 'sent', description: 'Custom development project', entityId: 'e1', createdAt: new Date('2024-03-10'),
    lineItems: [
      { id: 'il7', description: 'Development (200 hrs)', accountId: 'a14', accountName: 'Service Revenue', amount: 70000, quantity: 200, unitPrice: 350 },
      { id: 'il8', description: 'Project management', accountId: 'a14', accountName: 'Service Revenue', amount: 19500, quantity: 1, unitPrice: 19500 },
    ]
  },
  {
    id: 'inv5', number: 'INV-2024-005', customerId: 'c5', customerName: 'Stark Industries', date: new Date('2024-03-12'), dueDate: new Date('2024-04-11'), amount: 125000, amountPaid: 45000, currency: 'USD', status: 'sent', description: 'Annual maintenance contract', entityId: 'e1', createdAt: new Date('2024-03-12'),
    lineItems: [
      { id: 'il9', description: 'Annual maintenance', accountId: 'a14', accountName: 'Service Revenue', amount: 100000, quantity: 1, unitPrice: 100000 },
      { id: 'il10', description: 'Priority support upgrade', accountId: 'a14', accountName: 'Service Revenue', amount: 25000, quantity: 1, unitPrice: 25000 },
    ]
  },
]

// ============ JOURNAL ENTRIES ============
export const journalEntries: JournalEntry[] = [
  {
    id: 'je1', number: 'JE-2024-001', date: new Date('2024-03-01'), description: 'Monthly depreciation', status: 'posted', entityId: 'e1', createdBy: 'Sarah Chen', createdAt: new Date('2024-03-01'), postedAt: new Date('2024-03-01'), postedBy: 'Michael Johnson',
    lines: [
      { id: 'jl1', accountId: 'a22', accountName: 'Depreciation Expense', accountNumber: '6500', debit: 5208.33, credit: 0, description: 'Monthly depreciation', departmentId: 'dept4' },
      { id: 'jl2', accountId: 'a6', accountName: 'Accumulated Depreciation', accountNumber: '1510', debit: 0, credit: 5208.33, description: 'Monthly depreciation', departmentId: 'dept4' },
    ]
  },
  {
    id: 'je2', number: 'JE-2024-002', date: new Date('2024-03-05'), description: 'Prepaid insurance amortization', status: 'posted', entityId: 'e1', createdBy: 'Emily Davis', createdAt: new Date('2024-03-05'), postedAt: new Date('2024-03-05'), postedBy: 'Sarah Chen',
    lines: [
      { id: 'jl3', accountId: 'a21', accountName: 'Professional Services', accountNumber: '6400', debit: 2500, credit: 0, description: 'Insurance expense - March', departmentId: 'dept4' },
      { id: 'jl4', accountId: 'a4', accountName: 'Prepaid Expenses', accountNumber: '1300', debit: 0, credit: 2500, description: 'Insurance expense - March', departmentId: 'dept4' },
    ]
  },
  {
    id: 'je3', number: 'JE-2024-003', date: new Date('2024-03-10'), description: 'Accrued payroll', status: 'pending', entityId: 'e1', createdBy: 'James Wilson', createdAt: new Date('2024-03-10'),
    lines: [
      { id: 'jl5', accountId: 'a17', accountName: 'Salaries & Wages', accountNumber: '6000', debit: 85000, credit: 0, description: 'March payroll accrual', departmentId: 'dept6' },
      { id: 'jl6', accountId: 'a8', accountName: 'Accrued Expenses', accountNumber: '2100', debit: 0, credit: 85000, description: 'March payroll accrual', departmentId: 'dept6' },
    ]
  },
  {
    id: 'je4', number: 'JE-2024-004', date: new Date('2024-03-12'), description: 'Revenue recognition - Project Alpha', status: 'draft', entityId: 'e1', createdBy: 'Lisa Brown', createdAt: new Date('2024-03-12'),
    lines: [
      { id: 'jl7', accountId: 'a9', accountName: 'Deferred Revenue', accountNumber: '2200', debit: 15000, credit: 0, description: 'Recognize deferred revenue', departmentId: 'dept1' },
      { id: 'jl8', accountId: 'a14', accountName: 'Service Revenue', accountNumber: '4100', debit: 0, credit: 15000, description: 'Recognize deferred revenue', departmentId: 'dept1' },
    ]
  },
  {
    id: 'je5', number: 'JE-2024-005', date: new Date('2024-03-14'), description: 'Intercompany transfer', status: 'posted', entityId: 'e1', createdBy: 'Sarah Chen', createdAt: new Date('2024-03-14'), postedAt: new Date('2024-03-14'), postedBy: 'Michael Johnson',
    lines: [
      { id: 'jl9', accountId: 'a1', accountName: 'Cash', accountNumber: '1000', debit: 50000, credit: 0, description: 'Transfer from Acme West', departmentId: 'dept4' },
      { id: 'jl10', accountId: 'a2', accountName: 'Accounts Receivable', accountNumber: '1100', debit: 0, credit: 50000, description: 'Intercompany receivable', departmentId: 'dept4' },
    ]
  },
]

// ============ APPROVAL ITEMS ============
export const approvalItems: ApprovalItem[] = [
  { id: 'ap1', type: 'bill', documentId: 'b2', documentNumber: 'BILL-2024-002', description: 'IT consulting services - TechPro', amount: 8750, currency: 'USD', requestedBy: 'James Wilson', requestedAt: new Date('2024-03-14'), status: 'pending', priority: 'medium', entityId: 'e1' },
  { id: 'ap2', type: 'journal_entry', documentId: 'je3', documentNumber: 'JE-2024-003', description: 'Accrued payroll - March', amount: 85000, currency: 'USD', requestedBy: 'James Wilson', requestedAt: new Date('2024-03-13'), status: 'pending', priority: 'high', entityId: 'e1' },
  { id: 'ap3', type: 'bill', documentId: 'b3', documentNumber: 'BILL-2024-003', description: 'International shipping - Global Partners', amount: 45000, currency: 'USD', requestedBy: 'Sarah Chen', requestedAt: new Date('2024-03-12'), status: 'pending', priority: 'high', entityId: 'e1' },
  { id: 'ap4', type: 'invoice', documentId: 'inv6', documentNumber: 'INV-2024-006', description: 'New customer invoice - Oscorp', amount: 35000, currency: 'USD', requestedBy: 'Lisa Brown', requestedAt: new Date('2024-03-11'), status: 'pending', priority: 'low', entityId: 'e1' },
  { id: 'ap5', type: 'expense', documentId: 'exp1', documentNumber: 'EXP-2024-015', description: 'Travel expenses - Sales conference', amount: 4500, currency: 'USD', requestedBy: 'John Smith', requestedAt: new Date('2024-03-10'), status: 'pending', priority: 'medium', entityId: 'e1' },
]

// ============ BANK ACCOUNTS ============
export const bankAccounts: BankAccount[] = [
  { id: 'ba1', name: 'Operating Account', accountNumber: '****4521', routingNumber: '021000021', bankName: 'Chase Bank', type: 'checking', balance: 485000, currency: 'USD', status: 'active', lastSyncedAt: new Date('2024-03-15T06:00:00'), entityId: 'e1' },
  { id: 'ba2', name: 'Payroll Account', accountNumber: '****7832', routingNumber: '021000021', bankName: 'Chase Bank', type: 'checking', balance: 125000, currency: 'USD', status: 'active', lastSyncedAt: new Date('2024-03-15T06:00:00'), entityId: 'e1' },
  { id: 'ba3', name: 'Investment Account', accountNumber: '****9156', bankName: 'Fidelity', type: 'savings', balance: 750000, currency: 'USD', status: 'active', lastSyncedAt: new Date('2024-03-14T12:00:00'), entityId: 'e1' },
  { id: 'ba4', name: 'Europe Operating', accountNumber: '****3847', bankName: 'HSBC', type: 'checking', balance: 180000, currency: 'EUR', status: 'active', lastSyncedAt: new Date('2024-03-15T06:00:00'), entityId: 'e3' },
]

// ============ CURRENT USER (for auth simulation) ============
export const currentUser = {
  id: 'u1',
  email: 'sarah.chen@company.com',
  firstName: 'Sarah',
  lastName: 'Chen',
  role: 'admin' as const,
  avatar: '/avatars/sarah.jpg',
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

// ============ SAVED VIEWS ============
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

export const savedViews: SavedView[] = [
  { id: 'sv1', name: 'Overdue Bills', module: 'accounts-payable', filters: { status: ['overdue'], entityId: 'e1' }, isDefault: false, createdBy: 'u1', createdAt: new Date('2024-01-15') },
  { id: 'sv2', name: 'High Priority Approvals', module: 'approvals', filters: { priority: ['high'] }, isDefault: true, createdBy: 'u1', createdAt: new Date('2024-02-01') },
  { id: 'sv3', name: 'Open Invoices > $50k', module: 'accounts-receivable', filters: { status: ['sent', 'overdue'], minAmount: 50000 }, isDefault: false, createdBy: 'u1', createdAt: new Date('2024-02-15') },
  { id: 'sv4', name: 'Q1 Journal Entries', module: 'general-ledger', filters: { dateRange: 'this_quarter' }, isDefault: false, createdBy: 'u1', createdAt: new Date('2024-03-01') },
]
