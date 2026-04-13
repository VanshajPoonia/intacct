import { NextRequest, NextResponse } from "next/server"
import { listPinnedReports, toggleReportPin } from "@/lib/supabase/report-metadata"
import { requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await requireAuthenticatedAppUser()
  const data = await listPinnedReports(user)
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const user = await requireAuthenticatedAppUser()
  const payload = (await request.json()) as {
    reportId?: string
    reportKey: string
    name: string
    type: string
    href: string
    source: "builtin" | "saved"
    lastRunAt?: string | null
  }

  const result = await toggleReportPin(user, payload)
  return NextResponse.json(result)
}
