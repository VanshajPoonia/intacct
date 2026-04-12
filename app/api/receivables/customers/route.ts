import { NextRequest, NextResponse } from "next/server"
import type { SortConfig } from "@/lib/types"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { getSupabaseCustomers } from "@/lib/supabase/receivables"

export const dynamic = "force-dynamic"

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
    const page = Number(request.nextUrl.searchParams.get("page") ?? "1")
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "10")

    const customers = await getSupabaseCustomers(
      search,
      statuses.length ? statuses : undefined,
      parseSort(request),
      Number.isFinite(page) ? page : 1,
      Number.isFinite(pageSize) ? pageSize : 10
    )

    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load customers from Supabase.",
      },
      { status: 500 }
    )
  }
}
