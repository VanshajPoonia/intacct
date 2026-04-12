function normalizeBaseUrl(raw?: string) {
  if (!raw) {
    return ""
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/$/, "")
  }

  return `https://${raw.replace(/\/$/, "")}`
}

function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    return ""
  }

  return (
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeBaseUrl(process.env.VERCEL_URL) ||
    "http://127.0.0.1:3000"
  )
}

export function shouldUseSupabaseDataSource() {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase"
}

export async function fetchInternalApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new InternalApiError(errorText || `Request failed with status ${response.status}`, response.status)
  }

  return response.json() as Promise<T>
}
export class InternalApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "InternalApiError"
    this.status = status
  }
}
