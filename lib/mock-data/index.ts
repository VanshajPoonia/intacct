export * from './identity'
export * from './organization'
export * from './accounting'
export * from './payables'
export * from './receivables'
export * from './workflow'
export * from './work-queue'
export * from './reporting'
export * from './shell'
export * from './planning'
export * from './fixed-assets'
export * from './contracts-revenue'
export * from './platform'

// Transitional compatibility exports for the pre-service shell/navigation UI.
export { navModules, searchableItems, sidebarItems } from '../mock-data'
export {
  currentUser as legacyCurrentUser,
  notifications as legacyNotifications,
  savedViews as legacySavedViews,
} from '../mock-data'
