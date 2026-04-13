import { NextResponse } from "next/server"
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

export async function GET() {
  const user = await requireAuthenticatedAppUser()
  const admin = createAdminClient()
  const { count, error } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .eq("read", false)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ unreadCount: count ?? 0 })
}
