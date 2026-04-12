import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getImpersonationCookieName, requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"
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

export async function POST() {
  const actor = await requireAuthenticatedAppUser()
  const admin = createAdminClient()

  await admin.from("audit_logs").upsert({
    id: `audit-impersonate-stop-${actor.id}-${Date.now()}`,
    organization_id: actor.organizationId,
    actor_profile_id: actor.impersonation?.actorProfileId ?? actor.id,
    target_profile_id: actor.id,
    action: "impersonate.stop",
    entity_type: "profile",
    entity_id: actor.id,
    details: { actorEmail: actor.impersonation?.actorEmail ?? actor.email },
    created_at: new Date().toISOString(),
  })

  const response = NextResponse.json({ success: true })
  response.cookies.set(getImpersonationCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  })

  return response
}
