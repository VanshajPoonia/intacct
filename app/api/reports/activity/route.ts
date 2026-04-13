import { NextRequest, NextResponse } from "next/server"
import { listRecentReports, listReportRunHistory, recordReportActivity } from "@/lib/supabase/report-metadata"
import { requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const user = await requireAuthenticatedAppUser()
  const kind = request.nextUrl.searchParams.get("kind") ?? "recent"

  if (kind === "history") {
    const reportId = request.nextUrl.searchParams.get("reportId")
    if (!reportId) {
      return NextResponse.json({ error: "reportId is required." }, { status: 400 })
    }

    const data = await listReportRunHistory(user, reportId)
    return NextResponse.json({ data })
  }

  const data = await listRecentReports(user)
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
    activityType: "view" | "run" | "pin"
    durationMs?: number
    metadata?: Record<string, unknown>
  }

  await recordReportActivity(user, {
    ...payload,
    actorName: `${user.firstName} ${user.lastName}`.trim() || user.email,
  })

  return NextResponse.json({ success: true })
}
