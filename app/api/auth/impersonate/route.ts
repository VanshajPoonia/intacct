import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createImpersonationCookieValue, getImpersonationCookieName, requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"
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

export async function POST(request: NextRequest) {
  const actor = await requireAuthenticatedAppUser()
  if (!actor.isGlobalAdmin) {
    return NextResponse.json({ error: "Global admin access is required." }, { status: 403 })
  }

  const body = (await request.json()) as { profileId?: string }
  if (!body.profileId) {
    return NextResponse.json({ error: "A target profile is required." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: targetProfile, error: targetProfileError } = await admin
    .from("profiles")
    .select("id, status, is_global_admin")
    .eq("id", body.profileId)
    .maybeSingle()

  if (targetProfileError) {
    return NextResponse.json({ error: targetProfileError.message }, { status: 500 })
  }

  if (!targetProfile || targetProfile.status !== "active" || targetProfile.is_global_admin) {
    return NextResponse.json({ error: "The selected user cannot be impersonated." }, { status: 400 })
  }

  const cookieValue = await createImpersonationCookieValue(body.profileId)

  await admin.from("audit_logs").upsert({
    id: `audit-impersonate-${actor.id}-${body.profileId}-${Date.now()}`,
    organization_id: actor.organizationId,
    actor_profile_id: actor.id,
    target_profile_id: body.profileId,
    action: "impersonate.start",
    entity_type: "profile",
    entity_id: body.profileId,
    details: { actorEmail: actor.email, actorUsername: actor.username },
    created_at: new Date().toISOString(),
  })

  const response = NextResponse.json({ success: true })
  response.cookies.set(getImpersonationCookieName(), cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  })

  return response
}
