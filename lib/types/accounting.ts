export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

export interface Account {
  id: string
  number: string
  name: string
  type: AccountType
  category: string
  subCategory?: string
  balance: number
  currency: string
  status: 'active' | 'inactive'
  parentId?: string
  entityId?: string
}

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'transfer'
  | 'fee'
  | 'interest'
  | 'credit'
  | 'debit'
  | 'journal'
  | 'payment'
  | 'receipt'

export interface Transaction {
  id: string
  date: Date
  type: TransactionType
  amount: number
  currency: string
  accountId: string
  accountName: string
  bankAccountId?: string
  bankAccountName?: string
  description: string
  merchant?: string
  reference?: string
  source?: 'bank_feed' | 'manual' | 'import' | 'api' | 'system'
  category?: string
  tags?: string[]
  departmentId?: string
  departmentName?: string
  projectId?: string
  projectName?: string
  locationId?: string
  customerId?: string
  vendorId?: string
  status: 'completed' | 'pending' | 'cleared' | 'failed' | 'posted' | 'draft'
  reconciliationStatus?: 'unmatched' | 'matched' | 'reconciled' | 'exception'
  entityId: string
  entityName?: string
  attachments?: string[]
  matchedTransactionId?: string
  ruleId?: string
  ruleName?: string
  createdBy: string
  createdAt: Date
}

export interface CorporateCardTransaction {
  id: string
  cardId: string
  cardLastFour: string
  cardholderName: string
  merchantName: string
  merchantCategory: string
  transactionDate: Date
  postDate: Date
  amount: number
  currency: string
  status: 'pending' | 'posted' | 'declined' | 'disputed'
  receiptStatus: 'missing' | 'uploaded' | 'matched' | 'not_required'
  receiptUrl?: string
  codingStatus: 'uncoded' | 'suggested' | 'coded' | 'reviewed'
  suggestedCategory?: string
  suggestedAccountId?: string
  suggestedAccountName?: string
  actualCategory?: string
  actualAccountId?: string
  actualAccountName?: string
  departmentId?: string
  departmentName?: string
  projectId?: string
  projectName?: string
  memo?: string
  entityId: string
  createdAt: Date
}

export interface JournalLine {
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

export type JournalEntryLine = JournalLine

export interface JournalEntry {
  id: string
  number: string
  date: Date
  description: string
  status: 'draft' | 'posted' | 'reversed' | 'pending'
  lines: JournalLine[]
  entityId: string
  periodId?: string
  createdBy: string
  createdAt: Date
  postedAt?: Date
  postedBy?: string
  reversedEntryId?: string
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

export interface BankAccount {
  id: string
  name: string
  accountNumber: string
  routingNumber?: string
  bankName: string
  type: 'checking' | 'savings' | 'credit' | 'corporate_card'
  balance: number
  availableBalance?: number
  currency: string
  status: 'active' | 'inactive' | 'frozen'
  lastSyncedAt?: Date
  entityId: string
  entityName?: string
}

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

export interface ReconciliationItem {
  id: string
  date: Date
  description: string
  reference?: string
  bankAmount: number
  bookAmount: number
  difference: number
  status: 'matched' | 'unmatched' | 'adjusted' | 'cleared'
  type: TransactionType
  bankAccountId: string
  transactionId?: string
  departmentId?: string
  projectId?: string
  entityId?: string
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
  unmatchedCount: number
  lastReconciledDate?: Date
  status: 'in_progress' | 'completed' | 'needs_review'
}

export interface ReconciliationData {
  summary: ReconciliationSummary
  items: ReconciliationItem[]
  exceptions: ReconciliationItem[]
}

export interface CashPositionData {
  totalCash: number
  availableCash: number
  pendingInflows: number
  pendingOutflows: number
  projectedBalance: number
  accountBreakdown: {
    accountId: string
    accountName: string
    balance: number
    available: number
  }[]
  dailyForecast: {
    date: string
    opening: number
    inflows: number
    outflows: number
    closing: number
  }[]
}
