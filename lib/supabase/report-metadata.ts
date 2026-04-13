import { randomUUID } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import type { AuthUser, PinnedReport, RecentReport, ReportRunHistoryItem, SavedReport, SavedReportType } from "@/lib/types"
import { getSupabaseSecretKey, getSupabaseUrl } from "./env"

type SavedReportRow = {
  id: string
  profile_id: string
  organization_id: string
  name: string
  description: string | null
  category: string | null
  type: SavedReportType
  filters: Record<string, unknown>
  columns: string[]
  group_by: string | null
  sort_by: string | null
  created_by: string
  created_by_name: string
  is_favorite: boolean
  last_run_at: string | null
  created_at: string
  updated_at: string | null
}

type ReportPinRow = {
  id: string
  profile_id: string
  organization_id: string
  report_id: string | null
  report_key: string
  name: string
  type: string
  href: string
  source: "builtin" | "saved"
  last_run_at: string | null
  is_pinned: boolean
  created_at: string
}

type ReportActivityRow = {
  id: string
  profile_id: string
  organization_id: string
  report_id: string | null
  report_key: string
  name: string
  type: string
  href: string
  activity_type: "view" | "run" | "pin"
  actor_name: string
  duration_ms: number | null
  metadata: Record<string, unknown> | null
  created_at: string
}

type ReportPinInput = {
  reportId?: string
  reportKey: string
  name: string
  type: string
  href: string
  source: "builtin" | "saved"
  lastRunAt?: string | null
}

type ReportActivityInput = {
  reportId?: string
  reportKey: string
  name: string
  type: string
  href: string
  activityType: "view" | "run" | "pin"
  actorName: string
  durationMs?: number | null
  metadata?: Record<string, unknown>
}

function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function serialize(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_key, current) => {
      if (current instanceof Date) {
        return current.toISOString()
      }
      return current
    })
  )
}

function buildSavedReportKey(reportId: string) {
  return `saved:${reportId}`
}

function buildActorName(user: AuthUser) {
  return `${user.firstName} ${user.lastName}`.trim() || user.email
}

function normalizeSavedReport(row: SavedReportRow): SavedReport {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
    type: row.type,
    filters: row.filters,
    columns: row.columns,
    groupBy: row.group_by ?? undefined,
    sortBy: row.sort_by ?? undefined,
    createdBy: row.created_by_name,
    createdAt: new Date(row.created_at),
    lastRunAt: row.last_run_at ? new Date(row.last_run_at) : undefined,
    isFavorite: row.is_favorite,
  }
}

function normalizePinnedReport(row: ReportPinRow): PinnedReport {
  return {
    id: row.report_id ?? row.report_key,
    name: row.name,
    type: row.type,
    href: row.href,
    lastRunAt: row.last_run_at ? new Date(row.last_run_at) : undefined,
    isPinned: row.is_pinned,
  }
}

function normalizeRecentReport(row: ReportActivityRow): RecentReport {
  return {
    id: row.report_id ?? row.report_key,
    name: row.name,
    type: row.type,
    href: row.href,
    viewedAt: new Date(row.created_at),
  }
}

export async function listSavedReports(user: AuthUser) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("saved_reports")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(row => normalizeSavedReport(row as SavedReportRow))
}

export async function getSavedReport(user: AuthUser, reportId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("saved_reports")
    .select("*")
    .eq("profile_id", user.id)
    .eq("id", reportId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? normalizeSavedReport(data as SavedReportRow) : null
}

export async function upsertSavedReport(
  user: AuthUser,
  payload: Partial<SavedReport> & Pick<SavedReport, "name" | "type" | "filters" | "columns">
) {
  const admin = createAdminClient()
  const now = new Date().toISOString()
  const reportId = typeof payload.id === "string" ? payload.id : `sr-${Date.now().toString(36)}`
  const createdAt =
    payload.createdAt instanceof Date
      ? payload.createdAt.toISOString()
      : typeof payload.createdAt === "string"
        ? new Date(payload.createdAt).toISOString()
        : now
  const lastRunAt =
    payload.lastRunAt instanceof Date
      ? payload.lastRunAt.toISOString()
      : typeof payload.lastRunAt === "string"
        ? new Date(payload.lastRunAt).toISOString()
        : null
  const row = {
    id: reportId,
    profile_id: user.id,
    organization_id: user.organizationId,
    name: payload.name,
    description: payload.description ?? null,
    category: payload.category ?? null,
    type: payload.type,
    filters: serialize(payload.filters ?? {}),
    columns: serialize(payload.columns ?? []),
    group_by: payload.groupBy ?? null,
    sort_by: payload.sortBy ?? null,
    created_by: user.id,
    created_by_name: buildActorName(user),
    is_favorite: Boolean(payload.isFavorite),
    last_run_at: lastRunAt,
    created_at: createdAt,
    updated_at: now,
  }

  const { data, error } = await admin
    .from("saved_reports")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single()

  if (error) {
    throw error
  }

  return normalizeSavedReport(data as SavedReportRow)
}

export async function deleteSavedReport(user: AuthUser, reportId: string) {
  const admin = createAdminClient()
  const { error } = await admin.from("saved_reports").delete().eq("profile_id", user.id).eq("id", reportId)
  if (error) {
    throw error
  }
}

export async function toggleSavedReportFavorite(user: AuthUser, reportId: string) {
  const admin = createAdminClient()
  const current = await getSavedReport(user, reportId)
  if (!current) {
    return null
  }

  const { data, error } = await admin
    .from("saved_reports")
    .update({
      is_favorite: !current.isFavorite,
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", user.id)
    .eq("id", reportId)
    .select("*")
    .single()

  if (error) {
    throw error
  }

  return normalizeSavedReport(data as SavedReportRow)
}

export async function listPinnedReports(user: AuthUser) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("report_pins")
    .select("*")
    .eq("profile_id", user.id)
    .eq("is_pinned", true)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(row => normalizePinnedReport(row as ReportPinRow))
}

export async function toggleReportPin(user: AuthUser, payload: ReportPinInput) {
  const admin = createAdminClient()
  const { data: current, error: currentError } = await admin
    .from("report_pins")
    .select("*")
    .eq("profile_id", user.id)
    .eq("report_key", payload.reportKey)
    .maybeSingle()

  if (currentError) {
    throw currentError
  }

  const nextPinned = !(current as ReportPinRow | null)?.is_pinned
  const row = {
    id: (current as ReportPinRow | null)?.id ?? `rp-${randomUUID()}`,
    profile_id: user.id,
    organization_id: user.organizationId,
    report_id: payload.reportId ?? null,
    report_key: payload.reportKey,
    name: payload.name,
    type: payload.type,
    href: payload.href,
    source: payload.source,
    last_run_at: payload.lastRunAt ?? null,
    is_pinned: nextPinned,
    created_at: (current as ReportPinRow | null)?.created_at ?? new Date().toISOString(),
  }

  const { data, error } = await admin
    .from("report_pins")
    .upsert(row, { onConflict: "profile_id,report_key" })
    .select("*")
    .single()

  if (error) {
    throw error
  }

  return {
    pinned: nextPinned,
    report: normalizePinnedReport(data as ReportPinRow),
  }
}

export async function listRecentReports(user: AuthUser, limit = 5) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("report_activity")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit * 10)

  if (error) {
    throw error
  }

  const unique = new Map<string, RecentReport>()
  for (const row of (data ?? []) as ReportActivityRow[]) {
    if (!unique.has(row.report_key)) {
      unique.set(row.report_key, normalizeRecentReport(row))
    }
    if (unique.size >= limit) {
      break
    }
  }

  return [...unique.values()]
}

export async function listReportRunHistory(user: AuthUser, reportId: string, limit = 3): Promise<ReportRunHistoryItem[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("report_activity")
    .select("*")
    .eq("profile_id", user.id)
    .eq("report_id", reportId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return ((data ?? []) as ReportActivityRow[]).map(row => ({
    id: row.id,
    date: new Date(row.created_at),
    user: row.actor_name,
    duration: row.duration_ms ? `${(row.duration_ms / 1000).toFixed(1)}s` : "2.0s",
  }))
}

export async function recordReportActivity(user: AuthUser, payload: ReportActivityInput) {
  const admin = createAdminClient()
  const createdAt = new Date().toISOString()
  const row = {
    id: `ra-${randomUUID()}`,
    profile_id: user.id,
    organization_id: user.organizationId,
    report_id: payload.reportId ?? null,
    report_key: payload.reportKey,
    name: payload.name,
    type: payload.type,
    href: payload.href,
    activity_type: payload.activityType,
    actor_name: payload.actorName,
    duration_ms: payload.durationMs ?? null,
    metadata: payload.metadata ? serialize(payload.metadata) : null,
    created_at: createdAt,
  }

  const { error } = await admin.from("report_activity").insert(row)
  if (error) {
    throw error
  }

  if (payload.activityType === "view" || payload.activityType === "run") {
    if (payload.reportId) {
      const { error: savedReportError } = await admin
        .from("saved_reports")
        .update({ last_run_at: createdAt, updated_at: createdAt })
        .eq("profile_id", user.id)
        .eq("id", payload.reportId)

      if (savedReportError) {
        throw savedReportError
      }
    }

    const { error: pinError } = await admin
      .from("report_pins")
      .update({ last_run_at: createdAt })
      .eq("profile_id", user.id)
      .eq("report_key", payload.reportKey)

    if (pinError) {
      throw pinError
    }
  }
}

export function getSavedReportKey(reportId: string) {
  return buildSavedReportKey(reportId)
}
