import type { PinnedReport, RecentReport, ReportRunHistoryItem, SavedReport } from "@/lib/types"
import { fetchInternalApi } from "./internal-api"

type SavedReportRow = {
  id: string
  name: string
  description?: string | null
  category?: string | null
  type: SavedReport["type"]
  filters: SavedReport["filters"]
  columns: string[]
  groupBy?: string | null
  sortBy?: string | null
  createdBy: string
  createdAt: string
  lastRunAt?: string | null
  isFavorite: boolean
}

type RecentReportRow = {
  id: string
  name: string
  type: string
  href: string
  viewedAt: string
}

type PinnedReportRow = {
  id: string
  name: string
  type: string
  href: string
  lastRunAt?: string | null
  isPinned: boolean
}

type ReportRunHistoryRow = {
  id: string
  date: string
  user: string
  duration: string
}

function looksLikeIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
}

function hydrateDates<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => hydrateDates(item)) as T
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, current]) => [key, hydrateDates(current)])
    ) as T
  }

  if (typeof value === "string" && looksLikeIsoDate(value)) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date as T
    }
  }

  return value
}

function normalizeSavedReport(row: SavedReportRow): SavedReport {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
    type: row.type,
    filters: hydrateDates(row.filters),
    columns: row.columns,
    groupBy: row.groupBy ?? undefined,
    sortBy: row.sortBy ?? undefined,
    createdBy: row.createdBy,
    createdAt: new Date(row.createdAt),
    lastRunAt: row.lastRunAt ? new Date(row.lastRunAt) : undefined,
    isFavorite: row.isFavorite,
  }
}

export async function getSavedReports(): Promise<SavedReport[]> {
  const response = await fetchInternalApi<{ data: SavedReportRow[] }>("/api/reports/saved")
  return response.data.map(normalizeSavedReport)
}

export async function getSavedReportById(id: string): Promise<SavedReport | null> {
  const response = await fetchInternalApi<{ data: SavedReportRow | null }>(`/api/reports/saved/${id}`)
  return response.data ? normalizeSavedReport(response.data) : null
}

export async function saveReport(
  report: Partial<SavedReport> & Pick<SavedReport, "name" | "type" | "filters" | "columns">
): Promise<{ success: boolean; report?: SavedReport }> {
  const response = await fetchInternalApi<{ data: SavedReportRow }>("/api/reports/saved", {
    method: "POST",
    body: JSON.stringify(report),
  })

  return { success: true, report: normalizeSavedReport(response.data) }
}

export async function deleteReport(id: string): Promise<{ success: boolean }> {
  await fetchInternalApi<{ success: boolean }>(`/api/reports/saved/${id}`, {
    method: "DELETE",
  })

  return { success: true }
}

export async function toggleReportFavorite(id: string): Promise<{ success: boolean }> {
  await fetchInternalApi<{ data: SavedReportRow }>(`/api/reports/saved/${id}/favorite`, {
    method: "POST",
  })

  return { success: true }
}

export async function getRecentReports(): Promise<RecentReport[]> {
  const response = await fetchInternalApi<{ data: RecentReportRow[] }>("/api/reports/activity?kind=recent")
  return response.data.map(row => ({
    id: row.id,
    name: row.name,
    type: row.type,
    href: row.href,
    viewedAt: new Date(row.viewedAt),
  }))
}

export async function getPinnedReports(): Promise<PinnedReport[]> {
  const response = await fetchInternalApi<{ data: PinnedReportRow[] }>("/api/reports/pins")
  return response.data.map(row => ({
    id: row.id,
    name: row.name,
    type: row.type,
    href: row.href,
    lastRunAt: row.lastRunAt ? new Date(row.lastRunAt) : undefined,
    isPinned: row.isPinned,
  }))
}

export async function toggleReportPin(
  payload: {
    reportId?: string
    reportKey: string
    name: string
    type: string
    href: string
    source: "builtin" | "saved"
    lastRunAt?: Date
  }
): Promise<{ success: boolean }> {
  await fetchInternalApi<{ pinned: boolean }>("/api/reports/pins", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      lastRunAt: payload.lastRunAt?.toISOString(),
    }),
  })

  return { success: true }
}

export async function getReportRunHistory(reportId: string): Promise<ReportRunHistoryItem[]> {
  const response = await fetchInternalApi<{ data: ReportRunHistoryRow[] }>(
    `/api/reports/activity?kind=history&reportId=${encodeURIComponent(reportId)}`
  )

  return response.data.map(row => ({
    id: row.id,
    date: new Date(row.date),
    user: row.user,
    duration: row.duration,
  }))
}

export async function recordReportActivity(
  payload: {
    reportId?: string
    reportKey: string
    name: string
    type: string
    href: string
    activityType: "view" | "run" | "pin"
    durationMs?: number
    metadata?: Record<string, unknown>
  }
): Promise<{ success: boolean }> {
  await fetchInternalApi<{ success: boolean }>("/api/reports/activity", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return { success: true }
}
