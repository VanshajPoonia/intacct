import { NextRequest, NextResponse } from "next/server"
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
