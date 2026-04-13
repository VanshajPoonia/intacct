import { NextRequest, NextResponse } from "next/server"
import { listUsersForActor } from "@/lib/supabase/admin-users"
import { requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const actor = await requireAuthenticatedAppUser()
    const { searchParams } = new URL(request.url)

    const response = await listUsersForActor(actor, {
      search: searchParams.get("search") ?? undefined,
      roleId: searchParams.get("role") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      entityId: searchParams.get("entityId") ?? undefined,
      organizationId: searchParams.get("organizationId") ?? undefined,
      sortKey: searchParams.get("sortKey") ?? undefined,
      sortDirection: (searchParams.get("sortDirection") as "asc" | "desc" | null) ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
    })

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load users." },
      { status: 500 }
    )
  }
}
