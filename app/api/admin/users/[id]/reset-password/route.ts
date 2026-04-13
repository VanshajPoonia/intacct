import { NextRequest, NextResponse } from "next/server"
import { resetManagedUserPassword } from "@/lib/supabase/admin-users"
import { requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const actor = await requireAuthenticatedAppUser()
    const { id } = await context.params
    const body = (await request.json()) as { password?: string }

    await resetManagedUserPassword(actor, id, body.password ?? "")
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reset the password."
    const status = message.toLowerCase().includes("permission") ? 403 : message.toLowerCase().includes("not found") ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
