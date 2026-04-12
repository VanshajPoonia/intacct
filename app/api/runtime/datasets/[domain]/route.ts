import { NextRequest, NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import { requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"
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

function checksum(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

function canMutateRuntimeDatasets(roleIds: string[], isGlobalAdmin: boolean) {
  return isGlobalAdmin || roleIds.includes("admin") || roleIds.includes("controller")
}

export async function GET(_request: NextRequest, context: { params: Promise<{ domain: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 })
  }

  try {
    await requireAuthenticatedAppUser()
    const { domain } = await context.params

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("runtime_datasets")
      .select("domain, payload, updated_at")
      .eq("domain", domain)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return NextResponse.json({ error: `Runtime dataset '${domain}' was not found.` }, { status: 404 })
    }

    return NextResponse.json({
      domain: data.domain,
      payload: data.payload,
      updatedAt: data.updated_at,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load runtime dataset." },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ domain: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 })
  }

  try {
    const user = await requireAuthenticatedAppUser()

    if (!canMutateRuntimeDatasets(user.roleIds, user.isGlobalAdmin)) {
      return NextResponse.json({ error: "Insufficient access to update runtime datasets." }, { status: 403 })
    }

    const { domain } = await context.params
    const body = (await request.json()) as { payload?: unknown }

    if (body.payload === undefined) {
      return NextResponse.json({ error: "A payload is required." }, { status: 400 })
    }

    const admin = createAdminClient()
    const updatedAt = new Date().toISOString()
    const { data, error } = await admin
      .from("runtime_datasets")
      .upsert(
        {
          domain,
          payload: body.payload,
          checksum: checksum(body.payload),
          updated_at: updatedAt,
        },
        { onConflict: "domain" }
      )
      .select("domain, payload, updated_at")
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return NextResponse.json({ error: `Runtime dataset '${domain}' was not updated.` }, { status: 500 })
    }

    return NextResponse.json({
      domain: data.domain,
      payload: data.payload,
      updatedAt: data.updated_at,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update runtime dataset." },
      { status: 500 }
    )
  }
}
