import type {
  ApiRequestLog,
  CustomFieldDefinition,
  DeliveryTarget,
  DeveloperApp,
  EventMonitoringRecord,
  ExportJob,
  ExportSchedule,
  IntegrationDependency,
  IntegrationSyncRun,
  NotificationPolicy,
  RuleDefinition,
  RuleDeployment,
  RuleSimulationResult,
  ShareLink,
  WebhookEndpoint,
} from "@/lib/types"
import { getRuntimeDataset } from "./runtime-data"

export let customFieldStore: CustomFieldDefinition[] = []
export let notificationPolicyStore: NotificationPolicy[] = []
export let integrationSyncRunStore: IntegrationSyncRun[] = []
export let integrationDependencyStore: IntegrationDependency[] = []
export let developerAppStore: DeveloperApp[] = []
export let webhookEndpointStore: WebhookEndpoint[] = []
export let apiRequestLogStore: ApiRequestLog[] = []
export let ruleDefinitionStore: RuleDefinition[] = []
export let ruleSimulationStore: RuleSimulationResult[] = []
export let ruleDeploymentStore: RuleDeployment[] = []
export let deliveryTargetStore: DeliveryTarget[] = []
export let exportJobStore: ExportJob[] = []
export let exportScheduleStore: ExportSchedule[] = []
export let shareLinkStore: ShareLink[] = []
export let eventMonitoringRecordStore: EventMonitoringRecord[] = []

let platformStorePromise: Promise<void> | null = null

type PlatformDataset = {
  customFieldDefinitions: CustomFieldDefinition[]
  notificationPolicies: NotificationPolicy[]
  integrationSyncRuns: IntegrationSyncRun[]
  integrationDependencies: IntegrationDependency[]
  developerApps: DeveloperApp[]
  webhookEndpoints: WebhookEndpoint[]
  apiRequestLogs: ApiRequestLog[]
  ruleDefinitions: RuleDefinition[]
  ruleSimulationResults: RuleSimulationResult[]
  ruleDeployments: RuleDeployment[]
  deliveryTargets: DeliveryTarget[]
  exportJobs: ExportJob[]
  exportSchedules: ExportSchedule[]
  shareLinks: ShareLink[]
  eventMonitoringRecords: EventMonitoringRecord[]
}

export async function ensurePlatformStore() {
  if (platformStorePromise) {
    return platformStorePromise
  }

  platformStorePromise = (async () => {
    const platform = await getRuntimeDataset<PlatformDataset>("platform")

    customFieldStore = platform.customFieldDefinitions.map(field => ({
      ...field,
      options: field.options ? [...field.options] : undefined,
    }))

    notificationPolicyStore = platform.notificationPolicies.map(policy => ({
      ...policy,
      roleIds: policy.roleIds ? [...policy.roleIds] : undefined,
    }))

    integrationSyncRunStore = platform.integrationSyncRuns.map(run => ({ ...run }))
    integrationDependencyStore = platform.integrationDependencies.map(dependency => ({ ...dependency }))
    developerAppStore = platform.developerApps.map(app => ({
      ...app,
      scopes: [...app.scopes],
    }))
    webhookEndpointStore = platform.webhookEndpoints.map(endpoint => ({ ...endpoint }))
    apiRequestLogStore = platform.apiRequestLogs.map(log => ({ ...log }))
    ruleDefinitionStore = platform.ruleDefinitions.map(rule => ({ ...rule }))
    ruleSimulationStore = platform.ruleSimulationResults.map(result => ({ ...result }))
    ruleDeploymentStore = platform.ruleDeployments.map(deployment => ({ ...deployment }))
    deliveryTargetStore = platform.deliveryTargets.map(target => ({ ...target }))
    exportJobStore = platform.exportJobs.map(job => ({ ...job }))
    exportScheduleStore = platform.exportSchedules.map(schedule => ({ ...schedule }))
    shareLinkStore = platform.shareLinks.map(link => ({ ...link }))
    eventMonitoringRecordStore = platform.eventMonitoringRecords.map(record => ({ ...record }))
  })()

  try {
    await platformStorePromise
  } finally {
    platformStorePromise = null
  }
}
