import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseSecretKey, getSupabaseUrl } from "@/lib/supabase/env"
import { getUserPreferences, requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"
import type { UserPreferences } from "@/lib/types"

export const dynamic = "force-dynamic"

function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET() {
  const user = await requireAuthenticatedAppUser()
  const preferences = await getUserPreferences(user.id, user.primaryEntityId)
  return NextResponse.json({ preferences })
}

export async function PATCH(request: NextRequest) {
  const user = await requireAuthenticatedAppUser()
  const updates = (await request.json()) as Partial<UserPreferences>
  const current = await getUserPreferences(user.id, user.primaryEntityId)

  const nextPreferences: UserPreferences = {
    ...current,
    ...updates,
    notifications: {
      ...current.notifications,
      ...updates.notifications,
    },
  }

  const admin = createAdminClient()
  const { error } = await admin.from("user_preferences").upsert(
    {
      profile_id: user.id,
      theme: nextPreferences.theme,
      default_role_id: nextPreferences.defaultRole ?? null,
      default_entity_id: nextPreferences.defaultEntity,
      default_date_range: nextPreferences.defaultDateRange,
      sidebar_collapsed: nextPreferences.sidebarCollapsed,
      notifications: nextPreferences.notifications,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id" }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, preferences: nextPreferences })
}

export async function DELETE() {
  const user = await requireAuthenticatedAppUser()
  const admin = createAdminClient()
  const { error } = await admin.from("user_preferences").delete().eq("profile_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const preferences = await getUserPreferences(user.id, user.primaryEntityId)
  return NextResponse.json({ success: true, preferences })
}
