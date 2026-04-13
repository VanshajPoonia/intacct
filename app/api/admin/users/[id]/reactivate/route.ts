import { NextResponse } from "next/server"
import { reactivateManagedUser } from "@/lib/supabase/admin-users"
import { requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const actor = await requireAuthenticatedAppUser()
    const { id } = await context.params
    await reactivateManagedUser(actor, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reactivate the user."
    const status = message.toLowerCase().includes("permission") ? 403 : message.toLowerCase().includes("not found") ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
