import { NextRequest, NextResponse } from "next/server"
import { getManagedUserDetail, updateManagedUser } from "@/lib/supabase/admin-users"
import { requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const actor = await requireAuthenticatedAppUser()
    const { id } = await context.params
    const detail = await getManagedUserDetail(actor, id)
    return NextResponse.json(detail)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load the user."
    const status = message.toLowerCase().includes("permission") ? 403 : message.toLowerCase().includes("not found") ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const actor = await requireAuthenticatedAppUser()
    const { id } = await context.params
    const body = await request.json()
    const detail = await updateManagedUser(actor, id, body)
    return NextResponse.json({ success: true, user: detail })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update the user."
    const status = message.toLowerCase().includes("permission") ? 403 : message.toLowerCase().includes("not found") ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
