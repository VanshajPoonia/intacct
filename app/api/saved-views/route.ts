import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"
import { getSupabaseSecretKey, getSupabaseUrl } from "@/lib/supabase/env"

export const dynamic = "force-dynamic"

function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET(request: NextRequest) {
  const user = await requireAuthenticatedAppUser()
  const moduleId = request.nextUrl.searchParams.get("module") ?? undefined
  const admin = createAdminClient()

  let query = admin.from("saved_views").select("*").eq("profile_id", user.id).order("created_at", { ascending: false })
  if (moduleId) {
    query = query.eq("module", moduleId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const user = await requireAuthenticatedAppUser()
  const payload = (await request.json()) as Record<string, unknown>
  const admin = createAdminClient()

  const viewId = typeof payload.id === "string" ? payload.id : `sv-${Date.now().toString(36)}`
  const view = {
    id: viewId,
    profile_id: user.id,
    module: String(payload.module),
    name: String(payload.name),
    filters: payload.filters ?? {},
    columns: payload.columns ?? null,
    sort_by: typeof payload.sortBy === "string" ? payload.sortBy : null,
    sort_direction: payload.sortDirection === "asc" || payload.sortDirection === "desc" ? payload.sortDirection : null,
    is_default: Boolean(payload.isDefault),
    role_scope: Array.isArray(payload.roleScope)
      ? payload.roleScope.join(",")
      : typeof payload.roleScope === "string"
        ? payload.roleScope
        : null,
    created_by: user.id,
    created_at: typeof payload.createdAt === "string" ? payload.createdAt : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (view.is_default) {
    await admin
      .from("saved_views")
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq("profile_id", user.id)
      .eq("module", view.module)
  }

  const { data, error } = await admin.from("saved_views").upsert(view, { onConflict: "id" }).select("*").single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
