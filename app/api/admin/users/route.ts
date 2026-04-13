import { NextRequest, NextResponse } from "next/server"
import { createManagedUser, listManagedUsers } from "@/lib/supabase/admin-users"
import { requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const actor = await requireAuthenticatedAppUser()
    const { searchParams } = new URL(request.url)

    const response = await listManagedUsers(actor, {
      search: searchParams.get("search") ?? undefined,
      organizationId: searchParams.get("organizationId") ?? undefined,
      roleId: searchParams.get("roleId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      entityId: searchParams.get("entityId") ?? undefined,
      sortKey: searchParams.get("sortKey") ?? undefined,
      sortDirection: (searchParams.get("sortDirection") as "asc" | "desc" | null) ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
    })

    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load users."
    const status = message.toLowerCase().includes("permission") ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAuthenticatedAppUser()
    const body = await request.json()
    const record = await createManagedUser(actor, body)
    return NextResponse.json({ success: true, user: record })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create the user."
    const status = message.toLowerCase().includes("permission") ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
