import type { AuditLogEntry, PaginatedResponse } from "@/lib/types"
import { fetchInternalApi } from "./internal-api"

type SerializedAuditLogEntry = Omit<AuditLogEntry, "timestamp"> & {
  timestamp: string
}

function hydrateAuditLog(entry: SerializedAuditLogEntry): AuditLogEntry {
  return {
    ...entry,
    timestamp: new Date(entry.timestamp),
  }
}

export async function getAuditLogs(
  entityType?: string,
  entityId?: string,
  startDate?: Date,
  endDate?: Date,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<AuditLogEntry>> {
  const searchParams = new URLSearchParams()

  if (entityType) {
    searchParams.set("entityType", entityType)
  }

  if (entityId) {
    searchParams.set("entityId", entityId)
  }

  if (startDate) {
    searchParams.set("startDate", startDate.toISOString())
  }

  if (endDate) {
    searchParams.set("endDate", endDate.toISOString())
  }

  searchParams.set("page", String(page))
  searchParams.set("pageSize", String(pageSize))

  const response = await fetchInternalApi<PaginatedResponse<SerializedAuditLogEntry>>(
    `/api/audit?${searchParams.toString()}`
  )

  return {
    ...response,
    data: response.data.map(hydrateAuditLog),
  }
}
