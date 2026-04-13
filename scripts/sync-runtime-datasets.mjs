#!/usr/bin/env node

import { createHash } from "node:crypto"
import process from "node:process"
import { createClient } from "@supabase/supabase-js"

function getEnv(name, fallbacks = []) {
  for (const candidate of [name, ...fallbacks]) {
    const value = process.env[candidate]?.trim()
    if (value) {
      return value
    }
  }
  return undefined
}

function requireEnv(name, fallbacks = []) {
  const value = getEnv(name, fallbacks)
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function serializeForDatabase(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, current) => {
      if (current instanceof Date) {
        return current.toISOString()
      }
      return current
    })
  )
}

function checksum(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SECRET_KEY", ["SUPABASE_SERVICE_ROLE_KEY"]),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

const datasetModules = {
  identity: "./lib/mock-data/identity.ts",
  shell: "./lib/mock-data/shell.ts",
  organization: "./lib/mock-data/organization.ts",
  accounting: "./lib/mock-data/accounting.ts",
  payables: "./lib/mock-data/payables.ts",
  receivables: "./lib/mock-data/receivables.ts",
  workflow: "./lib/mock-data/workflow.ts",
  work_queue: "./lib/mock-data/work-queue.ts",
  reporting: "./lib/mock-data/reporting.ts",
  planning: "./lib/mock-data/planning.ts",
  fixed_assets: "./lib/mock-data/fixed-assets.ts",
  contracts_revenue: "./lib/mock-data/contracts-revenue.ts",
  platform: "./lib/mock-data/platform.ts",
  platform_overviews: "./lib/mock-data/platform-overviews.ts",
}

async function loadModule(path) {
  const loaded = await import(new URL(`../${path}`, import.meta.url))
  return serializeForDatabase(loaded)
}

async function syncDatasets() {
  const rows = []
  const loadedModules = {}

  for (const [domain, modulePath] of Object.entries(datasetModules)) {
    const payload = await loadModule(modulePath)
    loadedModules[domain] = payload
    rows.push({
      domain,
      payload,
      checksum: checksum(payload),
      updated_at: new Date().toISOString(),
    })
  }

  const aggregatePayload = serializeForDatabase({
    entities: loadedModules.organization?.entities ?? [],
    currentUser: loadedModules.identity?.currentUser ?? null,
    vendors: loadedModules.payables?.vendors ?? [],
    customers: loadedModules.receivables?.customers ?? [],
    accounts: loadedModules.accounting?.accounts ?? [],
    transactions: loadedModules.accounting?.transactions ?? [],
    bills: loadedModules.payables?.bills ?? [],
    invoices: loadedModules.receivables?.invoices ?? [],
    journalEntries: loadedModules.accounting?.journalEntries ?? [],
    approvalItems: loadedModules.workflow?.workflowApprovalItems ?? [],
    bankAccounts: loadedModules.accounting?.bankAccounts ?? [],
    corporateCardTransactions: [],
  })

  rows.push({
    domain: "aggregate",
    payload: aggregatePayload,
    checksum: checksum(aggregatePayload),
    updated_at: new Date().toISOString(),
  })

  const { error } = await supabase.from("runtime_datasets").upsert(rows, { onConflict: "domain" })
  if (error) {
    throw error
  }
}

async function syncProfilesAndMemberships() {
  const [{ users, currentUser }, { entities }, workflowModule] = await Promise.all([
    import(new URL("../lib/mock-data/identity.ts", import.meta.url)),
    import(new URL("../lib/mock-data/organization.ts", import.meta.url)),
    import(new URL("../lib/mock-data/workflow.ts", import.meta.url)),
  ])

  const profileRows = users.map(user => ({
    id: user.id,
    organization_id: "org-northstar",
    email: user.email,
    auth_email: user.email,
    username: user.email.split("@")[0],
    first_name: user.firstName,
    last_name: user.lastName,
    display_name: user.displayName ?? `${user.firstName} ${user.lastName}`,
    title: user.title ?? null,
    default_entity_id: user.primaryEntityId ?? user.entityIds?.[0] ?? currentUser.primaryEntityId ?? null,
    role_id: user.role,
    status: user.status,
    is_global_admin: false,
    last_login_at: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
  }))

  const { error: profileError } = await supabase.from("profiles").upsert(profileRows, { onConflict: "id" })
  if (profileError) {
    throw profileError
  }

  const organizationMemberships = users.map(user => ({
    profile_id: user.id,
    organization_id: "org-northstar",
    role_id: user.role,
  }))

  const { error: organizationMembershipError } = await supabase
    .from("organization_memberships")
    .upsert(organizationMemberships, { onConflict: "profile_id,organization_id" })

  if (organizationMembershipError) {
    throw organizationMembershipError
  }

  const entityMemberships = users.flatMap(user =>
    (user.entityIds ?? []).map(entityId => ({
      profile_id: user.id,
      entity_id: entityId,
      organization_id: "org-northstar",
      role_id: user.role,
    }))
  )

  const { error: entityMembershipError } = await supabase
    .from("entity_memberships")
    .upsert(entityMemberships, { onConflict: "profile_id,entity_id" })

  if (entityMembershipError) {
    throw entityMembershipError
  }

  const entityRows = entities.map(entity => ({
    id: entity.id,
    organization_id: "org-northstar",
    name: entity.name,
    code: entity.code,
    currency: entity.currency,
    type: entity.type,
    status: entity.status,
    parent_entity_id: entity.parentEntityId ?? null,
    country: entity.country ?? null,
    timezone: entity.timezone ?? null,
  }))

  const { error: entityError } = await supabase.from("entities").upsert(entityRows, { onConflict: "id" })
  if (entityError) {
    throw entityError
  }

  const preferenceRows = users
    .filter(user => user.preferences)
    .map(user => ({
      profile_id: user.id,
      theme: user.preferences.theme,
      default_role_id: user.preferences.defaultRole ?? user.role,
      default_entity_id: user.preferences.defaultEntity ?? user.primaryEntityId ?? null,
      default_date_range: user.preferences.defaultDateRange,
      sidebar_collapsed: user.preferences.sidebarCollapsed,
      notifications: serializeForDatabase(user.preferences.notifications),
      updated_at: new Date().toISOString(),
    }))

  if (preferenceRows.length) {
    const { error: preferenceError } = await supabase.from("user_preferences").upsert(preferenceRows, { onConflict: "profile_id" })
    if (preferenceError) {
      throw preferenceError
    }
  }

  const savedViews = workflowModule.savedViews ?? []
  if (savedViews.length) {
    const savedViewRows = savedViews.map(view => ({
      id: view.id,
      profile_id: view.createdBy ?? currentUser.id,
      module: view.module,
      name: view.name,
      filters: serializeForDatabase(view.filters ?? {}),
      columns: serializeForDatabase(view.columns ?? null),
      sort_by: view.sortBy ?? null,
      sort_direction: view.sortDirection ?? null,
      is_default: Boolean(view.isDefault),
      role_scope: view.roleScope ?? null,
      created_by: view.createdBy ?? currentUser.id,
      created_at: view.createdAt ? new Date(view.createdAt).toISOString() : new Date().toISOString(),
      updated_at: view.updatedAt ? new Date(view.updatedAt).toISOString() : null,
    }))

    const { error: savedViewError } = await supabase.from("saved_views").upsert(savedViewRows, { onConflict: "id" })
    if (savedViewError) {
      throw savedViewError
    }
  }
}

async function syncNotificationsAndActivity() {
  const workflowModule = await import(new URL("../lib/mock-data/workflow.ts", import.meta.url))

  const dedupedNotifications = Array.from(new Map((workflowModule.notifications ?? []).map(item => [item.id, item])).values())

  if (dedupedNotifications.length) {
    const notificationRows = dedupedNotifications.map(notification => ({
      id: notification.id,
      profile_id: "u1",
      organization_id: "org-northstar",
      title: notification.title,
      message: notification.message,
      type: notification.type,
      category: notification.category ?? null,
      read: Boolean(notification.read),
      link: notification.link ?? null,
      metadata: serializeForDatabase(notification),
      created_at: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
      read_at: notification.read ? new Date().toISOString() : null,
    }))

    const { error: notificationError } = await supabase.from("notifications").upsert(notificationRows, { onConflict: "id" })
    if (notificationError) {
      throw notificationError
    }
  }

  const activityTimeline = workflowModule.activityTimeline ?? []
  if (activityTimeline.length) {
    const activityRows = activityTimeline.map(event => ({
      id: event.id,
      organization_id: "org-northstar",
      profile_id: event.userId ?? "u1",
      type: event.type,
      title: event.title ?? event.action ?? event.type,
      description: event.description ?? null,
      related_type: event.relatedType ?? event.entityType ?? null,
      related_id: event.relatedId ?? event.entityId ?? null,
      metadata: serializeForDatabase(event),
      created_at: event.createdAt ? new Date(event.createdAt).toISOString() : new Date().toISOString(),
    }))

    const { error: activityError } = await supabase.from("activity_events").upsert(activityRows, { onConflict: "id" })
    if (activityError) {
      throw activityError
    }
  }
}

function serializeReportFilters(filters) {
  return serializeForDatabase(filters ?? {})
}

function inferBuiltInReportKey(href) {
  const segments = href.split("/").filter(Boolean)
  return `builtin:${segments[segments.length - 1]}`
}

async function syncReportMetadata() {
  const [{ users, currentUser }, reportCenterModule] = await Promise.all([
    import(new URL("../lib/mock-data/identity.ts", import.meta.url)),
    import(new URL("../lib/mock-data/report-center.ts", import.meta.url)),
  ])

  const profileIdByDisplayName = new Map(
    users.map(user => [user.displayName ?? `${user.firstName} ${user.lastName}`.trim(), user.id])
  )

  const savedReportRows = (reportCenterModule.savedReports ?? []).map(report => {
    const ownerId = profileIdByDisplayName.get(report.createdBy) ?? currentUser.id
    return {
      id: report.id,
      profile_id: ownerId,
      organization_id: "org-northstar",
      name: report.name,
      description: report.description ?? null,
      category: report.category ?? null,
      type: report.type,
      filters: serializeReportFilters(report.filters),
      columns: serializeForDatabase(report.columns ?? []),
      group_by: report.groupBy ?? null,
      sort_by: report.sortBy ?? null,
      created_by: ownerId,
      created_by_name: report.createdBy,
      is_favorite: Boolean(report.isFavorite),
      last_run_at: report.lastRunAt ? new Date(report.lastRunAt).toISOString() : null,
      created_at: report.createdAt ? new Date(report.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  })

  if (savedReportRows.length) {
    const { error: savedReportError } = await supabase.from("saved_reports").upsert(savedReportRows, { onConflict: "id" })
    if (savedReportError) {
      throw savedReportError
    }
  }

  const pinnedReportRows = (reportCenterModule.pinnedReports ?? []).map(report => ({
    id: `rp-${report.id}`,
    profile_id: currentUser.id,
    organization_id: "org-northstar",
    report_id: null,
    report_key: `builtin:${report.id}`,
    name: report.name,
    type: report.type,
    href: report.href,
    source: "builtin",
    last_run_at: report.lastRunAt ? new Date(report.lastRunAt).toISOString() : null,
    is_pinned: Boolean(report.isPinned),
    created_at: new Date().toISOString(),
  }))

  if (pinnedReportRows.length) {
    const { error: pinError } = await supabase.from("report_pins").upsert(pinnedReportRows, { onConflict: "profile_id,report_key" })
    if (pinError) {
      throw pinError
    }
  }

  const reportActivityRows = (reportCenterModule.recentReports ?? []).map(report => ({
    id: `ra-${report.id}`,
    profile_id: currentUser.id,
    organization_id: "org-northstar",
    report_id: null,
    report_key: inferBuiltInReportKey(report.href),
    name: report.name,
    type: report.type,
    href: report.href,
    activity_type: "view",
    actor_name: currentUser.displayName ?? `${currentUser.firstName} ${currentUser.lastName}`.trim(),
    duration_ms: 2100,
    metadata: serializeForDatabase(report),
    created_at: report.viewedAt ? new Date(report.viewedAt).toISOString() : new Date().toISOString(),
  }))

  if (reportActivityRows.length) {
    const { error: reportActivityError } = await supabase.from("report_activity").upsert(reportActivityRows, { onConflict: "id" })
    if (reportActivityError) {
      throw reportActivityError
    }
  }
}

async function main() {
  await syncDatasets()
  await syncProfilesAndMemberships()
  await syncNotificationsAndActivity()
  await syncReportMetadata()
  console.log("Supabase runtime datasets, profiles, memberships, preferences, notifications, and report metadata synced.")
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
