import type { PaginatedResponse } from '../types'
import type { AuditLogEntry } from './legacy'

export type PaginatedAuditLogs = PaginatedResponse<AuditLogEntry>

export type {
  AuditLogEntry,
  CorporateCardSummary,
  RecentReport,
  SavedReport,
  ShortTermObligations,
} from './legacy'

export type {
  BudgetActualData,
  CashFlowData,
  Department,
  TrialBalanceRow,
} from '../types'

export {
  getCurrentUser,
  getPreferences,
  getRoleHomeConfig,
  getRolePermissions,
  getUserRole,
  login,
  logout,
  resetPreferences,
  updatePreferences,
  validateSession,
} from './identity'

export {
  getChartOfAccounts,
  getEntities,
  getJournalEntries,
  getTransactions,
} from './master-data'

export { getBills } from './payables'
export { getInvoices } from './receivables'

export {
  getBalanceSheet,
  getBalanceSheetData,
  getBudgetVsActual,
  getCashFlow,
  getCashFlowData,
  getConsolidatedFinancials,
  getDashboardMetrics,
  getIncomeStatementData,
  getPnL,
  getTrialBalance,
} from './reporting'

export {
  getCloseStatus,
  getCloseTasks,
  getReconciliationData,
} from './close'

export {
  applyBulkWorkQueueAction,
  applyWorkQueueAction,
  getWorkQueueCurrentUserPermissions,
  getWorkQueueFilterOptions,
  getWorkQueueItemDetail,
  getWorkQueueItems,
  getWorkQueueSavedViews,
  getWorkQueueSections,
  getWorkQueueSummary,
  saveWorkQueueView,
} from './work-queue'

export {
  createSavedView,
  deleteSavedView,
  getSavedViewById,
  getSavedViews,
  saveView,
  searchAll,
  setDefaultView,
  updateSavedView,
} from './search-views'

export {
  getActiveModuleForPath,
  getAvailableRoles,
  getBreadcrumbs,
  getCommandPaletteConfig,
  getDatePresetOptions,
  getShellContext,
  getSidebarNav,
  getStubPage,
  getTopModuleNav,
} from './shell'

export {
  getAccountantHomepageData,
  getAdminHomepageData,
  getAPSpecialistHomepageData,
  getARSpecialistHomepageData,
  getCFOHomepageData,
  getControllerHomepageData,
  getRoleHomepageData,
} from './homepages'

export {
  getChartAccountWorkspaceDetail,
  getChartOfAccountsWorkspace,
  getGeneralLedgerOverview,
  getJournalEntriesWorkspace,
  getJournalEntryWorkspaceDetail,
} from './general-ledger-workspace'

export {
  getAccountsPayableOverview,
  getBillWorkspaceDetail,
  getBillsWorkspace,
  getPaymentWorkspaceDetail,
  getPaymentsWorkspace,
  getVendorWorkspaceDetail,
  getVendorsWorkspace,
} from './accounts-payable-workspace'

export {
  getAccountsReceivableOverview,
  getCustomerWorkspaceDetail,
  getCustomersWorkspace,
  getInvoiceWorkspaceDetail,
  getInvoicesWorkspace,
  getReceiptWorkspaceDetail,
  getReceiptsWorkspace,
} from './accounts-receivable-workspace'

export {
  applyAdminWorkspaceAction,
  getAdminWorkspaceDefaultSection,
  getAdminWorkspaceDetail,
  getAdminWorkspaceList,
  getAdminWorkspaceOverview,
  getAdminWorkspaceTabs,
} from './admin-workspace'

export {
  applyIntegrationsWorkspaceAction,
  getIntegrationsWorkspaceDefaultSection,
  getIntegrationsWorkspaceDetail,
  getIntegrationsWorkspaceList,
  getIntegrationsWorkspaceOverview,
  getIntegrationsWorkspaceTabs,
} from './integrations-workspace'

export {
  applyApiDeveloperWorkspaceAction,
  getApiDeveloperWorkspaceDefaultSection,
  getApiDeveloperWorkspaceDetail,
  getApiDeveloperWorkspaceList,
  getApiDeveloperWorkspaceOverview,
  getApiDeveloperWorkspaceTabs,
} from './api-developer-workspace'

export {
  applyRuleEngineWorkspaceAction,
  getRuleEngineWorkspaceDefaultSection,
  getRuleEngineWorkspaceDetail,
  getRuleEngineWorkspaceList,
  getRuleEngineWorkspaceOverview,
  getRuleEngineWorkspaceTabs,
} from './rule-engine-workspace'

export {
  applyExportsSharingWorkspaceAction,
  getExportsSharingWorkspaceDefaultSection,
  getExportsSharingWorkspaceDetail,
  getExportsSharingWorkspaceList,
  getExportsSharingWorkspaceOverview,
  getExportsSharingWorkspaceTabs,
} from './exports-sharing-workspace'

export {
  applyEventMonitoringWorkspaceAction,
  getEventMonitoringWorkspaceDefaultSection,
  getEventMonitoringWorkspaceDetail,
  getEventMonitoringWorkspaceList,
  getEventMonitoringWorkspaceOverview,
  getEventMonitoringWorkspaceTabs,
} from './event-monitoring-workspace'

export {
  getAIWorkspaceOverview,
  getDashboardsOverview,
  getWorkflowsAutomationOverview,
} from './platform-overviews'

export {
  getBankAccountWorkspaceDetail,
  getCashAccountsWorkspace,
  getCashManagementOverview,
  getCashTransactionWorkspaceDetail,
  getCashTransactionsWorkspace,
  getReconciliationWorkspace,
  getReconciliationWorkspaceDetail,
} from './cash-management-workspace'

export {
  getBudgetSubmissionsWorkspace,
  getBudgetSubmissionDetail,
  getBudgetVarianceDetail,
  getBudgetVarianceWorkspace,
  getBudgetVersionDetail,
  getBudgetVersionsWorkspace,
  getBudgetsForecastingDefaultSection,
  getBudgetsForecastingOverview,
  getBudgetsForecastingTabs,
  getForecastScenarioDetail,
  getForecastScenariosWorkspace,
  saveBudgetVersion,
  saveForecastScenario,
  updateBudgetSubmission,
} from './budgets-forecasting-workspace'

export {
  disposeFixedAsset,
  getAssetLifecycleWorkspace,
  getAssetLifecycleEventDetail,
  getDepreciationRunDetail,
  getDepreciationWorkspace,
  getFixedAssetDetail,
  getFixedAssetsDefaultSection,
  getFixedAssetsOverview,
  getFixedAssetsTabs,
  getFixedAssetsWorkspace,
  runDepreciationPreview,
  saveFixedAsset,
} from './fixed-assets-workspace'

export {
  getContractDetail,
  getContractsRevenueDefaultSection,
  getContractsRevenueOverview,
  getContractsRevenueTabs,
  getContractsWorkspace,
  getRevenueRecognitionWorkspace,
  getRevenueRecognitionDetail,
  getRevenueScheduleDetail,
  getRevenueSchedulesWorkspace,
  postRevenueRecognition,
  releaseRevenueRecognitionHold,
  saveContract,
} from './contracts-revenue-workspace'

export {
  departments,
  employees,
  locations,
  projects,
  adjustReconciliationItem,
  activateAllocation,
  applyReceipt,
  approveBill,
  approveExpenseEntry,
  approveItem,
  approvePurchaseOrder,
  approveTimeEntry,
  assignTask,
  cancelTransfer,
  clearReconciliationItem,
  closePeriod,
  completePayment,
  completeTransfer,
  confirmSalesOrder,
  createAllocation,
  createApiKey,
  createBill,
  createCustomer,
  createDimension,
  createExpenseEntry,
  createInvoice,
  createPayment,
  createPurchaseOrder,
  createReceipt,
  createRecurringJournal,
  createSalesOrder,
  createTask,
  createTimeEntry,
  createTransfer,
  createUser,
  createVendor,
  createWorkflow,
  deactivateAllocation,
  deactivateUser,
  deleteAccount,
  deleteReport,
  disconnectIntegration,
  getAccounts,
  getAccountingPeriods,
  getActivityTimeline,
  getAIInsights,
  getAllocationById,
  getAllocations,
  getAccountById,
  getApiKeys,
  getApprovalItems,
  getAPAging,
  getARAging,
  getAuditLogs,
  getBankAccountById,
  getBankAccounts,
  getCashPosition,
  getCashWeekly,
  getBillById,
  getContractExpensesByRep,
  getCorporateCardSummary,
  getCorporateCardTransactions,
  getCustomerById,
  getCustomers,
  getDepartmentExpenses,
  getDepartments,
  getDimensions,
  getEmployees,
  getEntityPerformance,
  getExpenseEntries,
  getIntegrations,
  getInvoiceById,
  getJournalEntryById,
  getLocations,
  getNotifications,
  getPaymentById,
  getPayments,
  getPinnedReports,
  getProjectDetailById,
  getProjectDetails,
  getProjects,
  getPurchaseOrderById,
  getPurchaseOrders,
  getReceiptById,
  getReceipts,
  getRecentReports,
  getRecurringJournalById,
  getRecurringJournals,
  getReconciliationItems,
  getReconciliationSummary,
  getRevenueByChannel,
  getRevenueTrend,
  getSalesOrderById,
  getSalesOrders,
  getSavedReports,
  getShortTermObligations,
  getTasks,
  getTimeEntries,
  getTransactionById,
  getTransfers,
  getUnreadCount,
  getUsers,
  getVendorById,
  getVendors,
  getWorkflows,
  invoiceSalesOrder,
  lockPeriod,
  markAllNotificationsRead,
  markNotificationRead,
  matchReconciliationItem,
  pauseRecurringJournal,
  postJournalEntry,
  processPayment,
  processTransfer,
  receivePurchaseOrder,
  reconnectIntegration,
  rejectBill,
  rejectItem,
  reimburseExpenseEntry,
  reopenPeriod,
  resumeRecurringJournal,
  reverseJournalEntry,
  revokeApiKey,
  runAllocation,
  runRecurringJournal,
  saveAccount,
  saveJournalEntry,
  saveReport,
  sendInvoice,
  sendPurchaseOrder,
  shipSalesOrder,
  submitBillForApproval,
  submitExpenseEntry,
  submitTimeEntry,
  syncIntegration,
  toggleReportFavorite,
  toggleReportPin,
  unlockPeriod,
  updateBill,
  updateCustomer,
  updateDimension,
  updateInvoice,
  updateProjectStatus,
  updateTaskStatus,
  updateUser,
  updateVendor,
  updateWorkflowStatus,
  voidBill,
  voidInvoice,
  voidPayment,
  voidReceipt,
} from './legacy'
