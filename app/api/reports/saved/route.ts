import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"
import { listSavedReports, upsertSavedReport } from "@/lib/supabase/report-metadata"
import type { SavedReport } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await requireAuthenticatedAppUser()
  const data = await listSavedReports(user)
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const user = await requireAuthenticatedAppUser()
  const payload = (await request.json()) as Partial<SavedReport> & Pick<SavedReport, "name" | "type" | "filters" | "columns">
  const data = await upsertSavedReport(user, payload)
  return NextResponse.json({ data })
}
