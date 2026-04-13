import { fetchInternalApi } from "./internal-api"

export type RuntimeDatasetDomain =
  | "aggregate"
  | "identity"
  | "shell"
  | "organization"
  | "accounting"
  | "payables"
  | "receivables"
  | "workflow"
  | "work_queue"
  | "reporting"
  | "planning"
  | "fixed_assets"
  | "contracts_revenue"
  | "platform"
  | "platform_overviews"

type RuntimeDatasetResponse<T> = {
  domain: RuntimeDatasetDomain
  payload: T
  updatedAt: string
}

type CacheEntry = {
  promise: Promise<unknown>
  expiresAt: number
}

const CACHE_TTL_MS = 5_000
const datasetCache = new Map<string, CacheEntry>()

function looksLikeIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
}

function hydrateDates<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => hydrateDates(item)) as T
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, current]) => [
      key,
      hydrateDates(current),
    ])

    return Object.fromEntries(entries) as T
  }

  if (typeof value === "string" && looksLikeIsoDate(value)) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date as T
    }
  }

  return value
}

export async function getRuntimeDataset<T>(domain: RuntimeDatasetDomain): Promise<T> {
  const now = Date.now()
  const cached = datasetCache.get(domain)

  if (cached && cached.expiresAt > now) {
    return cached.promise as Promise<T>
  }

  const promise = fetchInternalApi<RuntimeDatasetResponse<T>>(`/api/runtime/datasets/${domain}`).then(response =>
    hydrateDates(response.payload)
  )

  datasetCache.set(domain, {
    promise,
    expiresAt: now + CACHE_TTL_MS,
  })

  return promise
}

export function invalidateRuntimeDataset(domain?: RuntimeDatasetDomain) {
  if (!domain) {
    datasetCache.clear()
    return
  }

  datasetCache.delete(domain)
}

export async function updateRuntimeDataset<T>(domain: RuntimeDatasetDomain, payload: T): Promise<T> {
  const response = await fetchInternalApi<RuntimeDatasetResponse<T>>(`/api/runtime/datasets/${domain}`, {
    method: "PUT",
    body: JSON.stringify({ payload }),
  })

  invalidateRuntimeDataset(domain)
  return hydrateDates(response.payload)
}
