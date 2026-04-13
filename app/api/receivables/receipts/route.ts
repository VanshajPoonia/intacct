import { NextRequest, NextResponse } from "next/server"
import type { FinanceFilters, SortConfig } from "@/lib/types"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { getSupabaseReceipts } from "@/lib/supabase/receivables"

export const dynamic = "force-dynamic"

function parseFilters(request: NextRequest): FinanceFilters | undefined {
  const entityId = request.nextUrl.searchParams.get("entityId") ?? undefined
  const customerId = request.nextUrl.searchParams.get("customerId") ?? undefined
  const dateStart = request.nextUrl.searchParams.get("dateStart")
  const dateEnd = request.nextUrl.searchParams.get("dateEnd")
  const preset = request.nextUrl.searchParams.get("datePreset") ?? undefined

  if (!dateStart || !dateEnd) {
    return entityId || customerId
      ? {
          entityId,
          customerId,
          dateRange: {
            startDate: new Date("2000-01-01T00:00:00.000Z"),
            endDate: new Date("2100-01-01T00:00:00.000Z"),
          },
        }
      : undefined
  }

  return {
    entityId,
    customerId,
    dateRange: {
      startDate: new Date(dateStart),
      endDate: new Date(dateEnd),
      preset: preset as FinanceFilters["dateRange"]["preset"],
    },
  }
}

function parseSort(request: NextRequest): SortConfig | undefined {
  const key = request.nextUrl.searchParams.get("sortKey")
  const direction = request.nextUrl.searchParams.get("sortDirection")

  if (!key || (direction !== "asc" && direction !== "desc")) {
    return undefined
  }

  return { key, direction }
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 })
  }

  try {
    const search = request.nextUrl.searchParams.get("search") ?? undefined
    const statuses = request.nextUrl.searchParams.getAll("status")
    const methods = request.nextUrl.searchParams.getAll("method")
    const page = Number(request.nextUrl.searchParams.get("page") ?? "1")
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "10")

    const receipts = await getSupabaseReceipts(
      parseFilters(request),
      search,
      statuses.length ? statuses : undefined,
      methods.length ? methods : undefined,
      parseSort(request),
      Number.isFinite(page) ? page : 1,
      Number.isFinite(pageSize) ? pageSize : 10
    )

    return NextResponse.json(receipts)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load receipts from Supabase.",
      },
      { status: 500 }
    )
  }
}
