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

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedAppUser()
  const { id } = await context.params
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("saved_views")
    .select("*")
    .eq("id", id)
    .eq("profile_id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedAppUser()
  const { id } = await context.params
  const payload = (await request.json()) as Record<string, unknown>
  const admin = createAdminClient()

  const { data: current } = await admin
    .from("saved_views")
    .select("*")
    .eq("id", id)
    .eq("profile_id", user.id)
    .maybeSingle()

  if (!current) {
    return NextResponse.json({ error: "Saved view not found." }, { status: 404 })
  }

  const nextModule = typeof payload.module === "string" ? payload.module : current.module
  const nextIsDefault = payload.isDefault === undefined ? current.is_default : Boolean(payload.isDefault)

  if (nextIsDefault) {
    await admin
      .from("saved_views")
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq("profile_id", user.id)
      .eq("module", nextModule)
  }

  const { data, error } = await admin
    .from("saved_views")
    .update({
      name: typeof payload.name === "string" ? payload.name : current.name,
      module: nextModule,
      filters: payload.filters ?? current.filters,
      columns: payload.columns ?? current.columns,
      sort_by: typeof payload.sortBy === "string" ? payload.sortBy : current.sort_by,
      sort_direction:
        payload.sortDirection === "asc" || payload.sortDirection === "desc" ? payload.sortDirection : current.sort_direction,
      is_default: nextIsDefault,
      role_scope: Array.isArray(payload.roleScope)
        ? payload.roleScope.join(",")
        : typeof payload.roleScope === "string"
          ? payload.roleScope
          : current.role_scope,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("profile_id", user.id)
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedAppUser()
  const { id } = await context.params
  const admin = createAdminClient()

  const { error } = await admin.from("saved_views").delete().eq("id", id).eq("profile_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
