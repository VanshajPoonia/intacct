import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseSecretKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env"

export const dynamic = "force-dynamic"

function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function listUsersByEmail(email: string) {
  const admin = createAdminClient()
  let page = 1

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) {
      throw error
    }

    const match = data.users.find(user => user.email?.toLowerCase() === email.toLowerCase())
    if (match) {
      return match
    }

    if (data.users.length < 200) {
      break
    }

    page += 1
  }

  return null
}

async function ensureBootstrapAdmin() {
  const admin = createAdminClient()

  await admin.from("profiles").upsert(
    {
      id: "u-admin",
      organization_id: "org-admin",
      email: "admin@platform.financeos.local",
      auth_email: "admin@platform.financeos.local",
      username: "admin",
      first_name: "Platform",
      last_name: "Admin",
      display_name: "Platform Admin",
      title: "Global Administrator",
      role_id: "admin",
      status: "active",
      is_global_admin: true,
      default_entity_id: "e4",
    },
    { onConflict: "id" }
  )

  await admin.from("organization_memberships").upsert(
    {
      profile_id: "u-admin",
      organization_id: "org-admin",
      role_id: "admin",
    },
    { onConflict: "profile_id,organization_id" }
  )

  const existingUser = await listUsersByEmail("admin@platform.financeos.local")
  if (existingUser) {
    await admin.from("profiles").update({ auth_user_id: existingUser.id }).eq("id", "u-admin")
    return
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: "admin@platform.financeos.local",
    password: "kvadmin123",
    email_confirm: true,
    user_metadata: {
      organization: "admin",
      username: "admin",
      isGlobalAdmin: true,
    },
  })

  if (error) {
    throw error
  }

  await admin.from("profiles").update({ auth_user_id: data.user.id }).eq("id", "u-admin")
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 })
  }

  try {
    const body = (await request.json()) as {
      organization?: string
      username?: string
      password?: string
    }

    const organizationSlug = body.organization?.trim().toLowerCase()
    const username = body.username?.trim().toLowerCase()
    const password = body.password ?? ""

    if (!organizationSlug || !username || !password) {
      return NextResponse.json({ error: "Organization, username, and password are required." }, { status: 400 })
    }

    if (organizationSlug === "admin" && username === "admin") {
      await ensureBootstrapAdmin()
    }

    const admin = createAdminClient()
    const { data: organization, error: organizationError } = await admin
      .from("organizations")
      .select("id, slug")
      .eq("slug", organizationSlug)
      .maybeSingle()

    if (organizationError) {
      throw organizationError
    }

    if (!organization) {
      return NextResponse.json({ error: "Invalid organization, username, or password." }, { status: 401 })
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, auth_email, status")
      .eq("organization_id", organization.id)
      .eq("username", username)
      .maybeSingle()

    if (profileError) {
      throw profileError
    }

    if (!profile?.auth_email || profile.status !== "active") {
      return NextResponse.json({ error: "Invalid organization, username, or password." }, { status: 401 })
    }

    const supabase = await createSupabaseServerClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.auth_email,
      password,
    })

    if (signInError) {
      return NextResponse.json({ error: "Invalid organization, username, or password." }, { status: 401 })
    }

    await admin
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", profile.id)

    await admin.from("audit_logs").upsert({
      id: `audit-login-${profile.id}-${Date.now()}`,
      organization_id: organization.id,
      actor_profile_id: profile.id,
      target_profile_id: profile.id,
      action: "login",
      entity_type: "profile",
      entity_id: profile.id,
      details: { organizationSlug, username },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sign in." },
      { status: 500 }
    )
  }
}
