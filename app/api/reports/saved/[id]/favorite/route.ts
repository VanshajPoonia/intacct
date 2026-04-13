import { NextRequest, NextResponse } from "next/server"
import { toggleSavedReportFavorite } from "@/lib/supabase/report-metadata"
import { requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"

export const dynamic = "force-dynamic"

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedAppUser()
  const { id } = await context.params
  const data = await toggleSavedReportFavorite(user, id)

  if (!data) {
    return NextResponse.json({ error: "Saved report not found." }, { status: 404 })
  }

  return NextResponse.json({ data })
}
