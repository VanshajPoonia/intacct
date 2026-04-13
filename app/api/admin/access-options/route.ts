import { NextResponse } from "next/server"
import { getUserAccessOptionsForActor } from "@/lib/supabase/admin-users"
import { requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const actor = await requireAuthenticatedAppUser()
    const options = await getUserAccessOptionsForActor(actor)
    return NextResponse.json(options)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load access options."
    const status = message.toLowerCase().includes("permission") ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
