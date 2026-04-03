import {
  customFieldDefinitions,
  developerApps,
  deliveryTargets,
  eventMonitoringRecords,
  exportJobs,
  exportSchedules,
  integrationDependencies,
  integrationSyncRuns,
  notificationPolicies,
  ruleDefinitions,
  ruleDeployments,
  ruleSimulationResults,
  shareLinks,
  webhookEndpoints,
  apiRequestLogs,
} from '@/lib/mock-data/platform'

export const customFieldStore = customFieldDefinitions.map(field => ({
  ...field,
  options: field.options ? [...field.options] : undefined,
}))

export const notificationPolicyStore = notificationPolicies.map(policy => ({
  ...policy,
  roleIds: policy.roleIds ? [...policy.roleIds] : undefined,
}))

export const integrationSyncRunStore = integrationSyncRuns.map(run => ({ ...run }))
export const integrationDependencyStore = integrationDependencies.map(dependency => ({ ...dependency }))
export const developerAppStore = developerApps.map(app => ({
  ...app,
  scopes: [...app.scopes],
}))
export const webhookEndpointStore = webhookEndpoints.map(endpoint => ({ ...endpoint }))
export const apiRequestLogStore = apiRequestLogs.map(log => ({ ...log }))
export const ruleDefinitionStore = ruleDefinitions.map(rule => ({ ...rule }))
export const ruleSimulationStore = ruleSimulationResults.map(result => ({ ...result }))
export const ruleDeploymentStore = ruleDeployments.map(deployment => ({ ...deployment }))
export const deliveryTargetStore = deliveryTargets.map(target => ({ ...target }))
export const exportJobStore = exportJobs.map(job => ({ ...job }))
export const exportScheduleStore = exportSchedules.map(schedule => ({ ...schedule }))
export const shareLinkStore = shareLinks.map(link => ({ ...link }))
export const eventMonitoringRecordStore = eventMonitoringRecords.map(record => ({ ...record }))
