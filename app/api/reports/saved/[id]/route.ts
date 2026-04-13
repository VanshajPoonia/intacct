import { NextRequest, NextResponse } from "next/server"
import { deleteSavedReport, getSavedReport } from "@/lib/supabase/report-metadata"
import { requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"

export const dynamic = "force-dynamic"

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedAppUser()
  const { id } = await context.params
  const data = await getSavedReport(user, id)
  return NextResponse.json({ data })
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedAppUser()
  const { id } = await context.params
  await deleteSavedReport(user, id)
  return NextResponse.json({ success: true })
}
