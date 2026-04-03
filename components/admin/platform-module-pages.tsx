"use client"

import type {
  AdminWorkspaceSectionId,
  DeveloperPlatformSectionId,
  ExportsSharingSectionId,
  IntegrationsWorkspaceSectionId,
  RuleEngineSectionId,
} from "@/lib/types"
import {
  applyAdminWorkspaceAction,
  applyApiDeveloperWorkspaceAction,
  applyEventMonitoringWorkspaceAction,
  applyExportsSharingWorkspaceAction,
  applyIntegrationsWorkspaceAction,
  applyRuleEngineWorkspaceAction,
  getAccountsReceivableOverview,
  getAdminWorkspaceDefaultSection,
  getAdminWorkspaceDetail,
  getAdminWorkspaceList,
  getAdminWorkspaceOverview,
  getAdminWorkspaceTabs,
  getAIWorkspaceOverview,
  getApiDeveloperWorkspaceDefaultSection,
  getApiDeveloperWorkspaceDetail,
  getApiDeveloperWorkspaceList,
  getApiDeveloperWorkspaceOverview,
  getApiDeveloperWorkspaceTabs,
  getDashboardsOverview,
  getEventMonitoringWorkspaceDefaultSection,
  getEventMonitoringWorkspaceDetail,
  getEventMonitoringWorkspaceList,
  getEventMonitoringWorkspaceOverview,
  getEventMonitoringWorkspaceTabs,
  getExportsSharingWorkspaceDefaultSection,
  getExportsSharingWorkspaceDetail,
  getExportsSharingWorkspaceList,
  getExportsSharingWorkspaceOverview,
  getExportsSharingWorkspaceTabs,
  getIntegrationsWorkspaceDefaultSection,
  getIntegrationsWorkspaceDetail,
  getIntegrationsWorkspaceList,
  getIntegrationsWorkspaceOverview,
  getIntegrationsWorkspaceTabs,
  getRuleEngineWorkspaceDefaultSection,
  getRuleEngineWorkspaceDetail,
  getRuleEngineWorkspaceList,
  getRuleEngineWorkspaceOverview,
  getRuleEngineWorkspaceTabs,
  getWorkflowsAutomationOverview,
} from "@/lib/services"
import { ModuleOverviewPage } from "./module-overview-page"
import { PlatformWorkspace } from "./platform-workspace"

const adminWorkspaceService = {
  getDefaultSection: getAdminWorkspaceDefaultSection,
  getTabs: getAdminWorkspaceTabs,
  getOverview: getAdminWorkspaceOverview,
  getList: getAdminWorkspaceList,
  getDetail: getAdminWorkspaceDetail,
  applyAction: applyAdminWorkspaceAction,
}

const integrationsWorkspaceService = {
  getDefaultSection: getIntegrationsWorkspaceDefaultSection,
  getTabs: getIntegrationsWorkspaceTabs,
  getOverview: getIntegrationsWorkspaceOverview,
  getList: getIntegrationsWorkspaceList,
  getDetail: getIntegrationsWorkspaceDetail,
  applyAction: applyIntegrationsWorkspaceAction,
}

const apiDeveloperWorkspaceService = {
  getDefaultSection: getApiDeveloperWorkspaceDefaultSection,
  getTabs: getApiDeveloperWorkspaceTabs,
  getOverview: getApiDeveloperWorkspaceOverview,
  getList: getApiDeveloperWorkspaceList,
  getDetail: getApiDeveloperWorkspaceDetail,
  applyAction: applyApiDeveloperWorkspaceAction,
}

const ruleEngineWorkspaceService = {
  getDefaultSection: getRuleEngineWorkspaceDefaultSection,
  getTabs: getRuleEngineWorkspaceTabs,
  getOverview: getRuleEngineWorkspaceOverview,
  getList: getRuleEngineWorkspaceList,
  getDetail: getRuleEngineWorkspaceDetail,
  applyAction: applyRuleEngineWorkspaceAction,
}

const exportsSharingWorkspaceService = {
  getDefaultSection: getExportsSharingWorkspaceDefaultSection,
  getTabs: getExportsSharingWorkspaceTabs,
  getOverview: getExportsSharingWorkspaceOverview,
  getList: getExportsSharingWorkspaceList,
  getDetail: getExportsSharingWorkspaceDetail,
  applyAction: applyExportsSharingWorkspaceAction,
}

const eventMonitoringWorkspaceService = {
  getDefaultSection: getEventMonitoringWorkspaceDefaultSection,
  getTabs: getEventMonitoringWorkspaceTabs,
  getOverview: getEventMonitoringWorkspaceOverview,
  getList: getEventMonitoringWorkspaceList,
  getDetail: getEventMonitoringWorkspaceDetail,
  applyAction: applyEventMonitoringWorkspaceAction,
}

export function AdminWorkspacePage({ sectionId }: { sectionId?: AdminWorkspaceSectionId }) {
  return (
    <PlatformWorkspace
      moduleKey="admin"
      lockedSectionId={sectionId}
      service={adminWorkspaceService}
    />
  )
}

export function IntegrationsWorkspacePage({ sectionId }: { sectionId?: IntegrationsWorkspaceSectionId }) {
  return (
    <PlatformWorkspace
      moduleKey="integrations"
      lockedSectionId={sectionId}
      service={integrationsWorkspaceService}
    />
  )
}

export function ApiDeveloperWorkspacePage({ sectionId }: { sectionId?: DeveloperPlatformSectionId }) {
  return (
    <PlatformWorkspace
      moduleKey="api-developer"
      lockedSectionId={sectionId}
      service={apiDeveloperWorkspaceService}
    />
  )
}

export function RuleEngineWorkspacePage({ sectionId }: { sectionId?: RuleEngineSectionId }) {
  return (
    <PlatformWorkspace
      moduleKey="rule-engine"
      lockedSectionId={sectionId}
      service={ruleEngineWorkspaceService}
    />
  )
}

export function ExportsSharingWorkspacePage({ sectionId }: { sectionId?: ExportsSharingSectionId }) {
  return (
    <PlatformWorkspace
      moduleKey="exports-sharing"
      lockedSectionId={sectionId}
      service={exportsSharingWorkspaceService}
    />
  )
}

export function EventMonitoringWorkspacePage() {
  return (
    <PlatformWorkspace
      moduleKey="event-monitoring"
      service={eventMonitoringWorkspaceService}
    />
  )
}

export function AccountsReceivableOverviewPage() {
  return <ModuleOverviewPage loadOverview={getAccountsReceivableOverview} />
}

export function DashboardsOverviewPage() {
  return <ModuleOverviewPage loadOverview={getDashboardsOverview} />
}

export function AIOverviewPage() {
  return <ModuleOverviewPage loadOverview={getAIWorkspaceOverview} />
}

export function WorkflowsAutomationOverviewPage() {
  return <ModuleOverviewPage loadOverview={getWorkflowsAutomationOverview} />
}
